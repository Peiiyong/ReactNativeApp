// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

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

export const auth = (() => {
  if (Platform.OS === "web") {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();
export const database = getDatabase(app);
export const storage = getStorage(app);