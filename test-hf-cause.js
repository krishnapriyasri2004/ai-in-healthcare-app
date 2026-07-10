async function test() {
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/google/medgemma-27b-it/v1/chat/completions", {
      method: "POST"
    });
    console.log("Status:", res.status);
  } catch (e) {
    console.error("Fetch error:", e.message);
    console.error("Cause:", e.cause);
  }
}
test();
