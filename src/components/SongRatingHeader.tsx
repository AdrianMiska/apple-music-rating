import {useNavigate} from "react-router-dom";
import {ChevronLeftIcon, PlusIcon} from "@heroicons/react/outline";
import React from "react";
import {MusicWrapper} from "../MusicWrapper";

export function SongRatingHeader(props: { inputPlaylist: MusicWrapper.Playlist | null, onSave: () => Promise<void> }) {
    let navigate = useNavigate();
    return <div id="song-rating-header" className="flex items-center relative justify-between">
        <div className="w-2/6">

            <button
                className="flex items-center bg-transparent hover:bg-gray-200 text-gray-800 font-semibold hover:text-gray-900 py-2 pr-4 rounded"
                onClick={async () => {
                    navigate("/select-playlist");
                    await MusicWrapper.getInstance().stop();
                }}>
                <ChevronLeftIcon className="w-6 h-6 mr-2"/> Back
            </button>
        </div>
        <div className="items-center w-2/6 justify-center">
            <h1 className="text-2xl font-bold">
                {props.inputPlaylist?.name}
            </h1>
        </div>
        <div className="w-1/3">
            <button
                className="ml-auto flex items-center bg-transparent hover:bg-gray-200 text-gray-800 font-semibold hover:text-gray-900 py-2 pl-4 pr-2 rounded"
                onClick={props.onSave}>
                <PlusIcon className="w-4 h-4 mr-2"/> Save
            </button>
        </div>


    </div>;
}