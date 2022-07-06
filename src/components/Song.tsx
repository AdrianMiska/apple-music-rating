import {getEloRating} from "../EloUtils";
import React, {useEffect} from "react";
import {Artwork} from "./Artwork";




/**
 * Displays a song with its album art, title, and artist.
 *
 * Below a play button which when clicked will play a preview of the song.
 *
 */
export function Song(props: { song: MusicKit.Songs | MusicKit.MusicVideos, playlistId: string }) {

    let [rating, setRating] = React.useState<number>(0);
    let [isPlaying, setIsPlaying] = React.useState<boolean>(false);

    let music = window.MusicKit.getInstance();


    music.addEventListener("playbackStateDidChange", () => {
        // @ts-ignore
        setIsPlaying(music.isPlaying && (music.nowPlayingItem?.container.id === props.song.id || nowPlayingItem?.container.id === props.song.attributes?.playParams?.catalogId));
    });

    // @ts-ignore
    let nowPlayingItem = music.nowPlayingItem;
    // @ts-ignore
    let playing = music.isPlaying;
    useEffect(() => {
        // @ts-ignore
        setIsPlaying(playing && (nowPlayingItem?.container.id === props.song.id || nowPlayingItem?.container.id === props.song.attributes?.playParams?.catalogId));
    }, [nowPlayingItem, playing, props.song]);

    useEffect(() => {
        getEloRating(props.playlistId, props.song).then(rating => {
            setRating(rating);
        });
    }, [props.song, props.playlistId]);

    async function playPreview() {
        const music = window.MusicKit.getInstance();
        // @ts-ignore
        music.previewOnly = true;

        // @ts-ignore
        music.volume = 0.5;
        // @ts-ignore
        await music.setQueue({song: props.song.attributes?.playParams?.catalogId || props.song.id, startPlaying: true});
        setIsPlaying(true);
    }

    async function stop() {
        await music.stop();
        setIsPlaying(false);
    }

    return <div className="flex flex-col items-center">
        <Artwork artwork={props.song.attributes?.artwork || null} size={8}/>

        <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{props.song.attributes?.name}</h1>
            <h2 className="text-sm font-semibold mb-2">{props.song.attributes?.artistName}</h2>
            <h2 className="text-sm font-semibold mb-2">Elo: {rating.toFixed(1)}</h2>

            {!isPlaying &&
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={playPreview}>
                    Play preview
                </button>
            }
            {isPlaying &&
                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        onClick={stop}>
                    Stop
                </button>
            }
        </div>
    </div>;

}