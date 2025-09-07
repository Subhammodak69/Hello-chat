import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserData, setSelectedUserData] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios, authUser } = useContext(AuthContext);

    // Real-time message listener
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            // console.log("Received new message:", newMessage);

            // Check if message is for current conversation
            const isCurrentConversation = selectedUser && 
                (newMessage.senderId === selectedUser || 
                 newMessage.receiverId === selectedUser ||
                 newMessage.senderId === authUser?._id);

            if (isCurrentConversation) {
                // Add message to current conversation
                const messageWithSender = {
                    ...newMessage,
                    sender_name: newMessage.senderData?.fullName || "Unknown",
                    sender_pic: newMessage.senderData?.profilePic || null
                };
                
                setMessages(prev => {
                    // Avoid duplicate messages
                    const messageExists = prev.some(msg => msg._id === newMessage._id);
                    if (messageExists) return prev;
                    return [...prev, messageWithSender];
                });

                // Mark as seen if message is from selected user and user is not sender
                if (newMessage.senderId === selectedUser && newMessage.senderId !== authUser?._id) {
                    axios.put(`/api/messages/mark/${newMessage._id}`).catch(console.error);
                }
            } else if (newMessage.senderId !== authUser?._id) {
                // Update unseen messages count for other conversations
                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }));
            }
        };

        socket.on("newMessage", handleNewMessage);

        // Cleanup
        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [socket, selectedUser, authUser, axios]);

    // Function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Function to get the user details
    const fetchUserData = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/user-data/${userId}`);
            if (data.success) {
                setSelectedUserData(data.user);
            }
        } catch (error) {
            toast.error("Failed to fetch user data");
        }
    };

    // Function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                // Add sender info to messages
                const messagesWithSenderInfo = data.messages.map(msg => ({
                    ...msg,
                    sender_name: msg.senderData?.fullName || "Unknown",
                    sender_pic: msg.senderData?.profilePic || null
                }));
                setMessages(messagesWithSenderInfo);
                
                // Clear unseen count for this user
                setUnseenMessages(prev => {
                    const updated = { ...prev };
                    delete updated[userId];
                    return updated;
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Function to send message to selected user
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser}`, messageData);
            if (data.success) {
                // Don't add message here - let the socket listener handle it
                // This prevents duplicate messages
                console.log("Message sent successfully");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const value = {
        messages,
        users,
        selectedUser,
        fetchUserData,
        selectedUserData,
        getMessages,
        setSelectedUserData,
        getUsers,
        setMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
