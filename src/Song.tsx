import {getEloRating} from "./EloUtils";
import React, {useEffect, useRef} from "react";

/**
 * Displays a song with its album art, title, and artist.
 *
 * Below a play button which when clicked will play a preview of the song.
 *
 */
export function Song(props: { song: MusicKit.Songs | MusicKit.MusicVideos, playlistId: string }) {

    let audio = useRef<HTMLAudioElement>(null);
    let [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    let [rating, setRating] = React.useState<number>(0);
    let [isPlaying, setIsPlaying] = React.useState<boolean>(false);

    let player = window.MusicKit.getInstance().player;

    player.addEventListener("playbackStateDidChange", () => {
        // @ts-ignore
        setIsPlaying(player.isPlaying && player.nowPlayingItem?.container.id === props.song.id);
    });

    useEffect(() => {
        // @ts-ignore
        setIsPlaying(player.isPlaying && player.nowPlayingItem?.container.id === props.song.id);
    }, [player.nowPlayingItem, player.isPlaying, props.song.id]);

    useEffect(() => {
        getPreviewUrl(props.song).then(previewUrl => {
            setPreviewUrl(previewUrl);
        });
        getEloRating(props.playlistId, props.song).then(rating => {
            setRating(rating);
        });
    }, [props.song, props.playlistId]);

    useEffect(() => {
        audio.current?.pause();
        audio.current?.load();
    }, [previewUrl]);


    async function getPreviewUrl(song: MusicKit.Songs | MusicKit.MusicVideos): Promise<string | null> {
        const music = window.MusicKit.getInstance();

        // @ts-ignore
        let catalogId = song.attributes?.playParams?.catalogId;

        if (!catalogId) {
            return null;
        }

        const catalogSong = await music.api.song(catalogId);
        return catalogSong.attributes?.previews[0].url || null;
    }

    async function playFullSong() {
        const music = window.MusicKit.getInstance();

        if (player.isPlaying) {
            player.stop();
        }

        audio.current?.pause();
        audio.current?.load();

        player.volume = 0.5;
        await music.setQueue({song: props.song.id});
        await player.play();
        setIsPlaying(true);
    }

    async function stop() {
        await player.stop();
        audio.current?.pause();
        audio.current?.load();
        setIsPlaying(false);
    }

    async function playPreview() {
        audio.current?.pause();
        audio.current?.load();
        await audio.current?.play();
        setIsPlaying(true);
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

            {previewUrl &&
                <audio ref={audio}>
                    <source src={previewUrl} type="audio/mpeg"/>
                </audio>
            }
            {!isPlaying &&
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={playPreview}>
                    Play preview
                </button>
            }

            {!isPlaying &&
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={playFullSong}>
                    Play full song
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