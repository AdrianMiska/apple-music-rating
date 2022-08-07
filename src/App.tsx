import React from 'react';
import firebase from "firebase/compat/app";
import {AppHeader} from "./components/AppHeader";
import {Outlet} from "react-router-dom";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: "elo-music-rating.firebaseapp.com",
    projectId: "elo-music-rating",
    storageBucket: "elo-music-rating.appspot.com",
    messagingSenderId: "443754108452",
    appId: "1:443754108452:web:2a122c88b732262407eab1",
};

firebase.initializeApp(firebaseConfig);

export default function App() {

    return <div className="text-center">
        <AppHeader/>
        <div className="m-3">
            <Outlet/>
        </div>
    </div>

}
