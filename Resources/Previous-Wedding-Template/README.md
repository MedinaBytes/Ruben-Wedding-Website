# Natalia & András — Wedding Invitation

Interactive wedding invitation — single HTML file, no dependencies.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Full invitation (photos embedded) |
| `vercel.json` | Vercel routing config |
| `README.md` | This file |

---

## Deploy: GitHub + Vercel

### Step 1 — Push to GitHub

```bash
git clone https://github.com/MedinaBytes/Natalia-and-Andras.git
cd Natalia-and-Andras

# copy index.html, vercel.json, README.md into this folder

git add index.html vercel.json README.md
git commit -m "Wedding invitation"
git push origin main
```

### Step 2 — Vercel

1. Go to vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import: MedinaBytes/Natalia-and-Andras
4. Framework Preset: Other
5. Click Deploy

Live at: https://natalia-and-andras.vercel.app

### Step 3 — Future updates

```bash
git add index.html
git commit -m "Update"
git push
```
Vercel auto-deploys on every push.
