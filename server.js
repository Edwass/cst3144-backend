import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());           // allow requests from frontend (5173)
app.use(express.json());   // prepare for future POST/PUT

// In-memory lessons data (temporary)
const lessons = [
  {
    id: 1,
    title: 'Intro to JavaScript',
    description: 'Basics of variables, functions and loops',
    date: '2025-12-10'
  },
  {
    id: 2,
    title: 'Vue Components',
    description: 'Understanding props and events',
    date: '2025-12-12'
  }
];

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Backend API working' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lessons list route
app.get('/api/lessons', (req, res) => {
  res.json(lessons);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
