# PrepTalk - AI-Powered Interview Practice Platform

An advanced interview preparation platform powered by Google's Gemini AI, featuring real-time voice interaction and personalized feedback.

## 🚀 Features

### ✅ **Now Working: Complete AI Interview System**
- **Smart Interview Customization**: Choose your role, experience level, interview type, and tech stack
- **Voice-Powered AI Interviewer**: Real-time speech-to-text and text-to-speech using Web APIs
- **Adaptive Question Generation**: AI analyzes your responses and generates contextual follow-up questions
- **Silence Detection**: Natural conversation flow with smart silence detection (2-3 seconds)
- **Comprehensive Feedback**: Detailed performance analysis across multiple categories
- **Multiple Interview Types**: Technical, Behavioral, Mixed, and System Design interviews

### 🎯 **Interview Customization Options**
- **8+ Job Roles**: Frontend, Backend, Full Stack, DevOps, Data Science, Product Manager, etc.
- **4 Experience Levels**: Entry Level, Mid-Level, Senior, Lead/Principal
- **25+ Technologies**: React, Node.js, Python, AWS, Docker, and more
- **Intelligent Question Generation**: Role and tech-specific questions tailored to your selection

### 🎤 **Voice Interaction Features**
- Browser-native Speech Recognition (Chrome/Edge recommended)
- Natural conversation flow with AI interviewer
- Smart silence detection for realistic interview experience
- Real-time audio feedback and status indicators

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- Chrome or Edge browser (for optimal speech recognition)
- Microphone access

### Environment Variables
Create a `.env.local` file:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 🎯 How It Works

### 1. **Customize Your Interview**
- Select your target role (Frontend Developer, Backend Developer, etc.)
- Choose experience level and interview type
- Pick relevant technologies from 25+ options
- AI generates 8-10 personalized questions

### 2. **Voice Interview Session**
- AI greets you and starts with role-specific questions
- Speak naturally - the system listens and transcribes your responses
- AI analyzes your answers and asks intelligent follow-up questions
- Smart silence detection keeps conversation flowing naturally

### 3. **Performance Feedback**
- Detailed scoring across 5 categories:
  - Communication Skills
  - Technical Knowledge  
  - Problem-Solving
  - Cultural & Role Fit
  - Confidence & Clarity
- Specific strengths and improvement areas
- Actionable recommendations for better performance

## 📱 Usage

### Starting an Interview
1. Click **"🚀 Start AI Interview Practice"** on the home page
2. Customize your interview parameters
3. Ensure microphone permissions are granted
4. Click **"Start AI Interview"**
5. Follow the AI interviewer's guidance

### During the Interview
- **Speak naturally** - no need to rush
- **Take pauses** - AI detects silence and continues appropriately  
- **Be detailed** - AI asks follow-up questions based on your responses
- **Stay engaged** - Maintain eye contact with the camera for practice

### Demo Mode
- Quick start option with pre-configured interviews
- No customization needed - jump straight into practice
- Perfect for testing the system

## 🏗️ Technical Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Web Speech APIs** for voice interaction

### AI Integration
- **Google Gemini 2.0** for conversation and analysis
- **AI SDK** for structured responses
- **Custom conversation management** for context retention

### Key Components
- `InterviewSetup`: Customization interface
- `GeminiAgent`: Main interview conductor
- `ConversationManager`: Handles AI interactions and history
- `SpeechToTextService`: Voice recognition with silence detection
- `TextToSpeechService`: Natural voice synthesis

## 🎮 Browser Compatibility

### Recommended
- **Chrome 25+** (Best speech recognition)
- **Microsoft Edge 79+** (Excellent support)

### Supported
- **Safari 14+** (Limited speech features)
- **Firefox 120+** (Basic functionality)

⚠️ **Note**: Speech recognition requires HTTPS in production environments.

## 🔧 Development

### Key Technologies
- Next.js 15 with Turbopack
- Google Gemini AI SDK
- Web Speech API
- Firebase (authentication & storage)
- TypeScript & Tailwind CSS

### Project Structure
```
/components
  ├── GeminiAgent.tsx       # Main interview component
  ├── InterviewSetup.tsx    # Interview customization
  └── ui/                   # Reusable UI components

/app/(root)
  ├── page.tsx             # Home page
  ├── interview/           # Interview pages
  └── test/                # Demo interviews

/lib
  ├── services/            # Speech and conversation services
  └── actions/             # Server actions

/app/api
  └── conversation/        # Gemini AI integration
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
