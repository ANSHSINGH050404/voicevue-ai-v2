"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("resume", resumeFile);

    const res = await fetch("/api/resume/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setStep(2);
    }
    setUploading(false);
  };

  const handleGithubConnect = async () => {
    if (!githubUrl) return;
    setAnalyzing(true);

    const username = githubUrl.replace("https://github.com/", "").replace(/\/$/, "");

    const mockRepos = [
      {
        name: `${username}/project-alpha`,
        url: `${githubUrl}/project-alpha`,
        description: "A full-stack web application built with React and Node.js",
        language: "TypeScript",
        stars: 12,
        forks: 3,
        isFork: false,
        commitCount: 45,
        commitMessages: [
          "feat: add user authentication",
          "fix: resolve race condition in API calls",
          "refactor: extract common utilities",
          "feat: add database migrations",
          "chore: setup CI pipeline",
          "docs: update README",
          "fix: handle edge case in input validation",
          "test: add unit tests for auth module",
          "feat: implement search functionality",
          "style: format code with prettier",
        ],
        fileCount: 35,
      },
      {
        name: `${username}/learn-react`,
        url: `${githubUrl}/learn-react`,
        description: "Following React tutorial",
        language: "JavaScript",
        stars: 0,
        forks: 0,
        isFork: true,
        commitCount: 5,
        commitMessages: [
          "initial commit",
          "first commit",
          "added components",
          "updated styles",
          "completed tutorial",
        ],
        fileCount: 8,
      },
    ];

    await fetch("/api/github/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repos: mockRepos }),
    });

    setAnalyzing(false);
    setStep(3);
  };

  const startInterview = () => {
    router.push("/interview");
  };

  const skip = () => {
    router.push("/dashboard");
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">You&apos;re all set!</h2>
          <p className="text-gray-600 mb-6">
            Your profile is live. Companies can now find and reach out to you.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white p-8 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-2">Upload your resume</h2>
            <p className="text-gray-600 mb-6">
              We&apos;ll analyze your skills and experience
            </p>

            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {resumeFile ? (
                <p className="text-indigo-600 font-medium">{resumeFile.name}</p>
              ) : (
                <div>
                  <p className="text-gray-500 mb-1">
                    Drop your resume here or click to browse
                  </p>
                  <p className="text-gray-400 text-sm">PDF or DOCX</p>
                </div>
              )}
            </label>

            <div className="flex gap-3 mt-6">
              <button onClick={skip} className="px-4 py-2 text-gray-600">
                Skip
              </button>
              <button
                onClick={handleResumeUpload}
                disabled={!resumeFile || uploading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-2">Connect GitHub</h2>
            <p className="text-gray-600 mb-6">
              We analyze your repos, commits, and code quality
            </p>

            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourusername"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />

            <div className="flex gap-3">
              <button onClick={skip} className="px-4 py-2 text-gray-600">
                Skip
              </button>
              <button
                onClick={handleGithubConnect}
                disabled={!githubUrl || analyzing}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {analyzing ? "Analyzing repos..." : "Connect"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-8 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-2">Ready for your AI interview?</h2>
            <p className="text-gray-600 mb-6">
              Answer ~6 adaptive technical questions. Takes about 20 minutes.
              Your responses are scored in real-time.
            </p>

            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-indigo-800 mb-2">
                What to expect
              </h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Questions adapt to your skill level</li>
                <li>• Type or paste code snippets</li>
                <li>• No video or audio required</li>
                <li>• Skip hard questions and come back</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={skip}
                className="px-4 py-2 text-gray-600"
              >
                Skip for now
              </button>
              <button
                onClick={startInterview}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Start interview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
