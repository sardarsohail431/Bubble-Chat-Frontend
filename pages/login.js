import Login from '../components/Login'
import React from 'react'
import { useEffect } from 'react'
import Router from 'next/router'
import {useSelector} from 'react-redux'
import  Head  from 'next/head'

const Loginn = () => {
   const user = useSelector(state=>state.user.currUser)

  useEffect(()=>{
    const {pathname} = Router
    if(user){
      if(pathname == '/login' ){
          Router.push('/')
      }
    }
  },[user])
  return (
    <div>
      <Head>
        <title>Login</title>
      </Head>
      <Login/>
    </div>
  )
}

export default Loginn