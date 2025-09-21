import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl font-semibold">PrepWise</h1>
          </div>
        </div>

        {/* Main Feedback Content */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Feedback on the Interview - {interview.role} Interview
          </h2>

          {!feedback ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg">
              <p className="text-gray-300 mb-4 text-lg">No feedback available yet.</p>
              <p className="text-gray-500">Please complete an interview first to see feedback.</p>
            </div>
          ) : (
            <>
              {/* Overall Score Header */}
              <div className="flex items-center justify-between mb-8 bg-gray-900 rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-lg font-semibold">
                      Overall Impression: {feedback?.totalScore}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">📅</span>
                    <span className="text-gray-300">
                      {feedback?.createdAt
                        ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall Assessment */}
              <div className="bg-gray-900 rounded-lg p-6 mb-8">
                <p className="text-gray-300 leading-relaxed text-lg">
                  {feedback?.finalAssessment}
                </p>
              </div>

              {/* Breakdown Section */}
              <div className="bg-gray-900 rounded-lg p-6 mb-8">
                <h3 className="text-2xl font-bold mb-6 text-white">Breakdown of the Interview:</h3>
                
                <div className="space-y-6">
                  {feedback?.categoryScores?.map((category, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-6">
                      <div className="mb-3">
                        <h4 className="text-xl font-semibold text-white mb-2">
                          {index + 1}. {category.name} ({category.score}/100)
                        </h4>
                        
                        {/* Score Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              category.score >= 70 ? 'bg-green-500' : 
                              category.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${category.score}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-gray-300 leading-relaxed">
                          {category.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths and Improvements */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Strengths */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-green-400">✓ Strengths</h3>
                  <ul className="space-y-3">
                    {feedback?.strengths?.map((strength, index) => (
                      <li key={index} className="text-gray-300 flex items-start gap-3">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-red-400">⚠ Areas for Improvement</h3>
                  <ul className="space-y-3">
                    {feedback?.areasForImprovement?.map((area, index) => (
                      <li key={index} className="text-gray-300 flex items-start gap-3">
                        <span className="text-red-400 mt-1">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 px-8 py-3 rounded-lg font-semibold transition-all">
              <Link href="/" className="flex w-full justify-center">
                ← Back to Dashboard
              </Link>
            </Button>

            <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold transition-all">
              <Link
                href={`/interview/${id}`}
                className="flex w-full justify-center"
              >
                🔄 Retake Interview
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;