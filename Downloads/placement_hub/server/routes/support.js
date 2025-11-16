const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { sendSupportEmail } = require('../utils/emailService');

const router = express.Router();

// @route   POST /api/support/contact
// @desc    Send support/complaint email
// @access  Private
router.post('/contact', protect, [
  body('subject').notEmpty().trim(),
  body('message').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        message: 'Please fill in all required fields',
        errors: errors.array()
      });
    }

    const { subject, message } = req.body;
    const userEmail = req.user.email;
    const userName = req.user.role === 'student' ? 'Student' : 'Admin';

    // Send support email
    await sendSupportEmail({
      from: userEmail,
      subject: `Support: ${subject}`,
      message: message,
      userName: userName,
      userRole: req.user.role
    });

    res.json({
      success: true,
      message: 'Your support request has been sent successfully. We will get back to you soon.'
    });
  } catch (error) {
    console.error('Support email error:', error);
    res.status(500).json({
      message: 'Failed to send support request. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
