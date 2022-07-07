import React, {useEffect} from "react";
import {PlayIcon, StopIcon} from "@heroicons/react/solid";

import {isPlaying as songIsPlaying} from "../PlaylistUtils";

/**
 * A nice-looking, round button which when clicked will play a preview of the song. If the song is already playing, it will stop.
 */
export function PlayButton(props: { song: MusicKit.Songs | MusicKit.MusicVideos }) {

    let [isPlaying, setIsPlaying] = React.useState<boolean>(false);

    let music = window.MusicKit.getInstance();


    music.addEventListener("playbackStateDidChange", () => {
        setIsPlaying(songIsPlaying(props.song));
    });


    useEffect(() => {
        setIsPlaying(songIsPlaying(props.song));
    }, [props.song]);

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

    return <button
        className="bg-transparent border-0 text-gray-500 hover:text-gray-700 rounded-full h-20 w-20"
        onClick={isPlaying ? stop : playPreview}>
        {isPlaying ? <StopIcon/> : <PlayIcon/>}
    </button>;

}