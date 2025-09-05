import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "./context/AuthContext.jsx";


const ProtectedRoute = ({ children }) => {
  const { authUser } = useContext(AuthContext);
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-r from-[#2b8eff] via-[#005ac0c7] to-[#0a1d9d]">
      <Toaster />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};


export default App;
