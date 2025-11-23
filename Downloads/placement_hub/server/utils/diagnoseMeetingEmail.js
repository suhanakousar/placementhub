/**
 * Diagnostic utility to check why a meeting email wasn't sent
 * Usage: node -e "require('./server/utils/diagnoseMeetingEmail').diagnose('meeting_id')"
 */

const mongoose = require('mongoose');
require('dotenv').config();

const diagnoseMeetingEmail = async (meetingId) => {
  try {
    // Connect to MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }

    const Meeting = require('../models/Meeting');
    const Student = require('../models/Student');
    const User = require('../models/User');
    const EmailLog = require('../models/EmailLog');

    console.log('\n🔍 Diagnosing Meeting Email Issue...\n');
    console.log('Meeting ID:', meetingId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Find the meeting
    const meeting = await Meeting.findById(meetingId)
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      });

    if (!meeting) {
      console.error('❌ Meeting not found with ID:', meetingId);
      return;
    }

    console.log('✅ Meeting Found:');
    console.log(`   Title: ${meeting.title}`);
    console.log(`   Status: ${meeting.status}`);
    console.log(`   Start Time: ${meeting.startTime}`);
    console.log(`   Created At: ${meeting.createdAt}`);
    console.log('');

    // Check student
    if (!meeting.studentId) {
      console.error('❌ Meeting has no studentId');
      return;
    }

    const student = meeting.studentId;
    console.log('✅ Student Found:');
    console.log(`   Student ID: ${student._id}`);
    console.log(`   Name: ${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`);
    console.log(`   Has userId: ${!!student.userId}`);
    
    if (!student.userId) {
      console.error('❌ Student has no userId field');
      return;
    }

    console.log(`   userId: ${student.userId._id || student.userId}`);
    console.log('');

    // Check user
    let user;
    if (typeof student.userId === 'object' && student.userId.email) {
      user = student.userId;
      console.log('✅ User Found (from populated student):');
    } else {
      user = await User.findById(student.userId);
      if (user) {
        console.log('✅ User Found (fetched separately):');
      } else {
        console.error('❌ User not found for userId:', student.userId);
        return;
      }
    }

    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email || '❌ NO EMAIL'}`);
    console.log('');

    if (!user.email) {
      console.error('❌ PROBLEM FOUND: User has no email address!');
      console.error('   Solution: Update the user record to include an email address');
      return;
    }

    // Check email logs
    console.log('📧 Checking Email Logs...');
    const emailLogs = await EmailLog.find({
      meetingId: meeting._id
    }).sort({ sentAt: -1 });

    if (emailLogs.length === 0) {
      console.log('   ⚠️  No email logs found for this meeting');
      console.log('   This means no email was attempted to be sent');
    } else {
      console.log(`   Found ${emailLogs.length} email log(s):`);
      emailLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. Status: ${log.status}`);
        console.log(`      Sent At: ${log.sentAt}`);
        console.log(`      Subject: ${log.subject}`);
        if (log.error) {
          console.log(`      Error: ${log.error}`);
        }
      });
    }
    console.log('');

    // Check SMTP configuration
    console.log('⚙️  Checking SMTP Configuration...');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL || process.env.SMTP_USER || '❌ NOT SET'}`);
    console.log('');

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('❌ PROBLEM FOUND: SMTP credentials not configured!');
      console.error('   Solution: Set SMTP_USER and SMTP_PASSWORD in .env file');
      console.error('   See EMAIL_SETUP.md for instructions');
      return;
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DIAGNOSIS SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const issues = [];
    if (!user.email) {
      issues.push('User has no email address');
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      issues.push('SMTP credentials not configured');
    }
    if (emailLogs.length === 0) {
      issues.push('No email was attempted (check server logs for errors)');
    } else if (emailLogs[0].status === 'failed') {
      issues.push(`Email sending failed: ${emailLogs[0].error || 'Unknown error'}`);
    }

    if (issues.length === 0) {
      console.log('✅ No obvious issues found.');
      console.log('   If email still not received, check:');
      console.log('   1. Spam/junk folder');
      console.log('   2. Server logs for email sending errors');
      console.log('   3. SMTP server connectivity');
    } else {
      console.log('❌ Issues found:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    console.error(error.stack);
  } finally {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
};

// If run directly
if (require.main === module) {
  const meetingId = process.argv[2];
  if (!meetingId) {
    console.error('Usage: node diagnoseMeetingEmail.js <meeting_id>');
    console.error('Example: node diagnoseMeetingEmail.js 6922ae2c93d5ddf77cf5ac80');
    process.exit(1);
  }
  diagnoseMeetingEmail(meetingId)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseMeetingEmail };

