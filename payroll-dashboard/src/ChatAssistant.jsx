import React, { useState } from "react";
import { api } from "./api"; // ✅ import axios instance

const ChatAssistant = () => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const handleChat = async () => {
    if (!message.trim()) return;

    try {
      const res = await api.post("/chat", { message });
      setResponse(res.data.reply || "No response from AI assistant.");
    } catch (error) {
      console.error("Chat error:", error);
      setResponse("❌ AI Assistant connection failed.");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🤖 AI Payroll Assistant</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
        rows={4}
        cols={50}
      />
      <br />
      <button onClick={handleChat}>Ask</button>
      <p>{response}</p>
    </div>
  );
};


export default ChatAssistant;
