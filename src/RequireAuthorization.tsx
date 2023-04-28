import {useMusic} from "./MusicWrapper";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";

export function RequireAuthorization({children}: { children: JSX.Element }) {

    let [isAuthorized, setIsAuthorized] = useState(false);
    let [isLoading, setIsLoading] = useState(true);

    let musicWrapper = useMusic();

    useEffect(() => {
        let authorized = async () => {
            let authorizations = await musicWrapper.getAuthorizations();
            setIsAuthorized(authorizations.length > 0);
        }
        authorized().then(() => {
            setIsLoading(false);
        });
    }, []);

    let router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthorized && router.asPath !== '/authorize') {
            router.replace({
                pathname: '/authorize',
                query: {from: router.asPath},
            });
        }
    }, [isLoading, isAuthorized, router]);

    if (isLoading || !isAuthorized) {
        return <div>Loading...</div>;
    } else {
        return <>{children}</>;
    }
}