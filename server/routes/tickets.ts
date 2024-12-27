import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [tickets] = await pool.execute(
      'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { title, description, priority, booking_id } = req.body;

  try {
    const [result] = await pool.execute(
      'INSERT INTO tickets (id, title, description, priority, booking_id, user_id) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [title, description, priority, booking_id, req.user.id]
    );
    
    const [ticket] = await pool.execute(
      'SELECT * FROM tickets WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(ticket[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export const ticketsRouter = router;