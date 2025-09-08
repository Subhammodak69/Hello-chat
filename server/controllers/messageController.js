import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


// Send message to selected user
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

        // Get socket IDs for both users
        const receiverSocketId = userSocketMap[receiverId];
        const senderSocketId = userSocketMap[senderId.toString()];

        // Emit to receiver if online
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", messageForSocket);
        }

        // Emit to sender if online (for multiple tabs/devices)
        if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", messageForSocket);
        }

        // Optional: Broadcast to all connected clients (remove if you want private messaging only)
        // io.emit("newMessage", messageForSocket);

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

// Fix the mark message as seen function
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params; // Fixed from res.params
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update getMessages to include sender data
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

// Keep other functions the same...
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

        const unseenMessagesMap = {};
        unseenMessages.forEach(item => {
            unseenMessagesMap[item._id.toString()] = item.count;
        });

        res.json({ success: true, users: allOtherUsers, unseenMessages: unseenMessagesMap });
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


//DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Message.findByIdAndDelete(id);
    if (deleted) {
      res.status(200).json({ success: true, message: "Message deleted" });
    } else {
      res.status(404).json({ success: false, message: "Message not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




