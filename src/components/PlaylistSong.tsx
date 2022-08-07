import React from "react";
import {Artwork} from "./Artwork";
import {MusicWrapper} from "../MusicWrapper";

/**
 * A song to be displayed as part of a playlist.
 */
export function PlaylistSong(props: { song: MusicWrapper.Song, rating: number }) {

    return <div className="flex flex-row items-center my-2 max-w-2xl mx-auto">
        <div className="w-1/6">
            <Artwork artwork={props.song.artwork || null}/>
        </div>
        <div className="w-4/6 px-4">
            <div className="flex flex-col text-left">
                <div className="text-sm font-bold text-ellipsis line-clamp-1">
                    {props.song.title}
                </div>
                <div className="text-xs text-ellipsis line-clamp-1">
                    {props.song.artist}
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