import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";

const ChatAssistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "assistant", text: "👋 Hello! I'm your Payroll Assistant. How can I help you today?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const messagesEndRef = useRef(null);

  // 👀 Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 🌗 Detect theme change automatically
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setTheme(e.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleChat = async () => {
    if (!message.trim()) return;

    const newMessages = [...messages, { sender: "user", text: message }];
    setMessages(newMessages);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await api.post("/chat", { message });
      const reply = res.data.reply || "No response from AI assistant.";
      setMessages([...newMessages, { sender: "assistant", text: reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...newMessages,
        { sender: "assistant", text: "❌ Connection failed. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const s = styles(theme);

  return (
    <div style={s.container}>
      <div style={s.chatBox}>
        <h2 style={s.header}>🎬 Payroll Assistant</h2>

        <div style={s.messagesContainer}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...s.message,
                ...(msg.sender === "user" ? s.userMessage : s.assistantMessage),
              }}
            >
              {msg.text}
            </div>
          ))}
          {isLoading && <div style={s.typing}>💬 Assistant is typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div style={s.inputContainer}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question..."
            rows={2}
            style={s.textarea}
          />
          <button onClick={handleChat} style={s.button}>
            Send 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

// 💅 Professional theme-adaptive styling
const styles = (theme) => ({
  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: "50px",
    transition: "all 0.3s ease-in-out",
  },
  chatBox: {
    width: "450px",
    background: theme === "dark" ? "#1e1e1e" : "#fff",
    borderRadius: "12px",
    boxShadow: "0 0 20px rgba(0,0,0,0.15)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    color: theme === "dark" ? "#f5f5f5" : "#000",
  },
  header: {
    background: "#007bff",
    color: "white",
    textAlign: "center",
    padding: "12px",
    fontSize: "18px",
  },
  messagesContainer: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    maxHeight: "400px",
    background: theme === "dark" ? "#2a2a2a" : "#f9f9f9",
    transition: "background 0.3s ease-in-out",
  },
  message: {
    marginBottom: "12px",
    padding: "10px 14px",
    borderRadius: "15px",
    maxWidth: "80%",
    wordWrap: "break-word",
    fontSize: "15px",
    lineHeight: "1.4",
  },
  userMessage: {
    background: theme === "dark" ? "#4a4a4a" : "#dcf8c6",
    alignSelf: "flex-end",
    marginLeft: "auto",
  },
  assistantMessage: {
    background: theme === "dark" ? "#333" : "#f1f0f0",
    alignSelf: "flex-start",
    marginRight: "auto",
  },
  typing: {
    fontStyle: "italic",
    color: theme === "dark" ? "#ccc" : "#555",
    marginBottom: "10px",
  },
  inputContainer: {
    display: "flex",
    borderTop: "1px solid #ddd",
    padding: "10px",
    background: theme === "dark" ? "#1e1e1e" : "#fff",
  },
  textarea: {
    flex: 1,
    borderRadius: "8px",
    border: "1px solid #ccc",
    padding: "8px",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    background: theme === "dark" ? "#2a2a2a" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
  },
  button: {
    background: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 16px",
    marginLeft: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background 0.2s",
  },
});

export default ChatAssistant;
