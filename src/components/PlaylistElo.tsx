import React, {useEffect} from "react";
import {PlaylistSong} from "./PlaylistSong";

/**
 * This component will display the songs in a playlist along with their ratings.
 */
export function PlaylistElo(props: { playlistId: string, songs: (MusicKit.Songs | MusicKit.MusicVideos)[], ratings: { [key: string]: number } }) {

    let [sortedSongs, setSortedSongs] = React.useState<(MusicKit.Songs | MusicKit.MusicVideos)[]>([]);

    useEffect(() => {
        let sorted = props.songs.sort((a, b) => {
            let aRating = props.ratings[a.id] || 0;
            let bRating = props.ratings[b.id] || 0;
            return bRating - aRating;
        });
        setSortedSongs(sorted);
    }, [props.songs, props.ratings]);

    return <div>
        {sortedSongs.map((song: MusicKit.Songs | MusicKit.MusicVideos) => {
            let rating = props.ratings[song.id] || 0;
            return <PlaylistSong key={song.id} song={song} rating={rating}/>
        })}
    </div>;
}