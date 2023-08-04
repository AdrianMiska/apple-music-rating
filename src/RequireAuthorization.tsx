import { useMusic } from "./MusicWrapper";
import { PropsWithChildren, useEffect, useState } from "react";
import { useRouter } from "next/router";

export function RequireAuthorization(props: PropsWithChildren) {
  let [isAuthorized, setIsAuthorized] = useState(false);
  let [isLoading, setIsLoading] = useState(true);

  let musicWrapper = useMusic();

  useEffect(() => {
    let authorized = async () => {
      let authorizations = await musicWrapper.getAuthorizations();
      setIsAuthorized(authorizations.length > 0);
    };
    authorized().then(() => {
      setIsLoading(false);
    });
  }, [musicWrapper]);

  let router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthorized && router.asPath !== "/authorize") {
      router.replace({
        pathname: "/authorize",
        query: { from: router.asPath },
      });
    }
  }, [isLoading, isAuthorized, router]);

  if (isLoading || !isAuthorized) {
    return <div>Loading...</div>;
  } else {
    return <>{props.children}</>;
  }
}
