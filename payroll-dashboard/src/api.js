import axios from "axios";

export const api = axios.create({
  baseURL: "https://movieprodai-1.onrender.com",
});
