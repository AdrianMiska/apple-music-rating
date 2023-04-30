import { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

export function useAuthentication() {
  let [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("elo-rating.anonymous") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  return isAuthenticated;
}
