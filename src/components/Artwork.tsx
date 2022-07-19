import React, {useEffect, useRef} from "react";

const artworkStyleOverride = `
.artwork--container {
  width: \${size}rem !important;
  height: \${size}rem !important;
}

.artwork--container picture {
  align-items: unset !important;
  width: \${size}rem !important;
  height: \${size}rem !important;
}`;

/**
 * Displays Apple Music album art.
 */
export function Artwork(props: { artwork: MusicKit.Artwork | null, size: number }) {

    let ref = useRef<HTMLElement>();

    useEffect(() => {
        if (!!ref.current) {
            let webComponent = ref.current;
            // @ts-ignore
            webComponent.lazyLoad = true
            // @ts-ignore
            webComponent.width = 250;
            // @ts-ignore
            webComponent.source = props.artwork;
            let style = document.createElement("style");
            style.innerHTML = artworkStyleOverride.replace(/\$\{size}/g, props.size.toString());
            webComponent?.shadowRoot?.appendChild(style);
        }
    }, [props.artwork, props.size, ref]);
    return <div className={"rounded overflow-hidden w-fit h-fit"}>
        {// @ts-ignore
            <apple-music-artwork ref={ref}/>
        }
    </div>
}