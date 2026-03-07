import { useState, useEffect, useRef } from "react";

const RED = "#eb1d25";
const BLACK = "#0a0a0a";
const WHITE = "#ffffff";
const GREY = "#888888";
const DARKGREY = "#1a1a1a";

const CHALLENGES = {
  beginner: [
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
  ],
  intermediate: [
    {
      id: "i1", title: "THE ROLE PLAYER",
      scenario: "Get an AI to act as a tough-but-fair venture capitalist and critique your business idea of 'an app that reminds you to drink water.'",
      hint: "Think about: persona definition, tone calibration, specific constraints for the critique",
      evaluationFocus: "persona clarity, constraint setting, specificity of task"
    },
    {
      id: "i2", title: "THE FORMAT MASTER",
      scenario: "Get an AI to produce a weekly meal plan for a busy professional — but make it actually usable and scannable.",
      hint: "Think about: output format, constraints, what makes something 'usable' vs just a wall of text?",
      evaluationFocus: "format control, constraint clarity, practical usefulness"
    },
    {
      id: "i3", title: "THE TONE SHIFTER",
      scenario: "Get an AI to write the same rejection email in three completely different tones: corporate, Gen Z casual, and Shakespearean.",
      hint: "Think about: how do you specify tone? What anchors do you give the AI to nail each one?",
      evaluationFocus: "tone specification, multi-output structuring, contrast"
    }
  ],
  advanced: [
    {
      id: "a1", title: "THE CHAIN THINKER",
      scenario: "Get an AI to analyse why remote work might actually be hurting junior employees' careers — using a structured framework it builds itself.",
      hint: "Think about: chain-of-thought prompting, asking the AI to reason before concluding, framework construction",
      evaluationFocus: "reasoning scaffolding, framework elicitation, depth of analysis"
    },
    {
      id: "a2", title: "THE CRITIC'S CRITIC",
      scenario: "Get an AI to write a social media post, then immediately critique it as a harsh editor, then rewrite it based on the critique.",
      hint: "Think about: multi-step outputs, role switching within one prompt, quality control loops",
      evaluationFocus: "multi-step structuring, self-critique elicitation, iteration"
    },
    {
      id: "a3", title: "THE PERSONA ARCHITECT",
      scenario: "Build a prompt that turns an AI into a specific, memorable persona for a fictional brand — consistent across any question asked.",
      hint: "Think about: persona depth, constraints, fallback behaviour, voice consistency",
      evaluationFocus: "persona construction, constraint comprehensiveness, consistency engineering"
    }
  ]
};

const LEVELS = {
  beginner:     { label: "BEGINNER",     emoji: "🌱", passMark: 65, badge: "PROMPT SEEDLING",     desc: "Just starting out with AI prompts" },
  intermediate: { label: "INTERMEDIATE", emoji: "⚡", passMark: 72, badge: "PROMPT PRACTITIONER", desc: "Comfortable with the basics" },
  advanced:     { label: "ADVANCED",     emoji: "🔥", passMark: 80, badge: "PROMPT MASTER",       desc: "Ready to go deep" }
};

async function judgePrompt(challenge, userPrompt, level) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a senior AI trainer at BigSpaceAI, a leading AI education company in Singapore. You speak in first person as a human expert reviewing a student's work — never mention AI, Claude, or any language model. Your tone is direct, encouraging, and professional, like a seasoned coach giving real feedback after a workshop.

Score on four criteria (each 0-25):
- Clarity: Is the instruction clear and unambiguous?
- Specificity: Does it provide enough detail and constraints?
- Awareness: Does it show understanding of audience and context?
- Craft: Does it use good prompting techniques?

Write the verdict in first person as a human expert — e.g. "What I liked here is...", "Where I'd push you to improve...", "This shows solid instincts...". Never say "the AI", "the model", or "Claude". Sound like a real trainer reviewing real work.

Return ONLY valid JSON, no markdown, no preamble:
{
  "scores": { "clarity": 0-25, "specificity": 0-25, "awareness": 0-25, "craft": 0-25 },
  "total": 0-100,
  "grade": "Needs Work|Getting There|Solid|Excellent|Outstanding",
  "verdict": "2-3 sentence expert feedback in first person, warm but honest",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "proTip": "one specific actionable tip written as a coach speaking directly to the student"
}`,
      messages: [{
        role: "user",
        content: `CHALLENGE: ${challenge.scenario}\nEVALUATION FOCUS: ${challenge.evaluationFocus}\nLEVEL: ${level}\n\nSTUDENT PROMPT:\n${userPrompt}`
      }]
    })
  });
  const data = await response.json();
  return JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
}

const GridBg = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
    backgroundSize: "80px 80px"
  }} />
);

const RedBar = () => (
  <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "6px", background: RED, zIndex: 100 }} />
);

const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{
      width: "28px", height: "28px", background: RED, borderRadius: "4px",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <span style={{ color: WHITE, fontSize: "14px", fontWeight: "900", fontFamily: "'Anton', sans-serif" }}>B</span>
    </div>
    <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "16px", letterSpacing: "0.1em", color: WHITE }}>
      BIGSPACE<span style={{ color: RED }}>AI</span>
    </span>
  </div>
);

function ScoreBar({ label, value, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value / 25 * 100), delay + 300);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "13px", letterSpacing: "0.12em", color: GREY }}>{label}</span>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "14px", color: value >= 20 ? RED : value >= 15 ? WHITE : GREY }}>{value}/25</span>
      </div>
      <div style={{ background: "#1f1f1f", height: "6px", borderRadius: "0" }}>
        <div style={{
          width: `${width}%`, height: "100%", background: RED,
          transition: "width 0.9s cubic-bezier(0.22, 1, 0.36, 1)"
        }} />
      </div>
    </div>
  );
}

const GRADE_COLORS = {
  "Needs Work": "#666", "Getting There": "#aaa", "Solid": WHITE, "Excellent": RED, "Outstanding": RED
};

export default function PromptBattle() {
  const [screen, setScreen] = useState("home");
  const [level, setLevel] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const pickChallenge = (lvl) => {
    const list = CHALLENGES[lvl];
    setChallenge(list[Math.floor(Math.random() * list.length)]);
    setLevel(lvl);
    setUserPrompt("");
    setResults(null);
    setError(null);
    setScreen("challenge");
  };

  const submit = async () => {
    if (userPrompt.trim().length < 20) return;
    setScreen("judging");
    try {
      const r = await judgePrompt(challenge, userPrompt, level);
      setResults(r);
      setScreen("results");
    } catch {
      setError("Connection failed. Try again.");
      setScreen("challenge");
    }
  };

  const wrap = (children) => (
    <div style={{ minHeight: "100vh", background: BLACK, color: WHITE, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BLACK}; }
        textarea:focus { outline: none; border-color: ${RED} !important; }
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
          {screen !== "home" && (
            <button onClick={() => setScreen("home")} style={{
              background: "transparent", border: "1px solid #333", color: GREY,
              fontFamily: "'Barlow', sans-serif", fontSize: "12px", padding: "6px 14px",
              cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase"
            }}>← HOME</button>
          )}
        </div>
        {children}
      </div>
    </div>
  );

  if (screen === "home") return wrap(
    <div style={{ animation: "fadeUp 0.6s ease forwards", paddingTop: "64px" }}>
      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "11px", letterSpacing: "0.25em", color: RED, textTransform: "uppercase", marginBottom: "20px" }}>
        AI CREATOR TOOLKIT
      </div>
      <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(56px, 13vw, 96px)", lineHeight: "0.95", letterSpacing: "0.02em", marginBottom: "8px", color: WHITE }}>
        PROMPT<br /><span style={{ color: RED }}>BATTLE.</span>
      </h1>
      <div style={{ width: "60px", height: "4px", background: RED, margin: "24px 0" }} />
      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "17px", lineHeight: "1.7", color: GREY, maxWidth: "480px", marginBottom: "48px" }}>
        Test your AI prompting skills. Write prompts. Get reviewed by our expert panel. Earn your badge.
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "52px" }}>
        {["✍️ WRITE A PROMPT", "🔬 EXPERTS ANALYSE IT", "📊 GET SCORED", "🏆 EARN A BADGE"].map((s, i) => (
          <div key={i} style={{ border: "1px solid #222", padding: "8px 14px", fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.1em", color: GREY }}>{s}</div>
        ))}
      </div>
      <button onClick={() => setScreen("level")} style={{ background: RED, border: "none", color: WHITE, fontFamily: "'Anton', sans-serif", fontSize: "18px", letterSpacing: "0.12em", padding: "18px 48px", cursor: "pointer" }}>
        START BATTLE →
      </button>
      <div style={{ marginTop: "64px", borderTop: "1px solid #1a1a1a", paddingTop: "24px" }}>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: "#444", letterSpacing: "0.05em" }}>
          Part of the BigSpaceAI AI Prompting Essentials course
        </p>
      </div>
    </div>
  );

  if (screen === "level") return wrap(
    <div style={{ animation: "fadeUp 0.5s ease forwards", paddingTop: "48px" }}>
      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "11px", letterSpacing: "0.25em", color: RED, textTransform: "uppercase", marginBottom: "16px" }}>
        SELECT DIFFICULTY
      </div>
      <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(36px, 8vw, 56px)", letterSpacing: "0.03em", marginBottom: "8px" }}>
        HOW CONFIDENT<br />ARE YOU?
      </h2>
      <div style={{ width: "40px", height: "4px", background: RED, marginBottom: "40px" }} />
      {Object.entries(LEVELS).map(([key, cfg], i) => (
        <button key={key} onClick={() => pickChallenge(key)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "transparent",
          border: "1px solid #222", borderLeft: `4px solid ${i === 0 ? "#333" : i === 1 ? "#555" : RED}`,
          padding: "24px 28px", marginBottom: "12px", cursor: "pointer", textAlign: "left"
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.borderLeftColor = RED; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderLeftColor = i === 0 ? "#333" : i === 1 ? "#555" : RED; }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <span style={{ fontSize: "22px" }}>{cfg.emoji}</span>
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: "22px", letterSpacing: "0.1em", color: WHITE }}>{cfg.label}</span>
            </div>
            <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY }}>
              {cfg.desc} · Pass mark: {cfg.passMark}/100
            </div>
          </div>
          <span style={{ color: RED, fontSize: "24px", fontFamily: "'Anton', sans-serif" }}>→</span>
        </button>
      ))}
    </div>
  );

  if (screen === "challenge") {
    const cfg = LEVELS[level];
    return wrap(
      <div style={{ animation: "fadeUp 0.5s ease forwards", paddingTop: "40px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "32px" }}>
          <span style={{ background: RED, fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.15em", color: WHITE, padding: "4px 12px" }}>{cfg.emoji} {cfg.label}</span>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: GREY, letterSpacing: "0.08em", textTransform: "uppercase" }}>{challenge.title}</span>
        </div>
        <div style={{ border: "1px solid #222", borderTop: `3px solid ${RED}`, padding: "28px", marginBottom: "20px" }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.2em", color: RED, marginBottom: "16px" }}>YOUR CHALLENGE</div>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "17px", lineHeight: "1.75", color: WHITE, marginBottom: "24px", fontWeight: "500" }}>{challenge.scenario}</p>
          <div style={{ background: "#111", borderLeft: `3px solid ${RED}`, padding: "14px 18px" }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "10px", letterSpacing: "0.2em", color: RED, marginBottom: "6px" }}>HINT</div>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY, lineHeight: "1.6" }}>{challenge.hint}</p>
          </div>
        </div>
        <div style={{ border: "1px solid #222", padding: "28px", marginBottom: "20px" }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.2em", color: RED, marginBottom: "16px" }}>WRITE YOUR PROMPT</div>
          <textarea
            value={userPrompt}
            onChange={e => setUserPrompt(e.target.value)}
            placeholder="Write your prompt here. Be specific, set context, define the output format..."
            style={{ width: "100%", minHeight: "160px", background: "#0f0f0f", border: "1px solid #2a2a2a", color: WHITE, fontSize: "15px", lineHeight: "1.7", padding: "16px", fontFamily: "'Barlow', sans-serif", resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: userPrompt.length < 20 ? RED : "#555" }}>
              {userPrompt.length < 20 ? `${20 - userPrompt.length} more chars needed` : `${userPrompt.length} characters`}
            </span>
            <button onClick={submit} disabled={userPrompt.trim().length < 20} style={{
              background: userPrompt.trim().length < 20 ? "#222" : RED,
              border: "none", color: userPrompt.trim().length < 20 ? "#555" : WHITE,
              fontFamily: "'Anton', sans-serif", fontSize: "15px", letterSpacing: "0.12em",
              padding: "14px 32px", cursor: userPrompt.trim().length < 20 ? "not-allowed" : "pointer"
            }}>SUBMIT FOR REVIEW →</button>
          </div>
          {error && <p style={{ color: RED, fontFamily: "'Barlow', sans-serif", fontSize: "13px", marginTop: "12px" }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (screen === "judging") return wrap(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
      <div style={{ width: "64px", height: "64px", border: `3px solid #222`, borderTop: `3px solid ${RED}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "32px" }} />
      <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: "32px", letterSpacing: "0.08em", marginBottom: "16px" }}>
        ANALYSING YOUR PROMPT...
      </h2>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
        {["CLARITY", "SPECIFICITY", "AWARENESS", "CRAFT"].map((c, i) => (
          <span key={i} style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.15em", color: GREY, animation: `pulse 1.5s ease ${i * 0.3}s infinite` }}>{c} ·</span>
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
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.25em", color: GREY, marginBottom: "16px" }}>YOUR SCORE</div>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "clamp(80px, 20vw, 120px)", lineHeight: "1", color: passed ? RED : WHITE, marginBottom: "8px" }}>{results.total}</div>
          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY, marginBottom: "20px" }}>out of 100 · Pass mark: {cfg.passMark}</div>
          <span style={{ background: passed ? RED : "#1a1a1a", border: `1px solid ${passed ? RED : "#333"}`, fontFamily: "'Anton', sans-serif", fontSize: "14px", letterSpacing: "0.15em", color: WHITE, padding: "8px 20px" }}>
            {results.grade.toUpperCase()}
          </span>
        </div>
        <div style={{ border: "1px solid #1f1f1f", padding: "28px", marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.2em", color: RED, marginBottom: "24px" }}>SCORE BREAKDOWN</div>
          <ScoreBar label="CLARITY" value={results.scores.clarity} delay={0} />
          <ScoreBar label="SPECIFICITY" value={results.scores.specificity} delay={150} />
          <ScoreBar label="CONTEXT AWARENESS" value={results.scores.awareness} delay={300} />
          <ScoreBar label="CRAFT & TECHNIQUE" value={results.scores.craft} delay={450} />
        </div>
        <div style={{ border: "1px solid #1f1f1f", borderLeft: `4px solid ${RED}`, padding: "28px", marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.2em", color: RED, marginBottom: "16px" }}>EXPERT FEEDBACK</div>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "16px", lineHeight: "1.8", color: "#ccc", marginBottom: "28px" }}>{results.verdict}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.15em", color: WHITE, marginBottom: "12px" }}>✓ STRENGTHS</div>
              {results.strengths.map((s, i) => (
                <div key={i} style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY, lineHeight: "1.6", marginBottom: "8px", paddingLeft: "12px", borderLeft: `2px solid ${RED}` }}>{s}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.15em", color: WHITE, marginBottom: "12px" }}>↑ TO IMPROVE</div>
              {results.improvements.map((s, i) => (
                <div key={i} style={{ fontFamily: "'Barlow', sans-serif", fontSize: "13px", color: GREY, lineHeight: "1.6", marginBottom: "8px", paddingLeft: "12px", borderLeft: "2px solid #333" }}>{s}</div>
              ))}
            </div>
          </div>
          <div style={{ background: "#111", borderLeft: `3px solid ${RED}`, padding: "16px 20px" }}>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "10px", letterSpacing: "0.2em", color: RED, marginBottom: "6px" }}>⚡ PRO TIP</div>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "14px", color: "#aaa", lineHeight: "1.6" }}>{results.proTip}</p>
          </div>
        </div>
        <div style={{ border: `2px solid ${passed ? RED : "#222"}`, background: passed ? "rgba(235,29,37,0.06)" : "#0d0d0d", padding: "32px", textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>{passed ? cfg.emoji : "💪"}</div>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "11px", letterSpacing: "0.25em", color: passed ? RED : GREY, marginBottom: "8px" }}>
            {passed ? "ACHIEVEMENT UNLOCKED" : "KEEP PRACTISING"}
          </div>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: "28px", letterSpacing: "0.08em", color: passed ? WHITE : "#444", marginBottom: "8px" }}>
            {passed ? cfg.badge : "NOT YET..."}
          </div>
          {passed && <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: GREY }}>BigSpaceAI Certified · {new Date().toLocaleDateString("en-SG", { month: "short", year: "numeric" })}</div>}
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={() => pickChallenge(level)} style={{ background: RED, border: "none", color: WHITE, fontFamily: "'Anton', sans-serif", fontSize: "15px", letterSpacing: "0.12em", padding: "16px 32px", cursor: "pointer", flex: 1 }}>TRY ANOTHER →</button>
          <button onClick={() => setScreen("level")} style={{ background: "transparent", border: "1px solid #333", color: GREY, fontFamily: "'Anton', sans-serif", fontSize: "15px", letterSpacing: "0.12em", padding: "16px 32px", cursor: "pointer" }}>CHANGE LEVEL</button>
        </div>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "12px", color: "#333", textAlign: "center", marginTop: "24px", letterSpacing: "0.05em" }}>
          LEARN MORE AT BIGSPACEAI.COM
        </p>
      </div>
    );
  }

  return null;
}
