import React from 'react'
import { useRef,useEffect,useState } from 'react'
import {createUserWithEmailAndPassword} from 'firebase/auth'
import { doc, setDoc } from "firebase/firestore"; 
import{db,auth} from '../firebase'
import {useDispatch} from 'react-redux'
import {login} from '../redux/userRedux'
import Link from 'next/link'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";



const Register = () => {
    const[file,setFile] = useState()
    const[progress,setProgress] = useState(-1)
    const refa=useRef(null);
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
      const createUser= await createUserWithEmailAndPassword(auth, email, password)
      const id = createUser.user.uid;
      await setDoc(doc(db, "users", id), {
        fullName:credentials.fullName,
        username:credentials.username,
        email:credentials.email,
        password:credentials.password,
        img:credentials.img,
        deletedChats:[]
      });
      dispatch(login(createUser.user))
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
      if(refa.current){
        observer.observe(refa.current)
      }
    },[refa.current])

    console.log(visible)

    const handleImg=(e)=>{
     const targetFile = e.target.files[0]
     const url = URL.createObjectURL(targetFile)
     setFile(url)
      
      const storage = getStorage();
      const name = new Date().getTime()+targetFile.name;
      const storageRef = ref(storage, name);
      
      const uploadTask = uploadBytesResumable(storageRef, targetFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progressa = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
           setProgress(progressa)
           console.log(progress)
        }, 
        (error) => {
          console.log(error)
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setCredentials({...credentials,img:downloadURL})
            console.log(downloadURL,credentials)
          });
        }
      );
      


    }

  return (
    <div ref={refa} style={{backgroundColor:"#001220",backgroundImage:"url(/images/perman1.png)",backgroundRepeat:"no-repeat",backgroundPosition:"center",backgroundSize:"cover",transform:visible?"translateY(0vh)":"translateY(-100vh)",transition:"transform 1.4s ease",width:'100%',minHeight:"100vh",maxHeight:"100%"}} className='flex flex-col items-center py-10 px-4 text-white space-y-5'>
      <h1 className=' text-5xl font-bold w-full text-center'>Register To Continue!</h1>
      <p className='text-lg font-light'>Please Fill In The Details To Register!</p>
      <form className=' flex flex-col items-center space-y-5' onSubmit={handleSubmit}>
        <div className='flex  items-center flex-col space-y-3 md:flex-row md:space-x-6 md:space-y-0'>
        <div className=' flex flex-col space-y-1'>
          <label>Full Name</label>
          <input required name='fullName' onChange={handleChange} className=' focus:outline-none text-black' type="text" placeholder="John Doe"></input>
        </div>
        <div className=' flex flex-col items-start space-y-1'>
          <label>Username</label>
          <input required name='username' onChange={handleChange}  className=' focus:outline-none text-black' type="text" placeholder="john._.doe42"></input>
        </div>
        </div>
        <div className='flex items-center flex-col space-y-3 md:flex-row md:space-x-6 md:space-y-0'>
        <div className=' flex flex-col items-start space-y-1'>
          <label>Email</label>
          <input required name='email' onChange={handleChange} className=' focus:outline-none text-black' type="email" placeholder="johndoe@mail.com"></input>
        </div>
        <div className=' flex flex-col items-start space-y-1'>
          <label>Password</label>
          <input required name='password' onChange={handleChange} className=' focus:outline-none text-black' type="password"></input>
        </div>
        </div>
        <div className=' flex items-center flex-col space-y-3 md:flex-row md:space-x-6 md:space-y-0'>
          <div className=' flex flex-col items-center space-y-1'>
          {file&&<img className=' w-16 h-16 rounded-full border-2 border-green-600' src={file} alt="img"></img>}
          {progress>=0&&progress<100&&<div className=' text-lg text-center text-white'>{progress.toString().split('.')[0]}%</div>}
          </div>
          <input required className='w-full m-auto' onChange={handleImg} type="file"></input>
        </div>
        <div className=' py-2'>Already Have An Account? <Link href="/login"><span className=' hover:underline cursor-pointer'>Login</span></Link></div>
        {error&&<div className=' font-bold text-red-600 py-2 text-center'>Something Bad Ocurred!</div>}
        <input type="submit" disabled={progress>=0&&progress<100} className=' py-2 px-4 rounded-md btn bg-white text-black hover:text-white hover:bg-green-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-black' value="Submit">
        </input>
      </form>
    </div>
  )
}

export default Register