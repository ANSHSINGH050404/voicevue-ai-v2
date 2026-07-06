import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repos } = await req.json();
    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json({ error: "Repos required" }, { status: 400 });
    }

    const analyzedRepos = [];

    for (const repo of repos) {
      const commitPatterns = repo.commitMessages || [];
      const uniqueScore = calculateUniqueness(repo, commitPatterns);

      const saved = await prisma.gitHubRepo.upsert({
        where: {
          id: repo.id || "none",
        },
        update: {
          repoName: repo.name,
          repoUrl: repo.url,
          description: repo.description,
          language: repo.language,
          stars: repo.stars || 0,
          forks: repo.forks || 0,
          isFork: repo.isFork || false,
          commitCount: repo.commitCount || 0,
          commitMessages: JSON.stringify(commitPatterns),
          uniqueScore,
          analysisJson: JSON.stringify({
            hasReadme: true,
            hasTests: false,
            fileCount: repo.fileCount || 0,
            dependencyComplexity: "low",
          }),
        },
        create: {
          userId: session.user.id,
          repoName: repo.name,
          repoUrl: repo.url,
          description: repo.description,
          language: repo.language,
          stars: repo.stars || 0,
          forks: repo.forks || 0,
          isFork: repo.isFork || false,
          commitCount: repo.commitCount || 0,
          commitMessages: JSON.stringify(commitPatterns),
          uniqueScore,
          analysisJson: JSON.stringify({
            hasReadme: true,
            hasTests: false,
            fileCount: repo.fileCount || 0,
            dependencyComplexity: "low",
          }),
        },
      });

      analyzedRepos.push(saved);
    }

    const avgScore =
      analyzedRepos.reduce((sum, r) => sum + (r.uniqueScore || 0), 0) /
      analyzedRepos.length;

    return NextResponse.json({
      repos: analyzedRepos,
      averageUniqueScore: Math.round(avgScore * 100) / 100,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

function calculateUniqueness(repo: any, commitMessages: string[]): number {
  let score = 50;

  if (repo.isFork) score -= 20;

  const tutorialKeywords = [
    "initial commit",
    "first commit",
    "init",
    "tutorial",
    "getting started",
    "starter",
    "boilerplate",
    "template",
  ];
  const hasTutorialMsgs = commitMessages.some((m) =>
    tutorialKeywords.some((k) => m.toLowerCase().includes(k))
  );
  if (hasTutorialMsgs) score -= 15;

  if (commitMessages.length > 10) score += 10;
  if (commitMessages.length > 50) score += 10;

  const uniqueMessages = new Set(commitMessages.map((m) => m.toLowerCase()));
  if (uniqueMessages.size < commitMessages.length * 0.5) score -= 10;

  if (repo.fileCount && repo.fileCount > 20) score += 10;
  if (repo.fileCount && repo.fileCount > 50) score += 5;

  if (repo.description && repo.description.length > 50) score += 5;

  if (repo.stars > 5) score += 5;
  if (repo.stars > 50) score += 5;

  if (repo.language) score += 5;

  return Math.max(0, Math.min(100, score));
}
