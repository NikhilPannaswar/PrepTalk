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