import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Helper: get unseen counts per sender for a user
const getUnseenMessagesForUser = async (userId) => {
  const agg = await Message.aggregate([
    { $match: { receiverId: new mongoose.Types.ObjectId(userId), seen: false } }, // FIXED
    { $group: { _id: "$senderId", count: { $sum: 1 } } }
  ]);
  return agg.reduce((map, item) => {
    map[item._id.toString()] = item.count;
    return map;
  }, {});
};

const getChatMembersForUser = async (userId) => {
  const sent = await Message.distinct("receiverId", {
    senderId: new mongoose.Types.ObjectId(userId) // FIXED
  });
  const received = await Message.distinct("senderId", {
    receiverId: new mongoose.Types.ObjectId(userId) // FIXED
  });
  const all = Array.from(new Set([...sent, ...received].map(id => id.toString())));
  return all.filter(id => id !== userId.toString());
};

// In the getUsersForSidebar controller:
const unseenAgg = await Message.aggregate([
  { $match: { receiverId: new mongoose.Types.ObjectId(userId), seen: false } }, // FIXED
  { $group: { _id: "$senderId", count: { $sum: 1 } } }
]);

// DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findById(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    if (msg.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(id);

    // Notify both parties in the room
    const room = [msg.senderId, msg.receiverId].map(String).sort().join("-");
    io.to(room).emit("messageDeleted", { messageId: id });

    // Also update both sidebars
    [msg.senderId, msg.receiverId].forEach(async userId => {
      const socketId = userSocketMap[userId.toString()];
      if (socketId) {
        const unseen = await getUnseenMessagesForUser(userId);
        const members = await getChatMembersForUser(userId);
        io.to(socketId).emit("updateSidebar", {
          unseenMessages: unseen,
          chatMembers: members
        });
      }
    });

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages/:id
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    // Verify receiver exists
    const receiverUser = await User.findById(receiverId).select("fullName profilePic");
    if (!receiverUser) {
      return res.status(404).json({ success: false, message: "Receiver user not found" });
    }

    let imageUrl;
    if (image) {
      const uploadResp = await cloudinary.uploader.upload(image);
      imageUrl = uploadResp.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl
    });

    const senderData = await User.findById(senderId).select("fullName profilePic");
    const payload = { ...newMessage.toObject(), senderData };

    // Emit newMessage to the room
    const room = [senderId, receiverId].map(String).sort().join("-");
    io.to(room).emit("newMessage", payload);

    // Update unread count & sidebar for receiver
    const receiverSocket = userSocketMap[receiverId];
    if (receiverSocket) {
      const unseen = await getUnseenMessagesForUser(receiverId);
      const members = await getChatMembersForUser(receiverId);
      // Direct unread count update
      io.to(receiverSocket).emit("unreadCountUpdate", {
        userId: senderId.toString(),
        count: unseen[senderId.toString()] || 0
      });
      // Full sidebar state
      io.to(receiverSocket).emit("updateSidebar", {
        unseenMessages: unseen,
        chatMembers: members
      });
    }

    // Update sidebar for sender as well
    const senderSocket = userSocketMap[senderId];
    if (senderSocket) {
      const unseenSender = await getUnseenMessagesForUser(senderId);
      const membersSender = await getChatMembersForUser(senderId);
      io.to(senderSocket).emit("updateSidebar", {
        unseenMessages: unseenSender,
        chatMembers: membersSender
      });
    }

    res.json({ success: true, newMessage, senderData });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/messages/mark/:id
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const msg = await Message.findByIdAndUpdate(id, { seen: true });
    if (!msg) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Notify user of updated unread count
    const socketId = userSocketMap[userId.toString()];
    if (socketId) {
      const unseen = await getUnseenMessagesForUser(userId);
      io.to(socketId).emit("unreadCountUpdate", {
        userId: msg.senderId.toString(),
        count: unseen[msg.senderId.toString()] || 0
      });
      io.to(socketId).emit("updateSidebar", { unseenMessages: unseen });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark seen error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/:id
export const getMessages = async (req, res) => {
  try {
    const selectedUserId = req.params.id;
    const myId = req.user._id;
    const msgs = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId }
      ]
    })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    // Mark all as seen
    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    const formatted = msgs.map(m => ({
      ...m.toObject(),
      senderData: m.senderId
    }));

    res.json({ success: true, messages: formatted });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/users
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const others = await User.find({ _id: { $ne: userId } }).select("-password");

    const unseenAgg = await Message.aggregate([
      { $match: { receiverId: mongoose.Types.ObjectId(userId), seen: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } }
    ]);
    const unseenMap = unseenAgg.reduce((map, i) => {
      map[i._id.toString()] = i.count;
      return map;
    }, {});

    const members = await getChatMembersForUser(userId);

    res.json({
      success: true,
      users: others,
      unseenMessages: unseenMap,
      chatMembers: members
    });
  } catch (error) {
    console.error("Get sidebar users error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/user-data/:id
export const getUserData = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({ success: false, message: "User ID not provided" });
    }
    const userObj = await User.findById(id);
    if (!userObj) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: userObj });
  } catch (error) {
    console.error("Get user data error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
