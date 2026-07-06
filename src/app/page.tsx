"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">SkillMatch AI</h1>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <h2 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Your skills,{" "}
            <span className="text-indigo-600">verified by AI</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your resume, connect GitHub, and take an AI interview.
            Get a verified skills passport that companies trust — built for
            freshers, by freshers.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-lg"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-lg"
            >
              I&apos;m a company
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload & Connect",
                desc: "Share your resume and GitHub. We analyze your projects, commits, and code quality.",
              },
              {
                step: "2",
                title: "AI Interview",
                desc: "Take a 20-minute adaptive technical interview. Get scored across your skill stack.",
              },
              {
                step: "3",
                title: "Get Discovered",
                desc: "Your skills passport is visible to companies hiring freshers. Get matched without applying.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white p-6 rounded-xl border shadow-sm"
              >
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
