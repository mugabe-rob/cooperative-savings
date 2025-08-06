const express = require('express');

// Initialize app
const app = express();

// Basic middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'VSLA API is running 🚀' });
});

// Try importing routes one by one
try {
  const authRoutes = require('./src/routes/auth.routes');
  app.use('/api/auth', authRoutes);
  console.log('✓ Auth routes loaded');
} catch (error) {
  console.log('✗ Auth routes failed:', error.message);
}

try {
  const userRoutes = require('./src/routes/user.routes');
  app.use('/api/users', userRoutes);
  console.log('✓ User routes loaded');
} catch (error) {
  console.log('✗ User routes failed:', error.message);
}

try {
  const groupRoutes = require('./src/routes/group.routes');
  app.use('/api/groups', groupRoutes);
  console.log('✓ Group routes loaded');
} catch (error) {
  console.log('✗ Group routes failed:', error.message);
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VSLA server running on port ${PORT}`);
});
