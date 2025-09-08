import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, getUserData, sendMessage, deleteMessage } from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users",protectRoute, getUsersForSidebar);
messageRouter.get("/user-data/:id",protectRoute, getUserData);
messageRouter.get("/:id",protectRoute, getMessages);
messageRouter.delete("/:id",protectRoute,deleteMessage);
messageRouter.get("/mark/:id",protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id",protectRoute, sendMessage);

export default messageRouter;