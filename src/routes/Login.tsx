import React, {useEffect} from "react";
import firebase from "firebase/compat/app";
import {StyledFirebaseAuth} from "../StyledFirebaseAuth";
import firebaseui from "firebaseui";
import {useNavigate} from "react-router-dom";

//TODO add google and apple auth
const uiConfig: firebaseui.auth.Config = {
    signInFlow: 'popup',
    signInOptions: [
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false,
        },
        //firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        //apple.com
    ],
}

export function Login() {

    let navigate = useNavigate();

    useEffect(() => {
        const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
            if(!!user) navigate("/select-playlist")
            //TODO migrate local data to firebase
        });
        return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
    }, [navigate]);

    return <div>
        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()}/>
        <p> Or </p>
        <p>
            If you don't want to log in, you can continue anonymously.
            However, your Elo ratings will only be stored in your browser, not transferable to other
            devices and lost if you clear your browser cache.
        </p>

        <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                    localStorage.setItem("elo-rating.anonymous", "true");
                    navigate("/select-playlist");
                }
                }>Continue anonymously
        </button>
    </div>


}