import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

let lessons = [
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

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend API working' });
});

// Get all lessons
app.get('/lessons', (req, res) => {
  res.json(lessons);
});

// Add a new lesson
app.post('/lessons', (req, res) => {
  const { title, description, date } = req.body;

  if (!title || !description || !date) {
    return res.status(400).json({
      error: 'title, description and date are required'
    });
  }

  const nextId =
    lessons.length > 0 ? Math.max(...lessons.map((l) => l.id)) + 1 : 1;

  const newLesson = {
    id: nextId,
    title,
    description,
    date
  };

  lessons.push(newLesson);

  res.status(201).json(newLesson);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
