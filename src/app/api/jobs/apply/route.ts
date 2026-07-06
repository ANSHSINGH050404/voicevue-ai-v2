import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobId } = await req.json();

    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_candidateId: { jobId, candidateId: session.user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already applied" },
        { status: 409 }
      );
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        candidateId: session.user.id,
      },
    });

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to apply" },
      { status: 500 }
    );
  }
}
