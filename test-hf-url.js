async function test() {
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/google/medgemma-27b-it/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
