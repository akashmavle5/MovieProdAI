import React, { useState } from "react";
import { api } from "./api";

const ChatAssistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "assistant", text: "👋 Hello! I'm your Payroll Assistant. How can I help you today?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>
        <h2 style={styles.header}>🎬 Payroll Assistant</h2>
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.message,
                ...(msg.sender === "user" ? styles.userMessage : styles.assistantMessage),
              }}
            >
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div style={styles.typing}>💬 Assistant is typing...</div>
          )}
        </div>

        <div style={styles.inputContainer}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question..."
            rows={2}
            style={styles.textarea}
          />
          <button onClick={handleChat} style={styles.button}>
            Send 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

// 💅 Inline styling for clean, professional look
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: "50px",
  },
  chatBox: {
    width: "450px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 0 20px rgba(0,0,0,0.1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
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
    background: "#f9f9f9",
  },
  message: {
    marginBottom: "12px",
    padding: "10px 14px",
    borderRadius: "15px",
    maxWidth: "80%",
    wordWrap: "break-word",
    fontSize: "15px",
  },
  userMessage: {
    background: "#dcf8c6",
    alignSelf: "flex-end",
    marginLeft: "auto",
  },
  assistantMessage: {
    background: "#f1f0f0",
    alignSelf: "flex-start",
    marginRight: "auto",
  },
  typing: {
    fontStyle: "italic",
    color: "#555",
    marginBottom: "10px",
  },
  inputContainer: {
    display: "flex",
    borderTop: "1px solid #ddd",
    padding: "10px",
    background: "#fff",
  },
  textarea: {
    flex: 1,
    borderRadius: "8px",
    border: "1px solid #ccc",
    padding: "8px",
    fontSize: "14px",
    resize: "none",
    outline: "none",
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
  },
};

export default ChatAssistant;
