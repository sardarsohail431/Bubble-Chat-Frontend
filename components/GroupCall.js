import React from 'react'
import { useEffect,useState,useRef } from 'react'
import { useDispatch,useSelector } from 'react-redux'
import { changeGroupCallAnswerModal,changeGroupCallDetails,changeGroupVidCallModal,changeGroupVideoModal,changeGroupBusy,changeGroupVoiceModal } from '../redux/groupCallRedux'

const GroupCall = ({socket,reference,callType,peera,setGroupLocalStream,groupLocalStream,groupRemoteStream,setGroupRemoteStream,userData,groupCallTimeout,busyMems}) => {
    const dispatch = useDispatch()
    const currUser = useSelector(state=>state.conv.userNow)
    const groupvideoModal = useSelector(state=>state.groupcall.groupvideoModal)
    const groupCallDetails = useSelector(state=>state.groupcall.groupcalldetails)
    const groupCallAnswerModal = useSelector(state=>state.groupcall.groupcallanswermodal)
    const groupVidCallModal = useSelector(state=>state.groupcall.groupvidcallmodal)
    const groupUnanswered = useSelector(state=>state.groupcall.groupunanswered)
    const groupBusy = useSelector(state=>state.groupcall.groupbusy)
    const[render,setRender] = useState(false)
    const[videoOff,setVideoOff] = useState(false)
    const[audioOff,setAudioOff] = useState(false)
    const[screenShareOn,setScreenShareOn] = useState(false)
    const[mobile,setMobile] = useState(false)
    const[recordingOn,setRecordingOn] = useState(false)
    const[currentRecording,setCurrentRecording] = useState()
    const mediaRecorder = useRef(null)
    const[collectedChunks,setCollectedChunks] = useState([])
    const[recordingPaused,setRecordingPaused] = useState(false)
    const calleeTimeout = useRef()
    const remoteStreamRef = useRef([])
    const[streamData,setStreamData] = useState([])
    const[mutedUsers,setMutedUsers] = useState([])
    const mutedRef = useRef([])
    const streamDataRef = useRef([])

    useEffect(()=>{
      if(!navigator) return;
      if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
      || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator?.userAgent?.substr(0,4))) {
     setMobile(true);
  }
    },[navigator])

    const[peers,setPeers] = useState([])

    useEffect(()=>{
      if(!socket) return;
      socket.on("vidOff",(id)=>{
        let peerF = remoteStreamRef.current.filter((item)=>item.peerId===id)[0]
        let poer = remoteStreamRef.current.filter((item)=>item.peerId!==id)
        peerF.stream.getVideoTracks()[0].enabled = false;
        remoteStreamRef.current = [...poer,peerF]
        setGroupRemoteStream(remoteStreamRef.current)
        
      })

    },[socket])

    useEffect(()=>{
      if(!socket) return;
      socket.on("audOff",(id)=>{
        let peerF = remoteStreamRef.current.filter((item)=>item.peerId===id)[0]
        let poer = remoteStreamRef.current.filter((item)=>item.peerId!==id)
        peerF.stream.getAudioTracks().forEach((track)=>{
          track.enabled = false;
        })
        remoteStreamRef.current = [...poer,peerF]
        setGroupRemoteStream(remoteStreamRef.current)
        mutedRef.current.push(id)
        setMutedUsers(mutedRef.current)
        
      })

    },[socket])

    useEffect(()=>{
      if(!socket) return;
      socket.on("vidOn",(id)=>{
        let peerF = remoteStreamRef.current.filter((item)=>item.peerId===id)[0]
        let poer = remoteStreamRef.current.filter((item)=>item.peerId!==id)
        peerF.stream.getVideoTracks()[0].enabled = true;
        remoteStreamRef.current = [...poer,peerF]
        setGroupRemoteStream(remoteStreamRef.current)

      })

    },[socket])

    useEffect(()=>{
      if(!socket) return;
      socket.on("audOn",(id)=>{
        let peerF = remoteStreamRef.current.filter((item)=>item.peerId===id)[0]
        let poer = remoteStreamRef.current.filter((item)=>item.peerId!==id)
        peerF.stream.getAudioTracks().forEach((track)=>{
          track.enabled = true;
        })
        remoteStreamRef.current = [...poer,peerF]
        setGroupRemoteStream(remoteStreamRef.current)
        const mutedFilter = mutedRef.current.filter((item)=>item!==id)
        mutedRef.current = mutedFilter;
        setMutedUsers(mutedFilter)
      })

    },[socket])


    useEffect(()=>{
      if(!socket) return;
      if(!groupLocalStream) return;
      if(!peera) return;

      socket.on("checkEnd",(removedPeer)=>{
          if(removedPeer===peera.id){
            let peerz = []
            remoteStreamRef.current.forEach((stream)=>{
             peerz.push(stream.peerId)
            })
            peerz.forEach((peerId)=>{
              peers[peerId].close()
            })
           peers.splice(0,peers.length)
           groupLocalStream.getTracks().forEach((track)=>{
            track.stop()
          })
          dispatch(changeGroupVidCallModal(false))
          dispatch(changeGroupCallDetails(null))
          setGroupLocalStream(null)
          setGroupRemoteStream([])
          remoteStreamRef.current = [];
          reference.current = false;
          callType.current = null;
          }
          if(removedPeer===peera.id) return;

         if(peers[removedPeer]){
           peers[removedPeer].close()
           peers.splice(removedPeer,1)
           if(remoteStreamRef.current.length<=1){
            groupLocalStream.getTracks().forEach((track)=>{
              track.stop()
            })
            dispatch(changeGroupVidCallModal(false))
            dispatch(changeGroupCallDetails(null))
            setGroupLocalStream(null)
            setGroupRemoteStream([])
            remoteStreamRef.current = [];
            reference.current = false;
            callType.current = null;
            mutedRef.current = []
            setMutedUsers(mutedRef.current)
           }
           else{
            const streamFilter = remoteStreamRef.current.filter((stream)=>stream.peerId!==removedPeer)
            const ids = streamFilter.map((o)=>o.peerId)
            const filtered = streamFilter.filter(({peerId}, index) => !ids.includes(peerId, index + 1))
            remoteStreamRef.current = filtered;
            setGroupRemoteStream(filtered)
            const mutedFilter = mutedRef.current.filter((item)=>item!==removedPeer)
            mutedRef.current = mutedFilter;
            setMutedUsers(mutedRef.current)
           }

         }

      })

    },[socket,groupLocalStream,peera])


    useEffect(()=>{
      if(!socket) return;
      socket.on("CallCanc",()=>{
        dispatch(changeGroupCallAnswerModal(false))
        dispatch(changeGroupCallDetails(null))
        groupLocalStream?.getTracks()?.forEach((track)=>{
          track.stop()
        })
        setGroupLocalStream(null)
        callType.current = null;
        reference.current = false;
      })

    },[socket,groupLocalStream])

    useEffect(()=>{
      if(!socket) return;
      if(!groupCallDetails) return;
      socket.on("userOut",(id)=>{
       if(groupCallDetails.initiator===id){
        dispatch(changeGroupCallAnswerModal(false))
        dispatch(changeGroupCallDetails(null))
        groupLocalStream?.getTracks()?.forEach((track)=>{
          track.stop()
        })
        setGroupLocalStream(null)
        callType.current = null;
        reference.current = false;
       }
      })

    },[socket,groupCallDetails,groupLocalStream])
    
    useEffect(()=>{
      if(!socket) return;
      if(!groupLocalStream) return;
      socket.on("groupUserOut",(peerId)=>{
        if(peers[peerId]){
          peers[peerId].close()
          peers.splice(peerId,1)
          if(remoteStreamRef.current.length===1){
           groupLocalStream.getTracks().forEach((track)=>{
             track.stop()
           })
           dispatch(changeGroupVidCallModal(false))
           dispatch(changeGroupCallDetails(null))
           setGroupLocalStream(null)
           setGroupRemoteStream([])
           remoteStreamRef.current = [];
           reference.current = false;
           callType.current = null;
           mutedRef.current = []
           setMutedUsers(mutedRef.current)
          }
          else{
           const streamFilter = remoteStreamRef.current.filter((stream)=>stream.peerId!==peerId)
           const ids = streamFilter.map((o)=>o.peerId)
           const filtered = streamFilter.filter(({peerId}, index) => !ids.includes(peerId, index + 1))
           remoteStreamRef.current = filtered;
           setGroupRemoteStream(filtered)
           const mutedFilter = mutedRef.current.filter((item)=>item!==peerId)
           mutedRef.current = mutedFilter
           setMutedUsers(mutedRef.current)
          }

        }
      })

    },[socket,groupLocalStream])

    // Not Needed Right Now
    // useEffect(()=>{
    //   if(!socket) return;
    //    socket.on("calleeisBusy",()=>{
    //      busyMems.current +=1;
    //      console.log(busyMems.current,"BusyMems",currUser.members.length)

    //      if(busyMems.current===currUser.members.length-1){
    //       dispatch(changeGroupBusy(true))
    //       reference.current = false;
    //       dispatch(changeGroupCallDetails(null))
    //       callType.current = null;
    //       busyMems.current = 0;
       
    //       setTimeout(()=>{
    //         dispatch(changeGroupVoiceModal(false))
    //       dispatch(changeGroupVideoModal(false))
    //       dispatch(changeGroupBusy(false))
    //       },5000)
    //      }
         
    //    })
    //     },[socket,currUser])

    useEffect(()=>{
        if(!peera) return;
        if(!groupLocalStream) return;
        if(!groupCallDetails) return;
        if(!socket) return;
        if(!userData?.id) return;
        const CallerAnswer=async()=>{
          if(!groupCallDetails) return;
               peera&&peera.on('call',call=>{
                call.answer(groupLocalStream)
                call.on('stream',(videoStr)=>{
                  groupRemoteStream.push({
                      user:null,
                      name:null,
                      img:null,
                      stream:videoStr,
                      peerId:call.peer
                })
                const ids = groupRemoteStream.map((o)=>o.peerId)
                const filtered = groupRemoteStream.filter(({peerId}, index) => !ids.includes(peerId, index + 1))
                remoteStreamRef.current = filtered;
                setGroupRemoteStream(filtered)
                })
              peers[call.peer] = call;
              call.on("close",()=>{
                  console.log("closed")
               })
              })
              peera&&peera.on('connection', function (conn) {
                conn.on('data', function (data) {
                    streamData.push(data)
                    const ids = streamData.map((o)=>o.peerId)
                    const filtered = streamData.filter(({peerId}, index) => !ids.includes(peerId, index + 1))
                    streamDataRef.current = filtered;
                    setStreamData(filtered)
                });
            });
        }
        CallerAnswer()
       },[peera,socket,groupCallDetails,groupLocalStream,userData?.id])


      //  useEffect(()=>{
      //   if(!streamData || streamData.length===0) return;
      //   streamDataRef.current.forEach((data)=>{
      //     remoteStreamRef.current.forEach((stream)=>{
      //       if(data.peerId===stream.peerId){
      //         let newObj={
      //           user:data.user,
      //           name:data.name,
      //           stream:stream.stream,
      //           peerId:data.peerId
      //         }
      //         let newArr = []
      //         const filter = remoteStreamRef.current.filter((item)=>item.peerId!==data.peerId)
      //         newArr.push(newObj,...filter)
      //         console.log(newArr,'jjjjajjjajaja')
      //         setGroupRemoteStream(newArr)

      //       }
      //     })
      //   })

      //  },[streamData])

      //  useEffect(()=>{
      //   if(!socket) return;
      //   if(!remStreamDup || remStreamDup.length===0) return;
      //   remoteStreamRef.current.forEach((stream)=>{
      //     console.log("streams",stream)
      //     socket.emit("getDetails",{
      //       peerId:stream.peerId,
      //       id:userData.id
      //   })
      //   })

      //  },[socket,remStreamDup])

      //  useEffect(()=>{
      //      if(!socket) return;
      //      socket.on("takeDetails",({user,peerId,name})=>{
      //        console.log("running",user,name)
      //        const filter = remoteStreamRef.current.filter((item)=>item.peerId===peerId)
      //        const otherStreams = remoteStreamRef.current.filter((item)=>item.peerId!==peerId)
      //        const filteredItem = filter[0]
      //       const newItem = {
      //           ...filteredItem,
      //           user:user,
      //           name:name
      //       }
      //      setGroupRemoteStream([...otherStreams,newItem])
      //      })

      //  },[socket])


   useEffect(()=>{
    if(!socket) return;
    if(!peera) return;
    if(!groupLocalStream) return;
    socket.on('userCame',(data)=>{
      busyMems.current = 0;
      if(groupCallTimeout?.current){
        clearTimeout(groupCallTimeout.current)
        groupCallTimeout.current = null;
      }
          callHim(data)
      })
   },[socket,peera,groupLocalStream])

   const callHim=(data)=>{
    const call = peera.call(data.peerId,groupLocalStream);
    call.on('stream',newStream=>{
      groupRemoteStream.push({
          stream:newStream,
          user:data.user,
          name:data.name,
          img:data.img,
          peerId:data.peerId
   })
   const peerConn = peera.connect(data.peerId)
   peerConn.on("open",()=>{
    peerConn.send({
      user:userData.id,
      peerId:peera.id,
      name:userData.fullName,
      img:userData.img
    })
   })
  
   const ids = groupRemoteStream.map((o)=>o.peerId)
   const filtered = groupRemoteStream.filter(({peerId}, index) => !ids.includes(peerId, index + 1))
   remoteStreamRef.current = filtered;
   setGroupRemoteStream(filtered)
    })
    peers[data.peerId] = call;
    dispatch(changeGroupVideoModal(false))
   dispatch(changeGroupVidCallModal(true))
    call?.on('close',()=>{
        console.log("Call Closed!")
    })
   }


    useEffect(()=>{
        if(!socket) return;
        socket.on("groupCallComing",(data)=>{
          if(reference.current===true){
            socket.emit("calleeBusy",data.initiator)
          }
          else{
            if(data.callType==="groupvideo"){
              callComing(data)
            }
            else{
              voiceCallComing(data)
            }
          }
          }
        )
      },[socket])
    
      async function callComing(data){
          dispatch(changeGroupCallDetails(data))
            callType.current = "groupvideo"
        dispatch(changeGroupCallAnswerModal(true))
        reference.current = true;
        const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true})
       setGroupLocalStream(stream)
       let newTimes = setTimeout(()=>{
        dispatch(changeGroupCallAnswerModal(false))
        dispatch(changeGroupCallDetails(null))
       callType.current = null;
       reference.current = false;
       groupLocalStream?.getTracks()?.forEach((track)=>{
         track.stop()
       })
       },15000)
       calleeTimeout.current = newTimes;
      }

      const voiceCallComing=()=>{

      }

      const callAnswer=()=>{
        clearTimeout(calleeTimeout.current)
        calleeTimeout.current = null;
        dispatch(changeGroupCallAnswerModal(false))
        dispatch(changeGroupVidCallModal(true))
       socket.emit("joinRoom",{
           roomId:groupCallDetails.roomId,
           peerId:peera.id,
           name:userData.fullName,
           user:userData.id,
           img:userData.img
       })
      }

      const muteUser=(stream)=>{
        stream.getAudioTracks().forEach((track)=>{
          track.enabled = false;
        })
        setGroupRemoteStream(groupRemoteStream)
        setRender(!render)
      }
      const unMuteUser=(stream)=>{
        stream.getAudioTracks().forEach((track)=>{
          track.enabled = true;
        })
        setGroupRemoteStream(groupRemoteStream)
        setRender(!render)
      }

      const fullScreen=(e)=>{
      const parentNode = e.currentTarget.parentNode;
      const videoElem = parentNode.getElementsByTagName('video')[0]
        if(!videoElem.fullscreenElement){
          if (videoElem.requestFullscreen) {
            videoElem.requestFullscreen();
          } else if (videoElem.webkitRequestFullscreen) {
            videoElem.webkitRequestFullscreen();
          } else if(videoElem.parentNode.msRequestFullscreen) {
            videoElem.msRequestFullscreen();
          }
        }
      }

      const handleVideoOff=async()=>{
        const videoTracks = groupLocalStream.getVideoTracks()
        videoTracks[0].enabled = false;
        setVideoOff(true)
        let peerz=[]
        groupRemoteStream.forEach((stream)=>{
          peerz.push(stream.peerId)
        })

        socket.emit("videoOff",{
          id:peera.id,
          peerz
        })
        }
      
        const handleVideoOn=async()=>{
          const videoTracks = groupLocalStream.getVideoTracks()
          videoTracks[0].enabled = true;
          setVideoOff(false)
          let peerz=[]
          groupRemoteStream.forEach((stream)=>{
            peerz.push(stream.peerId)
          })
  
          socket.emit("videoOn",{
            id:peera.id,
            peerz
          })
          }

          const handleAudioOff=()=>{
            const audioTracks = groupLocalStream.getAudioTracks()
            audioTracks.forEach((track)=>{
              track.enabled = false;
            })
            setAudioOff(true)
            let peerz=[]
            groupRemoteStream.forEach((stream)=>{
              peerz.push(stream.peerId)
            })
            socket.emit("audioOff",{
              id:peera.id,
              peerz
            })
            }
        
          const handleAudioOn=()=>{
            const audioTracks = groupLocalStream.getAudioTracks()
            audioTracks.forEach((track)=>{
              track.enabled = true
            })
            setAudioOff(false)
            let peerz=[]
            groupRemoteStream.forEach((stream)=>{
              peerz.push(stream.peerId)
            })
    
            socket.emit("audioOn",{
              id:peera.id,
              peerz
            })
      
          }

          const handleScreenOn=async()=>{
            let screena = await navigator.mediaDevices.getDisplayMedia({video:true,audio:true})
           groupLocalStream.getTracks().forEach((track)=>{
             if(track.kind==="video"){
               groupLocalStream.removeTrack(track)
             }
           })
           groupLocalStream.addTrack(screena.getVideoTracks()[0])
           if(screena.getAudioTracks()[0]){
             groupLocalStream.addTrack(screena.getAudioTracks()[0])
           }
           let peerIds=[];
           groupRemoteStream.forEach((item)=>{
             peerIds.push(item.peerId)
           })
           peerIds.forEach((peer)=>{
            const call = peera.call(peer,groupLocalStream)
            peers[peer] = call;
            call.on("close",()=>{
              console.log("closed")
            })
           })
            setScreenShareOn(true)
           }

           const handleScreenOff=async()=>{
            const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true})
           groupLocalStream.getTracks().forEach((item)=>{
             item.stop()
             groupLocalStream.removeTrack(item)
           })
           groupLocalStream.addTrack(stream.getVideoTracks()[0])
           groupLocalStream.addTrack(stream.getAudioTracks()[0])
           let peerIds = []
           groupRemoteStream.forEach((item)=>{
             peerIds.push(item.peerId)
           })
           peerIds.forEach((peer)=>{
            const call = peera.call(peer,groupLocalStream)
            peers[peer] = call;
            call.on("close",()=>{
              console.log("closed")
             })
           })
            setScreenShareOn(false)
           }

           const handleRearCam=async()=>{
            let screena = await navigator.mediaDevices.getUserMedia({video:{
              facingMode:'environment'
            }})
           groupLocalStream.getTracks().forEach((track)=>{
             if(track.kind==="video"){
               groupLocalStream.removeTrack(track)
             }
           })
           groupLocalStream.addTrack(screena.getVideoTracks()[0])
           if(screena.getAudioTracks()[0]){
             groupLocalStream.addTrack(screena.getAudioTracks()[0])
           }
           let peerIds=[]
           groupRemoteStream.forEach((item)=>{
             peerIds.push(item.peerId)
           })
           peerIds.forEach((peer)=>{
            const call = peera.call(peer,groupLocalStream)
            peers[peer] = call;
            call.on("close",()=>{
                console.log("closed")
            })
           })
            setScreenShareOn(true)
           }

           const handleRecording=(peerId,stream)=>{
             if(recordingOn){
               setRecordingOn(false)
               setCurrentRecording()
               mediaRecorder.current.stop()
               setRecordingPaused(false)
               mediaRecorder.current = null;
           
             }
             else{
               setRecordingOn(true)
               setCurrentRecording(peerId)
               mediaRecorder.current= new MediaRecorder(stream)
               mediaRecorder.current.ondataavailable = handleData;
               mediaRecorder.current.start()
             }
           }

           const handleData=(e)=>{
            collectedChunks.splice(0,collectedChunks.length)
           if(e.data.size>0){
           collectedChunks.push(e.data)
           
           downloadStream()
           }
          }

          const downloadStream=()=>{
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

          const pauseRecording=()=>{
            mediaRecorder.current.pause()
            setRecordingPaused(true)
          }

          const resumeRecording=()=>{
            mediaRecorder.current.resume()
            setRecordingPaused(false)
          }

          const callCancelled=()=>{
            groupLocalStream.getTracks().forEach((track)=>{
              track.stop()
            })
            setGroupLocalStream(null)
            dispatch(changeGroupVideoModal(false))
            dispatch(changeGroupCallDetails(null))
            callType.current= null
            reference.current = false;
            let othermems = currUser.members.filter((item)=>item!==userData.id)
            busyMems.current = 0;
            socket.emit("groupInitiatorLeft",othermems)
          }

          const declineCall=()=>{
            groupLocalStream?.getTracks()?.forEach((track)=>{
              track.stop()
            })
            setGroupLocalStream(null)
            dispatch(changeGroupCallAnswerModal(false))
            dispatch(changeGroupCallDetails(null))
            callType.current= null
            reference.current = false;
          }

          const endCall=()=>{
            let peerz = []
            groupRemoteStream.forEach((stream)=>{
             peerz.push(stream.peerId)
            })
            peerz.forEach((peerId)=>{
              peers[peerId].close()
            })
            socket.emit("groupCallEnd",{
              peers:peerz,
              removedPeer:peera.id
            })
            setPeers([])
            dispatch(changeGroupVidCallModal(false))
            dispatch(changeGroupCallDetails(null))
            groupLocalStream?.getTracks()?.forEach((track)=>{
              track.stop()
            })
            setGroupLocalStream(null)
            setGroupRemoteStream([])
            remoteStreamRef.current = [];
            reference.current = false;
            callType.current = null;
            mutedRef.current = []
            setMutedUsers(mutedRef.current)
          }

          const removeAttendee=(peerId)=>{
             peers[peerId].close()
             peers.splice(peerId,1)
             let peerz = []
             groupRemoteStream.forEach((stream)=>{
              peerz.push(stream.peerId)
             })
             const remoteStreamFilter = groupRemoteStream.filter((item)=>item.peerId!==peerId)
             remoteStreamRef.current = remoteStreamFilter;
             if(remoteStreamRef.current.length===0){
              groupLocalStream.getTracks().forEach((track)=>{
                track.stop()
              })
              dispatch(changeGroupVidCallModal(false))
              dispatch(changeGroupCallDetails(null))
              setGroupLocalStream(null)
              setGroupRemoteStream([])
              remoteStreamRef.current = [];
              reference.current = false;
              callType.current = null;
              mutedRef.current = []
              setMutedUsers(mutedRef.current)
             }
             else{
              setGroupRemoteStream(remoteStreamFilter)
              const mutedFilter = mutedRef.current.filter((item)=>item!==peerId)
              mutedRef.current = mutedFilter
              setMutedUsers(mutedRef.current)
             }
             socket.emit("groupCallEnd",{
              peers:peerz,
              removedPeer:peerId
            })
             
          }



  return (
    <div className='z-30'>
                      {groupvideoModal&&
      <div style={{top:"0",left:"0",backgroundColor:"#4A4453",maxWidth:'100%',minWidth:'100vw',minHeight:'100vh',maxHeight:'100%'}} className=' absolute z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
        <img className=' w-36 h-36 rounded-full border-2 border-white' src={currUser.img} alt="img"></img>
        <span className=' text-white text-center text-5xl'>{currUser?.name?.toUpperCase()}</span>
        <span className=' text-gray-300 text-2xl text-center font-medium'>{groupUnanswered?'Call Unanswered!':groupBusy?'All Group Members Are Busy!':'Calling Members...'}</span>
        <button onClick={callCancelled} disabled={groupUnanswered || groupBusy} className=' cursor-pointer text-white bg-red-500 rounded-full hover:bg-red-700 disabled:hidden'><i className="fa-solid fa-phone-flip p-4"></i></button>
      </div>
}
{groupCallAnswerModal&&
      <div style={{top:"0",left:"0",backgroundColor:"#4A4453"}} className=' absolute w-full h-full z-20 text-white rounded-md flex flex-col items-center gap-6 justify-center'>
        <img className=' w-36 h-36 rounded-full border-2 border-white' src={groupCallDetails?.groupImg} alt="imgg"></img>
        <span className=' text-white text-center text-5xl'>{groupCallDetails?.name?.toUpperCase()}</span>
        <span className=' text-gray-300 text-2xl'>Hammad Has Invited You To {groupCallDetails.callType==="groupvideo"?'Video':'Voice'} Call In {groupCallDetails?.groupName} </span>
        <div className=' flex justify-between space-x-16 items-center'>
        <button onClick={declineCall} className=' cursor-pointer text-white bg-red-500 rounded-full hover:bg-red-700'><i className="fa-solid fa-phone-flip p-4"></i></button>
        <button disabled={!groupLocalStream} onClick={callAnswer} className=' cursor-pointer text-white bg-green-500 rounded-full hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:pointer-events-none'><i className="fa-solid fa-phone p-4"></i></button>
        </div>
      </div>
}
{groupVidCallModal&&
<div style={{top:"0",left:"0",minHeight:"100vh",minWidth:"100vw"}} className=' z-30 absolute flex-wrap bg-gray-700 space-x-1 text-white flex overflow-x-hidden overflow-y-hidden'>
  <div className=' relative bg-gray-800' style={{maxWidth:"50vw",maxHeight:"50vh",minWidth:"10vw",minHeight:"10vh"}}>
  <span style={{top:"0",right:"0"}} className='absolute bg-orange-700 px-2'>Me</span>
  {groupLocalStream.getAudioTracks()[0].enabled===false&&<i style={{bottom:"0",right:"0"}} className="fa-solid fa-volume-xmark absolute cursor-pointer text-white text-xl p-2 z-10" title='You Are Muted'></i>}
  {groupLocalStream.getVideoTracks()[0].enabled===false?
<div style={{maxWidth:"50vw",maxHeight:"50vh",minWidth:"25vw",minHeight:"30vh"}} className=' flex flex-col items-center justify-end p-1'>
 <img className=' w-20 h-20 rounded-full border-2 border-white cursor-pointer' src={userData.img} alt="img"></img>
 <span className=' text-2xl font-light pt-1'>Me</span>
 </div>:
 <div>
  <video style={{maxWidth:"50vw",maxHeight:"50vh",minWidth:"10vw",minHeight:"10vh"}} ref={ref=>ref?ref.srcObject=groupLocalStream:''} muted autoPlay></video>
  </div>
}
    </div>
    {groupRemoteStream&&groupRemoteStream.map((stream)=>
    <div key={stream.peerId} className=' relative bg-gray-800' style={{maxWidth:"50vw",maxHeight:"50vh",minWidth:"10vw",minHeight:"10vh"}}>
        <div>
       {stream.name!==null?
        <span style={{top:"0",right:"0"}} className='absolute bg-green-700 px-2 z-50'>{stream.name}</span>:
        streamData.map((data)=>data.peerId===stream.peerId&&<span style={{top:"0",right:"0"}} className='absolute bg-green-700 px-2 z-50'>{data.name}</span> 
        )
       }
       {stream.stream.getVideoTracks()[0].enabled===false&&mutedUsers.includes(stream.peerId)?'':<div style={{top:"0",left:"0"}} className={`absolute ${recordingOn===true&&currentRecording===stream.peerId?'w-40':'w-10'} duration-500 transition-all px-2 my-1 mx-1 z-50 overflow-hidden space-x-4 py-1 bg-black rounded-lg flex items-center`}>
         <button disabled={recordingOn&&currentRecording!==stream.peerId} className='cursor-pointer disabled:cursor-not-allowed' onClick={()=>handleRecording(stream.peerId,stream.stream)} title={recordingOn?currentRecording===stream.peerId?'Download Recording':'Close The Current Recording To Be Able To Record This Stream':'Record Stream'}><i className="fa-solid fa-record-vinyl text-2xl"></i></button>
         {!recordingPaused?<i onClick={pauseRecording} className="fa-solid fa-pause cursor-pointer text-xl" title="Pause Recording"></i>:<i onClick={resumeRecording} className="fa-solid fa-play cursor-pointer text-xl" title="Resume Recording"></i>}
         <span className={`${!recordingPaused?'animate-pulse':'animate-none'} duration-300`}>Recording</span>
         </div>}
         {
         stream.stream.getVideoTracks()[0].enabled===false?
         stream.name!==null?
         <div style={{maxWidth:"50vw",maxHeight:"50vh",minWidth:"25vw",minHeight:"30vh"}} className=' flex flex-col items-center justify-end p-1'>
          <img className=' w-20 h-20 rounded-full border-2 border-white cursor-pointer' src={stream.img} alt="img"></img>
          <span className=' text-2xl font-light pt-1'>{stream.name}</span>
          </div>
          :
          streamData.map((item)=>stream.peerId===item.peerId&&
          <div style={{maxWidth:"50vw",maxHeight:"50vh",minWidth:"25vw",minHeight:"30vh"}} className=' flex flex-col items-center justify-end p-1'>
          <img className=' w-20 h-20 rounded-full border-2 border-white cursor-pointer' src={item.img} alt="img"></img>
          <span className=' text-2xl font-light pt-1'>{item.name}</span>
          </div>
          )
         :
         <div>
       <video style={{maxWidth:"50vw",maxHeight:"50vh",minWidth:"10vw",minHeight:"10vh"}} autoPlay ref={b=>b?b.srcObject=stream.stream:''}></video>
       <span onClick={fullScreen} style={{top:"90.5%",left:"0"}} className=' absolute'><i className="fa-solid fa-expand text-xl cursor-pointer px-2 hover:text-gray-300" title="Enlarge Video"></i></span>
       </div>
}
      <div style={{top:"90%",right:"0"}} className=' absolute z-50 space-x-3 px-2'>
      {mutedUsers.includes(stream.peerId)?<i className="fa-solid fa-volume-xmark text-xl text-gray-100 cursor-not-allowed" title="User Is Already Muted"></i>:stream.stream?.getAudioTracks()[0].enabled?<i onClick={()=>muteUser(stream.stream)} className="fa-solid fa-volume-high text-xl cursor-pointer hover:text-gray-300" title="Mute User"></i>:<i onClick={()=>unMuteUser(stream.stream)} className="fa-solid fa-volume-xmark text-xl cursor-pointer hover:text-gray-300" title="Unmute User"></i>}
      {groupCallDetails?.admin?.includes(userData?.id) || groupCallDetails?.initiator===userData?.id ? <i onClick={()=>removeAttendee(stream.peerId)} className="fa-solid fa-user-slash text-xl cursor-pointer hover:text-gray-300" title="Remove Attendee"></i> :''}
      </div>
      </div>
    </div>
    )
    }
       <div style={{bottom:"2%",left:"45%"}} className=" absolute w-max h-max z-30 px-4 py-2 bg-gray-600 rounded-md space-x-4">
    {!videoOff?<i onClick={handleVideoOff} className="fa-solid fa-video-slash p-2 rounded-full text-white bg-green-600 cursor-pointer text-2xl hover:bg-green-800" title="Turn Off Video"></i>:<i onClick={handleVideoOn} className="fa-solid fa-video p-2 rounded-full text-white bg-green-600 cursor-pointer text-2xl hover:bg-green-800" title="Turn On Video"></i>}
    {!audioOff?<i onClick={handleAudioOff} className="fa-solid fa-microphone-slash p-2 rounded-full text-white bg-orange-600 cursor-pointer text-2xl hover:bg-orange-800" title="Turn Off Audio"></i>:<i onClick={handleAudioOn} className="fa-solid fa-microphone text-2xl px-4 py-2 rounded-full text-white bg-orange-600 hover:bg-orange-800 cursor-pointer" title="Turn On Audio"></i>}
    <i onClick={endCall} className="fa-solid fa-phone px-3 py-2 rounded-full text-white bg-red-600 hover:bg-red-800 cursor-pointer text-2xl" title='End Call'></i>
    {!screenShareOn?!mobile?<i onClick={handleScreenOn} className="fa-solid fa-desktop px-3 py-2 rounded-full text-white bg-blue-400 hover:bg-blue-600 cursor-pointer text-2xl" title="Start Screen Sharing"></i>:<i onClick={handleRearCam} className="fa-solid fa-camera-rotate px-3 py-2 rounded-full text-white bg-blue-400 hover:bg-blue-600 cursor-pointer text-2xl" title="Switch Camera"></i>:<i onClick={handleScreenOff} className="fa-solid fa-camera text-2xl px-3 py-2 rounded-full text-white bg-blue-400 hover:bg-blue-600 cursor-pointer" title="End Screen Sharing"></i>}
  </div>
</div>
}
    </div>
  )
}

export default GroupCall