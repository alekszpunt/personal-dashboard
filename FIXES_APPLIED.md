# Dashboard Fixes Applied

**Date:** 16 May 2026
**Fixed by:** Fred (OpenClaw agent)

---

## ✅ Bug #1: Email tab timing out on Vercel

**What was wrong:**
- IMAP connection + email fetch + Claude summarization took 10-20 seconds
- Vercel Hobby plan has 10s timeout → route silently fails

**Fix applied:**
- Added `export const maxDuration = 60` to `/app/api/email/route.ts` and `/app/api/email/reply/route.ts`
- ⚠️ **Requires Vercel Pro plan** for >10s functions (or split the work into separate API calls)

---

## ✅ Bug #2: Email body preview broken for HTML-only emails

**What was wrong:**
- Fetched `bodyParts: [{ key: "1" }]` which only works for plain text emails
- HTML-only emails showed empty or garbled previews

**Fix applied:**
- Changed to `bodyParts: ["TEXT"]` which extracts readable text regardless of email structure
- Updated preview extraction to use `msg.bodyParts?.get("TEXT")`

---

## ✅ Bug #3: TrueLayer tokens expire after 1 hour

**What was wrong:**
- Only `access_token` was saved, not `refresh_token`
- After 1 hour, all balance/transaction fetches failed silently (401)

**Fix applied:**
- Updated callback route to save `refresh_token`
- Added refresh logic to `balance/route.ts` and `transactions/route.ts`:
  - Detects 401 responses
  - Calls TrueLayer refresh endpoint
  - Updates Supabase with new access token
  - Retries the original request

**⚠️ Database migration required:**
Run `SUPABASE_MIGRATION.sql` to add `refresh_token` column to `bank_tokens` table.

---

## ✅ Bug #4: Goals not interactive

**What was wrong:**
- `goals` array was a const, not state
- `done` field hardcoded to `false`
- No click handler to toggle goals

**Fix applied:**
- Converted to `useState` with proper Goal type
- Added `toggleGoal()` function
- Wrapped checkbox in `<button>` with onClick handler
- Added hover effect for better UX

---

## ✅ Bug #5: Tasks and Goals reset on page reload

**What was wrong:**
- State only lived in memory (useState)
- Refreshing the page wiped all changes

**Fix applied:**
- Added localStorage persistence to both Tasks and Goals components
- On mount: load from `localStorage.getItem("dashboard-tasks")` / `"dashboard-goals"`
- On every state change: save to localStorage
- Handles parse errors gracefully

---

## ✅ Bug #6: Priority dropdown looks broken on dark themes

**What was wrong:**
- Native `<select>` with `bg-transparent` doesn't work
- Browser-rendered `<option>` elements ignore CSS and show white/grey background
- Unreadable on dark glass aesthetic

**Fix applied:**
- Replaced `<select>` with custom button-group toggle
- Three buttons (High / Med / Low) with colored backgrounds when active
- Matches the glass design system
- Better mobile UX too

---

## 🚀 Next Steps

1. **Deploy to Vercel:**
   - Commit and push changes
   - Vercel will auto-deploy

2. **Add database column:**
   - Go to Supabase SQL editor
   - Run `SUPABASE_MIGRATION.sql`

3. **Upgrade Vercel plan (if needed):**
   - Email routes need >10s timeout
   - Either upgrade to Pro, or split IMAP + Claude into separate calls

4. **Reconnect banks:**
   - After database migration, reconnect each bank via TrueLayer OAuth
   - This ensures refresh tokens are saved

---

## Files Changed

- `app/components/Goals.tsx` — interactive goals + localStorage
- `app/components/Tasks.tsx` — localStorage + better priority selector
- `app/api/email/route.ts` — maxDuration + TEXT bodyParts
- `app/api/email/reply/route.ts` — maxDuration
- `app/api/truelayer/callback/route.ts` — save refresh_token
- `app/api/truelayer/balance/route.ts` — auto-refresh logic
- `app/api/truelayer/transactions/route.ts` — auto-refresh logic

---

All bugs from `BUGS.md` have been addressed. The dashboard should now be stable and persistent! 🎉
