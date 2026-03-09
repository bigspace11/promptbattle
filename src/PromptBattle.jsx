import { useState, useEffect } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";

const LEVELS = {
  beginner:     { label: "BEGINNER",     emoji: "🌱", passMark: 65, badge: "PROMPT SEEDLING",     desc: "Just starting out with AI prompts" },
  intermediate: { label: "INTERMEDIATE", emoji: "⚡", passMark: 72, badge: "PROMPT PRACTITIONER", desc: "Comfortable with the basics" },
  advanced:     { label: "ADVANCED",     emoji: "🔥", passMark: 80, badge: "PROMPT MASTER",       desc: "Ready to go deep" }
};

const H = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, textTransform: "uppercase" };

async function callAPI(body) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function subscribeToMailchimp(email, name, score, level) {
  const response = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, score, level })
  });
  return response.json();
}

async function generateChallenge(level) {
  const data = await callAPI({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You are a creative challenge designer for an AI prompting skills game called Prompt Battle by BigSpaceAI. Generate a single unique, practical, and interesting prompting challenge appropriate for the difficulty level.

BEGINNER challenges: Simple, everyday tasks. Explaining things to non-technical people, writing basic content, rewriting or improving text. Real-world relatable scenarios.
INTERMEDIATE challenges: Tasks requiring role-play, format control, tone shifting, or multi-part outputs.
ADVANCED challenges: Complex tasks requiring chain-of-thought, multi-step reasoning, persona architecture, self-critique loops, or framework construction.

Make challenges varied — draw from business, marketing, HR, education, tech, food, travel, creativity, relationships, health, finance. Never repeat the same scenario twice.

Return ONLY valid JSON, no markdown, no preamble:
{
  "title": "THE [2-3 WORD NAME IN CAPS]",
  "scenario": "Clear 1-2 sentence description of exactly what the student needs to get an AI to do",
  "hint": "Think about: [3 specific prompting considerations relevant to this challenge]",
  "evaluationFocus": "comma-separated list of 3 prompting skills this tests"
}`,
    messages: [{ role: "user", content: `Generate a ${level} level challenge. Be creative and unexpected — avoid coffee mugs, WiFi explanations, or water reminder apps.` }]
  });
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

async function judgePrompt(challenge, userPrompt, level) {
  const data = await callAPI({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: `You are a senior AI trainer at BigSpaceAI, a leading AI education company in Singapore. You speak in first person as a human expert — never mention AI, Claude, or any language model. Your tone is direct, encouraging, and professional.

Score on four criteria (each 0-25):
- Clarity: Is the instruction clear and unambiguous?
- Specificity: Does it provide enough detail and constraints?
- Awareness: Does it show understanding of audience and context?
- Craft: Does it use good prompting techniques like role-setting, format control, chain-of-thought, or constraints?

Do NOT penalise for spelling or grammar errors.

For scoreReasons: one honest sentence per category explaining exactly why they got that score.
For rewrittenPrompt: rewrite their prompt to show what a high-scoring version looks like.
For rewriteNote: one sentence on the single most important change made.

Return ONLY valid JSON, no markdown, no preamble:
{
  "scores": { "clarity": 0-25, "specificity": 0-25, "awareness": 0-25, "craft": 0-25 },
  "scoreReasons": { "clarity": "...", "specificity": "...", "awareness": "...", "craft": "..." },
  "total": 0-100,
  "grade": "Needs Work|Getting There|Solid|Excellent|Outstanding",
  "verdict": "2-3 sentence expert feedback in first person, warm but honest",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "proTip": "one specific actionable tip",
  "rewrittenPrompt": "the improved version of their prompt",
  "rewriteNote": "one sentence on the key change made"
}`,
    messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nEVALUATION FOCUS: ${challenge.evaluationFocus}\nLEVEL: ${level}\n\nSTUDENT PROMPT:\n${userPrompt}` }]
  });
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

const GridBg = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
);
const RedBar = () => <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: RED, zIndex: 100 }} />;
const Logo = () => <div style={{ display: "flex", alignItems: "center" }}><img src="/logo2.png" alt="BigSpaceAI" style={{ height: "36px", width: "auto" }} /></div>;

function ScoreBar({ label, value, reason, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setWidth(value / 25 * 100); setShow(true); }, delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ ...H, fontSize: "15px", letterSpacing: "0.06em", color: "#aaa" }}>{label}</span>
        <span style={{ ...H, fontSize: "16px", color: value >= 20 ? RED : value >= 15 ? WHITE : GREY }}>{value}/25</span>
      </div>
      <div style={{ background: "#1f1f1f", height: "6px", marginBottom: reason ? "10px" : "0" }}>
        <div style={{ width: `${width}%`, height: "100%", background: RED, transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }} />
      </div>
      {reason && show && (
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: value >= 20 ? "#888" : "#666", lineHeight: "1.6", borderLeft: `2px solid #2a2a2a`, paddingLeft: "10px" }}>{reason}</p>
      )}
    </div>
  );
}

function LeadGate({ level, scores, onComplete }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !email.includes("@")) return;
    setLoading(true);
    try {
      await subscribeToMailchimp(email, name, scores.total, level);
      onComplete(name, email);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ border: `2px solid ${RED}`, background: "#0d0d0d", padding: "36px", marginBottom: "16px", textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "16px" }}>🎯</div>
      <div style={{ ...H, fontSize: "24px", letterSpacing: "0.06em", color: WHITE, marginBottom: "12px" }}>GET YOUR FULL SESSION REPORT</div>
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "15px", color: GREY, lineHeight: "1.7", marginBottom: "28px", maxWidth: "420px", margin: "0 auto 28px" }}>
        You've completed 2 challenges. Enter your details to unlock your personalised session report and continue playing.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "360px", margin: "0 auto" }}>
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name"
          style={{ background: "#111", border: "1px solid #333", color: WHITE, fontSize: "15px", padding: "14px 16px", fontFamily: "'Barlow', sans-serif", width: "100%" }}
        />
        <input
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          type="email"
          style={{ background: "#111", border: "1px solid #333", color: WHITE, fontSize: "15px", padding: "14px 16px", fontFamily: "'Barlow', sans-serif", width: "100%" }}
        />
        {error && <p style={{ color: RED, fontFamily: "'Barlow', sans-serif", fontSize: "13px" }}>{error}</p>}
        <button
          onClick={submit}
          disabled={loading || !name.trim() || !email.trim() || !email.includes("@")}
          style={{ background: (!name.trim() || !email.trim() || !email.includes("@")) ? "#222" : RED, border: "none", color: (!name.trim() || !email.trim() || !email.includes("@")) ? "#555" : WHITE, ...H, fontSize: "16px", letterSpacing: "0.12em", padding: "16px", cursor: "pointer", width: "100%" }}
        >
          {loading ? "SAVING..." : "UNLOCK MY REPORT →"}
        </button>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "11px", color: "#444", marginTop: "4px" }}>No spam. Just your results and occasional AI tips from BigSpaceAI.</p>
      </div>
    </div>
  );
}

function SessionReport({ history, userName }) {
  const avg = Math.round(history.reduce((s, r) => s + r.total, 0) / history.length);
  const avgClarity = Math.round(history.reduce((s, r) => s + r.scores.clarity, 0) / history.length);
  const avgSpec = Math.round(history.reduce((s, r) => s + r.scores.specificity, 0) / history.length);
  const avgAware = Math.round(history.reduce((s, r) => s + r.scores.awareness, 0) / history.length);
  const avgCraft = Math.round(history.reduce((s, r) => s + r.scores.craft, 0) / history.length);
  const strongest = [["Clarity", avgClarity], ["Specificity", avgSpec], ["Awareness", avgAware], ["Craft", avgCraft]].sort((a, b) => b[1] - a[1]);
  const trend = history.length > 1 ? history[history.length - 1].total - history[0].total : 0;

  return (
    <div style={{ border: "1px solid #1f1f1f", borderTop: `3px solid ${RED}`, padding: "28px", marginBottom: "16px" }}>
      <div style={{ ...H, fontSize: "13px", letterSpacing: "0.2em", color: RED, marginBottom: "20px" }}>📊 YOUR SESSION REPORT{userName ? ` — ${userName.toUpperCase()}` : ""}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#111", padding: "20px", textAlign: "center" }}>
          <div style={{ ...H, fontSize: "42px", color: RED }}>{avg}</div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: GREY }}>Average score</div>
        </div>
        <div style={{ background: "#111", padding: "20px", textAlign: "center" }}>
          <div style={{ ...H, fontSize: "42px", color: trend > 0 ? RED : WHITE }}>{trend > 0 ? `+${trend}` : trend === 0 ? "—" : trend}</div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: GREY }}>Score trend</div>
        </div>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ ...H, fontSize: "12px", letterSpacing: "0.15em", color: WHITE, marginBottom: "12px" }}>CHALLENGE SCORES</div>
        {history.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: GREY }}>Challenge {i + 1}</span>
            <span style={{ ...H, fontSize: "18px", color: r.total >= 70 ? RED : WHITE }}>{r.total}</span>
          </div>
        ))}
      </div>
      <div style={{ background: "#111", padding: "16px 20px" }}>
        <div style={{ ...H, fontSize: "11px", letterSpacing: "0.15em", color: WHITE, marginBottom: "10px" }}>SKILL BREAKDOWN</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {strongest.map(([name, score], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: i === 0 ? WHITE : GREY }}>{name}</span>
              <span style={{ ...H, fontSize: "13px", color: i === 0 ? RED : GREY }}>{score}/25</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #222" }}>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY }}>Strongest: </span>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: WHITE }}>{strongest[0][0]}</span>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY }}> · Needs work: </span>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: WHITE }}>{strongest[strongest.length - 1][0]}</span>
        </div>
      </div>
    </div>
  );
}

export default function PromptBattle() {
  const [screen, setScreen] = useState("home");
  const [level, setLevel] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [challengeCount, setChallengeCount] = useState(0);
  const [resultHistory, setResultHistory] = useState([]);
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [userName, setUserName] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [bestScore, setBestScore] = useState(null);

  const pickChallenge = async (lvl, isRetry = false) => {
    setLevel(lvl);
    setUserPrompt("");
    setResults(null);
    setError(null);
    if (!isRetry) {
      setRetryCount(0);
      setBestScore(null);
      setScreen("generating");
      try {
        const c = await generateChallenge(lvl);
        setChallenge(c);
        setScreen("challenge");
      } catch {
        setError("Failed to generate challenge. Try again.");
        setScreen("level");
      }
    } else {
      setScreen("challenge");
    }
  };

  const submit = async () => {
    if (userPrompt.trim().length < 20) return;
    setScreen("judging");
    try {
      const r = await judgePrompt(challenge, userPrompt, level);
      setResults(r);
      if (!bestScore || r.total > bestScore) setBestScore(r.total);
      if (!isRetry) {
        const newCount = challengeCount + 1;
        setChallengeCount(newCount);
        setResultHistory(prev => [...prev, r]);
        if (newCount === 2 && !leadCaptured) {
          setShowLeadGate(true);
        }
      }
      setScreen("results");
    } catch {
      setError("Connection failed. Try again.");
      setScreen("challenge");
    }
  };

  const isRetry = retryCount > 0;

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    pickChallenge(level, true);
  };

  const handleNextChallenge = () => {
    setChallengeCount(prev => prev + 1);
    pickChallenge(level);
  };

  const handleLeadComplete = (name, email) => {
    setUserName(name);
    setLeadCaptured(true);
    setShowLeadGate(false);
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: BLACK, color: WHITE, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BLACK}; }
        textarea:focus { outline: none; border-color: ${RED} !important; }
        input:focus { outline: none; border-color: ${RED} !important; }
        button:hover { opacity: 0.88; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <RedBar />
      <GridBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 0 0" }}>
          <Logo />
          {screen !== "home" && screen !== "generating" && screen !== "judging" && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {challengeCount > 0 && (
                <span style={{ ...H, fontSize: "12px", color: GREY, letterSpacing: "0.1em" }}>
                  {challengeCount} DONE
                </span>
              )}
              <button onClick={() => setScreen("home")} style={{ background: "transparent", border: "1px solid #333", color: GREY, fontFamily: "'Barlow', sans-serif", fontSize: "12px", padding: "6px 14px", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>← HOME</button>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );

  if (screen === "home") return wrap(
    <div style={{ animation: "fadeUp 0.6s ease forwards", paddingTop: "64px" }}>
      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", letterSpacing: "0.25em", color: RED, textTransform: "uppercase", marginBottom: "20px" }}>AI CREATOR TOOLKIT</div>
      <h1 style={{ ...H, fontSize: "clamp(64px, 14vw, 108px)", lineHeight: "0.95", marginBottom: "8px", color: WHITE }}>PROMPT<br /><span style={{ color: RED }}>BATTLE.</span></h1>
      <div style={{ width: "60px", height: "4px", background: RED, margin: "24px 0" }} />
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "17px", lineHeight: "1.7", color: GREY, maxWidth: "480px", marginBottom: "48px" }}>Test your AI prompting skills. Write prompts. Get reviewed by our expert panel. Earn your badge.</p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "52px" }}>
        {["✍️ WRITE A PROMPT", "🔬 EXPERTS ANALYSE IT", "📊 GET SCORED", "🏆 EARN A BADGE"].map((s, i) => (
          <div key={i} style={{ border: "1px solid #222", padding: "8px 14px", ...H, fontSize: "12px", letterSpacing: "0.1em", color: GREY }}>{s}</div>
        ))}
      </div>
      <button onClick={() => { setChallengeCount(0); setResultHistory([]); setLeadCaptured(false); setUserName(""); setScreen("level"); }} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", letterSpacing: "0.12em", padding: "18px 48px", cursor: "pointer" }}>START BATTLE →</button>
      <div style={{ marginTop: "64px", borderTop: "1px solid #1a1a1a", paddingTop: "24px" }}>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: "#444", letterSpacing: "0.05em" }}>Part of the BigSpaceAI AI Prompting Essentials course</p>
      </div>
    </div>
  );

  if (screen === "level") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease forwards", paddingTop: "48px" }}>
      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", letterSpacing: "0.25em", color: RED, textTransform: "uppercase", marginBottom: "16px" }}>SELECT DIFFICULTY</div>
      <h2 style={{ ...H, fontSize: "clamp(42px, 9vw, 64px)", lineHeight: "1", marginBottom: "8px" }}>HOW CONFIDENT<br />ARE YOU?</h2>
      <div style={{ width: "40px", height: "4px", background: RED, marginBottom: "40px" }} />
      {error && <p style={{ color: RED, fontFamily: "'Barlow', sans-serif", fontSize: "14px", marginBottom: "20px" }}>{error}</p>}
      {Object.entries(LEVELS).map(([key, cfg], i) => (
        <button key={key} onClick={() => pickChallenge(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", border: "1px solid #222", borderLeft: `4px solid ${i === 0 ? "#333" : i === 1 ? "#555" : RED}`, padding: "24px 28px", marginBottom: "12px", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.borderLeftColor = RED; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = i === 0 ? "#333" : i === 1 ? "#555" : RED; }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "22px" }}>{cfg.emoji}</span>
              <span style={{ ...H, fontSize: "26px", letterSpacing: "0.06em", color: WHITE }}>{cfg.label}</span>
            </div>
            <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: GREY }}>{cfg.desc} · Pass mark: {cfg.passMark}/100</div>
          </div>
          <span style={{ color: RED, fontSize: "28px", ...H }}>→</span>
        </button>
      ))}
    </div>
  );

  if (screen === "generating") return wrap(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ width: "64px", height: "64px", border: `3px solid #222`, borderTop: `3px solid ${RED}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "32px" }} />
      <h2 style={{ ...H, fontSize: "36px", letterSpacing: "0.06em", marginBottom: "16px" }}>GENERATING CHALLENGE...</h2>
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: GREY }}>Creating a fresh challenge just for you</p>
    </div>
  );

  if (screen === "challenge" && challenge) {
    const cfg = LEVELS[level];
    return wrap(
      <div style={{ animation: "fadeUp 0.5s ease forwards", paddingTop: "40px" }}>
        {retryCount > 0 && bestScore && (
          <div style={{ background: "#111", border: "1px solid #222", borderLeft: `4px solid ${RED}`, padding: "12px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: GREY }}>Attempt {retryCount + 1} · Best score so far</span>
            <span style={{ ...H, fontSize: "22px", color: RED }}>{bestScore}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "32px" }}>
          <span style={{ background: RED, ...H, fontSize: "12px", letterSpacing: "0.15em", color: WHITE, padding: "4px 12px" }}>{cfg.emoji} {cfg.label}</span>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY, letterSpacing: "0.08em", textTransform: "uppercase" }}>{challenge.title}</span>
        </div>
        <div style={{ border: "1px solid #222", borderTop: `3px solid ${RED}`, padding: "28px", marginBottom: "20px" }}>
          <div style={{ ...H, fontSize: "12px", letterSpacing: "0.2em", color: RED, marginBottom: "16px" }}>YOUR CHALLENGE</div>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "17px", lineHeight: "1.75", color: WHITE, marginBottom: "24px", fontWeight: "500" }}>{challenge.scenario}</p>
          <div style={{ background: "#111", borderLeft: `3px solid ${RED}`, padding: "14px 18px" }}>
            <div style={{ ...H, fontSize: "11px", letterSpacing: "0.2em", color: RED, marginBottom: "6px" }}>HINT</div>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: GREY, lineHeight: "1.7" }}>{challenge.hint}</p>
          </div>
        </div>
        <div style={{ border: "1px solid #222", padding: "28px", marginBottom: "20px" }}>
          <div style={{ ...H, fontSize: "12px", letterSpacing: "0.2em", color: RED, marginBottom: "16px" }}>WRITE YOUR PROMPT</div>
          <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Write your prompt here. Be specific, set context, define the output format..." style={{ width: "100%", minHeight: "160px", background: "#0f0f0f", border: "1px solid #2a2a2a", color: WHITE, fontSize: "15px", lineHeight: "1.7", padding: "16px", fontFamily: "'Barlow', sans-serif", resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: userPrompt.length < 20 ? RED : "#555" }}>{userPrompt.length < 20 ? `${20 - userPrompt.length} more chars needed` : `${userPrompt.length} characters`}</span>
            <button onClick={submit} disabled={userPrompt.trim().length < 20} style={{ background: userPrompt.trim().length < 20 ? "#222" : RED, border: "none", color: userPrompt.trim().length < 20 ? "#555" : WHITE, ...H, fontSize: "16px", letterSpacing: "0.12em", padding: "14px 32px", cursor: userPrompt.trim().length < 20 ? "not-allowed" : "pointer" }}>SUBMIT FOR REVIEW →</button>
          </div>
          {error && <p style={{ color: RED, fontFamily: "'Barlow', sans-serif", fontSize: "13px", marginTop: "12px" }}>{error}</p>}
        </div>
        <button onClick={() => pickChallenge(level)} style={{ background: "transparent", border: "1px solid #333", color: GREY, ...H, fontSize: "13px", letterSpacing: "0.1em", padding: "10px 20px", cursor: "pointer" }}>↻ GENERATE NEW CHALLENGE</button>
      </div>
    );
  }

  if (screen === "judging") return wrap(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ width: "64px", height: "64px", border: `3px solid #222`, borderTop: `3px solid ${RED}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "32px" }} />
      <h2 style={{ ...H, fontSize: "36px", letterSpacing: "0.06em", marginBottom: "16px" }}>ANALYSING YOUR PROMPT...</h2>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
        {["CLARITY", "SPECIFICITY", "AWARENESS", "CRAFT"].map((c, i) => (
          <span key={i} style={{ ...H, fontSize: "13px", letterSpacing: "0.15em", color: GREY, animation: `pulse 1.5s ease ${i * 0.3}s infinite` }}>{c} ·</span>
        ))}
      </div>
    </div>
  );

  if (screen === "results" && results) {
    const cfg = LEVELS[level];
    const passed = results.total >= cfg.passMark;
    return wrap(
      <div style={{ animation: "fadeUp 0.5s ease forwards", paddingTop: "40px" }}>
        <div style={{ borderTop: `4px solid ${RED}`, background: "#0d0d0d", padding: "40px", marginBottom: "16px", textAlign: "center" }}>
          <div style={{ ...H, fontSize: "13px", letterSpacing: "0.25em", color: GREY, marginBottom: "16px" }}>
            {isRetry ? `ATTEMPT ${retryCount + 1} · BEST: ${bestScore}` : "YOUR SCORE"}
          </div>
          <div style={{ ...H, fontSize: "clamp(80px, 20vw, 120px)", lineHeight: "1", color: passed ? RED : WHITE, marginBottom: "8px" }}>{results.total}</div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: GREY, marginBottom: "20px" }}>out of 100 · Pass mark: {cfg.passMark}</div>
          <span style={{ background: passed ? RED : "#1a1a1a", border: `1px solid ${passed ? RED : "#333"}`, ...H, fontSize: "16px", letterSpacing: "0.15em", color: WHITE, padding: "8px 20px" }}>{results.grade.toUpperCase()}</span>
        </div>

        <div style={{ border: "1px solid #1f1f1f", padding: "28px", marginBottom: "16px" }}>
          <div style={{ ...H, fontSize: "13px", letterSpacing: "0.2em", color: RED, marginBottom: "24px" }}>SCORE BREAKDOWN</div>
          <ScoreBar label="CLARITY" value={results.scores.clarity} reason={results.scoreReasons?.clarity} delay={0} />
          <ScoreBar label="SPECIFICITY" value={results.scores.specificity} reason={results.scoreReasons?.specificity} delay={150} />
          <ScoreBar label="CONTEXT AWARENESS" value={results.scores.awareness} reason={results.scoreReasons?.awareness} delay={300} />
          <ScoreBar label="CRAFT & TECHNIQUE" value={results.scores.craft} reason={results.scoreReasons?.craft} delay={450} />
        </div>

        <div style={{ border: "1px solid #1f1f1f", borderLeft: `4px solid ${RED}`, padding: "28px", marginBottom: "16px" }}>
          <div style={{ ...H, fontSize: "13px", letterSpacing: "0.2em", color: RED, marginBottom: "16px" }}>EXPERT FEEDBACK</div>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "17px", lineHeight: "1.9", color: "#e0e0e0", marginBottom: "28px", fontWeight: "500" }}>{results.verdict}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div>
              <div style={{ ...H, fontSize: "13px", letterSpacing: "0.15em", color: WHITE, marginBottom: "14px" }}>✓ STRENGTHS</div>
              {results.strengths.map((s, i) => (
                <div key={i} style={{ fontFamily: "'Barlow', sans-serif", fontSize: "15px", color: "#bbb", lineHeight: "1.7", marginBottom: "10px", paddingLeft: "12px", borderLeft: `2px solid ${RED}` }}>{s}</div>
              ))}
            </div>
            <div>
              <div style={{ ...H, fontSize: "13px", letterSpacing: "0.15em", color: WHITE, marginBottom: "14px" }}>↑ TO IMPROVE</div>
              {results.improvements.map((s, i) => (
                <div key={i} style={{ fontFamily: "'Barlow', sans-serif", fontSize: "15px", color: "#bbb", lineHeight: "1.7", marginBottom: "10px", paddingLeft: "12px", borderLeft: "2px solid #333" }}>{s}</div>
              ))}
            </div>
          </div>
          <div style={{ background: "#111", borderLeft: `3px solid ${RED}`, padding: "16px 20px" }}>
            <div style={{ ...H, fontSize: "11px", letterSpacing: "0.2em", color: RED, marginBottom: "8px" }}>⚡ PRO TIP</div>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "16px", color: "#bbb", lineHeight: "1.7" }}>{results.proTip}</p>
          </div>
        </div>

        {results.rewrittenPrompt && (
          <div style={{ border: "1px solid #1f1f1f", borderTop: `3px solid #333`, padding: "28px", marginBottom: "16px" }}>
            <div style={{ ...H, fontSize: "13px", letterSpacing: "0.2em", color: WHITE, marginBottom: "6px" }}>WHAT A STRONG PROMPT LOOKS LIKE</div>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY, marginBottom: "20px" }}>{results.rewriteNote}</p>
            <div style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderLeft: `3px solid ${RED}`, padding: "20px" }}>
              <div style={{ ...H, fontSize: "10px", letterSpacing: "0.2em", color: RED, marginBottom: "12px" }}>REWRITTEN VERSION</div>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "15px", color: "#ddd", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{results.rewrittenPrompt}</p>
            </div>
          </div>
        )}

        {showLeadGate && (
          <LeadGate level={level} scores={results} onComplete={handleLeadComplete} />
        )}

        {leadCaptured && resultHistory.length >= 2 && (
          <SessionReport history={resultHistory} userName={userName} />
        )}

        <div style={{ border: `2px solid ${passed ? RED : "#222"}`, background: passed ? "rgba(235,29,37,0.06)" : "#0d0d0d", padding: "32px", textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>{passed ? cfg.emoji : "💪"}</div>
          <div style={{ ...H, fontSize: "13px", letterSpacing: "0.25em", color: passed ? RED : GREY, marginBottom: "8px" }}>{passed ? "ACHIEVEMENT UNLOCKED" : "KEEP PRACTISING"}</div>
          <div style={{ ...H, fontSize: "32px", letterSpacing: "0.06em", color: passed ? WHITE : "#444", marginBottom: "8px" }}>{passed ? cfg.badge : "NOT YET..."}</div>
          {passed && <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY }}>BigSpaceAI Certified · {new Date().toLocaleDateString("en-SG", { month: "short", year: "numeric" })}</div>}
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button onClick={handleRetry} style={{ background: "transparent", border: `2px solid ${RED}`, color: RED, ...H, fontSize: "16px", letterSpacing: "0.12em", padding: "14px 24px", cursor: "pointer", flex: 1 }}>↻ RETRY THIS CHALLENGE</button>
          {!showLeadGate && <button onClick={handleNextChallenge} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "16px", letterSpacing: "0.12em", padding: "14px 24px", cursor: "pointer", flex: 1 }}>NEXT CHALLENGE →</button>}
        </div>
        <button onClick={() => setScreen("level")} style={{ background: "transparent", border: "1px solid #333", color: GREY, ...H, fontSize: "15px", letterSpacing: "0.12em", padding: "14px", cursor: "pointer", width: "100%" }}>CHANGE LEVEL</button>

        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: "#333", textAlign: "center", marginTop: "24px", letterSpacing: "0.05em" }}>LEARN MORE AT BIGSPACEAI.COM</p>
      </div>
    );
  }

  return null;
}
