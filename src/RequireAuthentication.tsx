import { useLocation, Navigate } from "react-router-dom";
import firebase from "firebase/compat/app";

export function RequireAuthentication({ children }: { children: JSX.Element }) {

    function isAuthenticated(): boolean {
        return !!firebase.auth().currentUser || localStorage.getItem("elo-rating.anonymous") === "true";
    }


    let location = useLocation();

    if (!isAuthenticated() || location.pathname === "/login") {
        return <Navigate to="/login" state={{ from: location }} replace />;
    } else {
        return children;
    }
}