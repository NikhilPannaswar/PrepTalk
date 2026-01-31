// Simple test script to verify Ollama is working
// Run with: node test-ollama.js

async function testOllamaConnection() {
  try {
    console.log("Testing Ollama connection...");
    
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: "What is REST API?",
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Ollama is working!");
    console.log("Response:", data.response);
    
  } catch (error) {
    console.error("❌ Ollama connection failed:", error.message);
    console.log("\n📝 Make sure:");
    console.log("1. Ollama is installed and running");
    console.log("2. Mistral model is downloaded: ollama pull mistral");
    console.log("3. Ollama server is running: ollama serve");
  }
}

testOllamaConnection();