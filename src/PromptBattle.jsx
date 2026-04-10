import { useState, useEffect } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";

const H = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, textTransform: "uppercase" };
const B = { fontFamily: "'Barlow', sans-serif" };

const BEGINNER_CHALLENGES = [
  {
    id: 1,
    title: "THE EXPLAINER",
    scenario: "Explain how WiFi works to your 70-year-old grandmother who has never used a smartphone.",
    hint: "Think about: who is the audience? What do they already know? What analogies might help?",
    evaluationFocus: "clarity, audience awareness, use of analogy"
  },
  {
    id: 2,
    title: "THE PRODUCT PITCH",
    scenario: "Write a compelling product description for a plain white coffee mug.",
    hint: "Think about: tone, sensory details, emotional appeal, who buys mugs and why?",
    evaluationFocus: "creativity, persuasion, specificity"
  },
  {
    id: 3,
    title: "THE REWRITER",
    scenario: "Rewrite this boring sentence to make it exciting: 'The meeting is on Tuesday at 3pm.'",
    hint: "Think about: energy, context, what makes people actually want to show up?",
    evaluationFocus: "creativity, transformation, voice"
  },
  {
    id: 4,
    title: "THE POLITE DECLINE",
    scenario: "Write a polite but firm email to a friend declining an invitation to their weekend party because you need to rest.",
    hint: "Think about: maintaining the friendship while being clear about your boundaries.",
    evaluationFocus: "tone, empathy, clarity"
  },
  {
    id: 5,
    title: "THE RECIPE MAKER",
    scenario: "Ask an AI to give you a dinner recipe using only eggs, spinach, and a piece of bread.",
    hint: "Think about: providing clear constraints so the AI doesn't suggest extra ingredients you don't have.",
    evaluationFocus: "specificity, constraint-setting"
  },
  {
    id: 6,
    title: "THE TRAVEL GUIDE",
    scenario: "You have 4 hours in London. Ask the AI for a walking route that sees 3 major landmarks and ends at a great pub.",
    hint: "Think about: time management, starting location, and specific interests.",
    evaluationFocus: "logistics, clarity, constraints"
  },
  {
    id: 7,
    title: "THE INSTA-CAPTION",
    scenario: "Write a short, witty Instagram caption for a photo of a very messy desk titled 'Productivity'.",
    hint: "Think about: irony, brevity, and target audience.",
    evaluationFocus: "tone, humor, impact"
  }
];

async function callAPI(body) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function judgePrompt(challenge, userPrompt) {
  const data = await callAPI({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    system: `You are an extremely strict AI Prompting Auditor. 
    CRITICAL SCORING: Do NOT give high scores for lazy or generic prompts. 
    A score of 20+ per category is reserved ONLY for prompts with clear constraints, persona, and structure.
    If the prompt is one sentence or lacks detail, score it below 10 per category.
    Score on (0-25): Clarity, Specificity, Awareness, Craft. 
    Return ONLY valid JSON: { "scores": { "clarity": 0-25, "specificity": 0-25, "awareness": 0-25, "craft": 0-25 }, "scoreReasons": { "clarity": "...", "specificity": "...", "awareness": "...", "craft": "..." }, "total": 0-100, "grade": "...", "rewrittenPrompt": "...", "rewriteNote": "..." }`,
    messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nUSER PROMPT:\n${userPrompt}` }]
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
  const [history, setHistory] = useState([]);
  const [seenIds, setSeenIds] = useState([]);

  const startNewBattle = () => {
    setUserPrompt("");
    setResults(null);
    setScreen("generating");

    setTimeout(() => {
      // Filter out challenges already seen in this session
      let available = BEGINNER_CHALLENGES.filter(c => !seenIds.includes(c.id));
      
      // If all challenges have been seen, reset the list
      if (available.length === 0) {
        available = BEGINNER_CHALLENGES;
        setSeenIds([]);
      }

      const selected = available[Math.floor(Math.random() * available.length)];
      setChallenge(selected);
      setSeenIds(prev => [...prev, selected.id]);
      setScreen("challenge");
    }, 800);
  };

  const submit = async () => {
    if (userPrompt.trim().length < 5) return;
    setScreen("judging");
    try {
      const r = await judgePrompt(challenge, userPrompt);
      setResults(r);
      setHistory(prev => {
        const newHistory = [...prev, r.total];
        return newHistory.slice(-5);
      });
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
      <p style={{ ...B, fontSize: "17px", color: GREY, margin: "24px 0 48px" }}>Test your AI prompting skills. Unique beginner tasks. Get audited. Earn your badge.</p>
      <button onClick={startNewBattle} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", padding: "18px 48px", cursor: "pointer" }}>START BATTLE →</button>
    </div>
  );

  if (screen === "generating") return wrap(
    <div style={{ textAlign: "center", paddingTop: "60px" }}>
      <div style={{ width: "64px", height: "64px", border: "4px solid #222", borderTopColor: RED, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 32px" }} />
      <h2 style={{ ...H, fontSize: "32px" }}>FETCHING NEW TASK...</h2>
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
      <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Enter your prompt..." style={{ width: "100%", height: "180px", background: "#0f0f0f", border: "1px solid #2a2a2a", color: WHITE, padding: "16px", ...B, fontSize: "16px" }} />
      <button onClick={submit} disabled={userPrompt.length < 5} style={{ background: userPrompt.length < 5 ? "#222" : RED, border: "none", color: WHITE, ...H, fontSize: "18px", padding: "16px 40px", marginTop: "20px", cursor: "pointer" }}>SUBMIT FOR AUDIT →</button>
    </div>
  );

  if (screen === "results") {
    const passed = results.total >= 80;
    return wrap(
      <div style={{ animation: "fadeUp 0.5s ease" }}>
        <div style={{ background: "#0d0d0d", padding: "40px", textAlign: "center", borderTop: `4px solid ${RED}`, marginBottom: "16px" }}>
          <div style={{ ...H, fontSize: "100px", color: RED, lineHeight: "1" }}>{results.total}</div>
          <div style={{ ...H, fontSize: "24px" }}>{results.grade.toUpperCase()}</div>
        </div>

        {/* LATEST SCORES TRACKER */}
        {history.length > 1 && (
          <div style={{ marginBottom: "24px", padding: "16px", background: "#111", border: "1px solid #222" }}>
            <div style={{ ...H, fontSize: "12px", color: GREY, marginBottom: "12px", textAlign: "center", letterSpacing: "0.1em" }}>BATTLE RECORDS</div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {history.map((s, i) => {
                const isCurrent = i === history.length - 1;
                return (
                  <div key={i} style={{ 
                    flex: 1, 
                    maxWidth: "60px",
                    background: isCurrent ? RED : "#222", 
                    color: isCurrent ? WHITE : "#555", 
                    padding: "10px 0", 
                    textAlign: "center", 
                    ...H, 
                    fontSize: "20px",
                    border: isCurrent ? "none" : "1px solid #333"
                  }}>
                    {s}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
          <div style={{ ...H, fontSize: "13px", letterSpacing: "0.25em", color: passed ? RED : GREY, marginBottom: "8px" }}>{passed ? "ACHIEVEMENT UNLOCKED" : "STRICT AUDIT: KEEP PRACTISING"}</div>
          <div style={{ ...H, fontSize: "32px", letterSpacing: "0.06em", color: passed ? WHITE : "#444", marginBottom: "8px" }}>{passed ? "PROMPT MASTER" : "NOT YET..."}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button onClick={startNewBattle} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", padding: "20px", cursor: "pointer", width: "100%" }}>REPLAY CHALLENGE</button>
          <button onClick={() => window.location.href = "https://bigspaceai.com"} style={{ background: "transparent", border: "1px solid #333", color: GREY, ...H, fontSize: "16px", padding: "16px", cursor: "pointer", width: "100%" }}>VISIT BIGSPACEAI.COM</button>
        </div>

        <p style={{ ...B, fontSize: "12px", color: "#333", textAlign: "center", marginTop: "24px" }}>BIGSPACEAI.COM · BEGINNER LEVEL</p>
      </div>
    );
  }

  return null;
}
