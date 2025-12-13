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
  const rawP = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 480));
  // clamp the probability to be between 0 and 1
  return Math.max(0, Math.min(1, rawP));
}

export function selectHighInformationMatchup(
  songs: Song[],
  eloRecords: Map<string, EloRecord>,
): RatingPair | null {
  // If there are less than 2 songs, we cannot create a matchup
  if (songs.length < 2) return null;

  // Inject a little exploration so we don't over-focus on one narrow region of the pool.
  // This improves variety and tends to speed up global convergence (more coverage).
  if (Math.random() < 0.12) {
    const aIdx = Math.floor(Math.random() * songs.length);
    let bIdx = Math.floor(Math.random() * (songs.length - 1));
    if (bIdx >= aIdx) bIdx++;
    const a = songs[aIdx];
    const b = songs[bIdx];
    return Math.random() < 0.5
      ? { baseline: a, candidate: b }
      : { baseline: b, candidate: a };
  }

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

      // Weight the matchup toward uncertainty without requiring both songs to be under-voted.
      // Using the average inverse-count means:
      // - If either song is under-rated (low count), the pair stays attractive.
      // - A low-count song can be paired with a high-count "anchor" song (more variance, faster calibration).
      let W = 0.5 * (1 / (1 + aCount) + 1 / (1 + bCount));

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
  ratingCount: number,
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
      song.id,
    );
    return await setDoc(docRef, { rating: rating, ratingCount: ratingCount });
  } else {
    localStorage.setItem(playlistId + "/" + song.id, rating.toString());
    localStorage.setItem(
      playlistId + "/" + song.id + "/ratingCount",
      ratingCount.toString(),
    );
  }
}

export async function getEloRating(
  playlistId: string,
  song: Song,
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
      song.id,
    );
    let document = await getDoc(docRef);
    return new EloRecord(
      song.id,
      Number(document?.data()?.rating ?? 0),
      Number(document?.data()?.ratingCount ?? 0),
    );
  } else {
    let rating = parseFloat(
      localStorage.getItem(playlistId + "/" + song.id) || "0",
    );
    let ratingCount = parseInt(
      localStorage.getItem(playlistId + "/" + song.id + "/ratingCount") || "0",
    );
    return new EloRecord(song.id, rating, ratingCount);
  }
}

export function getEloRatings(
  playlistId: string,
  callback: (ratings: { [songId: string]: EloRecord }) => void,
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
      "songs",
    );
    return onSnapshot(docRef, (snapshot) => {
      let ratings = {} as { [songId: string]: EloRecord };
      snapshot.docs.forEach((doc) => {
        return (ratings[doc.id] = new EloRecord(
          doc.id,
          doc.data().rating,
          doc.data().ratingCount,
        ));
      });
      callback(ratings);
    });
  } else {
    let keys = Object.keys(localStorage).filter((key: string) =>
      key.startsWith(playlistId + "/"),
    );
    let songs = {} as { [key: string]: EloRecord };
    for (let key of keys) {
      let songId = key.split("/")[2];
      let rating = parseInt(localStorage.getItem(key) || "0");
      let ratingCount = parseInt(
        localStorage.getItem(key + "/ratingCount") || "0",
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
  winner: "baseline" | "candidate" | "tie",
) {
  const baselineRecord = await getEloRating(playlistId, baseline);
  const candidateRecord = await getEloRating(playlistId, candidate);

  const pBaseline = computeWinProbability(
    baselineRecord.rating,
    candidateRecord.rating,
  );
  const pCandidate = computeWinProbability(
    candidateRecord.rating,
    baselineRecord.rating,
  );
  const outcomeBaseline =
    winner === "baseline" ? 1 : winner === "tie" ? 0.5 : 0;
  const outcomeCandidate =
    winner === "candidate" ? 1 : winner === "tie" ? 0.5 : 0;

  // Dynamic K-factor to speed convergence:
  // - Higher when either song has low vote count (high uncertainty).
  // - Higher for "informative" matchups:
  //   - wins/losses are most informative near p=0.5 (high entropy)
  //   - ties are most informative when p is far from 0.5 (surprising draw)
  const baseK = 32;
  const aCount = baselineRecord.ratingCount || 0;
  const bCount = candidateRecord.ratingCount || 0;
  const uncertainty =
    0.5 * (1 / Math.sqrt(1 + aCount) + 1 / Math.sqrt(1 + bCount)); // ~ (0, 1]
  const uncertaintyMultiplier = 0.75 + 1.75 * uncertainty; // ~ [0.75..2.5]

  const info =
    winner === "tie"
      ? 2 * Math.abs(0.5 - pBaseline) // [0..1], higher when tie is "surprising"
      : computeEntropy(pBaseline); // [0..1], higher when close match
  const infoMultiplier = 0.75 + 0.75 * info; // ~ [0.75..1.5]

  const kFactor = Math.max(
    8,
    Math.min(64, baseK * uncertaintyMultiplier * infoMultiplier),
  );

  let newBaselineRating =
    baselineRecord.rating + (outcomeBaseline - pBaseline) * kFactor;
  let newCandidateRating =
    candidateRecord.rating + (outcomeCandidate - pCandidate) * kFactor;

  await setEloRating(
    playlistId,
    baseline,
    newBaselineRating,
    baselineRecord.ratingCount + 1,
  );
  await setEloRating(
    playlistId,
    candidate,
    newCandidateRating,
    candidateRecord.ratingCount + 1,
  );
}

/**
 * Calculates a measure (in the range [0..1]) of how "converged" (predictable)
 * a set of Elo ratings is, based on the pairwise Bernoulli entropy of their
 * respective win probabilities.
 *
 * - For each unique pair of records (A, B), we compute the probability p that A beats B.
 * - We then treat that as a Bernoulli random variable with parameter p, whose
 *   entropy H = -p*log2(p) - (1-p)*log2(1-p).
 * - We sum up this entropy for all pairs (totalEntropy).
 * - The maximum entropy (maxEntropy) per pair is 1 bit (when p = 0.5).
 * - We return 1 - (totalEntropy / maxEntropy).
 *   - If totalEntropy = 0, we return 1 (fully predictable).
 *   - If totalEntropy = maxEntropy, we return 0 (fully uncertain).
 *
 * @param songs - An array of Song objects.
 * @param {Map<string, EloRecord>} eloRecords - Map from song IDs to EloRecord objects, each containing a rating.
 * @returns {number} A convergence metric in [0..1]: higher means more predictable, lower means more uncertain.
 */
export function convergenceProbability(
  songs: Song[],
  eloRecords: Map<string, EloRecord>,
): number {
  // If there's fewer than 2 songs, there's no pairwise uncertainty, so return 1.0
  if (songs.length < 2) return 1.0;

  // Accumulate the total pairwise entropy here.
  let totalEntropy = 0;

  // We'll also track how many pairs we've processed.
  let pairCount = 0;

  // Go through all unique pairs (i < j).
  for (let i = 0; i < songs.length; i++) {
    for (let j = i + 1; j < songs.length; j++) {
      let a = songs[i];
      let b = songs[j];

      // Compute the probability that A beats B (0 <= p <= 1).
      let winProbability = computeWinProbability(
        eloRecords.get(a.id)?.rating || 0,
        eloRecords.get(b.id)?.rating || 0,
      );

      // Clamp p into [0, 1] just to protect against floating-point imprecision.
      if (winProbability < 0) winProbability = 0;
      if (winProbability > 1) winProbability = 1;

      // Compute the Shannon entropy for this pair, in bits.
      let entropyPerPair: number;
      if (winProbability <= 0 || winProbability >= 1) {
        // It's 0 if p=0 or p=1 (perfectly predictable).
        entropyPerPair = 0;
      } else {
        entropyPerPair =
          -winProbability * Math.log2(winProbability) -
          (1 - winProbability) * Math.log2(1 - winProbability);
      }

      // Add this pair's entropy to the total.
      totalEntropy += entropyPerPair;
      pairCount++;
    }
  }

  // If we somehow have 0 pairs, just return 1.0.
  if (pairCount === 0) return 1.0;

  // Maximum possible entropy for each pair is 1 bit (when p=0.5),
  // so for pairCount pairs, the max entropy is simply pairCount.
  const maxEntropy = pairCount;

  // Return 1 minus the ratio of totalEntropy to maxEntropy.
  //  - If totalEntropy=0 => fully predictable => 1
  //  - If totalEntropy=maxEntropy => fully uncertain => 0
  return 1 - totalEntropy / maxEntropy;
}
