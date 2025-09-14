import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// CORS options
const corsOptions = {
    origin: [
        "https://hello-chat-five.vercel.app",   // No trailing slash
        "http://localhost:3000",                 // Local dev
        "http://localhost:5173"                  // Vite dev server
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200
};

// Use CORS middleware globally before routes
app.use(cors(corsOptions));

app.use(express.json({ limit: "4mb" }));

// Socket.io setup
export const io = new Server(server, {
    cors: {
        origin: corsOptions.origin,
        methods: corsOptions.methods,
        credentials: true
    },
    transports: ["websocket", "polling"],
});

// Socket.io middleware to extract userId
io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
        return next(new Error("Invalid user ID"));
    }
    socket.userId = userId;
    next();
});

// Store online users map
export const userSocketMap = {}; // { userId: socketId }

// Helper to get receiver socket ID
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log("User Connected:", userId, "Socket ID:", socket.id);

    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`User ${userId} (${socket.id}) joined room: ${room}`);
    });

    socket.on("leaveRoom", (room) => {
        socket.leave(room);
        console.log(`User ${userId} (${socket.id}) left room: ${room}`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", userId);
        if (userId) {
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

    socket.on("userLogout", () => {
        console.log("User logged out:", userId);
        if (userId) {
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`, req.headers.authorization ? "WITH AUTH" : "NO AUTH");
    console.log("Origin:", req.headers.origin);
    next();
});

// Status route
app.use("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Server is live",
        timestamp: new Date().toISOString(),
        onlineUsers: Object.keys(userSocketMap).length,
    });
});

// API routes
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
        method: req.method,
    });
});

// Connect MongoDB then start server
try {
    await connectDB();
    console.log("✅ Database connected successfully");
} catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on PORT: ${PORT}`);
    console.log(`🌐 Frontend URL: https://hello-chat-five.vercel.app`);
    console.log("📡 Socket.io server is ready");
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
        console.log("Process terminated");
    });
});

process.on("SIGINT", () => {
    console.log("SIGINT received. Shutting down gracefully...");
    server.close(() => {
        console.log("Process terminated");
    });
});

// Export server for Vercel
export default server;
