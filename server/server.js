import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js"
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

// ✅ FIXED: Remove trailing slash and add multiple origins
export const io = new Server(server, {
    cors: { 
        origin: [
            "https://hello-chat-five.vercel.app",  // ✅ No trailing slash
            "http://localhost:3000",               // For local development
            "http://localhost:5173"                // For Vite dev server
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ["websocket", "polling"],
});

// ✅ Middleware to extract userId from auth
io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
        return next(new Error("Invalid user ID"));
    }
    socket.userId = userId;
    next();
});

// Store Online users
export const userSocketMap = {}; // { userId: socketId }

// Helper function to get receiver's socket ID
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log("User Connected:", userId, "Socket ID:", socket.id);

    // Store user's socket ID
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    // Emit updated online users list
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Handle joining chat rooms for real-time updates
    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`User ${userId} (${socket.id}) joined room: ${room}`);
    });

    // Handle leaving chat rooms
    socket.on("leaveRoom", (room) => {
        socket.leave(room);
        console.log(`User ${userId} (${socket.id}) left room: ${room}`);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", userId);
        if (userId) {
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

    // Handle user logout
    socket.on("userLogout", () => {
        console.log("User logged out:", userId);
        if (userId) {
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });
});

// ✅ FIXED: Updated CORS middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors({
    origin: [
        "https://hello-chat-five.vercel.app",  // ✅ No trailing slash
        "http://localhost:3000",               // For local development
        "http://localhost:5173"                // For Vite dev server
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`, req.headers.authorization ? 'WITH AUTH' : 'NO AUTH');
    console.log('Origin:', req.headers.origin);
    next();
});

// Route setup
app.use("/api/status", (req, res) => {
    res.json({ 
        success: true, 
        message: "Server is live", 
        timestamp: new Date().toISOString(),
        onlineUsers: Object.keys(userSocketMap).length
    });
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
    });
});

// Handle 404 routes
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        success: false, 
        message: "Route not found",
        path: req.originalUrl,
        method: req.method
    });
});

// Connect to MongoDB
try {
    await connectDB();
    console.log("✅ Database connected successfully");
} catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on PORT: ${PORT}`);
    console.log(`🌐 Frontend URL: https://hello-chat-five.vercel.app`);
    console.log(`📡 Socket.io server is ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});

// Export server for Vercel
export default server;
