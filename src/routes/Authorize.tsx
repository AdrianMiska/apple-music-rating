import React, {useEffect, useState} from "react";
import {MusicWrapper} from "../MusicWrapper";
import {faSpotify} from "@fortawesome/free-brands-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMusic} from "@fortawesome/free-solid-svg-icons";
import MusicProvider = MusicWrapper.MusicProvider;

export function Authorize() {

    let [authorizations, setAuthorizations] = useState<MusicWrapper.MusicProvider[]>([]);
    let [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        MusicWrapper.getInstance().getAuthorizations().then((authorizations) => {
            setAuthorizations(authorizations);
            setIsLoading(false);
        });
    });

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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return <div>
        <p> {authorizations.length > 0 ? "Manage your authorized music providers:" : "Please connect a music provider to continue:"} </p>

        <div className="flex flex-wrap mt-3 justify-evenly">
            {!authorizations.includes(MusicProvider.AppleMusic)
                ? <button
                    className="flex flex-row bg-white rounded-lg shadow-lg hover:bg-gray-100 hover:shadow-md justify-evenly py-2 px-4 rounded w-1/3"
                    onClick={async () => {
                        await MusicWrapper.getInstance().authorize(MusicWrapper.MusicProvider.AppleMusic);
                        //navigate("/select-playlist");
                    }
                    }>
                    <FontAwesomeIcon icon={faMusic} className="text-3xl text-center self-center mr-2"/>
                    <p className="font-bold text-xl my-auto">
                        Connect to Apple Music
                    </p>
                </button>
                : <button
                    className="flex flex-row bg-white rounded-lg shadow-lg hover:bg-gray-100 hover:shadow-md justify-evenly py-2 px-4 rounded w-1/3"
                    onClick={async () => {
                        await MusicWrapper.getInstance().unauthorize(MusicWrapper.MusicProvider.AppleMusic);
                    }
                    }>
                    <FontAwesomeIcon icon={faMusic} className="text-3xl text-center self-center mr-2"/>
                    <p className="font-bold text-xl my-auto">
                        Disconnect from Apple Music
                    </p>
                </button>
            }

            {!authorizations.includes(MusicProvider.Spotify)
                ? <button
                    className="flex flex-row bg-white rounded-lg shadow-lg hover:bg-gray-100 hover:shadow-md justify-evenly py-2 px-4 rounded w-1/3"
                    onClick={async () => {
                        await MusicWrapper.getInstance().authorize(MusicWrapper.MusicProvider.Spotify);
                        //navigate("/select-playlist");
                    }
                    }>
                    <FontAwesomeIcon icon={faSpotify} className="text-3xl text-center self-center mr-2"/>
                    <p className="font-bold text-xl my-auto">
                        Connect to Spotify
                    </p>
                </button>
                : <button
                    className="flex flex-row bg-white rounded-lg shadow-lg hover:bg-gray-100 hover:shadow-md justify-evenly py-2 px-4 rounded w-1/3"
                    onClick={async () => {
                        await MusicWrapper.getInstance().unauthorize(MusicWrapper.MusicProvider.Spotify);
                    }
                    }>
                    <FontAwesomeIcon icon={faSpotify} className="text-3xl text-center self-center mr-2"/>
                    <p className="font-bold text-xl my-auto">
                        Disconnect from Spotify
                    </p>
                </button>
            }
        </div>
    </div>;
}