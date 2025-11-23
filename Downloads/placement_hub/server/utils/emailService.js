const nodemailer = require('nodemailer');
const https = require('https');

// Send email via SendGrid API (more reliable than SMTP)
const sendEmailViaSendGridAPI = async (to, subject, html, text, fromEmail, fromName = 'Placement Hub') => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD;
    
    if (!apiKey) {
      return reject(new Error('SendGrid API key not configured'));
    }

    const postData = JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
        subject: subject
      }],
      from: {
        email: fromEmail,
        name: fromName
      },
      content: [
        {
          type: 'text/plain',
          value: text
        },
        {
          type: 'text/html',
          value: html
        }
      ]
    });

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000 // 15 seconds timeout
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('SendGrid API: Email sent successfully');
          resolve({ success: true, messageId: res.headers['x-message-id'] || 'sent' });
        } else {
          const error = new Error(`SendGrid API error: ${res.statusCode} - ${data}`);
          error.statusCode = res.statusCode;
          error.response = data;
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('SendGrid API request error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('SendGrid API request timeout'));
    });

    req.write(postData);
    req.end();
  });
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  
  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be set in environment variables');
  }
  
  console.log(`Creating SMTP transporter:`);
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  User: ${user}`);
  console.log(`  Secure: ${isSecure}`);
  
  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: isSecure, // true for 465, false for other ports
    requireTLS: !isSecure, // Require TLS for non-SSL ports
    auth: {
      user: user, // For SendGrid: "apikey", for Gmail: your email
      pass: pass, // API key or app password
    },
    connectionTimeout: 30000, // 30 seconds connection timeout (increased for cloud)
    greetingTimeout: 30000, // 30 seconds greeting timeout
    socketTimeout: 30000, // 30 seconds socket timeout
    pool: true, // Use connection pooling for better performance
    maxConnections: 1,
    maxMessages: 3,
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    logger: process.env.NODE_ENV === 'development', // Enable logger in development
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates if needed
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  try {
    // Development mode: Log OTP to console instead of sending email
    // Check if SMTP credentials are missing (regardless of NODE_ENV)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 DEVELOPMENT MODE - OTP Email');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${email}`);
      console.log(`Purpose: ${purpose}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Expires: 10 minutes`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, messageId: 'dev-mode', mode: 'development' };
    }

    const transporter = createTransporter();
    
    const subject = purpose === 'verification' 
      ? 'Email Verification OTP - Placement Hub'
      : purpose === 'login'
      ? 'Login OTP - Placement Hub'
      : 'OTP - Placement Hub';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Placement Hub</h1>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Hello,</p>
            <p>Your OTP for ${purpose === 'verification' ? 'email verification' : purpose === 'login' ? 'login' : 'authentication'} is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Placement Hub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use FROM_EMAIL if set, otherwise use SMTP_USER (for Gmail) or default
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'placementhub722@gmail.com';
    
    const mailOptions = {
      from: `"Placement Hub" <${fromEmail}>`,
      to: email,
      subject: subject,
      html: html,
      text: `Your OTP is: ${otp}. This code will expire in 10 minutes.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  // Remove trailing slash from FRONTEND_URL if present
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  // Development mode or missing SMTP config: Log reset link to console instead of sending email
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 DEVELOPMENT MODE - Password Reset Email');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token: ${resetToken}`);
    console.log(`Expires: 1 hour`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, messageId: 'dev-mode', mode: 'development' };
  }

  try {
    // Use FROM_EMAIL if set, otherwise use SMTP_USER (for Gmail) or default
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'placementhub722@gmail.com';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { color: #d32f2f; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Placement Hub</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p class="warning">This link will expire in <strong>1 hour</strong>.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Placement Hub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = 'Password Reset Request - Placement Hub';
    const text = `Click this link to reset your password: ${resetUrl}. This link will expire in 1 hour.`;

    console.log(`Attempting to send password reset email to: ${email}`);
    console.log(`From email: ${fromEmail}`);

    // Try SendGrid API first (more reliable), fall back to SMTP
    const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD;
    if (apiKey && process.env.SMTP_HOST === 'smtp.sendgrid.net') {
      console.log('Using SendGrid API');
      try {
        const result = await sendEmailViaSendGridAPI(email, subject, html, text, fromEmail, 'Placement Hub');
        console.log('Password reset email sent successfully via SendGrid API');
        return result;
      } catch (apiError) {
        console.error('SendGrid API failed, falling back to SMTP:', apiError.message);
        // Fall through to SMTP
      }
    }

    // Fall back to SMTP
    console.log('Using SMTP transport');
    if (!process.env.SMTP_HOST) {
      throw new Error('SMTP_HOST is not configured');
    }
    
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }
    
    const mailOptions = {
      from: `"Placement Hub" <${fromEmail}>`,
      to: email,
      subject: subject,
      html: html,
      text: text
    };

    console.log(`Using SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***configured***' : 'missing'
    });
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    // Development mode: Log welcome message to console instead of sending email
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 DEVELOPMENT MODE - Welcome Email');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Message: Welcome to Placement Hub!`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, messageId: 'dev-mode', mode: 'development' };
    }

    const transporter = createTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Placement Hub!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for joining Placement Hub! Your account has been successfully created.</p>
            <p>You can now:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Upload your resume</li>
              <li>Apply for placement drives</li>
              <li>Track your application status</li>
            </ul>
            <p>Get started by logging in to your dashboard.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Placement Hub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use FROM_EMAIL if set, otherwise use SMTP_USER (for Gmail) or default
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'placementhub722@gmail.com';
    
    const mailOptions = {
      from: `"Placement Hub" <${fromEmail}>`,
      to: email,
      subject: 'Welcome to Placement Hub!',
      html: html,
      text: `Welcome ${name}! Thank you for joining Placement Hub.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send email verification email
const sendVerificationEmail = async (email, verificationUrl) => {
  try {
    // Development mode: Log verification link to console instead of sending email
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 DEVELOPMENT MODE - Email Verification');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${email}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log(`Expires: 24 hours`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, messageId: 'dev-mode', mode: 'development' };
    }

    const transporter = createTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { color: #d32f2f; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Placement Hub</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hello,</p>
            <p>Thank you for registering with Placement Hub! To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p class="warning">This verification link will expire in <strong>24 hours</strong>.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Placement Hub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use FROM_EMAIL if set, otherwise use SMTP_USER (for Gmail) or default
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'placementhub722@gmail.com';
    
    const mailOptions = {
      from: `"Placement Hub" <${fromEmail}>`,
      to: email,
      subject: 'Verify Your Email - Placement Hub',
      html: html,
      text: `Verify your email: ${verificationUrl}. This link expires in 24 hours.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Generic sendEmail function for meeting notifications and other emails
const sendEmail = async ({ to, subject, html, text, fromEmail, fromName = 'Placement Hub', attachments }) => {
  try {
    console.log(`\n📧 Attempting to send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      const errorMsg = 'SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.';
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL NOT SENT - SMTP not configured');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${fromName} <${fromEmail || 'noreply@placementhub.com'}>`);
      if (text) console.log(`Text: ${text.substring(0, 200)}...`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.error('❌ ERROR: Email not sent - SMTP credentials missing!');
      console.error('   Set SMTP_USER and SMTP_PASSWORD environment variables to send emails.\n');
      
      // In production, throw error. In development, return error status
      if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMsg);
      }
      return { 
        success: false, 
        messageId: 'not-sent', 
        mode: 'development',
        error: errorMsg,
        message: errorMsg
      };
    }

    const email = fromEmail || process.env.FROM_EMAIL || process.env.SMTP_USER || 'placementhub722@gmail.com';
    
    console.log(`\n📧 Email Configuration Check:`);
    console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
    console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || '587 (default)'}`);
    console.log(`  SMTP_USER: ${process.env.SMTP_USER ? '***configured***' : '❌ NOT SET'}`);
    console.log(`  SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '***configured***' : '❌ NOT SET'}`);
    console.log(`  FROM_EMAIL: ${process.env.FROM_EMAIL || process.env.SMTP_USER || 'not set'}`);
    console.log(`  SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '***configured***' : 'not set'}`);
    console.log(`  Using email: ${email}\n`);
    
    // Try SendGrid API first (more reliable), fall back to SMTP
    // Check if SendGrid API key is available (preferred method for cloud deployments)
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (sendGridApiKey) {
      try {
        console.log('📧 SendGrid API key detected. Using SendGrid API (recommended for cloud deployments)...');
        const result = await sendEmailViaSendGridAPI(to, subject, html, text || '', email, fromName);
        console.log('✅ Email sent successfully via SendGrid API');
        return result;
      } catch (apiError) {
        console.error('❌ SendGrid API failed:', apiError.message);
        console.error('Error details:', {
          statusCode: apiError.statusCode,
          response: apiError.response
        });
        // Don't fall through to SMTP if SendGrid API key is explicitly set
        // This prevents trying SMTP on cloud platforms where it's blocked
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`SendGrid API failed: ${apiError.message}. Check your SENDGRID_API_KEY.`);
        }
        console.error('Falling back to SMTP (development mode only)...');
        // Fall through to SMTP only in development
      }
    }
    
    // Also try SendGrid if SMTP_HOST is set to sendgrid.net
    if (process.env.SMTP_HOST === 'smtp.sendgrid.net' && process.env.SMTP_PASSWORD && process.env.SMTP_PASSWORD.startsWith('SG.')) {
      try {
        console.log('📧 SendGrid SMTP detected. Attempting SendGrid API instead (more reliable)...');
        const result = await sendEmailViaSendGridAPI(to, subject, html, text || '', email, fromName);
        console.log('✅ Email sent successfully via SendGrid API');
        return result;
      } catch (apiError) {
        console.error('❌ SendGrid API failed, will try SMTP:', apiError.message);
        // Fall through to SMTP
      }
    }

    // Fall back to SMTP
    console.log('Attempting to send via SMTP...');
    if (!process.env.SMTP_HOST) {
      throw new Error('SMTP_HOST is not configured. Please set SMTP_HOST environment variable.');
    }
    
    // Try port 465 (SSL) first if port 587 fails (better for cloud providers)
    let transporter = null;
    let lastError = null;
    
    // First try with configured port
    try {
      transporter = createTransporter();
      if (!transporter) {
        throw new Error('Failed to create email transporter. Check SMTP configuration.');
      }
      
      const mailOptions = {
        from: `"${fromName}" <${email}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        attachments: attachments || []
      };

      console.log(`Sending email via SMTP from ${email} to ${to}...`);
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via SMTP:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (smtpError) {
      lastError = smtpError;
      console.error('❌ SMTP send failed:', smtpError.message);
      
      // If connection timeout and using port 587, try port 465 (SSL)
      if ((smtpError.code === 'ETIMEDOUT' || smtpError.code === 'ECONNREFUSED') && 
          process.env.SMTP_PORT === '587' && 
          process.env.SMTP_HOST === 'smtp.gmail.com') {
        console.log('⚠️  Connection timeout on port 587. Trying port 465 (SSL)...');
        try {
          // Temporarily override port to 465
          const originalPort = process.env.SMTP_PORT;
          process.env.SMTP_PORT = '465';
          transporter = createTransporter();
          process.env.SMTP_PORT = originalPort;
          
          const mailOptions = {
            from: `"${fromName}" <${email}>`,
            to: to,
            subject: subject,
            html: html,
            text: text || html.replace(/<[^>]*>/g, ''),
            attachments: attachments || []
          };
          
          const info = await transporter.sendMail(mailOptions);
          console.log('✅ Email sent successfully via SMTP (port 465):', info.messageId);
          return { success: true, messageId: info.messageId };
        } catch (sslError) {
          console.error('❌ SMTP port 465 also failed:', sslError.message);
          lastError = sslError;
        }
      }
      
      // If still failing, provide helpful error message
      if (lastError.code === 'ETIMEDOUT' || lastError.code === 'ECONNREFUSED') {
        const errorMsg = `SMTP connection failed. This is common on cloud hosting (like Render). Consider using SendGrid API instead. Error: ${lastError.message}`;
        console.error('❌', errorMsg);
        console.error('\n💡 SOLUTION: Use SendGrid API for cloud deployments:');
        console.error('   1. Sign up at https://sendgrid.com (free tier available)');
        console.error('   2. Create an API key');
        console.error('   3. Set environment variables:');
        console.error('      SMTP_HOST=smtp.sendgrid.net');
        console.error('      SMTP_USER=apikey');
        console.error('      SMTP_PASSWORD=your_sendgrid_api_key');
        console.error('      SENDGRID_API_KEY=your_sendgrid_api_key\n');
        throw new Error(errorMsg);
      }
      
      throw lastError;
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw error;
  }
};

const sendSupportEmail = async ({ from, subject, message, userName, userRole }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 DEVELOPMENT MODE - Support Email');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`From: ${userName} (${userRole}) - ${from}`);
      console.log(`Subject: ${subject}`);
      console.log('Message:');
      console.log(message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, messageId: 'dev-mode', mode: 'development' };
    }

    const transporter = createTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .user-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .message-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Placement Hub Support</h1>
          </div>
          <div class="content">
            <h2>New Support Request</h2>
            <div class="user-info">
              <strong>From:</strong> ${userName} (${userRole})<br>
              <strong>Email:</strong> ${from}<br>
              <strong>Subject:</strong> ${subject.replace('Support: ', '')}
            </div>
            <div class="message-box">
              <h3>Message:</h3>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p>Please respond to this support request as soon as possible.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Placement Hub. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use FROM_EMAIL if set, otherwise use SMTP_USER (for Gmail) or default
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'placementhub722@gmail.com';
    
    const mailOptions = {
      from: `"Placement Hub Support" <${fromEmail}>`,
      to: 'placementhub722@gmail.com',
      subject: subject,
      html: html,
      text: `New support request from ${userName} (${userRole}) - ${from}\n\nSubject: ${subject.replace('Support: ', '')}\n\nMessage:\n${message}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Support email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending support email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendSupportEmail
};

