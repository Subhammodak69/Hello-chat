import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

const App = () =>{
  return (
    <div style={gradientStyle}>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
      </Routes>
    </div>
  )
}
const gradientStyle = {
  background: 'linear-gradient(90deg, rgb(43, 142, 255), rgb(125, 186, 255), rgb(10 29 157))',
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export default App