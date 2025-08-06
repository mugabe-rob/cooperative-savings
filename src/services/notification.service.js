const nodemailer = require('nodemailer');
const User = require('../models/user.model');
const Loan = require('../models/loan.model');
const Group = require('../models/group.model');
const UserGroup = require('../models/usergroup.model');
const { auditLogger } = require('./audit.service');
const { Op } = require('sequelize');

// Configure email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// SMS service configuration (placeholder for SMS provider)
const sendSMS = async (phoneNumber, message) => {
  try {
    // Implement SMS service integration here
    // This is a placeholder for actual SMS provider (e.g., Twilio, AfricasTalking)
    console.log(`SMS to ${phoneNumber}: ${message}`);
    
    // For production, implement actual SMS service:
    /*
    const response = await smsProvider.send({
      to: phoneNumber,
      message: message
    });
    return response;
    */
    
    return { success: true, messageId: 'mock-sms-id' };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw error;
  }
};

/**
 * Send email notification
 */
const sendEmail = async (to, subject, htmlContent, textContent = null) => {
  try {
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Get user notification preferences
 */
const getUserNotificationSettings = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      include: [{
        model: 'NotificationSettings',
        as: 'notificationSettings'
      }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Default settings if none exist
    const defaultSettings = {
      emailNotifications: true,
      smsNotifications: true,
      loanReminders: true,
      contributionReminders: true,
      meetingReminders: true,
      reminderDaysBefore: 3
    };

    return user.notificationSettings || defaultSettings;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    // Return default settings on error
    return {
      emailNotifications: true,
      smsNotifications: true,
      loanReminders: true,
      contributionReminders: true,
      meetingReminders: true,
      reminderDaysBefore: 3
    };
  }
};

/**
 * Send loan reminder notifications (FR14)
 */
const sendLoanReminders = async () => {
  try {
    console.log('Starting loan reminder process...');
    
    // Get loans that need reminders (due in next 3 days)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 3);

    const upcomingLoans = await Loan.findAll({
      where: {
        status: { [Op.in]: ['disbursed', 'partially_paid'] },
        dueDate: {
          [Op.lte]: reminderDate,
          [Op.gte]: new Date()
        },
        deletedAt: null
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'location']
        }
      ]
    });

    console.log(`Found ${upcomingLoans.length} loans requiring reminders`);

    const reminderResults = [];

    for (const loan of upcomingLoans) {
      try {
        const settings = await getUserNotificationSettings(loan.userId);
        
        if (!settings.loanReminders) {
          continue; // User has disabled loan reminders
        }

        const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Prepare notification content
        const subject = `Loan Payment Reminder - ${daysUntilDue} days remaining`;
        const message = `
Hello ${loan.user.name},

This is a friendly reminder that your loan payment is due in ${daysUntilDue} days.

Loan Details:
- Amount: ${loan.outstandingBalance.toLocaleString()} RWF
- Due Date: ${new Date(loan.dueDate).toLocaleDateString()}
- Group: ${loan.group.name}
- Purpose: ${loan.purpose}

Please ensure you make your payment on time to avoid any penalties.

Thank you for your cooperation.

Best regards,
VSLA Management System
        `;

        const htmlMessage = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2c3e50;">Loan Payment Reminder</h2>
  <p>Hello <strong>${loan.user.name}</strong>,</p>
  
  <p>This is a friendly reminder that your loan payment is due in <strong>${daysUntilDue} days</strong>.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h3 style="color: #495057; margin-top: 0;">Loan Details</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Outstanding Amount:</strong> ${loan.outstandingBalance.toLocaleString()} RWF</li>
      <li><strong>Due Date:</strong> ${new Date(loan.dueDate).toLocaleDateString()}</li>
      <li><strong>Group:</strong> ${loan.group.name}</li>
      <li><strong>Purpose:</strong> ${loan.purpose}</li>
    </ul>
  </div>
  
  <p>Please ensure you make your payment on time to avoid any penalties.</p>
  
  <p>Thank you for your cooperation.</p>
  
  <p><strong>Best regards,</strong><br>VSLA Management System</p>
</div>
        `;

        const result = { userId: loan.userId, loanId: loan.id, notifications: [] };

        // Send email notification
        if (settings.emailNotifications && loan.user.email) {
          try {
            const emailResult = await sendEmail(loan.user.email, subject, htmlMessage, message);
            result.notifications.push({ type: 'email', success: true, messageId: emailResult.messageId });
          } catch (error) {
            result.notifications.push({ type: 'email', success: false, error: error.message });
          }
        }

        // Send SMS notification
        if (settings.smsNotifications && loan.user.phone) {
          try {
            const smsMessage = `VSLA Reminder: Your loan payment of ${loan.outstandingBalance.toLocaleString()} RWF is due in ${daysUntilDue} days. Group: ${loan.group.name}. Please pay on time.`;
            const smsResult = await sendSMS(loan.user.phone, smsMessage);
            result.notifications.push({ type: 'sms', success: true, messageId: smsResult.messageId });
          } catch (error) {
            result.notifications.push({ type: 'sms', success: false, error: error.message });
          }
        }

        reminderResults.push(result);

        // Log the reminder
        await auditLogger.log(
          null,
          'send_reminder',
          'loan',
          loan.id,
          null,
          'system',
          {
            userId: loan.userId,
            reminderType: 'loan_payment',
            daysUntilDue,
            notifications: result.notifications
          }
        );

      } catch (error) {
        console.error(`Error sending reminder for loan ${loan.id}:`, error);
        reminderResults.push({
          userId: loan.userId,
          loanId: loan.id,
          error: error.message
        });
      }
    }

    console.log(`Loan reminder process completed. Processed ${reminderResults.length} reminders.`);
    return {
      success: true,
      processed: reminderResults.length,
      results: reminderResults
    };

  } catch (error) {
    console.error('Error in loan reminder process:', error);
    throw error;
  }
};

/**
 * Send overdue loan notifications
 */
const sendOverdueNotifications = async () => {
  try {
    console.log('Starting overdue loan notification process...');

    const overdueLoans = await Loan.findAll({
      where: {
        status: { [Op.in]: ['disbursed', 'partially_paid'] },
        dueDate: {
          [Op.lt]: new Date()
        },
        deletedAt: null
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'location']
        }
      ]
    });

    console.log(`Found ${overdueLoans.length} overdue loans`);

    const notificationResults = [];

    for (const loan of overdueLoans) {
      try {
        const settings = await getUserNotificationSettings(loan.userId);
        
        if (!settings.loanReminders) {
          continue;
        }

        const daysOverdue = Math.ceil((new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24));
        
        const subject = `URGENT: Overdue Loan Payment - ${daysOverdue} days overdue`;
        const message = `
URGENT NOTICE

Hello ${loan.user.name},

Your loan payment is now OVERDUE by ${daysOverdue} days.

Loan Details:
- Outstanding Amount: ${loan.outstandingBalance.toLocaleString()} RWF
- Original Due Date: ${new Date(loan.dueDate).toLocaleDateString()}
- Group: ${loan.group.name}
- Purpose: ${loan.purpose}

IMMEDIATE ACTION REQUIRED: Please contact your group leader immediately to arrange payment and avoid further penalties.

This is a system-generated notice.

VSLA Management System
        `;

        const htmlMessage = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #dc3545; border-radius: 5px;">
  <div style="background-color: #dc3545; color: white; padding: 15px; text-align: center;">
    <h2 style="margin: 0;">URGENT: OVERDUE LOAN PAYMENT</h2>
  </div>
  
  <div style="padding: 20px;">
    <p>Hello <strong>${loan.user.name}</strong>,</p>
    
    <p style="color: #dc3545; font-weight: bold;">Your loan payment is now OVERDUE by ${daysOverdue} days.</p>
    
    <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Loan Details</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Outstanding Amount:</strong> ${loan.outstandingBalance.toLocaleString()} RWF</li>
        <li><strong>Original Due Date:</strong> ${new Date(loan.dueDate).toLocaleDateString()}</li>
        <li><strong>Group:</strong> ${loan.group.name}</li>
        <li><strong>Purpose:</strong> ${loan.purpose}</li>
      </ul>
    </div>
    
    <p style="font-weight: bold; color: #dc3545;">IMMEDIATE ACTION REQUIRED: Please contact your group leader immediately to arrange payment and avoid further penalties.</p>
    
    <p><em>This is a system-generated notice.</em></p>
    
    <p><strong>VSLA Management System</strong></p>
  </div>
</div>
        `;

        const result = { userId: loan.userId, loanId: loan.id, notifications: [] };

        // Send email notification
        if (settings.emailNotifications && loan.user.email) {
          try {
            const emailResult = await sendEmail(loan.user.email, subject, htmlMessage, message);
            result.notifications.push({ type: 'email', success: true, messageId: emailResult.messageId });
          } catch (error) {
            result.notifications.push({ type: 'email', success: false, error: error.message });
          }
        }

        // Send SMS notification
        if (settings.smsNotifications && loan.user.phone) {
          try {
            const smsMessage = `URGENT: Your loan of ${loan.outstandingBalance.toLocaleString()} RWF is ${daysOverdue} days OVERDUE. Contact your group leader immediately. Group: ${loan.group.name}`;
            const smsResult = await sendSMS(loan.user.phone, smsMessage);
            result.notifications.push({ type: 'sms', success: true, messageId: smsResult.messageId });
          } catch (error) {
            result.notifications.push({ type: 'sms', success: false, error: error.message });
          }
        }

        notificationResults.push(result);

        // Log the notification
        await auditLogger.log(
          null,
          'send_overdue_notice',
          'loan',
          loan.id,
          null,
          'system',
          {
            userId: loan.userId,
            notificationType: 'overdue_loan',
            daysOverdue,
            notifications: result.notifications
          }
        );

      } catch (error) {
        console.error(`Error sending overdue notice for loan ${loan.id}:`, error);
        notificationResults.push({
          userId: loan.userId,
          loanId: loan.id,
          error: error.message
        });
      }
    }

    console.log(`Overdue notification process completed. Processed ${notificationResults.length} notifications.`);
    return {
      success: true,
      processed: notificationResults.length,
      results: notificationResults
    };

  } catch (error) {
    console.error('Error in overdue notification process:', error);
    throw error;
  }
};

/**
 * Send meeting reminders to group members
 */
const sendMeetingReminders = async () => {
  try {
    console.log('Starting meeting reminder process...');

    // Get groups with upcoming meetings (next 1-2 days)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 1); // 1 day ahead

    const groups = await Group.findAll({
      where: {
        status: 'active',
        meetingDay: { [Op.ne]: null },
        deletedAt: null
      },
      include: [
        {
          model: UserGroup,
          as: 'members',
          where: { status: 'active' },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    const reminderResults = [];

    for (const group of groups) {
      try {
        // Calculate next meeting date based on meeting day and frequency
        // This is a simplified calculation - in production, you'd want more sophisticated scheduling
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        const meetingDayMap = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        
        const meetingDay = meetingDayMap[group.meetingDay.toLowerCase()];
        
        // Calculate days until next meeting
        let daysUntilMeeting = (meetingDay - currentDay + 7) % 7;
        if (daysUntilMeeting === 0) daysUntilMeeting = 7; // If today is meeting day, next meeting is in 7 days
        
        // Only send reminders for meetings happening tomorrow
        if (daysUntilMeeting !== 1) {
          continue;
        }

        const nextMeetingDate = new Date(today);
        nextMeetingDate.setDate(today.getDate() + daysUntilMeeting);

        const subject = `Meeting Reminder - ${group.name}`;
        const message = `
Hello,

This is a reminder that your VSLA group "${group.name}" has a meeting scheduled for tomorrow.

Meeting Details:
- Date: ${nextMeetingDate.toLocaleDateString()}
- Time: ${group.meetingTime || 'TBD'}
- Location: ${group.location}
- Frequency: ${group.meetingFrequency}

Please make sure to attend and bring any required contributions.

See you there!

VSLA Management System
        `;

        for (const member of group.members) {
          try {
            const settings = await getUserNotificationSettings(member.userId);
            
            if (!settings.meetingReminders) {
              continue;
            }

            const result = { userId: member.userId, groupId: group.id, notifications: [] };

            // Send email notification
            if (settings.emailNotifications && member.user.email) {
              try {
                const emailResult = await sendEmail(member.user.email, subject, message);
                result.notifications.push({ type: 'email', success: true, messageId: emailResult.messageId });
              } catch (error) {
                result.notifications.push({ type: 'email', success: false, error: error.message });
              }
            }

            // Send SMS notification
            if (settings.smsNotifications && member.user.phone) {
              try {
                const smsMessage = `Reminder: VSLA meeting for "${group.name}" tomorrow at ${group.meetingTime || 'TBD'}. Location: ${group.location}`;
                const smsResult = await sendSMS(member.user.phone, smsMessage);
                result.notifications.push({ type: 'sms', success: true, messageId: smsResult.messageId });
              } catch (error) {
                result.notifications.push({ type: 'sms', success: false, error: error.message });
              }
            }

            reminderResults.push(result);

          } catch (error) {
            console.error(`Error sending meeting reminder to member ${member.userId}:`, error);
          }
        }

        // Log the meeting reminder
        await auditLogger.log(
          null,
          'send_meeting_reminder',
          'group',
          group.id,
          null,
          'system',
          {
            groupName: group.name,
            meetingDate: nextMeetingDate.toISOString(),
            membersNotified: group.members.length
          }
        );

      } catch (error) {
        console.error(`Error processing meeting reminder for group ${group.id}:`, error);
      }
    }

    console.log(`Meeting reminder process completed. Processed ${reminderResults.length} reminders.`);
    return {
      success: true,
      processed: reminderResults.length,
      results: reminderResults
    };

  } catch (error) {
    console.error('Error in meeting reminder process:', error);
    throw error;
  }
};

/**
 * Send custom notification to user(s)
 */
const sendCustomNotification = async (userIds, subject, message, type = 'general') => {
  try {
    const results = [];

    for (const userId of userIds) {
      try {
        const user = await User.findByPk(userId);
        if (!user) {
          results.push({ userId, error: 'User not found' });
          continue;
        }

        const settings = await getUserNotificationSettings(userId);
        const result = { userId, notifications: [] };

        // Send email notification
        if (settings.emailNotifications && user.email) {
          try {
            const emailResult = await sendEmail(user.email, subject, message);
            result.notifications.push({ type: 'email', success: true, messageId: emailResult.messageId });
          } catch (error) {
            result.notifications.push({ type: 'email', success: false, error: error.message });
          }
        }

        // Send SMS notification
        if (settings.smsNotifications && user.phone) {
          try {
            const smsMessage = message.replace(/<[^>]*>/g, ''); // Strip HTML for SMS
            const smsResult = await sendSMS(user.phone, smsMessage);
            result.notifications.push({ type: 'sms', success: true, messageId: smsResult.messageId });
          } catch (error) {
            result.notifications.push({ type: 'sms', success: false, error: error.message });
          }
        }

        results.push(result);

        // Log the notification
        await auditLogger.log(
          null,
          'send_custom_notification',
          'user',
          userId,
          null,
          'system',
          {
            notificationType: type,
            subject,
            notifications: result.notifications
          }
        );

      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        results.push({ userId, error: error.message });
      }
    }

    return {
      success: true,
      processed: results.length,
      results
    };

  } catch (error) {
    console.error('Error sending custom notifications:', error);
    throw error;
  }
};

module.exports = {
  sendLoanReminders,
  sendOverdueNotifications,
  sendMeetingReminders,
  sendCustomNotification,
  sendEmail,
  sendSMS,
  getUserNotificationSettings
};
