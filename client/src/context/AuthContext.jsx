import { useEffect, useState, createContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import axios from "axios";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null); // Fixed typo: was setSoket

    // Check if User is authenticated and if so, set the user data and connect the socket
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
        }
    };

    // Login function to handle user authentication and socket connection
    const login = async (state, credentials, navigate) => {
        try {
            const response = await axios.post(`/api/auth/${state}`, credentials);
            const data = response.data;
            await delay(1500);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);

                // call navigate here
                if (navigate) navigate("/");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Logout function to handle user logout and socket disconnection
    const logout = async () => {
        await delay(1500);
        
        // Emit logout event before disconnecting
        if (socket) {
            socket.emit("userLogout");
            socket.disconnect();
            setSocket(null);
        }
        
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully.");
    };

    // Update profile function to handle user profile updates
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully.");
            } else {
                toast.error("Not Updated ! Retry");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Connect socket function to handle socket connection and online users updates
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            }
        });

        // Set socket immediately
        setSocket(newSocket);

        // Socket event listeners
        newSocket.on("connect", () => {
            console.log("Connected to server");
        });

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });

        newSocket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        // Handle connection errors
        newSocket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });
    };

    // Cleanup socket on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token;
        }
        checkAuth();
    }, []);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
