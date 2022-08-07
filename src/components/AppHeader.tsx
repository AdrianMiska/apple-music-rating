import React, {useEffect, useRef, useState} from "react";
import firebase from "firebase/compat/app";
import {useNavigate} from "react-router-dom";

/**
 * Header with navbar and hamburger menu.
 */
export function AppHeader() {

    let [isAuthenticated, setIsAuthenticated] = useState(false);

    let menu = useRef<HTMLDivElement>(null);

    function toggleMenu() {
        menu.current?.classList.toggle('max-h-0');
        menu.current?.classList.toggle('max-h-screen');

    }

    useEffect(() => {
        if (localStorage.getItem("elo-rating.anonymous") === "true") {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        firebase.auth().onAuthStateChanged(user => {
            setIsAuthenticated(!!user);
        });
    }, []);

    let navigate = useNavigate();


    return <header>
        <nav className="flex items-center justify-between flex-wrap bg-blue-700 p-3 overflow-hidden">
            <div className="flex items-center flex-shrink-0 text-white mr-6">
                    <span className="font-semibold text-xl tracking-tight">
                        Music Rating
                    </span>
            </div>
            <div className="block lg:hidden">
                <button className="flex items-center px-3 py-2 border rounded text-white border-white
                        hover:text-white hover:border-white"
                        onClick={toggleMenu}>
                    <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                        <title>Menu</title>
                        <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/>
                    </svg>
                </button>
            </div>
            <div
                className="w-full block flex-grow lg:flex lg:items-center lg:w-auto max-h-0 lg:max-h-screen transition-all motion-reduce:transition-none"
                ref={menu}>
                <div className="text-sm mb-4 lg:mb-0 lg:ml-auto mt-4 lg:mt-0">
                    <a href="/"
                       className="lg:inline-block text-white hover:text-white lg:mr-4">
                        Home
                    </a>
                </div>
                <div className="text-sm mb-4 lg:mb-0">
                    <a href="/authorize"
                       className="lg:inline-block text-white hover:text-white lg:mr-4">
                        Manage Streaming Providers
                    </a>
                </div>
                <div>
                    {isAuthenticated
                        ? <button className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white
                            hover:border-transparent hover:text-white hover:bg-blue-600 mt-4 lg:mt-0"
                                  onClick={async () => {
                                      await firebase.auth().signOut();
                                      navigate("/login", {state: {from: window.location.pathname}});
                                  }}>
                            Logout
                        </button>
                        : <button className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white
                            hover:border-transparent hover:text-white hover:bg-blue-600 mt-4 lg:mt-0"
                                  onClick={() => {
                                      navigate("/login", {state: {from: window.location.pathname}});
                                  }}>
                            Create Account
                        </button>
                    }
                </div>
            </div>
        </nav>
    </header>;

}