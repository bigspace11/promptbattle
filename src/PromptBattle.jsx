import { useState, useEffect } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";

const H = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, textTransform: "uppercase" };

async function callAPI(body) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function subscribeToMailchimp(email, name, score) {
  const response = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, score })
  });
  return response.json();
}

async function generateChallenge() {
  const data = await callAPI({
    model: "claude-sonnet-4-5",
    max_tokens: 500,
    system: `You are a creative challenge designer for an AI prompting skills game called Prompt Battle by BigSpaceAI. Generate a single unique, practical, and interesting prompting challenge. 

Challenges should be varied — draw from business, marketing, HR, tech, food, travel, or creativity. Avoid cliches like coffee mugs or WiFi explanations.

Return ONLY valid JSON:
{
  "title": "THE [2-3 WORD NAME IN CAPS]",
  "scenario": "Clear 1-2 sentence description of what the user needs the AI to do",
  "hint": "Think about: [3 specific prompting considerations]",
  "evaluationFocus": "3 skills this tests"
}`,
    messages: [{ role: "user", content: "Generate a fresh, creative prompting challenge." }]
  });
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

async function judgePrompt(challenge, userPrompt) {
  const data = await callAPI({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: `You are a senior AI trainer at BigSpaceAI. Speak in first person as a human expert.

Score on four criteria (each 0-25, total 100):
- Clarity: Is the instruction clear and unambiguous?
- Specificity: Does it provide enough detail and constraints?
- Awareness: Does it show understanding of audience and context?
- Craft: Does it use good prompting techniques?

Return ONLY valid JSON:
{
  "scores": { "clarity": 0-25, "specificity": 0-25, "awareness": 0-25, "craft": 0-25 },
  "scoreReasons": { "clarity": "...", "specificity": "...", "awareness": "...", "craft": "..." },
  "total": 0-100,
  "grade": "Needs Work|Getting There|Solid|Excellent|Outstanding",
  "rewrittenPrompt": "the improved version of their prompt",
  "rewriteNote": "one sentence on the key change made"
}`,
    messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nPROMPT:\n${userPrompt}` }]
  });
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

const GridBg = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
);
const RedBar = () => <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: RED, zIndex: 100 }} />;
const Navigation = () => (
  <div style={{ position: "fixed", top: "6px", left: 0, right: 0, height: "60px", background: "#000", borderBottom: "1px solid rgba(255,255,255,0.1)", zIndex: 99, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <a href="https://bigspaceai.com" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src="/logo.png" alt="BigSpaceAI" style={{ height: "40px", width: "auto", cursor: "pointer" }} />
    </a>
  </div>
);

function ScoreBar({ label, value, reason, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setWidth((value / 25) * 100); setShow(true); }, delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ ...H, fontSize: "15px", letterSpacing: "0.06em", color: "#aaa" }}>{label}</span>
        <span style={{ ...H, fontSize: "16px", color: value >= 20 ? RED : WHITE }}>{value}/25</span>
      </div>
      <div style={{ background: "#1f1f1f", height: "6px", marginBottom: reason ? "10px" : "0" }}>
        <div style={{ width: `${width}%`, height: "100%", background: RED, transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }} />
      </div>
      {reason && show && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: "#888", lineHeight: "1.6", borderLeft: `2px solid #2a2a2a`, paddingLeft: "10px" }}>{reason}</p>}
    </div>
  );
}

function LeadGate({ scores, onComplete }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!name.trim() || !email.trim() || !email.includes("@")) return;
    setLoading(true);
    try {
      await subscribeToMailchimp(email, name, scores.total);
      onComplete(name);
    } catch { setLoading(false); }
  };
  return (
    <div style={{ border: `2px solid ${RED}`, background: "#0d0d0d", padding: "36px", marginBottom: "16px", textAlign: "center" }}>
      <div style={{ ...H, fontSize: "24px", color: WHITE, marginBottom: "12px" }}>GET YOUR SESSION REPORT</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "360px", margin: "0 auto" }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ background: "#111", border: "1px solid #333", color: WHITE, padding: "14px 16px", width: "100%" }} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" type="email" style={{ background: "#111", border: "1px solid #333", color: WHITE, padding: "14px 16px", width: "100%" }} />
        <button onClick={submit} disabled={loading} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "16px", padding: "16px", cursor: "pointer" }}>{loading ? "SAVING..." : "UNLOCK MY REPORT →"}</button>
      </div>
    </div>
  );
}

export default function PromptBattle() {
  const [screen, setScreen] = useState("home");
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [results, setResults] = useState(null);
  const [submitCount, setSubmitCount] = useState(0);
  const [resultHistory, setResultHistory] = useState([]);
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [userName, setUserName] = useState("");
  const [bestScore, setBestScore] = useState(null);

  const startNewBattle = async () => {
    setUserPrompt("");
    setResults(null);
    setScreen("generating");
    try {
      const c = await generateChallenge();
      setChallenge(c);
      setScreen("challenge");
    } catch { setScreen("home"); }
  };

  const submit = async () => {
    if (userPrompt.trim().length < 20) return;
    setScreen("judging");
    try {
      const r = await judgePrompt(challenge, userPrompt);
      setResults(r);
      if (!bestScore || r.total > bestScore) setBestScore(r.total);
      const newCount = submitCount + 1;
      setSubmitCount(newCount);
      setResultHistory(prev => [...prev, r]);
      if (newCount >= 2 && !leadCaptured) setShowLeadGate(true);
      setScreen("results");
    } catch { setScreen("challenge"); }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: BLACK, color: WHITE, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <RedBar /><Navigation /><GridBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto", padding: "80px 20px" }}>
        {screen !== "home" && screen !== "generating" && screen !== "judging" && (
          <button onClick={() => setScreen("home")} style={{ background: "transparent", border: "1px solid #333", color: GREY, ...H, fontSize: "12px", padding: "6px 14px", cursor: "pointer", marginBottom: "20px" }}>← HOME</button>
        )}
        {children}
      </div>
    </div>
  );

  if (screen === "home") return wrap(
    <div style={{ animation: "fadeUp 0.6s ease", paddingTop: "64px" }}>
      <h1 style={{ ...H, fontSize: "clamp(64px, 14vw, 108px)", lineHeight: "0.95", color: WHITE }}>PROMPT<br /><span style={{ color: RED }}>BATTLE.</span></h1>
      <div style={{ width: "60px", height: "4px", background: RED, margin: "24px 0" }} />
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "17px", color: GREY, marginBottom: "48px" }}>Test your AI prompting skills. Write prompts. Get scored. Earn your badge.</p>
      <button onClick={startNewBattle} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", padding: "18px 48px", cursor: "pointer" }}>START BATTLE →</button>
    </div>
  );

  if (screen === "generating") return wrap(
    <div style={{ textAlign: "center", paddingTop: "100px" }}>
      <div style={{ width: "64px", height: "64px", border: `3px solid #222`, borderTop: `3px solid ${RED}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 32px" }} />
      <h2 style={{ ...H, fontSize: "36px" }}>GENERATING CHALLENGE...</h2>
    </div>
  );

  if (screen === "judging") return wrap(
    <div style={{ textAlign: "center", paddingTop: "100px" }}>
      <div style={{ width: "64px", height: "64px", border: `3px solid #222`, borderTop: `3px solid ${RED}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 32px" }} />
      <h2 style={{ ...H, fontSize: "36px", marginBottom: "16px" }}>SCORING YOUR PROMPT...</h2>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        {["CLARITY", "SPECIFICITY", "AWARENESS", "CRAFT"].map((c, i) => (
          <span key={i} style={{ ...H, fontSize: "13px", color: GREY, animation: `pulse 1.5s ease ${i * 0.3}s infinite` }}>{c} ·</span>
        ))}
      </div>
    </div>
  );

  if (screen === "challenge") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <div style={{ border: "1px solid #222", borderTop: `3px solid ${RED}`, padding: "28px", marginBottom: "20px" }}>
        <div style={{ ...H, fontSize: "12px", color: RED, marginBottom: "16px" }}>{challenge.title}</div>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "17px", color: WHITE, marginBottom: "24px" }}>{challenge.scenario}</p>
        <div style={{ background: "#111", padding: "14px 18px", borderLeft: `3px solid ${RED}` }}>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: GREY }}>{challenge.hint}</p>
        </div>
      </div>
      <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Write your prompt here..." style={{ width: "100%", height: "160px", background: "#0f0f0f", border: "1px solid #2a2a2a", color: WHITE, padding: "16px", fontFamily: "'Barlow', sans-serif" }} />
      <button onClick={submit} disabled={userPrompt.length < 20} style={{ background: userPrompt.length < 20 ? "#222" : RED, border: "none", color: WHITE, ...H, fontSize: "16px", padding: "14px 32px", marginTop: "16px", cursor: "pointer" }}>SUBMIT FOR REVIEW →</button>
    </div>
  );

  if (screen === "results") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <div style={{ background: "#0d0d0d", padding: "40px", textAlign: "center", borderTop: `4px solid ${RED}`, marginBottom: "16px" }}>
        <div style={{ ...H, fontSize: "100px", color: RED }}>{results.total}</div>
        <div style={{ ...H, fontSize: "20px" }}>{results.grade.toUpperCase()}</div>
      </div>
      <div style={{ border: "1px solid #1f1f1f", padding: "28px", marginBottom: "16px" }}>
        <ScoreBar label="CLARITY" value={results.scores.clarity} reason={results.scoreReasons?.clarity} />
        <ScoreBar label="SPECIFICITY" value={results.scores.specificity} reason={results.scoreReasons?.specificity} delay={150} />
        <ScoreBar label="AWARENESS" value={results.scores.awareness} reason={results.scoreReasons?.awareness} delay={300} />
        <ScoreBar label="CRAFT" value={results.scores.craft} reason={results.scoreReasons?.craft} delay={450} />
      </div>
      {results.rewrittenPrompt && (
        <div style={{ background: "#0f0f0f", padding: "20px", borderLeft: `3px solid ${RED}`, marginBottom: "16px" }}>
          <div style={{ ...H, fontSize: "12px", color: RED, marginBottom: "8px" }}>PRO TIP: REWRITTEN VERSION</div>
          <p style={{ fontSize: "14px", color: "#ddd", whiteSpace: "pre-wrap" }}>{results.rewrittenPrompt}</p>
        </div>
      )}
      {showLeadGate && <LeadGate scores={results} onComplete={(name) => { setUserName(name); setLeadCaptured(true); setShowLeadGate(false); }} />}
      <button onClick={startNewBattle} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "18px", padding: "18px", width: "100%", cursor: "pointer" }}>NEXT CHALLENGE →</button>
    </div>
  );

  return null;
}
