const { Sequelize } = require('sequelize');

// Ensure environment variables are loaded
require('./dotenv')();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Set to true for SQL logging
  }
);

const connectDB = async () => {
  try {
    console.log('🔍 Database connection details:');
    console.log(`   DB_NAME: ${process.env.DB_NAME}`);
    console.log(`   DB_USER: ${process.env.DB_USER}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}`);
    
    await sequelize.authenticate();
    console.log('✅ MySQL connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.log('🔄 Server will continue without database connection');
    console.log('📝 Please check your database credentials in .env file:');
    console.log(`   - DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   - DB_USER: ${process.env.DB_USER}`);
    console.log(`   - DB_NAME: ${process.env.DB_NAME}`);
    console.log(`   - DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'NOT SET'}`);
    return false;
  }
};

module.exports = { sequelize, connectDB };
