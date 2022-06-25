import {getEloRating} from "./EloUtils";
import React from "react";

/**
 * Displays a song with its album art, title, and artist.
 *
 * Below a play button which when clicked will play a preview of the song.
 *
 */
export class Song extends React.Component<{ song: MusicKit.Songs | MusicKit.MusicVideos }, { previewUrl: string | null }> {

    private readonly audio: React.RefObject<HTMLAudioElement>;

    constructor(props: { song: MusicKit.Songs | MusicKit.MusicVideos }) {
        super(props);
        this.state = {
            previewUrl: null
        }
        this.audio = React.createRef<HTMLAudioElement>();
    }

    componentDidMount() {
        this.getPreviewUrl(this.props.song).then(previewUrl => {
            this.setState({previewUrl});
        })
    }

    componentDidUpdate(prevProps: { song: MusicKit.Songs | MusicKit.MusicVideos }) {
        if (prevProps.song !== this.props.song) {
            this.getPreviewUrl(this.props.song).then(previewUrl => {
                this.setState({previewUrl}, () => {
                    this.audio.current?.pause();
                    this.audio.current?.load();
                });
            })
        }
    }

    async getPreviewUrl(song: MusicKit.Songs | MusicKit.MusicVideos): Promise<string | null> {
        const music = window.MusicKit.getInstance();

        // @ts-ignore
        let catalogId = song.attributes?.playParams?.catalogId;

        if (!catalogId) {
            return null;
        }

        const catalogSong = await music.api.song(catalogId);
        return catalogSong.attributes?.previews[0].url || null;
    }

    async play() {
        const music = window.MusicKit.getInstance();

        if (music.player.isPlaying) {
            //music.player.pause();
        }
        await music.setQueue({song: this.props.song.id});
        music.player.volume = 0;
        await music.play();
        music.player.volume = 1;
    }

    render() {

        let artworkAvailable = this.props.song.attributes?.artwork && this.props.song.attributes.artwork.height && this.props.song.attributes.artwork.width;
        let artworkURL = artworkAvailable
            ? window.MusicKit.formatArtworkURL(this.props.song.attributes!.artwork, this.props.song.attributes!.artwork.height, this.props.song.attributes!.artwork.width)
            : "";
        return <div className="flex flex-col items-center">
            <img className="w-32 h-32 rounded mb-4"
                 src={artworkURL}
                 alt={`${this.props.song.attributes?.name} by ${this.props.song.attributes?.artistName} album art`}/>

            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">{this.props.song.attributes?.name}</h1>
                <h2 className="text-sm font-semibold mb-2">{this.props.song.attributes?.artistName}</h2>
                <h2 className="text-sm font-semibold mb-2">Elo: {getEloRating(this.props.song)}</h2>

                {this.state.previewUrl &&
                    <audio controls ref={this.audio}>
                        <source src={this.state.previewUrl} type="audio/mpeg"/>
                    </audio>
                }
            </div>
        </div>;
    }
}