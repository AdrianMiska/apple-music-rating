import {getEloRating} from "./EloUtils";
import React, {useEffect} from "react";

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

    // @ts-ignore
    let nowPlayingItem = music.nowPlayingItem;
    // @ts-ignore
    let playing = music.isPlaying;
    music.addEventListener("playbackStateDidChange", () => {
        // @ts-ignore
        setIsPlaying(music.isPlaying && music.nowPlayingItem?.container.id === props.song.id);
    });


    useEffect(() => {
        // @ts-ignore
        setIsPlaying(playing && nowPlayingItem?.container.id === props.song.id);
    }, [nowPlayingItem, playing, props.song.id]);

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
        //music.volume = 0.5;
        // @ts-ignore
        await music.setQueue({song: props.song.id, startPlaying: true});
        setIsPlaying(true);
    }

    async function stop() {
        await music.stop();
        setIsPlaying(false);
    }

    function getArtworkUrl() {
        let artwork = props.song.attributes?.artwork;
        let height = props.song.attributes?.artwork.height;
        let width = props.song.attributes?.artwork.width;
        return artwork && height && width
            ? window.MusicKit.formatArtworkURL(artwork, height, width)
            : "";
    }

    return <div className="flex flex-col items-center">
        <img className="w-32 h-32 rounded mb-4"
             src={getArtworkUrl()}
             alt={`${props.song.attributes?.name} by ${props.song.attributes?.artistName} album art`}/>

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