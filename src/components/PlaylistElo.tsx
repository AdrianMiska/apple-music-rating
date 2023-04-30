import React, {useMemo} from "react";
import {PlaylistSong} from "./PlaylistSong";
import {Song} from "../MusicWrapper";
import {EloRecord} from "../EloUtils";

/**
 * This component will display the songs in a playlist along with their ratings.
 */
export function PlaylistElo(props: {
  songs: Song[];
  ratings: Map<string, EloRecord>;
}) {
  let sortedSongs = useMemo(
    () =>
      props.songs.sort((a, b) => {
        let aRecord = props.ratings.get(a.id)?.rating || 0;
        let bRecord = props.ratings.get(b.id)?.rating || 0;
        return bRecord - aRecord;
      }),
    [props.songs, props.ratings]
  );

  return (
    <div>
      <div className="mx-auto flex max-w-2xl flex-row justify-between">
        <div>Current ranking:</div>

        <div>{sortedSongs.length} songs</div>
      </div>
      {sortedSongs.map((song: Song) => {
        let rating = props.ratings.get(song.id)?.rating || 0;
        let ratingCount = props.ratings.get(song.id)?.ratingCount || 0;
        return (
          <PlaylistSong
            key={song.id}
            song={song}
            rating={rating}
            ratingCount={ratingCount}
          />
        );
      })}
    </div>
  );
}
