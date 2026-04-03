# JTRUMPHQ Monitor

Phantom-connected monitoring dashboard for JTRUMP.

## Features in this skeleton
- Phantom connect button
- Signature-based admin auth flow stubs
- Wallet registry for JTRUMP official wallets
- Admin dashboard shell
- Public transparency page
- API routes for nonce/verify/metrics/test alert
- Telegram notifier service
- Env template
- Deployment guide

## Monitored wallets
- Liquidity Pool: 5VVSAwe3tjc9atop9axBouYmvg655vR2TTBrSzX59xhH
- Treasury 1: F4j7a2D97ARoEzq7cmHQRo6f6g65uEqqJnaRSHDMzt8Z
- Treasury 2: EZfewNuJ6Z27XocUPocFmY726MEcg18U5BQyTZMYaqXg
- Treasury 3: Btq97dtDz5kkrBU8gNqZgUqWnSZKv8Dxtwfi4VmVKfix
- Treasury 4: J2zkT1iBEoryESwzxkcwK9bcFojbDk5k4Sf9G4ZcyPf
- Dev Wallet / Admin Wallet: 66ARrnfF4fCfqxhVcuWDhZwjGY6CpjwBZddZECQXYZzE
- Community Incentives: Brby6NMSJ8iTFJ17n4QgZrFfvAMBKXdkWWbEyperzxDM

## Quick start
1. Copy `.env.example` to `.env.local`
2. Fill in your Neon, Telegram, and domain values
3. Run:
   npm install
   npm run dev
4. Visit:
   - http://localhost:3000
   - http://localhost:3000/admin
   - http://localhost:3000/transparency
