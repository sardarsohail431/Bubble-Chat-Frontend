import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCfW3-uYM3i7ykmEg2Q9pIxThuGzL3kyNc',
  authDomain: 'modern-chatapp.firebaseapp.com',
  projectId: 'modern-chatapp',
  storageBucket: 'modern-chatapp.appspot.com',
  messagingSenderId: '276195128562',
  appId: '1:276195128562:web:986047cde8561fa57bcc6b',
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(app);
