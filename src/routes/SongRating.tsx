import React, {useEffect} from "react";
import {createPlaylist, updatePlaylist} from "../PlaylistUtils";
import {calculateElo, getEloRatings} from "../EloUtils";
import {Song} from "../Song";
import {useNavigate, useParams} from "react-router-dom";
import {ChevronLeftIcon, PlusIcon} from "@heroicons/react/outline";
import Songs = MusicKit.Songs;
import MusicVideos = MusicKit.MusicVideos;
import LibraryPlaylists = MusicKit.LibraryPlaylists;
import Playlists = MusicKit.Playlists;

class RatingPair {
    constructor(public baseline: Songs | MusicVideos, public candidate: Songs | MusicVideos) {
    }
}

/**
 * A song to be displayed as part of a playlist.
 */
function PlaylistSong(props: { song: MusicKit.Songs | MusicKit.MusicVideos, rating: number }) {

    function getArtworkUrl() {
        let artwork = props.song.attributes?.artwork;
        let height = props.song.attributes?.artwork.height;
        let width = props.song.attributes?.artwork.width;
        return artwork && height && width
            ? window.MusicKit.formatArtworkURL(artwork, height, width)
            : "";
    }

    return <div className="flex flex-row items-center mb-2">
        <div className="w-1/6 px-2">
            <img src={getArtworkUrl()} className="rounded max-h-12" alt={`${props.song.attributes?.name} album art`}/>
        </div>
        <div className="w-4/6">
            <div className="flex flex-col">
                <div className="flex flex-row items-center">
                    <div className="w-1/3">
                        <div className="text-sm">
                            {props.song.attributes?.name}
                        </div>
                    </div>
                    <div className="w-2/3">
                        <div className="text-sm">
                            {props.song.attributes?.albumName}
                        </div>
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <div className="w-1/3">
                        <div className="text-sm">

                            {props.song.attributes?.artistName}
                        </div>
                    </div>
                    <div className="w-2/3">
                        <div className="text-sm">
                            {props.song.attributes?.genreNames.join(", ")}
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

/**
 * This component will display the songs in a playlist along with their ratings.
 */
function PlaylistElo(props: { playlistId: string, songs: (MusicKit.Songs | MusicKit.MusicVideos)[], ratings: { [key: string]: number } }) {

    function sortedSongs() {
        return props.songs.sort((a, b) => {
            let aRating = props.ratings[a.id];
            let bRating = props.ratings[b.id];
            if (aRating === bRating) {
                return 0;
            }
            return aRating > bRating ? -1 : 1;
        });
    }

    return <div>
        {sortedSongs().map((song: Songs | MusicVideos) => {
            let rating = props.ratings[song.id] || 0;
            return <PlaylistSong key={song.id} song={song} rating={rating}/>
        })}
    </div>;
}

export function SongRating() {

    let params = useParams();
    let playlistId = params.id;
    let [inputSongs, setInputSongs] = React.useState<(Songs | MusicVideos)[]>([]);
    let [inputPlaylist, setInputPlaylist] = React.useState<Playlists | LibraryPlaylists | null>(null);
    let [matchUp, setMatchUp] = React.useState<RatingPair | null>(null);

    let [ratings, setRatings] = React.useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (!playlistId) {
            return;
        }
        let unsub = getEloRatings(playlistId, (ratings: { [key: string]: number }) => {
            setRatings(ratings);
        });

        return () => {
            unsub && unsub();
        }

    }, [playlistId]);

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
        let sorted = inputSongs.sort((a, b) => {
            let aRating = ratings[a.id];
            let bRating = ratings[b.id];
            if (aRating === bRating) {
                return 0;
            }
            return aRating > bRating ? -1 : 1;
        });
        await updatePlaylist(createdPlaylist, sorted);
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

    let navigate = useNavigate();

    if (!playlistId || !inputSongs.length || !matchUp) {
        return <div>Loading...</div>;
    }

    //TODO display a message that data is local in case of anonymous users with an option to sign up

    return <div>
        <div id="playlist-header" className="flex items-center relative justify-between">
            <div className="w-2/6">

                <button
                    className="flex items-center bg-transparent hover:bg-gray-200 text-gray-800 font-semibold hover:text-gray-900 py-2 pr-4 rounded"
                    onClick={() => {
                        navigate("/select-playlist");
                    }}>
                    <ChevronLeftIcon className="w-6 h-6 mr-2"/> Back
                </button>
            </div>
            <div className="items-center w-2/6 justify-center">
                <h1 className="text-2xl font-bold">
                    {inputPlaylist?.attributes?.name}
                </h1>
            </div>
            <div className="w-1/3">
                <button
                    className="flex items-center bg-transparent hover:bg-gray-200 text-gray-800 font-semibold hover:text-gray-900 py-2 pl-4 rounded"
                    onClick={async () => {
                        await createOutputPlaylist(inputPlaylist?.attributes?.name);
                    }}>
                    <PlusIcon className="w-6 h-6 mr-2"/> Create sorted Playlist
                </button>
            </div>


        </div>
        <div className="flex flex-row my-2">
            <div className="flex flex-col w-full">
                <Song song={matchUp.baseline} playlistId={playlistId}/>
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                        onClick={async () => {
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "baseline");
                            setMatchUp(getCandidate());
                        }
                        }>I prefer this song
                </button>
            </div>
            <div className="flex flex-col justify-center">
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                        onClick={async () => {
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "tie");
                            setMatchUp(getCandidate());
                        }}>Tie
                </button>
            </div>
            <div className="flex flex-col w-full">
                <Song song={matchUp.candidate} playlistId={playlistId}/>
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                        onClick={async () => {
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "candidate");
                            setMatchUp(getCandidate(matchUp!.candidate)); // keep candidate as incumbent baseline
                        }
                        }>I prefer this song
                </button>
            </div>
        </div>
        <div className="flex flex-row justify-center">
            <h2 className="text-center">
                Current Playlist:
            </h2>
        </div>
        <PlaylistElo playlistId={playlistId} songs={inputSongs} ratings={ratings}/>
    </div>
}
