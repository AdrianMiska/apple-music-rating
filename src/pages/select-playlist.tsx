import React, {useEffect} from "react";
import {MusicProvider, Playlist, useMusic} from "../MusicWrapper";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpotify} from "@fortawesome/free-brands-svg-icons";
import {faMusic} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import {RequireAuthentication} from "../RequireAuthentication";
import {RequireAuthorization} from "../RequireAuthorization";

/**
 * A clickable tile which represents a playlist. It has a nice hover effect and clicking the tile itself will take you to the song-rating page.
 */
export function PlaylistTile(props: {
  musicProvider: MusicProvider;
  name: string;
  target: string;
}) {
  function getIcon() {
    switch (props.musicProvider) {
      case MusicProvider.Spotify:
        return (
          <FontAwesomeIcon
            icon={faSpotify}
            className="mr-2 self-center text-center text-3xl"
          />
        );
      case MusicProvider.AppleMusic:
        return (
          <FontAwesomeIcon
            icon={faMusic}
            className="mr-2 self-center text-center text-3xl"
          />
        );
    }
  }

  return (
    <div className="my-2">
      <Link
        href={props.target}
        className="mx-2 flex h-full cursor-pointer justify-evenly break-words rounded-lg bg-white px-4
            py-5 shadow-lg hover:bg-gray-100 hover:shadow-md"
      >
        {getIcon()}

        <p className="my-auto text-xl font-bold">{props.name}</p>
      </Link>
    </div>
  );
}

export default function SelectPlaylist() {
  let [searchTerm, setSearchTerm] = React.useState<string>("");
  let [searchResults, setSearchResults] = React.useState<Playlist[]>([]);
  let [appleMusicUser, setAppleMusicUser] = React.useState<boolean>(false);
  let [spotifyUser, setSpotifyUser] = React.useState<boolean>(false);

  let music = useMusic();

  useEffect(() => {
    music.getAuthorizations().then((authorizations) => {
      if (authorizations.includes(MusicProvider.AppleMusic)) {
        setAppleMusicUser(true);
      }
      if (authorizations.includes(MusicProvider.Spotify)) {
        setSpotifyUser(true);
      }
    });
  }, [music]);

  useEffect(() => {
    music.searchPlaylist(searchTerm).then((results) => {
      setSearchResults(results);
    });
  }, [music, searchTerm]);

  return (
    <RequireAuthentication>
      <RequireAuthorization>
        <p>Use all the songs you marked as favorite:</p>
        <div className="my-3">
          <div className="flex flex-row justify-center">
            {appleMusicUser && (
              <PlaylistTile
                musicProvider={MusicProvider.AppleMusic}
                name="Favorites"
                target="/song-rating/apple-music-favorites"
              />
            )}
            {spotifyUser && (
              <PlaylistTile
                musicProvider={MusicProvider.Spotify}
                name="Favorites"
                target="/song-rating/spotify-saved-tracks"
              />
            )}
          </div>
        </div>
        <p>Or search for a playlist:</p>
        <input
          type="text"
          placeholder="Search"
          className="my-3 w-11/12 max-w-sm appearance-none  rounded-full
               border-2 border-gray-200 bg-gray-200 px-4 py-2 leading-tight text-gray-700 focus:border-blue-700 focus:bg-white focus:outline-none"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {searchResults?.map((playlist) => {
            return (
              <PlaylistTile
                key={playlist.id}
                musicProvider={playlist.musicProvider}
                name={playlist.name}
                target={`/song-rating/${playlist.id}`}
              />
            );
          })}
        </div>
      </RequireAuthorization>
    </RequireAuthentication>
  );
}
