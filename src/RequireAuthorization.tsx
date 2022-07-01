import {Navigate, useLocation} from "react-router-dom";

export function RequireAuthorization({children}: { children: JSX.Element }) {

    function isAuthorized(): boolean {
        return window.MusicKit.getInstance().isAuthorized;
    }

    let location = useLocation();

    if (!isAuthorized() || location.pathname === "/authorize") {
        return <Navigate to="/authorize" state={{from: location}} replace/>;
    } else {
        return children;
    }
}