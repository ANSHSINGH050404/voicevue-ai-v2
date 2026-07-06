import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: "file:///D:/live-project/voicevue-ai-v2/dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const companyHash = await bcrypt.hash("company123", 12);
  const candidateHash = await bcrypt.hash("candidate123", 12);

  const company = await prisma.user.upsert({
    where: { email: "company@skillmatch.ai" },
    update: {},
    create: {
      name: "TechCorp Inc",
      email: "company@skillmatch.ai",
      passwordHash: companyHash,
      role: "COMPANY",
      companyName: "TechCorp Inc",
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Chen",
      email: "alice@example.com",
      passwordHash: candidateHash,
      role: "CANDIDATE",
      bio: "CS graduate passionate about full-stack development",
    },
  });

  await prisma.resume.upsert({
    where: { userId: candidate.id },
    update: {},
    create: {
      userId: candidate.id,
      fileName: "alice_resume.pdf",
      filePath: "/uploads/resumes/alice.pdf",
      fileSize: 245000,
      parsedText: "Computer Science graduate with experience in React, Node.js, Python",
      skills: JSON.stringify(["JavaScript", "React", "Node.js", "Python", "SQL"]),
      score: 72,
    },
  });

  await prisma.gitHubRepo.createMany({
    data: [
      {
        userId: candidate.id,
        repoName: "alice/ecommerce-platform",
        repoUrl: "https://github.com/alice/ecommerce-platform",
        description: "Full-stack ecommerce platform with React, Node.js, PostgreSQL",
        language: "TypeScript",
        stars: 23,
        forks: 5,
        isFork: false,
        commitCount: 87,
        commitMessages: JSON.stringify([
          "feat: add product search with filters",
          "fix: optimize database queries",
          "feat: implement payment gateway",
          "refactor: extract cart logic",
          "test: add integration tests",
          "docs: update API documentation",
          "chore: setup CI/CD pipeline",
        ]),
        fileCount: 64,
        uniqueScore: 85,
      },
      {
        userId: candidate.id,
        repoName: "alice/learn-react",
        repoUrl: "https://github.com/alice/learn-react",
        description: "Following React tutorial",
        language: "JavaScript",
        stars: 0,
        forks: 0,
        isFork: true,
        commitCount: 3,
        commitMessages: JSON.stringify(["initial commit", "added components", "completed tutorial"]),
        fileCount: 12,
        uniqueScore: 25,
      },
    ],
  });

  await prisma.job.createMany({
    data: [
      {
        companyId: company.id,
        title: "Junior Frontend Developer",
        description: "Build and maintain modern web applications using React and TypeScript. Perfect for recent graduates looking to grow in a supportive team.",
        requirements: JSON.stringify(["React", "TypeScript", "CSS", "Git"]),
        techStack: JSON.stringify(["React", "TypeScript", "Next.js", "Tailwind"]),
        location: "Remote",
        salaryRange: "$60k - $85k",
      },
      {
        companyId: company.id,
        title: "Associate Software Engineer",
        description: "Join our engineering team building scalable backend services. Mentorship program included for freshers.",
        requirements: JSON.stringify(["Node.js", "Python", "SQL", "Git"]),
        techStack: JSON.stringify(["Node.js", "Python", "PostgreSQL", "Docker"]),
        location: "San Francisco, CA",
        salaryRange: "$70k - $90k",
      },
    ],
  });

  const interview = await prisma.interview.create({
    data: {
      userId: candidate.id,
      status: "COMPLETED",
      overallScore: 78,
      skillScores: JSON.stringify({ technical: 78 }),
      completedAt: new Date(),
      duration: 18,
    },
  });

  await prisma.interviewQuestion.createMany({
    data: [
      {
        interviewId: interview.id,
        question: "Explain how closures work in JavaScript with a practical example.",
        answer: "A closure is a function that retains access to its outer scope even after the outer function has returned. For example, a counter function...",
        score: 82,
        feedback: "Good understanding with a clear example",
        difficulty: "easy",
        orderIndex: 0,
      },
      {
        interviewId: interview.id,
        question: "How does the React virtual DOM work?",
        answer: "React maintains a lightweight copy of the actual DOM. When state changes, React computes the difference (diffing) and applies minimal updates to the real DOM.",
        score: 75,
        feedback: "Good conceptual understanding",
        difficulty: "medium",
        orderIndex: 1,
      },
    ],
  });

  await prisma.skillPassport.upsert({
    where: { userId: candidate.id },
    update: {},
    create: {
      userId: candidate.id,
      topSkills: JSON.stringify(["JavaScript", "React", "Node.js", "Python", "SQL"]),
      scoreBreakdown: JSON.stringify({ resume: 72, github: 55, interview: 78 }),
      resumeScore: 72,
      githubScore: 55,
      interviewScore: 78,
      overallScore: 68,
      summary: "Good potential. Shows solid understanding of core concepts.",
    },
  });

  console.log("Seed data created successfully");
  console.log("Company login: company@skillmatch.ai / company123");
  console.log("Candidate login: alice@example.com / candidate123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
