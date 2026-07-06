"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  passport: {
    overallScore: number;
    interviewScore: number;
    githubScore: number;
    resumeScore: number;
    topSkills: string;
    summary: string;
  } | null;
  repos: any[];
  resume: any;
  interviews: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/user/skill-passport")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const isCompany = session?.user?.role === "COMPANY";
  const passport = data?.passport ?? null;
  const score = passport?.overallScore ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-600">SkillMatch AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.name}</span>
            {isCompany ? null : (
              <>
                <Link
                  href="/interview"
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Quick Quiz
                </Link>
                <Link
                  href="/interview-v2"
                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  Voice Coding
                </Link>
                <Link
                  href="/jobs"
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Jobs
                </Link>
              </>
            )}
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {isCompany ? (
          <CompanyDashboard />
        ) : (
          <CandidateDashboard data={data} passport={passport} score={score} />
        )}
      </main>
    </div>
  );
}

function CandidateDashboard({
  data,
  passport,
  score,
}: {
  data: DashboardData | null;
  passport: DashboardData["passport"];
  score: number;
}) {
  return (
    <div className="space-y-8">
      {passport ? (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Your Skills Passport</h2>
              <p className="text-gray-600">{passport.summary}</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-indigo-700">
                  {Math.round(score)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall score</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Resume", value: passport.resumeScore },
              { label: "GitHub", value: passport.githubScore },
              { label: "Interview", value: passport.interviewScore },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {item.value ? Math.round(item.value) : "—"}
                </p>
              </div>
            ))}
          </div>

          {data?.repos && data.repos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">GitHub Repos</h3>
              <div className="space-y-2">
                {data.repos.map((repo: any) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{repo.repoName}</p>
                      <p className="text-xs text-gray-500">{repo.language}</p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        (repo.uniqueScore || 0) > 60
                          ? "text-green-600"
                          : "text-orange-500"
                      }`}
                    >
                      {Math.round(repo.uniqueScore || 0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
          <h2 className="text-xl font-bold mb-3">Complete your profile</h2>
          <p className="text-gray-600 mb-6">
            Upload your resume, connect GitHub, and take the AI interview to
            generate your skills passport.
          </p>
          <Link
            href="/onboarding"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Get started
          </Link>
        </div>
      )}

      {data?.interviews && data.interviews.length > 0 && (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">Interview History</h3>
          <div className="space-y-2">
            {data.interviews.map((iv: any) => (
              <div
                key={iv.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(iv.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">{iv.status}</p>
                </div>
                <span className="text-sm font-bold">
                  {iv.overallScore ? `${Math.round(iv.overallScore)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyDashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/companies/candidates")
      .then((res) => res.json())
      .then((data) => setCandidates(data.candidates || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Candidate Pool</h2>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading candidates...</p>
      ) : candidates.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center">
          <p className="text-gray-500">
            No candidates have completed their skills passport yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {candidates.map((c: any) => (
            <div
              key={c.id}
              className="bg-white p-4 rounded-xl border shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{c.user.name || "Anonymous"}</h3>
                  <p className="text-sm text-gray-500">{c.user.email}</p>
                  {c.user.bio && (
                    <p className="text-sm text-gray-600 mt-1">{c.user.bio}</p>
                  )}
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="font-bold text-indigo-700">
                      {c.overallScore ? Math.round(c.overallScore) : "—"}
                    </span>
                  </div>
                </div>
              </div>
              {c.user.githubRepos && c.user.githubRepos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {c.user.githubRepos.map((repo: any) => (
                    <span
                      key={repo.repoName}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {repo.language || "N/A"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
