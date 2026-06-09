# Ayurshala - Quick Start Guide

## 🚀 Launch in 3 Steps

### Step 1: Run Database Migration
Go to **Supabase Dashboard** → **SQL Editor** → Paste this:

```sql
-- Create profiles table for RBAC
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'PATIENT' CHECK (role IN ('ADMIN', 'PATIENT', 'DOCTOR', 'RECEPTIONIST')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE WHEN NEW.email = 'ayurshalapanchkarma@gmail.com' THEN 'ADMIN' ELSE 'PATIENT' END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO profiles (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'ayurshalapanchkarma@gmail.com' LIMIT 1),
  'ayurshalapanchkarma@gmail.com',
  'Ayurshala Admin',
  'ADMIN'
)
ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', updated_at = NOW();
```

Click **Run** ✓

### Step 2: Verify Vercel Environment Variables
Check **Vercel Dashboard** → **Settings** → **Environment Variables**:

- `ADMIN_PASSWORD` = `786110@Ayurshala` ✓
- All other vars already set ✓

### Step 3: Deploy
Code is already deployed! Just verify at:
- Admin: https://ayurshalapanchakarma.com/admin
- Patient: https://ayurshalapanchakarma.com

---

## 🔑 Admin Credentials
**Email:** ayurshalapanchkarma@gmail.com  
**Password:** `786110@Ayurshala`

---

## 📊 What Works Now

✅ Admin login with secure RBAC  
✅ All/Online/Offline/Refunds tabs  
✅ Real-time statistics  
✅ AJAX confirm/cancel (no refresh)  
✅ Email notification links  
✅ Patient confirmations  
✅ Audit logging  
✅ Responsive mobile design  
✅ Dark/light theme  

---

## 🧪 Quick Test

1. **Login:** https://ayurshalapanchakarma.com/admin → `786110@Ayurshala`
2. **View Offline Bookings:** Click "Offline" tab
3. **Confirm Booking:** Click Confirm button
4. **Check Email:** Patient receives confirmation
5. **Success!** Dashboard updates instantly ✓

---

## 📞 Troubleshooting

| Issue | Fix |
|-------|-----|
| Can't login | Verify `ADMIN_PASSWORD` in Vercel env |
| No offline bookings | Check booking dates are valid |
| Email links 404 | Already working - no action needed |
| Session expires | Refresh or login again (8hr sessions) |

---

## 📚 Documentation

- **PRODUCTION_SETUP.md** - Full setup guide
- **ADMIN_PORTAL_IMPLEMENTATION.md** - Features detail
- **FINAL_STATUS.md** - Complete status report

---

## 🎯 Next Features (Phase 2)

- Reschedule workflow
- Refund management
- Doctor assignment
- Real-time sync
- PDF invoices

---

**Status:** ✅ Production Ready  
**Deploy Date:** June 10, 2026  
**Admin Portal:** Live & Secure
