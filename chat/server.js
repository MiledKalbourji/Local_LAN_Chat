// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// === Setup uploads directory ===
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// === Multer storage configuration ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    // timestamp to prevent duplicates
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  }
});

// Optional: Add size or type limits
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

// === Middleware ===
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadFolder));

// === Optional password check (disabled for now) ===
// const PASSWORD = "training2025";
// io.use((socket, next) => {
//   const pass = socket.handshake.auth?.password;
//   if (pass === PASSWORD) next();
//   else next(new Error("Invalid password"));
// });

// === Routes ===

// Handle file upload from client
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const fileURL = `/uploads/${req.file.filename}`;
  console.log(`File uploaded: ${req.file.originalname}`);

  // Notify all clients a file was uploaded
  io.emit("file uploaded", {
    name: req.file.originalname,
    path: fileURL
  });

  res.sendStatus(200);
});

// === WebSocket events ===
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// === Cleanup uploads on server exit ===
process.on("SIGINT", () => {
  console.log("\nCleaning up uploads before shutdown...");
  try {
    fs.rmSync(uploadFolder, { recursive: true, force: true });
  } catch (err) {
    console.error("Error cleaning uploads:", err);
  }
  process.exit();
});

// === Start server ===
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
