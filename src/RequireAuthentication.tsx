import {Navigate, useLocation} from "react-router-dom";
import firebase from "firebase/compat/app";
import {useEffect, useState} from "react";

export function RequireAuthentication({children}: { children: JSX.Element }) {

    let [isAuthenticated, setIsAuthenticated] = useState(false);
    let [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        firebase.auth().onAuthStateChanged(user => {
            setIsAuthenticated(!!user);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if(localStorage.getItem("elo-rating.anonymous") === "true"){
            setIsAuthenticated(true);
            setIsLoading(false);
        }
    }, []);

    let location = useLocation();

    if (isLoading) {
        return <div>Loading...</div>;
    }


    if (!isAuthenticated || location.pathname === "/login") {
        return <Navigate to="/login" state={{from: location}} replace/>;
    } else {
        return children;
    }
}