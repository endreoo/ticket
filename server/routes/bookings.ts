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

interface Booking extends RowDataPacket {
  id: number;
  guest_name: string;
  check_in: Date;
  check_out: Date;
  room_type: string;
  user_id: number;
  created_at: Date;
}

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [bookings] = await pool.execute<Booking[]>(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_on DESC',
      [req.user?.id]
    );
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { guest_name, check_in, check_out, room_type } = req.body;

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO bookings (guest_name, check_in, check_out, room_type, user_id) VALUES (?, ?, ?, ?, ?)',
      [guest_name, check_in, check_out, room_type, req.user?.id]
    );
    
    const [bookings] = await pool.execute<Booking[]>(
      'SELECT * FROM bookings WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(bookings[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export const bookingsRouter = router;