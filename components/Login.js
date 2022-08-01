import React from 'react'
import { useRef,useEffect,useState } from 'react'
import {signInWithEmailAndPassword} from 'firebase/auth'
import {auth} from '../firebase'
import {useDispatch} from 'react-redux'
import {login} from '../redux/userRedux'
import Link from 'next/link'


const Login = () => {
    const ref=useRef(null);
    const [visible,setVisible] = useState(false);
    const dispatch = useDispatch()
    const [error,setError] = useState(false)
    const [credentials,setCredentials] = useState({})

    const handleChange=(e)=>{
     setCredentials({...credentials,[e.target.name]:e.target.value})
    }

  const handleSubmit=async(e)=>{
    e.preventDefault()
    try{
      const email = credentials.email;
      const password = credentials.password;
      const saveUser= await signInWithEmailAndPassword(auth, email, password)
      dispatch(login(saveUser.user))
    }
    catch(err){
      console.log(err)
      setError(true)
    }

  }

    useEffect(()=>{
      const observer= new IntersectionObserver((items)=>{
         items.forEach((file)=>{
           if(file.isIntersecting){
             setVisible(true)
           }
         })
      })
      if(ref.current){
        observer.observe(ref.current)
      }
    },[ref.current])

    console.log(visible)

  return (
    <div ref={ref} style={{backgroundColor:"#001220",backgroundImage:"url(/images/perman1.png)",backgroundRepeat:"no-repeat",backgroundPosition:"center",backgroundSize:"cover",transform:visible?"translateY(0vh)":"translateY(-100vh)",transition:"transform 1.4s ease",width:'100%',minHeight:"100vh",maxHeight:"100%"}} className='flex flex-col items-center py-10 px-4 text-white space-y-10'>
      <h1 className=' text-5xl font-bold w-full text-center'>Login To Continue!</h1>
      <p className='text-lg font-light'>Please Fill In The Details To Login!</p>
      <form className=' flex flex-col items-center space-y-5' onSubmit={handleSubmit}>
        <div className=' flex flex-col items-start space-y-1'>
          <label>Email</label>
          <input required name='email' onChange={handleChange} className=' focus:outline-none text-black' type="email" placeholder="johndoe@mail.com"></input>
        </div>
        <div className=' flex flex-col items-start space-y-1'>
          <label>Password</label>
          <input required name='password' onChange={handleChange} className=' focus:outline-none text-black' type="password"></input>
        </div>
        <div className=' py-2'>Don't Have An Account?<Link href="/register"><span className=' hover:underline cursor-pointer'> Register</span></Link></div>
        {error&&<div className=' font-bold text-red-600 py-2 text-center'>Something Bad Ocurred!</div>}
        <input type="submit" className=' py-2 px-4 rounded-md btn bg-white text-black hover:text-white hover:bg-green-600 transition-colors cursor-pointer' value="Submit">
        </input>
      </form>
    </div>
  )
}

export default Login