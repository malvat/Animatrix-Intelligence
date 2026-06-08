# 🚀 Animatrix Intelligence

Animatrix Intelligence is a multimodal AI-powered RAG (Retrieval-Augmented Generation) assistant capable of understanding both voice and text queries while retrieving contextual information from company documents.

The system combines semantic search, vector embeddings, conversational memory, speech recognition, and AI-generated responses into a real-world conversational AI experience.

---

# ✨ Features

✅ PDF-based Retrieval-Augmented Generation (RAG)

✅ Voice Input using browser microphone

✅ Speech-to-Text with Groq Whisper API

✅ AI-generated contextual answers using Groq LLMs

✅ Text-to-Speech AI responses

✅ Conversational Memory

✅ Semantic Search with Vector Embeddings

✅ Modern React UI with animated chat experience

✅ Real-time conversational interaction

---

# 🧠 Tech Stack

## Frontend

* React.js
* Axios
* Tailwind CSS
* Framer Motion
* Lucide React Icons
* Browser MediaRecorder API
* Browser SpeechSynthesis API

## Backend

* Node.js
* Express.js
* Multer
* dotenv
* CORS
* Docker

## AI / RAG Stack

* LangChain
* Groq LLM
* Groq Whisper API
* HuggingFace Embeddings
* Memory Vector Store
* RecursiveCharacterTextSplitter

## Document Processing

* pdf-parse

---

# 🔥 AI Concepts Used

* Retrieval-Augmented Generation (RAG)
* Vector Embeddings
* Semantic Retrieval
* Conversational AI
* Speech-to-Text (STT)
* Text-to-Speech (TTS)
* Conversational Memory
* Multimodal AI Interaction

---

# 📂 Project Structure

```bash
project/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── uploads/
│   ├── sample.pdf
│   ├── server.js
│   └── package.json
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---
# Demo
<img width="2557" height="1331" alt="image" src="https://github.com/user-attachments/assets/9af53ead-7534-4cb3-95d4-b29bcdec9090" />
---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone <your-repository-url>
```

---

## 2️⃣ Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 3️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend folder:

```env
GROQ_API_KEY=your_groq_api_key
PORT=5000
CLIENT_URL=http://localhost:5000
```

---

# ▶️ Run Project

## Start Backend

```bash
cd backend
node server.js
```

---

## Start Frontend

```bash
cd frontend
npm run dev
```

---

# 🐳 Run With Docker

This project includes Docker support. The Docker image builds the React frontend first, then the backend serves the generated frontend files from the same Node/Express server.

## 1️⃣ Create Backend Environment File

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
PORT=5000
CLIENT_URL=http://localhost:5000
```

You can change `PORT` and `CLIENT_URL` if you want to run the app on a different port.

## 2️⃣ Build and Run With Docker Compose

From the project root:

```bash
docker compose --env-file backend/.env up --build
```

Open the app in your browser:

```text
http://localhost:5000
```

Check backend readiness:

```text
http://localhost:5000/health
```

The health response should include `"ready": true` when the RAG backend has finished initializing.

## 3️⃣ Run on a Different Port

Update `backend/.env`:

```env
PORT=5050
CLIENT_URL=http://localhost:5050
```

Then rebuild and run:

```bash
docker compose --env-file backend/.env up --build
```

Open:

```text
http://localhost:5050
```

## 4️⃣ Build and Run Without Compose

Build the image:

```bash
docker build -t animatrix-intelligence .
```

Run the container:

```bash
docker run --env-file backend/.env -p 5000:5000 animatrix-intelligence
```

If you change `PORT`, update both sides of the port mapping:

```bash
docker run --env-file backend/.env -p 5050:5050 animatrix-intelligence
```

---

# 🎤 Voice AI Flow

```text
User Voice
   ↓
Groq Whisper Speech-to-Text
   ↓
LangChain RAG Retrieval
   ↓
Groq LLM Response
   ↓
Browser Text-to-Speech
```

---

# 📚 Future Improvements

* Excel & CSV Support
* Database Integration
* AI Agent Workflows
* Streaming AI Responses
* Real-time Voice Conversations
* Multi-document Intelligence
* Dashboard Analytics

---

