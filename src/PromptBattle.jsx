import { useState, useEffect } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";

const H = { fontFamily: "'Anton', sans-serif", textTransform: "uppercase" };
const B = { fontFamily: "'Barlow', sans-serif" };

async function callAPI(body) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function subscribeToMailchimp(email, name, score) {
  await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, score, level: "beginner" })
  });
}

async function generateChallenge() {
  const data = await callAPI({
    model: "claude-sonnet-4-5",
    max_tokens: 500,
    system: `You are a creative challenge designer for BigSpaceAI. Return ONLY valid JSON:
{
  "title": "THE [NAME]",
  "scenario": "1-2 sentence description",
  "hint": "Think about: [3 considerations]",
  "evaluationFocus": "skills tested"
}`,
    messages: [{ role: "user", content: `Generate a beginner level challenge.` }]
  });
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

async function judgePrompt(challenge, userPrompt) {
  const data = await callAPI({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: `You are a senior AI trainer at BigSpaceAI. Return ONLY valid JSON:
{
 "scores": { "clarity": 0-25, "specificity": 0-25, "awareness": 0-25, "craft": 0-25 },
 "total": 0-100,
 "grade": "Needs Work|Getting There|Solid|Excellent|Outstanding",
 "rewrittenPrompt": "improved version",
 "rewriteNote": "key change note"
}`,
    messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nPROMPT: ${userPrompt}` }]
  });
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

const GridBg = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
);
const RedBar = () => <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: RED, zIndex: 100 }} />;

function ScoreBar({ label, value, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / 25) * 100), delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ ...H, fontSize: "13px", letterSpacing: "0.12em", color: GREY }}>{label}</span>
        <span style={{ ...H, fontSize: "14px", color: value >= 20 ? RED : WHITE }}>{value}/25</span>
      </div>
      <div style={{ background: "#1f1f1f", height: "6px" }}>
        <div style={{ width: `${width}%`, height: "100%", background: RED, transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }} />
      </div>
    </div>
  );
}

function PerformanceTracker({ history }) {
  if (history.length < 2) return null;

  const firstScore = history[0].total;
  const latestScore = history[history.length - 1].total;
  const improvement = latestScore - firstScore;
  const percentChange = ((improvement / (firstScore || 1)) * 100).toFixed(0);

  return (
    <div style={{ border: "1px solid #1f1f1f", borderTop: `3px solid ${RED}`, padding: "28px", marginBottom: "16px", background: "#0d0d0d" }}>
      <div style={{ ...H, fontSize: "13px", letterSpacing: "0.2em", color: RED, marginBottom: "20px" }}>SESSION PROGRESS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...H, fontSize: "32px", color: WHITE }}>{history.length}</div>
          <div style={{ fontSize: "10px", color: GREY, ...B }}>ATTEMPTS</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...H, fontSize: "32px", color: improvement >= 0 ? RED : WHITE }}>
            {improvement > 0 ? `+${percentChange}%` : `${percentChange}%`}
          </div>
          <div style={{ fontSize: "10px", color: GREY, ...B }}>IMPROVEMENT</div>
        </div>
      </div>
    </div>
  );
}

export default function PromptBattle() {
  const [screen, setScreen] = useState("home");
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [results, setResults] = useState(null);
  const [resultHistory, setResultHistory] = useState([]);

  const startBattle = async () => {
    setUserPrompt("");
    setResults(null);
    setResultHistory([]); // Reset history for a brand new game
    setScreen("generating");
    const c = await generateChallenge();
    setChallenge(c);
    setScreen("challenge");
  };

  const handleRetry = () => {
    setUserPrompt("");
    setResults(null);
    setScreen("challenge");
  };

  const submit = async () => {
    if (userPrompt.trim().length < 20) return;
    setScreen("judging");
    const r = await judgePrompt(challenge, userPrompt);
    setResults(r);
    setResultHistory(prev => [...prev, r]);
    setScreen("results");
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: BLACK, color: WHITE, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
      <RedBar />
      <GridBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto", padding: "80px 20px" }}>
        {children}
      </div>
    </div>
  );

  if (screen === "home") return wrap(
    <div style={{ animation: "fadeUp 0.6s ease forwards", paddingTop: "64px" }}>
      <h1 style={{ ...H, fontSize: "clamp(64px, 14vw, 108px)", lineHeight: "0.95" }}>PROMPT<br /><span style={{ color: RED }}>BATTLE.</span></h1>
      <button onClick={startBattle} style={{ background: RED, color: WHITE, ...H, fontSize: "20px", padding: "18px 48px", cursor: "pointer", border: "none", marginTop: "48px" }}>START BATTLE →</button>
    </div>
  );

  if (screen === "generating" || screen === "judging") return wrap(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ width: "64px", height: "64px", border: `3px solid #222`, borderTop: `3px solid ${RED}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <h2 style={{ ...H, fontSize: "32px", marginTop: "32px" }}>{screen === "generating" ? "GENERATING..." : "JUDGING..."}</h2>
    </div>
  );

  if (screen === "challenge") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease forwards" }}>
      <div style={{ border: "1px solid #222", borderTop: `3px solid ${RED}`, padding: "28px", marginBottom: "20px" }}>
        <div style={{ ...H, fontSize: "11px", color: RED, marginBottom: "16px" }}>YOUR CHALLENGE</div>
        <p style={{ ...B, fontSize: "17px", color: WHITE }}>{challenge.scenario}</p>
      </div>
      <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Write your prompt..." style={{ width: "100%", minHeight: "160px", background: "#0f0f0f", border: "1px solid #2a2a2a", color: WHITE, padding: "16px", ...B, fontSize: "15px" }} />
      <button onClick={submit} disabled={userPrompt.trim().length < 20} style={{ background: RED, color: WHITE, ...H, padding: "14px 32px", marginTop: "16px", cursor: "pointer", border: "none" }}>SUBMIT →</button>
    </div>
  );

  if (screen === "results") {
    const passed = results.total >= 65;
    return wrap(
      <div style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div style={{ borderTop: `4px solid ${RED}`, background: "#0d0d0d", padding: "40px", textAlign: "center", marginBottom: "16px" }}>
          <div style={{ ...H, fontSize: "120px", color: passed ? RED : WHITE }}>{results.total}</div>
          <span style={{ background: passed ? RED : "#1a1a1a", ...H, padding: "8px 20px", fontSize: "14px" }}>{results.grade.toUpperCase()}</span>
        </div>

        <PerformanceTracker history={resultHistory} />

        <div style={{ border: "1px solid #1f1f1f", padding: "28px", marginBottom: "16px" }}>
          <ScoreBar label="CLARITY" value={results.scores.clarity} />
          <ScoreBar label="SPECIFICITY" value={results.scores.specificity} delay={100} />
          <ScoreBar label="CONTEXT" value={results.scores.awareness} delay={200} />
          <ScoreBar label="CRAFT" value={results.scores.craft} delay={300} />
        </div>

        {results.rewrittenPrompt && (
          <div style={{ border: "1px solid #1f1f1f", borderTop: `3px solid #333`, padding: "28px", marginBottom: "16px" }}>
            <div style={{ ...H, fontSize: "13px", color: WHITE, marginBottom: "6px" }}>WHAT A STRONG PROMPT LOOKS LIKE</div>
            <p style={{ ...B, fontSize: "13px", color: GREY, marginBottom: "20px" }}>{results.rewriteNote}</p>
            <div style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderLeft: `3px solid ${RED}`, padding: "20px" }}>
              <p style={{ ...B, fontSize: "15px", color: "#ddd", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{results.rewrittenPrompt}</p>
            </div>
          </div>
        )}

        <div style={{ border: `2px solid ${passed ? RED : "#222"}`, background: passed ? "rgba(235,29,37,0.06)" : "#0d0d0d", padding: "32px", textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px" }}>{passed ? "🌱" : "💪"}</div>
          <div style={{ ...H, fontSize: "13px", color: passed ? RED : GREY }}>{passed ? "ACHIEVEMENT UNLOCKED" : "KEEP PRACTISING"}</div>
          <div style={{ ...H, fontSize: "32px", color: passed ? WHITE : "#444" }}>{passed ? "PROMPT SEEDLING" : "NOT YET..."}</div>
        </div>

        <button onClick={handleRetry} style={{ background: RED, border: "none", color: WHITE, ...H, padding: "18px", width: "100%", cursor: "pointer", fontSize: "18px" }}>↻ RETRY THIS CHALLENGE</button>
        <button onClick={() => setScreen("home")} style={{ background: "transparent", border: "1px solid #333", color: GREY, ...H, padding: "14px", width: "100%", cursor: "pointer", marginTop: "12px" }}>QUIT TO HOME</button>
      </div>
    );
  }
  return null;
}
