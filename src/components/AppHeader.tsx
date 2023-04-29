import React, {useEffect, useRef, useState} from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import Link from "next/link";
import {useRouter} from "next/router";

/**
 * Header with navbar and hamburger menu.
 */
export function AppHeader() {
  let [isAuthenticated, setIsAuthenticated] = useState(false);

  let menu = useRef<HTMLDivElement>(null);

  function toggleMenu() {
    menu.current?.classList.toggle("max-h-0");
    menu.current?.classList.toggle("max-h-screen");
  }

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

  const router = useRouter();

  return (
    <header>
      <nav className="flex flex-wrap items-center justify-between overflow-hidden bg-blue-700 p-3">
        <div className="mr-6 flex flex-shrink-0 items-center text-white">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Music Rating
          </Link>
        </div>
        <div className="block lg:hidden">
          <button
            className="flex items-center rounded border border-white px-3 py-2 text-white
                        hover:border-white hover:text-white"
            onClick={toggleMenu}
          >
            <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
              <title>Menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
            </svg>
          </button>
        </div>
        <div
          className="block max-h-0 w-full flex-grow transition-all motion-reduce:transition-none lg:flex lg:max-h-screen lg:w-auto lg:items-center"
          ref={menu}
        >
          <div className="mb-4 mt-4 text-sm lg:mb-0 lg:ml-auto lg:mt-0"></div>
          <div className="mb-4 text-sm lg:mb-0">
            <Link
              href="/authorize"
              className="text-white hover:text-white lg:mr-4 lg:inline-block"
            >
              Manage Streaming Providers
            </Link>
          </div>
          <div>
            {isAuthenticated ? (
              <button
                className="mt-4 inline-block rounded border border-white px-4 py-2 text-sm leading-none
                            text-white hover:border-transparent hover:bg-white hover:text-gray-600 lg:mt-0"
                onClick={async () => {
                  await firebase.auth().signOut();
                  await router.push("/login");
                }}
              >
                Logout
              </button>
            ) : (
              <button
                className="mt-4 inline-block rounded border border-white px-4 py-2 text-sm leading-none
                            text-white hover:border-transparent hover:bg-white hover:text-gray-600 lg:mt-0"
                onClick={async () => {
                  await router.push("/login");
                }}
              >
                Create Account
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
