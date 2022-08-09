import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {MusicWrapper} from "../MusicWrapper";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpotify} from "@fortawesome/free-brands-svg-icons";
import {faMusic} from "@fortawesome/free-solid-svg-icons";
import MusicProvider = MusicWrapper.MusicProvider;

/**
 * A clickable tile which represents a playlist. It has a nice hover effect and clicking the tile itself will take you to the song-rating page.
 */
function PlaylistTile(props: { musicProvider: MusicWrapper.MusicProvider, name: string, onClick: () => void }) {

    function getIcon() {
        switch (props.musicProvider) {
            case MusicProvider.Spotify:
                return <FontAwesomeIcon icon={faSpotify} className="text-3xl text-center self-center mr-2"/>;
            case MusicProvider.AppleMusic:
                return <FontAwesomeIcon icon={faMusic} className="text-3xl text-center self-center mr-2"/>;
        }
    }

    return <div className="w-1/2 md:w-1/3 lg:w-1/4 my-2">
        <div
            className="flex mx-2 px-4 py-5 h-full cursor-pointer bg-white rounded-lg shadow-lg hover:bg-gray-100 hover:shadow-md justify-evenly break-words"
            onClick={props.onClick}>
            {getIcon()}

            <p className="font-bold text-xl my-auto">
                {props.name}
            </p>

        </div>

    </div>;
}

export function SelectPlaylist() {

    let [searchTerm, setSearchTerm] = React.useState<string>("");
    let [searchResults, setSearchResults] = React.useState<MusicWrapper.Playlist[]>([]);
    let [appleMusicUser, setAppleMusicUser] = React.useState<boolean>(false);
    let [spotifyUser, setSpotifyUser] = React.useState<boolean>(false);

    useEffect(() => {
        MusicWrapper.getInstance().getAuthorizations().then((authorizations) => {
            if (authorizations.includes(MusicProvider.AppleMusic)) {
                setAppleMusicUser(true);
            }
            if (authorizations.includes(MusicProvider.Spotify)) {
                setSpotifyUser(true);
            }
        });
    }, []);

    useEffect(() => {
        MusicWrapper.getInstance().searchPlaylist(searchTerm).then((results) => {
            setSearchResults(results);
        });
    }, [searchTerm]);


    let navigate = useNavigate();

    return <div>
        <p>Use all the songs you marked as favorite:</p>
        <div className="my-3">
            <div className="flex flex-row justify-center">
                {appleMusicUser &&
                    <PlaylistTile musicProvider={MusicWrapper.MusicProvider.AppleMusic}
                                  name={"Favorites"}
                                  onClick={() => navigate('/song-rating/apple-music-favorites')}/>}
                {spotifyUser &&
                    <PlaylistTile musicProvider={MusicWrapper.MusicProvider.Spotify}
                                  name={"Favorites"}
                                  onClick={() => navigate('/song-rating/spotify-saved-tracks')}/>}
            </div>
        </div>
        <p>Or search for a playlist:</p>
        <input type="text"
               placeholder="Search"
               className="appearance-none border-2 border-gray-200 bg-gray-200  rounded-full
               my-3 py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-700 w-11/12 max-w-sm"
               value={searchTerm}
               onChange={e => {
                   setSearchTerm(e.target.value);
               }}/>
        <div className="flex flex-wrap justify-center">
            {searchResults?.map(playlist => {
                return <PlaylistTile key={playlist.id}
                                     musicProvider={playlist.musicProvider}
                                     name={playlist.name}
                                     onClick={() => {
                                         navigate(`/song-rating/${playlist.id}`);
                                     }}/>
            })}
        </div>

    </div>;


}