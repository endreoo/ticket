import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { Readable, Stream } from 'stream';
import fs from 'fs';
import { BertService } from './bertService';

interface HeaderLine {
  key: string;
  value: string;
}

export class EmailService {
  private imap: Imap;
  private bertService: BertService;
  private lastUID: number = 0;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly FETCH_INTERVAL = 30000; // Check every 30 seconds
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;

  constructor() {
    console.log('Initializing EmailService with config:', {
      user: process.env.EMAIL_USER,
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '993')
    });

    this.imap = new Imap({
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || '',
      host: process.env.EMAIL_HOST || '',
      port: parseInt(process.env.EMAIL_PORT || '993'),
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      keepalive: {
        interval: 30000,     // Increased ping interval to 30 seconds
        idleInterval: 60000, // Reduced idle interval to 1 minute
        forceNoop: true
      },
      authTimeout: 60000,    // Increased auth timeout to 60 seconds
      connTimeout: 60000,    // Increased connection timeout to 60 seconds
      debug: (info: string) => console.log('[IMAP Debug]', info)
    });

    // Add connection state logging
    console.log('IMAP instance created with config:', {
      user: process.env.EMAIL_USER,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      keepaliveInterval: 30000,
      idleInterval: 60000,
      authTimeout: 60000,
      connTimeout: 60000
    });

    console.log('IMAP instance created, setting up event handlers...');
    this.setupImap();
    this.initializeLastUID();
    this.bertService = new BertService();
  }

  private setupImap(): void {
    this.imap.on('ready', () => {
      console.log('IMAP connection ready');
      this.isConnected = true;
      this.openInbox().catch(error => {
        console.error('Error opening inbox:', error);
        // Try to reconnect if inbox open fails
        this.reconnect();
      });
    });

    this.imap.on('error', (err: Error) => {
      console.error('IMAP error:', err);
      this.isConnected = false;
      this.reconnect();
    });

    this.imap.on('end', () => {
      console.log('IMAP connection ended');
      this.isConnected = false;
      this.reconnect();
    });

    console.log('IMAP event handlers set up, attempting initial connection...');
    this.imap.connect();
  }

  private reconnect(): void {
    if (!this.imap.state || this.imap.state === 'disconnected') {
      console.log('Attempting to reconnect...');
      // Exponential backoff: wait longer between each retry
      const backoffTime = Math.min(30000, 5000 * Math.pow(2, this.reconnectAttempts || 0));
      this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
      
      setTimeout(() => {
        console.log(`Reconnecting to IMAP server (attempt ${this.reconnectAttempts})...`);
        try {
          this.imap.connect();
        } catch (error) {
          console.error('Error during reconnect:', error);
        }
      }, backoffTime);
    }
  }

  private async initializeLastUID(): Promise<void> {
    try {
      const [rows] = await pool.execute<any[]>('SELECT MAX(uid) as lastUID FROM tickets');
      if (Array.isArray(rows) && rows[0] && typeof rows[0].lastUID === 'number') {
        this.lastUID = rows[0].lastUID;
        console.log('Initialized last processed UID:', this.lastUID);
      }
    } catch (error) {
      console.error('Error initializing last UID:', error);
    }
  }

  public async processAllEmails(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isConnected) {
          console.log('Not connected, attempting to connect...');
          this.imap.connect();
          resolve();
          return;
        }

        // If connected but inbox not open, open it
        if (this.imap.state === 'authenticated') {
          this.openInbox()
            .then(() => resolve())
            .catch((error) => {
              console.error('Error processing emails:', error);
              resolve(); // Resolve anyway to continue polling
            });
        } else if (this.imap.state === 'selected') {
          // If inbox is already open, fetch new emails directly
          this.fetchNewEmails()
            .then(() => resolve())
            .catch((error) => {
              console.error('Error processing emails:', error);
              resolve(); // Resolve anyway to continue polling
            });
        } else {
          console.log('Invalid IMAP state:', this.imap.state);
          resolve();
        }
      } catch (error) {
        console.error('Error in processAllEmails:', error);
        resolve(); // Resolve anyway to continue polling
      }
    });
  }

  private async openInbox(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, async (err) => {
        if (err) {
          console.error('Error opening inbox:', err);
          reject(err);
          return;
        }
        console.log('Inbox opened successfully');
        
        // After opening inbox, immediately fetch new emails
        try {
          await this.fetchNewEmails();
          resolve();
        } catch (error) {
          console.error('Error fetching emails after opening inbox:', error);
          resolve(); // Resolve anyway to keep the connection alive
        }
      });
    });
  }

  private async fetchNewEmails(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Search for ALL emails after our last UID, not just UNSEEN
        let searchCriteria: any[] = ['ALL'];
        if (this.lastUID > 0) {
          searchCriteria = [
            'ALL',
            ['UID', `${this.lastUID + 1}:*`]
          ];
        }

        console.log('Starting email fetch with criteria:', {
          lastUID: this.lastUID,
          criteria: searchCriteria,
          isConnected: this.isConnected,
          imapState: this.imap.state
        });

        this.imap.search(searchCriteria, async (err: Error | null, uids: number[]) => {
          if (err) {
            console.error('Error searching emails:', err);
            reject(err);
            return;
          }

          console.log('Search results:', {
            foundEmails: uids?.length || 0,
            uids: uids || [],
            firstUID: uids?.[0],
            lastUID: uids?.[uids.length - 1]
          });

          if (!uids || uids.length === 0) {
            console.log('No new emails found');
            resolve();
            return;
          }

          // Process emails in batches of 10
          const batchSize = 10;
          for (let i = 0; i < uids.length; i += batchSize) {
            const batch = uids.slice(i, i + batchSize);
            console.log('Processing batch:', {
              start: i,
              size: batch.length,
              uids: batch
            });

            const f = this.imap.fetch(batch, {
              bodies: '',
              struct: true
            });

            f.on('message', async (msg: Imap.ImapMessage, seqno: number) => {
              const messages: string[] = [];
              
              msg.on('body', (stream: Readable) => {
                let buffer = '';
                stream.on('data', (chunk: Buffer) => {
                  buffer += chunk.toString('utf8');
                });
                stream.once('end', () => {
                  messages.push(buffer);
                });
              });

              msg.once('end', async () => {
                try {
                  await this.processEmail(messages[0], batch[messages.length - 1]);
                  this.lastUID = Math.max(this.lastUID, batch[messages.length - 1]);
                  console.log('Updated lastUID:', this.lastUID);
                } catch (error) {
                  console.error('Error processing email:', error);
                }
              });
            });

            f.once('error', (err: Error) => {
              console.error('Fetch error:', err);
            });

            f.once('end', () => {
              console.log('Finished batch');
            });
          }
          resolve();
        });
      } catch (error) {
        console.error('Error in fetchNewEmails:', error);
        reject(error);
      }
    });
  }

  private async processEmail(rawEmail: string, uid: number): Promise<void> {
    return new Promise((resolve, reject) => {
      simpleParser(rawEmail, async (err: Error | null, parsedEmail: ParsedMail) => {
        if (err) {
          console.error('Error parsing email:', err);
          reject(err);
          return;
        }

        try {
          // Check if message already exists
          const [existingMessages] = await pool.execute<any[]>(
            'SELECT id FROM tickets WHERE message_id = ?',
            [parsedEmail.messageId]
          );

          if (existingMessages.length > 0) {
            console.log(`Message ${parsedEmail.messageId} already exists, skipping`);
            resolve();
            return;
          }

          // Get BERT analysis
          const analysis = await this.bertService.analyzeTicket(
            parsedEmail.text || '',
            parsedEmail.subject || 'No Subject',
            parsedEmail.from?.text || 'unknown@email.com'
          );

          // Prepare email data for storage
          const emailData = {
            messageId: parsedEmail.messageId || `no-id-${Date.now()}`,
            subject: parsedEmail.subject || 'No Subject',
            message: parsedEmail.text || '',
            from_email: parsedEmail.from?.text || 'unknown@email.com',
            status: 'open',
            category: analysis.analysis.category || 'uncategorized',
            priority: analysis.analysis.category?.includes('urgent') ? 'high' : 
                     analysis.analysis.category?.includes('complaint') ? 'high' :
                     analysis.analysis.category?.includes('booking') ? 'medium' : 'normal',
            sentiment: analysis.analysis.sentiment_confidence || 0.5,
            extracted_info: JSON.stringify(analysis.analysis.booking_info || {}),
            email_raw: JSON.stringify({
              html: parsedEmail.html || '',
              text: parsedEmail.text || '',
              subject: parsedEmail.subject || '',
              from: parsedEmail.from || null
            }),
            uid: uid || 0
          };

          // Insert into database
          const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO tickets (
              message_id, subject, message, from_email, status,
              category, priority, sentiment, extracted_info,
              email_raw, uid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              emailData.messageId,
              emailData.subject,
              emailData.message,
              emailData.from_email,
              emailData.status,
              emailData.category,
              emailData.priority,
              emailData.sentiment,
              emailData.extracted_info,
              emailData.email_raw,
              emailData.uid
            ]
          );

          console.log('Email processed and saved:', {
            id: result.insertId,
            messageId: emailData.messageId,
            subject: emailData.subject
          });

          resolve();
        } catch (error) {
          console.error('Error processing parsed email:', error);
          reject(error);
        }
      });
    });
  }

  private fetchMessageBatch(messageIds: number[]): Promise<ParsedMail[]> {
    return new Promise((resolve, reject) => {
      if (!messageIds.length) {
        resolve([]);
        return;
      }

      console.log(`Fetching batch of ${messageIds.length} messages...`);
      const f = this.imap.fetch(messageIds, {
        bodies: '',
        markSeen: false,
        struct: true
      });

      const messages: Array<{ uid: number; message: ParsedMail }> = [];
      let completed = 0;

      f.on('message', (msg, seqno) => {
        let uid: number;
        msg.on('attributes', (attrs) => {
          uid = attrs.uid;
        });

        msg.on('body', (stream: Stream) => {
          const promise = new Promise<ParsedMail>((resolve, reject) => {
            simpleParser(stream, (err: Error | null, parsed: ParsedMail) => {
              if (err) reject(err);
              else resolve(parsed);
            });
          });

          promise
            .then((parsed: ParsedMail) => {
              messages.push({ uid, message: parsed });
              completed++;
              if (completed === messageIds.length) {
                // Sort messages by UID to maintain order
                messages.sort((a, b) => a.uid - b.uid);
                resolve(messages.map(m => m.message));
              }
            })
            .catch((err: Error) => {
              console.error('Error parsing email:', err);
              completed++;
              if (completed === messageIds.length) {
                // Sort messages by UID to maintain order
                messages.sort((a, b) => a.uid - b.uid);
                resolve(messages.map(m => m.message));
              }
            });
        });
      });

      f.once('error', (err: Error) => {
        console.error('Error fetching messages:', err);
        reject(err);
      });

      f.once('end', () => {
        console.log(`Fetch completed for ${messages.length} messages`);
      });
    });
  }

  public startPolling(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Connect immediately
    if (!this.isConnected) {
      this.imap.connect();
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.processAllEmails();
      } catch (error) {
        console.error('Error in polling interval:', error);
      }
    }, this.FETCH_INTERVAL);

    // Initial check
    this.processAllEmails().catch(error => {
      console.error('Error in initial email fetch:', error);
    });
  }

  public stopPolling(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.isConnected) {
      this.imap.end();
    }
  }

  public async startEmailService(): Promise<void> {
    try {
      await this.processAllEmails();
      console.log('Email service started successfully');
    } catch (error) {
      console.error('Failed to start email service:', error);
      throw error;
    }
  }

  // Add this new method to prioritize headers
  private prioritizeHeaders(headers: Array<[string, string | string[] | Date]>): Array<[string, string]> {
    const priorityHeaders = [
      'from', 'to', 'subject', 'date', 
      'message-id', 'in-reply-to', 'references',
      'content-type', 'content-transfer-encoding',
      'return-path', 'received', 'dkim-signature',
      'authentication-results', 'x-spam-status',
      'delivered-to', 'reply-to'
    ];

    // Sort headers so priority ones come first
    return headers.map(([key, value]): [string, string] => [
      key.toString(),
      value instanceof Date ? value.toISOString() :
        Array.isArray(value) ? value.join(', ') :
        value.toString()
    ]).sort((a, b) => {
      const aKey = a[0].toLowerCase();
      const bKey = b[0].toLowerCase();
      const aIndex = priorityHeaders.indexOf(aKey);
      const bIndex = priorityHeaders.indexOf(bKey);
      
      // If both are priority headers, sort by their priority order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only a is priority header, it comes first
      if (aIndex !== -1) {
        return -1;
      }
      // If only b is priority header, it comes first
      if (bIndex !== -1) {
        return 1;
      }
      // If neither are priority headers, maintain original order
      return 0;
    });
  }
} 