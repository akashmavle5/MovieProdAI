import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch payments from backend API
    axios
      .get("http://127.0.0.1:8000/payments")
      .then((res) => {
        if (res.data?.data) {
          setPayments(res.data.data);
        } else {
          setError("No data received from server.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching payments:", err);
        setError("Failed to connect to backend.");
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="text-center mt-10 text-gray-600">⏳ Loading payroll data...</div>;

  if (error)
    return (
      <div className="text-center mt-10 text-red-600 font-semibold">
        ❌ {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold text-center mb-6">🎬 Payroll Summary</h1>

      {payments.length === 0 ? (
        <p className="text-center text-gray-500">No payment records found</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-xl overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Artist ID</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-left">Hours</th>
              <th className="py-3 px-4 text-left">Regular Pay</th>
              <th className="py-3 px-4 text-left">Overtime Pay</th>
              <th className="py-3 px-4 text-left">Per Diem</th>
              <th className="py-3 px-4 text-left">Total Pay</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
