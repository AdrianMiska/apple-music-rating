import React, {useEffect, useState} from "react";
import {MusicWrapper} from "../MusicWrapper";
import MusicProvider = MusicWrapper.MusicProvider;

export function Authorize() {

    let [authorizations, setAuthorizations] = useState<MusicWrapper.MusicProvider[]>([]);
    let [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let authorized = async () => {
            let authorizations = await MusicWrapper.getInstance().getAuthorizations();
            console.log(authorizations);
            setAuthorizations(authorizations);
        }
        authorized().then(() => {
            setIsLoading(false);
        });
    }, []);

    //let navigate = useNavigate();

    let params = new URLSearchParams(window.location.search);

    let code = params.get("code");
    let state = params.get("state");

    if (code && state) {
        MusicWrapper.getInstance().generateSpotifyToken(code, state).then(() => {
            window.location.href = "/authorize";
        });
    }

    //TODO add a subpage header

    return <div>
        <p>
            Please select a streaming provider to connect:
        </p>
        {isLoading
            ? <div>Loading...</div>
            : <div>
                <div>
                    {!authorizations.includes(MusicProvider.AppleMusic)
                        ? <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                                  onClick={async () => {
                                      await MusicWrapper.getInstance().authorize(MusicWrapper.MusicProvider.AppleMusic);
                                      //navigate("/select-playlist");
                                  }
                                  }>Connect to Apple Music
                        </button>
                        : <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                                  onClick={async () => {
                                      await MusicWrapper.getInstance().unauthorize(MusicWrapper.MusicProvider.AppleMusic);
                                  }
                                  }>Disconnect from Apple Music
                        </button>
                    }
                </div>
                <div>
                    {!authorizations.includes(MusicProvider.Spotify)
                        ? <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                                  onClick={async () => {
                                      await MusicWrapper.getInstance().authorize(MusicWrapper.MusicProvider.Spotify);
                                      //navigate("/select-playlist");
                                  }
                                  }>Connect to Spotify
                        </button>
                        : <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                                  onClick={async () => {
                                      await MusicWrapper.getInstance().unauthorize(MusicWrapper.MusicProvider.Spotify);
                                  }
                                  }>Disconnect from Spotify
                        </button>
                    }
                </div>
            </div>}
    </div>;
}