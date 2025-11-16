/**
 * Database Seed Script - Create Super Admin
 * 
 * This script creates the first admin account in the database.
 * Run this script once during initial setup.
 * 
 * Usage:
 *   node server/seeds/createSuperAdmin.js
 * 
 * Or with custom credentials:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword node server/seeds/createSuperAdmin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Admin credentials from environment variables or defaults
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@placement.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Super';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'Admin';

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_hub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingUser = await User.findOne({ email: ADMIN_EMAIL });
    if (existingUser) {
      console.log('⚠ Admin user already exists with email:', ADMIN_EMAIL);
      
      // Check if admin profile exists
      const existingAdmin = await Admin.findOne({ userId: existingUser._id });
      if (existingAdmin) {
        console.log('✓ Admin profile already exists');
      } else {
        // Create admin profile if user exists but profile doesn't
        console.log('Creating admin profile for existing user...');
        await Admin.create({
          userId: existingUser._id,
          personalInfo: {
            firstName: ADMIN_FIRST_NAME,
            lastName: ADMIN_LAST_NAME
          }
        });
        console.log('✓ Admin profile created');
      }
      
      console.log('\nAdmin Credentials:');
      console.log('Email:', ADMIN_EMAIL);
      console.log('Password: (use your existing password)');
      
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    console.log('\nCreating super admin user...');
    const adminUser = await User.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true // Admin is pre-verified
    });
    console.log('✓ Admin user created');

    // Create admin profile
    console.log('Creating admin profile...');
    await Admin.create({
      userId: adminUser._id,
      personalInfo: {
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME
      }
    });
    console.log('✓ Admin profile created');

    console.log('\n✅ Super Admin created successfully!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('⚠️  Store these credentials securely!');
    console.log('\nYou can now login at: http://localhost:3000/login\n');

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
createSuperAdmin();
