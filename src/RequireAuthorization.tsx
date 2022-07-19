import {Navigate, useLocation} from "react-router-dom";
import {MusicWrapper} from "./MusicWrapper";
import {useEffect, useState} from "react";

export function RequireAuthorization({children}: { children: JSX.Element }) {

    let [isAuthorized, setIsAuthorized] = useState(false);
    let [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let authorized = async () => {
            let isAuthorized = await MusicWrapper.getInstance().isAuthorized();
            setIsAuthorized(isAuthorized);
        }
        authorized().then(() => {
            setIsLoading(false);
        });
    }, []);

    let location = useLocation();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthorized || location.pathname === "/authorize") {
        return <Navigate to="/authorize" state={{from: location}} replace/>;
    } else {
        return children;
    }
}