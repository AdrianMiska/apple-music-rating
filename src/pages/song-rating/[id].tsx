import React, { useCallback, useEffect, useMemo } from "react";
import { calculateElo, EloRecord, getEloRatings } from "../../EloUtils";
import { PlaylistElo } from "../../components/PlaylistElo";
import { SongRatingHeader } from "../../components/SongRatingHeader";
import { Playlist, Song, useMusic } from "../../MusicWrapper";
import { RequireAuthentication } from "../../RequireAuthentication";
import { RequireAuthorization } from "../../RequireAuthorization";
import { useRouter } from "next/router";
import { MatchUpPlayer } from "../../components/matchUpPlayer";

export type RatingPair = {
  baseline: Song;
  candidate: Song;
};

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
      }
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

  let inputSongsSortedByCount = useMemo(() => {
    if (!eloRecords) {
      return [];
    }
    let inputSongsByCount = [...songs];
    inputSongsByCount.sort((a, b) => {
      return (
        (eloRecords?.get(a.id)?.ratingCount || 0) -
        (eloRecords?.get(b.id)?.ratingCount || 0)
      );
    });
    return inputSongsByCount;
  }, [songs, eloRecords]);

  const getMatchUp = useCallback(() => {
    if (songs.length === 0) {
      return null;
    }

    let baseline = songs[Math.floor(Math.random() * songs.length)];
    let candidate: Song;

    if (Math.random() < 0.3) {
      // in 30% of the cases, we pick a random song from the playlist
      candidate = songs[Math.floor(Math.random() * songs.length)];
    } else {
      // otherwise we determine a random song with a ratingCount below the median
      let median = Math.floor(songs.length / 2);
      candidate = inputSongsSortedByCount[Math.floor(Math.random() * median)];
    }

    if (baseline.id === candidate.id) {
      let candidateIndex = songs.indexOf(candidate);
      if (candidateIndex + 1 < songs.length) {
        candidate = songs[candidateIndex + 1];
      } else if (candidateIndex - 1 >= 0) {
        candidate = songs[candidateIndex - 1];
      }
    }
    if (Math.random() < 0.5) {
      setMatchUp({ baseline, candidate });
    } else {
      setMatchUp({ baseline: candidate, candidate: baseline });
    }
  }, [songs, inputSongsSortedByCount]);

  useEffect(() => {
    if (inputSongsSortedByCount.length > 0 && !matchUp) {
      // initial match up
      getMatchUp();
    }
  }, [matchUp, getMatchUp, inputSongsSortedByCount]);

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
      winner
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
