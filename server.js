import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // allows JSON body parsing

// In-memory lessons (we will move this to MongoDB later)
let lessons = [
  {
    id: 1,
    topic: 'Math Fundamentals',
    location: 'Hendon',
    price: 100,
    space: 5
  },
  {
    id: 2,
    topic: 'JavaScript Basics',
    location: 'Online',
    price: 80,
    space: 8
  },
  {
    id: 3,
    topic: 'Vue.js Components',
    location: 'Colindale',
    price: 90,
    space: 4
  },
  {
    id: 4,
    topic: 'Python for Data',
    location: 'Hendon',
    price: 110,
    space: 6
  },
  {
    id: 5,
    topic: 'Web Design',
    location: 'Brent Cross',
    price: 70,
    space: 10
  },
  {
    id: 6,
    topic: 'Robotics Club',
    location: 'Hendon',
    price: 95,
    space: 3
  },
  {
    id: 7,
    topic: 'Game Development',
    location: 'Online',
    price: 120,
    space: 2
  },
  {
    id: 8,
    topic: 'Creative Writing',
    location: 'Golders Green',
    price: 60,
    space: 7
  },
  {
    id: 9,
    topic: 'Science Experiments',
    location: 'Hendon',
    price: 85,
    space: 9
  },
  {
    id: 10,
    topic: 'Art & Drawing',
    location: 'Colindale',
    price: 75,
    space: 5
  }
];

// Health/root route (just for checking)
app.get('/', (req, res) => {
  res.json({ message: 'Backend API working' });
});

// GET /lessons – return all lessons
app.get('/lessons', (req, res) => {
  res.json(lessons);
});

// POST /lessons – add a new lesson
app.post('/lessons', (req, res) => {
  const { topic, location, price, space } = req.body;

  // Basic validation
  if (!topic || !location || price == null || space == null) {
    return res.status(400).json({
      error: 'topic, location, price and space are required'
    });
  }

  const nextId =
    lessons.length > 0 ? Math.max(...lessons.map(l => l.id)) + 1 : 1;

  const newLesson = {
    id: nextId,
    topic,
    location,
    price: Number(price),
    space: Number(space)
  };

  lessons.push(newLesson);
  res.status(201).json(newLesson);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
