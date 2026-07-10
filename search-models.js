async function search() {
  try {
    const res = await fetch("https://huggingface.co/api/models?search=medgemma");
    const json = await res.json();
    for (const model of json.slice(0, 10)) {
      console.log(model.id);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
search();
