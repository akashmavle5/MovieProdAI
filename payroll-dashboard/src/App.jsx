import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  // 🔍 filter states
  const [searchArtist, setSearchArtist] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [minPay, setMinPay] = useState("");

  // 🔹 fetch payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:8000/payments");
      const data = res.data.data || [];
      setPayments(data);
      setFiltered(data);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // 🔹 upload CSV
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a CSV file first.");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await axios.post("http://127.0.0.1:8000/upload_timesheet", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message || "Upload successful!");
      fetchPayments();
    } catch (err) {
      console.error(err);
      setMessage("Upload failed — check backend console.");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  // 🔹 generate memo
  const handleGenerateMemo = (artistId) => {
    window.open(`http://127.0.0.1:8000/generate_deal_memo/${artistId}`, "_blank");
  };

  // 🔹 filter logic
  const handleFilter = () => {
    let filteredData = [...payments];
    if (searchArtist)
      filteredData = filteredData.filter((p) =>
        String(p.artist_id).includes(searchArtist)
      );
    if (searchRole)
      filteredData = filteredData.filter((p) =>
        p.role?.toLowerCase().includes(searchRole.toLowerCase())
      );
    if (minPay)
      filteredData = filteredData.filter((p) => p.total_pay >= Number(minPay));

    setFiltered(filteredData);
  };

  useEffect(() => {
    handleFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchArtist, searchRole, minPay, payments]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-6 text-indigo-700">
        🎬 Movie Payroll Dashboard
      </h1>

      {/* Upload section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-gray-300 p-2 rounded w-full sm:w-auto"
          />
          <button
            type="submit"
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
          >
            {uploading ? "Uploading..." : "Upload Timesheet"}
          </button>
        </form>
        {message && <p className="text-center mt-3 text-gray-600">{message}</p>}
      </div>

      {/* Filter section */}
      <div className="bg-white p-5 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="Search by Artist ID"
          value={searchArtist}
          onChange={(e) => setSearchArtist(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full sm:w-1/3"
        />
        <input
          type="text"
          placeholder="Search by Role"
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full sm:w-1/3"
        />
        <input
          type="number"
          placeholder="Min Total Pay"
          value={minPay}
          onChange={(e) => setMinPay(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full sm:w-1/3"
        />
      </div>

      {/* Data table */}
      {loading ? (
        <p className="text-center text-gray-500">⏳ Loading data...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500">No matching records found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left">Artist ID</th>
                <th className="py-3 px-4 text-left">Role</th>
                <th className="py-3 px-4 text-left">Hours</th>
                <th className="py-3 px-4 text-left">Regular Pay</th>
                <th className="py-3 px-4 text-left">Overtime Pay</th>
                <th className="py-3 px-4 text-left">Per Diem</th>
                <th className="py-3 px-4 text-left">Total Pay</th>
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{p.artist_id}</td>
                  <td className="py-2 px-4">{p.role}</td>
                  <td className="py-2 px-4">{p.hours_worked}</td>
                  <td className="py-2 px-4">${p.regular_pay?.toFixed(2)}</td>
                  <td className="py-2 px-4">${p.overtime_pay?.toFixed(2)}</td>
                  <td className="py-2 px-4">${p.per_diem?.toFixed(2)}</td>
                  <td className="py-2 px-4 font-semibold text-green-700">
                    ${p.total_pay?.toFixed(2)}
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleGenerateMemo(p.artist_id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      PDF Memo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
