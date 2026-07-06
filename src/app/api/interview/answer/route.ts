import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { interviewId, questionId, answer } = await req.json();

    const question = await prisma.interviewQuestion.findFirst({
      where: {
        id: questionId,
        interviewId,
        interview: { userId: session.user.id },
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (question.answer) {
      return NextResponse.json(
        { error: "Already answered" },
        { status: 400 }
      );
    }

    const score = evaluateAnswer(question.question, answer, question.difficulty);

    await prisma.interviewQuestion.update({
      where: { id: questionId },
      data: { answer, score, feedback: score > 70 ? "Good answer" : "Needs improvement" },
    });

    const nextQuestion = await prisma.interviewQuestion.findFirst({
      where: {
        interviewId,
        answer: null,
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({
      score,
      passed: score > 50,
      nextQuestion: nextQuestion
        ? {
            id: nextQuestion.id,
            question: nextQuestion.question,
            questionType: nextQuestion.questionType,
            difficulty: nextQuestion.difficulty,
            orderIndex: nextQuestion.orderIndex,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}

function evaluateAnswer(
  question: string,
  answer: string,
  difficulty: string
): number {
  if (!answer || answer.length < 10) return 10;

  const answerLower = answer.toLowerCase();
  let score = 30;

  const technicalKeywords = [
    "function",
    "variable",
    "class",
    "object",
    "array",
    "promise",
    "async",
    "await",
    "callback",
    "event",
    "loop",
    "scope",
    "closure",
    "prototype",
    "module",
    "import",
    "export",
    "state",
    "props",
    "component",
    "hook",
    "effect",
    "memo",
    "cache",
    "recursion",
    "algorithm",
    "complexity",
    "binary",
    "tree",
    "graph",
    "stack",
    "queue",
    "api",
    "http",
    "request",
    "response",
    "json",
    "database",
    "query",
    "index",
    "normalize",
    "transaction",
    "error",
    "exception",
    "debug",
    "test",
    "performance",
    "optimize",
    "memory",
    "thread",
    "async",
    "stream",
    "buffer",
    "middleware",
  ];

  const keywordMatches = technicalKeywords.filter((kw) =>
    answerLower.includes(kw)
  );
  score += Math.min(keywordMatches.length * 3, 30);

  if (answer.length > 100) score += 10;
  if (answer.length > 300) score += 10;
  if (answer.length > 500) score += 10;

  const codePattern = /```[\s\S]*?```/g;
  const codeBlocks = answer.match(codePattern);
  if (codeBlocks) {
    score += Math.min(codeBlocks.length * 5, 20);
  }

  if (difficulty === "hard") {
    score = Math.min(score, 90);
  } else if (difficulty === "easy") {
    score = Math.min(score, 95);
  }

  return Math.max(0, Math.min(100, score));
}
