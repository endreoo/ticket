import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ticketsRouter } from './routes/tickets';
import { hotelsRouter } from './routes/hotels';
import { contactsRouter } from './routes/contacts';
import { guestsRouter } from './routes/guests';
import { bookingsRouter } from './routes/bookings';
import { authRouter } from './routes/auth';
import { EmailService } from './services/emailService';

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://37.27.56.102:5080', 'http://localhost:5080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/tickets', ticketsRouter);
app.use('/hotels', hotelsRouter);
app.use('/contacts', contactsRouter);
app.use('/guests', guestsRouter);
app.use('/bookings', bookingsRouter);
app.use('/auth', authRouter);

const port = process.env.PORT || 5181;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Initialize email service
const emailService = new EmailService();
emailService.startEmailService().catch(error => {
  console.error('Failed to start email service:', error);
});