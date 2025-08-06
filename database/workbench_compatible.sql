-- ====================================
-- MYSQL WORKBENCH COMPATIBLE VERSION
-- VSLA Database for MySQL Workbench
-- ====================================

-- Create Database
DROP DATABASE IF EXISTS savings_app;
CREATE DATABASE savings_app;
USE savings_app;

-- ====================================
-- 1. USERS TABLE
-- ====================================
CREATE TABLE `Users` (
    id VARCHAR(36) PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    phone VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('member', 'admin') DEFAULT 'member',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ====================================
-- 2. GROUPS TABLE (FIXED FOR WORKBENCH)
-- ====================================
CREATE TABLE `Groups` (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    createdBy VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_groups_created_by (createdBy)
);

-- Add foreign key constraint AFTER both tables exist
ALTER TABLE `Groups` 
ADD CONSTRAINT fk_groups_created_by 
FOREIGN KEY (createdBy) REFERENCES `Users`(id) ON DELETE CASCADE;

-- ====================================
-- 3. USER-GROUP JUNCTION TABLE
-- ====================================
CREATE TABLE `UserGroups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    groupId VARCHAR(36) NOT NULL,
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_group (userId, groupId),
    FOREIGN KEY (userId) REFERENCES `Users`(id) ON DELETE CASCADE,
    FOREIGN KEY (groupId) REFERENCES `Groups`(id) ON DELETE CASCADE
);

-- ====================================
-- 4. CONTRIBUTIONS TABLE
-- ====================================
CREATE TABLE `Contributions` (
    id VARCHAR(36) PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    UserId VARCHAR(36) NOT NULL,
    GroupId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES `Users`(id) ON DELETE CASCADE,
    FOREIGN KEY (GroupId) REFERENCES `Groups`(id) ON DELETE CASCADE
);

-- ====================================
-- 5. LOANS TABLE
-- ====================================
CREATE TABLE `Loans` (
    id VARCHAR(36) PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    interestRate DECIMAL(5,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
    issuedDate DATE,
    dueDate DATE,
    UserId VARCHAR(36) NOT NULL,
    GroupId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES `Users`(id) ON DELETE CASCADE,
    FOREIGN KEY (GroupId) REFERENCES `Groups`(id) ON DELETE CASCADE
);

-- ====================================
-- 6. REPAYMENTS TABLE
-- ====================================
CREATE TABLE `Repayments` (
    id VARCHAR(36) PRIMARY KEY,
    amountPaid DECIMAL(10,2) NOT NULL,
    paidOn DATE NOT NULL,
    LoanId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (LoanId) REFERENCES `Loans`(id) ON DELETE CASCADE
);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================
CREATE INDEX idx_users_phone ON `Users`(phone);
CREATE INDEX idx_users_email ON `Users`(email);
CREATE INDEX idx_groups_name ON `Groups`(name);
CREATE INDEX idx_contributions_date ON `Contributions`(date);
CREATE INDEX idx_contributions_user ON `Contributions`(UserId);
CREATE INDEX idx_contributions_group ON `Contributions`(GroupId);
CREATE INDEX idx_loans_status ON `Loans`(status);
CREATE INDEX idx_loans_user ON `Loans`(UserId);
CREATE INDEX idx_loans_group ON `Loans`(GroupId);
CREATE INDEX idx_repayments_loan ON `Repayments`(LoanId);
CREATE INDEX idx_repayments_date ON `Repayments`(paidOn);

-- ====================================
-- INSERT SAMPLE DATA (with manual UUIDs)
-- ====================================

-- Insert Admin User
INSERT INTO `Users` (id, fullName, phone, email, password, role) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'System Admin', '+250788123456', 'admin@vsla.com', '$2a$10$sample.hashed.password.here', 'admin');

-- Insert Sample Member
INSERT INTO `Users` (id, fullName, phone, email, password, role) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 'John Mugisha', '+250788654321', 'john@example.com', '$2a$10$sample.hashed.password.here', 'member');

-- Insert Sample Groups
INSERT INTO `Groups` (id, name, description, createdBy) VALUES 
('660e8400-e29b-41d4-a716-446655440001', 'Golden Nest VSLA', 'Community savings group for financial empowerment', '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO `Groups` (id, name, description, createdBy) VALUES 
('660e8400-e29b-41d4-a716-446655440002', 'Unity Savings Group', 'Women empowerment savings cooperative', '550e8400-e29b-41d4-a716-446655440001');

-- Add users to groups
INSERT INTO `UserGroups` (userId, groupId) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002');

-- Insert Sample Contributions
INSERT INTO `Contributions` (id, amount, date, UserId, GroupId) VALUES 
('770e8400-e29b-41d4-a716-446655440001', 50000.00, '2025-01-15', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', 75000.00, '2025-01-20', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001');

-- Insert Sample Loan
INSERT INTO `Loans` (id, amount, interestRate, status, issuedDate, dueDate, UserId, GroupId) VALUES 
('880e8400-e29b-41d4-a716-446655440001', 100000.00, 5.0, 'approved', '2025-02-01', '2025-08-01', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001');

-- ====================================
-- VERIFICATION QUERIES
-- ====================================
SELECT 'DATABASE CREATED SUCCESSFULLY!' as Status;
SELECT COUNT(*) as 'Total Tables Created' FROM information_schema.tables WHERE table_schema = 'savings_app';

-- Show all tables
SELECT table_name as 'Created Tables' FROM information_schema.tables WHERE table_schema = 'savings_app' ORDER BY table_name;

-- Show sample data
SELECT '=== USERS ===' as Section;
SELECT id, fullName, phone, role FROM `Users`;

SELECT '=== GROUPS ===' as Section;
SELECT g.id, g.name, g.description, u.fullName as created_by 
FROM `Groups` g 
JOIN `Users` u ON g.createdBy = u.id;

SELECT '=== USER-GROUP MEMBERSHIPS ===' as Section;
SELECT u.fullName as user_name, g.name as group_name, ug.joinedAt
FROM `UserGroups` ug
JOIN `Users` u ON ug.userId = u.id
JOIN `Groups` g ON ug.groupId = g.id;

SELECT '=== CONTRIBUTIONS ===' as Section;
SELECT c.amount, c.date, u.fullName as contributor, g.name as group_name
FROM `Contributions` c
JOIN `Users` u ON c.UserId = u.id
JOIN `Groups` g ON c.GroupId = g.id;

SELECT '=== LOANS ===' as Section;
SELECT l.amount, l.interestRate, l.status, l.issuedDate, l.dueDate, u.fullName as borrower, g.name as group_name
FROM `Loans` l
JOIN `Users` u ON l.UserId = u.id
JOIN `Groups` g ON l.GroupId = g.id;

SELECT 'VSLA Database setup complete! Ready for your backend application!' as FinalStatus;
