import React, { useRef, useEffect, useState, useContext } from 'react'
import logoImg from '../assets/message.png';
import { useNavigate } from 'react-router-dom';
import avatar_icon from '../assets/avatar.avif';
import logoutIcon from '../assets/turn-off.png';
import ProfileIcon from '../assets/user.png';
import { AuthContext } from '../context/AuthContext';
import LoaderSpinner from '../components/LoaderSpinner'
import { ChatContext } from '../context/ChatContext';


const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, unseenMessages,selectedUserData } = useContext(ChatContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(false)

  const dropdownRef = useRef(null);

  const filteredUsers = input ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) : users;


  // Close dropdown if click is outside of dropdownRef element
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const { logout, onlineUsers } = useContext(AuthContext);

  useEffect(() => {
    getUsers();
  }, []);


  // Wrapper for logout to handle loading
  const handleLogout = async () => {
    setLoading(true);  // Show loader
    try {
      await logout();  // Wait for logout process to finish
      // Optionally navigate somewhere after logout if not handled inside logout
      navigate('/login');
    } catch (error) {
      // Handle errors here if needed
      console.error('Logout failed:', error);
    } finally {
      setLoading(false); // Hide loader
    }
  };


  return (
    <>
      <div className={`bg-[#000ea6]/10 h-full p-5 overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ''}`}>
        <div className='pb-5'>
          <div className='flex justify-between items-start'>
            <div className='flex items-center'>
              <img src={logoImg} alt="logo" className="rounded-full ml-[5px] mt-[5px] max-w-10" />
              <h1 className='m-auto text-lg text-black font-bold'>Hello Chats</h1>

            </div>
            <div className="relative group mr-[10px]" ref={dropdownRef}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-white-800 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>

              <div className={`absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[ #3579ff3b] border border-grey-600 text-grey-100 cursor-pointer 
    ${isOpen ? "block" : "hidden"} group-hover:block`}>
                <p onClick={() => navigate('/profile')} className="cursor-pointer flex gap-[5px] text-sm">
                  <img src={ProfileIcon} alt='' className='max-w-5 bg-white rounded-full' />
                  Profile
                </p>
                <hr className="my-2 border-t border-grey-500" />
                <p onClick={handleLogout} className="cursor-pointer flex gap-[5px] text-sm">
                  <img src={logoutIcon} alt='' className='max-w-5 bg-white rounded-full' />
                  Logout
                </p>
              </div>
            </div>


          </div>
          <div className='bg-[#261f40] rounded-full flex items-center gap-2 mt-[10px] mb-[10px]'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-8 py-2 pl-2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
              />
            </svg>
            <input onChange={(e) => setInput(e.target.value)}
              type="text" className='bg-transparenborder-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1' placeholder='Search User....' />
          </div>
          <div className="flex flex-col">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                onClick={() => {
                  setSelectedUser(user._id);
                }}
                className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${selectedUserData && selectedUserData._id === user._id ? 'bg-[#282142]/50' : ''}`}
              >
              
                <img
                  src={user?.profilePic || avatar_icon}
                  alt={user.fullName || 'User avatar'}
                  className="h-[40px] aspect-[1/1] rounded-full object-cover"
                />
                <div className="flex flex-col leading-5">
                  <p>{user.fullName}</p>
                  {onlineUsers.includes(user._id) ? (
                    <span className="text-green-400 text-xs">Online</span>
                  ) : (
                    <span className="text-neutral-400 text-xs">Offline</span>
                  )}
                </div>
                {unseenMessages?.[user._id] && (
                  <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                    {unseenMessages[user._id]}
                  </p>
                )}

              </div>
            ))}
          </div>

        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-opacity-30 backdrop-blur-sm pointer-events-auto">
          <LoaderSpinner />
        </div>
      )}
    </>
  )
}

export default Sidebar