import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { techStack } = await req.json();
    const stack = techStack || ["JavaScript", "React", "Node.js"];

    const existingInterview = await prisma.interview.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
      include: { questions: true },
    });

    if (existingInterview) {
      return NextResponse.json({
        interviewId: existingInterview.id,
        question: existingInterview.questions[0] || null,
        total: existingInterview.questions.length,
        answered: existingInterview.questions.filter((q) => q.answer).length,
      });
    }

    const questions = generateQuestions(stack);

    const interview = await prisma.interview.create({
      data: {
        userId: session.user.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        questions: {
          create: questions.map((q, i) => ({
            question: q,
            questionType: "technical",
            difficulty: i < 2 ? "easy" : i < 4 ? "medium" : "hard",
            orderIndex: i,
          })),
        },
      },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });

    return NextResponse.json({
      interviewId: interview.id,
      question: interview.questions[0],
      total: interview.questions.length,
      answered: 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to start interview" },
      { status: 500 }
    );
  }
}

function generateQuestions(stack: string[]): string[] {
  const questionPool: Record<string, string[]> = {
    JavaScript: [
      "Explain how closures work in JavaScript with a practical example.",
      "What's the difference between var, let, and const? Explain hoisting.",
      "How does the event loop work? Explain microtasks vs macrotasks.",
      "Implement a debounce function from scratch.",
      "Explain how the 'this' keyword works in different contexts.",
    ],
    React: [
      "Explain the virtual DOM and how React uses it.",
      "What are hooks? Explain useState and useEffect with examples.",
      "How does React handle re-renders? What triggers them?",
      "Explain the concept of lifting state up and when you'd use it.",
      "How would you optimize a React component that re-renders too often?",
    ],
    "Node.js": [
      "Explain the Node.js event loop and its phases.",
      "How do you handle errors in Express middleware?",
      "What are streams in Node.js? When would you use them?",
      "Explain how the module system works (CommonJS vs ESM).",
      "How would you design a rate limiter for an API?",
    ],
    Python: [
      "Explain list comprehensions and when to use them.",
      "How does Python handle memory management and garbage collection?",
      "What are decorators? Write one that measures execution time.",
      "Explain the difference between deep and shallow copy.",
      "How does the GIL affect multithreaded Python programs?",
    ],
    TypeScript: [
      "Explain the difference between interface and type alias.",
      "What are generics? Write a generic function example.",
      "How do you handle union and intersection types?",
      "What is the 'unknown' type and how is it different from 'any'?",
      "Explain mapped types with a practical example.",
    ],
    SQL: [
      "Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN.",
      "What are indexes and how do they affect query performance?",
      "Write a query to find employees with salary above department average.",
      "What's the difference between UNION and UNION ALL?",
      "Explain database normalization with examples.",
    ],
  };

  let selected: string[] = [];
  for (const tech of stack) {
    const pool = questionPool[tech] || questionPool["JavaScript"];
    selected.push(...pool.slice(0, 2));
  }

  if (selected.length < 5) {
    selected.push(
      "Walk me through a technical project you built. What was the hardest problem you solved?"
    );
    selected.push(
      "How do you approach debugging a performance issue in a web application?"
    );
    selected.push(
      "Explain a time you had to learn a new technology quickly for a project."
    );
  }

  return selected.slice(0, 10);
}
