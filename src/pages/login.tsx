import React, {useEffect} from "react";
import firebase from "firebase/compat/app";
import {StyledFirebaseAuth} from "../components/StyledFirebaseAuth";
import firebaseui from "firebaseui";
import {useRouter} from "next/router";

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

export default function Login() {

    let router = useRouter();


    useEffect(() => {
        const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
            localStorage.removeItem("elo-rating.anonymous");
            debugger;
            if(!!user) router.push((router.query.from as string) || "/select-playlist");
            //TODO migrate local data to firebase
        });
        return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
    }, []);

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
                    router.push((router.query.from as string) || "/select-playlist");
                }
                }>Continue anonymously
        </button>
    </div>


}