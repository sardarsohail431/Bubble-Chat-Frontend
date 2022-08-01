
import React from 'react'
import { useSelector } from 'react-redux'
import InputEmoji from "react-input-emoji";
import { useState } from 'react';
import { getStorage,uploadBytesResumable,getDownloadURL } from 'firebase/storage';
import { ref } from 'firebase/storage';
import { doc, setDoc,query,collection,where,serverTimestamp,getDocs,updateDoc,deleteDoc } from "firebase/firestore"; 
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import {useEffect} from 'react'
import { onSnapshot } from "firebase/firestore";
import {useRef} from 'react'
import { useDispatch } from 'react-redux';
import { changeUpdate } from '../redux/convRedux';
import { useStopwatch } from 'react-timer-hook';
import {format} from 'timeago.js'
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import {
  Player,
  ControlBar,
  ReplayControl,
  ForwardControl,
  CurrentTimeDisplay,
  TimeDivider,
  PlaybackRateMenuButton,
  VolumeMenuButton
} from 'video-react';
import 'video-react/dist/video-react.css';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { changeConv,changeUser } from '../redux/convRedux';
import { changeOnline,changeUnanswered,changeVideoModal,changeVoiceModal,changeConnectedUser,changeCallAnswerModal,changeVoiceCallAnswerModal} from '../redux/callRedux';



const Main = (props) => {

  const {userData,socket,updateVal,reference,callType,callTimeout,peera,setLocalStream,flex} = props;

  const User = useSelector(state=>state.user.currUser)
  const currConvo = useSelector(state=>state.conv.currConv)
  const currUser = useSelector(state=>state.conv.userNow)
  const update = useSelector(state=>state.conv.updateConv)
  const online = useSelector(state=>state.call.online)


  const[message,setMessage] = useState();
  const[messages,setMessages] = useState([])
  const[filteredMessages,setFilteredMessages] = useState()
  const[collectedChunks,setCollectedChunks] = useState([])
  const[imageProgress,setImageProgress] = useState()
  const[videoProgress,setVideoProgress] = useState()
  const[audioProgress,setAudioProgress] = useState()
  const[documentProgress,setDocumentProgress] = useState()
  const[voicerecordingModal,setVoiceRecordingModal] = useState(false)
  const[voiceRecordingPaused,setVoiceRecordingPaused] = useState(false)
  const[sending,setSending] = useState(false)

  const dialogRef = useRef()
  const attachmentRef = useRef()
  const imageInput = useRef()
  const videoInput = useRef()
  const audioInput = useRef()
  const documentInput = useRef()
  const refa = useRef()
  const mediaStreamRef = useRef()
  const recordVoiceRef = useRef()
  const deleteRecRef=useRef(false)

  const dispatch = useDispatch()

  const {
    seconds,
    minutes,
    hours,
    start,
    pause,
    reset,
  } = useStopwatch({ autoStart: false });


useEffect(()=>{
    setTimeout(async()=>{
      if(!currConvo?.id) return;
      if(!userData) return;
      const receiverQuery = query(collection(db, "messages"), where("sender", "!=", userData.id), where("convId", "==", currUser.convId));

      const receiverQuerySnapshot = await getDocs(receiverQuery);
      receiverQuerySnapshot.forEach((doca) => {
        const seen = doca.get('seen');
        if(!seen){
          const getData=async()=>{
            const frankDocRef = doc(db, "messages", doca.id);
            await updateDoc(frankDocRef, {
              seen:true
          });
          socket.emit("messageCame",currUser.id)
          dispatch(changeUpdate(!update))
          updateVal.current = !update;
          }
          getData()
        }
      });
    },1000)
},[currConvo?.id,userData,filteredMessages])

  const handleOnEnter=async()=>{
    const id = uuidv4()
    await setDoc(doc(db, "messages", id), {
      convId:currConvo.id,
      message:message,
      sender:userData.id,
      type:'message',
      seen:false,
      timestamp:serverTimestamp()
    });
    dispatch(changeUpdate(!update))
    updateVal.current = !update;
    socket.emit('messageCame',currUser.id)
    setTimeout(()=>{
    socket.emit('messageCame',currUser.id)
    },1000)
  }


 useEffect(()=>{
    if(!socket) return;
    if(!currConvo?.id) return;
    if(!currUser?.id) return;
      socket.emit('checkOnline',{receiverId:currUser.id,senderId:User?.uid})
  },[socket,currConvo?.id,filteredMessages,currUser?.id])


 useEffect(()=>{
   if(!currUser?.convId) return;
    const q = query(collection(db, "messages"), where("convId", "==", currUser.convId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
          messages.push({
            convId:doc.get('convId'),
            message:doc.get('message'),
            sender:doc.get('sender'),
            fileName:doc.get('fileName'),
            seen:doc.get('seen'),
            type:doc.get('type'),
            id:doc.id,
            timestamp:doc.get('timestamp')
          })
      });
      const ids = messages.map((o)=>o.id)
      const filtered = messages.filter(({id}, index) => !ids.includes(id, index + 1))
      const moreFilter = filtered.filter((item)=>item.convId===currUser.convId)
      const evenMoreFilter = moreFilter.sort(function(a, b){return a.timestamp - b.timestamp});
      setFilteredMessages(evenMoreFilter)
      refa.current.scrollTop= refa.current.scrollHeight;
      

    });
    return(()=>{
      currConvo&&unsubscribe()
    })
  },[currUser?.convId,socket])

  const getOnlineStatus=()=>{
    if(!socket) return;
    if(!currConvo?.id) return;
    if(!currUser?.id) return;
      socket.emit('checkOnline',{receiverId:currUser.id,senderId:User.uid})
  }


setInterval(()=>{
   getOnlineStatus()
},60000)

  useEffect(()=>{
    if(!socket) return;
     socket.on('onlineStatus',(onlineUser)=>{
       dispatch(changeOnline(onlineUser.online))
     })
  },[socket])


  const handleVideoStart=async()=>{
    const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true})
    setLocalStream(stream)
    dispatch(changeVideoModal(true))

    socket.emit('callIncoming',{
      caller:userData.id,
      callerName:userData.fullName,
      callerImg:userData.img,
      CallerpeerId:peera.id,
      callee:currUser.id,
      callType:"Video"
    })
    dispatch(changeConnectedUser({
      id:currUser.id,
      name:currUser.name,
      img:currUser.img,
      type:"Video"
    }))
    callType.current="Video"
    reference.current = true;
    let timesss = setTimeout(()=>{
      dispatch(changeUnanswered(true))
      setTimeout(()=>{
        dispatch(changeVideoModal(false))
        dispatch(changeUnanswered(false))
      },3000)
      reference.current = false;
      socket.emit('clientCancelled',currUser.id)
      dispatch(changeConnectedUser(null))
      callType.current = null;
    },15000)
    callTimeout.current = timesss;
  }

  const handleVoiceStart=async()=>{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true})
    setLocalStream(stream)
    dispatch(changeVoiceModal(true))
    socket.emit('callIncoming',{
      caller:userData.id,
      callerName:userData.fullName,
      callerImg:userData.img,
      CallerpeerId:peera.id,
      callee:currUser.id,
      callType:"Voice"
    })
    dispatch(changeConnectedUser({
      id:currUser.id,
      name:currUser.name,
      img:currUser.img,
      type:"Voice"
    }))
    callType.current = "Voice"
    reference.current = true;

    let timesss = setTimeout(()=>{
      socket.emit('clientCancelled',currUser.id)
      dispatch(changeUnanswered(true))
       setTimeout(()=>{
        dispatch(changeVoiceModal(false))
        dispatch(changeUnanswered(false))
      },3000)
      reference.current = false;
      dispatch(changeConnectedUser(null))
      callType.current = null;
    },15000)
    callTimeout.current = timesss;
  }

  const convDelete=()=>{
    dialogRef.current?dialogRef.current.showModal():''
  }

  const closeConvModal=()=>{
    dialogRef.current?dialogRef.current.close():''
  }

  const deleteConvo=async()=>{
    try{
      const washingtonRef = doc(db, "users", userData?.id);
      await updateDoc(washingtonRef, {
        deletedChats:[...userData?.deletedChats,currUser.id]
        });
        dispatch(changeUpdate(!updateVal.current))
        updateVal.current = !updateVal.current;
        dispatch(changeConv(null))
        dispatch(changeUser(null))
        toast.success("Chat Deleted Successfully!")
    }

    catch(err){
       toast.error("Error Deleting Chat!")
    }
  }

  const AttachmentModalTrue=()=>{
     attachmentRef.current&&attachmentRef.current.showModal();
  }

  const handleImageClick=()=>{
    imageInput.current&&imageInput.current.click()
  }

  const handleVideoClick=()=>{
    videoInput.current&&videoInput.current.click()
  }

  const handleAudioClick=()=>{
    audioInput.current&&audioInput.current.click()
  }

  const handleDocumentClick=()=>{
    documentInput.current&&documentInput.current.click()
  }

  const handleImageMessage=(e)=>{
    try{
    const file = e.target.files[0]
     if((file.size/1024)/1024>50){
      toast.error("File Size Must Be Below Than 50 MBs")
     }
     if((file.size/1024)/1024>50) return;
    const format = file.name.slice(file.name.length-3)
    if(format!=="jpeg"&&format!=="png"&&format!=="apng"&&format!=="gif"&&format!=="svg"&&format!=="bmp"&&format!=="webp"&&format!=="ico"&&format!=="jpg"){
      toast.error("Choose Correct File Type!")
    }
    if(format!=="jpeg"&&format!=="png"&&format!=="apng"&&format!=="gif"&&format!=="svg"&&format!=="bmp"&&format!=="webp"&&format!=="ico"&&format!=="jpg") return;

      const storage = getStorage();
      const name = new Date().getTime()+file.name;
      const storageRef = ref(storage, name);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progressa = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setImageProgress(progressa)
        }, 
        (error) => {
          console.log(error)
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            const sendImg=async()=>{
              const randID = uuidv4()
              await setDoc(doc(db, "messages", randID), {
                convId:currUser.convId,
                type:"image",
                message:downloadURL,
                seen:false,
                sender:userData?.id,
                timestamp:serverTimestamp()
              });
              toast.success("Image Sent Successfully!")
              attachmentRef.current.close()
              setImageProgress(0)
              dispatch(changeUpdate(!update))
              updateVal.current = !update;
              socket.emit('messageCame',currUser.id)
              setTimeout(()=>{
              socket.emit('messageCame',currUser.id)
              },1000)
            }
            sendImg()
          });
        }
      );
    }
    catch(err){
      toast.error("Something Bad Occurred!")
    }
  }

  const handleVideoMessage=(e)=>{
    try{
    const file = e.target.files[0]
    const format = file.name.slice(file.name.length-3)
    if((file.size/1024)/1024>70){
     toast.error("File Size Must Be Below Than 70 MBs")
    }
    if((file.size/1024)/1024>70) return;
    if(format!=="webm"&&format!=="mp4"&&format!=="ogg"&&format!=="mov"){
      toast.error("Choose Correct File Type!")
    }
    if(format!=="wemb"&&format!=="mp4"&&format!=="ogg"&&format!=="mov") return;

      const storage = getStorage();
      const name = new Date().getTime()+file.name;
      const storageRef = ref(storage, name);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progressa = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setVideoProgress(progressa)
        }, 
        (error) => {
          console.log(error)
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            const sendVideo=async()=>{
              const randID = uuidv4()
              await setDoc(doc(db, "messages", randID), {
                convId:currUser.convId,
                type:"video",
                message:downloadURL,
                seen:false,
                sender:userData?.id,
                timestamp:serverTimestamp()
              });
              toast.success("Video Sent Successfully!")
              attachmentRef.current.close()
              setVideoProgress(0)
              dispatch(changeUpdate(!update))
              updateVal.current = !update;
              socket.emit('messageCame',currUser.id)
              setTimeout(()=>{
              socket.emit('messageCame',currUser.id)
              },1000)
            }
            sendVideo()
          });
        }
      );
    }
    catch(err){
      toast.error("Something Bad Occurred!")
    }
  }

  const handleAudioMessage=(e)=>{
    try{
    const file = e.target.files[0]
    const format = file.name.slice(file.name.length-3)
    if((file.size/1024)/1024>70){
     toast.error("File Size Must Be Below Than 70 MBs")
    }
    if((file.size/1024)/1024>70) return;
    if(format!=="mp3" && format!=="wav" && format!=="ogg"){
      toast.error("Choose Correct File Type!")
    }
    if(format!=="mp3" && format!=="wav" && format!=="ogg") return;

      const storage = getStorage();
      const name = new Date().getTime()+file.name;
      const storageRef = ref(storage, name);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progressa = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setAudioProgress(progressa)
        }, 
        (error) => {
          console.log(error)
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            const sendAudio=async()=>{
              const randID = uuidv4()
              await setDoc(doc(db, "messages", randID), {
                convId:currUser.convId,
                type:"audio",
                message:downloadURL,
                seen:false,
                sender:userData?.id,
                timestamp:serverTimestamp()
              });
              toast.success("Audio Sent Successfully!")
              attachmentRef.current.close()
              setAudioProgress(0)
              dispatch(changeUpdate(!update))
              updateVal.current = !update;
              socket.emit('messageCame',currUser.id)
              setTimeout(()=>{
              socket.emit('messageCame',currUser.id)
              },1000)
            }
            sendAudio()
          });
        }
      );
    }
    catch(err){
      toast.error("Something Bad Occurred!")
    }
  }
  
  const handleDocument=(e)=>{
    try{
    const file = e.target.files[0]
    if((file.size/1024)/1024>120){
     toast.error("File Size Must Be Below Than 120 MBs")
    }
    if((file.size/1024)/1024>120) return;

      const storage = getStorage();
      const name = new Date().getTime()+file.name;
      const storageRef = ref(storage, name);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progressa = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setDocumentProgress(progressa)
        }, 
        (error) => {
          console.log(error)
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            const sendDocument=async()=>{
              const randID = uuidv4()
              await setDoc(doc(db, "messages", randID), {
                convId:currUser.convId,
                type:"document",
                fileName:file.name,
                message:downloadURL,
                seen:false,
                sender:userData?.id,
                timestamp:serverTimestamp()
              });
              toast.success("Document Sent Successfully!")
              attachmentRef.current.close()
              setDocumentProgress(0)
              dispatch(changeUpdate(!update))
              updateVal.current = !update;
              socket.emit('messageCame',currUser.id)
              setTimeout(()=>{
              socket.emit('messageCame',currUser.id)
              },1000)
            }
            sendDocument()
          });
        }
      );
    }
    catch(err){
      toast.error("Something Bad Occurred!")
    }
  }

  const downloadFile=(link)=>{
     const a = document.createElement('a')
     a.href=link;
     a.setAttribute("target",'_blank')
     a.click()
     a.remove()
  }

  const voiceRecStart=async()=>{
     mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({audio:true})
     deleteRecRef.current = false;
     recordVoiceRef.current= new MediaRecorder(mediaStreamRef.current)
     recordVoiceRef.current.ondataavailable = handleDat;
     recordVoiceRef.current.start()
     start()
     setVoiceRecordingModal(true)
     
  }


const handleDat=(e)=>{
  collectedChunks.splice(0,collectedChunks.length)
 if(e.data.size>0){
 collectedChunks.push(e.data)
 
 sendData1()
 }
}

const sendData1=()=>{
  if(deleteRecRef.current){
    collectedChunks.splice(0,collectedChunks.length)
    mediaStreamRef.current.getTracks().forEach((track)=>{
     track.stop()
    })
    mediaStreamRef.current = null;
    recordVoiceRef.current = null;
  }
  if(deleteRecRef.current) return;
   const blob = new Blob(collectedChunks, {
     type: "audio/mpeg-3"
   });
   const storage = getStorage();
      const name = new Date().getTime()+Math.floor(Math.random()*1000).toString()+'.mp3';
      const storageRef = ref(storage, name);
      
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progressa = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        }, 
        (error) => {
          console.log(error)
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            const sendAudio=async()=>{
              const randID = uuidv4()
              await setDoc(doc(db, "messages", randID), {
                convId:currUser.convId,
                type:"audio",
                message:downloadURL,
                seen:false,
                sender:userData?.id,
                timestamp:serverTimestamp()
              });
              toast.success("Audio Sent Successfully!")
              setVoiceRecordingModal(false)
              setSending(false)
              mediaStreamRef.current.getTracks().forEach((track)=>{
                track.stop()
              })
              mediaStreamRef.current = null;
              recordVoiceRef.current = null;
              dispatch(changeUpdate(!update))
              updateVal.current = !update;
              socket.emit('messageCame',currUser.id)
              setTimeout(()=>{
              socket.emit('messageCame',currUser.id)
              },1000)
            }
            sendAudio()
          });
        }
      );

 }

 const pauseRec=()=>{
   recordVoiceRef.current.pause()
   pause()
   setVoiceRecordingPaused(true)
 }

 const resumeRec=()=>{
   recordVoiceRef.current.resume()
   start()
   setVoiceRecordingPaused(false)
 }

 const stopRec=()=>{
   recordVoiceRef.current.stop()
   setSending(true)
   pause()
   reset()
 }

 const deleteRec=()=>{
   deleteRecRef.current = true;
  recordVoiceRef.current.stop()
  pause()
  reset()
  setVoiceRecordingModal(false)
 }

 const handleReverse=()=>{
   dispatch(changeConv(null))
   dispatch(changeUser(null))
 }


  return (
    <div style={{minHeight:'86vh',flex:flex,maxHeight:'100%',minWidth:"77vw"}} className=' relative'>
            <Toaster position='bottom-center'/>
    {currConvo&&<div style={{flex:1.4,height:'86vh'}} className="shadow-lg py-1 px-1 md:py-0 md:px-2 flex flex-col items-start w-full">
       <div style={{flex:0.2}} className=' flex items-center justify-between px-2 py-1 text-white bg-green-600 w-full max-h-14 rounded-md'>
         <div className=' space-x-3 flex items-center'>
         <img className=' w-12 h-12 rounded-full' src={currUser?.img || '/images/profilpic.png'} alt="img"></img>
         {online?
         <div className=' flex flex-col items-center space-y-1'>
         <span className=' text-xl'>{currUser?.name || 'User'}</span>
         <div className=' flex items-center justify-start space-x-1'>
          <span className=' w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-500 animate-pulse'></span>
          <span className=' text-xl'>Online</span>
         </div>
         </div>:
            <span className=' text-2xl'>{currUser?.name || 'User'}</span>}
         </div>
         <div className=' flex items-center space-x-6'>
         <button disabled={voicerecordingModal} className="cursor-pointer w-full flex disabled:cursor-not-allowed disabled:pointer-events-none" onClick={handleVoiceStart} title='Start Voice Call'><i className="fa-solid fa-phone text-xl"></i></button>
         <button disabled={voicerecordingModal} className="cursor-pointer w-full flex disabled:cursor-not-allowed disabled:pointer-events-none" onClick={handleVideoStart} title='Start Video Call'><i className="fa-solid fa-video text-xl "></i></button>
         <button disabled={voicerecordingModal} className="cursor-pointer w-full flex disabled:cursor-not-allowed disabled:pointer-events-none" onClick={convDelete} title='Delete Chat'><i className="fa-solid fa-trash-can text-xl"></i></button>
         </div>
       </div>
       <div style={{flex:2.4,maxHeight:'67vh'}} className=' w-full py-1'>
       <dialog className='flex-col space-y-2 rounded-md border-2 hidden open:flex' ref={dialogRef}>
         <span className=' text-3xl font-semibold'>Are You Sure You Want To Delete This Conversation?</span>
         <div className=' flex items-center justify-center space-x-3'>
         <button onClick={closeConvModal} className=' bg-blue-400 px-2 py-1 rounded-lg text-xl cursor-pointer text-white hover:bg-blue-600'>Cancel</button>
         <button onClick={deleteConvo} className=' bg-green-500 px-2 py-1 rounded-lg text-xl cursor-pointer text-white hover:bg-green-700'>Delete</button>
         </div>
        </dialog>
      <dialog ref={attachmentRef} className="hidden self-center space-y-4 justify-center open:flex flex-col items-center rounded-lg relative px-7 py-5">
      <button disabled={imageProgress>0||videoProgress>0||audioProgress>0||documentProgress>0} onClick={()=>{attachmentRef.current&&attachmentRef.current.close()}} style={{top:"0",right:"0%"}} className=' px-3 py-1 rounded-full text-white bg-black cursor-pointer absolute disabled:pointer-events-none disabled:cursor-not-allowed'>X</button>
        <h1 className=' text-3xl font-semibold self-start'>Select File To Send</h1>
       <div style={{padding:"0 2vw"}} className=' flex w-full justify-between'>
         <div className=' flex flex-col items-center space-y-1'>
         <button onClick={handleImageClick} disabled={imageProgress>0||videoProgress>0||audioProgress>0||documentProgress>0} className=' cursor-pointer bg-purple-500 px-5 py-4 rounded-full hover:bg-purple-700 disabled:cursor-not-allowed disabled:pointer-events-none'><i className="fa-solid fa-image text-white"></i></button>
         <input onChange={handleImageMessage} ref={imageInput} hidden type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.apng,.ico"></input>
         <span className=' text-lg'>Image</span>
         {imageProgress>0&&imageProgress<100&&
          <span className=' text-lg'>{imageProgress.toString().slice(0,2)}%</span>
         }
         {imageProgress===100&&
          <span className=' text-lg'>Wait!</span>
         }
         </div>
         <div className=' flex flex-col items-center space-y-1'>
         <button className='cursor-pointer bg-green-500 px-5 py-4 rounded-full hover:bg-green-700 disabled:cursor-not-allowed disabled:pointer-events-none' onClick={handleVideoClick} disabled={imageProgress>0||videoProgress>0||audioProgress>0||documentProgress>0}><i className="fa-solid fa-video text-white"></i></button>
         <input onChange={handleVideoMessage} type="file" hidden ref={videoInput} accept=".mp4, .webm, .ogg,.mov"></input>
         <span>Video</span>
         {videoProgress>0&&videoProgress<100&&
          <span className=' text-lg'>{videoProgress.toString().slice(0,2)}%</span>
         }
          {videoProgress===100&&
          <span className=' text-lg'>Wait!</span>
         }
         </div>
       </div>
       <div style={{padding:"0 1.6vw"}} className=' flex w-full justify-between'>
       <div className=' flex flex-col items-center space-y-1'>
       <button onClick={handleAudioClick} disabled={imageProgress>0||videoProgress>0||audioProgress>0||documentProgress>0} className='px-5 py-4 rounded-full cursor-pointer bg-orange-500 hover:bg-orange-700 disabled:pointer-events-none disabled:cursor-not-allowed'><i className="fa-solid fa-headphones text-white"></i></button>
       <input type="file" accept='.mp3,.wav,.ogg' hidden onChange={handleAudioMessage} ref={audioInput}></input>
         <span className=' text-lg'>Audio</span>
         {audioProgress>0&&audioProgress<100&&
          <span className=' text-lg'>{audioProgress.toString().slice(0,2)}%</span>
         }
          {audioProgress===100&&
          <span className=' text-lg'>Wait!</span>
         }
         </div>
         <div className=' flex flex-col items-center space-y-1'>
         <button className='px-6 py-4 rounded-full cursor-pointer bg-red-500 hover:bg-red-700 disabled:pointer-events-none disabled:cursor-not-allowed' onClick={handleDocumentClick} disabled={imageProgress>0||videoProgress>0||audioProgress>0||documentProgress>0}><i className="fa-solid fa-file text-white"></i></button>
         <input type="file" hidden onChange={handleDocument} ref={documentInput}></input>
         <span>Document</span>
         {documentProgress>0&&documentProgress<100&&
          <span className=' text-lg'>{documentProgress.toString().slice(0,2)}%</span>
         }
          {documentProgress===100&&
          <span className=' text-lg'>Wait!</span>
         }
         </div>
       </div>
    </dialog>
       <div ref={refa} style={{maxHeight:'67vh'}} className=' flex flex-col py-1 px-2 w-full space-y-3 overflow-y-scroll overflow-x-hidden scroll-smooth relative'>
         {
           filteredMessages&&filteredMessages.map((nMessage)=>
           <div className=' flex flex-col space-y-1'>
           <div style={{maxWidth:'90%'}} className={` break-words max-w-3xl flex flex-col ${nMessage.type==="document"?'':'px-2'} text-lg rounded-lg ${nMessage.sender===props?.userData?.id?' self-end bg-green-500 text-white':' self-start bg-gray-200 text-black'}`}>
             {nMessage.type==="image"?<img className={ ` w-72 h-72 pt-1 cursor-zoom-in` } src={nMessage.message} alt="img"></img>:nMessage.type==="video"?<div className='md:h-68 w-80 md:w-96 pt-1'><Player>
    <source src={nMessage.message}/>
      <ControlBar>
        <ReplayControl seconds={5} order={1.1} />
        <ForwardControl seconds={5} order={1.2} />
        <CurrentTimeDisplay order={4.1} />
        <TimeDivider order={4.2} />
        <PlaybackRateMenuButton rates={[5, 2, 1, 0.5, 0.1]} order={7.1} />
        <VolumeMenuButton disabled />
      </ControlBar>
    </Player></div>:nMessage.type==="audio"?<div className=' w-60 md:w-80 pt-1'><AudioPlayer
    src={nMessage.message}
    autoPlay={false}
  /></div>:nMessage.type==="document"?<div className=' flex flex-col rounded-lg'>
             <div className=' bg-blue-500 text-white px-3 py-2 flex flex-col space-y-1 items-center'>
             <i className="fa-solid fa-file text-white text-2xl"></i>
             <span className=' text-white text-xl'>Document</span>
             </div>
              <span className=' bg-white text-black text-lg px-2 py-1'>{nMessage.fileName}</span>
             </div>
             :<span className=' self-start max-w-3xl'>{nMessage.message}</span>
             }
             {nMessage.type==="message"||nMessage.sender===userData?.id?
             <span className=' self-end'>{!nMessage.seen?<i className="fa-solid fa-check"></i>:<i className="fa-solid fa-check-double"></i>}</span>:
             <div className=' w-full flex justify-between items-center px-2 py-2'>
              <i onClick={()=>downloadFile(nMessage.message)} className={`fa-solid fa-download cursor-pointer ${nMessage.sender!==userData?.id?' text-black hover:text-gray-700':'text-white hover:text-gray-200'} text-2xl `} title={`Download ${nMessage.type}`}></i>
              <span className=' self-end'>{!nMessage.seen?<i className="fa-solid fa-check"></i>:<i className="fa-solid fa-check-double"></i>}</span>
            </div>
             }
           </div>
           <span className={nMessage?.sender===userData?.id?"self-end":"self-start"}>{format(nMessage?.timestamp?.toDate())}</span>
           </div>
          
           )
         }
         {voicerecordingModal&&
         <div style={{bottom:"12%",left:"24%",minwidth:"min-content",maxWidth:"max-content"}} className={`flex px-3 py-2 rounded-lg fixed bg-black text-white`}>
           {!sending?<div className='flex space-x-7'>
           <i onClick={deleteRec} className="fa-solid fa-trash text-2xl cursor-pointer text-red-500 hover:text-red-700" title="Delete Recording"></i>
           {hours>0?<span className=' text-2xl'>{`${hours}:${minutes}:${seconds}`}</span>:<span className=' text-2xl'>{`${minutes}:${seconds}`}</span>}
           {!voiceRecordingPaused?<i onClick={pauseRec} className="fa-solid fa-circle-pause text-2xl cursor-pointer text-blue-500 hover:text-blue-700" title="Pause Recording"></i>:<i onClick={resumeRec} className="fa-solid fa-circle-play text-2xl cursor-pointer text-green-500 hover:text-green-700" title="Resume Recording"></i>}
           <i onClick={stopRec} className="fa-solid fa-paper-plane text-2xl cursor-pointer text-orange-500 hover:text-orange-700" title="Send Recording"></i>
           </div>:
           <span>Sending....</span>
           }
         </div>
         }
       </div>
       </div>
       <div style={{flex:0.4,maxWidth:"75%",minWidth:"68vw"}} className="md:py-2 py-1 flex items-center space-x-4">
       <i onClick={handleReverse} className="fa-solid fa-arrow-left md:hidden"></i>
       <InputEmoji
      value={message}
      onChange={setMessage}
      cleanOnEnter
      onEnter={handleOnEnter}
      placeholder="Type a message"
    />
    <button onClick={AttachmentModalTrue} disabled={voicerecordingModal} className='text-gray-500 cursor-pointer hover:text-gray-700 disabled:cursor-not-allowed disabled:pointer-events-none'><i style={{transform:"rotate(-45deg)"}} className="fa-solid fa-paperclip text-xl" title="Attach Something"></i></button>
    <button disabled={voicerecordingModal} onClick={voiceRecStart} className=' text-gray-500 hover:text-gray-700 text-xl cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none'><i className="fa-solid fa-microphone" title='Record Voice'></i></button>
       </div>
    </div>
}
        </div>
  )
}

export default Main