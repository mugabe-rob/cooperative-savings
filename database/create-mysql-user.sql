-- VSLA Database Setup Script
-- Run this script in MySQL Workbench or command line as root user

-- 1. Create a new user for the VSLA application
CREATE USER IF NOT EXISTS 'vsla_user'@'localhost' IDENTIFIED BY 'vsla_password_2024';

-- 2. Grant all privileges on the savings_app database
GRANT ALL PRIVILEGES ON savings_app.* TO 'vsla_user'@'localhost';

-- 3. Grant some global privileges that might be needed
GRANT CREATE, DROP, REFERENCES ON *.* TO 'vsla_user'@'localhost';

-- 4. Refresh privileges
FLUSH PRIVILEGES;

-- 5. Verify the user was created
SELECT User, Host FROM mysql.user WHERE User = 'vsla_user';

-- 6. Show grants for the new user
SHOW GRANTS FOR 'vsla_user'@'localhost';

-- 7. Test connection by switching to the new user and selecting from savings_app
USE savings_app;
SHOW TABLES;
