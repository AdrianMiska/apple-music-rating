import React from "react";
import {MusicWrapper} from "../MusicWrapper";

/**
 * Displays album art.
 */
export function Artwork(props: { artwork: MusicWrapper.Artwork | null }) {

    function getUrl(artwork: MusicWrapper.Artwork): string {
        let url = artwork.url;
        url = url.replace("{w}", artwork.width?.toString() || "300");
        url = url.replace("{h}", artwork.height?.toString() || "300");
        return url;
    }

    return <div className="rounded overflow-hidden w-fit h-fit">

        {props.artwork === null
            ? <div className="text-center">
                <div className="text-gray-500">
                    No artwork
                </div>
            </div>
            : <div className="max-h-max max-w-md">
                <picture>
                    <source type="image/jpeg" srcSet={getUrl(props.artwork)}/>
                    <img src={getUrl(props.artwork)} alt="Album art"/>
                </picture>

            </div>}

    </div>
}