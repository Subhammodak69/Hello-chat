import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import avatar_icon from '../assets/avatar.avif';
import logoImg from '../assets/message.png';


const ProfilePage = () => {
  const [selectedImg, setSelectedImg] = useState(null)
  const navigate = useNavigate();
  const [name, setName] = useState("Martin Jone")
  const [bio, setBio] = useState("Hi everyon i using Hello chat")

  const handleSubmit = async (e)=>{
    e.preventDefault();
    navigate('/')
  }
  return (
    <div className='min-h-screen w-[100%] bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col max-sm: rounded-lg'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg'>Profile Details</h3>
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input onChange={(e)=>setSelectedImg(e.target.files[0])} type='file' id='avatar' accept='*' hidden/>
            <img src={selectedImg ? URL.createObjectURL(selectedImg): avatar_icon} alt='' className={`w-12 h-12 rounded-full ${selectedImg && 'rounded-full'}`}/>
            upload profile image
          </label>
          <input onChange={(e)=> setName(e.target.value)} value={name}
           type='text' placeholder='Your name' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500'/>
          <textarea onChange={(e)=> setBio(e.target.value)} value={bio}
          className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' rows={4} placeholder='Write Profile Bio... ' required></textarea>
          <button type='submit' className='bg-gradient-to-r p-2 from-purple-400 to-violet-600 text-white rounded-full cursor-pointer'>Save</button>
        </form>
        <div className='hidden sm:flex flex-col contents-center justify-center'>
          <img src={logoImg} alt='' className='max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10'/>
          <h1 className='m-auto text-lg text-black font-bold'>Hello Chats</h1>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage