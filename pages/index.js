import * as React from 'react';
import { io } from 'socket.io-client';
import { useState,useEffect } from 'react';
import {useSelector} from 'react-redux';
import Router from 'next/router';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import Header from '../components/Header';
import Head from 'next/head';
import styles from '../styles/header.module.css' 
import Sidebar from '../components/Sidebar';
import Main from '../components/Main';
import Group from '../components/Group';
import { useRef } from 'react';
import Call from '../components/Call';
import GroupCall from '../components/GroupCall';

export default function HomePage() {
  const [socket,setSocket] = useState();
  const [userData,setUserData] = useState()
  const user = useSelector(state => state.user.currUser)
  const currConvo = useSelector(state=>state.conv.currConv)
  const updateVal = useRef(false)
  const update = useSelector(state=>state.conv.updateConv)
  const reference = useRef(false)
  const callType = useRef(null)
  const callTimeout = useRef()
  const groupCallTimeout= useRef()
  const [localeStream,setLocalStream] = useState()
  const [remoteeStream,setRemoteStream] = useState()
  const [groupLocalStream,setGroupLocalStream] = useState()
  const [groupRemoteStream,setGroupRemoteStream] = useState([])
  const [windowWidth,setWindowWidth] = useState()
  const[peera,setPeer] = useState(null)
  const busyMems = useRef(0)

  //Changes Selected Convos To Null. Not Needed Now
  // window.addEventListener('dblclick',()=>{
  //   dispatch(changeConv(null))
  //   dispatch(changeUser(null))
  // })


  useEffect(() => {
    const {pathname} = Router
    if(!user){
      if(pathname == '/' ){
          Router.push('/login')
      }
    }
    
    setSocket(io('https://modchatapp1-socket.herokuapp.com/'));
  }, [user])

  useEffect(()=>{
    if(!window?.innerWidth) return;
    setWindowWidth(window.innerWidth)
  },[window?.innerWidth])

  console.log(socket,'soc')


  useEffect(()=>{
     const getData=async()=>{
       if(!user) return;
      const docRef = doc(db, "users", user?.uid);
      const docSnap = await getDoc(docRef);
       setUserData({
         username:docSnap.get('username'),
         fullName:docSnap.get('fullName'),
         email:docSnap.get('email'),
         id:docSnap.id,
         img:docSnap.get('img'),
         deletedChats:docSnap.get('deletedChats')
       })
     }
     getData()
  },[update])

  useEffect(() => {
    import("peerjs").then(({ default: Peer }) => {
      const peer = new Peer()
    setPeer(peer)
    })
  }, [])

  useEffect(()=>{
    if(!userData) return;
    if(!socket) return;
    if(!peera) return;
    console.log("running")
      socket.emit('nUser',{
        uid:userData.id,
        name:userData.fullName,
        peerId:peera.id
      })
   },[socket,peera,userData])

  return (
<div className={styles.raleway}>
  <Head>
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css'></link>
    <title>Bubble Chat</title>
  </Head>
  <Header {...userData}/>
  {windowWidth>=900?
  <div className=' flex py-1 justify-between items-start'>
    <GroupCall userData={userData} reference={reference} socket={socket} callType={callType} peera={peera} setGroupLocalStream={setGroupLocalStream} groupLocalStream={groupLocalStream} groupRemoteStream={groupRemoteStream} setGroupRemoteStream={setGroupRemoteStream} groupCallTimeout={groupCallTimeout} busyMems={busyMems}/>
    <Call reference={reference} socket={socket} callType={callType} callTimeout={callTimeout} remoteeStream={remoteeStream} setRemoteStream={setRemoteStream} setLocalStream={setLocalStream} localeStream={localeStream} peera={peera}/>
    <Sidebar flex={0.6} userData={userData} socket={socket} updateVal={updateVal}/>
    {currConvo?.type==="individual"?
      <Main flex={1.4} userData={userData} socket={socket} updateVal={updateVal} reference={reference} callType={callType} callTimeout={callTimeout} localeStream={localeStream} remoteeStream={remoteeStream} setRemoteStream={setRemoteStream} setLocalStream={setLocalStream} peera={peera}/>:currConvo?.type==="group"?
      <Group flex={1} userData={userData} socket={socket} updateVal={updateVal} reference={reference} callType={callType} setGroupLocalStream={setGroupLocalStream} groupCallTimeout={groupCallTimeout} busyMems={busyMems}/>:
      <span style={{flex:1.4}} className=' text-3xl text-center'>No Conversations Or Groups Selected!</span>
    }</div>:
    currConvo===null?
    <div>
    <GroupCall userData={userData} reference={reference} socket={socket} callType={callType} peera={peera} setGroupLocalStream={setGroupLocalStream} groupLocalStream={groupLocalStream} groupRemoteStream={groupRemoteStream} setGroupRemoteStream={setGroupRemoteStream} groupCallTimeout={groupCallTimeout} busyMems={busyMems}/>
    <Call reference={reference} socket={socket} callType={callType} callTimeout={callTimeout} remoteeStream={remoteeStream} setRemoteStream={setRemoteStream} setLocalStream={setLocalStream} localeStream={localeStream} peera={peera}/>
    <Sidebar flex={1} userData={userData} socket={socket} updateVal={updateVal}/>
    </div>
    :currConvo?.type==="individual"?
    <div>
    <GroupCall userData={userData} reference={reference} socket={socket} callType={callType} peera={peera} setGroupLocalStream={setGroupLocalStream} groupLocalStream={groupLocalStream} groupRemoteStream={groupRemoteStream} setGroupRemoteStream={setGroupRemoteStream} groupCallTimeout={groupCallTimeout} busyMems={busyMems}/>
    <Call reference={reference} socket={socket} callType={callType} callTimeout={callTimeout} remoteeStream={remoteeStream} setRemoteStream={setRemoteStream} setLocalStream={setLocalStream} localeStream={localeStream} peera={peera}/>
    <Main flex={1} userData={userData} socket={socket} updateVal={updateVal} reference={reference} callType={callType} callTimeout={callTimeout} localeStream={localeStream} remoteeStream={remoteeStream} setRemoteStream={setRemoteStream} setLocalStream={setLocalStream} peera={peera}/>
    </div>
    :currConvo?.type==="group"?
    <div>
    <GroupCall userData={userData} reference={reference} socket={socket} callType={callType} peera={peera} setGroupLocalStream={setGroupLocalStream} groupLocalStream={groupLocalStream} groupRemoteStream={groupRemoteStream} setGroupRemoteStream={setGroupRemoteStream} groupCallTimeout={groupCallTimeout} busyMems={busyMems}/>
    <Call reference={reference} socket={socket} callType={callType} callTimeout={callTimeout} remoteeStream={remoteeStream} setRemoteStream={setRemoteStream} setLocalStream={setLocalStream} localeStream={localeStream} peera={peera}/>
    <Group userData={userData} socket={socket} updateVal={updateVal} flex={1} reference={reference} callType={callType} setGroupLocalStream={setGroupLocalStream}/>
    </div>:
    <div>
      <GroupCall userData={userData} reference={reference} socket={socket} callType={callType} peera={peera} setGroupLocalStream={setGroupLocalStream} groupLocalStream={groupLocalStream} groupRemoteStream={groupRemoteStream} setGroupRemoteStream={setGroupRemoteStream} groupCallTimeout={groupCallTimeout} busyMems={busyMems}/>
      <Call reference={reference} socket={socket} callType={callType} callTimeout={callTimeout} remoteeStream={remoteeStream} setRemoteStream={setRemoteStream} setLocalStream={setLocalStream} localeStream={localeStream} peera={peera}/>
    <span style={{flex:1.4}} className=' text-3xl text-center'>No Conversations Or Groups Selected!</span>
    </div>

  }
</div>
  );
}

