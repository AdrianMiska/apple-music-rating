/**
 * Gets the songs ELO rating from local storage
 */
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { Song } from "./MusicWrapper";
import Unsubscribe = firebase.Unsubscribe;

export class EloRecord {
  public songId: string;
  public rating: number;
  public ratingCount: number;

  constructor(songId: string, rating: number, ratingCount: number) {
    this.ratingCount = ratingCount;
    this.rating = rating;
    this.songId = songId;
  }
}

export type RatingPair = {
  baseline: Song;
  candidate: Song;
};

function computeEntropy(prob: number) {
  if (prob === 0 || prob === 1) return 0;
  return -prob * Math.log2(prob) - (1 - prob) * Math.log2(1 - prob);
}

function getFirebaseUid(): string | undefined {
  return firebase.auth().currentUser?.uid;
}

function computeWinProbability(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 480));
}

export function selectHighInformationMatchup(
  songs: Song[],
  eloRecords: Map<string, EloRecord>
): RatingPair | null {
  // If there are less than 2 songs, we cannot create a matchup
  if (songs.length < 2) return null;

  let bestScore = -1;
  let bestPair: RatingPair | null = null;

  // Iterate through all possible pairs of songs
  for (let i = 0; i < songs.length; i++) {
    for (let j = i + 1; j < songs.length; j++) {
      let a = songs[i];
      let b = songs[j];
      let aElo = eloRecords.get(a.id)?.rating || 0;
      let bElo = eloRecords.get(b.id)?.rating || 0;
      let aCount = eloRecords.get(a.id)?.ratingCount || 0;
      let bCount = eloRecords.get(b.id)?.ratingCount || 0;

      // Calculate the probability of song a winning against song b
      let p = computeWinProbability(aElo, bElo);

      // Compute the entropy of the matchup
      let H = computeEntropy(p);

      // Weight the entropy by the inverse of the sum of rating counts
      let W = 1 / (1 + aCount + bCount);

      // Calculate the score of this matchup with added randomness
      let score = H * W * (0.9 + Math.random() * 0.2);

      // If this score is the best we've seen, update the bestPair
      if (score > bestScore) {
        bestScore = score;
        // Randomly decide which song is the baseline and which is the candidate
        bestPair =
          Math.random() < 0.5
            ? { baseline: a, candidate: b }
            : { baseline: b, candidate: a };
      }
    }
  }

  // Return the pair with the highest score
  return bestPair;
}

export async function setEloRating(
  playlistId: string,
  song: Song,
  rating: number,
  ratingCount: number
) {
  let firebaseUid = getFirebaseUid();
  if (!!firebaseUid) {
    let firestore = getFirestore();

    let docRef = doc(
      firestore,
      "users",
      firebaseUid,
      "playlists",
      playlistId,
      "songs",
      song.id
    );
    return await setDoc(docRef, { rating: rating, ratingCount: ratingCount });
  } else {
    localStorage.setItem(playlistId + "/" + song.id, rating.toString());
    localStorage.setItem(
      playlistId + "/" + song.id + "/ratingCount",
      ratingCount.toString()
    );
  }
}

export async function getEloRating(
  playlistId: string,
  song: Song
): Promise<EloRecord> {
  let firebaseUid = getFirebaseUid();
  if (!!firebaseUid) {
    let firestore = getFirestore();
    let docRef = doc(
      firestore,
      "users",
      firebaseUid,
      "playlists",
      playlistId,
      "songs",
      song.id
    );
    let document = await getDoc(docRef);
    return new EloRecord(
      song.id,
      document?.data()?.rating | 0,
      document?.data()?.ratingCount | 0
    );
  } else {
    let rating = parseInt(
      localStorage.getItem(playlistId + "/" + song.id) || "0"
    );
    let ratingCount = parseInt(
      localStorage.getItem(playlistId + "/" + song.id + "/ratingCount") || "0"
    );
    return new EloRecord(song.id, rating, ratingCount);
  }
}

export function getEloRatings(
  playlistId: string,
  callback: (ratings: { [songId: string]: EloRecord }) => void
): Unsubscribe | undefined {
  let firebaseUid = getFirebaseUid();
  if (!!firebaseUid) {
    let firestore = getFirestore();
    let docRef = collection(
      firestore,
      "users",
      firebaseUid,
      "playlists",
      playlistId,
      "songs"
    );
    return onSnapshot(docRef, (snapshot) => {
      let ratings = {} as { [songId: string]: EloRecord };
      snapshot.docs.forEach((doc) => {
        return (ratings[doc.id] = new EloRecord(
          doc.id,
          doc.data().rating,
          doc.data().ratingCount
        ));
      });
      callback(ratings);
    });
  } else {
    let keys = Object.keys(localStorage).filter((key: string) =>
      key.startsWith(playlistId + "/")
    );
    let songs = {} as { [key: string]: EloRecord };
    for (let key of keys) {
      let songId = key.split("/")[2];
      let rating = parseInt(localStorage.getItem(key) || "0");
      let ratingCount = parseInt(
        localStorage.getItem(key + "/ratingCount") || "0"
      );
      songs[songId] = new EloRecord(songId, rating, ratingCount);
    }

    //TODO this only executes once. how to call callback everytime local storage changes?
    callback(songs);
  }
}

export async function calculateElo(
  playlistId: string,
  baseline: Song,
  candidate: Song,
  winner: "baseline" | "candidate" | "tie"
) {
  const baselineRecord = await getEloRating(playlistId, baseline);
  const candidateRecord = await getEloRating(playlistId, candidate);

  const pBaseline = computeWinProbability(baselineRecord.rating, candidateRecord.rating);
  const pCandidate = computeWinProbability(candidateRecord.rating, baselineRecord.rating);
  const outcomeBaseline = winner === "baseline" ? 1 : winner === "tie" ? 0.5 : 0;
  const outcomeCandidate = winner === "candidate" ? 1 : winner === "tie" ? 0.5 : 0;

  const kFactor = winner === "tie" ? 16 : 32;

  let newBaselineRating = baselineRecord.rating + (outcomeBaseline - pBaseline) * kFactor;
  let newCandidateRating = candidateRecord.rating + (outcomeCandidate - pCandidate) * kFactor;

  await setEloRating(
    playlistId,
    baseline,
    newBaselineRating,
    baselineRecord.ratingCount + 1
  );
  await setEloRating(
    playlistId,
    candidate,
    newCandidateRating,
    candidateRecord.ratingCount + 1
  );
}

export function convergenceProbability(
  eloRecords: Map<string, EloRecord>
): number {
  let recordsArray = Array.from(eloRecords.values());
  if (recordsArray.length < 2) return 1.0;

  let E_total = 0;
  let pairCount = 0;

  for (let i = 0; i < recordsArray.length; i++) {
    for (let j = i + 1; j < recordsArray.length; j++) {
      let A = recordsArray[i];
      let B = recordsArray[j];
      let p = computeWinProbability(A.rating, B.rating);
      let H =
        p <= 0 || p >= 1
          ? 0
          : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
      E_total += H;
      pairCount++;
    }
  }

  if (pairCount === 0) return 1.0;
  let E_max = pairCount;
  return 1 - E_total / E_max;
}
