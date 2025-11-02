import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { motion } from "framer-motion";
import ChatAssistant from "./ChatAssistant";

function App() {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPay, setMinPay] = useState("");
  const [maxPay, setMaxPay] = useState("");
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [showScroll, setShowScroll] = useState(false);

  // 🌙 Toggle dark mode
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // 🚀 Fetch payroll data
  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get("https://movieprodai-1.onrender.com/payments");
      const data = res.data.data || [];
      setPayments(data);
      setFiltered(data);
    } catch (err) {
      console.error("Error fetching payments:", err);
    }
  };

  // 📤 Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a CSV file first.");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("https://movieprodai-1.onrender.com/upload_timesheet", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message);
      await fetchPayments();
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("Upload failed. Check backend.");
    }
  };

  // 📄 Download deal memo
  const downloadMemo = async (artist_id) => {
    try {
      setDownloading(artist_id);
      const res = await axios.get(
        `https://movieprodai-1.onrender.com/generate_deal_memo/${artist_id}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `deal_memo_${artist_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error generating deal memo. Check backend.");
    } finally {
      setDownloading(null);
    }
  };

  // 🔍 Filtering logic
  useEffect(() => {
    let data = [...payments];
    const lower = searchTerm.toLowerCase();
    if (searchTerm)
      data = data.filter(
        (p) =>
          p.role?.toLowerCase().includes(lower) ||
          p.artist_id?.toString().includes(lower)
      );
    if (minPay) data = data.filter((p) => p.total_pay >= Number(minPay));
    if (maxPay) data = data.filter((p) => p.total_pay <= Number(maxPay));
    setFiltered(data);
  }, [searchTerm, minPay, maxPay, payments]);

  // 📊 Chart data
  const roleData = Object.values(
    filtered.reduce((acc, p) => {
      if (!acc[p.role])
        acc[p.role] = {
          role: p.role,
          totalPay: 0,
          totalHours: 0,
          regularPay: 0,
          overtimePay: 0,
          count: 0,
        };
      acc[p.role].totalPay += p.total_pay || 0;
      acc[p.role].totalHours += p.hours_worked || 0;
      acc[p.role].regularPay += p.regular_pay || 0;
      acc[p.role].overtimePay += p.overtime_pay || 0;
      acc[p.role].count++;
      return acc;
    }, {})
  ).map((r) => ({
    ...r,
    avgHours: (r.totalHours / r.count).toFixed(1),
  }));

  // 🧭 Scroll button logic
  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 250);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* 🧭 Navbar */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`flex justify-between items-center px-8 py-4 shadow-md ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          🎬 Paymaster 2025
        </h1>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </motion.nav>

      {/* 🧾 Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="p-10"
      >
        <h2 className="text-3xl font-bold text-center mb-8 text-indigo-700 dark:text-indigo-400">
          Payroll Dashboard
        </h2>

        {/* 📤 Upload Section */}
        <form
          onSubmit={handleUpload}
          className="flex justify-center items-center gap-4 mb-8"
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-gray-400 p-2 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Upload CSV
          </button>
        </form>

        {message && (
          <p className="text-center text-green-500 font-medium mb-6">{message}</p>
        )}

        {/* 🔍 Filter Bar */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <input
            type="text"
            placeholder="Search by role or artist ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded-md w-60 dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="number"
            placeholder="Min Pay"
            value={minPay}
            onChange={(e) => setMinPay(e.target.value)}
            className="p-2 border border-gray-300 rounded-md w-32 dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="number"
            placeholder="Max Pay"
            value={maxPay}
            onChange={(e) => setMaxPay(e.target.value)}
            className="p-2 border border-gray-300 rounded-md w-32 dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={() => {
              setSearchTerm("");
              setMinPay("");
              setMaxPay("");
              setFiltered(payments);
            }}
            className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Reset
          </button>
        </div>

        {/* 💼 Table + Charts + Chat */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* 💼 Payroll Table */}
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-xl mb-12">
            <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
              <thead className="bg-indigo-50 dark:bg-gray-700 text-indigo-800 dark:text-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b">Artist ID</th>
                  <th className="py-3 px-4 border-b">Role</th>
                  <th className="py-3 px-4 border-b">Hours</th>
                  <th className="py-3 px-4 border-b">Regular Pay</th>
                  <th className="py-3 px-4 border-b">Overtime Pay</th>
                  <th className="py-3 px-4 border-b">Per Diem</th>
                  <th className="py-3 px-4 border-b font-semibold">Total Pay</th>
                  <th className="py-3 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-center">
                      <td className="py-2 px-4 border-b">{p.artist_id}</td>
                      <td className="py-2 px-4 border-b">{p.role}</td>
                      <td className="py-2 px-4 border-b">{p.hours_worked}</td>
                      <td className="py-2 px-4 border-b">${p.regular_pay}</td>
                      <td className="py-2 px-4 border-b">${p.overtime_pay}</td>
                      <td className="py-2 px-4 border-b">${p.per_diem}</td>
                      <td className="py-2 px-4 border-b font-semibold text-indigo-600 dark:text-indigo-400">
                        ${p.total_pay}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => downloadMemo(p.artist_id)}
                          disabled={downloading === p.artist_id}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
                        >
                          {downloading === p.artist_id ? "⏳ Generating..." : "📄 PDF"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-6 text-gray-500 text-center italic">
                      No matching records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 📊 Charts Section */}
          {filtered.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-12">
              <h2 className="text-2xl font-bold text-center mb-6 text-indigo-700 dark:text-indigo-400">
                Payroll Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* 💰 Bar Chart */}
                <div>
                  <h3 className="text-center font-semibold mb-2">💰 Total Pay by Role</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={roleData}>
                      <XAxis dataKey="role" stroke={darkMode ? "#D1D5DB" : "#1F2937"} />
                      <YAxis stroke={darkMode ? "#D1D5DB" : "#1F2937"} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalPay" fill={darkMode ? "#818CF8" : "#4F46E5"} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* ⏱ Line Chart */}
                <div>
                  <h3 className="text-center font-semibold mb-2">⏱ Avg Hours per Role</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={roleData}>
                      <XAxis dataKey="role" stroke={darkMode ? "#D1D5DB" : "#1F2937"} />
                      <YAxis stroke={darkMode ? "#D1D5DB" : "#1F2937"} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgHours"
                        stroke={darkMode ? "#34D399" : "#10B981"}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 📊 Pie Chart */}
                <div>
                  <h3 className="text-center font-semibold mb-2">📊 Pay Breakdown</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Regular Pay", value: roleData.reduce((a, r) => a + r.regularPay, 0) },
                          { name: "Overtime Pay", value: roleData.reduce((a, r) => a + r.overtimePay, 0) },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {["#4F46E5", "#10B981"].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 🤖 Chat Assistant */}
          <ChatAssistant />

          {/* ⚡ Footer */}
          <footer
            className={`mt-12 py-4 text-center border-t ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-gray-300"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            <p className="text-sm">
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Paymaster 2025
              </span>{" "}
              | Built with 💼 by{" "}
              <a
                href="https://www.linkedin.com/in/vanshshriwastava901"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 transition"
              >
                Vansh Shriwastava
              </a>
            </p>
          </footer>
        </motion.div>
      </motion.div>

      {/* 🔝 Scroll-to-Top */}
      {showScroll && (
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg transition 
            ${
              darkMode
                ? "bg-indigo-500 hover:bg-indigo-400 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
        >
          ⬆️
        </motion.button>
      )}
    </div>
  );
}

export default App;
