require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Groq = require("groq-sdk");
const gTTS = require("gtts");

// Serve the frontend build from the backend process.
const clientDistPath = path.resolve(__dirname, "../frontend/dist");
const audioDir = path.resolve(__dirname, "audio");
const uploadsDir = path.resolve(__dirname, "uploads");

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5000"
].filter(Boolean);

// PDF Parse
const pdfParse = require("pdf-parse");

// LangChain
const {
  RecursiveCharacterTextSplitter,
} = require("@langchain/textsplitters");

const {
  HuggingFaceTransformersEmbeddings,
} = require(
  "@langchain/community/embeddings/huggingface_transformers"
);

const { ChatGroq } =
  require("@langchain/groq");

// ================================
// MEMORY VECTOR STORE
// ================================

let MemoryVectorStore;

try {
  MemoryVectorStore =
    require(
      "langchain/vectorstores/memory"
    ).MemoryVectorStore;
} catch {
  MemoryVectorStore =
    require(
      "@langchain/classic/vectorstores/memory"
    ).MemoryVectorStore;
}

// ================================
// EXPRESS APP
// ================================

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json());

// Serve generated audio files
app.use(
  "/audio",
  express.static(audioDir)
);

app.use(express.static(clientDistPath));

// ================================
// CREATE REQUIRED FOLDERS
// ================================

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// ================================
// GLOBAL VARIABLES
// ================================

let vectorStore;
let llm;

// Conversation memory
let chatHistory = [];
let isReady = false;
let initError = null;

// Groq Client
const groq = new Groq({
  apiKey:
    process.env.GROQ_API_KEY,
});

// ================================
// MULTER STORAGE
// ================================

const storage = multer.diskStorage({
  destination: function (
    req,
    file,
    cb
  ) {
    cb(null, uploadsDir);
  },

  filename: function (
    req,
    file,
    cb
  ) {
    cb(
      null,
      Date.now() + ".wav"
    );
  },
});

const upload = multer({
  storage,
});

// ================================
// READ PDF
// ================================

async function readPDF(filePath) {
  const dataBuffer =
    fs.readFileSync(filePath);

  const data =
    await pdfParse(dataBuffer);

  return data.text;
}

// ================================
// GENERATE SPEECH
// ================================

async function generateSpeech(
  text
) {
  return new Promise(
    (resolve, reject) => {
      const fileName =
        `${Date.now()}.mp3`;

      const filePath =
        path.join(audioDir, fileName);

      const tts =
        new gTTS(text, "en");

      tts.save(
        filePath,
        function (err) {
          if (err)
            return reject(err);

          resolve(fileName);
        }
      );
    }
  );
}

// ================================
// INITIALIZE RAG
// ================================

async function initializeRAG() {
  try {
    console.log(
      "📄 Loading PDF..."
    );

    // Read PDF
    const text =
      await readPDF(
        path.join(__dirname, "sample.pdf")
      );

    console.log(
      "✂️ Splitting text..."
    );

    // Split into chunks
    const splitter =
      new RecursiveCharacterTextSplitter(
        {
          chunkSize: 1000,
          chunkOverlap: 200,
        }
      );

    const splitDocs =
      await splitter.createDocuments(
        [text]
      );

    console.log(
      "🧠 Creating embeddings..."
    );

    // Embeddings
    const embeddings =
      new HuggingFaceTransformersEmbeddings(
        {
          modelName:
            "Xenova/all-MiniLM-L6-v2",
        }
      );

    // Vector Store
    vectorStore =
      await MemoryVectorStore.fromDocuments(
        splitDocs,
        embeddings
      );

    console.log(
      "✅ Vector Store Ready"
    );

    // Groq LLM
    llm = new ChatGroq({
      apiKey:
        process.env.GROQ_API_KEY,

      model:
        "llama-3.1-8b-instant",

      temperature: 0,
    });

    console.log("🤖 LLM Ready");
    isReady = true;
    initError = null;
  } catch (error) {
    initError = error;
    console.log(
      "❌ RAG INIT ERROR:",
      error
    );
  }
}

// ================================
// HEALTH ROUTE
// ================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    ready: isReady,
    error: initError ? initError.message : null,
    message:
      "Animatrix Intelligence Running 🚀",
  });
});

// ================================
// PROMPT BUILDER
// ================================

function buildPrompt(
  question,
  context
) {
  return `
You are Animatrix Intelligence Assistant.

You are friendly, conversational, and intelligent.

IMPORTANT RULES:

1. Remember previous conversation carefully.

2. If the user introduced their name,
remember it and use it naturally.

3. For greetings and casual chat,
give VERY short responses.

Examples:
- "Hi!"
- "Hello"
- "Hey, how can I help?"
- "Good morning!"

Do NOT give long introductions repeatedly.
Do NOT repeatedly say:
"Nice to meet you"
unless meeting user first time.

4. For company-related questions,
use the company report context.

5. If company information is unavailable,
say:
"I could not find that information in the company report."

====================
PREVIOUS CONVERSATION
====================

${chatHistory.join("\n")}

====================
COMPANY REPORT
====================

${context}

====================
CURRENT USER QUESTION
====================

${question}
`;
}

// ================================
// SAVE MEMORY
// ================================

function saveToMemory(
  question,
  answer
) {
  chatHistory.push(
    `Human: ${question}`
  );

  chatHistory.push(
    `Assistant: ${answer}`
  );

  // Keep only latest messages
  if (chatHistory.length > 20) {
    chatHistory =
      chatHistory.slice(-20);
  }

  console.log(
    "🧠 MEMORY:",
    chatHistory
  );
}

// ================================
// MAIN AI FUNCTION
// ================================

async function askAI(question) {
  // Retrieve context
  const retriever =
    vectorStore.asRetriever(3);

  const relevantDocs =
    await retriever.invoke(
      question
    );

  // Combine context
  const context =
    relevantDocs
      .map(
        (doc) => doc.pageContent
      )
      .join("\n\n");

  // Prompt
  const prompt =
    buildPrompt(
      question,
      context
    );

  // AI Response
  const response =
    await llm.invoke(prompt);

  // Save Memory
  saveToMemory(
    question,
    response.content
  );

  return response.content;
}

// ================================
// TEXT ASK ROUTE
// ================================

app.post(
  "/ask",
  async (req, res) => {
    try {
      const { question } =
        req.body;

      // Validation
      if (!question) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              "Question is required",
          });
      }

      if (!isReady) {
        return res.status(503).json({
          success: false,
          error:
            initError
              ? `AI backend failed to initialize: ${initError.message}`
              : "AI backend is still initializing. Please try again shortly.",
        });
      }

      // Ask AI
      const answer =
        await askAI(question);

      // TEXT ONLY RESPONSE
      res.json({
        success: true,
        type: "text",
        question,
        answer,
      });
    } catch (error) {
      console.log(
        "❌ ASK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Something went wrong",
      });
    }
  }
);

// ================================
// VOICE ASK ROUTE
// ================================

app.post(
  "/voice-ask",
  upload.single("audio"),
  async (req, res) => {
    try {
      // Audio path
      const audioPath =
        req.file.path;

      // Whisper Transcription
      const transcription =
        await groq.audio.transcriptions.create(
          {
            file:
              fs.createReadStream(
                audioPath
              ),

            model:
              "whisper-large-v3",
          }
        );

      const question =
        transcription.text;

      console.log(
        "🎤 User Said:",
        question
      );

      if (!isReady) {
        return res.status(503).json({
          success: false,
          error:
            initError
              ? `AI backend failed to initialize: ${initError.message}`
              : "AI backend is still initializing. Please try again shortly.",
        });
      }

      // Ask AI
      const answer =
        await askAI(question);

      // Generate speech
      const audioFile =
        await generateSpeech(
          answer
        );

      // Delete uploaded voice
      fs.unlinkSync(audioPath);

      // Send text + audio
      res.json({
        success: true,
        type: "voice",
        question,
        answer,

        audioUrl: `/audio/${audioFile}`,
      });
    } catch (error) {
      console.log(
        "❌ VOICE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Voice AI failed",
      });
    }
  }
);

// ================================
// START SERVER
// ================================

const PORT = process.env.PORT || 5000;

(async () => {
  await initializeRAG();

  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    res.sendFile(path.join(clientDistPath, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );
  });
})();
