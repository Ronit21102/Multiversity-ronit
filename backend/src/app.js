import express from "express";
import cors from "cors";
import { versionRoutes } from "./routes/versionRoutes.js";

const app = express();
const API_PORT = 3001;

// Enable CORS for frontend
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Enable JSON parsing for API routes
app.use(express.json());

// Mount version routes
app.use("/api", versionRoutes);

// Start Express server
app.listen(API_PORT, () => {
  console.log(`🚀 Express API server running on http://localhost:${API_PORT}`);
});

export { app };
