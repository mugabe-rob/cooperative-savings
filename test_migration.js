const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'vsla_user',
            password: process.env.DB_PASSWORD || 'vsla123',
            database: process.env.DB_NAME || 'savings_app',
            multipleStatements: true
        });

        console.log('Connected to database for migration...');

        // Read migration file
        const migrationPath = path.join(__dirname, 'database', 'migration_urs_enhancements.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration...');
        
        // Execute migration
        await connection.execute(migrationSQL);
        
        console.log('✅ Migration completed successfully!');
        
        // Close connection
        await connection.end();
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
