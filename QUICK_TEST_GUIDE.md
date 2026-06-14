# Quick Test Guide - Cash Collection Workflow

## How to Test the Fix

### Prerequisites
- Admin account with access to bookings dashboard
- At least one booking with `CASH_ON_ARRIVAL` payment method
- Booking status should be `CONFIRMED` or similar (with cash collection action available)

---

## Test Workflow

### Step 1: Access Admin Dashboard
1. Navigate to `/admin`
2. Authenticate with admin credentials
3. You should see list of bookings

### Step 2: Find Cash Pending Booking
1. Look for bookings with:
   - Payment Method: `CASH_ON_ARRIVAL` or similar
   - Status: `CONFIRMED` 
   - Action Button: `Collect Cash` (green button)

### Step 3: Click "Collect Cash" Button
1. Find booking with pending cash collection
2. Click the green "Collect Cash" button
3. **Modal should appear** with:
   - Title: "Collect Cash Payment"
   - Booking ID
   - Expected Amount
   - Input field: "Amount Collected (₹)"
   - Textarea: "Notes (optional)"
   - Two buttons: "Confirm Cash" (green) and "Cancel"

### Step 4: Enter Amount and Submit
1. **Enter amount** in "Amount Collected" field (must be > 0)
2. **Optionally add note** (e.g., "Discount applied", "Partial payment")
3. **Click "Confirm Cash"** button
4. Button should show "Processing..." while submitting
5. Wait 2-3 seconds for API response

### Step 5: Verify Success Notification
After successful submission, you should see:
- **Green success modal** (center of screen) with:
  - ✅ Checkmark icon (green circle)
  - Title: "Success!"
  - Message: "Cash of ₹{AMOUNT} received successfully."
  - Amount should match what you entered
  - Button: "Return to Bookings" (green)

### Step 6: Return to Bookings
1. **Click "Return to Bookings"** button
2. Should redirect to admin dashboard (`/admin`)
3. Booking list should refresh
4. Updated booking should show:
   - Payment Status: `PAID` (instead of `CASH_PENDING`)
   - Collected amount reflected

---

## Expected Behaviors

### ✅ Button Disabled During Processing
- Confirm Cash button should be disabled while request is in progress
- Button text changes to "Processing..."
- Cannot click multiple times to create duplicate payments

### ✅ Modal Closes After Success
- Cash collection modal automatically closes
- No manual close needed
- Success modal appears instead

### ✅ Success Amount Matches Input
- If you enter ₹5000, notification shows "Cash of ₹5000"
- Amount is not modified

### ✅ Theme Compatibility
- Test in both Light and Dark themes (toggle theme)
- Success modal colors change appropriately
- All text remains readable in both themes
- Error toast (if triggered) also works in both themes

### ✅ Booking Instantly Reflects Changes
- After clicking "Return to Bookings"
- Booking status immediately shows as PAID
- No page refresh required
- Amount paid is visible in booking details

---

## Error Testing (Optional)

### Test Invalid Amount
1. Open cash collection modal
2. Try to enter 0 or negative amount
3. Click "Confirm Cash"
4. **Expected:** Error message displayed
5. **Expected:** Payment not processed

### Test Network Error (Simulated)
1. Open Dev Tools (F12)
2. Go to Network tab
3. Check "Offline" or "Slow 3G"
4. Click "Confirm Cash"
5. **Expected:** Error notification appears
6. **Expected:** "Error processing payment" message
7. **Expected:** Notification auto-clears after 5 seconds

---

## Dark Theme Test

1. Toggle theme to Dark mode (usually in navbar)
2. Repeat full workflow above
3. Verify:
   - Success modal background is dark
   - Text is readable (white/light gray)
   - Checkmark icon is visible
   - Error toast (if any) is properly styled
   - All buttons work correctly

---

## Database Verification (Admin/Developer)

After successful cash collection, check database:

```sql
SELECT * FROM bookings_new 
WHERE booking_id = '[YOUR_BOOKING_ID]'
LIMIT 1;
```

Should see:
- `payment_status`: `'PAID'` (was `'CASH_PENDING'`)
- `amount_paid`: value you entered
- `cash_collection_note`: note you entered (if any)
- `updated_at`: recent timestamp
- Payment method unchanged: `'CASH_ON_ARRIVAL'`

---

## Revenue Dashboard Check

1. Go to Admin Dashboard
2. Check top stats:
   - "Total Revenue" should increase
   - "Cash Collection" count increases
   - "Net Revenue" updates

3. Check "Revenue" section if available
4. Daily revenue report should show new entry

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Button doesn't respond | Check if already processing, wait for response |
| No modal appears | Check console (F12) for errors, verify booking ID |
| Success modal stuck | Refresh page, or click Return to Bookings |
| Theme not switching | Clear browser cache, try different browser |
| Amount not saving | Verify amount > 0, check network in Dev Tools |

---

## Test Completion Checklist

- [ ] Success modal appears after Confirm Cash
- [ ] Amount in message matches entered amount
- [ ] Return to Bookings button works
- [ ] Booking status changes to PAID
- [ ] No manual page refresh needed
- [ ] Works in Light theme
- [ ] Works in Dark theme
- [ ] Button disabled during processing
- [ ] Only one payment record created
- [ ] Revenue dashboard updated

**All tests passed? ✅ Fix is working correctly!**
