import React, {useEffect} from "react";
import {createPlaylist, updatePlaylist} from "../PlaylistUtils";
import {useNavigate} from "react-router-dom";
import Playlists = MusicKit.Playlists;
import LibraryPlaylists = MusicKit.LibraryPlaylists;
import Songs = MusicKit.Songs;


export function SelectPlaylist() {

    let [heavyRotation, setHeavyRotation] = React.useState<Playlists[]>([]);
    let [searchTerm, setSearchTerm] = React.useState<string>("");
    let [searchResults, setSearchResults] = React.useState<LibraryPlaylists[]>([]);
    let [favorites, setFavorites] = React.useState<Playlists | null>(null);

    useEffect(() => {
        window.MusicKit.getInstance().api.historyHeavyRotation().then(response => {
            setHeavyRotation(response as any);
        });

        window.MusicKit.getInstance().api.library.search("Favorites", {
            types: "library-playlists",
            limit: "25"
        }).then(response => {
            let result = (response as any)["library-playlists"]?.data.filter((playlist: Playlists) => {
                return playlist.attributes?.name === "Favorites" && playlist.attributes?.description?.standard.includes("Music Rating");
            });
            if (result.length > 0) {
                setFavorites(result[0]);
            }
        });
    }, []);

    function search(term: string) {
        if (!term) {
            setSearchResults([]);
            return;
        }
        window.MusicKit.getInstance().api.library.search(term, {types: "playlists", limit: "25"}).then(response => {
            setSearchResults((response as any)["library-playlists"]?.data);
        });
    }

    /**
     * Will filter the songs from the response and return only the ones with a favorite rating.
     * @param songs
     * @private
     */
    async function getFavorites(songs: Songs[]): Promise<Songs[]> {

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
    async function createOrUpdateFavorites() {

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
            favorites = favorites.concat(await getFavorites(songs));
            offset += limit;

            if (songs.length < limit) {
                break;
            }
        }

        await updatePlaylist(favoritesPlaylist, favorites);
        setFavorites(favoritesPlaylist);
    }

    let navigate = useNavigate();

    return <div>
        <span>Use all the songs you marked as favorite:</span>
        <div>
            {favorites
                ? <div>
                    <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                            onClick={() => navigate("/song-rating/" + favorites!.id)}>
                        Use Favorites
                    </button>
                    <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                            onClick={() => createOrUpdateFavorites().then(() => navigate("/song-rating/" + favorites!.id))}>
                        Re-Create Favorites playlist
                    </button>
                </div>
                :
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                        onClick={() => createOrUpdateFavorites().then(() => navigate("/song-rating/" + favorites!.id))}>
                    Create Favorites Playlist
                </button>
            }
        </div>
        <span>Or select a playlist you frequently listened to:</span>
        {heavyRotation
            .sort((a, b) => a.attributes && b.attributes ? a.attributes.name.localeCompare(b.attributes.name) : 0)
            .map(playlist => {
                return <div key={"heavy-rotation-" + playlist.id}>
                    <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                            onClick={() => navigate("/song-rating/" + playlist.id)}>
                        {playlist.attributes?.name}
                    </button>
                </div>;
            })}
        <span>Or search for a playlist:</span>
        <input type="text"
               placeholder="Search"
               className={"bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-slate-500"}
               value={searchTerm}
               onChange={e => {
                   setSearchTerm(e.target.value);
                   search(e.target.value);
               }}/>
        <div>
            {searchResults?.map(playlist => {
                return <div key={"search-" + playlist.id}>
                    <button className="bg-slate-500 hover:bg-slate-700
                        text-white font-bold py-2 px-4 rounded"
                            onClick={() => navigate("/song-rating/" + playlist.id)}>
                        {playlist.attributes?.name}
                    </button>
                </div>;
            })}
        </div>

    </div>;


}