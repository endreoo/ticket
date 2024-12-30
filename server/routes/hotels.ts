import express from 'express';
import { pool as db } from '../db';
import { authenticateToken } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader, OkPacket } from 'mysql2';
import { Pool } from 'mysql2/promise';

interface Hotel extends RowDataPacket {
  id: number;
  name: string;
  location: string;
  sub_location?: string;
  bcom_id?: string;
  url?: string;
  review_score?: string;
  number_of_reviews?: number;
  description?: string;
  address?: string;
  google_review_score?: number;
  google_number_of_reviews?: number;
  market?: string;
  segment?: string;
  agreement?: string;
  sales_process?: string;
  Bcom_status?: string;
}

const router = express.Router();

// Get paginated list of hotels
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let query = 'SELECT SQL_CALC_FOUND_ROWS id, name, location, sub_location, address, bcom_id, url, ' +
                'review_score, number_of_reviews, google_review_score, ' +
                'google_number_of_reviews, market, segment, agreement, ' +
                'sales_process, Bcom_status ' +
                'FROM hotels';
    const params: any[] = [];

    if (search) {
      query += ' WHERE name LIKE ? OR location LIKE ? OR address LIKE ? OR market LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const promisePool = (db as unknown as Pool);
    const [hotels] = await promisePool.query<Hotel[]>(query, params);
    const [foundRows] = await promisePool.query('SELECT FOUND_ROWS() as total');
    const total = (foundRows as any)[0].total;

    res.json({
      hotels,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get hotel by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const promisePool = (db as unknown as Pool);
    const [hotels] = await promisePool.query<Hotel[]>('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json(hotels[0]);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new hotel
router.post('/', authenticateToken, async (req, res) => {
  try {
    const promisePool = (db as unknown as Pool);
    const [result] = await promisePool.query<OkPacket>('INSERT INTO hotels SET ?', [req.body]);
    const [newHotel] = await promisePool.query<Hotel[]>('SELECT * FROM hotels WHERE id = ?', [result.insertId]);
    res.status(201).json(newHotel[0]);
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update hotel
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const promisePool = (db as unknown as Pool);
    const [result] = await promisePool.query<OkPacket>(
      'UPDATE hotels SET ? WHERE id = ?',
      [req.body, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    const [updatedHotel] = await promisePool.query<Hotel[]>('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    res.json(updatedHotel[0]);
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export const hotelsRouter = router; 