import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Request } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: number;
  };
}

interface Ticket extends RowDataPacket {
  id: number;
  subject: string;
  message: string;
  from_email?: string;
  status: string;
  priority?: string;
  hotel_id?: number;
  category: string;
  email_raw?: string;
  created_at: Date;
  updated_at: Date;
  ai_classification?: string;
  ai_confidence?: number;
  needs_human_review?: boolean;
}

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  console.log('Received GET /tickets request');
  
  try {
    const { type, status, hotel_id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    console.log('Query parameters:', { type, status, hotel_id, page, limit });
    
    // First, get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM tickets WHERE 1=1';
    const countParams: any[] = [];

    if (type) {
      countQuery += ' AND category = ?';
      countParams.push(type);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (hotel_id) {
      countQuery += ' AND hotel_id = ?';
      countParams.push(hotel_id);
    }

    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countParams);
    const total = countResult[0].total;
    
    // Main query with pagination
    let query = `
      SELECT 
        t.id,
        t.subject,
        t.message,
        t.from_email,
        t.status,
        t.priority,
        t.hotel_id,
        t.category,
        t.email_raw,
        t.created_at,
        t.updated_at,
        t.ai_classification,
        t.ai_confidence,
        t.needs_human_review,
        h.name as hotel_name,
        c.first_name as contact_first_name,
        c.last_name as contact_last_name
      FROM tickets t
      LEFT JOIN hotels h ON t.hotel_id = h.id
      LEFT JOIN contacts c ON t.contact_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type) {
      query += ' AND t.category = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (hotel_id) {
      query += ' AND t.hotel_id = ?';
      params.push(hotel_id);
    }

    query += ` ORDER BY t.created_at ASC LIMIT ${limit} OFFSET ${offset}`;
    params.push();

    console.log('Executing query:', query);
    console.log('Query parameters:', params);
    
    const [tickets] = await pool.execute<Ticket[]>(query, params);
    console.log(`Found ${tickets.length} tickets`);
    
    // Transform email tickets to include parsed data
    const transformedTickets = tickets.map((ticket: Ticket) => {
      if (ticket.email_raw) {
        try {
          const emailData = JSON.parse(ticket.email_raw);
          return {
            ...ticket,
            has_attachments: emailData.attachments?.length > 0,
            html_content: emailData.html,
            email_raw: undefined // Don't send raw data to frontend
          };
        } catch (e) {
          console.error('Error parsing email_raw for ticket:', ticket.id, e);
          return {
            ...ticket,
            email_raw: undefined
          };
        }
      }
      return ticket;
    });

    // Send response with pagination metadata
    res.json({
      tickets: transformedTickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /tickets:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { subject, description, priority, hotel_id, category = 'manual' } = req.body;

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO tickets 
       (subject, message, priority, hotel_id, category, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [subject, description, priority, hotel_id, category, 'open']
    );
    
    const [tickets] = await pool.execute<Ticket[]>(
      'SELECT * FROM tickets WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(tickets[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add endpoint to get email attachments
router.get('/:id/attachments', authenticateToken, async (req, res) => {
  try {
    const [tickets] = await pool.execute<Ticket[]>(
      'SELECT email_raw FROM tickets WHERE id = ?',
      [req.params.id]
    );

    if (!tickets.length || !tickets[0].email_raw) {
      return res.status(404).json({ message: 'No attachments found' });
    }

    const emailData = JSON.parse(tickets[0].email_raw);
    res.json(emailData.attachments || []);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export const ticketsRouter = router;