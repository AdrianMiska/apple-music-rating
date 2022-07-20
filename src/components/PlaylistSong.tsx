import React from "react";
import {Artwork} from "./Artwork";
import {MusicWrapper} from "../MusicWrapper";

/**
 * A song to be displayed as part of a playlist.
 */
export function PlaylistSong(props: { song: MusicWrapper.Song, rating: number }) {

    return <div className="flex flex-row items-center mb-2">
        <div className="w-1/6 px-2">
            <Artwork artwork={props.song.artwork || null} size={3}/>
        </div>
        <div className="w-4/6">
            <div className="flex flex-col">
                <div className="flex flex-row items-center">
                    <div className="w-1/3">
                        <div className="text-sm">
                            {props.song.title}
                        </div>
                    </div>
                    <div className="w-2/3">
                        <div className="text-sm">
                            {props.song.album}
                        </div>
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="w-1/3">
                        <div className="text-sm">

                            {props.song.artist}
                        </div>
                    </div>
                    <div className="w-2/3">
                        <div className="text-sm">
                            {props.song.genreNames.join(", ")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="w-1/6">
            <div className="flex flex-col">
                <div className="flex flex-row items-center">
                    <div className="w-full">
                        <div className="text-sm">
                            Elo: {props.rating.toFixed(1)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>;
}