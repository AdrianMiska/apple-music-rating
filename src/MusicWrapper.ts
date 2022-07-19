export namespace MusicWrapper {

    class Music {

        private musicKit: MusicKit.MusicKitInstance | undefined;

        async getMusicKit() {
            if (this.musicKit) {
                return this.musicKit;
            }
            const script = document.createElement("script");

            script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
            script.setAttribute("data-web-components", "");
            script.async = true;

            document.body.appendChild(script);

            this.musicKit = await new Promise<MusicKit.MusicKitInstance>(resolve => {
                document.addEventListener('musickitloaded', async function () {
                    let instance = await window.MusicKit.configure({
                        developerToken: process.env.REACT_APP_MUSIC_KIT_DEVELOPER_TOKEN,
                        app: {
                            name: 'Elo Music Rating',
                            build: '0.1.0'
                        },
                    });
                    resolve(instance);
                });
            });

            return this.musicKit;

        }

        async playPreview(song: Song) {
            const music = await this.getMusicKit();
            // @ts-ignore
            music.previewOnly = true;

            // @ts-ignore
            music.volume = 0.5;

            // @ts-ignore
            await music.setQueue({song: song.catalogId || song.id, startPlaying: true});
        }


        onPlaybackChange(callback: () => void) {
            this.getMusicKit().then(music => {
                music.addEventListener("playbackStateDidChange", () => {
                    callback();
                });
            });
        }

        async isPlaying(song: Song | null): Promise<boolean> {
            if (!song) {
                return false;
            }
            return false;
        }

        async stop() {
            const music = await this.getMusicKit();
            music.stop();
        }

        async isAuthorized() {
            return (await this.getMusicKit()).isAuthorized;
        }
    }

    export class Song {
        id: string;
        title: string | null | undefined;
        artist: string | null | undefined;
        album: string | null | undefined;
        artwork: MusicKit.Artwork | null | undefined;
        catalogId: string | null | undefined;

        constructor(song: MusicKit.Songs | MusicKit.MusicVideos) {
            this.id = song.id;
            this.title = song.attributes?.name;
            this.artist = song.attributes?.artistName;
            this.album = song.attributes?.albumName;
            this.artwork = song.attributes?.artwork;
            // @ts-ignore
            this.catalogId = song.attributes?.playParams?.catalogId;
        }


    }

    export class Playlist {

    }

    let instance: Music;

    export function getInstance(): Music {
        if (!instance) {
            instance = new Music();
        }
        return instance;
    }
}