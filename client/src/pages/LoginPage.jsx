import React, { useState } from 'react'
import logoImg from '../assets/message.png';
import arrow_icon from '../assets/left-arrow.png';


const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const onSubmitHandler = (event)=>{
    event.preventDefault();

    if(currState === 'Sign up' && !isDataSubmitted){
      setIsDataSubmitted(true)
      return
    }
  }
  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
      {/* ----------left side---------- */}
      <img src={logoImg} alt='' className='w-[min(30vw,250px)]'/>

      {/* ----------right side---------- */}
      <form onSubmit={onSubmitHandler} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'>
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currState}
          {isDataSubmitted && <img onClick={()=>setIsDataSubmitted(false)} src={arrow_icon} alt='' className='w-5 cursor-pointer'/>}
           
        </h2>
        {currState === "Sign up"  && !isDataSubmitted &&(
          <input onChange={(e) => setFullName(e.target.value)} value={fullName}
           type='text' placeholder='Full Name' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'  required/>
         )}
        
        {!isDataSubmitted &&(
          <>
          <input onChange={(e) => setEmail(e.target.value)} value={email}
           type='email' placeholder='Email Address' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' required/>
          <input onChange={(e) => setPassword(e.target.value)} value={password}
           type='password' placeholder='Password' className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' required/>
          </>
        )}
        {currState === "Sign up" && isDataSubmitted &&(
          <textarea onChange={(e) => setBio(e.target.value)} value={bio}
           rows={4} className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500' placeholder='Provide a short bio.....'></textarea> 
          )
        }
        <button type='submit' className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
          {currState === "Sign up" ? "Create Account" : "Login Now"}
        </button>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <input type='checkbox' />
          <p>
            Agree to the terms of use & privacy policy.
          </p>
        </div>
        <div className='flex flex-col gap-2'>
          {currState === "Sign up" ? (
              <p className='text-sm text-gray-600'>Already Have an Account?<span onClick={()=>{setCurrState("Login"); setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer'>Login here</span></p>
          ):(
            <p className='text-sm text-gray-600'> Create an Account<span onClick={()=>{setCurrState("Sign up"); setIsDataSubmitted(false)}} className='font-medium text-violet-500 cursor-pointer'>Click Here</span></p>
          )}
        </div>
      </form>
    </div>
  )
}

export default LoginPage