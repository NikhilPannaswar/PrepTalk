"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import GeminiAgent from "@/components/GeminiAgent";

interface InterviewSetupProps {
  userName: string;
  userId: string;
}

interface InterviewConfig {
  role: string;
  level: string;
  type: string;
  techstack: string[];
  customQuestions?: string[];
}

const ROLES = [
  "Frontend Developer",
  "Backend Developer", 
  "Full Stack Developer",
  "Software Engineer",
  "DevOps Engineer",
  "Data Scientist",
  "Product Manager",
  "UI/UX Designer"
];

const LEVELS = [
  "Entry Level",
  "Mid-Level", 
  "Senior",
  "Lead/Principal"
];

const INTERVIEW_TYPES = [
  "Technical",
  "Behavioral", 
  "Mixed",
  "System Design"
];

const TECH_STACKS = {
  frontend: ["React", "Vue.js", "Angular", "TypeScript", "JavaScript", "CSS", "HTML"],
  backend: ["Node.js", "Python", "Java", "Go", "C#", "Ruby", "PHP"],
  database: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "DynamoDB"],
  cloud: ["AWS", "Azure", "GCP", "Docker", "Kubernetes"],
  tools: ["Git", "Jenkins", "GraphQL", "REST API", "Microservices"]
};

const InterviewSetup = ({ userName, userId }: InterviewSetupProps) => {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [config, setConfig] = useState<InterviewConfig>({
    role: "Frontend Developer",
    level: "Mid-Level", 
    type: "Mixed",
    techstack: ["React", "JavaScript", "TypeScript"]
  });

  const handleTechToggle = (tech: string) => {
    setConfig(prev => ({
      ...prev,
      techstack: prev.techstack.includes(tech) 
        ? prev.techstack.filter(t => t !== tech)
        : [...prev.techstack, tech]
    }));
  };

  const generateQuestions = (config: InterviewConfig): string[] => {
    // Create different question pools to ensure variety
    const currentTime = Date.now();
    const randomSeed = Math.floor(currentTime / 1000) % 1000; // Changes every second
    
    const baseQuestions = [
      "Tell me about yourself and your background",
      "What motivated you to pursue this role?", 
      "Walk me through your most recent project",
      "Describe a technical challenge you've overcome",
      "What interests you most about this position?"
    ];

    const roleSpecificQuestions: Record<string, string[]> = {
      "Frontend Developer": [
        "How do you ensure your applications are accessible?",
        "Explain your approach to responsive web design",
        "How do you optimize frontend performance?",
        "What's your process for cross-browser testing?",
        "How do you handle state management in complex applications?",
        "Describe your experience with CSS preprocessors",
        "How do you approach component architecture?"
      ],
      "Backend Developer": [
        "How do you design scalable API architectures?",
        "Explain your database optimization strategies",
        "How do you handle error handling and logging?",
        "Describe your experience with microservices",
        "How do you ensure API security?",
        "Explain your approach to database schema design",
        "How do you handle high-traffic applications?"
      ],
      "Full Stack Developer": [
        "How do you balance frontend and backend priorities?",
        "Explain your approach to API design and documentation",
        "How do you handle authentication across the stack?",
        "Describe your deployment and DevOps experience",
        "How do you ensure consistency between frontend and backend?",
        "Explain your approach to testing full-stack applications",
        "How do you handle real-time data synchronization?"
      ],
      "DevOps Engineer": [
        "Describe your CI/CD pipeline setup process",
        "How do you handle infrastructure as code?",
        "Explain your monitoring and alerting strategies",
        "How do you approach container orchestration?",
        "Describe your experience with cloud platforms",
        "How do you handle security in DevOps workflows?",
        "Explain your disaster recovery planning"
      ],
      "Data Scientist": [
        "Walk me through your data analysis workflow",
        "How do you handle missing or dirty data?",
        "Explain your approach to feature engineering",
        "Describe your experience with machine learning models",
        "How do you validate and test your models?",
        "Explain your data visualization strategies",
        "How do you communicate findings to non-technical stakeholders?"
      ]
    };

    const behavioralQuestions = [
      "Describe a time you had to learn a new technology quickly",
      "How do you handle disagreements with team members?",
      "Tell me about a project that didn't go as planned",
      "Describe your ideal work environment",
      "How do you stay updated with industry trends?",
      "Tell me about a time you had to meet a tight deadline",
      "How do you prioritize your work when everything seems urgent?"
    ];

    const techQuestions: Record<string, string[]> = {
      "React": [
        "Explain React hooks and their use cases",
        "How does virtual DOM work in React?",
        "Describe React's component lifecycle",
        "How do you optimize React application performance?"
      ],
      "Node.js": [
        "How do you handle asynchronous operations in Node.js?",
        "Explain the event loop in Node.js",
        "How do you manage memory leaks in Node applications?",
        "Describe your experience with Node.js streams"
      ],
      "Python": [
        "Explain Python's GIL and its implications",
        "How do you handle memory management in Python?",
        "Describe your experience with Python frameworks",
        "How do you optimize Python application performance?"
      ],
      "AWS": [
        "Which AWS services have you worked with most?",
        "How do you design fault-tolerant systems on AWS?",
        "Explain your experience with AWS Lambda",
        "How do you handle AWS cost optimization?"
      ],
      "Docker": [
        "How do you optimize Docker image sizes?",
        "Explain your Docker security practices",
        "How do you handle multi-stage Docker builds?",
        "Describe your experience with Docker networking"
      ]
    };

    const closingQuestions = [
      "Where do you see yourself professionally in 5 years?",
      "What questions do you have about our team or company?",
      "What would success look like for you in this role?",
      "Is there anything else you'd like me to know about your background?"
    ];

    // Randomly select questions using the current seed
    const shuffleArray = (array: string[], seed: number): string[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor((seed * (i + 1)) % shuffled.length);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Build question set
    const selectedQuestions: string[] = [];
    
    // Add 1-2 base questions
    selectedQuestions.push(...shuffleArray(baseQuestions, randomSeed).slice(0, 2));
    
    // Add role-specific questions
    const roleQuestions = roleSpecificQuestions[config.role] || [];
    selectedQuestions.push(...shuffleArray(roleQuestions, randomSeed + 1).slice(0, 2));
    
    // Add tech-specific questions
    config.techstack.forEach((tech, index) => {
      const techQs = techQuestions[tech] || [`What's your experience with ${tech}?`];
      selectedQuestions.push(...shuffleArray(techQs, randomSeed + index + 2).slice(0, 1));
    });
    
    // Add behavioral questions based on interview type
    if (config.type === 'Behavioral' || config.type === 'Mixed') {
      selectedQuestions.push(...shuffleArray(behavioralQuestions, randomSeed + 10).slice(0, 2));
    }
    
    // Add closing questions
    selectedQuestions.push(...shuffleArray(closingQuestions, randomSeed + 20).slice(0, 1));
    
    // Limit to reasonable number and ensure variety
    return shuffleArray(selectedQuestions, randomSeed + 100).slice(0, Math.min(selectedQuestions.length, 8));
  };

  const startInterview = () => {
    setConfig(prev => ({
      ...prev,
      customQuestions: generateQuestions(prev)
    }));
    setInterviewStarted(true);
  };

  if (interviewStarted) {
    const interviewId = `interview-${Date.now()}-${userId}`;
    return (
      <GeminiAgent
        userName={userName}
        userId={userId}
        interviewId={interviewId}
        type="interview"
        questions={config.customQuestions || []}
        role={config.role}
        level={config.level}
        techstack={config.techstack}
        interviewType={config.type}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Customize Your AI Interview
        </h2>
        
        <div className="grid gap-8">
          {/* Role Selection */}
          <div>
            <label className="block text-lg font-semibold text-white mb-4">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => setConfig(prev => ({ ...prev, role }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    config.role === role
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-lg font-semibold text-white mb-4">
              Experience Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setConfig(prev => ({ ...prev, level }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    config.level === level
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-lg font-semibold text-white mb-4">
              Interview Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INTERVIEW_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setConfig(prev => ({ ...prev, type }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    config.type === type
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack Selection */}
          <div>
            <label className="block text-lg font-semibold text-white mb-4">
              Select Technologies (Choose 3-5)
            </label>
            
            {Object.entries(TECH_STACKS).map(([category, techs]) => (
              <div key={category} className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2 capitalize">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {techs.map(tech => (
                    <button
                      key={tech}
                      onClick={() => handleTechToggle(tech)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        config.techstack.includes(tech)
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Interview Preview */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4">
              Interview Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-400">Role:</span> <span className="text-white">{config.role}</span>
              </div>
              <div>
                <span className="font-medium text-blue-400">Level:</span> <span className="text-white">{config.level}</span>
              </div>
              <div>
                <span className="font-medium text-blue-400">Type:</span> <span className="text-white">{config.type}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-blue-400">Tech Stack:</span>{" "}
                <span className="text-white">{config.techstack.join(", ") || "None selected"}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              The AI will generate approximately 8-10 questions tailored to your selections,
              including technical, behavioral, and role-specific questions.
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button
              onClick={startInterview}
              disabled={config.techstack.length < 2}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {config.techstack.length < 2 
                ? "Select at least 2 technologies" 
                : "Start AI Interview"
              }
            </Button>
            <p className="text-sm text-gray-400 mt-2">
              Make sure your microphone is enabled and you're in a quiet environment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;