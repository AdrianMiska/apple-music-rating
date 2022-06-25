export function createPlaylist(name: string, description: string) {
    return fetch('https://api.music.apple.com/v1/me/library/playlists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + window.MusicKit.getInstance().developerToken,
            'Music-User-Token': window.MusicKit.getInstance().musicUserToken
        },
        body: JSON.stringify({
            attributes: {
                name: name,
                description: description,
                public: false
            }
        })
    }).then(response => {
        return response.json();
    }).then(response => {
        return response.data[0];
    });
}

export function updatePlaylist(playlist: MusicKit.LibraryPlaylists | MusicKit.Playlists, songs: (MusicKit.MusicVideos | MusicKit.Songs)[]) {
    return fetch(`https://api.music.apple.com/v1/me/library/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + window.MusicKit.getInstance().developerToken,
            'Music-User-Token': window.MusicKit.getInstance().musicUserToken
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