"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

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

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

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

  // For demo purposes, return demo feedback
  if (interviewId === "demo-interview-1" || interviewId === "demo-interview-2") {
    return DEMO_FEEDBACK as Feedback;
  }

  // Check in-memory storage
  for (const [feedbackId, feedback] of Object.entries(feedbackStorage)) {
    if (feedback.interviewId === interviewId && feedbackUserMapping[feedbackId] === userId) {
      return feedback;
    }
  }

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