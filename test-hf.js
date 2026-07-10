const fs = require("fs");
const envContent = fs.readFileSync(".env.local", "utf8");
let token = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("HUGGINGFACE_API_TOKEN=")) {
    token = line.split("=")[1].trim();
  }
}

async function test() {
  console.log("Token starts with:", token ? token.substring(0, 4) : "NONE");
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/google/medgemma-27b-it/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/medgemma-27b-it",
        messages: [{role: "user", content: "hello"}],
        max_tokens: 10
      })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}
test();
