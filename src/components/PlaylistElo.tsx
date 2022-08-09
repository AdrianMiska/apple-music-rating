import React, {useEffect} from "react";
import {PlaylistSong} from "./PlaylistSong";
import {MusicWrapper} from "../MusicWrapper";
import {EloRecord} from "../EloUtils";

/**
 * This component will display the songs in a playlist along with their ratings.
 */
export function PlaylistElo(props: { playlistId: string, songs: MusicWrapper.Song[], ratings: Map<string, EloRecord> }) {

    let [sortedSongs, setSortedSongs] = React.useState<MusicWrapper.Song[]>([]);

    useEffect(() => {
        let sorted = props.songs.sort((a, b) => {
            let aRecord = props.ratings.get(a.id)?.rating || 0;
            let bRecord = props.ratings.get(b.id)?.rating || 0;
            return bRecord - aRecord;
        });
        setSortedSongs(sorted);
    }, [props.songs, props.ratings]);

    return <div>
        {sortedSongs.map((song: MusicWrapper.Song) => {
            let rating = props.ratings.get(song.id)?.rating || 0;
            return <PlaylistSong key={song.id} song={song} rating={rating}/>
        })}
    </div>;
}