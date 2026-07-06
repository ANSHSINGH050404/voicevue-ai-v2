const codingProblems = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers that add up to \`target\`. You may assume each input has exactly one solution, and you may not use the same element twice.

**Example:** \`nums = [2, 7, 11, 15], target = 9\` → \`[0, 1]\`

Write your solution and type "check" to evaluate, "hint" for help, or "next" for the next problem.`,
    starterCode: `function twoSum(nums, target) {
  // Your code here
}`,
  },
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "Easy",
    description: `Write a function that returns an array of strings from 1 to \`n\`. For multiples of 3 use "Fizz", for multiples of 5 use "Buzz", for multiples of both use "FizzBuzz".

**Example:** \`fizzBuzz(5)\` → \`["1", "2", "Fizz", "4", "Buzz"]\``,
    starterCode: `function fizzBuzz(n) {
  // Your code here
}`,
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Medium",
    description: `Given a string containing \`()\`, \`{}\`, \`[]\`, determine if the brackets are valid (closed in correct order, each type matches).

**Example:** \`isValid("()[]{}")\` → \`true\`,  \`isValid("(]")\` → \`false\``,
    starterCode: `function isValid(s) {
  // Your code here
}`,
  },
];

function evaluateCode(code: string, problemId: string): { passed: boolean; feedback: string } {
  const solutionPatterns: Record<string, string[]> = {
    "two-sum": ["Map", "map", "complement", "target -", "nums[i]", "has("],
    fizzbuzz: ["%", "% 3", "% 5", "% 15", "Fizz", "Buzz"],
    "valid-parentheses": ["stack", "Stack", "push", "pop", "{"],
  };

  const patterns = solutionPatterns[problemId] || [];
  const matched = patterns.filter((p) => code.includes(p)).length;
  const ratio = patterns.length > 0 ? matched / patterns.length : 0;

  const hasLogic = /\b(function|return|if|for|while|const|let)\b/.test(code);
  const isPlaceholder = code.includes("Your code here") || code.includes("TODO");

  if (isPlaceholder) {
    return { passed: false, feedback: "Replace the placeholder with your actual solution." };
  }
  if (!hasLogic) {
    return { passed: false, feedback: "Your solution doesn't contain any logic. Try writing actual code." };
  }
  if (code.length < 30) {
    return { passed: false, feedback: "That looks too short. Write a complete function." };
  }

  const similarity = ratio;
  if (similarity > 0.6) {
    return { passed: true, feedback: "Great work! Your solution is on the right track." };
  }
  if (similarity > 0.3) {
    return { passed: true, feedback: "Good start! Review edge cases and optimize if needed." };
  }
  return { passed: false, feedback: "Your approach needs work. Try a different algorithm." };
}

function getProblemMessage(problem: typeof codingProblems[0]): string {
  return `Here's your problem:\n\n## ${problem.title} (${problem.difficulty})\n\n${problem.description}`;
}

export async function POST(req: Request) {
  const { messages, problemId, code } = await req.json();
  const lastMsg = messages?.[messages.length - 1]?.content?.toLowerCase() || "";
  const problem = codingProblems.find((p) => p.id === problemId) || codingProblems[0];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (text: string) => {
        controller.enqueue(encoder.encode(text));
      };

      const isFirst = !messages || messages.length <= 1;

      if (isFirst) {
        write("🎤 Welcome to the voice coding interview!\n\nI'm your AI interviewer. I'll give you coding problems and we'll work through them together. You can speak or type your answers.\n\n");
        write(getProblemMessage(problem));
        write(`\n\n\`\`\`javascript\n${problem.starterCode}\n\`\`\``);
        write("\n\nWrite your solution in the editor. Say or type **\"check\"** to test it, **\"hint\"** for help, or **\"next\"** for the next problem.");
      } else if (lastMsg.includes("check") || lastMsg.includes("submit")) {
        if (!code || code.trim().length < 10) {
          write("I don't see any code to evaluate. Write your solution in the editor first, then check again.");
        } else {
          const result = evaluateCode(code, problemId);
          write(result.passed ? "✅ **" + result.feedback + "**" : "❌ **" + result.feedback + "**");
          if (result.passed) {
            write("\n\nType or say **\"next\"** to move to the next challenge.");
          } else {
            write("\n\nTry again or type **\"hint\"** for help.");
          }
        }
      } else if (lastMsg.includes("hint") || lastMsg.includes("help")) {
        const hints: Record<string, string[]> = {
          "two-sum": ["Try using a hash map (object/Map) to store seen values", "For each number, check if target - current exists in the map"],
          fizzbuzz: ["Use modulo (%) to check divisibility", "Check % 15 first (covers both 3 and 5)"],
          "valid-parentheses": ["Use a stack data structure (array push/pop)", "Map closing brackets to their opening counterparts"],
        };
        const problemHints = hints[problemId] || ["Break the problem into smaller steps", "Test with the example input"];
        write("💡 **Hints:**");
        problemHints.forEach((h) => write("\n- " + h));
      } else if (lastMsg.includes("next")) {
        const idx = codingProblems.findIndex((p) => p.id === problemId);
        const next = codingProblems[(idx + 1) % codingProblems.length];
        write(`Moving on! 🎉\n\n`);
        write(getProblemMessage(next));
        write(`\n\n\`\`\`javascript\n${next.starterCode}\n\`\`\``);
        write("\n\nWrite your solution. Say **\"check\"** to evaluate.");
      } else if (lastMsg.includes("hello") || lastMsg.includes("hi") || lastMsg.includes("hey")) {
        write("Hello! Ready to code? Type or say **\"start\"** to begin, or jump right into solving the problem in the editor.");
      } else {
        write("Got it! Keep working on your solution. Type or say **\"check\"** when you're ready for feedback, or **\"hint\"** if you need a nudge.");
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
