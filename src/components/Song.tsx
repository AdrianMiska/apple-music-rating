import React from "react";
import {Artwork} from "./Artwork";
import {MusicWrapper} from "../MusicWrapper";

/**
 * Displays a song with its album art, title and artist.
 */
export function Song(props: { song: MusicWrapper.Song, playlistId: string }) {

    return <div className="flex flex-col items-center px-4 mt-auto mx-auto max-w-xs">
        <Artwork artwork={props.song.artwork || null}/>

        <div className="text-center">
            <h1 className="text-xl font-bold my-2">{props.song.title}</h1>
            <h2 className="text-sm font-semibold mb-2">{props.song.artist}</h2>
        </div>
    </div>;

}