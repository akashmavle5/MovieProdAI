import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

function ChatAssistant() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "👋 Hello! I’m your Payroll Assistant. How can I help today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 👇 Auto-scroll when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✉️ Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat", {
        message: userMessage,
      });

      const reply = res.data.reply || "Sorry, I couldn't process that.";
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Error: Could not connect to backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mt-12 mb-12 border border-gray-200 dark:border-gray-700"
    >
      <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-4 text-center">
        🤖 AI Payroll Assistant
      </h2>

      {/* 💬 Chat Window */}
      <div className="h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex mb-3 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* ✍️ Input Bar */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-3 mt-2"
      >
        <motion.input
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about payroll, bonuses, overtime..."
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className={`px-6 py-2 rounded-full text-white font-medium transition ${
            loading
              ? "bg-gray-400"
              : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          }`}
        >
          {loading ? "Thinking..." : "Send"}
        </motion.button>
      </form>
    </motion.div>
  );
}

export default ChatAssistant;
