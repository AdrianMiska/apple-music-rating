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

    return <div className="rounded overflow-hidden">

        <div className="flex aspect-square">
            {props.artwork !== null
                ? <img src={getUrl(props.artwork)}
                       className="object-scale-down max-w-full max-h-full"
                       style={{width: "300px", height: "300px"}}
                       loading="lazy"
                       alt="Album art"/>
                : <div className="text-center w-full h-full">
                    <div className="text-gray-500">
                        No artwork
                    </div>
                </div>
            }
        </div>

    </div>
}