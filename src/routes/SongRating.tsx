import React, {useEffect} from "react";
import {calculateElo, getEloRatings} from "../EloUtils";
import {Song} from "../components/Song";
import {useParams} from "react-router-dom";
import {PlaylistElo} from "../components/PlaylistElo";
import {SongRatingHeader} from "../components/SongRatingHeader";
import {HeartIcon} from "@heroicons/react/solid";
import {PlayButton} from "../components/PlayButton";
import {MusicWrapper} from "../MusicWrapper";

class RatingPair {
    constructor(public baseline: MusicWrapper.Song, public candidate: MusicWrapper.Song) {
    }
}

export function SongRating() {

    let params = useParams();
    let playlistId = params.id;
    let [inputSongs, setInputSongs] = React.useState<MusicWrapper.Song[]>([]);
    let [inputPlaylist, setInputPlaylist] = React.useState<MusicWrapper.Playlist | null>(null);
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
        MusicWrapper.getInstance().getPlaylist(playlistId)
            .then((playlist: MusicWrapper.Playlist) => {
                setInputPlaylist(playlist);
                setInputSongs(playlist.tracks);
            })
    }, [playlistId]);

    useEffect(() => {
        setMatchUp(getCandidate());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputSongs]);


    async function createOutputPlaylist(name: string | undefined) {
        let createdPlaylist = await MusicWrapper.getInstance().createPlaylist(`${name} Sorted`, `Sorted version of ${name} by Elo Music Rating`);
        let sorted = inputSongs.sort((a, b) => {
            let aRating = ratings[a.id];
            let bRating = ratings[b.id];
            if (aRating === bRating) {
                return 0;
            }
            return aRating > bRating ? -1 : 1;
        });
        await MusicWrapper.getInstance().updatePlaylist(createdPlaylist, sorted);
    }


    /** Get two songs to be rated by the user.
     *  The songs will be picked at random, either both from the output playlist or one from each playlist.
     *  Depending on how many songs are already in the output playlist, songs from the output playlist are more likely to be picked.
     *
     *  Important: Will ensure that songs are not repeated in the output playlist.
     *  Will choose two songs from the output playlist more often the bigger the output playlist is.
     *  Over time, the output playlist will be filled with more songs from the input playlist.
     */
    function getCandidate(baseline?: MusicWrapper.Song): RatingPair | null {

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
                              await createOutputPlaylist(inputPlaylist?.name);
                          }}/>
        <div className="grid grid-cols-2 my-2">
            <Song song={matchUp.baseline} playlistId={playlistId}/>
            <Song song={matchUp.candidate} playlistId={playlistId}/>
        </div>
        <div className="flex flex-row my-2">
            <div className="flex flex-col w-full items-center">
                <div className="flex flex-row items-center">
                    <button
                        className="bg-gray-500 border-0 text-white hover:bg-gray-700 rounded-full h-10 w-10 p-2"
                        onClick={async () => {
                            await MusicWrapper.getInstance().stop();
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "baseline");
                            setMatchUp(getCandidate());
                        }
                        }>
                        <HeartIcon/>
                    </button>
                    <PlayButton song={matchUp.baseline}/>
                </div>
            </div>
            <div className="flex flex-col justify-center">
                <button
                    className="bg-gray-500 border-0 text-white hover:bg-gray-700 rounded-full h-10 w-10 p-2 font-bold"
                    onClick={async () => {
                        await MusicWrapper.getInstance().stop();
                        await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "tie");
                        setMatchUp(getCandidate());
                    }}>Tie
                </button>
            </div>
            <div className="flex flex-col w-full items-center">
                <div className="flex flex-row items-center">
                    <PlayButton song={matchUp.candidate}/>
                    <button
                        className="bg-gray-500 border-0 text-white hover:bg-gray-700 rounded-full h-10 w-10 p-2"
                        onClick={async () => {

                            let playing = await MusicWrapper.getInstance().isPlaying(matchUp?.candidate || null)
                            //don't stop if the candidate is currently playing
                            if (!playing) {
                                (await MusicWrapper.getInstance().stop())
                            }
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "candidate");
                            setMatchUp(getCandidate(matchUp!.candidate)); // keep candidate as incumbent baseline
                        }
                        }>
                        <HeartIcon/>
                    </button>
                </div>
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
