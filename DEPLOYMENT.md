# Deployment Guide

## 1. Create Neon database
- Create a Neon project
- Copy the Postgres connection string
- Add it to `.env.local` and Vercel as `DATABASE_URL`

## 2. Run locally
npm install
npm run dev

## 3. Test locally
- Home: http://localhost:3000
- Admin: http://localhost:3000/admin
- Transparency: http://localhost:3000/transparency

## 4. Deploy to Vercel
npm i -g vercel
vercel
vercel --prod

## 5. Add env vars in Vercel
- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_PHANTOM_APP_ID
- NEXT_PUBLIC_ADMIN_WALLET
- DATABASE_URL
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- EMAIL_FROM
- EMAIL_TO

## 6. Point GoDaddy domain
Add a DNS CNAME:
- Host: app
- Points to: cname.vercel-dns.com
