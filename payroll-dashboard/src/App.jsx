import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [payments, setPayments] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  // 🔹 Fetch payment data from FastAPI
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/payments")
      .then((res) => setPayments(res.data.data || []))
      .catch((err) => console.error("Error fetching payments:", err));
  }, []);

  // 🔹 Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload_timesheet", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message);
      // Re-fetch updated data
      const refreshed = await axios.get("http://127.0.0.1:8000/payments");
      setPayments(refreshed.data.data || []);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("Upload failed. Check backend.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold text-center mb-8 text-indigo-700">
        🎬 Paymaster Payroll Dashboard
      </h1>

      {/* 🔸 File Upload */}
      <form
        onSubmit={handleUpload}
        className="flex justify-center items-center gap-4 mb-10"
      >
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="border border-gray-400 p-2 rounded-md bg-white"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          Upload CSV
        </button>
      </form>

      {message && (
        <p className="text-center text-green-600 font-medium mb-4">{message}</p>
      )}

      {/* 🔹 Payroll Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-xl">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-indigo-50 text-indigo-800">
            <tr>
              <th className="py-3 px-4 border-b">Artist ID</th>
              <th className="py-3 px-4 border-b">Role</th>
              <th className="py-3 px-4 border-b">Hours</th>
              <th className="py-3 px-4 border-b">Regular Pay</th>
              <th className="py-3 px-4 border-b">Overtime Pay</th>
              <th className="py-3 px-4 border-b">Per Diem</th>
              <th className="py-3 px-4 border-b font-semibold">Total Pay</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? (
              payments.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 text-center">
                  <td className="py-2 px-4 border-b">{p.artist_id}</td>
                  <td className="py-2 px-4 border-b">{p.role}</td>
                  <td className="py-2 px-4 border-b">{p.hours_worked}</td>
                  <td className="py-2 px-4 border-b">${p.regular_pay}</td>
                  <td className="py-2 px-4 border-b">${p.overtime_pay}</td>
                  <td className="py-2 px-4 border-b">${p.per_diem}</td>
                  <td className="py-2 px-4 border-b font-semibold text-indigo-600">
                    ${p.total_pay}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-6 text-gray-500 text-center italic"
                >
                  No data yet — upload a CSV to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
