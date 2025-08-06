const express = require('express');
const app = express();

// Test basic express setup
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Test API is running 🚀' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
