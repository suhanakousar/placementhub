/**
 * Email Configuration Test Utility
 * Run this to test if email configuration is working
 * Usage: node -e "require('./server/utils/testEmail').testEmailConfig()"
 */

const { sendEmail } = require('./emailService');

const testEmailConfig = async (testEmail = null) => {
  console.log('\n🔍 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('Environment Variables Check:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET (default: smtp.gmail.com)'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET (default: 587)'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || process.env.SMTP_USER || '❌ NOT SET'}`);
  console.log(`SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Email configuration is incomplete!');
    console.error('\nTo fix this:');
    console.error('1. Create a .env file in the server directory');
    console.error('2. Add the following variables:');
    console.error('   SMTP_HOST=smtp.gmail.com');
    console.error('   SMTP_PORT=587');
    console.error('   SMTP_USER=your_email@gmail.com');
    console.error('   SMTP_PASSWORD=your_app_password');
    console.error('   FROM_EMAIL=your_email@gmail.com');
    console.error('\nFor Gmail:');
    console.error('- Enable 2-Step Verification');
    console.error('- Generate an App Password at: https://myaccount.google.com/apppasswords');
    console.error('- Use the 16-character app password (no spaces)');
    return false;
  }

  if (!testEmail) {
    console.log('⚠️  No test email provided. Skipping actual email send test.');
    console.log('To test sending, provide an email address.');
    return true;
  }

  console.log(`📧 Attempting to send test email to: ${testEmail}\n`);

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email - Placement Hub',
      html: `
        <h2>Email Configuration Test</h2>
        <p>If you received this email, your email configuration is working correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      fromName: 'Placement Hub - Test'
    });

    if (result && result.success && result.mode !== 'development') {
      console.log('✅ Test email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      return true;
    } else {
      console.error('❌ Test email failed to send');
      console.error('Result:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    console.error('Error details:', error);
    return false;
  }
};

// If run directly
if (require.main === module) {
  const testEmail = process.argv[2] || null;
  testEmailConfig(testEmail)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testEmailConfig };

