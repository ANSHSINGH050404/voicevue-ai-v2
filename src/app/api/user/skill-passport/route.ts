import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const passport = await prisma.skillPassport.findUnique({
    where: { userId: session.user.id },
  });

  const repos = await prisma.gitHubRepo.findMany({
    where: { userId: session.user.id },
  });

  const resume = await prisma.resume.findUnique({
    where: { userId: session.user.id },
  });

  const interviews = await prisma.interview.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    passport,
    repos,
    resume,
    interviews,
  });
}
