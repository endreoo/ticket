import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
import { authenticateToken } from '../middleware/auth';

interface Ticket extends RowDataPacket {
  id: number;
  subject: string;
  message: string;
  from_email: string;
  status: string;
  created_at: Date;
  email_raw?: string;
}

const router = Router();

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
      `SELECT id, subject, message, from_email, status, created_at, email_raw 
       FROM tickets ${whereClause} 
       ORDER BY created_at DESC 
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

export default router;