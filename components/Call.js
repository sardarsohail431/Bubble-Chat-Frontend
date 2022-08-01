import React from 'react'
import { useState,useEffect } from 'react'
import { useSelector,useDispatch } from 'react-redux'
import { changeVideoModal,changeVoiceModal,changeConnectedUser,changeCallAnswerModal,changeVoiceCallAnswerModal,changeVidCallModal,changeVoiceCallModal,changeCallEndModal,changeVoiceCallEndModal,changeDeclined,changeBusy } from '../redux/callRedux'
import { useStopwatch } from 'react-timer-hook'

const Call = ({reference,socket,callType,callTimeout,remoteeStream,localeStream,peera,setRemoteStream,setLocalStream}) => {
  const dispatch = useDispatch()


  const videoModal = useSelector(state=>state.call.videoModal)
  const voiceModal = useSelector(state=>state.call.voiceModal)
  const online = useSelector(state=>state.call.online)
  const currUser = useSelector(state=>state.conv.userNow)
  const busy = useSelector(state=>state.call.busy)
  const declined = useSelector(state=>state.call.declined)
  const unanswered = useSelector(state=>state.call.unanswered)
  const connectedUserDetails = useSelector(state=>state.call.connectedUserDetails)
  const callAnswerModal = useSelector(state=>state.call.callanswermodal)
  const voiceCallAnswerModal = useSelector(state=>state.call.voicecallanswermodal)
  const VoiceCallModal = useSelector(state=>state.call.voicecallmodal)
  const vidCallModal = useSelector(state=>state.call.vidcallmodal)
  const callEndModal = useSelector(state=>state.call.callendmodal)
  const voiceCallEndModal = useSelector(state=>state.call.voicecallendmodal)

  const[startTime,setStartTime] = useState()
  const[peers,setPeers] = useState([])
  const[endTime,setEndTime] = useState()
  const[videoOff,setVideoOff] = useState(false)
  const[audioOff,setAudioOff] = useState(false)
  const[screenShareOn,setScreenShareOn] = useState(false)
  const[recordingPaused,setRecordingPaused] = useState(false)
  const[recBox,setRecBox] = useState(false)
  const[mediaRecorder,setMediaRecorder] = useState()
  const[collectedChunks,setCollectedChunks] = useState([])
  const[mobile,setMobile] = useState(false)


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
    socket.on("callComing",(data)=>{
      if(reference.current===true){
       socket.emit("calleeBusy",data.caller)
      }
      else{
        if(data.callType==="Video"){
          callComing(data)
        }
        else{
          voicecallComing(data)
        }
      }
    })
  },[socket])

  async function callComing(data){
        dispatch(changeConnectedUser({id:data.caller,name:data.callerName,img:data.callerImg,type:data.callType,peerId:data.CallerpeerId}))

        callType.current = "Video"
    dispatch(changeCallAnswerModal(true))
    reference.current = true;
    const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true})
    setLocalStream(stream)
    
  }

  async function voicecallComing(data){
    dispatch(changeConnectedUser({id:data.caller,name:data.callerName,img:data.callerImg,type:data.callType,peerId:data.CallerpeerId}))
    callType.current = "Voice"
dispatch(changeVoiceCallAnswerModal(true))
reference.current = true;
const stream = await navigator.mediaDevices.getUserMedia({audio:true})
setLocalStream(stream)

}


  useEffect(()=>{
    const CallerAnswer=async()=>{
      if(!vidCallModal&&!VoiceCallModal) return;
      if(!connectedUserDetails) return;
      console.log("Code Running",peera)
          const timeNow = Date.now()
           setStartTime(timeNow)
           peera.on('call',call=>{
             console.log("rannnn")
            console.log(localeStream,'lll',call,'c',connectedUserDetails.peerId,'peerid')
            call.answer(localeStream)
            call.on('stream',(videoStr)=>{
              setRemoteStream(videoStr)
              console.log(videoStr,'rmm')
              if(callType.current==="Voice"){
                start()
              }
            })
          peers[0] = call;
          call.on("close",()=>{
            const timeNow = Date.now()
            setEndTime(timeNow)
            dispatch(changeVidCallModal(false))
            dispatch(changeVoiceCallModal(false))
            if(callType.current==="Video"){
              dispatch(changeCallEndModal(true))
            }
            else{
              dispatch(changeVoiceCallEndModal(true))
            }
            localeStream?.getTracks().forEach((track)=>{
             track.stop()
            })
            remoteeStream?.getTracks().forEach((track)=>{
              track.stop()
             })
            setLocalStream(null)
            setRemoteStream(null)
            setTimeout(()=>{
           dispatch(changeCallEndModal(false))
           dispatch(changeVoiceCallEndModal(false))
           dispatch(changeConnectedUser(null))
           callType.current = null;
            },4000)
          })
          })
    }
    CallerAnswer()
   },[peera,socket,vidCallModal,connectedUserDetails,VoiceCallModal])


  useEffect(()=>{
    if(!navigator) return;
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator?.userAgent?.substr(0,4))) {
   setMobile(true);
}
  },[navigator])

  useEffect(()=>{
    if(!socket) return;
    socket.on("callEndHandler",(peerId)=>{
      peers.forEach((peer)=>{
       peer.close()
      })
      reference.current = false;
      reset()
      pause()
 
    })
   },[socket])

   useEffect(()=>{
    if(!socket) return;
    socket.on("ClientCancel",()=>{
    dispatch(changeCallAnswerModal(false))
    dispatch(changeVoiceCallAnswerModal(false))
    dispatch(changeConnectedUser(null))
    callType.current = null;
    reference.current = false;
    })
  },[socket])

  useEffect(()=>{
    if(!socket) return;
    socket.on("calleeCancel",()=>{
      dispatch(changeDeclined(true))
      dispatch(changeConnectedUser(null))
      callType.current = null;

      setTimeout(()=>{
      dispatch(changeVideoModal(false))
      dispatch(changeVoiceModal(false))
      dispatch(changeDeclined(false))
      reference.current = false;
      },5000)
    })
  })

  useEffect(()=>{
    if(!socket) return;
     socket.on("calleeisBusy",()=>{
       dispatch(changeBusy(true))
       reference.current = false;
       dispatch(changeConnectedUser(null))
       callType.current = null;
    
       setTimeout(()=>{
         dispatch(changeVoiceModal(false))
       dispatch(changeVideoModal(false))
       dispatch(changeBusy(false))
       },5000)
       
     })
      },[socket])

      useEffect(()=>{
        socket&&socket.on("callAcceptHandler",(peerId)=>{
          clearTimeout(callTimeout.current)
          dispatch(changeVideoModal(false))
          dispatch(changeVoiceModal(false))
          if(callType.current==="Video"){
           dispatch(changeVidCallModal(true))
          }
          else{
           dispatch(changeVoiceCallModal(true))
          }
          dispatch(changeConnectedUser({...connectedUserDetails,peerId}))
        })
        },[socket,connectedUserDetails])

        useEffect(()=>{
          if(!socket) return;
          if(!connectedUserDetails) return;
          socket.on("userOut",(id)=>{
           if(connectedUserDetails.id===id){
             peers[0]?.close()
             reference.current = false;
             reset()
             pause()
      
              if(callAnswerModal===true){
                dispatch(changeCallAnswerModal(false))
      
                callType.current = null;
                dispatch(changeConnectedUser(null))
              }
              else if(voiceCallAnswerModal===true){
                dispatch(changeVoiceCallAnswerModal(false))
                callType.current = null;
                dispatch(changeConnectedUser(null))
              }
           }
      
          })
      
        },[socket,connectedUserDetails,callAnswerModal,voiceCallAnswerModal])


  const callCancel=()=>{
    dispatch(changeVideoModal(false))
    dispatch(changeVoiceModal(false))
    reference.current = false;
    socket.emit('clientCancelled',connectedUserDetails.id)
    dispatch(changeConnectedUser(null))
    callType.current = null;
  }

  const callDecline=()=>{
    dispatch(changeCallAnswerModal(false))
    dispatch(changeVoiceCallAnswerModal(false))
    reference.current = false;
    socket.emit("calleeDeclined",connectedUserDetails.id)
    dispatch(changeConnectedUser(null))
    callType.current = null;
   }

   const callAnswer=async()=>{
    if(callType.current==="Video"){
      dispatch(changeVidCallModal(true))
    }
    else{
      dispatch(changeVoiceCallModal(true))
    }
    let call;
    setTimeout(()=>{
      call = peera.call(connectedUserDetails.peerId,localeStream);
      peers[0] = call;
      call.on('stream',newStream=>{
        setRemoteStream(newStream)
        if(callType.current==="Voice"){
          start()
        }
      })
      call?.on('close',()=>{
        const timeNow = Date.now()
        setEndTime(timeNow)
          dispatch(changeVidCallModal(false))
          dispatch(changeVoiceCallModal(false))
          if(callType.current==="Video"){
            dispatch(changeCallEndModal(true))
          }
          else{
            dispatch(changeVoiceCallEndModal(true))
          }
          localeStream?.getTracks().forEach((track)=>{
            track.stop()
           })
           remoteeStream?.getTracks().forEach((track)=>{
            track.stop()
           })
           setLocalStream(null)
           setRemoteStream(null)
          setTimeout(()=>{
        dispatch(changeCallEndModal(false))
         dispatch(changeVoiceCallEndModal(false))
         dispatch(changeConnectedUser(null))
         callType.current = null;
          },4000)
      })
    },1000)
      socket.emit("callAccepted",{
        id:connectedUserDetails.id,
        peerId:peera.id
      })
    const timeNow = Date.now()
    setStartTime(timeNow)

    dispatch(changeCallAnswerModal(false))
    dispatch(changeVoiceCallAnswerModal(false))
  }

  const handleVideoOff=async()=>{
    const videoTracks = localeStream?.getVideoTracks()
    videoTracks[0].enabled = false;
    setVideoOff(true)
    }
  
    const handleVideoOn=async()=>{
      const videoTracks = localeStream?.getVideoTracks()
      videoTracks[0].enabled = true;
      setVideoOff(false)
      }
  
    const handleAudioOff=()=>{
      const audioTracks = localeStream?.getAudioTracks()
      audioTracks.forEach((track)=>{
        track.enabled = false;
      })
      setAudioOff(true)
      }
  
    const handleAudioOn=()=>{
      const audioTracks = localeStream?.getAudioTracks()
      audioTracks.forEach((track)=>{
        track.enabled = false;
      })
      setAudioOff(false)

    }

    const handleRearCam=async()=>{
      let screena = await navigator.mediaDevices.getUserMedia({video:{
        facingMode:'environment'
      }})
     localeStream?.getTracks().forEach((track)=>{
       if(track.kind==="video"){
         localeStream?.removeTrack(track)
       }
     })
     localeStream?.addTrack(screena.getVideoTracks()[0])
     if(screena.getAudioTracks()[0]){
       localeStream?.addTrack(screena.getAudioTracks()[0])
     }
     const call = peera.call(connectedUserDetails.peerId,localeStream)
     peers[0] = call;
     call.on("close",()=>{
       const timeNow = Date.now()
       setEndTime(timeNow)
       dispatch(changeVidCallModal(false))
       dispatch(changeCallEndModal(true))
       localeStream?.getTracks().forEach((track)=>{
         track.stop()
        })
        remoteeStream?.getTracks().forEach((track)=>{
          track.stop()
         })
        setLocalStream(null)
        setRemoteStream(null)
       setTimeout(()=>{
      dispatch(changeCallEndModal(false))
      dispatch(changeConnectedUser(null))
      callType.current=null;
       },4000)
     })
      setScreenShareOn(true)
     }

    const handleScreenOn=async()=>{
      let screena = await navigator.mediaDevices.getDisplayMedia({video:true,audio:true})
     localeStream?.getTracks().forEach((track)=>{
       if(track.kind==="video"){
         localeStream?.removeTrack(track)
       }
     })
     localeStream?.addTrack(screena.getVideoTracks()[0])
     if(screena.getAudioTracks()[0]){
       localeStream?.addTrack(screena.getAudioTracks()[0])
     }
    
     const call = peera.call(connectedUserDetails.peerId,localeStream)
     peers[0] = call;
     call.on("close",()=>{
       const timeNow = Date.now()
       setEndTime(timeNow)
       dispatch(changeVidCallModal(false))
       dispatch(changeCallEndModal(true))
       localeStream?.getTracks().forEach((track)=>{
         track.stop()
        })
        remoteeStream?.getTracks().forEach((track)=>{
          track.stop()
         })
        setLocalStream(null)
        setRemoteStream(null)
       setTimeout(()=>{
      dispatch(changeCallEndModal(false))
      dispatch(changeConnectedUser(null))
      callType.current=null;
       },4000)
     })
      setScreenShareOn(true)
     }
 
     const handleScreenOff=async()=>{
      const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true})
     localeStream?.getTracks().forEach((item)=>{
       item.stop()
       localeStream?.removeTrack(item)
     })
     localeStream?.addTrack(stream.getVideoTracks()[0])
     localeStream?.addTrack(stream.getAudioTracks()[0])
     setScreenShareOn(false)
      const call = peera.call(connectedUserDetails.peerId,localeStream)
      peers[0] = call;
      call.on("close",()=>{
       const timeNow = Date.now()
       setEndTime(timeNow)
        dispatch(changeVidCallModal(false))
        dispatch(changeCallEndModal(true))
        localeStream?.getTracks().forEach((track)=>{
         track.stop()
        })
        remoteeStream?.getTracks().forEach((track)=>{
          track.stop()
         })
        setLocalStream(null)
        setRemoteStream(null)
        setTimeout(()=>{
       dispatch(changeCallEndModal(false))
       dispatch(changeConnectedUser(null))
       callType.current=null;
        },4000)
      })
     }
 
 
     const recordingStart=async()=>{
        let mediaRec = new MediaRecorder(remoteeStream)
         setMediaRecorder(mediaRec)
       setRecBox(true)
     }
 
     useEffect(()=>{
     if(!mediaRecorder) return;
     mediaRecorder.ondataavailable=handleData;
     mediaRecorder.start()
     },[mediaRecorder])
 
   
   const handleData=(e)=>{
     collectedChunks.splice(0,collectedChunks.length)
     if(e.data.size>0){
     collectedChunks.push(e.data)
     
     downloadData()
     }
   }
   
   const downloadData=()=>{
       const blob = new Blob(collectedChunks, {
         type: "video/webm"
       });
       const url = URL.createObjectURL(blob);
       const a = document.createElement("a");
       a.href = url;
       a.download = "recording.webm";
       a.click();
       a.remove()
       
       window.URL.revokeObjectURL(url);
     }
   
    const stopRecording=()=>{
        mediaRecorder.stop()
        setRecBox(false)
        setRecordingPaused(false)
    }
   
    const pauseRecording=()=>{
       mediaRecorder.pause()
       setRecordingPaused(true)
   }
   
   const resumeRecording=()=>{
       mediaRecorder.resume()
       setRecordingPaused(false)
   }
 
   const endCall=()=>{
     peers.forEach((peer)=>{
      peer.close()
     })
     socket.emit("callClosed",{
       id:connectedUserDetails.id,
       peerId:peera.id
     })
     reset()
     pause()
     reference.current = false;
   }

  return (
    <div className='z-30'>
                {videoModal&&
      <div style={{top:"0",left:"0",backgroundColor:"#4A4453",maxWidth:'100%',minWidth:'100vw',minHeight:'100vh',maxHeight:'100%'}} className=' absolute z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
        <img className=' w-36 h-36 rounded-full border-2 border-white' src={currUser.img} alt={currUser.username}></img>
        <span className=' text-white text-center text-5xl'>{currUser?.name?.toUpperCase()}</span>
        <span className=' text-gray-300 text-2xl'>{declined?'Call Declined!':busy?'Callee Is Busy At The Moment!':unanswered?'Call Unanswered!':'Calling...'}</span>
        {!online?<span className=' text-lg text-gray-400'>{!declined?'User Is Offline And May Not Answer The Call!':busy?'':unanswered?'':''}</span>:''}
        {!declined?<button disabled={busy || unanswered} onClick={callCancel} className=' cursor-pointer text-white bg-red-500 rounded-full hover:bg-red-700 disabled:hidden'><i className="fa-solid fa-phone-flip p-4"></i></button>:''}
      </div>
}
{voiceModal&&
      <div style={{top:"0",left:"0",backgroundColor:"#4A4453"}} className=' absolute w-full h-full z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
        <img className=' w-36 h-36 rounded-full border-2 border-white' src={currUser.img} alt={currUser.username}></img>
        <span className=' text-white text-center text-5xl'>{currUser?.name?.toUpperCase()}</span>
        <span className=' text-gray-300 text-2xl'>{declined?'Call Declined!':busy?'Callee Is Busy At The Moment!':'Calling...'}</span>
        {!online?<span className=' text-lg text-gray-400'>{!declined?'User Is Offline And May Not Answer The Call!':busy?'':''}</span>:''}
        {!declined?<button disabled={busy} onClick={callCancel} className=' cursor-pointer text-white bg-red-500 rounded-full hover:bg-red-700 disabled:hidden'><i className="fa-solid fa-phone-flip p-4"></i></button>:''}
      </div>
}
{callAnswerModal&&
      <div style={{top:"0",left:"0",backgroundColor:"#4A4453"}} className=' absolute w-full h-full z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
        <img className=' w-36 h-36 rounded-full border-2 border-white' src={connectedUserDetails.img} alt={connectedUserDetails.id}></img>
        <span className=' text-white text-center text-5xl'>{connectedUserDetails.name.toUpperCase()}</span>
        <span className=' text-gray-300 text-2xl'>{connectedUserDetails.type==="Video"?'Video':'Voice'} Calling Incoming...</span>
        <div className=' flex justify-between space-x-16 items-center'>
        <button onClick={callDecline} className=' cursor-pointer text-white bg-red-500 rounded-full hover:bg-red-700'><i className="fa-solid fa-phone-flip p-4"></i></button>
        <button disabled={!localeStream} onClick={callAnswer} className=' cursor-pointer text-white bg-green-500 rounded-full hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:pointer-events-none'><i className="fa-solid fa-phone p-4"></i></button>
        </div>
      </div>
}
{voiceCallAnswerModal&&
      <div style={{top:"0",left:"0",backgroundColor:"#4A4453"}} className=' absolute w-full h-full z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
        <img className=' w-36 h-36 rounded-full border-2 border-white' src={connectedUserDetails.img} alt={connectedUserDetails.id}></img>
        <span className=' text-white text-center text-5xl'>{connectedUserDetails.name.toUpperCase()}</span>
        <span className=' text-gray-300 text-2xl'>{connectedUserDetails.type==="Video"?'Video':'Voice'} Calling Incoming...</span>
        <div className=' flex justify-between space-x-16 items-center'>
        <button onClick={callDecline} className=' cursor-pointer text-white bg-red-500 rounded-full hover:bg-red-700'><i className="fa-solid fa-phone-flip p-4"></i></button>
        <button disabled={!localeStream} onClick={callAnswer} className=' cursor-pointer text-white bg-green-500 rounded-full hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:pointer-events-none'><i className="fa-solid fa-phone p-4"></i></button>
        </div>
      </div>
}
{
  vidCallModal&&
 <div style={{top:"0",left:"0",backgroundColor:"#4A4453"}} className=' absolute w-full h-full z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center overflow-x-hidden'>
   <video muted autoPlay style={{top:"4%",left:"80%",minWidth:'14vw',minHeight:'14vw',maxWidth:'17%',maxHeight:'40%'}} ref={b=>b?b.srcObject=localeStream:''} className=" z-30 border-2 border-green-600 object-cover rounded-lg absolute"></video>
   <video autoPlay style={{top:"0",left:"0"}} className=" absolute object-cover w-full h-full z-20" ref={a=>a?a.srcObject=remoteeStream:''}></video>
   <div style={{bottom:"2%",left:"auto",right:"auto"}} className=" absolute w-max h-max z-30 px-4 py-2 bg-gray-600 rounded-md space-x-4">
    {!videoOff?<i onClick={handleVideoOff} className="fa-solid fa-video-slash p-2 rounded-full text-white bg-green-600 cursor-pointer text-2xl hover:bg-green-800" title="Turn Off Video"></i>:<i onClick={handleVideoOn} className="fa-solid fa-video p-2 rounded-full text-white bg-green-600 cursor-pointer text-2xl hover:bg-green-800" title="Turn On Video"></i>}
    {!audioOff?<i onClick={handleAudioOff} className="fa-solid fa-microphone-slash p-2 rounded-full text-white bg-orange-600 cursor-pointer text-2xl hover:bg-orange-800" title="Turn Off Audio"></i>:<i onClick={handleAudioOn} className="fa-solid fa-microphone text-2xl px-4 py-2 rounded-full text-white bg-orange-600 hover:bg-orange-800 cursor-pointer" title="Turn On Audio"></i>}
    <i onClick={endCall} className="fa-solid fa-phone px-3 py-2 rounded-full text-white bg-red-600 hover:bg-red-800 cursor-pointer text-2xl" title='End Call'></i>
    {!screenShareOn?!mobile?<i onClick={handleScreenOn} className="fa-solid fa-desktop px-3 py-2 rounded-full text-white bg-blue-400 hover:bg-blue-600 cursor-pointer text-2xl" title="Start Screen Sharing"></i>:<i onClick={handleRearCam} className="fa-solid fa-camera-rotate px-3 py-2 rounded-full text-white bg-blue-400 hover:bg-blue-600 cursor-pointer text-2xl" title="Switch Camera"></i>:<i onClick={handleScreenOff} className="fa-solid fa-camera text-2xl px-3 py-2 rounded-full text-white bg-blue-400 hover:bg-blue-600 cursor-pointer" title="End Screen Sharing"></i>}
    <button className='py-2 px-3 rounded-full text-white bg-amber-500 hover:bg-amber-700 cursor-pointer disabled:bg-gray-500 disabled:pointer-events-none disabled:cursor-not-allowed' disabled={recBox} onClick={recordingStart}><i className="fa-solid fa-record-vinyl text-2xl" title="Start Recording"></i></button>
  </div>
   {recBox&&
    <div style={{top:"1%",left:"2%"}} className=' absolute w-max flex items-center space-x-3 h-max rounded-lg bg-green-600 text-white z-30 px-4 py-2'>
      <span className=' text-xl text-white'>{recordingPaused?'Recording Paused':'Recording Started'}</span>
        {!recordingPaused?
         <i onClick={pauseRecording} className="fa-solid fa-pause text-2xl cursor-pointer bg-orange-500 hover:bg-orange-700 px-2 py-1 rounded-lg" title='Pause'></i>:<i onClick={resumeRecording} className="fa-solid fa-play bg-blue-500 hover:bg-blue-700 px-3 py-1 text-lg rounded-lg cursor-pointer" title="Resume"></i>
        }
        <i onClick={stopRecording} className="fa-solid fa-stop text-2xl cursor-pointer bg-red-500 hover:bg-red-700 px-2 py-1 rounded-lg" title="Stop"></i>
    </div>
   }
 </div>
}
{VoiceCallModal&&
      <div style={{top:"0",left:"0",backgroundColor:"#4A4453"}} className=' absolute w-full h-full z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
        <img className=' w-36 h-36 rounded-full border-2 border-white' src={currUser.img} alt={currUser.username}></img>
        <span className=' text-white text-center text-5xl'>{currUser?.name?.toUpperCase()}</span>
        <span className=' text-white text-center text-5xl'>{hours}:{minutes}:{seconds}</span>
        <span className=' text-gray-300 text-2xl'>In Call..</span>
        <audio autoPlay ref={c=>c?c.srcObject=remoteeStream:''}></audio>
        <button  onClick={endCall} className=' cursor-pointer text-white bg-red-500 rounded-full hover:bg-red-700 disabled:hidden'><i className="fa-solid fa-phone-flip p-4"></i></button>
      </div>
}
{callEndModal&&
           <div style={{top:"0",left:"0",backgroundColor:"#4A4453"}} className=' absolute w-full h-full z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
           <img className=' w-36 h-36 rounded-full border-2 border-white' src={connectedUserDetails.img} alt={connectedUserDetails.id}></img>
           <span className=' text-white text-center text-5xl'>{connectedUserDetails.name.toUpperCase()}</span>
           <span className=' text-white text-center text-5xl'>{new Date(endTime-startTime).toISOString().slice(11, 19)}</span>
           <span className=' text-gray-300 text-2xl'>{connectedUserDetails.type==="Video"?'Video':'Voice'} Call Ended!</span>
         </div>
}
{voiceCallEndModal&&
           <div style={{top:"0",left:"0",backgroundColor:"#4A4453"}} className=' absolute w-full h-full z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
           <img className=' w-36 h-36 rounded-full border-2 border-white' src={connectedUserDetails.img} alt={connectedUserDetails.id}></img>
           <span className=' text-white text-center text-5xl'>{connectedUserDetails.name.toUpperCase()}</span>
           <span className=' text-white text-center text-5xl'>{new Date(endTime-startTime).toISOString().slice(11, 19)}</span>
           <span className=' text-gray-300 text-2xl'>{connectedUserDetails.type==="Video"?'Video':'Voice'} Call Ended!</span>
         </div>
}
    </div>
  )
}

export default Call