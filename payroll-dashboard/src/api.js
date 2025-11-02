// ✅ api.js — FINAL PRODUCTION VERSION

import axios from "axios";

// 🌍 Backend API URL (Render)
export const BASE_URL = "https://movieprodai-1.onrender.com";

// 🧩 Axios instance for consistent API calls
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: quick test function (can remove later)
export const testConnection = async () => {
  try {
    const response = await api.get("/");
    console.log("✅ Connected to backend:", response.status);
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
  }
};
