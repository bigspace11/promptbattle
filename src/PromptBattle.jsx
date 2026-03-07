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
  intermedia
