"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  question: string;
  questionType: string;
  difficulty: string;
  orderIndex: number;
}

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [total, setTotal] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const startInterview = async () => {
    setStarting(true);
    const res = await fetch("/api/interview/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ techStack: ["JavaScript", "React", "Node.js"] }),
    });
    const data = await res.json();
    setInterviewId(data.interviewId);
    setCurrentQuestion(data.question);
    setTotal(data.total);
    setAnswered(data.answered);
    setStarting(false);
  };

  const submitAnswer = async () => {
    if (!interviewId || !currentQuestion || !answer.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/interview/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interviewId,
        questionId: currentQuestion.id,
        answer,
      }),
    });
    const data = await res.json();

    setScores((prev) => [...prev, data.score]);
    setAnswered((prev) => prev + 1);
    setAnswer("");

    if (data.nextQuestion) {
      setCurrentQuestion(data.nextQuestion);
    } else {
      await completeInterview();
    }
    setSubmitting(false);
  };

  const completeInterview = async () => {
    if (!interviewId) return;

    const res = await fetch("/api/interview/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId }),
    });
    const data = await res.json();
    setOverallScore(data.overallScore);
    setCompleted(true);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (completed) {
    const score = Math.round(overallScore);
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-indigo-700">{score}</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Interview complete!</h2>
          <p className="text-gray-600 mb-2">
            You answered {answered} of {total} questions.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {score >= 70
              ? "Great performance! Your skills passport has been updated."
              : score >= 40
              ? "Good effort. Keep practicing to improve your score."
              : "Keep learning and try again when you're ready."}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            View dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!interviewId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-3">AI Technical Interview</h2>
          <p className="text-gray-600 mb-6">
            You&apos;ll answer {total || 6} adaptive questions covering
            JavaScript, React, and Node.js. Take your time — quality over speed.
          </p>
          {answered > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Resuming interview ({answered}/{total} answered)
            </p>
          )}
          <button
            onClick={startInterview}
            disabled={starting}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {starting ? "Starting..." : answered > 0 ? "Resume" : "Start interview"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-600">SkillMatch AI</h1>
          <span className="text-sm text-gray-500">
            {answered}/{total} answered
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`text-xs px-2 py-1 rounded font-medium ${
                currentQuestion?.difficulty === "hard"
                  ? "bg-red-100 text-red-700"
                  : currentQuestion?.difficulty === "easy"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {currentQuestion?.difficulty}
            </span>
            <span className="text-xs text-gray-400">
              Question {answered + 1}
            </span>
          </div>

          <h3 className="text-lg font-medium mb-6">
            {currentQuestion?.question}
          </h3>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here. You can include code blocks with ```language ... ```"
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">
              {answer.length} characters
            </p>
            <button
              onClick={submitAnswer}
              disabled={!answer.trim() || submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : answered + 1 === total
                ? "Finish"
                : "Next question"}
            </button>
          </div>
        </div>

        {scores.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500 mb-2">Your scores so far:</p>
            <div className="flex gap-2">
              {scores.map((s, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    s > 70
                      ? "bg-green-100 text-green-700"
                      : s > 40
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  Q{i + 1}: {Math.round(s)}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
