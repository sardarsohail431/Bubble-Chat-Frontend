import React,{useState,useEffect,useRef} from 'react'
import { useSelector } from 'react-redux'
import InputEmoji from "react-input-emoji";
import { doc, setDoc,collection, query, where, onSnapshot,serverTimestamp,getDoc,updateDoc,getDocs } from "firebase/firestore"; 
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import {format} from 'timeago.js'
import { Toaster,toast } from 'react-hot-toast';
import { changeConv, changeUser } from '../redux/convRedux';
import { useDispatch } from 'react-redux';
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
import { changeUpdate } from '../redux/convRedux';
import { getStorage,ref,uploadBytesResumable,getDownloadURL } from 'firebase/storage';
import { useStopwatch } from 'react-timer-hook';
import { changeGroupVideoModal,changeGroupCallDetails,changeGroupUnanswered } from '../redux/groupCallRedux';

const Group = ({userData,socket,updateVal,flex,setGroupLocalStream,reference,callType,groupCallTimeout,busyMems}) => {
  const currUser = useSelector(state=>state.conv.userNow)
  const[message,setMessage] = useState()
  const[messages,setMessages] = useState([])
  const[filteredMessages,setFilteredMessages] = useState([])
  const refa = useRef()
  const membersDialog = useRef()
  const [membersModal,setMembersModal] = useState(false)
  const[render,setRender] = useState(false)
  const dispatch = useDispatch()
  const[members,setMembers] = useState([])
  const renderRef = useRef(false)
  const[searchedMembers,setSearchedMembers] = useState([])
  const update = useSelector(state=>state.conv.updateConv)
  const seenStatusDialog = useRef()
  const[seenUsers,setSeenUsers] = useState([])
  const[currentSelectedMessage,setCurrentSelectedMessage] = useState(null)
  const[imageProgress,setImageProgress] = useState()
  const[videoProgress,setVideoProgress] = useState()
  const[audioProgress,setAudioProgress] = useState()
  const[documentProgress,setDocumentProgress] = useState()
  const attachmentRef = useRef()
  const imageInput = useRef()
  const videoInput = useRef()
  const audioInput = useRef()
  const documentInput = useRef()
  const mediaStreamRef = useRef()
  const recordVoiceRef = useRef()
  const deleteRecRef=useRef(false)
  const[voicerecordingModal,setVoiceRecordingModal] = useState(false)
  const[voiceRecordingPaused,setVoiceRecordingPaused] = useState(false)
  const[sending,setSending] = useState(false)
  const[collectedChunks,setCollectedChunks] = useState([])
  const dialogRef = useRef()

  const {
    seconds,
    minutes,
    hours,
    start,
    pause,
    reset,
  } = useStopwatch({ autoStart: false });

  useEffect(()=>{
    if(!socket) return;
    if(!currUser?.convId) return;
   socket.on("adminHandle",({id,convId})=>{
     if(convId===currUser.convId){
      dispatch(changeUser({
        ...currUser,
        admin:[
          ...currUser.admin,
          id
        ]
      }))
      setRender(!renderRef.current)
      refa.current = !refa.current;
     }
   })
  },[socket,currUser?.convId])

  useEffect(()=>{
    if(!socket) return;
    if(!currUser?.convId) return;
    socket.on("userHandleAdd",({id,convId})=>{
      if(convId===currUser.convId){
       dispatch(changeUser({
         ...currUser,
         members:[
           ...currUser.members,
           id
         ]
       }))
       setRender(!renderRef.current)
       refa.current = !refa.current;
      }
    })

  },[socket,currUser?.convId])

  useEffect(()=>{
    if(!socket) return;
    if(!currUser?.convId) return;
   socket.on("removeHandle",({id,convId})=>{
     if(convId===currUser.convId){
       const filter = currUser.admin.filter((item)=>item!==id)
      dispatch(changeUser({
        ...currUser,
        admin:[
          ...filter
        ]
      }))
      setRender(!renderRef.current)
      refa.current = !refa.current;
     }
   })
  },[socket,currUser?.convId])

  useEffect(()=>{
    if(!socket) return;
    if(!currUser?.convId) return;
    if(!userData?.id) return;
    socket.on("removeUserHandle",({id,convId})=>{
      if(convId===currUser.convId){
        const filter = currUser.admin.filter((item)=>item!==id)
        const memFilter = currUser.members.filter((item)=>item!==id)
        if(id===userData?.id){
          dispatch(changeUser(null))
          dispatch(changeConv(null))
        }
        else{
          dispatch(changeUser({
            ...currUser,
            admin:[
              ...filter
            ],
            members:[
              ...memFilter
            ]
          }))
          setRender(!renderRef.current)
          refa.current = !refa.current;
        }
      }
    })

  },[socket,currUser?.convId,userData?.id])

  useEffect(()=>{
    setTimeout(async()=>{
      if(!currUser.convId) return;
      if(!userData) return;
      const receiverQuery = query(collection(db, "groupmessages"), where("sender", "!=", userData.id), where("convId", "==", currUser.convId));

      const receiverQuerySnapshot = await getDocs(receiverQuery);
      receiverQuerySnapshot.forEach((doca) => {
        const seen = doca.get('seen');
        if(!seen.includes(userData.id)){
          const getData=async()=>{
            const frankDocRef = doc(db, "groupmessages", doca.id);
            await updateDoc(frankDocRef, {
              seen:[...seen,userData.id]
          });

          let mems = currUser.members.filter((member)=>member!==userData.id)
          socket.emit("messageCameGroup",{
            convId:currUser.convId,
            members:mems
          })
          dispatch(changeUpdate(!update))
          updateVal.current = !update;
          }
          getData()
        }
      });
    },1000)
},[currUser?.convId,userData,filteredMessages])

  useEffect(()=>{
    if(!currUser?.convId) return;
    const q = query(collection(db, "groupmessages"), where("convId", "==", currUser.convId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
          messages.push({id:doc.id,
            sender:doc.get('sender'),
            senderName:doc.get('senderName'),
            senderImg:doc.get('senderImg'),
            message:doc.get('message'),
            seen:doc.get("seen"),
            type:doc.get('type'),
            convId:doc.get('convId'),
            convName:doc.get('convName'),
            timestamp:doc.get('timestamp')
          })
      });
      const ids = messages.map((o)=>o.id)
      const filtered = messages.filter(({id}, index) => !ids.includes(id, index + 1))
      const moreFilter = filtered.filter((item)=>item.convId===currUser.convId)
      const evenMoreFilter = moreFilter.sort(function(a, b){return a.timestamp - b.timestamp});
      setFilteredMessages(evenMoreFilter)
      if(refa?.current){
        refa.current.scrollTop = refa?.current?.scrollHeight
      }
    });
    return(()=>{
      unsubscribe()
    })
  },[currUser?.convId,userData])

  useEffect(()=>{
  if(!membersModal) return;
  const getUsers=async()=>{
    members.splice(0,members.length)
      for(let i=0;i<currUser?.members.length;i++){
        const docRef = doc(db, "users", currUser?.members[i]);
        const docSnap = await getDoc(docRef);
        members.push({
          img:docSnap.get('img'),
          fullName:docSnap.get('fullName'),
          email:docSnap.get('email'),
          username:docSnap.get('username'),
          id:docSnap.id,
          convId:currUser?.convId
        })
      }
    const ids = members.map((o)=>o.id)
    const filtered = members.filter(({id}, index) => !ids.includes(id, index + 1))
    const membersFilter = filtered.filter((item)=>item.convId===currUser?.convId)
    setMembers(membersFilter)
  }
  getUsers()
  },[membersModal,currUser?.members,render])

  const handleOnEnter=async()=>{
    const uniqueID = uuidv4()
    await setDoc(doc(db, "groupmessages", uniqueID), {
      sender:userData.id,
      senderName:userData.fullName,  
      senderImg:userData.img,
      seen:[],
      type:"message",
      message:message,
      convId:currUser.convId,
      convName:currUser.name,
      timestamp:serverTimestamp()
    });
    dispatch(changeUpdate(!update))
    updateVal.current = !update;
    let mems = currUser.members.filter((member)=>member!==userData.id)
    socket.emit('messageCameGroup',{
      convId:currUser.convId,
      members:mems
    })
    setTimeout(()=>{
    socket.emit('messageCameGroup',{
      convId:currUser.convId,
      members:mems
    })
    },1000)
  }

  const handleMembers=()=>{
    setMembersModal(true)
    membersDialog?.current&&membersDialog.current.showModal()
  }

  const addAdmin=async(id)=>{
    try{
    const adminRef = doc(db, "groups", currUser?.convId);

 await updateDoc(adminRef, {
  admin:[...currUser?.admin,id]
});
dispatch(changeUser({
  ...currUser,
  admin:[
    ...currUser.admin,
    id
  ]
}))

const usersFilter = currUser.members.filter((item)=>item!==userData?.id)
socket.emit("youAdmin",{
  id,
  convId:currUser.convId,
  users:usersFilter
})
setRender(!render)
renderRef.current = !render;
toast.success("Admin Added Successfully!")
    }
    catch(err){
     toast.error("Error Adding Admin!")
    }
  }

  const removeAdmin=async(id)=>{
    try{
      const filter = currUser?.admin.filter((item)=>item!==id)
    const adminRef = doc(db, "groups", currUser?.convId);

 await updateDoc(adminRef, {
  admin:[...filter]
});
dispatch(changeUser({
  ...currUser,
  admin:[
    ...filter
  ] 
}))

const usersFilter = currUser.members.filter((item)=>item!==userData?.id)
socket.emit("adminRem",{
  id,
  convId:currUser.convId,
  users:usersFilter
})
setRender(!render)
renderRef.current = !render;
toast.success("Admin Removed Successfully!")
    }
    catch(err){
     toast.error("Error Removing Admin!")
    }
  }

  const removeUser=async(id)=>{
    try{
    const filter = currUser?.admin.filter((item)=>item!==id)
    const membersFilter = currUser?.members.filter((item)=>item!==id)
    const adminRef = doc(db, "groups", currUser?.convId);

 await updateDoc(adminRef, {
   ...currUser,
  admin:[...filter],
  members:[...membersFilter]
});
dispatch(changeUser({
  ...currUser,
  admin:[
    ...filter
  ],
  members:[
    ...membersFilter
  ]
}))

let memUsers = [...membersFilter,id]
const usersFilter = memUsers.filter((item)=>item!==userData?.id)
socket.emit("memRem",{
  id,
  convId:currUser.convId,
  users:usersFilter
})
setRender(!render)
renderRef.current = !render;
toast.success("Member Removed Successfully!")
    }
    catch(err){
      toast.error("Error Removing Mmeber!")
    }
  }

  const convDelete=()=>{
    dialogRef.current?dialogRef.current.showModal():''
  }

  const closeConvModal=()=>{
    dialogRef.current?dialogRef.current.close():''
  }

  const handleLeave=async()=>{
    try{
    const filter = currUser?.admin.filter((item)=>item!==userData?.id)
    const membersFilter = currUser?.members.filter((item)=>item!==userData?.id)
    const adminRef = doc(db, "groups", currUser?.convId);

 await updateDoc(adminRef, {
   ...currUser,
  admin:[...filter],
  members:[...membersFilter]
});

let memUsers = [...membersFilter,userData?.id]
const usersFilter = memUsers.filter((item)=>item!==userData?.id)
socket.emit("memRem",{
  id:userData.id,
  convId:currUser.convId,
  users:usersFilter
})
dispatch(changeUpdate(!updateVal.current))
updateVal.current = !updateVal.current;
dispatch(changeConv(null))
dispatch(changeUser(null))
setRender(!render)
renderRef.current = !render;
toast.success("Group Left Successfully!")
    }
    catch(err){
      console.log(err)
      toast.error("Error Leaving Group!")
    }
  }

  const handleSearchMembers=async(e)=>{
    if(!e.target.value){
    setSearchedMembers([])
    }
    let value = e.target.value;
    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach((item)=>{
    let username = item.get('username');
    let name = item.get('fullName');
    let email = item.get('email');
    let id = item.id;
    let img = item.get('img')
    if(username.toLowerCase().includes(value.toLowerCase())||name.toLowerCase().includes(value.toLowerCase())||email.toLowerCase().includes(value.toLowerCase())){
     searchedMembers.push({
       username,
       name,
       email,
       id,
       img
     })
    }
    })

    const ids = searchedMembers.map((o)=>o.id)
const filtered = searchedMembers.filter(({id}, index) => !ids.includes(id, index + 1))
const moreFilter = filtered.filter((item)=>item.id!==userData?.id)
setSearchedMembers(moreFilter)
  }

  const addMember=async(member)=>{
    if(currUser?.members.includes(member.id)) return;
    try{
    const adminRef = doc(db, "groups", currUser?.convId);
    await updateDoc(adminRef, {
      ...currUser,
     members:[...currUser?.members,member.id]
   });
   dispatch(changeUser({
    ...currUser,
    members:[
      ...currUser?.members,member.id
    ]
  }))
  const usersFilter = currUser.members.filter((item)=>item!==userData?.id)
  const usersTosend = usersFilter.filter((item)=>item!==member.id)
  const id = member.id;
socket.emit("youUser",{
  id,
  convId:currUser.convId,
  users:usersTosend
})
let ids = [id]
socket.emit("createGroup",ids)
setRender(!render)
renderRef.current = !render;
toast.success("Member Added Successfully!")
    }
    catch(err){
      toast.error("Error Adding Member!")
    }

  }

 useEffect(()=>{
  if(!currentSelectedMessage) return;
  const getUserData=async()=>{
    const filteredMsg = filteredMessages.filter((item)=>item.id===currentSelectedMessage)
    const seen = filteredMsg[0]?.seen;
    if(!seen) return;
    seenUsers.splice(0,seenUsers.length)
   for(let i=0;i<seen.length;i++){
    const userRef = doc(db, "users", seen[i]);
    const userSnap = await getDoc(userRef);
    seenUsers.push({
      id:userSnap.id,
      ...userSnap.data()
    })
   }
   const ids = seenUsers.map((o)=>o.id)
   const filtered = seenUsers.filter(({id}, index) => !ids.includes(id, index + 1))
   setSeenUsers(filtered)
  }
  getUserData() 
 },[update,currentSelectedMessage,filteredMessages])

 const handleSeen=async(nMessage)=>{
   const {seen,id} = nMessage
   seenStatusDialog?.current&&seenStatusDialog.current.showModal()
   setCurrentSelectedMessage(id)
    seenUsers.splice(0,seenUsers.length)
   for(let i=0;i<seen.length;i++){
    const userRef = doc(db, "users", seen[i]);
    const userSnap = await getDoc(userRef);
    seenUsers.push({
      id:userSnap.id,
      ...userSnap.data()
    })
   }
   const ids = seenUsers.map((o)=>o.id)
   const filtered = seenUsers.filter(({id}, index) => !ids.includes(id, index + 1))
   setSeenUsers(filtered)
 }

 const handleSeenClose=()=>{
  seenStatusDialog?.current&&seenStatusDialog.current.close()
  setCurrentSelectedMessage(null)
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
           await setDoc(doc(db, "groupmessages", randID), {
             convId:currUser.convId,
             type:"image",
             message:downloadURL,
             seen:[],
             sender:userData?.id,
             convName:currUser.name,
             senderImg:userData.img,
             senderName:userData.fullName,
             timestamp:serverTimestamp()
           });
           toast.success("Image Sent Successfully!")
           attachmentRef.current.close()
           setImageProgress(0)
           dispatch(changeUpdate(!update))
           updateVal.current = !update;
           let mem = currUser.members.filter((member)=>member!==userData.id)
           socket.emit('messageCameGroup',{
             convId:currUser.convId,
             members:mem
           })
           setTimeout(()=>{
           socket.emit('messageCameGroup',{
            convId:currUser.convId,
            members:mem
          })
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
 if((file.size/1024)/1024>70){
  toast.error("File Size Must Be Below Than 70 MBs")
 }
 if((file.size/1024)/1024>70) return;
 const format = file.name.slice(file.name.length-3)
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
           await setDoc(doc(db, "groupmessages", randID), {
             convId:currUser.convId,
             type:"video",
             message:downloadURL,
             seen:[],
             sender:userData?.id,
             convName:currUser.name,
             senderImg:userData.img,
             senderName:userData.fullName,
             timestamp:serverTimestamp()
           });
           toast.success("Video Sent Successfully!")
           attachmentRef.current.close()
           setVideoProgress(0)
           dispatch(changeUpdate(!update))
           updateVal.current = !update;
           let mem = currUser.members.filter((member)=>member!==userData.id)
           socket.emit('messageCameGroup',{
             convId:currUser.convId,
             members:mem
           })
           setTimeout(()=>{
           socket.emit('messageCameGroup',{
            convId:currUser.convId,
            members:mem
          })
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
 if((file.size/1024)/1024>70){
  toast.error("File Size Must Be Below Than 70 MBs")
 }
 if((file.size/1024)/1024>70) return;
 const format = file.name.slice(file.name.length-3)
 console.log(format)
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
           await setDoc(doc(db, "groupmessages", randID), {
             convId:currUser.convId,
             type:"audio",
             message:downloadURL,
             seen:[],
             sender:userData?.id,
             convName:currUser.name,
             senderImg:userData.img,
             senderName:userData.fullName,
             timestamp:serverTimestamp()
           });
           toast.success("Audio Sent Successfully!")
           attachmentRef.current.close()
           setAudioProgress(0)
           dispatch(changeUpdate(!update))
           updateVal.current = !update;
           let mem = currUser.members.filter((member)=>member!==userData.id)
           socket.emit('messageCameGroup',{
             convId:currUser.convId,
             members:mem
           })
           setTimeout(()=>{
           socket.emit('messageCameGroup',{
            convId:currUser.convId,
            members:mem
          })
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
           await setDoc(doc(db, "groupmessages", randID), {
             convId:currUser.convId,
             type:"document",
             fileName:file.name,
             message:downloadURL,
             seen:[],
             sender:userData?.id,
             convName:currUser.name,
             senderImg:userData.img,
             senderName:userData.fullName,
             timestamp:serverTimestamp()
           });
           toast.success("Document Sent Successfully!")
           attachmentRef.current.close()
           setDocumentProgress(0)
           dispatch(changeUpdate(!update))
           updateVal.current = !update;
           let mem = currUser.members.filter((member)=>member!==userData.id)
           socket.emit('messageCameGroup',{
             convId:currUser.convId,
             members:mem
           })
           setTimeout(()=>{
           socket.emit('messageCameGroup',{
            convId:currUser.convId,
            members:mem
          })
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
           await setDoc(doc(db, "groupmessages", randID), {
             convId:currUser.convId,
             type:"audio",
             message:downloadURL,
             seen:[],
             sender:userData?.id,
             convName:currUser.name,
             senderImg:userData.img,
             senderName:userData.fullName,
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
           let mem = currUser.members.filter((member)=>member!==userData.id)
           socket.emit('messageCameGroup',{
             convId:currUser.convId,
             members:mem
           })
           setTimeout(()=>{
           socket.emit('messageCameGroup',{
            convId:currUser.convId,
            members:mem
          })
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

const handleVideoStart=async()=>{
  const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true})
  setGroupLocalStream(stream)
  dispatch(changeGroupVideoModal(true))

  const roomId = uuidv4()

  const members = currUser.members.filter((item)=>item!==userData.id)

  socket.emit('groupCallIncoming',{
    initiatorName:userData.fullName,
    initiator:userData.id,
    admin:[...currUser.admin],
    groupName:currUser.name,
    groupId:currUser.convId,
    groupImg:currUser.img,
    members,
    roomId,
    callType:"groupvideo"
  })

  dispatch(changeGroupCallDetails({
    initiatorName:userData.fullName,
    initiator:userData.id,
    admin:[...currUser.admin],
    groupImg:currUser.img,
    groupName:currUser.name,
    groupId:currUser.convId,
    members,
    roomId,
    callType:"groupvideo"
  }))
  callType.current="groupvideo"
  reference.current = true;
  let timesss = setTimeout(()=>{
    dispatch(changeGroupUnanswered(true))
    setTimeout(()=>{
      dispatch(changeGroupVideoModal(false))
      dispatch(changeGroupUnanswered(false))
    },3000)
    reference.current = false;
    socket.emit('clientCancelled',currUser.id)
    dispatch(changeGroupCallDetails(null))
    callType.current = null;
    busyMems.current = 0;
  },15000)
  groupCallTimeout.current = timesss;
}

  return (
    <div style={{flex:flex,minHeight:'86vh',maxHeight:'100%',minWidth:"77vw"}}>
      <Toaster position='bottom-center'/>
      <div style={{minHeight:'86vh',flex:flex,maxHeight:'100%',minWidth:"77vw"}} className="shadow-lg px-1 py-1 md:px-2 flex flex-col items-start w-full">
       <div style={{flex:0.2}} className=' flex items-center justify-between px-2 py-1 text-white bg-green-600 w-full max-h-14 rounded-md'>
         <div className=' space-x-3 flex items-center'>
         <img className=' w-12 h-12 rounded-full' src={currUser?.img || '/images/profilpic.png'} alt="img"></img>
            <span className=' text-2xl'>{currUser?.name || 'User'}</span>
         </div>
         <div className=' flex items-center space-x-6'>
         <i onClick={handleMembers} className="fa-solid fa-people-group cursor-pointer" title="View Members"></i>
         <i className="fa-solid fa-video text-2xl cursor-pointer" onClick={handleVideoStart} title="Start Group Video Call"></i>
         <i onClick={convDelete} className="fa-solid fa-right-from-bracket cursor-pointer text-xl" title="Leave Group"></i>
         </div>
       </div>
       <div style={{flex:2.4,maxHeight:'67vh'}} className=' w-full py-1'>
       <dialog className='flex-col space-y-2 rounded-md border-2 hidden open:flex' ref={dialogRef}>
         <span className=' text-3xl font-semibold'>Are You Sure You Want To Leave This Group?</span>
         <div className=' flex items-center justify-center space-x-3'>
         <button onClick={closeConvModal} className=' bg-blue-400 px-2 py-1 rounded-lg text-xl cursor-pointer text-white hover:bg-blue-600'>Cancel</button>
         <button onClick={handleLeave} className=' bg-green-500 px-2 py-1 rounded-lg text-xl cursor-pointer text-white hover:bg-green-700'>Leave</button>
         </div>
        </dialog>
         <dialog ref={membersDialog} className="rounded-md px-5 py-5 flex-col items-center space-y-2 hidden relative open:flex">
         <span onClick={()=>{membersDialog.current&&membersDialog.current.close()}} style={{top:"0",right:"0%"}} className=' px-3 py-1 rounded-full text-white bg-black cursor-pointer absolute'>X</span>
          <div className=' flex flex-col space-y-2'>
          {currUser.admin.includes(userData?.id)&&<div className=' w-full'>
        <input onChange={handleSearchMembers} placeholder=' Search Members To Add' type="search" className=' focus:outline-green-600 px-2 py-2 rounded-lg w-full my-1'></input>
        <div style={{maxHeight:"30vh"}} className=' overflow-y-scroll flex flex-col space-y-1'>
        {searchedMembers.length!==0&&searchedMembers.map((member)=>
        <div className=' flex space-x-4 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 items-center w-full relative'>
          <img className=' w-12 h-12 rounded-full ' src={member.img} alt="img"></img>
          <div className=' flex flex-col items-center'>
          <span className=' text-lg font-semibold'>@{member.username}</span>
          <span className=' text-lg'>{member.name}</span>
            </div>
          <i onClick={()=>addMember(member)} style={{right:"4%"}} className="fa-solid fa-plus absolute text-lg text-center max-h-10 p-2 rounded-lg text-white bg-red-500 cursor-pointer hover:bg-red-700" title="Add This Member"></i>
        </div> 
        )
        }
        </div>
        </div>}
           {members.length!==0?
           <div className=' flex flex-col space-y-1'>
             <h1 className=' text-3xl font-semibold'>Members</h1>
           {members.map((member)=>
             <div style={{minWidth:"45vw"}} key={member.id} className=' flex items-center justify-between shadow-lg rounded-lg space-x-5 px-3 py-2 hover:cursor-pointer hover:bg-slate-100'>
               <div className=' flex items-center space-x-4'>
               <img className=' w-14 h-14 rounded-full' src={member.img} alt="img"></img>
               <span className=' font-semibold text-xl'>@{member.id===userData?.id?'Me':member.username}</span>
               </div>
               <div className=' flex space-x-4'>
                {currUser?.admin.includes(member.id)&&<span className=' px-2 py-1 bg-white border-2 border-green-600 text-green-600 rounded-lg'>Admin</span>}
                {currUser?.admin.includes(userData?.id)?member.id!==userData?.id?currUser?.admin.includes(member.id)?<button className=' text-white bg-orange-500 px-2 py-1 rounded-md hover:bg-orange-700' onClick={()=>removeAdmin(member.id)}>Remove Admin</button>:<button onClick={()=>addAdmin(member.id)} className='bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-800'>Add Admin</button>:'':'' }
                {currUser?.admin.includes(userData?.id)?member.id!==userData?.id?<button className=' bg-red-500 px-2 py-1 text-white hover:bg-red-700 rounded-md' onClick={()=>removeUser(member.id)}>Remove User</button>:'':''}
              </div>
             </div>
           )}</div>:
           <img className=' w-32 h-32 self-center' src={'/images/loading.gif'} alt="LOADING..."></img>
           }
           </div>
         </dialog>
         <dialog ref={seenStatusDialog} className="rounded-md px-5 py-3 flex-col items-start space-y-7 hidden relative open:flex">
         <span onClick={handleSeenClose} style={{top:"0",right:"0%"}} className=' px-3 py-1 rounded-full text-white bg-black cursor-pointer absolute'>X</span>
           <h1 className=' text-3xl font-semibold'>Seen By ({seenUsers?.length})</h1>
           {seenUsers.length!==0?
           <div className=' flex flex-col space-y-1 items-start w-full'>
            {seenUsers.map((user)=>
              <div className=' flex items-center space-x-4 hover:bg-slate-50 cursor-pointer w-full px-2 py-1 rounded-lg'>
              <img className=' w-14 h-14 rounded-full' src={user.img} alt="img"></img>
              <div className=' flex flex-col space-y-1'>
              <span className=' font-semibold text-xl'>@{user.username}</span>
              <span className=' font-medium text-xl'>{user.fullName}</span>
              </div>
              </div>
            )}
            </div>
           :
           <img className=' w-32 h-32 self-center' src={'/images/loading.gif'} alt="LOADING..."></img>
           }
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
       <div ref={refa} style={{maxHeight:'67vh'}} className=' flex flex-col py-1 px-2 w-full space-y-3 overflow-y-scroll scroll-smooth relative'>
         {filteredMessages.length!==0&&
         filteredMessages.map((nMessage)=>
         <div className=' flex flex-col space-y-1'>
         <div style={{maxWidth:'90%'}} className={` break-words max-w-3xl flex flex-col ${nMessage.type==="document"?'':'px-2'} text-lg rounded-lg ${nMessage.sender===userData?.id?' self-end bg-green-500 text-white':' self-start bg-gray-200 text-black'}`}>
           <div className=' flex space-x-3 px-1 items-center'>
            <img className=' w-6 h-6 rounded-full' src={nMessage.senderImg} alt="Image"></img>
            <span className=' font-medium'>{nMessage.sender!==userData?.id?nMessage.senderName:'Me'}</span>
           </div>
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
           {nMessage.type==="message"||nMessage.sender===userData?.id?nMessage.sender!==userData?.id?
           <span className=' self-end'><i className="fa-solid fa-check"></i></span>:
           <div className=' w-full flex justify-between items-center px-2 py-2'>
             <i onClick={()=>handleSeen(nMessage)} className={`fa-solid fa-circle-info cursor-pointer ${nMessage.sender!==userData?.id?' text-black hover:text-gray-700':'text-white hover:text-gray-200'} text-2xl `} title="Seen Status"></i>
             <span className=' self-end'><i className="fa-solid fa-check"></i></span>
           </div>
           :
           <div className=' w-full flex justify-between items-center px-2 py-2'>
            <i onClick={()=>downloadFile(nMessage.message)} className={`fa-solid fa-download cursor-pointer ${nMessage.sender!==userData?.id?' text-black hover:text-gray-700':'text-white hover:text-gray-200'} text-2xl `} title={`Download ${nMessage.type}`}></i>
            <span className=' self-end'><i className="fa-solid fa-check"></i></span>
          </div>
           }
         </div>
         <span className={nMessage?.sender===userData?.id?"self-end":"self-start"}>{format(nMessage?.timestamp?.toDate())}</span>
         </div>
        
         )
         }
                  {voicerecordingModal&&
         <div style={{bottom:"12%",left:"20%",minwidth:"min-content",maxWidth:"max-content"}} className={`flex px-3 py-2 rounded-lg fixed bg-black text-white`}>
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
       <div style={{flex:0.4,minWidth:"68vw",maxWidth:"75%"}} className="pt-1 flex items-center space-x-4">
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
    </div>
  )
}

export default Group