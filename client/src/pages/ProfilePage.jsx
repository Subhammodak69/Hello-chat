import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import avatar_icon from '../assets/avatar.avif';
import logoImg from '../assets/message.png';
import plusIcon from '../assets/plus.png';
import arrow_icon from '../assets/left-arrow.png';
import { AuthContext } from '../context/AuthContext';
import LoaderSpinner from '../components/LoaderSpinner'



const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext)
  const [loading, setLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null)
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName)
  const [bio, setBio] = useState(authUser.bio)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedImg) {
        await updateProfile({ fullName: name, bio });
        navigate('/');
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImg);
        reader.onload = async () => {
          const base64Image = reader.result;
          await updateProfile({ profilePic: base64Image, fullName: name, bio });
          setLoading(false);
          navigate('/');
        }
        return; // to avoid setLoading(false) below before onload runs
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className='min-h-screen w-[100%] bg-cover bg-no-repeat flex items-center justify-center'>
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col max-sm: rounded-lg'>
        {loading && <LoaderSpinner />}

        <form onSubmit={handleSubmit} className='flex flex-col w-[-webkit-fill-available] gap-5 p-10 flex-1'>
          <h1 className='m-auto text-lg text-black font-bold text-[25px] flex gap-2 items-center'>
            <img src={arrow_icon} onClick={() => navigate('/')} alt='' className='max-w-5 max-h-5 cursor-pointer absolute left-[4%]' />
            Profile Details
          </h1>
          <label htmlFor="avatar" className='flex justify-center items-center cursor-pointer'>
            <input onChange={(e) => setSelectedImg(e.target.files[0])} type='file' id='avatar' accept='*' hidden />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : authUser.profilePic
                    ? authUser.profilePic
                    : avatar_icon
              }
              alt=''
              className="w-[120px] h-[120px] rounded-full"
            />

            <img src={plusIcon} className='max-w-[40px] mt-[70px]' />
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name}
            type='text' placeholder='Your name' required className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio}
            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' rows={4} placeholder='Write Profile Bio... ' required></textarea>
          <button type='submit' className='bg-gradient-to-r p-2 from-purple-400 to-violet-600 text-white rounded-full cursor-pointer'>Save</button>
        </form>
        <div className='hidden sm:flex flex-col contents-center justify-center'>
          <img src={logoImg} alt='' className='max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10' />
          <p className='text-lg font-medium text-white'>Chat anytime anywhere</p>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage