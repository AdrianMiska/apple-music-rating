import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {MusicWrapper} from "../MusicWrapper";

/**
 * A clickable tile which represents a playlist. It has a nice hover effect and clicking the tile itself will take you to the song-rating page.
 */
function PlaylistTile(props: { playlist: MusicWrapper.Playlist, onClick: () => void }) {
    return <div className="w-1/2 md:w-1/3 lg:w-1/4 my-2">
        <div
            className="flex m-2 p-3 h-full cursor-pointer bg-white rounded-lg shadow-lg hover:bg-gray-100 hover:shadow-md justify-center"
            onClick={props.onClick}>

            <span className="font-bold text-xl my-auto">
                {props.playlist.name}
            </span>

        </div>

    </div>;
}

export function SelectPlaylist() {

    let [searchTerm, setSearchTerm] = React.useState<string>("");
    let [searchResults, setSearchResults] = React.useState<MusicWrapper.Playlist[]>([]);
    let [favorites, setFavorites] = React.useState<MusicWrapper.Playlist | null>(null);

    useEffect(() => {
        MusicWrapper.getInstance().getLatestFavorites().then(favorites => setFavorites(favorites));
    }, []);

    useEffect(() => {
        MusicWrapper.getInstance().searchPlaylist(searchTerm).then((results) => {
            setSearchResults(results);
        });
    }, [searchTerm]);


    let navigate = useNavigate();

    return <div>
        <span>Use all the songs you marked as favorite:</span>
        <div className="mb-4">
            {favorites
                ? <div>
                    <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                            onClick={() => navigate("/song-rating/" + favorites!.id)}>
                        Use Favorites
                    </button>
                    <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                            onClick={async () => {
                                await setFavorites(await MusicWrapper.getInstance().createOrUpdateFavorites());
                                navigate("/song-rating/" + favorites!.id)
                            }}>
                        Re-Create Favorites playlist
                    </button>
                </div>
                :
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                        onClick={async () => {
                            await setFavorites(await MusicWrapper.getInstance().createOrUpdateFavorites());
                            navigate("/song-rating/" + favorites!.id)
                        }}>
                    Create Favorites Playlist
                </button>
            }
        </div>
        <p>Or search for a playlist:</p>
        <input type="text"
               placeholder="Search"
               className="bg-gray-200 appearance-none border-2 border-gray-200 rounded-full
               w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-700 max-w-sm"
               value={searchTerm}
               onChange={e => {
                   setSearchTerm(e.target.value);
               }}/>
        <div className="flex flex-wrap">
            {searchResults?.map(playlist => {
                return <PlaylistTile playlist={playlist} onClick={() => {
                    navigate(`/song-rating/${playlist.id}`);
                }}/>
            })}
        </div>

    </div>;


}