import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

// ----------------------------------------------------
// Basic Express setup
// ----------------------------------------------------
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// Logger middleware (required for CW1)
// ----------------------------------------------------
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// ----------------------------------------------------
// Static files middleware for lesson images
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// ----------------------------------------------------
// MongoDB Atlas connection
// ----------------------------------------------------
const uri =
  'mongodb+srv://Edwas:5NBNYbBM4sYc02NX@cluster0.3ohe6lz.mongodb.net/afterSchoolDB?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(uri);

let lessonCollection;
let orderCollection;

async function startServer() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db('afterSchoolDB');

    lessonCollection = db.collection('lesson');
    orderCollection = db.collection('order');

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// ----------------------------------------------------
// Routes
// ----------------------------------------------------

// Simple health check
app.get('/', (req, res) => {
  res.json({ message: 'Backend API working' });
});

// ------------------------------------------
// GET all lessons
// ------------------------------------------
app.get('/lessons', async (req, res) => {
  try {
    const docs = await lessonCollection.find().toArray();

    const lessons = docs.map(doc => ({
      id: doc._id.toString(),
      topic: doc.topic,
      location: doc.location,
      price: doc.price,
      space: doc.space,
    }));

    res.json(lessons);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// ------------------------------------------
// CREATE a new lesson
// ------------------------------------------
app.post('/lessons', async (req, res) => {
  const { topic, location, price, space } = req.body;

  if (!topic || !location || !price || space == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await lessonCollection.insertOne({
      topic,
      location,
      price,
      space,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error inserting lesson:', err);
    res.status(500).json({ error: 'Failed to insert lesson' });
  }
});

// ------------------------------------------
// CREATE an order
// ------------------------------------------
app.post('/orders', async (req, res) => {
  const orderData = req.body;

  try {
    const result = await orderCollection.insertOne(orderData);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ------------------------------------------
// UPDATE lesson space count
// ------------------------------------------
app.put('/lessons/:id', async (req, res) => {
  const id = req.params.id;
  const { space } = req.body;

  if (space == null) {
    return res.status(400).json({ error: 'space is required' });
  }

  try {
    const result = await lessonCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { space } }
    );

    res.json(result);
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// ------------------------------------------
// SEARCH lessons (GET /search?q=...)
// ------------------------------------------
app.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();

  try {
    // If no query text, return all lessons
    if (!q) {
      const docs = await lessonCollection.find().toArray();
      return res.json(
        docs.map(doc => ({
          id: doc._id.toString(),
          topic: doc.topic,
          location: doc.location,
          price: doc.price,
          space: doc.space,
        }))
      );
    }

    const regex = new RegExp(q, 'i');
    const num = Number(q);
    const numericConditions = Number.isNaN(num)
      ? []
      : [{ price: num }, { space: num }];

    const filter = {
      $or: [
        { topic: regex },
        { location: regex },
        ...numericConditions,
      ],
    };

    const docs = await lessonCollection.find(filter).toArray();

    const lessons = docs.map(doc => ({
      id: doc._id.toString(),
      topic: doc.topic,
      location: doc.location,
      price: doc.price,
      space: doc.space,
    }));

    res.json(lessons);
  } catch (err) {
    console.error('Error searching lessons:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});
