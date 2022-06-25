import React from "react";
import {SongRating} from "./SongRating";
import {InputSelection} from "./InputSelection";
import Playlists = MusicKit.Playlists;


export class Rating extends React.Component<{}, { selectedInputPlaylist: Playlists | null }> {


    constructor(props: {}) {
        super(props);
        this.state = {
            selectedInputPlaylist: null
        }
    }

    private setSelectedInputPlaylist(playlist: MusicKit.Playlists | MusicKit.LibraryPlaylists) {
        Rating.getLibraryPlaylist(playlist.id).then(playlist => {
            this.setState({selectedInputPlaylist: playlist});
        });

    }

    /**
     * In order for a playlist to have its tracks, we need to fetch the playlist again
     * @param id
     * @private
     */
    private static async getLibraryPlaylist(id: MusicKit.MusicItemID): Promise<Playlists> {
        const response = await window.MusicKit.getInstance().api.library.playlist(id, {
            include: "tracks"
        });
        return response as Playlists;
    }

    render() {
        if (!this.state.selectedInputPlaylist) {
            return <InputSelection onSelectedInputPlaylist={this.setSelectedInputPlaylist.bind(this)}/>;
        }

        if (this.state.selectedInputPlaylist) {
            return <SongRating inputPlaylist={this.state.selectedInputPlaylist}/>;
        }
    }
}