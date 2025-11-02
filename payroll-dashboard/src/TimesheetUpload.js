import React, { useState } from "react";
import { api } from "./api"; // ✅ import your shared axios instance

const TimesheetUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file.");
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
      setMessage("❌ Upload failed. Check backend connection.");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>📤 Upload Timesheet</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <p>{message}</p>
    </div>
  );
};


export default TimesheetUpload;
