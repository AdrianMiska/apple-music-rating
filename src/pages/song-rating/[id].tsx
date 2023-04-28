import React, {useEffect} from "react";
import {calculateElo, EloRecord, getEloRatings} from "../../EloUtils";
import {PlaylistElo} from "../../components/PlaylistElo";
import {SongRatingHeader} from "../../components/SongRatingHeader";
import {HeartIcon} from "@heroicons/react/solid";
import {PlayButton} from "../../components/PlayButton";
import {Playlist, Song, useMusic} from "../../MusicWrapper";
import {Artwork} from "../../components/Artwork";
import {RequireAuthentication} from "../../RequireAuthentication";
import {RequireAuthorization} from "../../RequireAuthorization";
import {useRouter} from "next/router";

class RatingPair {
    constructor(public baseline: Song, public candidate: Song) {
    }
}

export default function SongRatingWrapper() {

    return <RequireAuthentication>
        <RequireAuthorization>
            <SongRating/>
        </RequireAuthorization>
    </RequireAuthentication>
}

function SongRating(){

    const router = useRouter()
    let playlistId = router.query.id as string;
    let [inputSongs, setInputSongs] = React.useState<Song[]>([]);
    let [inputSongsSortedByCount, setInputSongsSortedByCount] = React.useState<Song[]>([]);
    let [inputPlaylist, setInputPlaylist] = React.useState<Playlist>();
    let [matchUp, setMatchUp] = React.useState<RatingPair>();

    let [eloRecords, setEloRecords] = React.useState<Map<string, EloRecord>>(new Map());

    let [firstMatchUpDone, setFirstMatchUpDone] = React.useState(false);

    let music = useMusic();

    useEffect(() => {
        if (!playlistId) {
            return;
        }
        let unsub = getEloRatings(playlistId, (ratings: { [key: string]: EloRecord }) => {
            setEloRecords(new Map(Object.entries(ratings)));
        });

        return () => unsub?.()

    }, [playlistId]);

    useEffect(() => {
        if (!playlistId) {
            return;
        }
        music.getPlaylist(playlistId)
            .then((playlist?: Playlist) => {
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
        if (inputSongsSortedByCount.length > 0 && !firstMatchUpDone) {
            getMatchUp();
            setFirstMatchUpDone(true);
        }
    }, [inputSongsSortedByCount, firstMatchUpDone]);


    useEffect(() => {
        let inputSongsByCount = Array.from(inputSongs.values()).sort((a, b) => {
            return (eloRecords.get(a.id)?.rating || 0) - (eloRecords.get(b.id)?.rating || 0);
        });
        setInputSongsSortedByCount(inputSongsByCount);
    }, [inputSongs, eloRecords]);


    async function saveSortedPlaylist(inputSongs: Song[], playlist?: Playlist) {
        let sorted = inputSongs.sort((a, b) => {
            let aRating = eloRecords.get(a.id)?.rating || 0;
            let bRating = eloRecords.get(b.id)?.rating || 0;
            if (aRating === bRating) {
                return 0;
            }
            return aRating > bRating ? -1 : 1;
        });
        await music.saveSortedPlaylist(sorted, playlist);
    }

    function getMatchUp() {

        if (inputSongs.length === 0) {
            return null;
        }

        let baseline = inputSongs[Math.floor(Math.random() * inputSongs.length)];
        let candidate: Song;

        if (Math.random() < 0.5) {
            // in 50% of the cases, we pick a random song from the playlist
            candidate = inputSongs[Math.floor(Math.random() * inputSongs.length)];
        } else {
            // otherwise we determine a random song with a ratingCount below the median
            let median = Math.floor(inputSongs.length / 2);
            candidate = inputSongsSortedByCount[Math.floor(Math.random() * median)];
        }

        if (baseline.id === candidate.id) {
            let candidateIndex = inputSongs.indexOf(candidate);
            if (candidateIndex + 1 < inputSongs.length) {
                candidate = inputSongs[candidateIndex + 1];
            } else if (candidateIndex - 1 >= 0) {
                candidate = inputSongs[candidateIndex - 1];
            }
        }
        if (Math.random() < 0.5) {
            setMatchUp(new RatingPair(baseline, candidate));
        } else {
            setMatchUp(new RatingPair(candidate, baseline));
        }
    }

    //TODO handle empty playlist

    if (!playlistId || !inputSongs.length || !matchUp) {
        return <div>Loading...</div>;
    }

    //TODO display a message that data is local in case of anonymous users with an option to sign up

    return <div>
        <SongRatingHeader inputPlaylist={inputPlaylist}
                          onSave={async () => {
                              await saveSortedPlaylist(inputSongs, inputPlaylist);
                          }}/>
        <div className="grid grid-cols-2 my-2 max-w-xl mx-auto">
            <div className="mx-4 mt-auto">
                <Artwork artwork={matchUp.baseline.artwork || null}/>
            </div>
            <div className="mx-4 mt-auto">
                <Artwork artwork={matchUp.candidate.artwork || null}/>
            </div>

            <h1 className="text-center text-xl font-bold m-2">{matchUp.baseline.title}</h1>
            <h1 className="text-center text-xl font-bold m-2">{matchUp.candidate.title}</h1>

            <h2 className="text-center text-sm font-semibold mx-2">{matchUp.baseline.artist}</h2>
            <h2 className="text-center text-sm font-semibold mx-2">{matchUp.candidate.artist}</h2>
        </div>
        <div className="flex flex-row my-2 max-w-xl mx-auto">
            <div className="flex flex-col w-full items-center">
                <div className="flex flex-row items-center">
                    <button
                        className="bg-gray-500 border-0 text-white hover:bg-gray-700 rounded-full h-10 w-10 p-2"
                        onClick={async () => {
                            await music.stop();
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "baseline");
                            getMatchUp();
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
                        await music.stop();
                        await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "tie");
                        getMatchUp();
                    }}>Tie
                </button>
            </div>
            <div className="flex flex-col w-full items-center">
                <div className="flex flex-row items-center">
                    <PlayButton song={matchUp.candidate}/>
                    <button
                        className="bg-gray-500 border-0 text-white hover:bg-gray-700 rounded-full h-10 w-10 p-2"
                        onClick={async () => {

                            await music.stop();
                            await calculateElo(playlistId!, matchUp!.baseline, matchUp!.candidate, "candidate");
                            getMatchUp();
                        }
                        }>
                        <HeartIcon/>
                    </button>
                </div>
            </div>
        </div>
        <div className="flex flex-row justify-between max-w-2xl mx-auto">

            <div>
                Current ranking:
            </div>

            <div>
                {inputSongs.length} songs
            </div>

        </div>
        <PlaylistElo playlistId={playlistId} songs={inputSongs} ratings={eloRecords}/>
    </div>

}
