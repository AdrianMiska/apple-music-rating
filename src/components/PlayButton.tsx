import React, {useEffect} from "react";
import {PlayIcon, StopIcon} from "@heroicons/react/24/solid";
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

  return (
    <button
      className="m-2 h-16 w-16 rounded-full border-0 bg-gray-500 p-2 text-white hover:bg-gray-700 sm:h-20 sm:w-20"
      onClick={isPlaying ? stop : playPreview}
    >
      {isPlaying ? <StopIcon /> : <PlayIcon className="ml-1" />}
    </button>
  );
}
