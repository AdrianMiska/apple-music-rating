import Link from "next/link";
import React from "react";
import { useAuthentication } from "./UseAuthentication";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { useRouter } from "next/router";

export function AppFooter() {
  const isAuthenticated = useAuthentication();
  const router = useRouter();
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 py-6 sm:px-6 md:flex-row lg:px-8">
        <p className="text-sm text-gray-400">
          &copy; 2023 EloTunes. All rights reserved.
        </p>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link
                href="/authorize"
                className="font-medium text-gray-900 hover:text-gray-700"
              >
                Manage Streaming Services
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <button
                  onClick={async () => {
                    await firebase.auth().signOut();
                    await router.push("/login");
                  }}
                  className="font-medium text-gray-900 hover:text-gray-700"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
