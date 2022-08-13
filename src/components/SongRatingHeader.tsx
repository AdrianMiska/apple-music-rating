import {Link} from "react-router-dom";
import {ChevronLeftIcon, PlusIcon} from "@heroicons/react/outline";
import React from "react";
import {MusicWrapper} from "../MusicWrapper";

export function SongRatingHeader(props: { inputPlaylist: MusicWrapper.Playlist | null, onSave: () => Promise<void> }) {
    return <div id="song-rating-header" className="flex relative justify-between items-center my-3">
        <div className="">

            <Link
                to="/select-playlist"
                className="flex items-center bg-transparent hover:bg-gray-200 text-gray-800 font-semibold hover:text-gray-900 pr-4 rounded"
                onClick={async () => {
                    await MusicWrapper.getInstance().stop();
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