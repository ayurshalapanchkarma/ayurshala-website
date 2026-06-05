# Ayurshala Website

## Setup (one-time)

### 1. Install Node.js
Download from https://nodejs.org → choose "LTS" version → install it.

### 2. Install dependencies
Open Terminal, run:
```bash
cd ~/Documents/ayurshala-website
npm install
```

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

---

## Deploy to Vercel (free)

1. Create account at https://github.com → create new repository "ayurshala-website"
2. In Terminal:
```bash
cd ~/Documents/ayurshala-website
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ayurshala-website.git
git push -u origin main
```
3. Go to https://vercel.com → "New Project" → import your GitHub repo → Deploy
4. Your site is live at `ayurshala-website.vercel.app`

---

## Connect GoDaddy domain

1. In Vercel dashboard → your project → Settings → Domains
2. Add `ayurshalapanchakarma.com`
3. Vercel shows you 2 DNS records (A record + CNAME)
4. In GoDaddy → DNS → add those 2 records
5. Wait 10 minutes → your domain is live!

---

## Project structure
```
ayurshala-website/
├── app/
│   ├── layout.tsx      # Root layout + SEO metadata
│   ├── page.tsx        # Main page (wires all sections)
│   └── globals.css     # Glass utilities + fonts
├── components/
│   ├── Navbar.tsx      # Sticky glass navbar
│   ├── Hero.tsx        # Liquid blob hero section
│   ├── About.tsx       # Our story + Panchakarma stages
│   ├── Treatments.tsx  # 8 treatment glass cards
│   ├── FAQ.tsx         # Glass accordion FAQ
│   └── Contact.tsx     # Contact info + footer
└── package.json
```
