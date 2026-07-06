import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const minScore = searchParams.get("minScore");
  const tech = searchParams.get("tech");
  const limit = parseInt(searchParams.get("limit") || "20");

  const candidates = await prisma.skillPassport.findMany({
    where: {
      ...(minScore ? { overallScore: { gte: parseFloat(minScore) } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          githubRepos: {
            select: { repoName: true, repoUrl: true, language: true, uniqueScore: true },
          },
          resume: { select: { skills: true } },
        },
      },
    },
    orderBy: { overallScore: "desc" },
    take: limit,
  });

  return NextResponse.json({ candidates });
}
