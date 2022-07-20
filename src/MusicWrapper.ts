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
            let music = await this.getMusicKit();
            // @ts-ignore
            return music.isPlaying && (music.nowPlayingItem?.container.id === song.id || music.nowPlayingItem?.container.id === song.catalogId);

        }

        async stop() {
            const music = await this.getMusicKit();
            music.stop();
        }

        async isAuthorized() {
            return (await this.getMusicKit()).isAuthorized;
        }

        async getPlaylist(playlistId: string): Promise<Playlist> {

            let musicKit = await this.getMusicKit();
            // @ts-ignore
            let musicKitPlaylist: MusicKit.LibraryPlaylists | MusicKit.Playlists = (await musicKit.api.music('v1/me/library/playlists/' + playlistId, {
                include: 'tracks',
            })).data.data[0];

            let songs: (MusicKit.Songs | MusicKit.MusicVideos)[] = musicKitPlaylist.relationships.tracks.data;

            // get all tracks from the paginated API
            const getTracks = async (next: string) => {
                const response = await fetch(`https://api.music.apple.com${next}`, {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + musicKit.developerToken,
                        'Music-User-Token': musicKit.musicUserToken
                    }
                });
                const data = await response.json();
                songs.push(...data.data);
                if (data.next) {
                    await getTracks(data.next);
                }
            }

            if (musicKitPlaylist?.relationships.tracks.next) {
                await getTracks(musicKitPlaylist.relationships.tracks.next);
            }

            return new Playlist(musicKitPlaylist, songs.map(song => new Song(song)));

        }

        async searchPlaylist(searchTerm: string): Promise<Playlist[]> {
            let musicKit = await this.getMusicKit();
            let effectiveSearchTerm = searchTerm.trim().replace(/[^a-zA-Z\d]/g, "*");
            if (effectiveSearchTerm.length === 0) {
                return [];
            }

            // @ts-ignore
            let results = (await musicKit.api.music('v1/me/library/search', {
                term: effectiveSearchTerm,
                types: "library-playlists",
                limit: "25"
            })).data.results["library-playlists"]?.data || [];

            console.log(results);

            return results.map((playlist: MusicKit.Playlists | MusicKit.LibraryPlaylists) => new Playlist(playlist))
        }

        async getLatestFavorites(): Promise<Playlist | null> {

            let searchResults = await this.searchPlaylist("Favorites")
            let favorites = searchResults.filter(playlist => {
                return playlist.name === "Favorites" && playlist.description.includes("Music Rating");
            });

            if (favorites.length <= 0) {
                return null;
            }

            return favorites.sort((a: Playlist, b: Playlist) => {
                let stringAddedA = b.dateAdded;
                let stringAddedB = a.dateAdded;
                if (!stringAddedA) {
                    return -1;
                }
                if (!stringAddedB) {
                    return 1;
                }
                return new Date(stringAddedB).getTime() - new Date(stringAddedA).getTime();
            })[0];
        }

        async createPlaylist(name: string, description: string): Promise<Playlist> {
            let musicKit = await this.getMusicKit();

            const response = await fetch('https://api.music.apple.com/v1/me/library/playlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + musicKit.developerToken,
                    'Music-User-Token': musicKit.musicUserToken
                },
                body: JSON.stringify({
                    attributes: {
                        name: name,
                        description: description,
                        public: false
                    }
                })
            });
            return (await response.json()).data[0];
        }

        async updatePlaylist(playlist: Playlist, songs: Song[]): Promise<any> {
            let musicKit = await this.getMusicKit();

            return fetch(`https://api.music.apple.com/v1/me/library/playlists/${playlist.id}/tracks`, {
                //method: 'PUT',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + musicKit.developerToken,
                    'Music-User-Token': musicKit.musicUserToken
                },
                body: JSON.stringify({
                    data: songs.map((songs) => {
                            return {
                                id: songs.id,
                                type: songs.type,
                            };
                        }
                    )
                })
            });
        }


        /**
         * Will filter the songs from the response and return only the ones with a favorite rating.
         * @param songs
         */
        private async getFavorites(songs: MusicKit.Songs[]): Promise<MusicKit.Songs[]> {

            let musicKit = await this.getMusicKit();


            // @ts-ignore
            let result = musicKit.api.music("v1/me/ratings/library-songs", {
                ids: songs.map((song: MusicKit.Songs) => song.id)
            });

            return result.data.data
                .filter((rating: any) => rating.attributes.value === 1)
                .map((rating: { id: string; }) => {
                    return songs.find(song => song.id === rating.id);
                });
        }

        /**
         * Will create a playlist with the name "Favorites" and add all the songs from the user's favorites.
         * This is a workaround for the fact that the Apple Music API doesn't allow us to access the user's favorites.
         *
         */
        async createOrUpdateFavorites(): Promise<Playlist> {

            let musicKit = await this.getMusicKit();

            // due to Apple not allowing us to update playlists, we need to create a new playlist
            // to make things worse, deleting a playlist is also not allowed, so we will clutter the users libraries :(

            let favoritesPlaylist = await this.createPlaylist("Favorites", "Playlist of all your favorite songs. Created by Elo Music Rating.");

            let offset = 0;
            let limit = 100;
            let favorites: Song[] = [];

            while (true) {
                // @ts-ignore
                let {data: {data: songs}} = (await musicKit.api.music("v1/me/library/songs", {
                    limit: limit,
                    offset: offset
                }));
                favorites = favorites.concat((await this.getFavorites(songs)).map((song) => new Song(song)));
                offset += limit;

                if (songs.length < limit) {
                    break;
                }
            }

            await this.updatePlaylist(favoritesPlaylist, favorites);
            return favoritesPlaylist;
        }
    }

    export class Song {
        id: string;
        title: string | null | undefined;
        artist: string | null | undefined;
        album: string | null | undefined;
        artwork: MusicKit.Artwork | null | undefined;
        catalogId: string | null | undefined;
        type: "songs" | "music-videos";
        genreNames: string[];

        constructor(song: MusicKit.Songs | MusicKit.MusicVideos) {
            this.id = song.id;
            this.title = song.attributes?.name;
            this.artist = song.attributes?.artistName;
            this.album = song.attributes?.albumName;
            this.artwork = song.attributes?.artwork;
            this.type = song.type;
            this.genreNames = song.attributes?.genreNames || [];
            // @ts-ignore
            this.catalogId = song.attributes?.playParams?.catalogId;
        }


    }

    export class Playlist {

        id: string;
        name: string;
        description: string;

        tempMusicKitPlaylist: MusicKit.Playlists | MusicKit.LibraryPlaylists;
        dateAdded: string | null;
        tracks: Song[] = [];


        constructor(playlist: MusicKit.Playlists | MusicKit.LibraryPlaylists, songs?: Song[]) {
            this.id = playlist.id;
            this.name = playlist.attributes?.name || "";
            this.description = playlist.attributes?.description?.standard || "";
            this.dateAdded = (playlist.type === "library-playlists" && playlist.attributes?.dateAdded) || null;
            this.tempMusicKitPlaylist = playlist;
            if (songs) {
                this.tracks = songs;
            }
        }


    }

    let instance: Music;

    export function getInstance(): Music {
        if (!instance) {
            instance = new Music();
        }
        return instance;
    }
}