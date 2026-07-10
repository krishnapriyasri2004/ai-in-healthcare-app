const fs = require("fs");
const envContent = fs.readFileSync(".env.local", "utf8");
let token = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("HUGGINGFACE_API_TOKEN=")) {
    token = line.split("=")[1].trim();
  }
}
async function test() {
  try {
    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model: "google/medgemma-27b-text-it",
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
