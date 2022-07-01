import React, {useEffect} from "react";
import {createPlaylist, updatePlaylist} from "../PlaylistUtils";
import {calculateElo} from "../EloUtils";
import {Song} from "../Song";
import {useParams} from "react-router-dom";
import Songs = MusicKit.Songs;
import MusicVideos = MusicKit.MusicVideos;
import LibraryPlaylists = MusicKit.LibraryPlaylists;
import Playlists = MusicKit.Playlists;

class RatingPair {
    constructor(public baseline: Songs | MusicVideos, public candidate: Songs | MusicVideos) {
    }
}

export function SongRating() {

    let params = useParams();
    let playlistId = params.id;
    let [inputSongs, setInputSongs] = React.useState<(Songs | MusicVideos)[]>([]);
    let [inputPlaylist, setInputPlaylist] = React.useState<Playlists | LibraryPlaylists | null>(null);
    let [matchUp, setMatchUp] = React.useState<RatingPair | null>(null);

    useEffect(() => {
        if (!playlistId) {
            return;
        }
        window.MusicKit.getInstance().api.library.playlist(playlistId, {
            include: "tracks"
        }).then(playlist => {
            setInputPlaylist(playlist as any);
        })
    }, [playlistId]);

    useEffect(() => {

        if (!inputPlaylist) {
            return;
        }

        const songs: (Songs | MusicVideos)[] = inputPlaylist?.relationships.tracks.data;

        // get all tracks from the paginated API
        const getTracks = async (next: string) => {
            const response = await fetch(`https://api.music.apple.com${next}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + window.MusicKit.getInstance().developerToken,
                    'Music-User-Token': window.MusicKit.getInstance().musicUserToken
                }
            });
            const data = await response.json();
            songs.push(...data.data);
            if (data.next) {
                await getTracks(data.next);
            }
        }

        if (inputPlaylist?.relationships.tracks.next) {
            getTracks(inputPlaylist.relationships.tracks.next).then(() => {
                setInputSongs(songs);
            });
        } else {
            setInputSongs(songs);
        }

    }, [inputPlaylist]);

    useEffect(() => {
        console.log("inputSongs", inputSongs);
        setMatchUp(getCandidate());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputSongs]);

    async function createOutputPlaylist(name: string | undefined) {
        let createdPlaylist = await createPlaylist(`${name} Sorted`, `Sorted version of ${name} by Music Rating`);
        // TODO songs sorted by elo
        await updatePlaylist(createdPlaylist, []);
    }


    /** Get two songs to be rated by the user.
     *  The songs will be picked at random, either both from the output playlist or one from each playlist.
     *  Depending on how many songs are already in the output playlist, songs from the output playlist are more likely to be picked.
     *
     *  Important: Will ensure that songs are not repeated in the output playlist.
     *  Will choose two songs from the output playlist more often the bigger the output playlist is.
     *  Over time, the output playlist will be filled with more songs from the input playlist.
     */
    function getCandidate(baseline?: Songs | MusicVideos): RatingPair | null {

        if (inputSongs.length === 0) {
            return null;
        }

        baseline = baseline || inputSongs[Math.floor(Math.random() * inputSongs.length)];
        let candidate = inputSongs[Math.floor(Math.random() * inputSongs.length)];
        if (baseline.id === candidate.id) {
            candidate = inputSongs[inputSongs.indexOf(candidate) + 1];
        }
        return new RatingPair(baseline, candidate);
    }


    if (!inputSongs.length) {
        return <div>Loading...</div>;
    }

    if (!matchUp) {
        return <div>Loading...</div>;
    }

    //TODO display current elo ratings
    //TODO add a save button which creates a new playlist based on elo
    //TODO display a message that data is local in case of anonymous users with an option to sign up

    return <div className="flex flex-row">
        <div className="flex flex-col w-full">
            <Song song={matchUp.baseline}/>
            <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                        calculateElo(matchUp!.baseline, matchUp!.candidate, "baseline");
                        setMatchUp(getCandidate());
                    }
                    }>I prefer this song
            </button>
        </div>
        <div className="flex flex-col">
            <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                        calculateElo(matchUp!.baseline, matchUp!.candidate, "tie");
                        setMatchUp(getCandidate());
                    }}>Tie
            </button>
        </div>
        <div className="flex flex-col w-full">
            <Song song={matchUp.candidate}/>
            <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                        calculateElo(matchUp!.baseline, matchUp!.candidate, "candidate");
                        setMatchUp(getCandidate(matchUp!.candidate)); // keep candidate as incumbent baseline
                    }
                    }>I prefer this song
            </button>
        </div>
    </div>;

}