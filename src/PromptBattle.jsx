import { useState, useEffect } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";

const H = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, textTransform: "uppercase" };
const B = { fontFamily: "'Barlow', sans-serif" };

async function callAPI(body) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function generateChallenge() {
  const data = await callAPI({
    model: "claude-sonnet-4-5",
    max_tokens: 500,
    system: `You are a creative challenge designer for Prompt Battle by BigSpaceAI. Generate a unique, practical prompting challenge. Return ONLY valid JSON: { "title": "THE [NAME]", "scenario": "...", "hint": "...", "evaluationFocus": "..." }`,
    messages: [{ role: "user", content: "Generate a creative prompting challenge. Avoid cliches." }]
  });
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

async function judgePrompt(challenge, userPrompt) {
  const data = await callAPI({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: `You are a senior AI trainer at BigSpaceAI. Score on four criteria (each 0-25): Clarity, Specificity, Awareness, Craft. Return ONLY valid JSON: { "scores": { "clarity": 0-25, "specificity": 0-25, "awareness": 0-25, "craft": 0-25 }, "scoreReasons": { "clarity": "...", "specificity": "...", "awareness": "...", "craft": "..." }, "total": 0-100, "grade": "...", "rewrittenPrompt": "...", "rewriteNote": "..." }`,
    messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nPROMPT:\n${userPrompt}` }]
  });
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

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
      {reason && show && <p style={{ ...B, fontSize: "13px", color: "#888", lineHeight: "1.6", borderLeft: `2px solid #2a2a2a`, paddingLeft: "10px" }}>{reason}</p>}
    </div>
  );
}

export default function PromptBattle() {
  const [screen, setScreen] = useState("home");
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [results, setResults] = useState(null);

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
      setScreen("results");
    } catch { setScreen("challenge"); }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: BLACK, color: WHITE, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: RED, zIndex: 100 }} />
      <div style={{ position: "fixed", top: "6px", left: 0, right: 0, height: "60px", background: "#000", borderBottom: "1px solid rgba(255,255,255,0.1)", zIndex: 99, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <a href="https://bigspaceai.com"><img src="/logo.png" alt="BigSpaceAI" style={{ height: "40px", cursor: "pointer" }} /></a>
      </div>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto", padding: "100px 20px 80px" }}>
        {children}
      </div>
    </div>
  );

  if (screen === "home") return wrap(
    <div style={{ animation: "fadeUp 0.6s ease" }}>
      <h1 style={{ ...H, fontSize: "clamp(64px, 14vw, 108px)", lineHeight: "0.95" }}>PROMPT<br /><span style={{ color: RED }}>BATTLE.</span></h1>
      <p style={{ ...B, fontSize: "17px", color: GREY, margin: "24px 0 48px" }}>Test your AI prompting skills. Write prompts. Get scored. Earn your badge.</p>
      <button onClick={startNewBattle} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", padding: "18px 48px", cursor: "pointer" }}>START BATTLE →</button>
    </div>
  );

  if (screen === "generating") return wrap(
    <div style={{ textAlign: "center", paddingTop: "60px" }}>
      <div style={{ width: "64px", height: "64px", border: "4px solid #222", borderTopColor: RED, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 32px" }} />
      <h2 style={{ ...H, fontSize: "32px" }}>GENERATING CHALLENGE...</h2>
    </div>
  );

  if (screen === "judging") return wrap(
    <div style={{ textAlign: "center", paddingTop: "60px" }}>
      <div style={{ width: "64px", height: "64px", border: "4px solid #222", borderTopColor: RED, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 32px" }} />
      <h2 style={{ ...H, fontSize: "36px", marginBottom: "16px" }}>SCORING YOUR PROMPT...</h2>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {["CLARITY", "SPECIFICITY", "AWARENESS", "CRAFT"].map((c, i) => (
          <span key={i} style={{ ...H, fontSize: "15px", color: GREY, animation: `pulse 1.5s ease ${i * 0.3}s infinite` }}>{c} ·</span>
        ))}
      </div>
    </div>
  );

  if (screen === "challenge") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <div style={{ border: "1px solid #222", borderTop: `3px solid ${RED}`, padding: "28px", marginBottom: "20px" }}>
        <div style={{ ...H, fontSize: "14px", color: RED, marginBottom: "16px" }}>{challenge.title}</div>
        <p style={{ ...B, fontSize: "18px", color: WHITE, marginBottom: "24px", lineHeight: "1.6" }}>{challenge.scenario}</p>
        <div style={{ background: "#111", padding: "16px", borderLeft: `3px solid ${RED}` }}>
          <p style={{ ...B, fontSize: "15px", color: GREY }}>{challenge.hint}</p>
        </div>
      </div>
      <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Write your prompt here..." style={{ width: "100%", height: "180px", background: "#0f0f0f", border: "1px solid #2a2a2a", color: WHITE, padding: "16px", ...B, fontSize: "16px" }} />
      <button onClick={submit} disabled={userPrompt.length < 20} style={{ background: userPrompt.length < 20 ? "#222" : RED, border: "none", color: WHITE, ...H, fontSize: "18px", padding: "16px 40px", marginTop: "20px", cursor: "pointer" }}>SUBMIT FOR REVIEW →</button>
    </div>
  );

  if (screen === "results") {
    const passed = results.total >= 70;
    return wrap(
      <div style={{ animation: "fadeUp 0.5s ease" }}>
        <div style={{ background: "#0d0d0d", padding: "40px", textAlign: "center", borderTop: `4px solid ${RED}`, marginBottom: "16px" }}>
          <div style={{ ...H, fontSize: "100px", color: RED, lineHeight: "1" }}>{results.total}</div>
          <div style={{ ...H, fontSize: "24px" }}>{results.grade.toUpperCase()}</div>
        </div>

        <div style={{ border: "1px solid #1f1f1f", padding: "28px", marginBottom: "16px" }}>
          <ScoreBar label="CLARITY" value={results.scores.clarity} reason={results.scoreReasons?.clarity} />
          <ScoreBar label="SPECIFICITY" value={results.scores.specificity} reason={results.scoreReasons?.specificity} delay={150} />
          <ScoreBar label="AWARENESS" value={results.scores.awareness} reason={results.scoreReasons?.awareness} delay={300} />
          <ScoreBar label="CRAFT" value={results.scores.craft} reason={results.scoreReasons?.craft} delay={450} />
        </div>

        {results.rewrittenPrompt && (
          <div style={{ background: "#0f0f0f", padding: "28px", marginBottom: "16px", border: "1px solid #1f1f1f", borderLeft: `4px solid ${RED}` }}>
            <div style={{ ...H, fontSize: "14px", color: RED, marginBottom: "12px", letterSpacing: "0.1em" }}>PRO TIP: REWRITTEN VERSION</div>
            <p style={{ ...B, fontSize: "15px", color: "#ddd", whiteSpace: "pre-wrap", lineHeight: "1.8" }}>{results.rewrittenPrompt}</p>
          </div>
        )}

        <div style={{ border: `2px solid ${passed ? RED : "#222"}`, background: passed ? "rgba(235,29,37,0.06)" : "#0d0d0d", padding: "32px", textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>{passed ? "🏆" : "💪"}</div>
          <div style={{ ...H, fontSize: "13px", letterSpacing: "0.25em", color: passed ? RED : GREY, marginBottom: "8px" }}>{passed ? "ACHIEVEMENT UNLOCKED" : "KEEP PRACTISING"}</div>
          <div style={{ ...H, fontSize: "32px", letterSpacing: "0.06em", color: passed ? WHITE : "#444", marginBottom: "8px" }}>{passed ? "PROMPT MASTER" : "NOT YET..."}</div>
          {passed && <div style={{ ...B, fontSize: "13px", color: GREY }}>BigSpaceAI Certified · {new Date().toLocaleDateString("en-SG", { month: "short", year: "numeric" })}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button onClick={startNewBattle} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", padding: "20px", cursor: "pointer", width: "100%" }}>REPLAY CHALLENGE</button>
          <button onClick={() => window.location.href = "https://bigspaceai.com"} style={{ background: "transparent", border: "1px solid #333", color: GREY, ...H, fontSize: "16px", padding: "16px", cursor: "pointer", width: "100%" }}>VISIT BIGSPACEAI.COM</button>
        </div>

        <p style={{ ...B, fontSize: "12px", color: "#333", textAlign: "center", marginTop: "24px", letterSpacing: "0.05em" }}>LEARN MORE AT BIGSPACEAI.COM</p>
      </div>
    );
  }

  return null;
}
