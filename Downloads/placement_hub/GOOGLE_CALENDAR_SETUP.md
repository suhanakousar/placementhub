# Google Calendar API Setup Guide

## Configuration Complete ✅

Your Google service account credentials have been configured in the codebase. The system will now use these credentials to create valid Google Meet links.

## Service Account Details

- **Client Email**: `placementhub@placmenthub.iam.gserviceaccount.com`
- **Calendar ID**: `placementhub722@gmail.com`
- **Project ID**: `placmenthub`

## Important: Calendar Sharing Required

⚠️ **CRITICAL**: The calendar `placementhub722@gmail.com` must be shared with the service account email `placementhub@placmenthub.iam.gserviceaccount.com` for the system to work.

### How to Share the Calendar:

1. Go to [Google Calendar](https://calendar.google.com)
2. Click on the calendar `placementhub722@gmail.com` in the left sidebar
3. Click on the three dots (⋮) next to the calendar name
4. Select "Settings and sharing"
5. Under "Share with specific people", click "Add people"
6. Add: `placementhub722@gmail.com`
7. Set permission to **"Make changes to events"** (or at minimum "See all event details")
8. Click "Send"

## Environment Variables (Optional)

If you want to override the default credentials via environment variables, add these to your `.env` file:

```env
GOOGLE_CLIENT_EMAIL=placementhub@placmenthub.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDB+JtLIxi1VZJ2\nNDgYHyEGS+64SrB1NZqZ+dU7foHbwQnS+srTOMOA5+zYv0LFOclsUzJia+P1gB3a\nGuZebM29uA6jtT3jInjt+7rmabACXt20h9YWpSW+MIoZxQbJeijnj9u68YPn0gvf\naWrc4mOOYCaa/N5h68d9mR3If5qv/sVju2TCzI3GfCUNErsz6gvpcFExJOuRpBXm\n6mxGARR3ErtvQyB77YusxaKUpBZ29uMmFbxuXB4UsZRJ6siPhJ5rzmJWAC1x1gl5\nzDEQfqnIFeSaBzayDcCclkGvQOU6Re99KHWBEHk4nszfYAdGZ58QQ5ES8upYg8bm\nIDnmXUD1AgMBAAECggEAL+P2TYcRCOZjhqEub1AyOmiBfEleh1XQga80BSAfJjdj\nOk62yI81f8xjRwFz1heGImNpJ3EtY3X6CNlG4u3YnzyECsnLCZr/gfx6oPxbmz46\nXWIDSuyD5ND9q86gNhrd4gw760xJbbFHwqV3n6kafPLC3VXM/x60To+BEbllowll\nFVYYAeocK93bFaW7iviOG90PL9ou2DRC/IL2dMp2iepBGn72Tah01tNBHm2jqFsF\nQDRPRHWQ6W7HEfJiPDWQx5b/vBQna6Lt1efDvUhhVzBeu0xz0Il/EUHRuzvBZbiE\nwPfLH3Dq/IU/YoQodMPOOp452UHIIRdk5gzUiuRAiQKBgQDrb6aVfWFOuMqQSvPZ\ncA+FFJWYd2QSS+ZP82JKkH5SzLJTj833iSnx4b9g3j2m+YJFzn26O5YcNQusUmgc\n6nWUHQYiE+SM+LqsoWRreAYAg9meQzzNO5q1Mq4kE4EHnzFzFWqhcxecfB0ONxgy\n1sB8g73HZ0+1RKjZ/2grDAWKTQKBgQDS6cxyFXFqTSHwyFtrQa69dKeJ+qZ3tFaU\neEv3xU9AyJAZQs1k9uGjMcEhaBKnEfyaypf7OY0y+pm+VGHLguNRgEFAOrSQKypw\n15K6b9gpDsu4NLuDss9+mLAi4ESEWrt3zi/8Op59BMZQzVlhSEH6UhJXKxJjny1J\ngQcxzXKVSQKBgQDqQCnYPWrvP6/UR68+XmAiwmthyxDXn4sla30VwZTe32pi+Acv\nztrcHwgi4p0nIMR8nkq8XIMrx5+4sjmC48lfOE2c5HwXw3dBQke/Iimeo5GIBVBe\nx3pT5XwcywcrxToXTmzM/M22Vks2lJzQIJpeiVnvKBzHt+vlE1na0thEVQKBgQCQ\nH0EcJ/jzKbfqoA6QMTblsUQW7hc4rxuGotlOex6X5zVIfbR6rJUs/f+6AzLTxV+2\nqn/GJOKOll3eiCy3cz5AYAK2kCb4aPa8WyKhkXHFRJ4Cxs3nxZUyLcYWXueTBaka\nyeNSWQAZ79xQNLJB3q1vDwwHUqBjQM8ibi/rYTdOOQKBgQDNTBnuJgeEIDIN3Jxm\n+zFB0JVf9uGWvkPW+jXnNX72svePlFavB4pyuxWg3aGxAnMivRSsZIzhKCT1YlTb\nJqFq9GcNgiRBIKDjsyvXKs10B3nnrlfbR9pNm5XNMWC6x0GVgDT0j1E5JS8GI9QN\nAg4K95ooWn0LT8pYY8uM5HD8cA==\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=placementhub722@gmail.com
```

**Note**: When setting `GOOGLE_PRIVATE_KEY` in environment variables, make sure to:
- Keep the `\n` characters (they represent newlines)
- Wrap the entire value in quotes
- Or use actual newlines if your environment supports it

## Testing the Configuration

After sharing the calendar, test the configuration by:

1. Creating a new meeting through the admin panel
2. Check the server logs for:
   - `✅ Valid Google Meet link created: https://meet.google.com/...`
   - No permission errors (403)

## Troubleshooting

### Error: "Permission denied (403)"

**Solution**: Make sure the calendar `placementhub722@gmail.com` is shared with `placementhub@placmenthub.iam.gserviceaccount.com` with "Make changes to events" permission.

### Error: "Calendar not found (404)"

**Solution**: 
1. Verify the calendar ID is correct: `placementhub722@gmail.com`
2. Make sure the calendar exists and is accessible
3. Ensure the calendar is shared with the service account

### Error: "Invalid meeting link format"

**Solution**: This should not happen with proper Google Calendar API setup. If it does:
1. Check that Google Calendar API is enabled in Google Cloud Console
2. Verify service account has Calendar API access
3. Check server logs for detailed error messages

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit credentials to version control** - The credentials are currently in the code as defaults, but for production, use environment variables
2. **Rotate keys periodically** - Service account keys should be rotated for security
3. **Limit permissions** - The service account only needs Calendar API access
4. **Monitor usage** - Check Google Cloud Console for API usage and any suspicious activity

## Next Steps

1. ✅ Share the calendar with the service account (see above)
2. ✅ Test creating a meeting
3. ✅ Verify the Google Meet link is valid and works
4. ✅ (Optional) Move credentials to environment variables for production

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify calendar sharing is set up correctly
3. Ensure Google Calendar API is enabled in Google Cloud Console
4. Check that the service account has the correct permissions

