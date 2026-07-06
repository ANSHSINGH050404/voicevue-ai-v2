import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { interviewId } = await req.json();

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: session.user.id },
      include: { questions: true },
    });

    if (!interview) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const answered = interview.questions.filter((q) => q.answer);
    const scores = answered.map((q) => q.score || 0);
    const overallScore =
      scores.length > 0
        ? Math.round(
            (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
          ) / 100
        : 0;

    const skillScores: Record<string, number[]> = {};
    for (const q of interview.questions) {
      const key = q.questionType || "technical";
      if (!skillScores[key]) skillScores[key] = [];
      if (q.score) skillScores[key].push(q.score);
    }

    const avgSkillScores: Record<string, number> = {};
    for (const [key, vals] of Object.entries(skillScores)) {
      avgSkillScores[key] =
        Math.round(
          (vals.reduce((a, b) => a + b, 0) / vals.length) * 100
        ) / 100;
    }

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "COMPLETED",
        overallScore,
        skillScores: JSON.stringify(avgSkillScores),
        completedAt: new Date(),
        duration: interview.questions.length * 3,
      },
    });

    await computeSkillPassport(session.user.id);

    return NextResponse.json({
      overallScore,
      skillScores: avgSkillScores,
      totalQuestions: interview.questions.length,
      answeredQuestions: answered.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to complete interview" },
      { status: 500 }
    );
  }
}

async function computeSkillPassport(userId: string) {
  const [resume, repos, interview] = await Promise.all([
    prisma.resume.findUnique({ where: { userId } }),
    prisma.gitHubRepo.findMany({ where: { userId } }),
    prisma.interview.findFirst({
      where: { userId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const resumeScore = resume?.score || 0;
  const githubScore =
    repos.length > 0
      ? Math.round(
          (repos.reduce((sum, r) => sum + (r.uniqueScore || 0), 0) /
            repos.length) *
            100
        ) / 100
      : 0;
  const interviewScore = interview?.overallScore || 0;

  const overallScore =
    Math.round(
      ((resumeScore + githubScore + interviewScore) / 3) * 100
    ) / 100;

  await prisma.skillPassport.upsert({
    where: { userId },
    update: {
      topSkills: JSON.stringify(["JavaScript", "React", "Node.js"]),
      scoreBreakdown: JSON.stringify({
        resume: resumeScore,
        github: githubScore,
        interview: interviewScore,
      }),
      githubScore,
      resumeScore,
      interviewScore,
      overallScore,
      summary: generateSummary(overallScore),
    },
    create: {
      userId,
      topSkills: JSON.stringify(["JavaScript", "React", "Node.js"]),
      scoreBreakdown: JSON.stringify({
        resume: resumeScore,
        github: githubScore,
        interview: interviewScore,
      }),
      githubScore,
      resumeScore,
      interviewScore,
      overallScore,
      summary: generateSummary(overallScore),
    },
  });
}

function generateSummary(score: number): string {
  if (score >= 80) return "Strong candidate with solid technical foundations.";
  if (score >= 60) return "Good potential. Shows solid understanding of core concepts.";
  if (score >= 40) return "Developing skills. Shows effort but needs more depth.";
  return "Entry-level. Room for growth with consistent practice.";
}
