import React, {useEffect} from "react";
import {PlayIcon, StopIcon} from "@heroicons/react/solid";
import {Song, useMusic} from "../MusicWrapper";

/**
 * A nice-looking, round button which when clicked will play a preview of the song. If the song is already playing, it will stop.
 */
export function PlayButton(props: { song: Song }) {

    let [isPlaying, setIsPlaying] = React.useState<boolean>(false);

    let music = useMusic();

    music.onPlaybackChange(() => {
        music.isPlaying(props.song).then(setIsPlaying);
    });


    useEffect(() => {
        music.isPlaying(props.song).then(setIsPlaying);
    }, [props.song, music]);

    async function playPreview() {
        await music.playPreview(props.song);
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