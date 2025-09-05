import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'

const HomePage = () => {
  const token = localStorage.getItem("token");

  const [selectedUser, setSelectedUser] = useState(false);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to use the chat application.</p>
      </div>
    );
  }

  return (
    <div className='border w-full h-screen sm:py-[1%] sm:px-[1%]'>
      <div className={`backdrop-blur-xl border-grey-600 rounded-2xl overflow-hidden h-[100%] grid grid-cols-1 relative ${selectedUser? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]':'md:grid-cols-2'}`}>
        <Sidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser}/>
        <ChatContainer selectedUser={selectedUser} setSelectedUser={setSelectedUser}/>
        <RightSidebar selectedUser={selectedUser} setSelectedUser={setSelectedUser}/>
      </div>
    </div>
  );
};

export default HomePage;
