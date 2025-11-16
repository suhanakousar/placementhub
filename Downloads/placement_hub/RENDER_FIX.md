# Fix Render Deployment Error

## Error: "Service Root Directory is missing"

If you're still getting this error after setting Root Directory to `server`, try these solutions:

### Solution 1: Clear Build Cache & Manual Deploy

1. In Render Dashboard → Your Service → **Settings**
2. Scroll to **"Build & Deploy"** section
3. Click **"Clear build cache"** (if available)
4. Go to **"Manual Deploy"** → Click **"Deploy latest commit"**

### Solution 2: Verify Root Directory Format

Make sure in Render Settings:
- **Root Directory**: `server` (exactly this, no `/` before or after)
- NOT `/server` or `./server` or `server/`

### Solution 3: Try Alternative Build Command

If the above doesn't work, try changing the Build Command to:

```
cd server && npm install
```

And Start Command to:
```
cd server && npm start
```

Then set **Root Directory** to empty/blank (leave it empty).

### Solution 4: Check Build Logs

1. Go to **"Logs"** tab in Render Dashboard
2. Look for the exact error message
3. Check if it shows the path it's looking for

### Solution 5: Verify Repository Structure

Make sure your GitHub repo has:
```
placementhub/
├── server/
│   ├── index.js
│   ├── package.json
│   └── ...
├── client/
└── ...
```

### Solution 6: Recreate Service

If nothing works:
1. **Delete** the current service
2. **Create a new Web Service**
3. Connect the same repository
4. Set Root Directory to `server`
5. Use these exact commands:
   - Build: `npm install`
   - Start: `npm start`

---

## Quick Test

To verify the directory exists in your repo, check:
https://github.com/suhanakousar/placementhub/tree/master/server

If you can see `index.js` and `package.json` there, the directory exists.

---

## Most Common Fix

**Try this first:**
1. In Render → Settings → **Root Directory**: Make sure it's exactly `server` (no slashes)
2. **Save** the settings
3. Go to **Manual Deploy** → **Deploy latest commit**
4. Check the **Logs** tab to see what happens

If it still fails, check the logs and share the exact error message.

