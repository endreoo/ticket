import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password: string;
  job_title?: string;
  role?: string;
  is_approved?: number;
}

const router = Router();

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1');
    res.json({ success: true, rows });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// Test route to generate hash
router.get('/test-hash', async (req, res) => {
  try {
    const hash = await bcrypt.hash('test', 10);
    res.json({ hash });
  } catch (error) {
    console.error('Hash error:', error);
    res.status(500).json({ message: 'Hash error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password });

  try {
    // Try to find user by email or username
    const [users] = await pool.execute<User[]>(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, email]
    );
    console.log('Found users:', users.length);

    const user = users[0];
    if (!user) {
      console.log('No user found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', { 
      id: user.id, 
      email: user.email,
      username: user.username,
      is_approved: user.is_approved,
      passwordHash: user.password 
    });

    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password check:', { isValid: isValidPassword, password, hash: user.password });

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (bcryptError) {
      console.error('bcrypt error:', bcryptError);
      return res.status(500).json({ message: 'Error validating credentials' });
    }

    if (user.is_approved !== 1) {
      console.log('User not approved');
      return res.status(403).json({ message: 'Account not approved' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        job_title: user.job_title,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export const authRouter = router;