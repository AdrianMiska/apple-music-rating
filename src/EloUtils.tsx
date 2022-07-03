/**
 * Gets the songs ELO rating from local storage
 */
import Songs = MusicKit.Songs;
import MusicVideos = MusicKit.MusicVideos;
import firebase from "firebase/compat/app";
import Unsubscribe = firebase.Unsubscribe;
import "firebase/firestore";
import {collection, doc, getDoc, getFirestore, onSnapshot, setDoc} from "firebase/firestore";

export async function setEloRating(playlistId: string, song: Songs | MusicVideos, rating: number) {
    let firebaseUid = firebase.auth().currentUser?.uid;
    if (!!firebaseUid) {

        let firestore = getFirestore();

        let docRef = doc(firestore, "users", firebaseUid, "playlists", playlistId, "songs", song.id);
        return await setDoc(docRef, {rating: rating});

    } else {
        localStorage.setItem(playlistId + "/" + song.id, rating.toString());
    }
}

export async function getEloRating(playlistId: string, song: Songs | MusicVideos): Promise<number> {
    let firebaseUid = firebase.auth().currentUser?.uid;
    if (!!firebaseUid) {

        let firestore = getFirestore();
        let docRef = doc(firestore, "users", firebaseUid, "playlists", playlistId, "songs", song.id);
        return (await getDoc(docRef)).data()?.rating || 0;

    } else {
        return parseInt(localStorage.getItem(playlistId + "/" + song.id) || "0");
    }
}

export function getEloRatings(playlistId: string, callback: (ratings: { [songId: string]: number }) => void): Unsubscribe | null {
    let firebaseUid = firebase.auth().currentUser?.uid;
    if (!!firebaseUid) {

        let firestore = getFirestore();
        let docRef = collection(firestore, "users", firebaseUid, "playlists", playlistId, "songs");
        return onSnapshot(docRef, snapshot => {
            let ratings = {} as { [songId: string]: number };
            snapshot.docs.forEach(doc => ratings[doc.id] = doc.data().rating);
            callback(ratings);
        });
    } else {
        let keys = localStorage.keys().filter((key: string) => key.startsWith(playlistId + "/"));
        let songs = {} as { [key: string]: number };
        for (let key of keys) {
            songs[key.substring(playlistId.length + 1)] = parseInt(localStorage.getItem(key) || "0");
        }

        //TODO this only executes once. how to call callback everytime local storage changes?
        callback(songs);
        return null;
    }
}

export async function calculateElo(playlistId: string, baseline: Songs | MusicVideos, candidate: Songs | MusicVideos, winner: "baseline" | "candidate" | "tie") {
    const baselineRating = await getEloRating(playlistId, baseline);
    const candidateRating = await getEloRating(playlistId, candidate);
    const expectedBaseline = 1 / (1 + Math.pow(10, (candidateRating - baselineRating) / 400));
    const expectedCandidate = 1 / (1 + Math.pow(10, (baselineRating - candidateRating) / 400));
    const scoreBaseline = winner === "baseline" ? 1 : winner === "tie" ? 0.5 : 0;
    const scoreCandidate = winner === "candidate" ? 1 : winner === "tie" ? 0.5 : 0;
    const newBaselineRating = baselineRating + (scoreBaseline - expectedBaseline) * 32;
    const newCandidateRating = candidateRating + (scoreCandidate - expectedCandidate) * 32;
    await setEloRating(playlistId, baseline, newBaselineRating);
    await setEloRating(playlistId, candidate, newCandidateRating);
}