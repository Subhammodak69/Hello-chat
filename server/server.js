import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js"
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

//create Express app and Httpserver

const app = express();
const server = http.createServer(app)

//Initialize socket.io server
export const io = new Server(server, {
    cors: { origin: "https://hello-chat-five.vercel.app/" },
    transports: ["websocket"], // Optional, to prevent polling issues
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

// Store Online user
export const userSocketMap = {}; //{ userId: socketId }

//Socket.io connection handler
// In your socket connection handler, fix the socket ID storage:

io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log("User Connected", userId);

    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User disconnected", userId);
        if (userId) {
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

    socket.on("userLogout", () => {
        if (userId) {
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });
});


//Middleware setup

app.use(express.json({ limit: "4mb" }));
app.use(cors());

//Route setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log("Server is running on PORT: " + PORT));

//Export server for vercel
export default server;
