import { useState, useEffect } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";

const CHALLENGES = [
  { id: "b1", title: "THE EXPLAINER", scenario: "Explain how WiFi works to your 70-year-old grandmother who has never used a smartphone.", hint: "Think about: who is the audience? What do they already know? What analogies might help?", evaluationFocus: "clarity, audience awareness, use of analogy" },
  { id: "b2", title: "THE PRODUCT PITCH", scenario: "Write a compelling product description for a plain white coffee mug.", hint: "Think about: tone, sensory details, emotional appeal, who buys mugs and why?", evaluationFocus: "creativity, persuasion, specificity" },
  { id: "b3", title: "THE REWRITER", scenario: "Rewrite this boring sentence to make it exciting: 'The meeting is on Tuesday at 3pm.'", hint: "Think about: energy, context, what makes people actually want to show up?", evaluationFocus: "creativity, transformation, voice" },
  { id: "i1", title: "THE ROLE PLAYER", scenario: "Get the AI to act as a tough venture capitalist and critique your business idea: 'an app that reminds you to drink water.'", hint: "Think about: persona definition and specific constraints.", evaluationFocus: "persona clarity, constraint setting" },
  { id: "i2", title: "THE FORMAT MASTER", scenario: "Generate a weekly meal plan for a busy professional that is actually usable and scannable.", hint: "Think about: output format and practical constraints.", evaluationFocus: "format control, usability" },
  { id: "i3", title: "THE TONE SHIFTER", scenario: "Write a rejection email in three tones: corporate, Gen Z casual, and Shakespearean.", hint: "How do you anchor the tone for each?", evaluationFocus: "tone specification, contrast" },
  { id: "a1", title: "THE CHAIN THINKER", scenario: "Analyse why remote work might be hurting junior careers using a structured framework the AI builds itself.", hint: "Ask the AI to reason before concluding.", evaluationFocus: "reasoning scaffolding, depth" },
  { id: "a2", title: "THE CRITIC'S CRITIC", scenario: "Write a post, have the AI critique it harshly, then rewrite it based on that critique.", hint: "Think about multi-step outputs and loops.", evaluationFocus: "self-critique, iteration" },
  { id: "a3", title: "THE PERSONA ARCHITECT", scenario: "Build a prompt that creates a specific, memorable AI persona for a fictional brand.", hint: "Define voice consistency and fallback behavior.", evaluationFocus: "persona construction, consistency" }
];

async function judgePrompt(challenge, userPrompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1000,
      system: `You are an expert AI prompt evaluator for BigSpaceAI. Score 0-25 on: Clarity, Specificity, Awareness, Craft. Return ONLY JSON: { "scores": { "clarity": 0-25, "specificity": 0-25, "awareness": 0-25, "craft": 0-25 }, "total": 0-100, "grade": "Needs Work|Getting There|Solid|Excellent|Outstanding", "verdict": "2-3 sentences", "strengths": [], "improvements": [], "proTip": "one tip" }`,
      messages: [{ role: "user", content: `CHALLENGE: ${challenge.scenario}\nPROMPT: ${userPrompt}` }]
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
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", color: GREY }}>{label}</span>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "13px", color: WHITE }}>{value}/25</span>
      </div>
      <div style={{ background: "#1f1f1f", height: "6px" }}><div style={{ width: `${width}%`, height: "100%", background: RED, transition: "width 0.9s ease" }} /></div>
    </div>
  );
}

export default function PromptBattle() {
  const [screen, setScreen] = useState("home");
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [results, setResults] = useState(null);

  const startRandomBattle = () => {
    const randomIdx = Math.floor(Math.random() * CHALLENGES.length);
    setChallenge(CHALLENGES[randomIdx]);
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
      setScreen("results");
    } catch {
      setScreen("challenge");
    }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: BLACK, color: WHITE, position: "relative", fontFamily: "'Barlow', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: RED, zIndex: 100 }} />
      <GridBg />
      <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
            <Logo />
            {screen !== "home" && <button onClick={() => setScreen("home")} style={{ background: "transparent", border: "1px solid #333", color: GREY, fontSize: "12px", padding: "6px 12px", cursor: "pointer" }}>HOME</button>}
        </div>
        {children}
      </div>
    </div>
  );

  if (screen === "home") return wrap(
    <div style={{ animation: "fadeUp 0.6s ease", paddingTop: "40px" }}>
      <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: "80px", lineHeight: "0.9", marginBottom: "24px" }}>PROMPT<br /><span style={{ color: RED }}>BATTLE.</span></h1>
      <p style={{ color: GREY, fontSize: "18px", marginBottom: "48px", maxWidth: "400px" }}>Sharpen your AI skills. Get scored instantly. Master the craft of prompting.</p>
      <button onClick={startRandomBattle} style={{ background: RED, border: "none", color: WHITE, fontFamily: "'Anton', sans-serif", fontSize: "18px", padding: "20px 50px", cursor: "pointer" }}>START BATTLE →</button>
    </div>
  );

  if (screen === "judging") return wrap(
    <div style={{ textAlign: "center", paddingTop: "100px" }}>
      <div style={{ width: "60px", height: "60px", border: "3px solid #222", borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
      <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: "32px", marginTop: "32px" }}>PROMPT BATTLE IS JUDGING...</h2>
    </div>
  );

  if (screen === "challenge") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <div style={{ border: "1px solid #222", borderTop: `3px solid ${RED}`, padding: "30px", marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Anton', sans-serif", color: RED, fontSize: "11px", marginBottom: "15px" }}>CHALLENGE: {challenge.title}</div>
        <p style={{ fontSize: "19px", lineHeight: "1.6" }}>{challenge.scenario}</p>
        <div style={{ marginTop: "20px", color: GREY, fontSize: "14px", fontStyle: "italic" }}>Tip: {challenge.hint}</div>
      </div>
      <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Type your prompt..." style={{ width: "100%", height: "180px", background: "#0d0d0d", border: "1px solid #222", color: WHITE, padding: "20px", fontSize: "16px", outline: "none" }} />
      <button onClick={submit} style={{ background: RED, border: "none", color: WHITE, fontFamily: "'Anton', sans-serif", padding: "18px 40px", marginTop: "20px", cursor: "pointer" }}>SUBMIT →</button>
    </div>
  );

  if (screen === "results") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease" }}>
      <div style={{ background: "#0d0d0d", padding: "40px", textAlign: "center", borderTop: `4px solid ${RED}`, marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "100px", color: RED, lineHeight: "1" }}>{results.total}</div>
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "20px", marginTop: "10px" }}>{results.grade.toUpperCase()}</div>
      </div>
      <div style={{ border: "1px solid #1f1f1f", padding: "30px", marginBottom: "20px" }}>
        <ScoreBar label="CLARITY" value={results.scores.clarity} />
        <ScoreBar label="SPECIFICITY" value={results.scores.specificity} delay={100} />
        <ScoreBar label="AWARENESS" value={results.scores.awareness} delay={200} />
        <ScoreBar label="CRAFT" value={results.scores.craft} delay={300} />
      </div>
      <div style={{ borderLeft: `4px solid ${RED}`, padding: "20px", background: "#0d0d0d", marginBottom: "30px" }}>
        <p style={{ color: GREY, fontSize: "13px", marginBottom: "10px" }}>VERDICT</p>
        <p style={{ fontSize: "16px", lineHeight: "1.6" }}>{results.verdict}</p>
      </div>
      <button onClick={startRandomBattle} style={{ background: RED, border: "none", color: WHITE, fontFamily: "'Anton', sans-serif", padding: "20px", width: "100%", cursor: "pointer", fontSize: "18px" }}>NEXT CHALLENGE →</button>
    </div>
  );

  return null;
}
