import {MusicWrapper} from "./MusicWrapper";

export async function createPlaylist(name: string, description: string) {
    let musicKit = await MusicWrapper.getInstance().getMusicKit();

    const response = await fetch('https://api.music.apple.com/v1/me/library/playlists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + musicKit.developerToken,
            'Music-User-Token': musicKit.musicUserToken
        },
        body: JSON.stringify({
            attributes: {
                name: name,
                description: description,
                public: false
            }
        })
    });
    const response_1 = await response.json();
    return response_1.data[0];
}

export async function updatePlaylist(playlist: MusicKit.LibraryPlaylists | MusicKit.Playlists, songs: (MusicKit.MusicVideos | MusicKit.Songs)[]): Promise<Response> {
    let musicKit = await MusicWrapper.getInstance().getMusicKit();

    return fetch(`https://api.music.apple.com/v1/me/library/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + musicKit.developerToken,
            'Music-User-Token': musicKit.musicUserToken
        },
        body: JSON.stringify({
            data: songs.map((songs) => {
                    return {
                        id: songs.id,
                        type: songs.type,
                    };
                }
            )
        })
    });
}