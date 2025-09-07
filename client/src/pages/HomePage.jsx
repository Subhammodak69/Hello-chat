import React, { useContext, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../context/ChatContext';

const HomePage = () => {
  const token = localStorage.getItem("token");

  const {selectedUserData} = useContext(ChatContext);
  const [isOnProfile, setIsOnProfile] = useState(false);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to use the chat application.</p>
      </div>
    );
  }

  return (
    <div className='border w-full h-screen sm:py-[1%] sm:px-[1%]'>
      <div className={`backdrop-blur-xl border-grey-600 md:rounded-[20px] overflow-hidden h-[100%] grid grid-cols-1 relative ${selectedUserData ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_1.5fr_1fr]':'md:grid-cols-[1fr_2fr]'}`}>
        {!isOnProfile && <Sidebar />}
        {!isOnProfile && <ChatContainer isOnProfile = {isOnProfile} setIsOnProfile = {setIsOnProfile}/>}
         <RightSidebar selectedUserData={selectedUserData} isOnProfile = {isOnProfile} setIsOnProfile = {setIsOnProfile} />
      </div>
    </div>
  );
};

export default HomePage;
