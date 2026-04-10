import { useState, useEffect } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";

// Locked to your original Beginner challenges for a focused "One Level" experience
const CHALLENGES = [
  {
    id: "b1", title: "THE EXPLAINER",
    scenario: "Explain how WiFi works to your 70-year-old grandmother who has never used a smartphone.",
    hint: "Think about: who is the audience? What do they already know? What analogies might help?",
    evaluationFocus: "clarity, audience awareness, use of analogy"
  },
  {
    id: "b2", title: "THE PRODUCT PITCH",
    scenario: "Write a compelling product description for a plain white coffee mug.",
    hint: "Think about: tone, sensory details, emotional appeal, who buys mugs and why?",
    evaluationFocus: "creativity, persuasion, specificity"
  },
  {
    id: "b3", title: "THE REWRITER",
    scenario: "Rewrite this boring sentence to make it exciting: 'The meeting is on Tuesday at 3pm.'",
    hint: "Think about: energy, context, what makes people actually want to show up?",
    evaluationFocus: "creativity, transformation, voice"
  }
];

async function judgePrompt(challenge, userPrompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1000,
      system: `You are an expert AI prompt evaluator for BigSpaceAI. Score on 4 criteria (0-25 each). Return ONLY valid JSON: { "scores": { "clarity": 0-25, "specificity": 0-25, "awareness": 0-25, "craft": 0-25 }, "total": 0-100, "grade": "Needs Work|Getting There|Solid|Excellent|Outstanding", "verdict": "2-3 sentence verdict", "strengths": [], "improvements": [], "proTip": "one tip" }`,
      messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nEVALUATION: ${challenge.evaluationFocus}\nPROMPT: ${userPrompt}` }]
    })
  });
  const data = await response.json();
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

const GridBg = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
);

const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{ width: "28px", height: "28px", background: RED, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: WHITE, fontSize: "14px", fontWeight: "900", fontFamily: "'Anton', sans-serif" }}>B</span>
    </div>
    <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "16px", letterSpacing: "0.1em", color: WHITE }}>BIGSPACE<span style={{ color: RED }}>AI</span></span>
  </div>
);

function ScoreBar({ label, value, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / 25) * 100), delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", color: GREY, letterSpacing: "0.1em" }}>{label}</span>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "13px", color: value >= 20 ? RED : WHITE }}>{value}/25</span>
      </div>
      <div style={{ background: "#1f1f1f", height: "6px" }}>
        <div style={{ width: `${width}%`, height: "100%", background: RED, transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }} />
      </div>
    </div>
  );
}

export default function PromptBattle() {
  const [screen, setScreen] = useState("home");
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  const startBattle = () => {
    const randomChallenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    setChallenge(randomChallenge);
    setUserPrompt("");
    setResults(null);
    setHistory([]);
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
    try {
      const r = await judgePrompt(challenge, userPrompt);
      setResults(r);
      setHistory(prev => [...prev, r]);
      setScreen("results");
    } catch {
      setScreen("challenge");
    }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: BLACK, color: WHITE, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: RED, zIndex: 100 }} />
      <GridBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 0" }}>
          <Logo />
          {screen !== "home" && <button onClick={() => setScreen("home")} style={{ background: "transparent", border: "1px solid #333", color: GREY, fontFamily: "'Barlow', sans-serif", fontSize: "12px", padding: "6px 14px", cursor: "pointer" }}>← HOME</button>}
        </div>
        {children}
      </div>
    </div>
  );

  if (screen === "home") return wrap(
    <div style={{ animation: "fadeUp 0.6s ease forwards", paddingTop: "40px" }}>
      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "11px", letterSpacing: "0.25em", color: RED, marginBottom: "20px" }}>AI CREATOR TOOLKIT</div>
      <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(56px, 13vw, 96px)", lineHeight: "0.95", marginBottom: "24px" }}>PROMPT<br /><span style={{ color: RED }}>BATTLE.</span></h1>
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "17px", color: GREY, maxWidth: "480px", marginBottom: "48px" }}>Test your AI prompting skills. Pick a challenge, write your prompt, and get judged by Claude in real-time.</p>
      <button onClick={startBattle} style={{ background: RED, border: "none", color: WHITE, fontFamily: "'Anton', sans-serif", fontSize: "18px", padding: "18px 48px", cursor: "pointer" }}>START BATTLE →</button>
    </div>
  );

  if (screen === "judging") return wrap(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: "64px", height: "64px", border: `3px solid #222`, borderTop: `3px solid ${RED}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: "32px", marginTop: "32px" }}>JUDGING...</h2>
    </div>
  );

  if (screen === "challenge") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease forwards" }}>
      <div style={{ border: "1px solid #222", borderTop: `3px solid ${RED}`, padding: "28px", marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", color: RED, marginBottom: "16px" }}>YOUR CHALLENGE: {challenge.title}</div>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "18px", color: WHITE, lineHeight: "1.6" }}>{challenge.scenario}</p>
        <div style={{ marginTop: "20px", color: GREY, fontSize: "13px", fontFamily: "'Barlow', sans-serif", fontStyle: "italic" }}>{challenge.hint}</div>
      </div>
      <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Type your AI prompt here..." style={{ width: "100%", minHeight: "180px", background: "#0f0f0f", border: "1px solid #2a2a2a", color: WHITE, padding: "16px", fontFamily: "'Barlow', sans-serif", fontSize: "16px", lineHeight: "1.6" }} />
      <button onClick={submit} disabled={userPrompt.trim().length < 20} style={{ background: RED, color: WHITE, fontFamily: "'Anton', sans-serif", padding: "16px 36px", marginTop: "16px", cursor: "pointer", border: "none", letterSpacing: "0.1em" }}>SUBMIT PROMPT →</button>
    </div>
  );

  if (screen === "results") {
    const firstScore = history[0]?.total || 0;
    const improvement = results.total - firstScore;

    return wrap(
      <div style={{ animation: "fadeUp 0.5s ease forwards" }}>
        <div style={{ borderTop: `4px solid ${RED}`, background: "#0d0d0d", padding: "40px", textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "100px", color: results.total >= 65 ? RED : WHITE, lineHeight: "1" }}>{results.total}</div>
          <div style={{ background: results.total >= 65 ? RED : "#1a1a1a", display: "inline-block", fontFamily: "'Anton', sans-serif", padding: "6px 20px", fontSize: "14px", marginTop: "10px", letterSpacing: "0.1em" }}>{results.grade.toUpperCase()}</div>
          
          {history.length > 1 && (
            <div style={{ marginTop: "24px", fontFamily: "'Anton', sans-serif", color: improvement >= 0 ? RED : GREY, fontSize: "14px", letterSpacing: "0.05em" }}>
               {improvement >= 0 ? `+${improvement}% IMPROVEMENT` : `${improvement}% CHANGE`} THIS SESSION
            </div>
          )}
        </div>

        <div style={{ border: "1px solid #1f1f1f", padding: "28px", marginBottom: "24px" }}>
          <ScoreBar label="CLARITY" value={results.scores.clarity} />
          <ScoreBar label="SPECIFICITY" value={results.scores.specificity} delay={100} />
          <ScoreBar label="AWARENESS" value={results.scores.awareness} delay={200} />
          <ScoreBar label="CRAFT" value={results.scores.craft} delay={300} />
        </div>

        <div style={{ border: "1px solid #222", padding: "24px", marginBottom: "24px", background: "rgba(255,255,255,0.02)" }}>
           <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", color: RED, marginBottom: "8px" }}>VERDICT</div>
           <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "15px", color: "#ccc", lineHeight: "1.6" }}>{results.verdict}</p>
           <div style={{ marginTop: "16px", fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: WHITE }}>
             <strong>PRO TIP:</strong> {results.proTip}
           </div>
        </div>

        <button onClick={handleRetry} style={{ background: RED, border: "none", color: WHITE, fontFamily: "'Anton', sans-serif", padding: "20px", width: "100%", cursor: "pointer", fontSize: "18px", letterSpacing: "0.1em" }}>↻ RETRY THIS CHALLENGE</button>
      </div>
    );
  }

  return null;
}
