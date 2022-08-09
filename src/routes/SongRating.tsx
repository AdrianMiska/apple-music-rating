import React, {useEffect} from "react";
import {calculateElo, EloRecord, getEloRatings} from "../EloUtils";
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

    let [eloRecords, setEloRecords] = React.useState<Map<string, EloRecord>>(new Map());
    let [eloRecordsSorted, setEloRecordsSorted] = React.useState<EloRecord[]>([]);

    useEffect(() => {
        if (!playlistId) {
            return;
        }
        let unsub = getEloRatings(playlistId, (ratings: { [key: string]: EloRecord }) => {
            setEloRecords(new Map(Object.entries(ratings)));
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
        if (inputSongs.length > 0 && eloRecordsSorted.length > 0) {
            getMatchUp();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputSongs, eloRecordsSorted]);


    useEffect(() => {
        let recordsByCount = Array.from(eloRecords.values()).sort((a, b) => {
            return a.ratingCount - b.ratingCount;
        });
        setEloRecordsSorted(recordsByCount);
    }, [eloRecords]);


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
            let aRating = eloRecords.get(a.id)?.rating || 0;
            let bRating = eloRecords.get(b.id)?.rating || 0;
            if (aRating === bRating) {
                return 0;
            }
            return aRating > bRating ? -1 : 1;
        });
        await MusicWrapper.getInstance().updatePlaylist(outputPlaylist, sorted);
    }

    function getMatchUp() {

        if (inputSongs.length === 0) {
            return null;
        }

        let baseline = inputSongs[Math.floor(Math.random() * inputSongs.length)];
        let candidate: MusicWrapper.Song;

        if (Math.random() < 0.5) {
            // in 50% of the cases, we pick a random song from the playlist
            candidate = inputSongs[Math.floor(Math.random() * inputSongs.length)];
        } else {
            // otherwise we determine a random song with a ratingCount below the median
            let median = Math.floor(eloRecordsSorted.length / 2);
            let candidateRecord = eloRecordsSorted[Math.floor(Math.random() * median)];
            candidate = inputSongs.find(song => song.id === candidateRecord.songId) || inputSongs[Math.floor(Math.random() * inputSongs.length)];
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
                              await createOutputPlaylist(inputPlaylist);
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
                            await MusicWrapper.getInstance().stop();
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
                        await MusicWrapper.getInstance().stop();
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

                            await MusicWrapper.getInstance().stop();
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
