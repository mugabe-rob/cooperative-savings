-- VSLA Database Enhancement Migration Script
-- This script adds all URS required fields to existing tables

-- 1. Update Users table with URS requirements
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nationalId VARCHAR(16) UNIQUE,
ADD COLUMN IF NOT EXISTS dateOfBirth DATE,
ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other'),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS isSuspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspendedAt DATETIME,
ADD COLUMN IF NOT EXISTS suspendedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS suspensionReason TEXT,
ADD COLUMN IF NOT EXISTS lastLogin DATETIME,
ADD COLUMN IF NOT EXISTS profilePicture VARCHAR(255),
ADD COLUMN IF NOT EXISTS createdBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS updatedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS deletedAt DATETIME;

-- Update role enum to include leader and auditor
ALTER TABLE users MODIFY COLUMN role ENUM('member', 'leader', 'admin', 'auditor') DEFAULT 'member';

-- Add phone validation constraint
ALTER TABLE users ADD CONSTRAINT chk_phone_format CHECK (phone REGEXP '^\\+250[0-9]{9}$');

-- Add national ID validation constraint
ALTER TABLE users ADD CONSTRAINT chk_national_id_format CHECK (nationalId IS NULL OR nationalId REGEXP '^[0-9]{16}$');

-- 2. Update Groups table with URS requirements
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS location VARCHAR(200) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS district VARCHAR(50),
ADD COLUMN IF NOT EXISTS sector VARCHAR(50),
ADD COLUMN IF NOT EXISTS cell VARCHAR(50),
ADD COLUMN IF NOT EXISTS meetingDay ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
ADD COLUMN IF NOT EXISTS meetingTime TIME,
ADD COLUMN IF NOT EXISTS meetingFrequency ENUM('weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS leaderId VARCHAR(36),
ADD COLUMN IF NOT EXISTS treasurerId VARCHAR(36),
ADD COLUMN IF NOT EXISTS secretaryId VARCHAR(36),
ADD COLUMN IF NOT EXISTS minimumContribution DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS maximumContribution DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS contributionFrequency ENUM('weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS maxLoanAmount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS defaultInterestRate DECIMAL(5,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'archived', 'disbanded') DEFAULT 'active',
ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS archivedAt DATETIME,
ADD COLUMN IF NOT EXISTS archivedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS archiveReason TEXT,
ADD COLUMN IF NOT EXISTS updatedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS deletedAt DATETIME;

-- Add foreign key constraints for group leadership
ALTER TABLE groups ADD CONSTRAINT fk_group_leader FOREIGN KEY (leaderId) REFERENCES users(id);
ALTER TABLE groups ADD CONSTRAINT fk_group_treasurer FOREIGN KEY (treasurerId) REFERENCES users(id);
ALTER TABLE groups ADD CONSTRAINT fk_group_secretary FOREIGN KEY (secretaryId) REFERENCES users(id);
ALTER TABLE groups ADD CONSTRAINT fk_group_created_by FOREIGN KEY (createdBy) REFERENCES users(id);

-- 3. Update Loans table with URS requirements
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS purpose VARCHAR(500) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS purposeCategory ENUM('business', 'education', 'health', 'agriculture', 'emergency', 'other') NOT NULL DEFAULT 'other',
ADD COLUMN IF NOT EXISTS repaymentTerm INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS repaymentFrequency ENUM('weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewedAt DATETIME,
ADD COLUMN IF NOT EXISTS reviewedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS approvedAt DATETIME,
ADD COLUMN IF NOT EXISTS approvedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS rejectedAt DATETIME,
ADD COLUMN IF NOT EXISTS rejectionReason TEXT,
ADD COLUMN IF NOT EXISTS disbursedAt DATETIME,
ADD COLUMN IF NOT EXISTS disbursedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS disbursementMethod ENUM('cash', 'mobile_money', 'bank_transfer'),
ADD COLUMN IF NOT EXISTS disbursementReference VARCHAR(100),
ADD COLUMN IF NOT EXISTS firstPaymentDate DATE,
ADD COLUMN IF NOT EXISTS totalInterest DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS totalAmount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS monthlyPayment DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS outstandingBalance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS totalPaid DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS userId VARCHAR(36) NOT NULL,
ADD COLUMN IF NOT EXISTS groupId VARCHAR(36) NOT NULL,
ADD COLUMN IF NOT EXISTS createdBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS updatedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS deletedAt DATETIME;

-- Update loan status enum
ALTER TABLE loans MODIFY COLUMN status ENUM('pending', 'under_review', 'approved', 'rejected', 'disbursed', 'partially_paid', 'fully_paid', 'defaulted') DEFAULT 'pending';

-- Change amount and interestRate to DECIMAL for precision
ALTER TABLE loans MODIFY COLUMN amount DECIMAL(10,2) NOT NULL;
ALTER TABLE loans MODIFY COLUMN interestRate DECIMAL(5,2) NOT NULL;

-- Add foreign key constraints for loans
ALTER TABLE loans ADD CONSTRAINT fk_loan_user FOREIGN KEY (userId) REFERENCES users(id);
ALTER TABLE loans ADD CONSTRAINT fk_loan_group FOREIGN KEY (groupId) REFERENCES groups(id);
ALTER TABLE loans ADD CONSTRAINT fk_loan_reviewed_by FOREIGN KEY (reviewedBy) REFERENCES users(id);
ALTER TABLE loans ADD CONSTRAINT fk_loan_approved_by FOREIGN KEY (approvedBy) REFERENCES users(id);
ALTER TABLE loans ADD CONSTRAINT fk_loan_disbursed_by FOREIGN KEY (disbursedBy) REFERENCES users(id);

-- Add loan amount and interest rate validation
ALTER TABLE loans ADD CONSTRAINT chk_loan_amount CHECK (amount > 0);
ALTER TABLE loans ADD CONSTRAINT chk_interest_rate CHECK (interestRate >= 0 AND interestRate <= 50);
ALTER TABLE loans ADD CONSTRAINT chk_repayment_term CHECK (repaymentTerm >= 1 AND repaymentTerm <= 24);

-- 4. Update Contributions table
ALTER TABLE contributions
ADD COLUMN IF NOT EXISTS contributionType ENUM('regular', 'special', 'fine', 'share_purchase') DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS paymentMethod ENUM('cash', 'mobile_money', 'bank_transfer') DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS paymentReference VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS userId VARCHAR(36) NOT NULL,
ADD COLUMN IF NOT EXISTS groupId VARCHAR(36) NOT NULL,
ADD COLUMN IF NOT EXISTS recordedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS createdBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS updatedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS deletedAt DATETIME;

-- Change amount to DECIMAL for precision
ALTER TABLE contributions MODIFY COLUMN amount DECIMAL(10,2) NOT NULL;

-- Add foreign key constraints for contributions
ALTER TABLE contributions ADD CONSTRAINT fk_contribution_user FOREIGN KEY (userId) REFERENCES users(id);
ALTER TABLE contributions ADD CONSTRAINT fk_contribution_group FOREIGN KEY (groupId) REFERENCES groups(id);
ALTER TABLE contributions ADD CONSTRAINT fk_contribution_recorded_by FOREIGN KEY (recordedBy) REFERENCES users(id);

-- Add contribution amount validation
ALTER TABLE contributions ADD CONSTRAINT chk_contribution_amount CHECK (amount > 0);

-- 5. Update Repayments table
ALTER TABLE repayments
ADD COLUMN IF NOT EXISTS paymentMethod ENUM('cash', 'mobile_money', 'bank_transfer') DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS paymentReference VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS recordedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS createdBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS updatedBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS deletedAt DATETIME;

-- Change amount to DECIMAL for precision
ALTER TABLE repayments MODIFY COLUMN amount DECIMAL(10,2) NOT NULL;

-- Add foreign key constraints for repayments
ALTER TABLE repayments ADD CONSTRAINT fk_repayment_loan FOREIGN KEY (loanId) REFERENCES loans(id);
ALTER TABLE repayments ADD CONSTRAINT fk_repayment_recorded_by FOREIGN KEY (recordedBy) REFERENCES users(id);

-- Add repayment amount validation
ALTER TABLE repayments ADD CONSTRAINT chk_repayment_amount CHECK (amount > 0);

-- 6. Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    userId VARCHAR(36) NOT NULL,
    emailNotifications BOOLEAN DEFAULT TRUE,
    smsNotifications BOOLEAN DEFAULT TRUE,
    loanReminders BOOLEAN DEFAULT TRUE,
    contributionReminders BOOLEAN DEFAULT TRUE,
    meetingReminders BOOLEAN DEFAULT TRUE,
    reminderDaysBefore INTEGER DEFAULT 3,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    UNIQUE KEY unique_user_settings (userId)
);

-- 7. Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url VARCHAR(500),
    request_params JSON,
    request_query JSON,
    response_status INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    is_editable BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, description, setting_type) VALUES
('system_name', 'VSLA Management System', 'Name of the system', 'string'),
('default_interest_rate', '5.00', 'Default interest rate for loans (%)', 'number'),
('max_loan_amount', '1000000', 'Maximum loan amount (RWF)', 'number'),
('min_contribution', '1000', 'Minimum contribution amount (RWF)', 'number'),
('contribution_frequency', 'weekly', 'Default contribution frequency', 'string'),
('loan_reminder_days', '3', 'Days before due date to send reminders', 'number'),
('sms_enabled', 'false', 'Enable SMS notifications', 'boolean'),
('email_enabled', 'true', 'Enable email notifications', 'boolean');

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(nationalId);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive);

CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_leader ON groups(leaderId);
CREATE INDEX IF NOT EXISTS idx_groups_location ON groups(location);

CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(userId);
CREATE INDEX IF NOT EXISTS idx_loans_group ON loans(groupId);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(dueDate);

CREATE INDEX IF NOT EXISTS idx_contributions_user ON contributions(userId);
CREATE INDEX IF NOT EXISTS idx_contributions_group ON contributions(groupId);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions(createdAt);

CREATE INDEX IF NOT EXISTS idx_repayments_loan ON repayments(loanId);
CREATE INDEX IF NOT EXISTS idx_repayments_date ON repayments(createdAt);

-- 10. Update UserGroups table if exists
ALTER TABLE usergroups
ADD COLUMN IF NOT EXISTS role ENUM('member', 'leader', 'treasurer', 'secretary') DEFAULT 'member',
ADD COLUMN IF NOT EXISTS joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS leftAt DATETIME,
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
ADD COLUMN IF NOT EXISTS createdBy VARCHAR(36),
ADD COLUMN IF NOT EXISTS updatedBy VARCHAR(36);

-- Add foreign key constraints for usergroups
ALTER TABLE usergroups ADD CONSTRAINT fk_usergroup_user FOREIGN KEY (userId) REFERENCES users(id);
ALTER TABLE usergroups ADD CONSTRAINT fk_usergroup_group FOREIGN KEY (groupId) REFERENCES groups(id);

COMMIT;

-- Display completion message
SELECT 'Database migration completed successfully!' as status;
