import { useState, useEffect } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";

const H = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, textTransform: "uppercase" };
const B = { fontFamily: "'Barlow', sans-serif" };

const BEGINNER_CHALLENGES = [
  { id: 1, title: "THE EXPLAINER", scenario: "Explain how WiFi works to your 70-year-old grandmother who has never used a smartphone.", hint: "Think about: analogies and audience awareness.", focus: "clarity" },
  { id: 2, title: "THE PRODUCT PITCH", scenario: "Write a compelling product description for a plain white coffee mug.", hint: "Think about: sensory details and emotional appeal.", focus: "creativity" },
  { id: 3, title: "THE REWRITER", scenario: "Rewrite this boring sentence to make it exciting: 'The meeting is on Tuesday at 3pm.'", hint: "Think about: energy and context.", focus: "voice" }
];

async function judgePrompt(challenge, userPrompt) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // TRYING THE EXACT FULL VERSION ID
        model: "claude-3-5-sonnet-20240620", 
        max_tokens: 1000,
        system: "You are a strict Prompt Auditor. Return ONLY JSON.",
        messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nPROMPT: ${userPrompt}` }]
      })
    });

    const data = await response.json();

    // If it's STILL not found, let's try Haiku as a guaranteed fallback
    if (data.error && data.error.type === "not_found_error") {
      console.warn("Sonnet not found, trying Haiku fallback...");
      const backupResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307", 
          max_tokens: 1000,
          system: "Return ONLY JSON.",
          messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nPROMPT: ${userPrompt}` }]
        })
      });
      const backupData = await backupResponse.json();
      if (backupData.error) throw new Error(`Both models failed: ${backupData.error.message}`);
      return processData(backupData);
    }

    if (data.error) throw new Error(data.error.message);
    return processData(data);

  } catch (err) {
    console.error("API Connection Error:", err);
    throw err;
  }
}

// Helper to handle the parsing logic
function processData(data) {
  const rawText = data.content ? data.content[0].text : 
                  data.choices ? data.choices[0].message.content : null;

  if (!rawText) throw new Error("AI returned no content.");

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Response was not valid JSON.");
  
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    total: Number(parsed.total) || 0,
    grade: parsed.grade || "B",
    scores: {
      clarity: Number(parsed.scores?.clarity || 0),
      specificity: Number(parsed.scores?.specificity || 0),
      awareness: Number(parsed.scores?.awareness || 0),
      craft: Number(parsed.scores?.craft || 0)
    },
    scoreReasons: parsed.scoreReasons || {}
  };
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
      <div style={{ background: "#1f1f1f", height: "6px" }}>
        <div style={{ width: `${width}%`, height: "100%", background: RED, transition: "width 0.9s ease-out" }} />
      </div>
      {reason && show && <p style={{ ...B, fontSize: "13px", color: "#888", marginTop: "10px", lineHeight: "1.6" }}>{reason}</p>}
    </div>
  );
}

export default function PromptBattle() {
  const [screen, setScreen] = useState("home");
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  const startNewBattle = () => {
    setChallenge(BEGINNER_CHALLENGES[Math.floor(Math.random() * BEGINNER_CHALLENGES.length)]);
    setUserPrompt("");
    setResults(null);
    setScreen("challenge");
  };

  const submit = async () => {
    if (userPrompt.trim().length < 5) return;
    setScreen("judging");
    try {
      const r = await judgePrompt(challenge, userPrompt);
      setResults(r);
      setHistory(prev => [...prev, r.total].slice(-5));
      setScreen("results");
    } catch (err) { 
      alert(`Submission error: ${err.message}`);
      setScreen("challenge"); 
    }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: BLACK, color: WHITE, position: "relative", padding: "120px 20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=Barlow:wght@400;600&display=swap');`}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: RED, zIndex: 100 }} />
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>{children}</div>
    </div>
  );

  if (screen === "home") return wrap(
    <div>
      <h1 style={{ ...H, fontSize: "80px", lineHeight: "1" }}>PROMPT<br /><span style={{ color: RED }}>BATTLE.</span></h1>
      <button onClick={startNewBattle} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", padding: "18px 40px", marginTop: "40px", cursor: "pointer" }}>START BATTLE</button>
    </div>
  );

  if (screen === "judging") return wrap(
    <div style={{ textAlign: "center", paddingTop: "60px" }}>
      <h2 style={{ ...H, fontSize: "32px" }}>AUDITING...</h2>
    </div>
  );

  if (screen === "challenge") return wrap(
    <div>
      <div style={{ border: "1px solid #222", borderTop: `4px solid ${RED}`, padding: "30px", marginBottom: "30px" }}>
        <h3 style={{ ...H, color: RED, marginBottom: "10px" }}>{challenge.title}</h3>
        <p style={{ ...B, fontSize: "18px" }}>{challenge.scenario}</p>
      </div>
      <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Type your prompt..." style={{ width: "100%", height: "200px", background: "#111", border: "1px solid #333", color: WHITE, padding: "20px", fontSize: "16px", outline: "none" }} />
      <button onClick={submit} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", padding: "18px 40px", marginTop: "20px", cursor: "pointer" }}>SUBMIT</button>
    </div>
  );

  if (screen === "results" && results) return wrap(
    <div>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{ ...H, fontSize: "120px", color: RED, lineHeight: "1" }}>{results.total}</div>
        <div style={{ ...H, fontSize: "24px", color: GREY }}>{results.grade}</div>
      </div>
      <div style={{ background: "#0d0d0d", padding: "30px", border: "1px solid #1a1a1a" }}>
        <ScoreBar label="CLARITY" value={results.scores.clarity} reason={results.scoreReasons.clarity} />
        <ScoreBar label="SPECIFICITY" value={results.scores.specificity} reason={results.scoreReasons.specificity} delay={150} />
        <ScoreBar label="AWARENESS" value={results.scores.awareness} reason={results.scoreReasons.awareness} delay={300} />
        <ScoreBar label="CRAFT" value={results.scores.craft} reason={results.scoreReasons.craft} delay={450} />
      </div>
      <button onClick={startNewBattle} style={{ background: RED, border: "none", color: WHITE, ...H, fontSize: "20px", padding: "20px", width: "100%", marginTop: "30px", cursor: "pointer" }}>NEW CHALLENGE</button>
    </div>
  );

  return null;
}
