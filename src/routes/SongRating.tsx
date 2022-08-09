import React, {useEffect} from "react";
import {calculateElo, getEloRatings} from "../EloUtils";
import {useParams} from "react-router-dom";
import {PlaylistElo} from "../components/PlaylistElo";
import {SongRatingHeader} from "../components/SongRatingHeader";
import {HeartIcon} from "@heroicons/react/solid";
import {PlayButton} from "../components/PlayButton";
import {MusicWrapper} from "../MusicWrapper";
import {Artwork} from "../components/Artwork";

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
            .then((playlist: MusicWrapper.Playlist | null) => {
                setInputPlaylist(playlist);
                let songs = playlist?.tracks || [];
                //duplicates mess everything up, so we remove them
                let deduplicatedSongs = songs.filter((song, index) => {
                    return songs.findIndex(s => s.id === song.id) === index;
                });
                setInputSongs(deduplicatedSongs);
            })
    }, [playlistId]);

    useEffect(() => {
        setMatchUp(getCandidate());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputSongs]);


    async function createOutputPlaylist(playlist: MusicWrapper.Playlist | null) {
        if (!playlist) {
            return;
        }

        let existingPlaylist = playlist.musicProvider !== MusicWrapper.MusicProvider.AppleMusic && (await MusicWrapper.getInstance().searchPlaylist(`${playlist.name} Sorted`)).find(p => p.description === `Sorted version of ${playlist.name} by Elo Music Rating`);
        let outputPlaylist = existingPlaylist || await MusicWrapper.getInstance().createPlaylist(`${playlist.name} Sorted`, `Sorted version of ${playlist.name} by Elo Music Rating`, playlist.musicProvider);

        if (!outputPlaylist) {
            return;
        }

        let sorted = inputSongs.sort((a, b) => {
            let aRating = ratings[a.id];
            let bRating = ratings[b.id];
            if (aRating === bRating) {
                return 0;
            }
            return aRating > bRating ? -1 : 1;
        });
        await MusicWrapper.getInstance().updatePlaylist(outputPlaylist, sorted);
    }

    function getCandidate(baseline?: MusicWrapper.Song): RatingPair | null {

        if (inputSongs.length === 0) {
            return null;
        }

        baseline = baseline || inputSongs[Math.floor(Math.random() * inputSongs.length)];
        let candidate = inputSongs[Math.floor(Math.random() * inputSongs.length)];
        if (baseline.id === candidate.id) {
            let candidateIndex = inputSongs.indexOf(candidate);
            if (candidateIndex + 1 < inputSongs.length) {
                candidate = inputSongs[candidateIndex + 1];
            } else if (candidateIndex - 1 >= 0) {
                candidate = inputSongs[candidateIndex - 1];
            }
        }
        return new RatingPair(baseline, candidate);
    }

    //TODO handle empty playlist

    if (!playlistId || !inputSongs.length || !matchUp) {
        return <div>Loading...</div>;
    }


    //TODO display a message that data is local in case of anonymous users with an option to sign up

    return <div>
        <SongRatingHeader inputPlaylist={inputPlaylist}
                          onSave={async () => {
                              await createOutputPlaylist(inputPlaylist);
                          }}/>
        <div className="grid grid-cols-2 my-2 max-w-xl mx-auto">
            <div className="mx-4">
                <Artwork artwork={matchUp.baseline.artwork || null}/>
            </div>
            <div className="mx-4">
                <Artwork artwork={matchUp.candidate.artwork || null}/>
            </div>

            <h1 className="text-center text-xl font-bold my-2">{matchUp.baseline.title}</h1>
            <h1 className="text-center text-xl font-bold my-2">{matchUp.candidate.title}</h1>

            <h2 className="text-center text-sm font-semibold">{matchUp.baseline.artist}</h2>
            <h2 className="text-center text-sm font-semibold">{matchUp.candidate.artist}</h2>
        </div>
        <div className="flex flex-row my-2 max-w-xl mx-auto">
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
        <div className="flex flex-row justify-between">

            <div>
                Current ranking:
            </div>

            <div>
                {inputSongs.length} songs
            </div>

        </div>
        <PlaylistElo playlistId={playlistId} songs={inputSongs} ratings={ratings}/>
    </div>
}
