import React, {useEffect} from "react";
import {createPlaylist, updatePlaylist} from "../PlaylistUtils";
import {calculateElo, getEloRatings} from "../EloUtils";
import {Song} from "../components/Song";
import {useParams} from "react-router-dom";
import {PlaylistElo} from "../components/PlaylistElo";
import {SongRatingHeader} from "../components/SongRatingHeader";

class RatingPair {
    constructor(public baseline: MusicKit.Songs | MusicKit.MusicVideos, public candidate: MusicKit.Songs | MusicKit.MusicVideos) {
    }
}

export function SongRating() {

    let params = useParams();
    let playlistId = params.id;
    let [inputSongs, setInputSongs] = React.useState<(MusicKit.Songs | MusicKit.MusicVideos)[]>([]);
    let [inputPlaylist, setInputPlaylist] = React.useState<MusicKit.Playlists | MusicKit.LibraryPlaylists | null>(null);
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
        // @ts-ignore
        window.MusicKit.getInstance().api.music('v1/me/library/playlists/' + playlistId, {
            include: 'tracks',
        }).then((playlist: any) => {
            setInputPlaylist(playlist.data.data[0]);
        })
    }, [playlistId]);

    useEffect(() => {

        if (!inputPlaylist) {
            return;
        }

        const songs: (MusicKit.Songs | MusicKit.MusicVideos)[] = inputPlaylist?.relationships.tracks.data;

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

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputPlaylist?.id]);

    useEffect(() => {
        console.log("inputSongs", inputSongs);
        setMatchUp(getCandidate());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputSongs]);


    async function createOutputPlaylist(name: string | undefined) {
        let createdPlaylist = await createPlaylist(`${name} Sorted`, `Sorted version of ${name} by Elo Music Rating`);
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
    function getCandidate(baseline?: MusicKit.Songs | MusicKit.MusicVideos): RatingPair | null {

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

    if (!playlistId || !inputSongs.length || !matchUp) {
        return <div>Loading...</div>;
    }

    //TODO display a message that data is local in case of anonymous users with an option to sign up

    return <div>
        <SongRatingHeader inputPlaylist={inputPlaylist}
                          onSave={async () => {
                              await createOutputPlaylist(inputPlaylist?.attributes?.name);
                          }}/>
        <div className="flex flex-row my-2">
            <div className="flex flex-col w-full items-center">
                <Song song={matchUp.baseline} playlistId={playlistId}/>
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded w-fit"
                        onClick={async () => {
                            await window.MusicKit.getInstance().stop()
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "baseline");
                            setMatchUp(getCandidate());
                        }
                        }>I prefer this song
                </button>
            </div>
            <div className="flex flex-col justify-center">
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded w-fit"
                        onClick={async () => {
                            await window.MusicKit.getInstance().stop()
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "tie");
                            setMatchUp(getCandidate());
                        }}>Tie
                </button>
            </div>
            <div className="flex flex-col w-full items-center">
                <Song song={matchUp.candidate} playlistId={playlistId}/>
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded w-fit"
                        onClick={async () => {
                            //TODO don't stop if the candidate is currently playing
                            await window.MusicKit.getInstance().stop()
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
