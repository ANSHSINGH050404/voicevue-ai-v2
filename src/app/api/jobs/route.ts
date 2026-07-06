import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);

  const tech = searchParams.get("tech");
  const minScore = searchParams.get("minScore");

  const where: any = { isActive: true };

  if (tech) {
    where.techStack = { contains: tech };
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      company: { select: { id: true, name: true, companyName: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "COMPANY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, requirements, techStack, location, salaryRange } =
      await req.json();

    const job = await prisma.job.create({
      data: {
        companyId: session.user.id,
        title,
        description,
        requirements: JSON.stringify(requirements || []),
        techStack: JSON.stringify(techStack || []),
        location,
        salaryRange,
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
