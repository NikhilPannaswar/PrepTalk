import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  try {
    const questionPrompt = `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3`;

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: questionPrompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error! status: ${res.status}`);
    }

    const data = await res.json();
    let questions;
    
    try {
      // Try to parse the JSON response from Ollama
      const responseText = data.response.trim();
      // Extract JSON array from response if it's wrapped in text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      questions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing Ollama response:", parseError);
      // Fallback questions if parsing fails
      questions = [
        "Can you tell me about yourself and your background?",
        "What interests you about this role?",
        "Describe a challenging project you worked on recently.",
        `How would you approach a problem using ${techstack}?`,
        "What are your career goals for the next few years?"
      ].slice(0, amount);
    }

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    // Note: Firebase/db operations removed for Ollama implementation
    // await db.collection("interviews").add(interview);

    return Response.json({ success: true, interview: interview }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}