import { Router } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Contact extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  created_at: Date;
  updated_at: Date;
}

const router = Router();

// Get all contacts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [contacts] = await pool.execute<Contact[]>(
      'SELECT * FROM contacts ORDER BY first_name, last_name'
    );
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single contact
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [contacts] = await pool.execute<Contact[]>(
      'SELECT * FROM contacts WHERE id = ?',
      [req.params.id]
    );

    if (!contacts.length) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contacts[0]);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create contact
router.post('/', authenticateToken, async (req, res) => {
  const { first_name, last_name, email, phone, company, position } = req.body;

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO contacts (first_name, last_name, email, phone, company, position) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, company, position]
    );

    const [contacts] = await pool.execute<Contact[]>(
      'SELECT * FROM contacts WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(contacts[0]);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contact
router.put('/:id', authenticateToken, async (req, res) => {
  const { first_name, last_name, email, phone, company, position } = req.body;

  try {
    await pool.execute(
      'UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, company = ?, position = ? WHERE id = ?',
      [first_name, last_name, email, phone, company, position, req.params.id]
    );

    const [contacts] = await pool.execute<Contact[]>(
      'SELECT * FROM contacts WHERE id = ?',
      [req.params.id]
    );

    if (!contacts.length) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contacts[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete contact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM contacts WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export const contactsRouter = router; 