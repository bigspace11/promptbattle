# Prompt Battle — BigSpaceAI

A browser-based AI prompting game. Students write prompts, Claude judges them, badges are earned.

## 🚀 Deploy to Vercel (5 minutes)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create prompt-battle --public --push
```

### 2. Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your prompt-battle GitHub repo
3. Framework preset: Vite
4. Click Deploy

### 3. Add your API Key
1. Vercel dashboard → Settings → Environment Variables
2. Name: ANTHROPIC_API_KEY  |  Value: sk-ant-...
3. Save → Redeploy

## 💻 Run Locally

```bash
npm install
cp .env.example .env        # add your ANTHROPIC_API_KEY
npm run dev:server           # terminal 1 — proxy
npm run dev                  # terminal 2 — frontend
```

Visit http://localhost:5173

## Project Structure

```
prompt-battle/
├── api/chat.js              Vercel serverless proxy
├── src/PromptBattle.jsx     Main game (all-in-one)
├── server.js                Local Express proxy
├── vercel.json              Vercel routing
└── .env.example             Env template
```

Built by BigSpaceAI · bigspaceai.com
