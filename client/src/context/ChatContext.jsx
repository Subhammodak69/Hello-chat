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
    const [chatMembers, setChatMembers] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);

    const { socket, axios, authUser } = useContext(AuthContext);

    // Join chat room for real-time updates
    const joinChatRoom = (userId) => {
        if (!socket || !authUser) return;

        if (currentRoom) {
            socket.emit("leaveRoom", currentRoom);
        }

        const room = [authUser._id.toString(), userId.toString()].sort().join("-");
        socket.emit("joinRoom", room);
        setCurrentRoom(room);
        console.log(`Joined room: ${room}`);
    };

    useEffect(() => {
        if (socket && authUser && selectedUser) {
            joinChatRoom(selectedUser);
        }
    }, [socket, authUser, selectedUser]);


    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            console.log("New message received:", newMessage);
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

        const handleMessageDeleted = ({ messageId }) => {
            console.log("Message deleted event received:", messageId);
            setMessages(prev => {
                const filtered = prev.filter(m => m._id !== messageId);
                console.log(`Removed message ${messageId}. Messages before: ${prev.length}, after: ${filtered.length}`);
                return filtered;
            });
        };

        // Sidebar update handler: update user list, unseenMessages, chatMembers
        const handleSidebarUpdate = (sidebarData) => {
            console.log("Received updateSidebar event:", sidebarData);
            if (sidebarData.users) setUsers(sidebarData.users);
            if (sidebarData.unseenMessages) setUnseenMessages(sidebarData.unseenMessages);
            if (sidebarData.chatMembers) setChatMembers(sidebarData.chatMembers);
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("updateSidebar", handleSidebarUpdate);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("updateSidebar", handleSidebarUpdate);
        };
    }, [socket, selectedUser, authUser, axios]);

    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            console.log("getUsers response:", data);
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
                setChatMembers(data.chatMembers);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

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
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
