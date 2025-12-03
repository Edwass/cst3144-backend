import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Create lesson route
app.post('/api/lessons', (req, res) => {
  const { title, description, date } = req.body;

  if (!title || !description || !date) {
    return res.status(400).json({ error: 'title, description and date are required' });
  }

  const newId = lessons.length ? Math.max(...lessons.map(l => l.id)) + 1 : 1;

  const newLesson = {
    id: newId,
    title,
    description,
    date
  };

  lessons.push(newLesson);

  res.status(201).json(newLesson);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
