import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a CSV file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://127.0.0.1:8000/upload_timesheet", formData);
      alert(res.data.message || "Upload complete");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/payments");
      setData(res.data.data || []);
    } catch (err) {
      alert("Could not load payments: " + err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🎬 Movie Paymaster Dashboard</h1>

      <div className="flex gap-4 mb-6 justify-center">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-2 rounded"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload Timesheet
        </button>
        <button
          onClick={loadPayments}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Load Payments
        </button>
      </div>

      {data.length > 0 ? (
        <table className="min-w-full border text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">Artist ID</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Hours</th>
              <th className="border p-2">Total Pay</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="border p-2">{row.artist_id}</td>
                <td className="border p-2">{row.role}</td>
                <td className="border p-2">{row.hours_worked}</td>
                <td className="border p-2">${row.total_pay.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500">No data loaded yet</p>
      )}
    </div>
  );
}

export default App;
