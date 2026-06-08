import { useState } from "react";
import axios from "axios";

import {
  Send,
  Bot,
  Building2,
  Sparkles,
  Mic,
} from "lucide-react";

import { motion } from "framer-motion";

export default function App() {
  // =========================
  // STATES
  // =========================

  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [messages, setMessages] =
    useState([
      {
        role: "ai",
        text:
          "👋 Welcome to Animatrix Intelligence. Ask me anything using text or voice.",
      },
    ]);

  // =========================
  // EXAMPLE QUESTIONS
  // =========================

  const exampleQuestions = [
    "What was revenue in 2025?",
    "How many employees work at Animatrix Intelligence?",
    "What are the biggest risks for the company?",
    "How does the company handle AI regulation compliance?",
  ];

  // =========================
  // TEXT ASK AI
  // =========================

  const askAI = async (
    customQuestion
  ) => {
    const finalQuestion =
      customQuestion || question;

    if (!finalQuestion.trim()) return;

    // Add user message
    const userMessage = {
      role: "user",
      text: finalQuestion,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setQuestion("");

    setLoading(true);

    try {
      const res = await axios.post(
        "/ask",
        {
          question: finalQuestion,
        }
      );

      const aiMessage = {
        role: "ai",
        text: res.data.answer,
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);
    } catch (error) {
      console.log(error);

      const errorMessage =
        error.response?.data?.error ||
        "Something went wrong while talking to AI.";

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: errorMessage,
        },
      ]);
    }

    setLoading(false);
  };

  // =========================
  // VOICE RECORDING
  // =========================

  const startRecording = async () => {
    try {
      setRecording(true);

      // Get microphone
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      // Create recorder
      const mediaRecorder =
        new MediaRecorder(stream);

      const chunks = [];

      // Start recording
      mediaRecorder.start();

      // Save audio chunks
      mediaRecorder.ondataavailable = (
        e
      ) => {
        chunks.push(e.data);
      };

      // When recording stops
      mediaRecorder.onstop = async () => {
        const audioBlob =
          new Blob(chunks, {
            type: "audio/wav",
          });

        // Create form data
        const formData =
          new FormData();

        formData.append(
          "audio",
          audioBlob,
          "voice.wav"
        );

        setLoading(true);

        try {
          // Send voice to backend
          const res =
            await axios.post(
              "/voice-ask",
              formData
            );

          // Add messages
          setMessages((prev) => [
            ...prev,
            {
              role: "user",
              text: res.data.question,
            },
            {
              role: "ai",
              text: res.data.answer,
            },
          ]);

          // Play generated audio from backend
          if (res.data.audioUrl) {
            const audio = new Audio(res.data.audioUrl);
            audio.play().catch((err) => {
              console.warn(
                "Audio playback failed:",
                err
              );
            });
          }
        } catch (error) {
          console.log(error);

          const errorMessage =
            error.response?.data?.error ||
            "Voice AI failed.";

          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              text: errorMessage,
            },
          ]);
        }

        setLoading(false);
      };

      // Stop after 5 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        setRecording(false);
      }, 5000);
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white flex flex-col">
      {/* HEADER */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <Building2 size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Animatrix Intelligence
              </h1>

              <p className="text-zinc-400 text-sm">
                Voice + RAG AI Assistant
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-sm text-blue-300">
            <Sparkles size={16} />
            Groq + LangChain + Voice AI
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col">
        {/* EXAMPLE QUESTIONS */}
        <div className="flex flex-wrap gap-3 mb-8">
          {exampleQuestions.map(
            (item, index) => (
              <button
                key={index}
                onClick={() =>
                  askAI(item)
                }
                className="bg-white/5 hover:bg-white/10 transition border border-white/10 px-4 py-2 rounded-full text-sm"
              >
                {item}
              </button>
            )
          )}
        </div>

        {/* CHAT */}
        <div className="flex-1 space-y-5 overflow-y-auto pb-10">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-3xl rounded-3xl px-5 py-4 shadow-xl ${
                  msg.role === "user"
                    ? "bg-blue-600"
                    : "bg-white/5 border border-white/10 backdrop-blur-xl"
                }`}
              >
                <div className="flex items-start gap-3">
                  {msg.role === "ai" && (
                    <div className="bg-blue-600 p-2 rounded-xl mt-1">
                      <Bot size={18} />
                    </div>
                  )}

                  <div className="leading-7 text-[15px] whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* LOADING */}
          {loading && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 rounded-3xl px-5 py-4 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <Bot size={18} />
                </div>

                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-200"></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* INPUT */}
        <div className="sticky bottom-0 pt-6 bg-gradient-to-t from-black via-black/90 to-transparent">
          <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-3 flex items-center gap-3 shadow-2xl">
            {/* INPUT */}
            <input
              type="text"
              placeholder="Ask using text or voice..."
              value={question}
              onChange={(e) =>
                setQuestion(
                  e.target.value
                )
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                askAI()
              }
              className="flex-1 bg-transparent outline-none px-3 py-3 text-white placeholder:text-zinc-500"
            />

            {/* MIC BUTTON */}
            <button
              onClick={startRecording}
              disabled={recording}
              className={`transition p-4 rounded-2xl ${
                recording
                  ? "bg-red-600"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <Mic size={20} />
            </button>

            {/* SEND BUTTON */}
            <button
              onClick={() => askAI()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>

          {/* RECORDING TEXT */}
          {recording && (
            <p className="text-center text-red-400 mt-3 text-sm animate-pulse">
              🎤 Recording... Speak now
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
