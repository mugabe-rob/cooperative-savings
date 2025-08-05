const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const loadEnv = require('./config/dotenv');
const { connectDB } = require('./config/db');

// Middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');
const authMiddleware = require('./middleware/auth.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const savingsRoutes = require('./routes/savings.routes');
const transactionsRoutes = require('./routes/transactions.routes');

// Load environment variables
loadEnv();

// Initialize app
const app = express();

// Middleware stack
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// API base route
app.get('/', (req, res) => {
  res.json({ message: 'Golden Nest API is running 🚀' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/savings', authMiddleware, savingsRoutes);
app.use('/api/transactions', authMiddleware, transactionsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
