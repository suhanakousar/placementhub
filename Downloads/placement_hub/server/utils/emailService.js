const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: isSecure, // true for 465, false for other ports
    requireTLS: !isSecure, // Require TLS for non-SSL ports
    auth: {
      user: process.env.SMTP_USER, // For SendGrid: "apikey", for Gmail: your email
      pass: process.env.SMTP_PASSWORD, // API key or app password
    },
    connectionTimeout: 10000, // 10 seconds connection timeout
    greetingTimeout: 10000, // 10 seconds greeting timeout
    socketTimeout: 10000, // 10 seconds socket timeout
    pool: true, // Use connection pooling for better performance
    maxConnections: 1,
    maxMessages: 3,
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
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

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

    // Use FROM_EMAIL if set, otherwise use SMTP_USER (for Gmail) or default
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'placementhub722@gmail.com';
    
    const mailOptions = {
      from: `"Placement Hub" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset Request - Placement Hub',
      html: html,
      text: `Click this link to reset your password: ${resetUrl}. This link will expire in 1 hour.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
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
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendSupportEmail
};

