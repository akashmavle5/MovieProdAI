import React, { useState } from "react";
import axios from "axios";

function TimesheetUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return setMessage("Please select a CSV file first.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload_timesheet", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.data) {
        setResults(response.data.data);
        setMessage(response.data.message);
      } else {
        setMessage("Upload succeeded, but no data returned.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed. Please check the backend.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-10">
      <h1 className="text-3xl font-bold mb-6">🎬 Timesheet Payroll Processor</h1>

      <div className="flex items-center gap-4 mb-6">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="border border-gray-300 p-2 rounded"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Upload & Process
        </button>
      </div>

      {message && <p className="text-gray-700 font-medium mb-4">{message}</p>}

      {results.length > 0 && (
        <table className="min-w-[80%] bg-white border border-gray-300 rounded-lg shadow-md">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border">Artist ID</th>
              <th className="py-2 px-4 border">Role</th>
              <th className="py-2 px-4 border">Hours</th>
              <th className="py-2 px-4 border">Regular Pay</th>
              <th className="py-2 px-4 border">Overtime Pay</th>
              <th className="py-2 px-4 border">Per Diem</th>
              <th className="py-2 px-4 border">Total Pay</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="text-center border-t hover:bg-gray-50">
                <td className="py-2 px-4 border">{r.artist_id}</td>
                <td className="py-2 px-4 border">{r.role}</td>
                <td className="py-2 px-4 border">{r.hours_worked}</td>
                <td className="py-2 px-4 border">${r.regular_pay.toFixed(2)}</td>
                <td className="py-2 px-4 border">${r.overtime_pay.toFixed(2)}</td>
                <td className="py-2 px-4 border">${r.per_diem}</td>
                <td className="py-2 px-4 border font-semibold">${r.total_pay.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TimesheetUpload;
