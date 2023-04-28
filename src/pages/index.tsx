import React from 'react';
import {MusicalNoteIcon} from "@heroicons/react/24/solid";
import {useRouter} from "next/router";

export default function Index() {

    let router = useRouter();

    return <div className="text-center">
        <h1 className="text-2xl font-bold">
            Elo Music Rating
        </h1>
        <h2 className="text-sm font-semibold mb-2">
            An app that allows you to rate your music using an Elo algorithm.
        </h2>
        <h2 className="text-sm font-semibold mb-2">
            🚧 Under construction. 🚧
        </h2>
        <h2 className="text-sm font-semibold mb-2">
            Select a playlist to rate.
        </h2>
        <button
            className="mx-auto flex items-center py-2 pr-4 rounded bg-blue-500 text-white font-semibold hover:bg-blue-700"
            onClick={() => {
                router.push("/select-playlist");
            }}>
            <MusicalNoteIcon className="w-4 h-4 mr-2 ml-3"/> Let's go!
        </button>
    </div>


}
