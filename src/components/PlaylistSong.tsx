import React from "react";
import {Artwork} from "./Artwork";
import {Song} from "../MusicWrapper";

/**
 * A song to be displayed as part of a playlist.
 */
export function PlaylistSong(props: { song: Song; rating: number }) {
  return (
    <div className="mx-auto my-2 flex max-w-2xl flex-row items-center">
      <div className="w-1/6">
        <Artwork artwork={props.song.artwork || null} />
      </div>
      <div className="w-4/6 px-4">
        <div className="flex flex-col text-left">
          <div className="line-clamp-1 text-ellipsis break-all text-sm font-bold">
            {props.song.title}
          </div>
          <div className="line-clamp-1 text-ellipsis break-all text-xs">
            {props.song.artist}
          </div>
        </div>
      </div>
      <div className="w-1/6">
        <div className="flex flex-col">
          <div className="flex flex-row items-center">
            <div className="w-full">
              <div className="text-sm">Elo: {props.rating.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
