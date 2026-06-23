# PDF Intelligence — Powered by Llama 3.3 70B (Free & Open Source)

Upload any PDF → get interactive insight cards + streaming chat agent. Visitors bring their own free Groq API key — no backend costs for you.

---

## Deploy in 3 minutes (Vercel — free)

```bash
# 1. Unzip and install
unzip pdf-agent-app.zip && cd pdf-agent-app
npm install

# 2. Deploy (no env vars needed — users bring their own key)
npm install -g vercel
vercel
```

That's it. No `.env` file needed. Users enter their own Groq API key directly in the app.

---

## How the user experience works

When someone visits your deployed app:

1. **Welcome screen** — explains what the app does, feature overview
2. **Get key guide** — step-by-step instructions to get a free Groq key at console.groq.com
3. **Setup screen** — paste key, choose model, test it, hit Start
4. **Upload screen** — drag & drop PDF, settings accessible via ⚙️ button
5. **Workspace** — Insights tab (cards) + Chat tab (streaming Q&A)
6. **Settings modal** — change model or key mid-session without losing the PDF

Key is saved in the visitor's **localStorage only** — never sent to your server. You have zero API costs.

---

## User flow diagram

```
Visit → Welcome → "Get Groq Key" guide → Paste key + pick model
  → Upload PDF → Insight Cards (click to expand, filter by topic)
                → Chat Agent (streaming, markdown, suggested prompts)
                → ⚙️ Settings (change model/key anytime)
```

---

## Models available (all free on Groq)

| Model | Speed | Quality | Best for |
|-------|-------|---------|----------|
| Llama 3.3 70B | Fast | ⭐ Best | General use — recommended |
| Llama 3.1 8B Instant | ⚡ Fastest | Good | Quick answers |
| Mixtral 8x7B | Fast | Great | Long documents (32k ctx) |
| Gemma 2 9B | Fast | Good | Google's open model |
| DeepSeek R1 70B | Medium | ⭐ Reasoning | Complex analysis |

---

## Tech stack

- **Next.js 14** (App Router) — framework
- **Groq SDK** — AI inference (user's own key)
- **PDF.js** — browser-side PDF parsing (no file hits server)
- **SSE streaming** — real-time chat responses
- **react-markdown** — formatted AI responses
- **localStorage** — key persistence (browser only)
- **Vercel** — deployment (free tier)

---

## Groq free tier limits (per user)

- 6,000 tokens / minute
- 500 requests / day
- No credit card needed
- Sign up at console.groq.com

---

## Customization

**Add a model:** Edit `GROQ_MODELS` array in `components/ApiKeySetup.tsx`

**More pages:** Change `doc.text.slice(0, 12000)` in `InsightsPanel.tsx` and `ChatPanel.tsx`

**Card types:** Edit `TYPE_STYLES` in `InsightsPanel.tsx`

**Branding:** Edit the app name/colors in `app/globals.css` CSS variables
