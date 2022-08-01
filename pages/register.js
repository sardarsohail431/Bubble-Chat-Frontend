import React from 'react'
import Register from '../components/Register';
import {useSelector} from 'react-redux';
import { useEffect } from 'react';
import Router from 'next/router';
import Head from 'next/head'

const Registerr = () => {
const user = useSelector(state=>state.user.currUser);

useEffect(()=>{
  const {pathname} = Router
  if(user){
    if(pathname == '/register' ){
        Router.push('/')
    }
  }
},[user])
  return (
    <div>
      <Head>
        <title>Register</title>
      </Head>
        <Register/>
    </div>
  )
}

export default Registerr