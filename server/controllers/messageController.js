import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    console.log("get................................");
    const userId = req.user._id;
    console.log("user_id: " + userId);

    try {
      const allUsers = await User.find().select("-password");
      console.log("All users:", allUsers, "Count:", allUsers.length);
    } catch (error) {
      console.log(error.message);
    }

    const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");
    console.log("Filtered users:", filteredUsers, "Count:", filteredUsers.length);

    // Count number of unseen messages from each user to current user
    const unseenMessages = {};

    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,  // fixed typo here
        seen: false,
      });
      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

    await Promise.all(promises);

    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all messages for selected user

export const getMessages = async (req, res)=>{
    try{
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                {senderId: myId, reiceiverId: selectedUserId},
                {senderId: selectedUserId, reiceiverId: myId},
            ]
        })
        await Message.updateMany({senderId: selectedUserId, reiceiverId: myId}, {seen: true})
        res.json({success: true, messages})

    } catch (error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req,res)=>{
    try{
        const { id } = res.params;
        await Message.findByIdAndUpdate(id, {seen: true})
        res.json({success: true})
    } catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Send message to selected user
export const sendMessage = async (req, res)=>{
    try{
        const {text, image} = req.body;
        const reiceiverId = req.params._id;
        const senderId = req.user._id;

        let imageUrl;
        if (image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            reiceiverId,
            text,
            image: imageUrl
        })

        //emit the new message to the new receiver's socket
        const receiverSocketId = userSocketMap[reiceiverId];
        if (receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }
        res.json({success: true, newMessage});

    } catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}