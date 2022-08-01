import React from 'react'
import {useDispatch} from 'react-redux'
import {logout} from '../redux/userRedux'



const Header = (props) => {
  const dispatch = useDispatch()
  return (
    <nav className=' flex justify-between items-center py-1 md:py-2 px-2 md:px-5 bg-green-500 text-white'>
      <div className=' text-2xl flex flex-col items-center'><span>BUBBLE </span><span>CHAT</span></div>
      <h1 className=' text-4xl font-bold hidden md:flex'>WELCOME, {props?.fullName?.toUpperCase()}</h1>
      <div className=' flex space-x-6 items-center'>
       <img className=' w-12 h-12 rounded-full border-2 border-white' src={props.img || '/images/profilpic.png'} alt="logo"></img>
      <i onClick={()=>dispatch(logout())} className="fa-solid fa-arrow-right-from-bracket text-3xl cursor-pointer"></i>
      </div>
    </nav>
  )
}

export default Header