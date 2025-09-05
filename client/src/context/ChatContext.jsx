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

    const { socket, axios } = useContext(AuthContext);

    //Function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");

            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.setUnseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //Function to get the user details
    const fetchUserData = async (userId) => {
        try {
            console.log("helllooooo asloooo");
            const { data } = await axios.get(`/api/messages/user-data/${userId}`); // API endpoint ideally for user details
            if (data.success) {
                console.log(data.user);
                setSelectedUserData(data.user); // Set user object, not entire response object
            }
        } catch (error) {
            toast.error("Failed to fetch user data");
        }
    }




    // Function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.success)
        }
    }


    // Function to send message to selected user

    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage])
            }
            else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Function to subscribe to messages for selected user

    const subcribeToMessages = async () => {
        if (!socket) return;

        socket.on("newMessage", () => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage])
                axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]: prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })
    }

    // Function to unsubscribe to messages
    const unsubscribeFromMessages = () => {
        if (socket) socket.off("newMessage")
    }

    useEffect(() => {
        subcribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])


    const value = {
        messages, users, selectedUser,fetchUserData, selectedUserData,setSelectedUserData, getUsers, setMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages
    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}