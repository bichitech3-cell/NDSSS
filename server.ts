import express from 'express';
import { authenticate } from './src/server/middleware/auth';
import examRoutes from './src/server/routes/examRoutes';
import financeRoutes from './src/server/routes/financeRoutes';
import ptaRoutes from './src/server/routes/ptaRoutes';
import studentRoutes from './src/server/routes/studentRoutes';
import attendanceRoutes from './src/server/routes/attendanceRoutes';
import adminRoutes from './src/server/routes/adminRoutes';

const app = express();
app.use(express.json());

app.use('/api/exam', examRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/pta', ptaRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
