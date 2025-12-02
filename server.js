import express from 'express';

const app = express();

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Backend API working' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
