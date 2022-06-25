/**
 * Gets the songs ELO rating from local storage
 */
import Songs = MusicKit.Songs;
import MusicVideos = MusicKit.MusicVideos;

export function getEloRating(song: Songs | MusicVideos): number {
    //TODO replace with firestore
    return parseInt(localStorage.getItem(song.id) || "0");
}

/**
 * Writes the songs ELO rating to local storage
 */
export function setEloRating(song: Songs | MusicVideos, rating: number) {
    //TODO replace with firestore
    localStorage.setItem(song.id, rating.toString());
}

export function calculateElo(baseline: Songs | MusicVideos, candidate: Songs | MusicVideos, winner: "baseline" | "candidate" | "tie") {
    const baselineRating = getEloRating(baseline);
    const candidateRating = getEloRating(candidate);
    const expectedBaseline = 1 / (1 + Math.pow(10, (candidateRating - baselineRating) / 400));
    const expectedCandidate = 1 / (1 + Math.pow(10, (baselineRating - candidateRating) / 400));
    const scoreBaseline = winner === "baseline" ? 1 : winner === "tie" ? 0.5 : 0;
    const scoreCandidate = winner === "candidate" ? 1 : winner === "tie" ? 0.5 : 0;
    const newBaselineRating = baselineRating + (scoreBaseline - expectedBaseline) * 32;
    const newCandidateRating = candidateRating + (scoreCandidate - expectedCandidate) * 32;
    setEloRating(baseline, newBaselineRating);
    setEloRating(candidate, newCandidateRating);
}