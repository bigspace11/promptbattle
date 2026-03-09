export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { pathname } = new URL(req.url, `https://${req.headers.host}`);

  // Mailchimp subscribe endpoint
  if (pathname === "/api/subscribe") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { email, name, score, level } = req.body;
    try {
      const response = await fetch(`https://${process.env.MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(`anystring:${process.env.MAILCHIMP_API_KEY}`).toString("base64")}`
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
          merge_fields: { FNAME: name.split(" ")[0], LNAME: name.split(" ").slice(1).join(" ") || "" },
          tags: ["prompt-battle"],
          merge_fields_extra: { SCORE: score, LEVEL: level }
        })
      });
      const data = await response.json();
      if (data.status === "subscribed" || data.id) return res.status(200).json({ success: true });
      if (data.title === "Member Exists") return res.status(200).json({ success: true, existing: true });
      return res.status(400).json({ error: data.detail || "Subscription failed" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Anthropic chat endpoint
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
