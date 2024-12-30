import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Guest extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hotel_id: number;
  contact_id: number;
  created_at: Date;
  updated_at: Date;
}

const router = Router();

// Get all guests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [guests] = await pool.execute<Guest[]>(`
      SELECT g.*, h.name as hotel_name 
      FROM guests g 
      LEFT JOIN hotels h ON g.hotel_id = h.id 
      ORDER BY g.created_at DESC
    `);
    res.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single guest
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [guests] = await pool.execute<Guest[]>(`
      SELECT g.*, h.name as hotel_name 
      FROM guests g 
      LEFT JOIN hotels h ON g.hotel_id = h.id 
      WHERE g.id = ?
    `, [req.params.id]);

    if (!guests.length) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json(guests[0]);
  } catch (error) {
    console.error('Error fetching guest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create guest
router.post('/', authenticateToken, async (req, res) => {
  const { first_name, last_name, email, phone, hotel_id, contact_id } = req.body;

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO guests (first_name, last_name, email, phone, hotel_id, contact_id) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, hotel_id, contact_id]
    );

    const [guests] = await pool.execute<Guest[]>(`
      SELECT g.*, h.name as hotel_name 
      FROM guests g 
      LEFT JOIN hotels h ON g.hotel_id = h.id 
      WHERE g.id = ?
    `, [result.insertId]);

    res.status(201).json(guests[0]);
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update guest
router.put('/:id', authenticateToken, async (req, res) => {
  const { first_name, last_name, email, phone, hotel_id, contact_id } = req.body;

  try {
    await pool.execute(
      'UPDATE guests SET first_name = ?, last_name = ?, email = ?, phone = ?, hotel_id = ?, contact_id = ? WHERE id = ?',
      [first_name, last_name, email, phone, hotel_id, contact_id, req.params.id]
    );

    const [guests] = await pool.execute<Guest[]>(`
      SELECT g.*, h.name as hotel_name 
      FROM guests g 
      LEFT JOIN hotels h ON g.hotel_id = h.id 
      WHERE g.id = ?
    `, [req.params.id]);

    if (!guests.length) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json(guests[0]);
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete guest
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM guests WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export const guestsRouter = router; 