# Install PWA Locally Without Deployment

You can install and test your PWA locally without deploying! Here are multiple methods:

## Method 1: Install PWA from Localhost (Easiest)

### Step 1: Build the App
```bash
cd client
npm run build
```

### Step 2: Serve Locally
```bash
# Option A: Simple HTTP server (localhost works for PWA)
npm run serve

# Option B: HTTPS server (better for testing)
npm run serve:https
```

### Step 3: Access on Your Device

**For Android:**
1. Make sure your phone and computer are on the same WiFi network
2. Find your computer's local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
3. On your Android phone, open Chrome browser
4. Go to: `http://YOUR_IP_ADDRESS:3000` (e.g., `http://192.168.1.100:3000`)
5. The install button will appear! Click it to install

**For Desktop:**
1. Open Chrome/Edge browser
2. Go to: `http://localhost:3000`
3. Click the install button in the address bar or use the InstallButton component

## Method 2: Generate APK from Local Build (No Deployment Needed)

### Option A: Using PWA Builder CLI (Recommended)

1. **Install PWA Builder CLI:**
```bash
npm install -g @pwabuilder/cli
```

2. **Build your app:**
```bash
cd client
npm run build
```

3. **Generate APK:**
```bash
# From project root
pwabuilder https://localhost:3000 --platform android --output ./apk
```

**Note:** You'll need to serve the build with HTTPS. Use the `serve:https` script or see Method 3 below.

### Option B: Using Bubblewrap (Google's TWA Tool)

1. **Install Bubblewrap:**
```bash
npm install -g @bubblewrap/cli
```

2. **Initialize TWA project:**
```bash
cd client/build
bubblewrap init --manifest manifest.json
```

3. **Build APK:**
```bash
bubblewrap build
```

The APK will be generated in the output directory.

### Option C: Manual APK Generation with PWA Builder

1. **Serve your build locally with HTTPS:**
   - Use `npm run serve:https` (requires certificates)
   - Or use ngrok: `npx ngrok http 3000` (creates public HTTPS URL)

2. **Use PWA Builder website:**
   - Go to https://pwa-builder.com
   - Enter your localhost URL (or ngrok URL)
   - Generate APK

## Method 3: Create HTTPS Certificate for Local Testing

### Quick Self-Signed Certificate:

```bash
# Generate certificate (run in client directory)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# When prompted, just press Enter for all fields (or fill them)
```

Then use:
```bash
npm run serve:https
```

**Note:** Browsers will show a security warning. Click "Advanced" → "Proceed to localhost" to continue.

## Method 4: Use ngrok for Public HTTPS URL (Easiest for PWA Builder)

1. **Install ngrok:**
   - Download from https://ngrok.com
   - Or use: `npm install -g ngrok`

2. **Start your local server:**
```bash
cd client
npm run build
npm run serve
```

3. **Create tunnel:**
```bash
ngrok http 3000
```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Use with PWA Builder:**
   - Go to https://pwa-builder.com
   - Enter your ngrok URL
   - Generate APK instantly!

## Quick Test Checklist

- [ ] App is built (`npm run build`)
- [ ] Server is running (`npm run serve`)
- [ ] Can access on localhost or device IP
- [ ] Install button appears
- [ ] Service worker is registered (check DevTools → Application → Service Workers)
- [ ] Manifest is loaded (check DevTools → Application → Manifest)

## Troubleshooting

**Install button not showing?**
- Make sure you're using HTTPS or localhost (not regular HTTP from network IP)
- Check browser console for errors
- Verify manifest.json is accessible at `/manifest.json`

**Service worker not registering?**
- Check browser console for errors
- Make sure service-worker.js is in the `public` folder
- Clear browser cache and reload

**Can't access from phone?**
- Check firewall settings
- Make sure both devices are on same WiFi
- Try using ngrok for easier access

## Benefits of Local Testing

✅ Test PWA features without deploying
✅ Faster development cycle
✅ No internet required after initial setup
✅ Test on real devices
✅ Generate APK without public deployment

