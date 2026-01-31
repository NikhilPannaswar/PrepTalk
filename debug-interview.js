// Debug script to test interview functionality - Run in browser console
// Run this in browser console to check for issues

console.log("=== PrepTalk Interview Debug Script ===");

// Check if running in secure context
console.log("1. Secure Context:", window.isSecureContext);

// Check Speech Recognition support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
console.log("2. Speech Recognition Support:", !!SpeechRecognition);

// Check Speech Synthesis support
console.log("3. Speech Synthesis Support:", !!window.speechSynthesis);

// Check available voices
if (window.speechSynthesis) {
  const voices = window.speechSynthesis.getVoices();
  console.log("4. Available Voices:", voices.length);
  console.log("   English Voices:", voices.filter(v => v.lang.includes('en')));
}

// Check microphone permissions
if (navigator.permissions) {
  navigator.permissions.query({ name: 'microphone' }).then(function(permissionStatus) {
    console.log("5. Microphone Permission:", permissionStatus.state);
    if (permissionStatus.state === 'denied') {
      console.warn("   ⚠️ Microphone permission denied! Please allow microphone access.");
    }
  });
} else {
  console.log("5. Microphone Permission: Cannot check (Permissions API not supported)");
}

// Test Gemini API connection
const testGemini = () => {
  console.log("6. Testing Gemini API...");
  fetch('/api/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "Hello, this is a test message",
      conversationHistory: [],
      interviewContext: {
        role: "Frontend Developer",
        type: "Technical",
        level: "Mid-Level",
        techstack: ["React", "JavaScript"],
        questions: ["Tell me about yourself"]
      },
      userName: "Test User"
    })
  })
  .then(response => {
    console.log("   Response Status:", response.status);
    return response.json();
  })
  .then(data => {
    console.log("   ✅ Gemini API Response:", data);
    if (data.success) {
      console.log("   📝 AI Response:", data.response);
    } else {
      console.error("   ❌ API Error:", data.error);
    }
  })
  .catch(error => {
    console.error("   ❌ Gemini API Error:", error);
  });
};

// Test Speech Recognition
const testSpeechRecognition = () => {
  if (!SpeechRecognition) {
    console.log("7. ❌ Cannot test Speech Recognition - not supported");
    return;
  }
  
  console.log("7. Testing Speech Recognition...");
  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = function(event) {
      console.log("   ✅ Speech Recognition Result:", event.results[0][0].transcript);
      recognition.stop();
    };
    
    recognition.onerror = function(event) {
      console.error("   ❌ Speech Recognition Error:", event.error);
    };
    
    recognition.onend = function() {
      console.log("   Speech Recognition ended");
    };
    
    // Start recognition for 3 seconds
    recognition.start();
    console.log("   🎤 Listening for 3 seconds... Say something!");
    
    setTimeout(() => {
      recognition.stop();
    }, 3000);
    
  } catch (error) {
    console.error("   ❌ Speech Recognition Test Error:", error);
  }
};

// Test Text-to-Speech
const testTextToSpeech = () => {
  if (!window.speechSynthesis) {
    console.log("8. ❌ Cannot test Text-to-Speech - not supported");
    return;
  }
  
  console.log("8. Testing Text-to-Speech...");
  try {
    const utterance = new SpeechSynthesisUtterance("Hello, this is a test of text to speech functionality.");
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => console.log("   🗣️ TTS Started");
    utterance.onend = () => console.log("   ✅ TTS Completed");
    utterance.onerror = (e) => console.error("   ❌ TTS Error:", e.error);
    
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("   ❌ TTS Test Error:", error);
  }
};

// Run tests
testGemini();
setTimeout(testSpeechRecognition, 1000);
setTimeout(testTextToSpeech, 4000);

console.log("=== Debug Tests Started - Check results above ===");
console.log("💡 Tip: If microphone permission is denied, click the microphone icon in the address bar to allow access.");
console.log("💡 Tip: Make sure you're using Chrome or Edge browser for best compatibility.");
console.log("💡 Tip: The page must be served over HTTPS in production for speech features to work.");