import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './src/server/routes/authRoutes';
import examRoutes from './src/server/routes/examRoutes';
import financeRoutes, { handleStripeWebhook } from './src/server/routes/financeRoutes';
import ptaRoutes from './src/server/routes/ptaRoutes';
import studentRoutes from './src/server/routes/studentRoutes';
import attendanceRoutes from './src/server/routes/attendanceRoutes';
import adminRoutes from './src/server/routes/adminRoutes';
import aiRoutes from './src/server/routes/aiRoutes';

dotenv.config();

const app = express();

// 1. Stripe webhook requires raw Buffer for cryptographic signature verification
app.post(
  '/api/finance/stripe-webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// 2. Standard JSON body parser for all other REST APIs
app.use(express.json());

// 3. Mount secure, rate-limited and tenant-scoped API routes
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/pta', ptaRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.SERVER_PORT || 3001;
if (process.env.NODE_ENV !== 'test' && !process.env.IS_TEST_RUN) {
  app.listen(PORT, () => {
    console.log(`Secure School Management API Server running on port ${PORT}`);
  });
}

export default app;
