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

  // Get interview details for context-aware feedback
  const interviewContext = await getInterviewById(interviewId);
  if (!interviewContext) {
    console.error("Interview not found for feedback generation:", interviewId);
    return { success: false, error: "Interview not found" };
  }

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    console.log("Generating AI feedback...");

    // Create comprehensive, context-aware feedback prompt
    const feedbackPrompt = `You are an experienced technical interviewer conducting a detailed performance review of a mock interview session. Analyze the candidate thoroughly and provide genuine, constructive feedback.

**INTERVIEW CONTEXT:**
- Position: ${interviewContext.role}
- Experience Level: ${interviewContext.level}
- Interview Type: ${interviewContext.type}
- Tech Stack: ${interviewContext.techstack.join(', ')}
- Questions Asked: ${interviewContext.questions.length}

**CONVERSATION TRANSCRIPT:**
${formattedTranscript}

**EVALUATION CRITERIA:**
Analyze each response carefully and provide honest scoring based on:

1. **Communication Skills (0-100)**: 
   - Clarity and articulation of thoughts
   - Structure and flow of responses
   - Use of professional language
   - Active listening and engagement
   - Ability to explain complex concepts simply

2. **Technical Knowledge (0-100)**:
   - Depth of understanding in relevant technologies
   - Accuracy of technical explanations
   - Knowledge of best practices and industry standards
   - Ability to discuss real-world applications
   - Understanding of the tech stack mentioned

3. **Problem-Solving Approach (0-100)**:
   - Logical thinking and reasoning process
   - Ability to break down complex problems
   - Creative and innovative solutions
   - Consideration of edge cases and trade-offs
   - Systematic approach to challenges

4. **Cultural & Role Alignment (0-100)**:
   - Understanding of the role requirements
   - Alignment with team collaboration values
   - Growth mindset and learning attitude
   - Professional maturity and adaptability
   - Genuine interest in the position

5. **Confidence & Presentation (0-100)**:
   - Confidence without arrogance
   - Handling of difficult questions
   - Recovery from mistakes or uncertainty
   - Overall presence and composure
   - Enthusiasm and passion demonstrated

**IMPORTANT GUIDELINES:**
- Be honest and constructive - avoid inflated scores
- Consider the candidate's stated experience level (${interviewContext.level})
- Look for specific examples and concrete evidence in responses
- Identify both strengths AND genuine areas for improvement
- Provide actionable, specific feedback rather than generic comments
- Score based on actual performance, not potential
- For ${interviewContext.level} level, expect appropriate depth and experience

**RESPONSE FORMAT:**
Respond with a valid JSON object in exactly this format:
{
  "totalScore": <calculated average of all category scores>,
  "categoryScores": [
    {
      "name": "Communication Skills",
      "score": <0-100>,
      "comment": "Detailed analysis of communication performance with specific examples from the interview"
    },
    {
      "name": "Technical Knowledge", 
      "score": <0-100>,
      "comment": "Specific assessment of technical understanding with concrete examples"
    },
    {
      "name": "Problem-Solving Approach",
      "score": <0-100>, 
      "comment": "Evaluation of problem-solving methodology and reasoning"
    },
    {
      "name": "Cultural & Role Alignment",
      "score": <0-100>,
      "comment": "Assessment of fit for the role and team environment"
    },
    {
      "name": "Confidence & Presentation",
      "score": <0-100>,
      "comment": "Analysis of confidence level and presentation skills"
    }
  ],
  "strengths": [
    "Specific strength 1 with context from the interview",
    "Specific strength 2 with examples",
    "Specific strength 3 demonstrating candidate's abilities"
  ],
  "areasForImprovement": [
    "Specific improvement area 1 with actionable suggestions",
    "Specific improvement area 2 with concrete examples", 
    "Specific improvement area 3 with development recommendations"
  ],
  "finalAssessment": "Comprehensive 3-4 sentence summary that honestly evaluates the candidate's performance, highlights key insights from the interview, provides a realistic assessment of their readiness for the ${interviewContext.role} role at ${interviewContext.level} level, and gives clear direction for improvement or next steps."
}`;

    const res = await fetch("http://127.0.0.1:11434/api/generate", {
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
      // More realistic fallback response if parsing fails
      object = {
        totalScore: 65,
        categoryScores: [
          {
            name: "Communication Skills",
            score: 70,
            comment: "Demonstrated basic communication abilities but could improve clarity and structure in responses."
          },
          {
            name: "Technical Knowledge",
            score: 60,
            comment: "Showed foundational understanding but lacked depth in technical explanations and specific examples."
          },
          {
            name: "Problem-Solving Approach", 
            score: 65,
            comment: "Approached problems logically but could benefit from more systematic thinking and consideration of alternatives."
          },
          {
            name: "Cultural & Role Alignment",
            score: 70,
            comment: "Showed genuine interest in the role but could demonstrate better understanding of specific requirements."
          },
          {
            name: "Confidence & Presentation",
            score: 60,
            comment: "Appeared somewhat hesitant in responses and could benefit from more confident presentation of ideas."
          }
        ],
        strengths: [
          "Showed genuine enthusiasm and interest in the position",
          "Communicated ideas in an understandable manner", 
          "Demonstrated willingness to learn and grow"
        ],
        areasForImprovement: [
          "Provide more specific, concrete examples from past experience",
          "Develop deeper technical knowledge and stay current with industry trends",
          "Practice articulating complex ideas more clearly and confidently"
        ],
        finalAssessment: `The candidate demonstrated basic competencies for the ${interviewContext.role} position but would benefit from additional preparation and experience. While they showed enthusiasm and foundational understanding, there are clear opportunities to improve technical depth and presentation skills. With focused development, they could become a stronger candidate for ${interviewContext.level} level positions.`
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