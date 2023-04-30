import React from "react";
import Link from "next/link";
import {useAuthentication} from "./UseAuthentication";
import {useRouter} from "next/router";

/**
 * Header with navbar and hamburger menu.
 */
export function AppHeader() {
  const isAuthenticated = useAuthentication();

  const router = useRouter();
  const isIndex = router.pathname === "/";
  const isAuthorize = router.pathname === "/authorize";

  function unauthenticatedButtons() {
    return (
      <>
        <li>
          <Link
            href="/login"
            className="font-medium text-gray-900 hover:text-gray-700"
          >
            Sign In
          </Link>
        </li>
        <li>
          <Link
            href="/login"
            className="rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors duration-300 hover:bg-green-700"
          >
            Sign Up
          </Link>
        </li>
      </>
    );
  }

  function authenticatedButtons() {
    return (
      <>
        <Link
          href="/select-playlist"
          className="rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors duration-300 hover:bg-green-700"
        >
          Start rating
        </Link>
      </>
    );
  }

  return (
    <header className="bg-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <Link href="/">
            <span className="ml-2 text-lg font-bold text-gray-900">
              EloTunes
            </span>
          </Link>
        </div>
        <nav>
          <ul className="flex space-x-4">
            {!isAuthenticated && unauthenticatedButtons()}
            {(isIndex || isAuthorize) &&
              isAuthenticated &&
              authenticatedButtons()}
          </ul>
        </nav>
      </div>
    </header>
  );
}
