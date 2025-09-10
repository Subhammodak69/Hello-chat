import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Fetch message before delete to get sender and receiver info
        const msg = await Message.findById(id);
        if (!msg) {
            return res.status(404).json({ 
                success: false, 
                message: "Message not found" 
            });
        }

        // Verify that the user deleting is the sender
        if (msg.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own messages"
            });
        }

        // Delete the message
        await Message.findByIdAndDelete(id);

        // Create room name with consistent string formatting
        const room = [msg.senderId.toString(), msg.receiverId.toString()].sort().join("-");
        
        console.log(`Emitting messageDeleted to room: ${room}, messageId: ${id}`);
        console.log(`Online users in room:`, Object.keys(userSocketMap));
        
        // Emit to room that message was deleted
        io.to(room).emit("messageDeleted", { messageId: id });

        res.json({ 
            success: true, 
            message: "Message deleted successfully" 
        });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// Send message to selected user (updated for consistency)
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        // Verify receiver user exists
        const receiverUser = await User.findById(receiverId).select("fullName profilePic");
        if (!receiverUser) {
            return res.status(404).json({ success: false, message: "Receiver user not found" });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId: receiverUser._id,
            text,
            image: imageUrl
        });

        // Get sender data
        const senderData = await User.findById(senderId).select("fullName profilePic");

        // Create message object for socket emission
        const messageForSocket = {
            ...newMessage.toObject(),
            senderData: senderData
        };

        // Create room name with consistent string formatting
        const room = [senderId.toString(), receiverId.toString()].sort().join("-");
        console.log(`Emitting newMessage to room: ${room}`);
        
        // Emit to room instead of individual sockets
        io.to(room).emit("newMessage", messageForSocket);

        res.json({
            success: true,
            newMessage: newMessage,
            senderData: senderData
        });

    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Keep your other functions the same...
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        }).populate('senderId', 'fullName profilePic').sort({ createdAt: 1 });

        // Mark messages as seen
        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId },
            { seen: true }
        );

        // Format messages with sender data
        const formattedMessages = messages.map(msg => ({
            ...msg.toObject(),
            senderData: msg.senderId
        }));

        res.json({ success: true, messages: formattedMessages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const allOtherUsers = await User.find({ _id: { $ne: userId } }).select("-password");
        const senderIds = allOtherUsers.map(user => user._id);

        const unseenMessages = await Message.aggregate([
            {
                $match: {
                    senderId: { $in: senderIds },
                    receiverId: userId,
                    seen: false
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const chatMembers = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                }
            },
            {
                $project: {
                    userId1: "$senderId",
                    userId2: "$receiverId",
                }
            },
            {
                $project: {
                    otherUserId: {
                        $cond: [
                            { $eq: ["$userId1", userId] },
                            "$userId2",
                            "$userId1"
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$otherUserId"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $replaceRoot: { newRoot: "$userDetails" }
            }
        ]);

        const unseenMessagesMap = {};
        unseenMessages.forEach(item => {
            unseenMessagesMap[item._id.toString()] = item.count;
        });

        res.json({ success: true, users: allOtherUsers, unseenMessages: unseenMessagesMap, chatMembers: chatMembers });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getUserData = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).json({ success: false, message: "User ID not provided" });
        }
        const userObject = await User.findById(id);
        if (!userObject) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user: userObject });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
