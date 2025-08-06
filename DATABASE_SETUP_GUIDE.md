# MySQL Database Connection Setup Guide

## Problem
The current MySQL root user credentials are not working. We need to either:
1. Find the correct root password, OR
2. Create a new MySQL user for this project

## Solution 1: Create New MySQL User (Recommended)

### Step 1: Open MySQL Workbench or Command Line
Connect to MySQL using any method that works (MySQL Workbench, phpMyAdmin, etc.)

### Step 2: Run the User Creation Script
Execute the SQL commands from `database/create-mysql-user.sql`:

```sql
CREATE USER IF NOT EXISTS 'vsla_user'@'localhost' IDENTIFIED BY 'vsla_password_2024';
GRANT ALL PRIVILEGES ON savings_app.* TO 'vsla_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3: Update .env File
Change your .env file to use the new user:

```
DB_USER=vsla_user
DB_PASSWORD=vsla_password_2024
```

## Solution 2: Find Correct Root Password

### Common MySQL Root Passwords to Try:
- Empty password: `DB_PASSWORD=`
- Same as username: `DB_PASSWORD=root`
- Simple passwords: `DB_PASSWORD=admin` or `DB_PASSWORD=123456`

### How to Reset MySQL Root Password:
1. Stop MySQL service
2. Start MySQL with `--skip-grant-tables`
3. Connect and run: `ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';`
4. Restart MySQL normally

## Solution 3: Check Existing Connection

### If you can connect via MySQL Workbench:
1. Check the connection details in Workbench
2. Copy the exact username, password, and host
3. Update your .env file with those details

## Testing Your Fix

After updating credentials, run:
```bash
node test-db.js
```

This will test the connection and show you if it's working.

## Current Status
- Database `savings_app` exists ✅
- Tables are created ✅  
- Connection credentials need fixing ❌
- Server is running but can't connect to DB ⚠️

Once the database connection is fixed, your VSLA API will be fully operational!
