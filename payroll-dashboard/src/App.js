import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/payments")
      .then((res) => setPayments(res.data.data))
      .catch((err) => console.error("Error fetching payments:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold text-center mb-6">🎬 Payroll Summary</h1>
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
              <td className="py-2 px-4">${p.regular_pay}</td>
              <td className="py-2 px-4">${p.overtime_pay}</td>
              <td className="py-2 px-4">${p.per_diem}</td>
              <td className="py-2 px-4 font-semibold">${p.total_pay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
