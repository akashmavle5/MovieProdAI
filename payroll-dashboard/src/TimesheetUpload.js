import React, { useState, useEffect } from "react";
import { api } from "./api";

const TimesheetUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  // 🌗 Auto-detect system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setTheme(e.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(""); // clear old messages
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("⚠️ Please select a CSV file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/upload_timesheet", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage(`✅ ${response.data.message}`);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("❌ Upload failed. Please check backend connection.");
    }
  };

  const s = styles(theme);

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h2 style={s.header}>📤 Upload Timesheet</h2>

        <input type="file" accept=".csv" onChange={handleFileChange} style={s.fileInput} />

        <button onClick={handleUpload} style={s.button}>
          Upload 🚀
        </button>

        {message && (
          <p
            style={{
              ...s.message,
              color: message.startsWith("✅")
                ? "limegreen"
                : message.startsWith("⚠️")
                ? "#ffcc00"
                : "tomato",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// 💅 Professional and theme-aware styling
const styles = (theme) => ({
  container: {
    display: "flex",
    justifyContent: "center",
    marginTop: "60px",
    transition: "all 0.3s ease",
  },
  card: {
    width: "420px",
    padding: "25px",
    borderRadius: "12px",
    background: theme === "dark" ? "#1e1e1e" : "#ffffff",
    color: theme === "dark" ? "#f5f5f5" : "#000000",
    boxShadow: "0 0 25px rgba(0,0,0,0.15)",
    textAlign: "center",
    transition: "background 0.3s ease, color 0.3s ease",
  },
  header: {
    marginBottom: "20px",
    fontSize: "22px",
  },
  fileInput: {
    padding: "10px",
    border: theme === "dark" ? "1px solid #444" : "1px solid #ccc",
    borderRadius: "8px",
    background: theme === "dark" ? "#2a2a2a" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    marginBottom: "15px",
    width: "100%",
    transition: "all 0.2s",
  },
  button: {
    background: "#007bff",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    marginTop: "10px",
    transition: "background 0.3s ease",
  },
  message: {
    marginTop: "15px",
    fontWeight: "500",
    fontSize: "15px",
  },
});

export default TimesheetUpload;
