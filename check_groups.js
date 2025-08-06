const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkGroups() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'vsla_user',
            password: process.env.DB_PASSWORD || 'vsla123',
            database: process.env.DB_NAME || 'savings_app'
        });

        console.log('📋 Groups table structure:');
        const [columns] = await connection.execute('DESCRIBE groups');
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key} ${col.Default || ''}`);
        });
        
        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkGroups();
