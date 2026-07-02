// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIHqtd1KHzKjd8MP45JJqxauyzz8IbJxc",
  authDomain: "reactnativeapp-5cbb4.firebaseapp.com",
  projectId: "reactnativeapp-5cbb4",
  storageBucket: "reactnativeapp-5cbb4.firebasestorage.app",
  messagingSenderId: "1016632280855",
  appId: "1:1016632280855:web:ad99092b96d90f0c309952",
  measurementId: "G-KNJP0J2GLP",
  databaseURL: "https://reactnativeapp-5cbb4-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const database = getDatabase(app);