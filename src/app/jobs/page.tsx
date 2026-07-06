"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  techStack: string;
  location: string | null;
  salaryRange: string | null;
  company: { id: string; name: string; companyName: string | null };
  _count: { applications: number };
}

export default function JobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .finally(() => setLoading(false));
  }, [status, router]);

  const apply = async (jobId: string) => {
    setApplying(jobId);
    const res = await fetch("/api/jobs/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if (res.ok) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, _count: { applications: j._count.applications + 1 } }
            : j
        )
      );
    }
    setApplying(null);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-600">SkillMatch AI</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Dashboard
            </Link>
            <Link
              href="/interview"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Interview
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Jobs for freshers</h2>

        {jobs.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border text-center">
            <p className="text-gray-500 mb-4">No jobs listed yet.</p>
            <p className="text-sm text-gray-400">
              Complete your skills passport to attract employers.
            </p>
            <Link
              href="/dashboard"
              className="text-indigo-600 text-sm font-medium mt-2 inline-block"
            >
              View your profile
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-6 rounded-xl border shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-sm text-gray-500">
                      {job.company.companyName || job.company.name}
                    </p>
                  </div>
                  <button
                    onClick={() => apply(job.id)}
                    disabled={applying === job.id}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {applying === job.id ? "Applying..." : "Apply"}
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {job.description}
                </p>

                {job.techStack && job.techStack !== "[]" && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {JSON.parse(job.techStack).map((tech: string) => (
                      <span
                        key={tech}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {job.location && <span>{job.location}</span>}
                  {job.salaryRange && <span>{job.salaryRange}</span>}
                  <span>{job._count.applications} applicants</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
