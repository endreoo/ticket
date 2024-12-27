import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { guest_name, check_in, check_out, room_type } = req.body;

  try {
    const [result] = await pool.execute(
      'INSERT INTO bookings (id, guest_name, check_in, check_out, room_type, user_id) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [guest_name, check_in, check_out, room_type, req.user.id]
    );
    
    const [booking] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(booking[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export const bookingsRouter = router;