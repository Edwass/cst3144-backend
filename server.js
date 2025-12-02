import express from 'express';

const app = express();

// Basic route (placeholder)
app.get('/', (req, res) => {
  res.json({ message: 'Backend API working' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
