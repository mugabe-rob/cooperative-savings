const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'vsla_user',
            password: process.env.DB_PASSWORD || 'vsla123',
            database: process.env.DB_NAME || 'savings_app'
        });

        console.log('Connected to database...');

        // Check existing tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\n📋 Existing tables:');
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });

        // Check users table structure
        console.log('\n👤 Users table structure:');
        const [userColumns] = await connection.execute('DESCRIBE users');
        userColumns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key} ${col.Default || ''}`);
        });

        await connection.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
    }
}

checkDatabase();
