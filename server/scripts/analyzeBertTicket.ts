import { BertService } from '../services/bertService';
import { pool } from '../db';

async function analyzeTicket(ticketId: number) {
  try {
    // Get ticket data from database
    const [tickets] = await pool.execute<any[]>(
      'SELECT * FROM tickets WHERE id = ?',
      [ticketId]
    );

    if (tickets.length === 0) {
      console.error(`No ticket found with ID ${ticketId}`);
      return;
    }

    const ticket = tickets[0];
    console.log('Found ticket:', {
      id: ticket.id,
      subject: ticket.subject,
      from: ticket.from_email
    });

    // Analyze with BERT
    const bertService = new BertService();
    const analysis = await bertService.analyzeTicket(
      ticket.message,
      ticket.subject,
      ticket.from_email
    );

    console.log('\nBERT Analysis Results:');
    console.log(JSON.stringify(analysis, null, 2));

    // Update ticket with new analysis
    await pool.execute(
      `UPDATE tickets SET 
       category = ?,
       priority = ?,
       sentiment = ?,
       extracted_info = ?
       WHERE id = ?`,
      [
        analysis.analysis.category,
        analysis.analysis.category.includes('urgent') ? 'high' : 
        analysis.analysis.category.includes('complaint') ? 'high' :
        analysis.analysis.category.includes('booking') ? 'medium' : 'normal',
        analysis.analysis.sentiment_confidence,
        JSON.stringify(analysis.analysis.booking_info),
        ticketId
      ]
    );

    console.log('\nTicket updated successfully with new analysis.');

  } catch (error) {
    console.error('Error analyzing ticket:', error);
  }
}

// Get ticket ID from command line argument
const ticketId = parseInt(process.argv[2]);
if (!ticketId) {
  console.error('Please provide a ticket ID as argument');
  process.exit(1);
}

analyzeTicket(ticketId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Analysis failed:', error);
    process.exit(1);
  }); 