// Test data for demo purposes
export const DEMO_INTERVIEW = {
  id: "demo-interview-1",
  role: "Frontend Developer",
  type: "Technical",
  level: "Mid-Level",
  techstack: ["React", "TypeScript", "Node.js"],
  questions: [
    "Tell me about yourself and your experience with React",
    "How do you manage state in large React applications?",
    "What are the differences between let, const, and var in JavaScript?", 
    "Can you explain how TypeScript improves JavaScript development?",
    "How do you handle error boundaries in React?",
    "What is your experience with testing in React applications?"
  ],
  userId: "test-user-123",
  finalized: true,
  coverImage: "/covers/react.svg",
  createdAt: new Date().toISOString()
};

export const DEMO_INTERVIEWS = [
  {
    id: "demo-interview-1",
    role: "Frontend Developer", 
    type: "Technical",
    level: "Mid-Level",
    techstack: ["React", "TypeScript", "Node.js"],
    questions: [
      "Tell me about yourself and your experience with React",
      "How do you manage state in large React applications?",
      "What are the differences between let, const, and var in JavaScript?", 
      "Can you explain how TypeScript improves JavaScript development?"
    ],
    userId: "test-user-123",
    finalized: true,
    coverImage: "/covers/react.svg",
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-interview-2", 
    role: "Full Stack Developer",
    type: "Mixed",
    level: "Senior",
    techstack: ["Python", "Django", "PostgreSQL"],
    questions: [
      "Describe your experience with backend development",
      "How do you optimize database queries?",
      "Explain your approach to API design",
      "How do you handle authentication and authorization?"
    ],
    userId: "test-user-123",
    finalized: true,
    coverImage: "/covers/python.svg", 
    createdAt: new Date().toISOString()
  }
];

export const DEMO_FEEDBACK = {
  id: "demo-feedback-1",
  interviewId: "demo-interview-1",
  userId: "test-user-123",
  totalScore: 15,
  categoryScores: [
    {
      name: "Communication Skills" as const,
      score: 20,
      comment: "The candidate's communication was poor. They avoided answering questions directly and often made jokes or promotional plugs instead of providing substantive responses. There was a lack of structured responses and clear articulation."
    },
    {
      name: "Technical Knowledge" as const,
      score: 25,
      comment: "The candidate demonstrated some basic technical knowledge by mentioning Next.js and its features. However, they failed to elaborate or provide specific examples, indicating a superficial understanding. They did not demonstrate the depth of knowledge expected for a full-stack role."
    },
    {
      name: "Problem Solving" as const,
      score: 10,
      comment: "The candidate showed very little problem-solving ability. They avoided addressing the questions directly and did not offer any solutions or approaches to the problems posed. When faced with a challenging question, they admitted they needed to practice, indicating a lack of preparedness."
    },
    {
      name: "Cultural Fit" as const,
      score: 15,
      comment: "The candidate's approach seemed unprofessional with frequent off-topic remarks and promotional content. While they showed some enthusiasm, their inability to stay focused on the interview questions raises concerns about their seriousness and professional attitude."
    },
    {
      name: "Confidence and Clarity" as const,
      score: 5,
      comment: "The candidate displayed poor confidence and clarity. Their responses were often vague, filled with unnecessary tangents, and lacked the assertiveness expected in a professional interview. They seemed unprepared and unfocused throughout the conversation."
    }
  ],
  strengths: [
    "Showed some awareness of modern web technologies like Next.js",
    "Demonstrated willingness to admit knowledge gaps",
    "Maintained a conversational tone throughout the interview"
  ],
  areasForImprovement: [
    "Focus on answering questions directly and concisely", 
    "Prepare specific examples and experiences to share",
    "Improve technical depth and understanding of core concepts",
    "Maintain professionalism and avoid off-topic discussions",
    "Practice articulating thoughts in a structured manner",
    "Build confidence in technical discussions"
  ],
  finalAssessment: "The candidate performed poorly in this mock interview. They demonstrated a lack of preparation, poor communication skills, and a dismissive attitude. Significant improvement is needed in all areas to be considered for a full-stack role.",
  createdAt: new Date().toISOString()
};