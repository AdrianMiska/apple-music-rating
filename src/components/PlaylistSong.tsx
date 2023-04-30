import React from "react";
import {Artwork} from "./Artwork";
import {Song} from "../MusicWrapper";

/**
 * A song to be displayed as part of a playlist.
 */
export function PlaylistSong(props: {
  song: Song;
  rating: number;
  ratingCount: number;
}) {
  return (
    <div className="mx-auto my-2 grid max-w-2xl grid-cols-12 items-center">
      <div className="col-span-2">
        <Artwork artwork={props.song.artwork || null} />
      </div>
      <div className="col-span-8 px-4">
        <div className="flex flex-col text-left">
          <div className="line-clamp-1 text-ellipsis break-all text-sm font-bold">
            {props.song.title}
          </div>
          <div className="line-clamp-1 text-ellipsis break-all text-xs">
            {props.song.artist}
          </div>
        </div>
      </div>
      <div className="col-span-1">
        <div className="text-sm">{props.rating.toFixed(1)}</div>
      </div>
      <div className="col-span-1">
        <div className="text-sm">{props.ratingCount} votes</div>
      </div>
    </div>
  );
}
