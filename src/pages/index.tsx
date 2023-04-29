import React from "react";
import { MusicalNoteIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/router";

export default function Index() {
  let router = useRouter();

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Elo Music Rating</h1>
      <h2 className="mb-2 text-sm font-semibold">
        An app that allows you to rate your music using an Elo algorithm.
      </h2>
      <h2 className="mb-2 text-sm font-semibold">🚧 Under construction. 🚧</h2>
      <h2 className="mb-2 text-sm font-semibold">Select a playlist to rate.</h2>
      <button
        className="mx-auto flex items-center rounded bg-blue-500 py-2 pr-4 font-semibold text-white hover:bg-blue-700"
        onClick={() => {
          router.push("/select-playlist");
        }}
      >
        <MusicalNoteIcon className="ml-3 mr-2 h-4 w-4" /> Let&apos;s go!
      </button>
    </div>
  );
}
