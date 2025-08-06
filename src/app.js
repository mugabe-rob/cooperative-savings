const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const loadEnv = require('./config/dotenv');
const { connectDB } = require('./config/database');

// Middleware
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const authMiddleware = require('./middlewares/auth.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const contributionRoutes = require('./routes/contribution.routes');
const loanRoutes = require('./routes/loan.routes');
const reportRoutes = require('./routes/report.routes');

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
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
// app.use('/api/contributions', contributionRoutes);
// app.use('/api/loans', loanRoutes);
// app.use('/api/reports', reportRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then((dbConnected) => {
  app.listen(PORT, () => {
    console.log(`🚀 Golden Nest VSLA API Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`🔧 Available endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Users: http://localhost:${PORT}/api/users`);
    console.log(`   - Groups: http://localhost:${PORT}/api/groups`);
    console.log(`   - Contributions: http://localhost:${PORT}/api/contributions`);
    console.log(`   - Loans: http://localhost:${PORT}/api/loans`);
    console.log(`   - Reports: http://localhost:${PORT}/api/reports`);
  });
});
