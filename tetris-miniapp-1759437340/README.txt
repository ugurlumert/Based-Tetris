# TetriTiny — Farcaster Mini App (No-code friendly)

This folder contains a ready-to-deploy Mini App:
- A simple Tetris game (HTML/JS/CSS)
- Farcaster manifest at `/.well-known/farcaster.json`
- `vercel.json` so Vercel serves the manifest properly

## 1) Put this on GitHub
1. Create a new GitHub repo (public).
2. Upload all files in this folder (drag & drop in the GitHub web UI).

## 2) Deploy to Vercel
1. Go to Vercel → Import Project → pick your GitHub repo.
2. Framework preset: "Other". Build command: leave empty. Output directory: leave empty (root).
3. Deploy. You will get a URL like `https://YOURAPP.vercel.app`.

## 3) Fix the manifest URLs (one-time)
1. In GitHub, open `/.well-known/farcaster.json` and click "Edit".
2. Replace both `https://REPLACE_ME/` with your real Vercel URL (including trailing slash).
   - `icon` should be `https://YOURAPP.vercel.app/icon.png`
   - `website` should be `https://YOURAPP.vercel.app/`
3. Commit changes. Vercel redeploys automatically.
4. Open `https://YOURAPP.vercel.app/.well-known/farcaster.json` to verify it loads.

## 4) Use it on Farcaster
- Post a cast that includes your app URL. People can open and play inside the Farcaster Mini Apps experience.
- To be listed/highlighted, engagement matters — keep iterating and sharing!

Good luck and have fun! 🎮
