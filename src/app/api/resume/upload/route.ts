import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "uploads", "resumes");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${session.user.id}_${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const resume = await prisma.resume.upsert({
      where: { userId: session.user.id },
      update: {
        fileName: file.name,
        filePath,
        fileSize: file.size,
        parsedText: null,
        skills: "[]",
        score: null,
      },
      create: {
        userId: session.user.id,
        fileName: file.name,
        filePath,
        fileSize: file.size,
      },
    });

    return NextResponse.json({ id: resume.id, fileName: resume.fileName });
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
