import '../../styles/globals.css'

import {AppHeader} from "../components/AppHeader";
import firebase from "firebase/compat/app";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: "elo-music-rating.firebaseapp.com",
    projectId: "elo-music-rating",
    storageBucket: "elo-music-rating.appspot.com",
    messagingSenderId: "443754108452",
    appId: "1:443754108452:web:2a122c88b732262407eab1",
};

export default function MyApp({Component, pageProps}: { Component: any, pageProps: any }) {

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    return <div className="text-center">
        <AppHeader/>
        <div className="m-3">
            <Component {...pageProps} />
        </div>
    </div>
}