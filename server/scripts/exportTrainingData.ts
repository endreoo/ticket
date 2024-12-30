import { pool } from '../db';
import * as fs from 'fs';
import * as path from 'path';

interface TrainingTicket {
  id: number;
  subject: string;
  message: string;
  category?: string;
  priority?: string;
  hotel_name?: string;
  from_email: string;
  created_at: string;
  email_raw: string;
}

async function exportTrainingData() {
  try {
    console.log('Starting training data export...');
    
    // Create export directory if it doesn't exist
    const exportDir = path.join(__dirname, '../../bert_training_data');
    await fs.promises.mkdir(exportDir, { recursive: true });

    // Export tickets in batches to manage memory
    const batchSize = 1000;
    let offset = 0;
    let totalExported = 0;
    let currentBatch = 1;

    while (true) {
      console.log(`Processing batch ${currentBatch}...`);
      
      const [tickets] = await pool.execute<any[]>(
        `SELECT t.id, t.subject, t.message, t.category, t.priority, 
                h.name as hotel_name, t.from_email, t.created_at, t.email_raw
         FROM tickets t
         LEFT JOIN hotels h ON t.hotel_id = h.id
         ORDER BY t.id
         LIMIT ? OFFSET ?`,
        [batchSize, offset]
      );

      if (!tickets.length) {
        break;
      }

      // Process each ticket
      const processedTickets = tickets.map((ticket: TrainingTicket) => {
        let emailRaw;
        try {
          emailRaw = JSON.parse(ticket.email_raw);
        } catch (e) {
          emailRaw = { headers: [] };
        }

        // Extract clean text from message
        const cleanMessage = ticket.message
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return {
          id: ticket.id,
          subject: ticket.subject,
          message: cleanMessage,
          category: ticket.category || 'uncategorized',
          priority: ticket.priority || 'medium',
          hotel_name: ticket.hotel_name,
          from_email: ticket.from_email,
          created_at: ticket.created_at,
          headers: emailRaw.headers || []
        };
      });

      // Write batch to file
      const batchFile = path.join(exportDir, `batch_${currentBatch}.json`);
      await fs.promises.writeFile(
        batchFile,
        JSON.stringify(processedTickets, null, 2)
      );

      totalExported += tickets.length;
      offset += batchSize;
      currentBatch++;

      console.log(`Exported ${totalExported} tickets so far...`);
    }

    // Create a metadata file
    const metadata = {
      totalTickets: totalExported,
      batches: currentBatch - 1,
      batchSize,
      exportDate: new Date().toISOString(),
      categories: new Set(tickets.map(t => t.category)).size,
      hotels: new Set(tickets.map(t => t.hotel_name).filter(Boolean)).size
    };

    await fs.promises.writeFile(
      path.join(exportDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('Export completed successfully!');
    console.log('Summary:', metadata);

  } catch (error) {
    console.error('Error exporting training data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  exportTrainingData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Export failed:', error);
      process.exit(1);
    });
} 