import React from "react";
import {createPlaylist, updatePlaylist} from "./PlaylistUtils";
import Playlists = MusicKit.Playlists;
import LibraryPlaylists = MusicKit.LibraryPlaylists;
import Songs = MusicKit.Songs;

type State = {
    heavyRotation: Playlists[],
    searchTerm: string,
    searchResults: LibraryPlaylists[],
    selectedPlaylist: Playlists | null,
    selectedOutputPlaylist: Playlists | null,
    favorites: Playlists | null,
};

type Props = {
    onSelectedInputPlaylist: (selectedInputPlaylist: Playlists | LibraryPlaylists) => void
};

export class InputSelection extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            heavyRotation: [],
            searchTerm: "",
            searchResults: [],
            selectedPlaylist: null,
            selectedOutputPlaylist: null,
            favorites: null
        };
    }

    componentDidMount() {
        window.MusicKit.getInstance().api.historyHeavyRotation().then(response => {
            this.setState({heavyRotation: response as any});
        });

        window.MusicKit.getInstance().api.library.search("Favorites", {
            types: "library-playlists",
            limit: "25"
        }).then(response => {
            let result = (response as any)["library-playlists"]?.data.filter((playlist: Playlists) => {
                return playlist.attributes?.name === "Favorites" && playlist.attributes?.description?.standard.includes("Music Rating");
            });
            if (result.length > 0) {
                this.setState({favorites: result[0]});
            }
        });
    }

    search(term: string) {
        if (!term) {
            this.setState({searchResults: []});
            return;
        }
        window.MusicKit.getInstance().api.library.search(term, {types: "playlists", limit: "25"}).then(response => {
            this.setState({searchResults: (response as any)["library-playlists"]?.data});
        });
    }

    /**
     * Will filter the songs from the response and return only the ones with a favorite rating.
     * @param songs
     * @private
     */
    private async getFavorites(songs: Songs[]): Promise<Songs[]> {

        // construct query string
        let query = "ids=";
        for (let song of songs) {
            query += song.id + "%2C";
        }
        query = query.substring(0, query.length - 3);

        let result = await fetch("https://api.music.apple.com/v1/me/ratings/library-songs?" + query, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + window.MusicKit.getInstance().developerToken,
                "Music-User-Token": window.MusicKit.getInstance().musicUserToken
            }
        }).then(response => {
            return response.json();
        });

        return result.data
            .filter((rating: any) => rating.attributes.value === 1)
            .map((rating: { id: string; }) => {
                return songs.find(song => song.id === rating.id);
            });
    }

    /**
     * Will create a playlist with the name "Favorites" and add all the songs from the user's favorites.
     * This is a workaround for the fact that the Apple Music API doesn't allow us to access the user's favorites.
     *
     * @private
     */
    private async createOrUpdateFavorites() {

        // due to Apple not allowing us to update playlists, we need to create a new playlist
        // to make things worse, deleting a playlist is also not allowed, so we will clutter the users libraries :(

        //let favoritesPlaylist = this.state.favorites || await createPlaylist("Favorites", "Playlist of all your favorite songs. Created by Music Rating.");

        let favoritesPlaylist = await createPlaylist("Favorites", "Playlist of all your favorite songs. Created by Music Rating.");

        let offset = 0;
        let limit = 100;
        let favorites: Songs[] = [];

        while (true) {
            let songs = await window.MusicKit.getInstance().api.library.songs(null, {
                limit: limit,
                offset: offset
            });
            favorites = favorites.concat(await this.getFavorites(songs));
            offset += limit;

            if (songs.length < limit) {
                break;
            }
        }

        await updatePlaylist(favoritesPlaylist, favorites);
        this.setState({favorites: favoritesPlaylist});
    }

    render() {
        return <div>
            <span>Use all the songs you marked as favorite:</span>
            <div>
                {this.state.favorites
                    ? <div>
                        <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                                onClick={() => this.props.onSelectedInputPlaylist(this.state.favorites!)}>
                            Use Favorites
                        </button>
                        <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                                onClick={() => this.createOrUpdateFavorites().then(() => this.props.onSelectedInputPlaylist(this.state.favorites!))}>
                            Re-Create Favorites playlist
                        </button>
                    </div>
                    :
                    <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                            onClick={() => this.createOrUpdateFavorites().then(() => this.props.onSelectedInputPlaylist(this.state.favorites!))}>
                        Create Favorites Playlist
                    </button>
                }
            </div>
            <span>Or select a playlist you frequently listened to:</span>
            {this.state.heavyRotation
                .sort((a, b) => a.attributes && b.attributes ? a.attributes.name.localeCompare(b.attributes.name) : 0)
                .map(playlist => {
                    return <div>
                        <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                                onClick={() => this.props.onSelectedInputPlaylist(playlist)}>
                            {playlist.attributes?.name}
                        </button>
                    </div>;
                })}
            <span>Or search for a playlist:</span>
            <input type="text"
                   placeholder="Search"
                   className={"bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-slate-500"}
                   value={this.state.searchTerm}
                   onChange={e => {
                       this.setState({searchTerm: e.target.value});
                       this.search(e.target.value);
                   }}/>
            <div>
                {this.state.searchResults?.map(playlist => {
                    return <div>
                        <button className="bg-slate-500 hover:bg-slate-700
                        text-white font-bold py-2 px-4 rounded"
                                onClick={() => this.props.onSelectedInputPlaylist(playlist)}>
                            {playlist.attributes?.name}
                        </button>
                    </div>;
                })}
            </div>

        </div>;
    }


}