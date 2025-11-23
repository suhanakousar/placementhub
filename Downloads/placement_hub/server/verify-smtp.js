/**
 * Quick SMTP verification script
 * Run: node verify-smtp.js
 */

require('dotenv').config();

console.log('\n🔍 Verifying SMTP Configuration...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check environment variables
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const fromEmail = process.env.FROM_EMAIL;

console.log('Environment Variables:');
console.log(`  SMTP_HOST: ${smtpHost || '❌ NOT SET'}`);
console.log(`  SMTP_PORT: ${smtpPort || '❌ NOT SET'}`);
console.log(`  SMTP_USER: ${smtpUser || '❌ NOT SET'}`);
console.log(`  SMTP_PASSWORD: ${smtpPassword ? `✅ SET (${smtpPassword.length} chars)` : '❌ NOT SET'}`);
console.log(`  FROM_EMAIL: ${fromEmail || '❌ NOT SET'}`);
console.log('');

// Check password format
if (smtpPassword) {
  const hasSpaces = /\s/.test(smtpPassword);
  const length = smtpPassword.length;
  
  console.log('Password Analysis:');
  console.log(`  Length: ${length} characters`);
  console.log(`  Has spaces: ${hasSpaces ? '❌ YES (REMOVE SPACES!)' : '✅ NO'}`);
  console.log(`  Expected: 16 characters, no spaces`);
  
  if (hasSpaces) {
    console.log('\n⚠️  WARNING: Password contains spaces!');
    console.log('   Remove all spaces from the password.');
    console.log(`   Current: "${smtpPassword}"`);
    console.log(`   Should be: "${smtpPassword.replace(/\s/g, '')}"`);
  } else if (length !== 16) {
    console.log('\n⚠️  WARNING: Password length is not 16 characters!');
    console.log('   Gmail App Passwords are exactly 16 characters.');
  } else {
    console.log('\n✅ Password format looks correct!');
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test email sending
if (smtpUser && smtpPassword && !/\s/.test(smtpPassword)) {
  console.log('📧 Testing email sending...\n');
  const { testEmailConfig } = require('./utils/testEmail');
  testEmailConfig(smtpUser)
    .then(success => {
      if (success) {
        console.log('\n✅ SUCCESS! Email configuration is working!');
        console.log('   Meeting emails should now be sent automatically.\n');
      } else {
        console.log('\n❌ FAILED! Check the error messages above.\n');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('\n❌ Error:', err.message);
      console.error('\nCommon fixes:');
      console.error('1. Make sure password has NO spaces');
      console.error('2. Generate a NEW app password if this one is old');
      console.error('3. Verify 2-Step Verification is enabled');
      console.error('4. Restart server after changing .env file\n');
      process.exit(1);
    });
} else {
  console.log('❌ Cannot test - SMTP configuration incomplete or has spaces in password.\n');
  process.exit(1);
}

