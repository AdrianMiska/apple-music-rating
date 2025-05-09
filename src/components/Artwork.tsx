import React from "react";
import {Artwork as MusicWrapperArtwork} from "../MusicWrapper";

/**
 * Displays album art.
 */
export function Artwork(props: { artwork: MusicWrapperArtwork | null }) {
  function getUrl(artwork: MusicWrapperArtwork): string {
    let url = artwork.url;
    url = url.replace("{w}", "500");
    url = url.replace("{h}", "500");
    return url;
  }

  return (
    <div className="overflow-hidden rounded-sm">
      <div className="flex aspect-square">
        {props.artwork !== null ? (
          <img
            src={getUrl(props.artwork)}
            className="h-auto w-full object-scale-down"
            loading="lazy"
            alt="Album art"
          />
        ) : (
          <div className="h-full w-full text-center">
            <div className="text-gray-500">No artwork</div>
          </div>
        )}
      </div>
    </div>
  );
}
