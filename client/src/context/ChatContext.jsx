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

        // Handle new incoming messages
        const handleNewMessage = (newMessage) => {
            const isCurrentConversation = selectedUser &&
                (newMessage.senderId === selectedUser ||
                    newMessage.receiverId === selectedUser ||
                    newMessage.senderId === authUser?._id);

            if (isCurrentConversation) {
                const messageWithSender = {
                    ...newMessage,
                    sender_name: newMessage.senderData?.fullName || "Unknown",
                    sender_pic: newMessage.senderData?.profilePic || null
                };

                setMessages(prev => {
                    const exists = prev.some(msg => msg._id === newMessage._id);
                    return exists ? prev : [...prev, messageWithSender];
                });

                if (newMessage.senderId === selectedUser && newMessage.senderId !== authUser?._id) {
                    axios.put(`/api/messages/mark/${newMessage._id}`).catch(console.error);
                }
            } else if (newMessage.senderId !== authUser?._id) {
                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }));
            }
        };

        // Handle message deletion in real-time
        const onDeleted = ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        };
        socket.on("messageDeleted", onDeleted);

        // Register socket listeners
        socket.on("newMessage", handleNewMessage);

        // Cleanup on unmount or dependency change
        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messageDeleted", onDeleted);
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




    // Delete a message by its _id
    const deleteMessage = async (messageId) => {
        try {
            console.log("going to delete backend");
            await axios.delete(`/api/messages/${messageId}`);
            -   // Remove from local state locally, let socket handle it
                -   setMessages(prev => prev.filter(msg => msg._id !== messageId));
            toast.success("Message deleted");
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
        setUnseenMessages,
        deleteMessage
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
