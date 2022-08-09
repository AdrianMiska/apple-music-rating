/**
 * Gets the songs ELO rating from local storage
 */
import firebase from "firebase/compat/app";
import "firebase/firestore";
import {collection, doc, getDoc, getFirestore, onSnapshot, setDoc} from "firebase/firestore";
import {MusicWrapper} from "./MusicWrapper";
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

export async function setEloRating(playlistId: string, song: MusicWrapper.Song, rating: number, ratingCount: number) {
    let firebaseUid = firebase.auth().currentUser?.uid;
    if (!!firebaseUid) {

        let firestore = getFirestore();

        let docRef = doc(firestore, "users", firebaseUid, "playlists", playlistId, "songs", song.id);
        return await setDoc(docRef, {rating: rating, ratingCount: ratingCount});

    } else {
        localStorage.setItem(playlistId + "/" + song.id, rating.toString());
        localStorage.setItem(playlistId + "/" + song.id + "/ratingCount", ratingCount.toString());
    }
}

export async function getEloRating(playlistId: string, song: MusicWrapper.Song): Promise<EloRecord> {
    let firebaseUid = firebase.auth().currentUser?.uid;
    if (!!firebaseUid) {

        let firestore = getFirestore();
        let docRef = doc(firestore, "users", firebaseUid, "playlists", playlistId, "songs", song.id);
        let document = await getDoc(docRef);
        return new EloRecord(song.id, document?.data()?.rating | 0, document?.data()?.ratingCount | 0);

    } else {
        let rating = parseInt(localStorage.getItem(playlistId + "/" + song.id) || "0");
        let ratingCount = parseInt(localStorage.getItem(playlistId + "/" + song.id + "/ratingCount") || "0");
        return new EloRecord(song.id, rating, ratingCount);
    }
}

export function getEloRatings(playlistId: string, callback: (ratings: { [songId: string]: EloRecord }) => void): Unsubscribe | null {
    let firebaseUid = firebase.auth().currentUser?.uid;
    if (!!firebaseUid) {

        let firestore = getFirestore();
        let docRef = collection(firestore, "users", firebaseUid, "playlists", playlistId, "songs");
        return onSnapshot(docRef, snapshot => {
            let ratings = {} as { [songId: string]: EloRecord };
            snapshot.docs.forEach(doc => {
                return ratings[doc.id] = new EloRecord(doc.id, doc.data().rating, doc.data().ratingCount);
            });
            callback(ratings);
        });
    } else {
        let keys = Object.keys(localStorage).filter((key: string) => key.startsWith(playlistId + "/"));
        let songs = {} as { [key: string]: EloRecord };
        for (let key of keys) {
            let songId = key.split("/")[2];
            let rating = parseInt(localStorage.getItem(key) || "0");
            let ratingCount = parseInt(localStorage.getItem(key + "/ratingCount") || "0");
            songs[songId] = new EloRecord(songId, rating, ratingCount);
        }

        //TODO this only executes once. how to call callback everytime local storage changes?
        callback(songs);
        return null;
    }
}

export async function calculateElo(playlistId: string, baseline: MusicWrapper.Song, candidate: MusicWrapper.Song, winner: "baseline" | "candidate" | "tie") {
    const baselineRecord = await getEloRating(playlistId, baseline);
    const candidateRecord = await getEloRating(playlistId, candidate);
    const expectedBaseline = 1 / (1 + Math.pow(10, (candidateRecord.rating - baselineRecord.rating) / 400));
    const expectedCandidate = 1 / (1 + Math.pow(10, (baselineRecord.rating - candidateRecord.rating) / 400));
    const scoreBaseline = winner === "baseline" ? 1 : winner === "tie" ? 0.5 : 0;
    const scoreCandidate = winner === "candidate" ? 1 : winner === "tie" ? 0.5 : 0;
    const newBaselineRating = baselineRecord.rating + (scoreBaseline - expectedBaseline) * 32;
    const newCandidateRating = candidateRecord.rating + (scoreCandidate - expectedCandidate) * 32;
    await setEloRating(playlistId, baseline, newBaselineRating, baselineRecord.ratingCount + 1);
    await setEloRating(playlistId, candidate, newCandidateRating, candidateRecord.ratingCount + 1);
}