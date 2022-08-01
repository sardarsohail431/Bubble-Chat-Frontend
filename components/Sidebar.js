import React from 'react'
import { db } from '../firebase';
import { useState,useRef } from 'react';
import { doc, setDoc,getDoc,query,where,getDocs,collection,updateDoc }  from "firebase/firestore"; 
import { getStorage,ref,getDownloadURL,uploadBytesResumable } from 'firebase/storage';
import {useEffect} from 'react'
import {useSelector,useDispatch} from 'react-redux'
import {changeConv,changeUser,changeUpdate} from '../redux/convRedux'
import { v4 as uuidv4 } from 'uuid';
import {toast,Toaster} from 'react-hot-toast'


const Sidebar = ({userData,socket,updateVal,flex}) => {
   const[searchItems,setSearchItems] = useState([])
   const[filteredarr,setFilteredArr] = useState([])
   const[allConvos,setAllConvos] = useState([])
   const[Convos,setConvos]=useState([])
   const[finalConvos,setFinalConvos]=useState([])
   const[groupAdded,setGroupAdded] = useState(false)
   const[fetched,setFetched] = useState(true)
   const groupModal= useRef()
   const[searchedMembers,setSearchedMembers] = useState([])
   const[selectedMembers,setSelectedMembers] = useState([])
   const[groups,setGroups] = useState([])
   const[lastMessage,setLastMessage] = useState(null)
   const[lastGroupMessage,setLastGroupMessage] = useState(null)
   const[file,setFile] = useState()
   const[progress,setProgress] = useState()
   const[details,setDetails] = useState({})
   const[selMembers,setSelMembers] = useState([])
   const[filteredGroups,setFilteredGroups] = useState([])
   const groupRef = useRef(false)
   const[render,setRender] = useState(false)
   const renderRef = useRef(false)
   const fullConvos = useRef([])

   const props = userData;

   const dispatch = useDispatch()
   const currConvo = useSelector(state=>state.conv.currConv)
   const update = useSelector(state=>state.conv.updateConv)

  useEffect(()=>{
   if(!socket) return;
   socket.on("YouAdded",()=>{
    setGroupAdded(!groupRef.current)
    groupRef.current = !groupRef.current
   })
  },[socket])

  useEffect(()=>{
    if(!socket) return;
    socket.on("msgHandle",()=>{
      dispatch(changeUpdate(!updateVal.current))
      updateVal.current = !updateVal.current;
    })

  },[socket])

  useEffect(()=>{
    if(!socket) return;
    socket.on("msgHandleGroup",()=>{
      dispatch(changeUpdate(!updateVal.current))
      updateVal.current = !updateVal.current;
    })

  },[socket])

  useEffect(()=>{
    if(groups.length===0) {
      setFilteredGroups([])
    }
    if(groups.length===0) return;
    const getData=async()=>{
      filteredGroups.splice(0,filteredGroups.length)
     for(let i=0;i<groups.length;i++){
      const q = query(collection(db, "groupmessages"), where("convId", "==", groups[i].id));
      const querySnapshot = await getDocs(q);
      if(!querySnapshot.empty){
       let newArr=[]
       querySnapshot.forEach((doc) => {
          newArr.push(doc.data())
         });
         let arrSort = newArr.sort(function(a, b){return b.timestamp - a.timestamp});
         filteredGroups.push({
           ...groups[i],
           lastmsg:arrSort[0],
         })
      }
      else{
        filteredGroups.push({
          ...groups[i],
          lastmsg:null,
        })
      }
     }
     const ids = filteredGroups.map((o)=>o.id)
     const filtered = filteredGroups.filter(({id}, index) => !ids.includes(id, index + 1))
     setFilteredGroups(filtered)
    } 
   getData()
  },[groups,update])


  useEffect(()=>{
if(!userData) return;
   const getConvos=async()=>{
     try{
      const qa = query(collection(db, "conversations"), where("members", 'array-contains',userData.id));
      const mySnaps = await getDocs(qa);
      mySnaps.forEach((doc) => {
         allConvos.push({
           id:doc.id,
           data:doc.data()
         });
       });


      allConvos.forEach((item)=>{
         const filter = item.data.members.filter((i)=>i!==userData.id);
         const finalObj = {
           convId:item.id,
           perId:filter,
         }
         Convos.push(finalObj)
       })
       const ids = Convos.map((o)=>o.convId)
       const filtered = Convos.filter(({convId}, index) => !ids.includes(convId, index + 1))
       setConvos(filtered)

     }
     catch(err){
       console.log(err)
     }
     } 
     
   getConvos()
  },[userData,update,userData?.deletedChats])

  useEffect(()=>{
    if(Convos.length===0) return;
    Convos.forEach((item)=>{
      const getData=async()=>{
       const convData = doc(db, "users", item.perId[0]);
       const  newData = await getDoc(convData)
       const q = query(collection(db, "messages"), where("convId", "==", item.convId));
       const querySnapshot = await getDocs(q);
       if(!querySnapshot.empty){
        let newArr=[]
        querySnapshot.forEach((doc) => {
           newArr.push(doc.data())
          });
          let arrSort = newArr.sort(function(a, b){return b.timestamp - a.timestamp});
          finalConvos.push({
            username:newData.get('username'),
            name:newData.get('fullName'),
            email:newData.get('email'),
            img:newData.get('img'),
            lastmsg:arrSort[0],
            id:newData.id,
            convId:item.convId
          })
       }
       else{
          finalConvos.push({
            username:newData.get('username'),
            name:newData.get('fullName'),
            email:newData.get('email'),
            img:newData.get('img'),
            lastmsg:null,
            id:newData.id,
            convId:item.convId
          })
       }
        const ids = finalConvos.map((o)=>o.id)
        const filtered = finalConvos.filter(({id}, index) => !ids.includes(id, index + 1))
        fullConvos.current = finalConvos;
        let filteredArr = filtered
        filtered.forEach((item)=>{
          if(userData?.deletedChats.includes(item.id)){
           filteredArr = filteredArr.filter((atom)=>atom.id!==item.id)
          }
        })
        setFinalConvos(filteredArr)
      }
     getData()
    })
  },[Convos])


  useEffect(()=>{
   if(!userData?.id) return;
   const getGroupData=async()=>{
     groups.splice(0,groups.length)
     console.log(groups,'splice')
    const q = query(collection(db, "groups"), where("members", "array-contains", userData.id));
    const groupSnaps = await getDocs(q);
    groupSnaps.forEach((doc) => {
       groups.push({
        id:doc.id,
        ...doc.data()
      })
     });
     const ids = groups.map((o)=>o.id)
     const filtered = groups.filter(({id}, index) => !ids.includes(id, index + 1))
    setGroups(filtered)
    
   }
     getGroupData()
  },[userData?.id,groupAdded,update])



  const handleSearch=async(e)=>{
    if(!e.target.value){
      setSearchItems([])
      setFilteredArr([])
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
     searchItems.push({
       username,
       name,
       email,
       id,
       img
     })
    }
    })
    
const ids = searchItems.map((o)=>o.id)
const filtered = searchItems.filter(({id}, index) => !ids.includes(id, index + 1))
const moreFilter = filtered.filter((item)=>item.id!==props?.id)
setFilteredArr(moreFilter)

  }

  const handleClick=async(item)=>{
   if(userData?.deletedChats.includes(item.id)){
    try{
      const filter = userData?.deletedChats.filter((newItem)=>newItem!==item.id)
      const washingtonRef = doc(db, "users", userData?.id);
      await updateDoc(washingtonRef, {
        deletedChats:[...filter]
        });
        dispatch(changeUpdate(!updateVal.current))
        updateVal.current = !updateVal.current;
        const filtera = fullConvos.current.filter((i)=>i.id===item.id);
        dispatch(changeUser(filtera[0]))
        dispatch(changeConv({
          id:filtera[0].convId,
          type:'individual'
        }))
    }

    catch(err){
       console.log(err)
    }
   }
   if(userData?.deletedChats.includes(item.id)) return;
    let equal = false;
    finalConvos.forEach((atom)=>{
      if(atom.id===item.id){
        equal = true
      }
    })
    if(!equal){
      try{
        const id = uuidv4();
        await setDoc(doc(db, "conversations", id), {
          members:[
            item.id,
            props.id
          ]
        });
        setFetched(false)
        dispatch(changeUser({
          ...item,
          convId:id
        }))
        dispatch(changeConv({
          id:id,
          type:'individual'
        }))
        setConvos((prev)=>[...prev,{
          convId:id,
          perId:[item.id],
        }])
        setFetched(true)

      }
      catch(err){
        console.log(err)
      }
    }
     else{
       const filter = finalConvos.filter((i)=>i.id===item.id);
       dispatch(changeUser(filter[0]))
       dispatch(changeConv({
         id:filter[0].convId,
         type:'individual'
       }))
     }

  } 

  const handleConv=(i)=>{
    dispatch(changeUser(i))
    dispatch(changeConv({
      id:i.convId,
      type:'individual'
    }))
    dispatch(changeUpdate(!update))
    updateVal.current = !update;
  }

  const groupModalTrue=()=>{
   groupModal.current?groupModal.current.showModal():''
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
const moreFilter = filtered.filter((item)=>item.id!==props.id)
setSearchedMembers(moreFilter)

  }

const addMember=(member)=>{
   selMembers.push(member)
   const ids = selMembers.map((o)=>o.id)
   const filtered = selMembers.filter(({id}, index) => !ids.includes(id, index + 1))
  const moreFilter = filtered.filter((item)=>item.id!==props.id)
  setSelectedMembers(moreFilter)
  }

  const removeMember=(member)=>{
   const removeFilter = selectedMembers.filter((mem)=>mem.id!==member.id)
   setSelectedMembers(removeFilter)
  }

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
       }, 
       (error) => {
         console.log(error)
       }, 
       () => {
         getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
           setDetails({...details,img:downloadURL})
         });
       }
     );
     


   }

  const createGroup=async()=>{
    if(!details?.name||!details.img){
      toast.error("Please Fill Out The Correct Details!")
    }
    if(selectedMembers.length===0){
      toast.error("Please Select Members To Add As Well!")
    }
    if(selectedMembers.length===0) return;
    if(!details?.name) return;
    if(!details?.img) return;
    try{
    let ids = []
    selectedMembers.forEach((member)=>{
      ids.push(member.id)
    })
    const randId = uuidv4()
    await setDoc(doc(db, "groups", randId), {
      name: details.name,
      img: details.img,
      admin:[props.id],
      members:[...ids,props.id]
    });
    socket.emit('createGroup',ids)
    toast.success("Group Created Successfully!")
    groupModal.current&&groupModal.current.close()
  }
  catch(err){
    toast.error("Error Creating Group!")
  }
  }

  const handleGroup=(group)=>{
    dispatch(changeConv({id:group.id,type:"group"}))
    dispatch(changeUser({convId:group.id,name:group.name,img:group.img,members:group.members,admin:group.admin}))
    dispatch(changeUpdate(!update))
    updateVal.current = !update;
  }



  return (
    <div style={{flex:flex,minHeight:'86vh',maxHeight:'100vh',minWidth:'23vw'}} className=' shadow-lg rounded-md flex flex-col items-start py-1'>
      <Toaster position='bottom-left'/>
        <dialog ref={groupModal} className="hidden flex-col px-16 py-2 rounded-lg border-2 space-y-6 open:flex relative">
         <span onClick={()=>{groupModal.current&&groupModal.current.close()}} style={{top:"0",right:"0%"}} className=' px-3 py-1 rounded-full text-white bg-black cursor-pointer absolute'>X</span>
        <h1 className=' text-4xl text-black font-semibold'>Create New Group</h1>
        <input required onChange={(e)=>setDetails({...details,name:e.target.value})} placeholder='Group Name' type="text" className=' focus:outline-green-600 px-2 py-2 rounded-lg text-xl'></input>
        <div className=' flex  flex-col space-y-1'>
          <div className=' flex space-x-2 items-center'>
          <span className=' font-semibold'>Choose Image:</span>
          <input required onChange={handleImg} className=' font-medium' type="file"></input>
          </div>
          <div className=' flex items-center space-x-3'>
          {file&&<img className=' w-16 h-16 rounded-full border-2 border-green-600' src={file} alt="img"></img>}
          {progress>=0&&progress<100&&<div className=' text-lg text-center text-black'>{progress.toString().split('.')[0]}%</div>}
          </div>
        </div>
        <div className=' w-full'>
        <input onChange={handleSearchMembers} placeholder=' Search Members To Add' type="search" className=' focus:outline-green-600 px-2 py-2 rounded-lg w-full my-1'></input>
        <div className=' overflow-y-scroll flex flex-col space-y-1'>
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
        </div>
        {selectedMembers.length!==0&&
        <div className=' flex flex-col items-start space-y-2 w-full'>
          <h1 className=' text-2xl font-medium'>Selected Members</h1>
          <div style={{maxHeight:"20vh",maxWidth:"30vw"}} className=' flex space-x-3 overflow-y-scroll flex-wrap space-y-2 justify-start items-center'>
          {selectedMembers.map((member)=>
           <div className=' px-2 py-1 rounded-lg shadow-lg bg-slate-50 hover:bg-slate-100 flex items-center space-x-3'>
             <img className=' w-12 h-12 rounded-full ' src={member.img} alt="img"></img>
             <span className=' text-lg font-semibold'>@{member.username}</span>
             <i onClick={()=>removeMember(member)} className="fa-solid fa-minus text-lg text-center max-h-10 p-2 rounded-lg text-white bg-black cursor-pointer hover:bg-gray-600" title="Remove This Member"></i>
           </div>
          )
          }
          </div>
        </div>

        }
        <button onClick={createGroup} className=' px-2 py-2 rounded-xl text-white bg-green-600 hover:bg-green-800 cursor-pointer'>Create Group</button>
      </dialog>
      <input onChange={handleSearch} className=' rounded-full w-full py-2 border-2 border-gray-500 px-2' placeholder='Start a new conversation' type='search'></input>
      <div style={{maxHeight:"15vh"}} className=' flex flex-col items-start my-1 bg-slate-50 w-full overflow-y-scroll'>
      {filteredarr&&filteredarr.map((item)=>
      <div key={item.id} onClick={()=>handleClick(item)} className=' flex items-center cursor-pointer px-2 py-2 space-x-5 hover:bg-slate-100 w-full'>
        <img className=' w-10 h-10 rounded-full mx-1' src={item.img} alt={item.email}></img>
        <div className=' flex flex-col items-center space-y-1 '>
          <span className=' font-semibold'>@{item.username}</span>
          <span className=''>{item.name}</span>
        </div>
       
      </div>
      )}
      </div>
      <div className='p-1 flex flex-col items-start w-full'>
        <div className=' flex space-x-2'>
        <h1 className=' text-xl font-bold text-gray-600 space-y-2'>Conversations</h1>
        <i onClick={groupModalTrue} className="fa-solid fa-user-group bg-orange-400 hover:bg-orange-600 text-white text-xs cursor-pointer p-2 rounded-lg" title="Create New Group"></i>
        </div>
        <div style={{maxHeight:"27vh"}} className='overflow-y-scroll w-full'>
      {
        fetched?finalConvos.map((i)=>
        <div onClick={()=>handleConv(i)} key={i.id} className={`p-1 flex space-x-3 items-center cursor-pointer ${i.convId===currConvo?.id?'bg-slate-200':'bg-white'} ${i.convId!==currConvo?.id?'hover:bg-slate-100':''}`}>
          <img className=' w-12 h-12 rounded-full ' src={i.img} alt="img"></img>
          <div className=' flex flex-col items-start'>
          <span className=' text-lg font-semibold'>@{i.username}</span>
           {i.lastmsg!==null?
           <div className=' flex items-start'>
             {i.lastmsg?.sender===userData.id?
             <span className=' text-lg item'>{i.lastmsg?.seen===false?<span><i className="fa-solid fa-check"></i> {i.lastmsg?.type==="image"?<span><i className="fa-solid fa-image w-6 h-10"></i>Photo</span>:i.lastmsg?.type==="video"?<span><i className="fa-solid fa-video w-6 h-10"></i>Video</span>:i.lastmsg?.type==="audio"?<span><i className="fa-solid fa-headphones w-6 h-10"></i>Audio</span>:i.lastmsg?.type==="document"?<span><i className="fa-solid fa-file w-6 h-10"></i>Document</span>:i.lastmsg?.message}</span>:<span><i className="fa-solid fa-check-double"></i> {i.lastmsg?.type==="image"?<span><i className="fa-solid fa-image w-6 h-10"></i>Photo</span>:i.lastmsg?.type==="video"?<span><i className="fa-solid fa-video w-6 h-10"></i>Video</span>:i.lastmsg?.type==="audio"?<span><i className="fa-solid fa-headphones w-6 h-10"></i>Audio</span>:i.lastmsg?.type==="document"?<span><i className="fa-solid fa-file w-6 h-10"></i>Document</span>:i.lastmsg?.message}</span>}</span>
            :<span className=' text-lg font-medium'>{i.lastmsg?.seen?i.lastmsg?.type==="image"?<span><i className="fa-solid fa-image w-6 h-10"></i>Photo</span>:i.lastmsg?.type==="video"?<span><i className="fa-solid fa-video w-6 h-10"></i>Video</span>:i.lastmsg?.type==="audio"?<span><i className="fa-solid fa-headphones w-6 h-10"></i>Audio</span>:i.lastmsg?.type==="document"?<span><i className="fa-solid fa-file w-6 h-10"></i>Document</span>:i.lastmsg?.message:<span className=' text-lg font-bold'>New Message</span>}</span>
             }
           </div>
           :<span className=' text-lg'>{i.name}</span>}
            </div>
            
        </div>
        ):
        <div className=' my-1'>Fetching Data....</div>
}
</div>
      </div>
      {filteredGroups.length!==0&&
      <div className=' flex flex-col items-start space-y-2 w-full'>
      <h1 className=' font-bold text-xl p-1 text-gray-600'>Groups</h1>
      <div style={{maxHeight:'20vh'}} className="flex flex-col space-y-1 overflow-y-scroll overflow-x-hidden w-full">
      {filteredGroups.map((group)=>
       <div onClick={()=>handleGroup(group)} className={`flex items-center space-x-3 w-full hover:bg-slate-100 ${group.id===currConvo?.id?'bg-slate-200':''} hover:cursor-pointer mx-1`}>
        <img className=' w-12 h-12 rounded-full' src={group.img} alt={group.name}></img>
        <div className=' flex flex-col space-y-2'>
          <span className=' font-semibold text-lg'>{group.name}</span>
          {group.lastmsg!==null?
           <div className=' flex items-start'>
             {group.lastmsg?.sender===userData.id?
             <span className=' text-lg item'><span><i className="fa-solid fa-check"></i> {group.lastmsg?.type==="image"?<span><i className="fa-solid fa-image w-6 h-10"></i>Photo</span>:group.lastmsg?.type==="video"?<span><i className="fa-solid fa-video w-6 h-10"></i>Video</span>:group.lastmsg?.type==="audio"?<span><i className="fa-solid fa-headphones w-6 h-10"></i>Audio</span>:group.lastmsg?.type==="document"?<span><i className="fa-solid fa-file w-6 h-10"></i>Document</span>:group.lastmsg?.message}</span></span>
            :<span className=' text-lg font-medium'>{group.lastmsg.seen.includes(userData.id)?group.lastmsg?.type==="image"?<span><i className="fa-solid fa-image w-6 h-10"></i>Photo</span>:group.lastmsg?.type==="video"?<span><i className="fa-solid fa-video w-6 h-10"></i>Video</span>:group.lastmsg?.type==="audio"?<span><i className="fa-solid fa-headphones w-6 h-10"></i>Audio</span>:group.lastmsg?.type==="document"?<span><i className="fa-solid fa-file w-6 h-10"></i>Document</span>:group.lastmsg?.message:<span className=' text-xl font-extrabold'>New Message</span>}</span>
             }
           </div>
           :<span className=' text-lg'>Group Created!</span>}
          </div>
      </div>
      )
      }
      </div>
      </div>
      }
    </div>
  )
}

export default Sidebar