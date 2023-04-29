import { ChevronLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import React from "react";
import { Playlist, useMusic } from "../MusicWrapper";
import Link from "next/link";

export function SongRatingHeader(props: {
  inputPlaylist?: Playlist;
  onSave: () => Promise<void>;
}) {
  let music = useMusic();

  return (
    <div
      id="song-rating-header"
      className="relative my-3 flex items-center justify-between"
    >
      <div className="">
        <Link
          href="/select-playlist"
          className="flex items-center rounded bg-transparent pr-4 font-semibold text-gray-800 hover:bg-gray-200 hover:text-gray-900"
          onClick={async () => {
            await music.stop();
          }}
        >
          <ChevronLeftIcon className="mr-2 h-6 w-6" /> Back
        </Link>
      </div>
      <div className="line-clamp-1 text-ellipsis break-all text-xl font-bold">
        {props.inputPlaylist?.name}
      </div>
      <div className="">
        <button
          className="ml-auto flex items-center rounded bg-transparent pl-4 pr-2 font-semibold text-gray-800 hover:bg-gray-200 hover:text-gray-900"
          onClick={props.onSave}
        >
          <PlusIcon className="mr-2 h-4 w-4" /> Save
        </button>
      </div>
    </div>
  );
}
