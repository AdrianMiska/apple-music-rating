import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

export function RequireAuthentication({ children }: { children: JSX.Element }) {
  let [isAuthenticated, setIsAuthenticated] = useState(false);
  let [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (localStorage.getItem("elo-rating.anonymous") === "true") {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, []);

  let router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && router.asPath !== "/login") {
      router.replace({
        pathname: "/login",
        query: { from: router.asPath },
      });
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  } else {
    return <>{children}</>;
  }
}
