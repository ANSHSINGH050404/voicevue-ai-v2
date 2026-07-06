"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Message = {
  role: "user" | "assistant";
  content: string;
};

const defaultCode = `function twoSum(nums, target) {
  // Your code here
}`;

export default function VoiceCodingInterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState(defaultCode);
  const [problemId, setProblemId] = useState("two-sum");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startInterview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], problemId, code: "" }),
      });
      const text = await res.text();
      setMessages([{ role: "assistant", content: text }]);
      speak(text);
    } catch (e) {
      setMessages([{ role: "assistant", content: "Failed to start interview. Please try again." }]);
    }
    setLoading(false);
  }, [problemId, code]);

  const sendMessage = useCallback(async (userMsg: string) => {
    if (!userMsg.trim()) return;

    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, problemId, code }),
      });
      const text = await res.text();

      if (text.toLowerCase().includes("two sum") || text.includes("http")) {
        setProblemId("two-sum");
      } else if (text.toLowerCase().includes("fizzbuzz") || text.toLowerCase().includes("fizz") || text.toLowerCase().includes("buzz")) {
        setProblemId("fizzbuzz");
      } else if (text.toLowerCase().includes("parentheses") || text.toLowerCase().includes("bracket") || text.toLowerCase().includes("valid")) {
        setProblemId("valid-parentheses");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
      speak(text);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error getting response." }]);
    }
    setLoading(false);
  }, [messages, problemId, code]);

  const speak = (text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const cleanText = text.replace(/[*#`\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  };

  const toggleVoice = () => {
    if (!voiceEnabled) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice recognition is not supported in this browser. Try Chrome.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setInput(transcript);
        if (event.results[event.results.length - 1].isFinal) {
          sendMessage(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setVoiceEnabled(true);
    } else {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceEnabled(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-600">
          SkillMatch AI
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleVoice}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              isListening
                ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {isListening ? "🎙️ Listening..." : "🎤 Voice"}
          </button>
          <span className="text-sm text-gray-500">{session?.user?.name}</span>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r">
          <div className="bg-white px-4 py-2 border-b text-sm text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            AI Interviewer — Machine Coding Round
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex items-center justify-center h-full">
                <button
                  onClick={startInterview}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-medium hover:bg-indigo-700 shadow-lg"
                >
                  🎤 Start Voice Coding Interview
                </button>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-xl whitespace-pre-wrap text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white border shadow-sm rounded-bl-md"
                  }`}
                >
                  {msg.content.split("```").map((part, j) =>
                    j % 2 === 1 ? (
                      <code
                        key={j}
                        className="block bg-gray-100 p-2 rounded text-xs font-mono my-1"
                      >
                        {part}
                      </code>
                    ) : (
                      <span key={j}>{part}</span>
                    )
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border px-4 py-3 rounded-xl rounded-bl-md">
                  <span className="text-gray-400">Thinking</span>
                  <span className="inline-flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t bg-white p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (or use voice)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="w-[45%] flex flex-col">
          <div className="bg-white px-4 py-2 border-b text-sm text-gray-500 flex items-center justify-between">
            <span>Code Editor — {problemId}</span>
            <button
              onClick={() => sendMessage("check")}
              disabled={loading}
              className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              Check solution
            </button>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
