import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {MusicWrapper} from "../MusicWrapper";

export function Authorize() {

    let [isAuthorized, setIsAuthorized] = useState(false);
    let [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let authorized = async () => {
            let isAuthorized = await MusicWrapper.getInstance().isAuthorized();
            setIsAuthorized(isAuthorized);
        }
        authorized().then(() => {
            setIsLoading(false);
        });
    }, []);

    let navigate = useNavigate();

    //TODO add a subpage header

    return <div>
        <p>
            Please select a streaming provider to connect:
        </p>
        {isLoading
            ? <div>Loading...</div>
            : <div>
                {!isAuthorized
                    ? <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                              onClick={async () => {
                                  let music = await MusicWrapper.getInstance().getMusicKit()
                                  await music.authorize();
                                  navigate("/select-playlist");
                              }
                              }>Connect to Apple Music
                    </button>
                    : <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                              onClick={async () => {
                                  let music = await MusicWrapper.getInstance().getMusicKit()
                                  await music.unauthorize();
                              }
                              }>Disconnect from Apple Music
                    </button>
                }
            </div>}
    </div>;
}