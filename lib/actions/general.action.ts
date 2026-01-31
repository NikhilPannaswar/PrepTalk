"use server";

import { feedbackSchema } from "@/constants";
import { DEMO_INTERVIEW, DEMO_FEEDBACK } from "@/constants/demoData";

// In-memory storage for demo purposes
let interviewStorage: { [key: string]: Interview } = {};
let feedbackStorage: { [key: string]: Feedback } = {};
let feedbackUserMapping: { [key: string]: string } = {}; // feedbackId -> userId

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  console.log("Creating feedback for interview:", interviewId);
  console.log("Transcript length:", transcript?.length || 0);

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    console.log("Generating AI feedback...");

    // Create the feedback prompt for Ollama
    const feedbackPrompt = `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.

Transcript:
${formattedTranscript}

Please score the candidate from 0 to 100 in the following areas and respond with a valid JSON object:
- **Communication Skills**: Clarity, articulation, structured responses.
- **Technical Knowledge**: Understanding of key concepts for the role.
- **Problem-Solving**: Ability to analyze problems and propose solutions.
- **Cultural & Role Fit**: Alignment with company values and job role.
- **Confidence & Clarity**: Confidence in responses, engagement, and clarity.

Respond with a JSON object in this exact format:
{
  "totalScore": <average of all scores>,
  "categoryScores": {
    "communicationSkills": <score 0-100>,
    "technicalKnowledge": <score 0-100>,
    "problemSolving": <score 0-100>,
    "culturalFit": <score 0-100>,
    "confidenceClarity": <score 0-100>
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["improvement1", "improvement2", "improvement3"],
  "finalAssessment": "Overall assessment summary"
}`;

    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: feedbackPrompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error! status: ${res.status}`);
    }

    const data = await res.json();
    let object;
    
    try {
      // Try to parse the JSON response from Ollama
      const responseText = data.response.trim();
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      object = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing Ollama response:", parseError);
      // Fallback response if parsing fails
      object = {
        totalScore: 75,
        categoryScores: {
          communicationSkills: 75,
          technicalKnowledge: 75,
          problemSolving: 75,
          culturalFit: 75,
          confidenceClarity: 75
        },
        strengths: ["Shows enthusiasm", "Communicates clearly", "Demonstrates basic knowledge"],
        areasForImprovement: ["Could provide more specific examples", "Needs to show more technical depth", "Should ask more questions"],
        finalAssessment: "The candidate shows potential but needs more preparation and practice to improve their interview performance."
      };
    }

    const feedback = {
      id: feedbackId || `feedback-${Date.now()}`,
      interviewId: interviewId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    console.log("Generated feedback:", feedback.totalScore);

    // Store in memory for demo along with userId for reference
    feedbackStorage[feedback.id] = feedback;
    feedbackUserMapping[feedback.id] = userId;

    console.log("Feedback saved successfully");
    return { success: true, feedbackId: feedback.id };
  } catch (error) {
    console.error("Error creating feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  console.log("Getting interview by ID:", id);
  
  // For demo purposes, return demo data if id matches
  if (id === "demo-interview-1" || id === "demo-interview-2") {
    return DEMO_INTERVIEW as Interview;
  }

  // Check in-memory storage
  const interview = interviewStorage[id];
  if (interview) {
    return interview;
  }

  // Return demo interview as fallback
  return DEMO_INTERVIEW as Interview;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  console.log("Getting feedback for interview:", interviewId);

  // For demo purposes, return demo feedback for demo interviews
  if (interviewId === "demo-interview-1" || interviewId === "demo-interview-2") {
    return DEMO_FEEDBACK as Feedback;
  }

  // Check in-memory storage - search by interview ID first
  for (const [feedbackId, feedback] of Object.entries(feedbackStorage)) {
    if (feedback.interviewId === interviewId) {
      console.log("Found feedback for interview:", interviewId);
      return feedback;
    }
  }

  console.log("No feedback found for interview:", interviewId);
  return null;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  console.log("Getting latest interviews");
  
  // Return demo data for now
  return [DEMO_INTERVIEW as Interview];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  console.log("Getting interviews for user:", userId);
  
  // Return user's interviews from memory storage
  const userInterviews = Object.values(interviewStorage)
    .filter(interview => interview.userId === userId);
  
  // Include demo interview for demonstration
  return [DEMO_INTERVIEW as Interview, ...userInterviews];
}

// Helper function to store interviews in memory
export async function storeInterview(interview: Interview) {
  console.log("Storing interview:", interview.id);
  interviewStorage[interview.id] = interview;
}