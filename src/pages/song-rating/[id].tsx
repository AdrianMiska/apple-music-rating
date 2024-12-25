import React, { useCallback, useEffect } from "react";
import {
  calculateElo,
  EloRecord,
  getEloRatings,
  RatingPair,
  selectHighInformationMatchup,
} from "../../EloUtils";
import { PlaylistElo } from "../../components/PlaylistElo";
import { SongRatingHeader } from "../../components/SongRatingHeader";
import { Playlist, Song, useMusic } from "../../MusicWrapper";
import { RequireAuthentication } from "../../RequireAuthentication";
import { RequireAuthorization } from "../../RequireAuthorization";
import { useRouter } from "next/router";
import { MatchUpPlayer } from "../../components/matchUpPlayer";

export default function SongRatingWrapper() {
  return (
    <RequireAuthentication>
      <RequireAuthorization>
        <SongRating />
      </RequireAuthorization>
    </RequireAuthentication>
  );
}

function SongRating() {
  const router = useRouter();
  let playlistId = router.query.id as string;

  let [playlist, setPlaylist] = React.useState<Playlist>();
  let [matchUp, setMatchUp] = React.useState<RatingPair>();

  let [eloRecords, setEloRecords] = React.useState<Map<string, EloRecord>>();

  let music = useMusic();

  useEffect(() => {
    if (!playlistId) {
      return;
    }
    let unsub = getEloRatings(
      playlistId,
      (ratings: { [key: string]: EloRecord }) => {
        setEloRecords(new Map(Object.entries(ratings)));
      },
    );

    return () => unsub?.();
  }, [playlistId]);

  let [songs, setSongs] = React.useState<Song[]>([]);

  // has to be an effect, because we need to wait for the playlist to load
  useEffect(() => {
    if (!playlistId) {
      return;
    }
    music.getPlaylist(playlistId).then((playlist?: Playlist) => {
      setPlaylist(playlist);
      let songs = playlist?.tracks || [];
      //duplicates mess everything up, so we remove them
      let deduplicatedSongs = songs.filter((song, index) => {
        return songs.findIndex((s) => s.id === song.id) === index;
      });
      setSongs(deduplicatedSongs);
    });
  }, [music, playlistId]);

  const getMatchUp = useCallback(() => {
    if (!songs.length || !eloRecords) {
      return null;
    }
    const pair = selectHighInformationMatchup(songs, eloRecords);
    if (pair) {
      setMatchUp(pair);
    }
  }, [songs, eloRecords]);

  useEffect(() => {
    if (songs.length > 0 && !matchUp) {
      // initial match up
      getMatchUp();
    }
  }, [matchUp, getMatchUp, songs]);

  async function saveSortedPlaylist(inputSongs: Song[], playlist?: Playlist) {
    let sorted = inputSongs.sort((a, b) => {
      let aRating = eloRecords?.get(a.id)?.rating || 0;
      let bRating = eloRecords?.get(b.id)?.rating || 0;
      if (aRating === bRating) {
        return 0;
      }
      return aRating > bRating ? -1 : 1;
    });
    await music.saveSortedPlaylist(sorted, playlist);
  }

  async function processResult(winner: "baseline" | "candidate" | "tie") {
    await music.stop();
    await calculateElo(
      playlistId!,
      matchUp!.baseline,
      matchUp!.candidate,
      winner,
    );
    getMatchUp();
  }

  //TODO handle empty playlist

  if (!playlistId || !songs.length || !matchUp || !eloRecords) {
    return <div>Loading...</div>;
  }

  //TODO display a message that data is local in case of anonymous users with an option to sign up

  return (
    <div>
      <SongRatingHeader
        inputPlaylist={playlist}
        onSave={async () => {
          await saveSortedPlaylist(songs, playlist);
        }}
      />

      <MatchUpPlayer processResult={processResult} matchUp={matchUp} />

      <PlaylistElo songs={songs} ratings={eloRecords} />
    </div>
  );
}
