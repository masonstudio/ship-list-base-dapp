# Ship List Deployment Notes

App Name: Ship List
Tagline: Check before ship
Description: Save a launch checklist with project name, readiness count, note, wallet, and timestamp on Base before shipping.

## After Base Gives `base:app_id`

Copy the meta tag to Codex. The app id must be written to:

- `src/app/layout.tsx`
- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BASE_APP_ID`

Then deploy once with the project token in `Vercel.txt`, deploy the contract, and write the contract address to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_SHIP_LIST_CONTRACT_ADDRESS`

## After Base Gives Builder Code

Write the Builder Code to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BUILDER_CODE`

Then run production deploy again.

## Required Vercel Production Env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0b3a787abfff0aca7b178d
NEXT_PUBLIC_BUILDER_CODE=replace_with_builder_code
NEXT_PUBLIC_SHIP_LIST_CONTRACT_ADDRESS=replace_with_ship_list_contract_address
```

## Contract

```bash
npm run deploy:contract
```
