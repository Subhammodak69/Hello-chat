import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserData, setSelectedUserData] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [chatMembers, setChatMembers] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);

    const { socket, axios, authUser } = useContext(AuthContext);

    // Memoize getUsers to prevent unnecessary re-renders
    const getUsers = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
                setChatMembers(data.chatMembers);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    }, [axios]);

    // Join chat room for real-time updates
    const joinChatRoom = useCallback((userId) => {
        if (!socket || !authUser) return;

        if (currentRoom) {
            socket.emit("leaveRoom", currentRoom);
        }

        const room = [authUser._id.toString(), userId.toString()].sort().join("-");
        socket.emit("joinRoom", room);
        setCurrentRoom(room);
    }, [socket, authUser, currentRoom]);

    useEffect(() => {
        if (socket && authUser && selectedUser) {
            joinChatRoom(selectedUser);
        }
    }, [socket, authUser, selectedUser, joinChatRoom]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            console.log("📨 New message received:", newMessage); // Debug log

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

                // Mark message as read if it's from the selected user
                if (newMessage.senderId === selectedUser && newMessage.senderId !== authUser?._id) {
                    axios.put(`/api/messages/mark/${newMessage._id}`).catch(console.error);
                }
            } else if (newMessage.senderId !== authUser?._id) {
                // **FIXED: Real-time unread count update**
                console.log("📊 Updating unread count for:", newMessage.senderId); // Debug log
                setUnseenMessages(prev => {
                    const updated = {
                        ...prev,
                        [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                    };
                    console.log("📊 Updated unseenMessages:", updated); // Debug log
                    return updated;
                });
            }
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        };

        const handleSidebarUpdate = (sidebarData) => {
            console.log("🔄 Sidebar update received:", sidebarData);

            if (sidebarData.users) {
                setUsers(sidebarData.users);
            }
            if (sidebarData.unseenMessages) {
                setUnseenMessages(sidebarData.unseenMessages);
                // Force users array to update with new reference so React re-renders
                setUsers(prevUsers => [...prevUsers]);
            }
            if (sidebarData.chatMembers) {
                setChatMembers(sidebarData.chatMembers);
            }
        };

        const handleUnreadCountUpdate = (data) => {
            console.log("📊 Direct unread count update:", data);
            if (data.userId && typeof data.count !== 'undefined') {
                setUnseenMessages(prev => ({
                    ...prev,
                    [data.userId]: data.count
                }));
                // Force users array to update with new reference so React re-renders
                setUsers(prevUsers => [...prevUsers]);
            }
        };


        // Clean up old listeners
        socket.off("newMessage");
        socket.off("messageDeleted");
        socket.off("updateSidebar");
        socket.off("unreadCountUpdate");

        // Register new listeners
        socket.on("newMessage", handleNewMessage);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("updateSidebar", handleSidebarUpdate);
        socket.on("unreadCountUpdate", handleUnreadCountUpdate);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("updateSidebar", handleSidebarUpdate);
            socket.off("unreadCountUpdate", handleUnreadCountUpdate);
        };
    }, [socket, selectedUser, authUser, axios, getUsers]);

    const fetchUserData = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/user-data/${userId}`);
            if (data.success) {
                setSelectedUserData(data.user);
            }
        } catch {
            toast.error("Failed to fetch user data");
        }
    };

    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                const messagesWithSenderInfo = data.messages.map(msg => ({
                    ...msg,
                    sender_name: msg.senderData?.fullName || "Unknown",
                    sender_pic: msg.senderData?.profilePic || null
                }));
                setMessages(messagesWithSenderInfo);

                // **FIXED: Clear unread count when messages are fetched**
                setUnseenMessages(prev => {
                    const updated = { ...prev };
                    if (updated[userId]) {
                        delete updated[userId];
                        console.log("📊 Cleared unread count for:", userId);
                    }
                    return updated;
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser}`, messageData);
            if (!data.success) toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            await axios.delete(`/api/messages/${messageId}`);
            toast.success("Message deleted");
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            if (selectedUser) getMessages(selectedUser);
        }
    };

    // **NEW: Function to manually clear unread count**
    const clearUnreadCount = useCallback((userId) => {
        setUnseenMessages(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
        });
    }, []);

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
        deleteMessage,
        chatMembers,
        joinChatRoom,
        clearUnreadCount, // New function
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
