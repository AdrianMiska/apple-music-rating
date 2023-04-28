import {ChevronLeftIcon, PlusIcon} from "@heroicons/react/24/outline";
import React from "react";
import {Playlist, useMusic} from "../MusicWrapper";
import Link from "next/link";

export function SongRatingHeader(props: { inputPlaylist?: Playlist, onSave: () => Promise<void> }) {

    let music = useMusic();


    return <div id="song-rating-header" className="flex relative justify-between items-center my-3">
        <div className="">

            <Link
                href="/select-playlist"
                className="flex items-center bg-transparent hover:bg-gray-200 text-gray-800 font-semibold hover:text-gray-900 pr-4 rounded"
                onClick={async () => {
                    await music.stop();
                }}>
                <ChevronLeftIcon className="w-6 h-6 mr-2"/> Back
            </Link>
        </div>
        <div className="text-xl font-bold text-ellipsis line-clamp-1 break-all">
            {props.inputPlaylist?.name}
        </div>
        <div className="">
            <button
                className="ml-auto flex items-center bg-transparent hover:bg-gray-200 text-gray-800 font-semibold hover:text-gray-900 pl-4 pr-2 rounded"
                onClick={props.onSave}>
                <PlusIcon className="w-4 h-4 mr-2"/> Save
            </button>
        </div>


    </div>;
}