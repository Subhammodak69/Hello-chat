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


const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, selectedUserData, setSelectedUserData, fetchUserData } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState('');
  const scrollEnd = useRef();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === " ") return null;
    await sendMessage({ text: input.trim() });
    setInput("");
  }

  //Handle sending  a image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {

      toast.error("select a image file...")
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result })
      e.target.value = " "
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (selectedUser) {
      console.log("sdhgdvhdgsvgvheloooooo");
      fetchUserData(selectedUser);
    } else {
      setSelectedUserData(null); // clear when no user selected
    }
  }, [selectedUser]);


  if (!selectedUser) {
    return (
      <div className='flex flex-col bg-[#c8d8ff]/5 items-center justify-center gap-2 text-grey-500 max-md:hidden'>
        <img src={logoImg} alt="" className='max-w-16' />
        <p className='text-lg font-medium text-white'>Chat anytime anywhere</p>
      </div>
    );
  }
  return (
    <div className='h-full overflow-scroll relative backdrop-blur-lg '>
      {/* Header */}
      <div className='flex items-center justify-between gap-3 py-3 mx-4 border-b border-stone-500'>
        <div className='flex items-center gap-2'>
          <img src={selectedUserData?.profilePic || avatar} alt='User Avatar' className='w-10 h-10 rounded-full object-cover' />
          <h1 className='m-auto text-lg text-black font-bold'>{selectedUserData?.fullName || "Loading..."}</h1>
          {selectedUserData && onlineUsers.includes(selectedUserData._id) && (
            <span className='w-2 h-2 rounded-full bg-green-700'></span>
          )}
        </div>
        <div>
          <img onClick={() => setSelectedUser(null)} src={arrow_icon} alt='' className='md:hidden max-w-7' />
          <img src={help} alt="" className='max-md:hidden max-w-5' />
        </div>
      </div>

      {/* Chat Area */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((msg, index) =>
          msg.senderId === authUser._id ? (
            // Sender: right-aligned, green bubble
            <div
              key={index}
              className="flex justify-end items-end mb-2"
            >
              <div className="flex flex-col items-end">
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt=""
                    className="max-w-[150px] border border-gray-700 rounded-lg overflow-hidden mb-2"
                  />
                ) : (
                  <p className="p-2 max-w-[300px] md:text-sm font-light rounded-lg mb-2 break-all bg-violet-500/30 text-white rounded-br-none">
                    {msg.message}
                  </p>
                )}
                <span className="text-xs text-white-500">{formatMessageTime(msg.timestamp)}</span>
              </div>
            </div>
          ) : (
            // Receiver: left-aligned, avatar and name above message
            <div
              key={index}
              className="flex justify-start items-start mb-2"
            >
              <img
                src={msg.sender_pic}
                alt=""
                className="w-[32px] h-[32px] rounded-full mr-2"
              />
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold text-blue-400 mb-1">{msg.sender_name}</span>
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt=""
                    className="max-w-[150px] border border-gray-700 rounded-lg overflow-hidden mb-2"
                  />
                ) : (
                  <p className="p-2 max-w-[300px] md:text-sm font-light rounded-lg mb-2 break-all bg-stone-800 text-white rounded-bl-none">
                    {msg.message}
                  </p>
                )}
                <span className="text-xs text-white-500">{formatMessageTime(msg.timestamp)}</span>
              </div>
            </div>
          )
        )}
        <div ref={scrollEnd} ></div>
      </div>
      {/*------------bottom area start------- */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input onChange={(e) => setInput(e.target.value)} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null}
            type='text' placeholder='Send a message' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-800' />
          <input onChange={handleSendImage}
            type='file' id="image" accept='*' hidden />
          <label htmlFor="image">
            <img src={galary} alt='' className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        {input ? (<img onClick={handleSendMessage} src={sendbtn} alt='' className='w-5 cursor-pointer' />) : ''}
      </div>
      {/*------------bottom area end------- */}
    </div>
  );
};


export default ChatContainer