// @ts-nocheck TODO
import SpotifyWebApi from "spotify-web-api-js";
import pkceChallenge from "pkce-challenge";

export enum MusicProvider {
  AppleMusic,
  Spotify,
}

class SpotifyPlayer {
  private player: HTMLAudioElement;

  private _nowPlaying: string | null;

  private onPlaybackChangeListeners: (() => void)[] = [];

  constructor() {
    this.player = new Audio();
    this.player.volume = 0.5;
    this._nowPlaying = null;
  }

  public get nowPlaying(): string | null {
    return this._nowPlaying;
  }

  public onPlaybackChange(listener: () => void) {
    this.onPlaybackChangeListeners.push(listener);
  }

  public async play(song: Song) {
    if (this.nowPlaying === song.id) {
      await this.player.play();
      this.onPlaybackChangeListeners.forEach((listener) => listener());
      return;
    }
    if (!song.previewUrl) {
      this.stop();
      throw new Error("No preview url");
    }
    this.player.src = song.previewUrl;
    await this.player.play();
    this._nowPlaying = song.id;
    this.onPlaybackChangeListeners.forEach((listener) => listener());
    this.player.onended = () => {
      this._nowPlaying = null;
      this.onPlaybackChangeListeners.forEach((listener) => listener());
    };
  }

  public stop() {
    this.player.pause();
    this.player.currentTime = 0;
    this._nowPlaying = null;
    this.onPlaybackChangeListeners.forEach((listener) => listener());
  }
}

class Music {
  private musicKit: MusicKit.MusicKitInstance | undefined;

  private spotifyApi: SpotifyWebApi.SpotifyWebApiJs | undefined;

  private spotifyPlayer: SpotifyPlayer | undefined;

  private getSpotifyPlayer(): SpotifyPlayer {
    if (!this.spotifyPlayer) {
      this.spotifyPlayer = new SpotifyPlayer();
    }
    return this.spotifyPlayer;
  }

  private async getMusicKit() {
    if (this.musicKit) {
      return this.musicKit;
    }
    const script = document.createElement("script");

    script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
    script.setAttribute("data-web-components", "");
    script.async = true;

    document.body.appendChild(script);

    this.musicKit = await new Promise<MusicKit.MusicKitInstance>((resolve) => {
      document.addEventListener("musickitloaded", async function () {
        let instance = await window.MusicKit.configure({
          developerToken: process.env.NEXT_PUBLIC_MUSIC_KIT_DEVELOPER_TOKEN,
          app: {
            name: "Elo Music Rating",
            build: "0.1.0",
          },
        });
        resolve(instance);
      });
    });

    return this.musicKit;
  }

  private async getSpotify(): Promise<SpotifyWebApi.SpotifyWebApiJs> {
    if (!this.spotifyApi) {
      this.spotifyApi = new SpotifyWebApi();
    }

    let access_token = localStorage.getItem("spotify_access_token");
    let expires = localStorage.getItem("spotify_expires");
    let refresh_token = localStorage.getItem("spotify_refresh_token");

    if (access_token && expires && refresh_token) {
      if (Date.now() / 1000 > parseInt(expires)) {
        await this.refreshSpotifyToken(refresh_token);
      } else {
        this.spotifyApi.setAccessToken(access_token);
      }
    }

    return this.spotifyApi;
  }

  async playPreview(song: Song) {
    if (song.musicProvider === MusicProvider.AppleMusic) {
      const music = await this.getMusicKit();

      music.previewOnly = true;

      music.volume = 0.5;

      await music.setQueue({
        song: song.catalogId || song.id,

        startPlaying: true,
      });
    }

    if (song.musicProvider === MusicProvider.Spotify) {
      await this.getSpotifyPlayer().play(song);
    }
  }

  onPlaybackChange(callback: () => void) {
    this.getAuthorizations().then((authorizedProviders) => {
      if (authorizedProviders.includes(MusicProvider.AppleMusic)) {
        this.getMusicKit().then((music) => {
          music.addEventListener("playbackStateDidChange", () => {
            callback();
          });
        });
      }
      if (authorizedProviders.includes(MusicProvider.Spotify)) {
        this.getSpotifyPlayer().onPlaybackChange(() => {
          callback();
        });
      }
    });
  }

  async isPlaying(song: Song | null): Promise<boolean> {
    if (!song) {
      return false;
    }
    if (song.musicProvider === MusicProvider.AppleMusic) {
      let music = await this.getMusicKit();

      return (
        music.isPlaying &&
        (music.nowPlayingItem?.container.id === song.id ||
          music.nowPlayingItem?.container.id === song.catalogId)
      );
    }
    if (song.musicProvider === MusicProvider.Spotify) {
      let spotifyPlayer = await this.getSpotifyPlayer();
      return spotifyPlayer.nowPlaying === song.id;
    }

    return false;
  }

  async stop() {
    let authorizedProviders = await this.getAuthorizations();
    if (authorizedProviders.includes(MusicProvider.AppleMusic)) {
      const music = await this.getMusicKit();
      music.stop();
    }
    if (authorizedProviders.includes(MusicProvider.Spotify)) {
      await this.getSpotifyPlayer().stop();
    }
  }

  async getAuthorizations(): Promise<MusicProvider[]> {
    let authorizedProviders: MusicProvider[] = [];

    if (
      Object.keys(localStorage).filter((key) =>
        key.match(/^music\..*\.media-user-token$/)
      ).length > 0
    ) {
      authorizedProviders.push(MusicProvider.AppleMusic);
    }

    let spotifyApi = await this.getSpotify();
    if (spotifyApi.getAccessToken()) {
      authorizedProviders.push(MusicProvider.Spotify);
    }

    return authorizedProviders;
  }

  async authorize(provider: MusicProvider) {
    switch (provider) {
      case MusicProvider.AppleMusic:
        let musicKit = await this.getMusicKit();
        await musicKit.authorize();
        break;
      case MusicProvider.Spotify:
        await this.authorizeSpotify();
        break;
    }
  }

  async generateSpotifyToken(code: string, state: string) {
    if (state !== (await localStorage.getItem("spotify_pkce_state"))) {
      throw new Error("Invalid PKCE state");
    }
    await localStorage.removeItem("spotify_pkce_state");

    const queryString = new URLSearchParams();
    queryString.append("grant_type", "authorization_code");
    queryString.append("code", code);
    queryString.append("redirect_uri", window.location.origin + "/authorize");
    queryString.append(
      "client_id",
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ""
    );
    queryString.append(
      "code_verifier",
      localStorage.getItem("spotify_pkce_code_verifier") || ""
    );

    let { access_token, expires_in, refresh_token } = await fetch(
      `https://accounts.spotify.com/api/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: queryString.toString(),
      }
    ).then((res) => res.json());

    await this.saveSpotifyToken(access_token, expires_in, refresh_token);
  }

  private async refreshSpotifyToken(current_refresh_token: string) {
    let queryString = new URLSearchParams();
    queryString.append("grant_type", "refresh_token");
    queryString.append("refresh_token", current_refresh_token || "");
    queryString.append(
      "client_id",
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ""
    );

    let { access_token, expires_in, refresh_token } = await fetch(
      `https://accounts.spotify.com/api/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: queryString.toString(),
      }
    ).then((res) => res.json());

    if (access_token && expires_in && refresh_token) {
      await this.saveSpotifyToken(access_token, expires_in, refresh_token);
    }
  }

  private async saveSpotifyToken(
    access_token: string,
    expires_in: number,
    refresh_token: string
  ) {
    await localStorage.setItem("spotify_access_token", access_token);
    await localStorage.setItem(
      "spotify_expires",
      String(Math.floor(Date.now() / 1000) + expires_in)
    );
    await localStorage.setItem("spotify_refresh_token", refresh_token);
    let spotifyApi = await this.getSpotify();
    spotifyApi.setAccessToken(access_token);
  }

  // noinspection JSMethodCanBeStatic
  private async authorizeSpotify() {
    const scopes = [
      "user-read-private",
      "user-read-email",
      "playlist-read-private",
      "playlist-modify-private",
      "user-library-read",
    ];
    let pkceState = window.btoa(
      window.crypto.getRandomValues(new Uint8Array(16)).toString()
    );
    let { code_challenge, code_verifier } = pkceChallenge();

    await localStorage.setItem("spotify_pkce_state", pkceState);
    await localStorage.setItem("spotify_pkce_code_verifier", code_verifier);

    const queryString = new URLSearchParams();
    queryString.append(
      "client_id",
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ""
    );
    queryString.append("response_type", "code");
    queryString.append("redirect_uri", window.location.origin + "/authorize");
    queryString.append("state", pkceState);
    queryString.append("scope", scopes.join(" "));
    queryString.append("code_challenge_method", "S256");
    queryString.append("code_challenge", code_challenge);
    window.location.href = `https://accounts.spotify.com/authorize?${queryString.toString()}`;
  }

  async unauthorize(provider: MusicProvider) {
    switch (provider) {
      case MusicProvider.AppleMusic:
        let musicKit = await this.getMusicKit();
        await musicKit.unauthorize();
        break;
      case MusicProvider.Spotify:
        let spotifyApi = await this.getSpotify();
        spotifyApi.setAccessToken(null);
        console.log("Unauthorized Spotify");
        await localStorage.removeItem("spotify_access_token");
        await localStorage.removeItem("spotify_expires");
        await localStorage.removeItem("spotify_refresh_token");
        break;
    }
  }

  async getPlaylist(
    playlistId: string | "apple-music-favorites" | "spotify-saved-tracks"
  ): Promise<Playlist | undefined> {
    if (playlistId === "spotify-saved-tracks") {
      let favorites = await this.getSpotifyFavorites();
      return {
        id: playlistId,
        name: "Spotify Tracks",
        tracks: favorites,
        description: "",
        dateAdded: null,
        musicProvider: MusicProvider.Spotify,
      };
    }

    if (playlistId === "apple-music-favorites") {
      let favorites = await this.getAppleMusicFavorites();
      return {
        id: playlistId,
        name: "Apple Music Favorites",
        tracks: favorites,
        description: "",
        dateAdded: null,
        musicProvider: MusicProvider.AppleMusic,
      };
    }

    if (playlistId.match(/^pl?\..+$/)) {
      let musicKit = await this.getMusicKit();
      let musicKitPlaylist: MusicKit.LibraryPlaylists | MusicKit.Playlists = (
        await musicKit.api.music("v1/me/library/playlists/" + playlistId, {
          include: "tracks",
        })
      ).data.data[0];

      let songs: (MusicKit.Songs | MusicKit.MusicVideos)[] =
        musicKitPlaylist.relationships.tracks.data;

      // get all tracks from the paginated API
      const getTracks = async (next: string) => {
        const response = await fetch(`https://api.music.apple.com${next}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + musicKit.developerToken,
            "Music-User-Token": musicKit.musicUserToken,
          },
        });
        const data = await response.json();
        songs.push(...data.data);
        if (data.next) {
          await getTracks(data.next);
        }
      };

      if (musicKitPlaylist?.relationships.tracks.next) {
        await getTracks(musicKitPlaylist.relationships.tracks.next);
      }

      return new Playlist(
        musicKitPlaylist,
        songs.map((song) => new Song(song))
      );
    } else {
      let spotifyApi = await this.getSpotify();
      let market = (await spotifyApi.getMe()).country;
      let playlist = await spotifyApi.getPlaylist(playlistId, {
        market: market,
      });
      let tracks = playlist.tracks;

      while (tracks.next) {
        let nextTracks = await spotifyApi.getPlaylistTracks(playlistId, {
          offset: tracks.offset + tracks.limit,
          market: market,
        });
        nextTracks.items = tracks.items.concat(nextTracks.items);
        tracks = nextTracks;
      }

      return new Playlist(
        playlist,
        tracks.items.map((track) => new Song(track.track))
      );
    }
  }

  async searchPlaylist(
    searchTerm: string,
    onlyApple: boolean = false
  ): Promise<Playlist[]> {
    let res = [];
    let effectiveSearchTerm = searchTerm.trim().replace(/[^a-zA-Z\d]/g, "*");
    if (effectiveSearchTerm.length === 0) {
      return [];
    }

    let musicProviders = await this.getAuthorizations();
    if (musicProviders.includes(MusicProvider.AppleMusic)) {
      let musicKit = await this.getMusicKit();

      let results =
        (
          await musicKit.api.music("v1/me/library/search", {
            term: effectiveSearchTerm,
            types: "library-playlists",
            limit: "25",
          })
        ).data.results["library-playlists"]?.data || [];

      let musicKitResults = results.map(
        (playlist: MusicKit.Playlists | MusicKit.LibraryPlaylists) =>
          new Playlist(playlist)
      );
      res.push(...musicKitResults);
    }

    if (musicProviders.includes(MusicProvider.Spotify) && !onlyApple) {
      let spotifyApi = await this.getSpotify();
      let response = await spotifyApi.searchPlaylists(effectiveSearchTerm);
      let currentUserId = (await spotifyApi.getMe()).id;
      let spotifyResults = response.playlists.items
        .filter((playlist) => playlist.owner.id === currentUserId)
        .map((playlist) => new Playlist(playlist));
      res.push(...spotifyResults);
    }
    return res;
  }

  async createPlaylist(
    name: string,
    description: string,
    musicProvider: MusicProvider
  ): Promise<Playlist | null> {
    if (musicProvider === MusicProvider.AppleMusic) {
      let musicKit = await this.getMusicKit();

      const response = await fetch(
        "https://api.music.apple.com/v1/me/library/playlists",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + musicKit.developerToken,
            "Music-User-Token": musicKit.musicUserToken,
          },
          body: JSON.stringify({
            attributes: {
              name: name,
              description: description,
              public: false,
            },
          }),
        }
      );
      return new Playlist((await response.json()).data[0]);
    }

    if (musicProvider === MusicProvider.Spotify) {
      let spotifyApi = await this.getSpotify();
      let currentUserId = (await spotifyApi.getMe()).id;
      let response = await spotifyApi.createPlaylist(currentUserId, {
        name: name,
        description: description,
        public: false,
      });
      return new Playlist(response);
    }

    return null;
  }

  async updatePlaylist(playlist: Playlist, songs: Song[]): Promise<any> {
    if (playlist.musicProvider === MusicProvider.AppleMusic) {
      let musicKit = await this.getMusicKit();

      return fetch(
        `https://api.music.apple.com/v1/me/library/playlists/${playlist.id}/tracks`,
        {
          //method: 'PUT',
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + musicKit.developerToken,
            "Music-User-Token": musicKit.musicUserToken,
          },
          body: JSON.stringify({
            data: songs.map((songs) => {
              return {
                id: songs.id,
                type: songs.type,
              };
            }),
          }),
        }
      );
    }
    if (playlist.musicProvider === MusicProvider.Spotify) {
      let spotifyApi = await this.getSpotify();
      return spotifyApi.replaceTracksInPlaylist(
        playlist.id,
        songs.map((song) => "spotify:track:" + song.id)
      );
    }
  }

  async saveSortedPlaylist(songs: Song[], playlist?: Playlist) {
    if (!playlist) {
      return;
    }

    let existingPlaylist =
      playlist.musicProvider !== MusicProvider.AppleMusic &&
      (await this.searchPlaylist(`${playlist.name} Sorted`)).find(
        (p) =>
          p.description === `Sorted version of ${playlist.name} by EloTunes`
      );
    let outputPlaylist =
      existingPlaylist ||
      (await this.createPlaylist(
        `${playlist.name} Sorted`,
        `Sorted version of ${playlist.name} by EloTunes`,
        playlist.musicProvider
      ));

    if (!outputPlaylist) {
      return;
    }
    await this.updatePlaylist(outputPlaylist, songs);
  }

  /**
   * Will filter the songs from the response and return only the ones with a favorite rating.
   * @param songs
   */
  private async filterAppleMusicFavorites(
    songs: MusicKit.Songs[]
  ): Promise<MusicKit.Songs[]> {
    let musicKit = await this.getMusicKit();

    //chunk the songs into groups of 100
    let chunks = [];
    for (let i = 0; i < songs.length; i += 100) {
      chunks.push(songs.slice(i, i + 100));
    }
    //get the ratings for each chunk
    let favoriteIds: string[] = (
      await Promise.all(
        chunks.map(async (chunk) => {
          let result = await musicKit.api.music("v1/me/ratings/library-songs", {
            ids: chunk.map((song: MusicKit.Songs) => song.id),
          });
          return result.data.data
            .filter((rating: any) => rating.attributes.value === 1)
            .map((rating: { id: string }) => {
              return rating.id;
            });
        })
      )
    ).flat();

    return songs.filter((song: MusicKit.Songs) => {
      return favoriteIds.includes(song.id);
    });
  }

  private async getSpotifyFavorites() {
    let favoritesDate = localStorage.getItem("spotify_favorites_date");
    if (
      favoritesDate &&
      Date.now() - Date.parse(favoritesDate) < 1000 * 60 * 60 * 24
    ) {
      return JSON.parse(localStorage.getItem("spotify_favorites") || "[]");
    }

    let spotifyApi = await this.getSpotify();
    let tracks = await spotifyApi.getMySavedTracks();
    //pagination
    let market = (await spotifyApi.getMe()).country;

    while (tracks.next) {
      let nextTracks = await spotifyApi.getMySavedTracks({
        offset: tracks.offset + tracks.limit,
        market: market,
      });
      nextTracks.items = tracks.items.concat(nextTracks.items);
      tracks = nextTracks;
    }
    let favorites = tracks.items.map((track) => new Song(track.track));
    await localStorage.setItem("spotify_favorites", JSON.stringify(favorites));
    await localStorage.setItem(
      "spotify_favorites_date",
      new Date().toISOString()
    );
    return favorites;
  }

  async getAppleMusicFavorites(): Promise<Song[]> {
    let favoritesDate = localStorage.getItem("apple_music_favorites_date");
    if (
      favoritesDate &&
      Date.now() - Date.parse(favoritesDate) < 1000 * 60 * 60 * 24
    ) {
      return JSON.parse(localStorage.getItem("apple_music_favorites") || "[]");
    }

    let musicKit = await this.getMusicKit();

    let offset = 0;
    let limit = 100;
    let allSongs: any[] = [];

    //first call gives us a total we can use to chunk the songs and get them in parallel

    let {
      data: {
        data: songs,
        meta: { total },
      },
    } = await musicKit.api.music("v1/me/library/songs", {
      limit: limit,
      offset: offset,
    });

    allSongs.push(...songs);

    //get remaining songs in chunks in parallel
    //create a promise for each chunk
    let promises = [];
    for (let i = 1; i < Math.ceil(total / limit); i++) {
      promises.push(
        musicKit.api.music("v1/me/library/songs", {
          limit: limit,
          offset: offset + i * limit,
        })
      );
    }
    let results = await Promise.all(promises);
    results.forEach((result: any) => {
      allSongs.push(...result.data.data);
    });

    //filter out songs that aren't favorites
    let favorites = (await this.filterAppleMusicFavorites(allSongs)).map(
      (song) => new Song(song)
    );
    await localStorage.setItem(
      "apple_music_favorites",
      JSON.stringify(favorites)
    );
    await localStorage.setItem(
      "apple_music_favorites_date",
      new Date().toISOString()
    );
    return favorites;
  }
}

export class Artwork {
  url: string;
  width: number | null | undefined;
  height: number | null | undefined;

  constructor(artwork: SpotifyApi.ImageObject | MusicKit.Artwork) {
    this.url = artwork.url;
    this.width = artwork.width;
    this.height = artwork.height;
  }
}

export class Song {
  id: string;
  title: string | null | undefined;
  artist: string | null | undefined;
  album: string | null | undefined;
  artwork: Artwork | null | undefined;
  catalogId: string | null | undefined;
  type: "songs" | "music-videos";
  genreNames: string[];
  musicProvider: MusicProvider;
  previewUrl: string | null | undefined;

  //TODO add market restrictions

  constructor(
    song:
      | MusicKit.Songs
      | MusicKit.MusicVideos
      | SpotifyApi.TrackObjectFull
      | SpotifyApi.EpisodeObjectFull
  ) {
    if (song.type === "track") {
      this.id = song.id;
      this.title = song.name;
      this.artist = song.artists.map((artist) => artist.name).join(", ");
      this.album = song.album.name;
      let artwork = song.album.images[0];
      if (artwork) {
        this.artwork = new Artwork(artwork);
      }
      this.catalogId = null;
      this.type = "songs";
      this.genreNames = []; //TODO
      this.musicProvider = MusicProvider.Spotify;
      this.previewUrl = song.preview_url;
    } else if (song.type === "episode") {
      this.id = song.id;
      this.title = song.name;
      this.artist = song.show.publisher;
      this.album = song.show.name;
      let artwork = song.show.images[0];
      if (artwork) {
        this.artwork = new Artwork(artwork);
      }
      this.catalogId = null;
      this.type = "songs";
      this.genreNames = []; //TODO
      this.musicProvider = MusicProvider.Spotify;
    } else {
      this.id = song.id;
      this.title = song.attributes?.name;
      this.artist = song.attributes?.artistName;
      this.album = song.attributes?.albumName;
      this.type = song.type;
      this.genreNames = song.attributes?.genreNames || [];

      this.catalogId = song.attributes?.playParams?.catalogId;
      this.musicProvider = MusicProvider.AppleMusic;
      let artwork = song.attributes?.artwork;
      if (artwork) {
        this.artwork = new Artwork(artwork);
      }
    }
  }
}

export class Playlist {
  id: string;
  name: string;
  description: string;
  musicProvider: MusicProvider;

  dateAdded: string | null;
  tracks: Song[] = [];

  constructor(
    playlist:
      | MusicKit.Playlists
      | MusicKit.LibraryPlaylists
      | SpotifyApi.PlaylistObjectSimplified,
    songs?: Song[]
  ) {
    if (playlist.type === "playlist") {
      this.musicProvider = MusicProvider.Spotify;

      this.id = playlist.id;
      this.name = playlist.name;
      this.description = playlist.description || "";
      this.dateAdded = null;
      this.tracks = songs || [];
    } else {
      this.musicProvider = MusicProvider.AppleMusic;

      this.id = playlist.id;
      this.name = playlist.attributes?.name || "";
      this.description = playlist.attributes?.description?.standard || "";
      this.dateAdded =
        (playlist.type === "library-playlists" &&
          playlist.attributes?.dateAdded) ||
        null;
      this.tracks = songs || [];
    }
  }
}

let music: Music = new Music();

export function useMusic() {
  return music;
}
