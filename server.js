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
// Static files (for lesson images)
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// ----------------------------------------------------
// MongoDB Atlas Connection
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

// Root test
app.get('/', (req, res) => {
  res.json({ message: 'Backend API working' });
});

// ----------------------------------------------------
// GET ALL LESSONS
// ----------------------------------------------------
app.get('/lessons', async (req, res) => {
  try {
    const docs = await lessonCollection.find().toArray();

    const lessons = docs.map((doc) => ({
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

// ----------------------------------------------------
// CREATE LESSON
// ----------------------------------------------------
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

// ----------------------------------------------------
// CREATE ORDER (high-marks version)
// 1. Validate
// 2. Check stock
// 3. Insert order
// 4. Bulk update spaces
// ----------------------------------------------------
app.post('/orders', async (req, res) => {
  const { name, phone, items } = req.body;

  if (!name || !phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'name, phone and items[] are required',
    });
  }

  try {
    // Build map: lessonId -> quantity requested
    const qtyMap = new Map();
    for (const it of items) {
      const id = it.lessonId;
      const qty = Number(it.quantity) || 0;

      if (!id || qty <= 0) continue;
      qtyMap.set(id, (qtyMap.get(id) || 0) + qty);
    }

    if (qtyMap.size === 0) {
      return res.status(400).json({ error: 'No valid lesson quantities found' });
    }

    // Fetch all relevant lessons
    const ids = [...qtyMap.keys()].map((id) => new ObjectId(id));
    const lessons = await lessonCollection
      .find({ _id: { $in: ids } })
      .toArray();

    // Check requested vs available
    for (const lesson of lessons) {
      const requested = qtyMap.get(lesson._id.toString()) || 0;
      if (requested > lesson.space) {
        return res.status(400).json({
          error: `Not enough spaces for ${lesson.topic}. Requested ${requested}, only ${lesson.space} available.`,
        });
      }
    }

    // Insert order document
    const orderDoc = {
      name,
      phone,
      items,
      createdAt: new Date(),
    };

    const orderResult = await orderCollection.insertOne(orderDoc);

    // Bulk update lesson spaces
    const bulkOps = [...qtyMap.entries()].map(([id, qty]) => ({
      updateOne: {
        filter: { _id: new ObjectId(id) },
        update: { $inc: { space: -qty } },
      },
    }));

    await lessonCollection.bulkWrite(bulkOps);

    res.status(201).json({
      message: 'Order created and spaces updated',
      orderId: orderResult.insertedId,
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ----------------------------------------------------
// GET ALL ORDERS (for admin / Postman)
// ----------------------------------------------------
app.get('/orders', async (req, res) => {
  try {
    const docs = await orderCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const orders = docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      phone: doc.phone,
      items: doc.items,
      createdAt: doc.createdAt,
    }));

    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ----------------------------------------------------
// MANUAL UPDATE LESSON SPACE (not used by checkout now,
// but good to keep for testing / coursework)
// ----------------------------------------------------
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

// ----------------------------------------------------
// SEARCH lessons (GET /search?q=...)
// ----------------------------------------------------
app.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();

  try {
    // No query -> return all lessons
    if (!q) {
      const docs = await lessonCollection.find().toArray();
      return res.json(
        docs.map((doc) => ({
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
      $or: [{ topic: regex }, { location: regex }, ...numericConditions],
    };

    const docs = await lessonCollection.find(filter).toArray();

    const lessons = docs.map((doc) => ({
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

// ----------------------------------------------------
// 404 + Global error handler
// ----------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
