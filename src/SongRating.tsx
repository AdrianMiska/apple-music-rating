import React from "react";
import {createPlaylist, updatePlaylist} from "./PlaylistUtils";
import {calculateElo} from "./EloUtils";
import {Song} from "./Song";
import Songs = MusicKit.Songs;
import MusicVideos = MusicKit.MusicVideos;
import LibraryPlaylists = MusicKit.LibraryPlaylists;
import Playlists = MusicKit.Playlists;

class RatingPair {
    constructor(public baseline: Songs | MusicVideos, public candidate: Songs | MusicVideos) {
    }
}

type Props = { inputPlaylist: LibraryPlaylists | Playlists };

type State = { inputSongs: (Songs | MusicVideos)[], matchUp: RatingPair | null };

export class SongRating extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {inputSongs: [], matchUp: null};
    }

    componentDidMount() {
        const songs: (Songs | MusicVideos)[] = this.props.inputPlaylist.relationships.tracks.data;

        // get all tracks from the paginated API
        const getTracks = async (next: string) => {
            const response = await fetch(`https://api.music.apple.com${next}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + window.MusicKit.getInstance().developerToken,
                    'Music-User-Token': window.MusicKit.getInstance().musicUserToken
                }
            });
            const data = await response.json();
            songs.push(...data.data);
            if (data.next) {
                await getTracks(data.next);
            }
        }
        if (this.props.inputPlaylist.relationships.tracks.next) {
            getTracks(this.props.inputPlaylist.relationships.tracks.next).then(() => {
                this.setState({inputSongs: songs});
                this.getCandidate();
            });
        } else {
            this.setState({inputSongs: songs});
            this.getCandidate();
        }
    }

    private async createOutputPlaylist(name: string | undefined) {
        let createdPlaylist = await createPlaylist(`${name} Sorted`, `Sorted version of ${name} by Music Rating`);
        // TODO songs sorted by elo
        await updatePlaylist(createdPlaylist, []);
    }


    /** Get two songs to be rated by the user.
     *  The songs will be picked at random, either both from the output playlist or one from each playlist.
     *  Depending on how many songs are already in the output playlist, songs from the output playlist are more likely to be picked.
     *
     *  Important: Will ensure that songs are not repeated in the output playlist.
     *  Will choose two songs from the output playlist more often the bigger the output playlist is.
     *  Over time, the output playlist will be filled with more songs from the input playlist.
     */
    getCandidate(baseline?: Songs | MusicVideos) {

        let inputSongs = this.state.inputSongs;

        baseline = baseline || inputSongs[Math.floor(Math.random() * inputSongs.length)];
        let candidate = inputSongs[Math.floor(Math.random() * inputSongs.length)];
        if (baseline.id === candidate.id) {
            candidate = inputSongs[inputSongs.indexOf(candidate) + 1];
        }
        this.setState({matchUp: new RatingPair(baseline, candidate)});


    }

    render() {

        if (!this.state.inputSongs.length) {
            return <div>Loading...</div>;
        }

        if (!this.state.matchUp) {
            return <div>Loading...</div>;
        }

        //TODO add a save button which creates a new playlist based on elo

        return <div className="flex flex-row">
            <div className="flex flex-col w-full">
                <Song song={this.state.matchUp.baseline}/>
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                        onClick={() => {
                            calculateElo(this.state.matchUp!.baseline, this.state.matchUp!.candidate, "baseline");
                            this.getCandidate()
                        }
                        }>I prefer this song
                </button>
            </div>
            <div className="flex flex-col">
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                        onClick={() => {
                            calculateElo(this.state.matchUp!.baseline, this.state.matchUp!.candidate, "tie");
                            this.getCandidate()
                        }}>Tie
                </button>
            </div>
            <div className="flex flex-col w-full">
                <Song song={this.state.matchUp.candidate}/>
                <button className="bg-slate-500 hover:bg-slate-700
                    text-white font-bold py-2 px-4 rounded"
                        onClick={() => {
                            calculateElo(this.state.matchUp!.baseline, this.state.matchUp!.candidate, "candidate");
                            this.getCandidate(this.state.matchUp!.candidate); // keep candidate as incumbent baseline
                        }
                        }>I prefer this song
                </button>
            </div>
        </div>;
    }
}