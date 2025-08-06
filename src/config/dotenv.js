const dotenv = require('dotenv');

const loadEnv = () => {
  dotenv.config();
  const requiredVars = ['PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'JWT_SECRET'];
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

module.exports = loadEnv;
