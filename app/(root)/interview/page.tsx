import InterviewSetup from "@/components/InterviewSetup";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-4 mb-6">
          <h3 className="text-2xl font-bold text-center text-white">AI Interview Practice</h3>
          <p className="text-gray-300 text-center max-w-2xl mx-auto">
            Experience a realistic AI-powered interview session. Customize your interview parameters
            and practice with our advanced AI interviewer that adapts to your responses.
          </p>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-3xl mx-auto">
            <h4 className="font-semibold text-blue-400 mb-3">🎯 What You'll Get:</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Personalized questions based on your role and tech stack</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Real-time voice interaction with AI interviewer</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Adaptive questioning based on your responses</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✅</span>
                <span className="text-gray-300">Detailed feedback and performance analysis</span>
              </div>
            </div>
          </div>
        </div>

        <InterviewSetup
          userName={user?.name!}
          userId={user?.id!}
        />
      </div>
    </div>
  );
};

export default Page;