import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
import { authenticateToken } from '../middleware/auth';
import { BertService } from '../services/bertService';
import { EmailService } from '../services/emailService';
import axios from 'axios';

interface Ticket extends RowDataPacket {
  id: number;
  subject: string;
  message: string;
  from_email: string;
  status: string;
  priority?: string;
  hotel_id?: number;
  category: string;
  created_at: Date;
  message_id?: string;
  email_raw?: string;
  uid?: number;
  sentiment: string;
  extracted_info: string;
  key_phrases: string;
  has_attachments?: boolean;
  hotel_name?: string;
  updated_at?: string;
  bert_processed?: boolean;
}

const router = Router();
const bertService = new BertService();
const emailService = new EmailService();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    console.log('Search query:', search);

    let whereClause = '';
    let params: any[] = [limit, offset];

    if (search) {
      whereClause = 'WHERE subject LIKE ? OR message LIKE ? OR from_email LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset];
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM tickets ${whereClause}`,
      search ? params.slice(0, 3) : []
    );
    
    const [tickets] = await pool.query<Ticket[]>(
      `SELECT 
        t.id, t.subject, t.message, t.from_email, t.status, t.priority,
        t.hotel_id, t.category, t.created_at, t.message_id, t.email_raw,
        t.uid, t.sentiment, t.extracted_info, t.key_phrases,
        t.updated_at, t.bert_processed,
        h.name as hotel_name
       FROM tickets t
       LEFT JOIN hotels h ON t.hotel_id = h.id
       ${whereClause} 
       ORDER BY t.created_at DESC 
       LIMIT ? OFFSET ?`,
      params
    );

    // Process tickets to extract HTML content
    const processedTickets = (tickets as Ticket[]).map(ticket => {
      let htmlContent = null;
      if (ticket.email_raw) {
        try {
          console.log('Processing ticket:', ticket.id);
          // email_raw is already a JSON object from MySQL
          const emailData = typeof ticket.email_raw === 'string' 
            ? JSON.parse(ticket.email_raw)
            : ticket.email_raw;
            
          console.log('Email data:', emailData);
          
          if (emailData.html) {
            console.log('Raw HTML before processing:', emailData.html.substring(0, 100));
            
            // Unescape the HTML content
            htmlContent = emailData.html
              // First, handle escaped quotes and backslashes
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
              // Then handle newlines and spaces
              .replace(/\\n/g, ' ')
              .replace(/\\t/g, ' ')
              .replace(/\\r/g, ' ')
              // Fix broken HTML attributes
              .replace(/=\\"/g, '="')
              .replace(/\\">/g, '">')
              .replace(/([a-zA-Z-]+)=(?!")/g, '$1="')
              .replace(/"\s+(?=[a-zA-Z-]+=)/g, '" ')
              // Fix any remaining escape sequences
              .replace(/\\([^\\])/g, '$1')
              // Aggressive whitespace cleanup
              .replace(/\s+/g, ' ')
              .replace(/>\s+</g, '><')
              .replace(/\s+>/g, '>')
              .replace(/<\s+/g, '<')
              .replace(/>\s+([^<])/g, '>$1')
              .replace(/([^>])\s+</g, '$1<')
              .replace(/\s+([\.,])/g, '$1')
              .trim();

            console.log('Processed HTML:', htmlContent.substring(0, 100));
          }
        } catch (error) {
          console.error('Error processing email_raw for ticket', ticket.id, ':', error);
        }
      }
      
      const processedTicket = {
        ...ticket,
        html_content: htmlContent,
        email_raw: undefined // Remove email_raw from response
      };
      
      console.log('Processed ticket:', {
        id: processedTicket.id,
        hasHtml: !!processedTicket.html_content,
        htmlLength: processedTicket.html_content?.length
      });
      
      return processedTicket;
    });

    console.log('Processed tickets:', processedTickets);

    const total = (countResult as any)[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      tickets: processedTickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error in tickets route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/check-latest', async (req: Request, res: Response) => {
  try {
    const [tickets] = await pool.execute<Ticket[]>(
      'SELECT id, subject, from_email, created_at FROM tickets WHERE id > 92890 ORDER BY id DESC LIMIT 5'
    );
    res.json(tickets);
  } catch (error) {
    console.error('Error checking latest tickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    
    // Get ticket data
    const [tickets] = await pool.execute<any[]>(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];
    
    // Analyze with BERT
    const analysis = await bertService.analyzeTicket(
      ticket.message,
      ticket.subject,
      ticket.from_email || ''
    );

    // Map priority based on category and sentiment
    const priority = analysis.analysis.category.includes('urgent') ? 'high' : 
                    analysis.analysis.category.includes('complaint') ? 'high' :
                    analysis.analysis.category.includes('booking') ? 'medium' : 'normal';

    // Update ticket with analysis results
    await pool.execute(
      `UPDATE tickets SET 
       category = ?,
       priority = ?,
       sentiment = ?,
       extracted_info = ?,
       key_phrases = ?,
       bert_processed = true
       WHERE id = ?`,
      [
        analysis.analysis.category,
        priority,
        analysis.analysis.sentiment_confidence,
        JSON.stringify(analysis.analysis.booking_info || {}),
        JSON.stringify([]), // Currently no key phrases in response
        ticketId
      ]
    );

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing ticket:', error);
    res.status(500).json({ error: 'Failed to analyze ticket' });
  }
});

router.post('/:id/update', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { category, priority, sentiment, extracted_info, key_phrases } = req.body;
    
    // Update ticket with analysis results
    await pool.execute(
      `UPDATE tickets SET 
       category = ?,
       priority = ?,
       sentiment = ?,
       extracted_info = ?,
       key_phrases = ?
       WHERE id = ?`,
      [
        category,
        priority,
        sentiment.toString(),
        JSON.stringify(extracted_info),
        JSON.stringify(key_phrases),
        ticketId
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

router.post('/check-imap', authenticateToken, async (req: Request, res: Response) => {
  try {
    await emailService.processAllEmails();
    res.json({ message: 'Successfully checked for new emails' });
  } catch (error) {
    console.error('Error checking IMAP:', error);
    res.status(500).json({ error: 'Failed to check for new emails' });
  }
});

router.post('/analyze-bert', async (req, res) => {
  try {
    const { subject, body, from_email } = req.body;
    
    // Call BERT API
    const response = await axios.post('http://37.27.142.148:5000/api/process_email', {
      subject,
      body,
      from_email
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling BERT API:', error);
    res.status(500).json({ error: 'Failed to analyze with BERT' });
  }
});

export const ticketsRouter = router;