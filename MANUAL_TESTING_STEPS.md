# Manual Testing Steps - Inventory Notification System

## Prerequisites

### 1. Ensure SMTP Configuration
**File**: `.env.local`

Verify these lines exist:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ayurshalapanchkarma@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM_NAME=Ayurshala
SMTP_FROM_EMAIL=noreply@ayurshalapanchakarma.com
INVENTORY_NOTIFICATION_EMAIL=ayurshalapanchkarma@gmail.com
```

**If SMTP_PASSWORD is missing:**
1. Go to https://myaccount.google.com/apppasswords
2. Select Mail → Your device type
3. Copy the 16-character password
4. Replace `your-app-password-here` in `.env.local`
5. Save file
6. Restart dev server

---

## TEST 1: Send Test Email

### Steps
1. Open browser to `http://localhost:3000/admin/inventory/settings`
2. Scroll to bottom of page
3. Find section titled **"Test Notification"**
4. Click blue button: **"Send Test Email"**
5. Button should show loading spinner
6. Within 2 seconds, should see success toast

### Verify Success
- ✅ Toast message: "Test email sent successfully! Check your inbox."
- ✅ No error message
- ✅ Button returns to normal state

### Check Email
1. Open Gmail: `https://mail.google.com`
2. Check inbox for new email
3. Subject should be: **"Test Email from Ayurshala Inventory System"**

### Verify Email Content
**Logo**
- [ ] Ayurshala logo visible at top
- [ ] Logo centered
- [ ] Logo NOT broken (not showing alt text)
- [ ] Logo appears correctly sized

**Header**
- [ ] Green background
- [ ] White text: "Inventory Notification"

**Body**
- [ ] "Hello Admin," greeting
- [ ] "Test Email" as notification type
- [ ] "Configuration Verification" as purpose
- [ ] "Sent At" with current date/time

**Button**
- [ ] Green button labeled "Open Inventory"
- [ ] Button is clickable

**Footer**
- [ ] Ayurshala branding visible
- [ ] Copyright notice
- [ ] Automated email notice

### Verify Mobile Rendering
1. Open email on mobile phone (if available)
2. Check that:
   - [ ] Content fits on mobile screen
   - [ ] Logo still visible
   - [ ] Button is clickable
   - [ ] Text is readable

---

## TEST 2: Verify Logo Display

### In Gmail Desktop
1. Open the test email received above
2. Look at the top of the email
3. Should see Ayurshala logo clearly
4. **NOT a broken image**

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Should see logs like:
```
[INVENTORY_NOTIFICATION] TEST - SENT {
  recipient: 'ayurshalapanchkarma@gmail.com',
  reason: 'Manual test from Inventory Settings',
  timestamp: '2026-07-10T14:27:02.812+05:30'
}
```

---

## TEST 3: Test CTA Button

### Steps
1. Open the test email
2. Locate the green "Open Inventory" button
3. Click it

### Verify
- [ ] Browser opens new tab
- [ ] URL is: `https://www.ayurshalapanchakarma.com/admin/inventory`
- [ ] Page loads successfully
- [ ] You're logged in to inventory dashboard

---

## TEST 4: Email Expiry Alerts Toggle

### Prerequisite
Make sure you're in **Inventory Settings** page

### Steps

**Part 1: Verify Enabled**
1. Find the **"Notifications"** section
2. Locate: **"Email Expiry Alerts"**
3. Status should show: **"Enabled"** (green button)
4. Note: This means expiry alerts will be sent

**Part 2: Disable the Toggle**
1. Click the **"Enabled"** button next to "Email Expiry Alerts"
2. Button should change to: **"Disabled"** (gray button)
3. Status should now show disabled

**Part 3: Check Email**
1. Check inbox immediately (refresh if needed)
2. Should receive email with subject: **"Inventory Notifications Disabled"**

### Verify Disabled Notification Email
**Header**: Should be amber/orange color (warning)
**Content Should Include**:
- [ ] "Expiry Alerts" notification type mentioned
- [ ] Timestamp of when disabled
- [ ] Message: "No further emails will be sent until re-enabled"

**Part 4: Trigger Expiry Alert** (if possible)
1. Go to Inventory → Expiring Stock
2. Try to trigger expiry alert (if possible in current data)
3. **Expected**: No email received

**Part 5: Disable Again**
1. Try to disable the toggle again
2. Trigger alert again
3. **Expected**: Still no email (one-time disabled email already sent)

**Part 6: Re-enable**
1. Go back to Settings
2. Click "Disabled" button for "Email Expiry Alerts"
3. Button should change to "Enabled" (green)
4. Trigger alert again
5. **Expected**: Email should be sent again

---

## TEST 5: Email Low Stock Alerts Toggle

Repeat TEST 4 but for **"Email Low Stock Alerts"** instead.

### Quick Verification
- [ ] Toggle OFF → Get "Disabled" email once
- [ ] Trigger alert → No email
- [ ] Toggle ON → Emails resume

---

## TEST 6: Email Purchase Alerts Toggle

Repeat TEST 4 but for **"Email Purchase Alerts"** instead.

### Quick Verification
- [ ] Toggle OFF → Get "Disabled" email once
- [ ] Trigger alert → No email
- [ ] Toggle ON → Emails resume

---

## TEST 7: Verify Logging in Console

### Server Logs
1. Look at terminal where dev server is running
2. After sending test email, should see:
```
[INVENTORY_NOTIFICATION] TEST - SENT {
  recipient: 'ayurshalapanchkarma@gmail.com',
  reason: 'Manual test from Inventory Settings',
  timestamp: '2026-07-10T14:27:02.812+05:30'
}
```

### Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Should see similar logging (depending on how it's configured)

---

## TEST 8: Error Handling

### Test Wrong SMTP Password

**Setup**:
1. Open `.env.local`
2. Change SMTP_PASSWORD to wrong value: `SMTP_PASSWORD=wrong-password-12345678`
3. Save and restart dev server

**Test**:
1. Go to Inventory Settings
2. Click "Send Test Email"
3. Should see error toast message
4. Message should indicate authentication error

**Fix**:
1. Set correct SMTP_PASSWORD back
2. Restart dev server
3. Confirm test email works again

### Test Missing SMTP Credentials

**Setup**:
1. Open `.env.local`
2. Remove the line: `SMTP_PASSWORD=...`
3. Save and restart dev server

**Test**:
1. Go to Inventory Settings
2. Click "Send Test Email"
3. Should see error: "SMTP credentials not configured"

**Fix**:
1. Add SMTP_PASSWORD back
2. Restart dev server

---

## TEST 9: SMTP Verification

### Check Connection in Console
1. Look at server logs after sending email
2. Should NOT see errors like:
   - "SMTP connection error"
   - "Authentication failed"
   - "TLS error"

### Successful Signs
✅ Email arrives within 2 minutes  
✅ Console shows: "Email sent successfully"  
✅ No authentication warnings  
✅ No Gmail blocking messages  

---

## TEST 10: Email Appearance Comparison

### Gmail Desktop
1. Open test email in Gmail desktop
2. Check:
   - [ ] Logo displays
   - [ ] Green header visible
   - [ ] Button clickable
   - [ ] Text formatting correct
   - [ ] Footer visible

### Outlook (if available)
1. If you have Outlook access, check email there
2. Verify same appearance as Gmail

### Apple Mail (if available)
1. If you have Apple Mail, check email there
2. Verify email renders correctly

### Mobile Gmail
1. Open email on phone (Gmail app or browser)
2. Check:
   - [ ] Content fits screen
   - [ ] Logo visible
   - [ ] Button clickable
   - [ ] No layout issues

---

## FINAL VERIFICATION CHECKLIST

### Logo
- [ ] Logo displays in email (not broken)
- [ ] Logo centered
- [ ] Logo visible in multiple email clients
- [ ] Logo visible on mobile

### Email Structure
- [ ] Green header for normal notifications
- [ ] Amber header for disabled notifications
- [ ] White body background
- [ ] Professional spacing
- [ ] Readable on mobile

### Functionality
- [ ] Test email sends successfully
- [ ] Toggle OFF sends "Disabled" email once
- [ ] Toggle OFF then trigger = no email
- [ ] Toggle ON resumes emails
- [ ] CTA button opens correct URL
- [ ] Error messages helpful

### Logging
- [ ] Console logs show notification events
- [ ] Logs include recipient, status, timestamp
- [ ] Logs show SENT/SKIPPED correctly

### SMTP
- [ ] No authentication errors
- [ ] No TLS errors
- [ ] No connection errors
- [ ] Emails arrive within 2 minutes

---

## SUMMARY

Once you complete all tests above and verify:

✅ Test email sends and arrives  
✅ Logo displays correctly  
✅ Toggle OFF → one disabled email  
✅ Toggle OFF → no further emails  
✅ Toggle ON → emails resume  
✅ No SMTP errors  
✅ Logging works  

**Status**: Feature is COMPLETE and VERIFIED ✅

You can then:
1. Merge any changes to production
2. Deploy to Vercel
3. Set production SMTP credentials
4. Test once more in production environment

---

## TROUBLESHOOTING

### Test Email Not Arriving
- [ ] Check spam folder
- [ ] Verify SMTP_PASSWORD is correct app password (not Gmail password)
- [ ] Check `.env.local` is saved
- [ ] Restart dev server
- [ ] Check INVENTORY_NOTIFICATION_EMAIL is correct

### Logo Not Displaying
- [ ] Verify URL is absolute: `https://www.ayurshalapanchakarma.com/ayurshala_text.png`
- [ ] Check image exists at that URL
- [ ] Try opening URL in browser directly
- [ ] Try testing again

### Button Not Clickable
- [ ] Open email in different client (Gmail, Outlook, etc.)
- [ ] Some clients require specific link formatting
- [ ] Check error console for HTML issues

### No Console Logs
- [ ] Refresh browser console
- [ ] Make sure you're on Settings page when testing
- [ ] Check browser console (F12 → Console tab)
- [ ] Check server terminal where `npm run dev` is running

### SMTP Authentication Failed
- [ ] Verify Gmail account can send emails
- [ ] Verify app password is 16 characters
- [ ] Check you used "Mail" app password, not custom
- [ ] Try creating new app password
- [ ] Ensure Gmail account allows less secure apps (if needed)

---

## SUCCESS INDICATION

You'll know everything is working when:

1. **Test Email Arrives**
   - Arrives within 2 minutes
   - Has correct branding
   - Logo displays

2. **Disabled Behavior Works**
   - First disable = get one email
   - Trigger again = no email
   - Re-enable = emails work again

3. **No Errors**
   - No error toasts
   - No console errors
   - SMTP connection successful

4. **Logging Works**
   - Console shows notification events
   - Shows type, recipient, status, timestamp

---

**Ready to test?** Start with TEST 1: Send Test Email

Good luck! 🚀
