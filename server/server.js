import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js"
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
    cors: { 
        origin: "https://hello-chat-five.vercel.app/",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ["websocket", "polling"], // Allow both for better compatibility
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

    // Handle typing indicators (optional enhancement)
    socket.on("typing", (data) => {
        const room = data.room;
        socket.to(room).emit("userTyping", {
            userId: userId,
            isTyping: data.isTyping
        });
    });

    // Handle message read receipts (optional enhancement)
    socket.on("messageRead", (data) => {
        const room = data.room;
        socket.to(room).emit("messageReadReceipt", {
            messageId: data.messageId,
            readBy: userId
        });
    });
});

// Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors({
    origin: "https://hello-chat-five.vercel.app/",
    credentials: true
}));

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

// Handle 404 routes - FIXED: Remove the "*" pattern
app.use((req, res) => {
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
    console.log(`🌐 Frontend URL: https://hello-chat-five.vercel.app/`);
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
