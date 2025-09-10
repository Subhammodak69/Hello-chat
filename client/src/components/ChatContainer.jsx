import React, { useEffect, useState, useRef, useContext } from 'react'
import arrow_icon from '../assets/left-arrow.png';
import help from '../assets/question.png';
import logoImg from '../assets/message.png';
import galary from '../assets/image.png';
import avatar from '../assets/avatar.avif';
import sendbtn from '../assets/send.png';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from "../context/ChatContext"
import { AuthContext } from "../context/AuthContext"
import toast from 'react-hot-toast';
import emojiIcon from '../assets/emoji.png'
import EmojiPicker from 'emoji-picker-react'
import threeDot from '../assets/threedot.png'

const ChatContainer = ({ isOnProfile, setIsOnProfile }) => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, selectedUserData, setSelectedUserData, fetchUserData, deleteMessage } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [clicked, setClicked] = useState(null);
  
  // Refs
  const scrollEnd = useRef();
  const pickerRef = useRef();
  const inputRef = useRef(); // Added missing inputRef
  const messageRef = useRef(null);

  // Custom hook for mobile detection
  function useIsMobile(breakpoint = 786) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [breakpoint]);

    return isMobile;
  }

  const isMobile = useIsMobile();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return null;
    setInput("");
    await sendMessage({ text: input.trim() });
  }

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji)
    setShowPicker(false)
    inputRef.current?.focus() // Now properly references the input
  }

  // Handle clicking outside emoji picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close delete popup on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (clicked && messageRef.current && !messageRef.current.contains(event.target)) {
        setClicked(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clicked]);

  // Handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file...")
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result })
      e.target.value = ""
    }
    reader.readAsDataURL(file)
  }

  // Fetch messages and user data when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser);
      fetchUserData(selectedUser);
    } else {
      setSelectedUserData(null);
    }
  }, [selectedUser, getMessages, fetchUserData, setSelectedUserData]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Also scroll when component mounts or user changes
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "instant" });
    }
  }, [selectedUser]);

  // Helper function to check if message is from current user
  const isMyMessage = (msg) => {
    const senderId = msg.senderId?._id || msg.senderId;
    const currentUserId = authUser?._id;
    return senderId === currentUserId;
  };

  // Handle message deletion
  const handleDeleteMessage = (messageId) => {
    deleteMessage(messageId);
    setClicked(null);
  };

  if (!selectedUser) {
    return (
      <div className='flex flex-col bg-[#c8d8ff]/5 items-center justify-center gap-2 text-grey-500 max-md:hidden'>
        <img src={logoImg} alt="" className='max-w-16' />
        <p className='text-lg font-medium text-white'>Chat anytime anywhere</p>
      </div>
    );
  }

  return (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/* Header */}
      <div className='flex items-center justify-between gap-3 py-3 mx-4 border-b border-stone-500'>
        <div className="flex items-center gap-2"
          onClick={() => {
            if (isMobile) {
              console.log("Profile view triggered");
              setIsOnProfile(true);
            }
          }}
        >
          <img 
            src={selectedUserData?.profilePic || avatar} 
            alt='User Avatar' 
            className='w-10 h-10 rounded-full object-cover' 
          />
          <h1 className='m-auto text-lg text-black font-bold'>
            {selectedUserData?.fullName || "Loading..."}
          </h1>
          {selectedUserData && onlineUsers.includes(selectedUserData._id) && (
            <span className='w-2 h-2 rounded-full bg-green-700'></span>
          )}
        </div>
        <div>
          <img 
            onClick={() => setSelectedUser(null)} 
            src={arrow_icon} 
            alt='Back' 
            className='md:hidden max-w-7 cursor-pointer' 
          />
          <img 
            src={help} 
            alt="Help" 
            className='max-md:hidden max-w-5' 
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((msg, index) => {
          const isCurrentUserMessage = isMyMessage(msg);
          const messageId = msg._id || index;

          return isCurrentUserMessage ? (
            // My messages: right-aligned, violet bubble
            <div
              key={messageId}
              className="flex justify-end items-end mb-2"
            >
              <div 
                className="flex flex-col items-end cursor-pointer" 
                onMouseEnter={() => setHovered(messageId)} 
                onMouseLeave={() => setHovered(null)}
                ref={clicked === messageId ? messageRef : null}
              >
                <div className='flex items-center'>
                  {clicked === messageId && (
                    <div className='bg-stone-800 p-[2px_10px] text-white rounded cursor-pointer mr-2'>
                      <button 
                        className='cursor-pointer text-sm' 
                        onClick={() => handleDeleteMessage(msg._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {hovered === messageId && (
                    <img
                      src={threeDot}
                      alt='Options'
                      className='w-4 h-4 cursor-pointer mr-2'
                      onClick={(e) => {
                        e.stopPropagation();
                        setClicked(clicked === messageId ? null : messageId);
                      }}
                    />
                  )}

                  {msg.image ? (
                    <img 
                      onClick={() => window.open(msg.image)}
                      src={msg.image}
                      alt="Shared image"
                      className="max-w-[150px] border border-gray-700 rounded-lg overflow-hidden mb-2 cursor-pointer"
                    />
                  ) : (
                    <p className="p-2 max-w-[300px] md:text-sm font-light rounded-lg mb-2 break-all bg-violet-500/30 text-white rounded-br-none">
                      {msg.text}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>
            </div>
          ) : (
            // Other user messages: left-aligned, gray bubble with avatar
            <div
              key={messageId}
              className="flex justify-start items-start mb-2"
            >
              <img
                src={msg.sender_pic || msg.senderData?.profilePic || avatar}
                alt="Sender avatar"
                className="w-[20px] h-[20px] rounded-full mr-2"
              />
              <div className="flex flex-col items-start">
                {msg.image ? (
                  <img 
                    onClick={() => window.open(msg.image)}
                    src={msg.image}
                    alt="Shared image"
                    className="max-w-[150px] border border-gray-700 rounded-lg overflow-hidden mb-2 cursor-pointer"
                  />
                ) : (
                  <p className="p-2 max-w-[300px] md:text-sm font-light rounded-lg mb-2 break-all bg-stone-800 text-white rounded-bl-none">
                    {msg.text}
                  </p>
                )}
                <span className="text-xs text-gray-400">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Bottom Input Area */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          {/* Emoji Picker Button */}
          <button 
            onClick={() => setShowPicker((v) => !v)} 
            aria-label="Emoji picker"
            className="mr-2"
          >
            <img src={emojiIcon} alt="😊" className="w-6 h-6 cursor-pointer" />
          </button>

          {/* Emoji Picker */}
          {showPicker && (
            <div
              ref={pickerRef}
              style={{ 
                position: 'absolute', 
                bottom: '60px', 
                left: '10px', 
                zIndex: 1000 
              }}
            >
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}

          {/* Text Input */}
          <input
            ref={inputRef} // Now properly referenced
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
            type='text'
            placeholder='Send a message'
            className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent'
          />

          {/* Image Upload */}
          <input
            onChange={handleSendImage}
            type='file'
            id="image"
            accept='image/*'
            hidden
          />
          <label htmlFor="image">
            <img src={galary} alt='Upload image' className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>

        {/* Send Button */}
        {input && (
          <img 
            onClick={handleSendMessage} 
            src={sendbtn} 
            alt='Send' 
            className='w-5 cursor-pointer' 
          />
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
