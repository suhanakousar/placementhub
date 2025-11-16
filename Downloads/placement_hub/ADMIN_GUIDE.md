# 👨‍💼 Admin Management Guide

This guide explains how to add admin accounts and manage student data in the Placement Hub system.

## 📋 Table of Contents
1. [Adding Admin Accounts](#adding-admin-accounts)
2. [Deleting Student Accounts](#deleting-student-accounts)
3. [Admin Credentials](#admin-credentials)

---

## ➕ Adding Admin Accounts

### Method 1: Using Seed Script (Recommended)

The easiest way to create an admin account is using the seed script:

#### Default Admin:
```bash
cd server
node seeds/createSuperAdmin.js
```

This creates an admin with:
- **Email:** `admin@placement.edu`
- **Password:** `Admin@123456`

#### Custom Admin:
You can create a custom admin by setting environment variables:

**Windows (PowerShell):**
```powershell
$env:ADMIN_EMAIL="your-admin@email.com"
$env:ADMIN_PASSWORD="YourSecurePassword"
$env:ADMIN_FIRST_NAME="Admin"
$env:ADMIN_LAST_NAME="User"
node server/seeds/createSuperAdmin.js
```

**Windows (CMD):**
```cmd
set ADMIN_EMAIL=your-admin@email.com
set ADMIN_PASSWORD=YourSecurePassword
set ADMIN_FIRST_NAME=Admin
set ADMIN_LAST_NAME=User
node server/seeds/createSuperAdmin.js
```

**Linux/Mac:**
```bash
ADMIN_EMAIL=your-admin@email.com ADMIN_PASSWORD=YourSecurePassword ADMIN_FIRST_NAME=Admin ADMIN_LAST_NAME=User node server/seeds/createSuperAdmin.js
```

### Method 2: Using Environment Variables (.env file)

Create or edit `.env` file in the root directory:

```env
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=YourSecurePassword
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
MONGODB_URI=your_mongodb_connection_string
```

Then run:
```bash
node server/seeds/createSuperAdmin.js
```

### Method 3: Using Registration API

You can register an admin through the API endpoint:

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "YourSecurePassword",
  "role": "admin",
  "firstName": "Admin",
  "lastName": "User"
}
```

**Using cURL:**
```bash
curl -X POST https://placementhub-2.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourSecurePassword",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

---

## 🗑️ Deleting Student Accounts

If a student account was created incorrectly or needs to be removed, you can delete it through the admin dashboard or API.

### Method 1: Using Admin Dashboard

1. Login to the admin dashboard
2. Go to **Students** section
3. Find the student you want to delete
4. Click on the student to view details
5. Click **Delete Student** button (if available in UI)

### Method 2: Using API Endpoint

**Endpoint:**
```
DELETE /api/admin/students/:studentId
```

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Example using cURL:**
```bash
curl -X DELETE https://placementhub-2.onrender.com/api/admin/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**What gets deleted:**
- ✅ Student profile and all data
- ✅ User account (email, password, etc.)
- ✅ All uploaded files (resumes, certificates, photos)
- ✅ All notifications associated with the student
- ✅ All student records from database

**Note:** This action is **irreversible**. Make sure you want to delete the student before proceeding.

### Method 3: Using MongoDB Directly (Advanced)

If you have direct database access:

```javascript
// Connect to MongoDB
use placement_hub

// Find student by email or ID
db.students.findOne({ "userId": ObjectId("STUDENT_USER_ID") })

// Delete student
db.students.deleteOne({ "_id": ObjectId("STUDENT_ID") })

// Delete user account
db.users.deleteOne({ "_id": ObjectId("USER_ID") })

// Delete notifications
db.notifications.deleteMany({ "recipientId": ObjectId("STUDENT_ID") })
```

---

## 🔐 Admin Credentials

### Default Credentials (After Running Seed Script)

- **Email:** `admin@placement.edu`
- **Password:** `Admin@123456`

### Security Best Practices

1. **Change Default Password:** Always change the default password after first login
2. **Use Strong Passwords:** Minimum 8 characters with uppercase, lowercase, numbers, and special characters
3. **Don't Share Credentials:** Keep admin credentials secure
4. **Use Environment Variables:** Store credentials in `.env` file (never commit to git)
5. **Regular Audits:** Periodically review admin accounts and remove unused ones

### Resetting Admin Password

If you need to reset an admin password, you can:

1. **Use Forgot Password:** If email is configured, use the forgot password feature
2. **Update via Database:** Directly update in MongoDB:
   ```javascript
   // Hash the new password first (use bcrypt)
   // Then update:
   db.users.updateOne(
     { "email": "admin@placement.edu" },
     { $set: { "password": "hashed_password" } }
   )
   ```
3. **Recreate Admin:** Delete old admin and create new one with seed script

---

## 📝 Notes

- The seed script checks if an admin already exists and won't create duplicates
- Admin accounts are automatically verified (`isVerified: true`)
- Only users with `role: 'admin'` can access admin routes
- Student deletion is permanent and cannot be undone
- All files associated with deleted students are also removed from the server

---

## 🆘 Troubleshooting

### Admin account not created?
- Check MongoDB connection
- Verify `.env` file has correct `MONGODB_URI`
- Check if admin email already exists
- Review console logs for errors

### Cannot delete student?
- Verify you're logged in as admin
- Check if student ID is correct
- Ensure JWT token is valid
- Check server logs for errors

### Forgot admin password?
- Use forgot password feature (if email configured)
- Or recreate admin account using seed script
- Or reset via database (requires database access)

---

## 📞 Support

For issues or questions:
- Check server logs: `server/index.js` console output
- Review API responses for error messages
- Contact system administrator

