import {getEloRating} from "../EloUtils";
import React, {useEffect} from "react";
import {Artwork} from "./Artwork";
import {MusicWrapper} from "../MusicWrapper";

/**
 * Displays a song with its album art, title, artist and current rating.
 *
 */
export function Song(props: { song: MusicWrapper.Song, playlistId: string }) {

    let [rating, setRating] = React.useState<number>(0);


    useEffect(() => {
        getEloRating(props.playlistId, props.song).then(rating => {
            setRating(rating);
        });
    }, [props.song, props.playlistId]);


    return <div className="flex flex-col items-center px-4">
        <Artwork artwork={props.song.artwork || null} size={8}/>

        <div className="text-center">
            <h1 className="text-xl font-bold my-2">{props.song.title}</h1>
            <h2 className="text-sm font-semibold mb-2">{props.song.artist}</h2>
            <h2 className="text-sm font-semibold mb-2">Elo: {rating.toFixed(1)}</h2>
        </div>
    </div>;

}