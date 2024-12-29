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
    
    const [tickets] = await pool.query(
      `SELECT id, subject, message, from_email, status, created_at, email_raw 
       FROM tickets ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      params
    );

    console.log('Query results:', tickets);

    const total = (countResult as any)[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      tickets,
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