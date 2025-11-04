import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const API_BASE = "https://movieprodai-1.onrender.com";

function DocumentChat() {
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a PDF or TXT file first.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    try {
      setUploading(true);
      const res = await axios.post(`${API_BASE}/rag/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMsg(`✅ I've read your union policy file: "${file.name}" — you can now ask questions!`);
    } catch (err) {
      console.error(err);
      setUploadMsg("❌ Upload failed. Please check the backend or file format.");
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await axios.post(`${API_BASE}/rag/ask`, { question });
      setAnswer(res.data.answer || "No clear answer found.");
      setSources(res.data.sources || []);
    } catch (err) {
      console.error(err);
      setAnswer("❌ Error fetching answer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex flex-col items-center justify-start px-6 py-10 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      <h1 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
        📚 Union Document Chat (RAG Assistant)
      </h1>

      {/* 📤 Upload */}
      <form
        onSubmit={handleFileUpload}
        className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 w-full max-w-2xl"
      >
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border border-gray-400 p-2 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={uploading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:bg-gray-500"
        >
          {uploading ? "⏳ Uploading..." : "📂 Upload"}
        </button>
      </form>

      {uploadMsg && (
        <p className="mt-4 text-green-500 dark:text-green-400 font-medium">{uploadMsg}</p>
      )}

      {/* 💬 Chat Box */}
      <div className="mt-10 w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <form onSubmit={handleAsk} className="flex gap-3 mb-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about overtime, per diem, etc..."
            className="flex-grow border border-gray-400 p-2 rounded-md bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition disabled:bg-gray-500"
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>

        {loading && <p className="text-indigo-500">💭 Analyzing your question...</p>}
        {answer && (
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-2">🤖 Answer:</h3>
            <p className="whitespace-pre-line leading-relaxed text-gray-800 dark:text-gray-200">
              {answer}
            </p>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-6 border-t border-gray-300 dark:border-gray-600 pt-4">
            <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
              📖 Sources:
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
              {sources.map((s, i) => (
                <li key={i}>
                  {s.title} (rank {s.rank.toFixed(3)})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 🔙 Back to Dashboard */}
      <div className="mt-8">
        <a
          href="/"
          className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-md transition"
        >
          ⬅️ Back to Dashboard
        </a>
      </div>
    </motion.div>
  );
}

export default DocumentChat;
