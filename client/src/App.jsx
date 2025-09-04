import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "./context/AuthContext.jsx";


const App = () => {
  const {authUser} = useContext(AuthContext)
  return (
    <div style={gradientStyle}>
      <Toaster>
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to= "/login"/>} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to= "/login"/>} />
        </Routes>
      </Toaster>
    </div>
  )
}
const gradientStyle = {
  background: 'linear-gradient(90deg, rgb(43, 142, 255), rgb(0 90 192 / 78%), rgb(10 29 157))',
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export default App