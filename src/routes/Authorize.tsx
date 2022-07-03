import React from "react";
import {useNavigate} from "react-router-dom";

export function Authorize() {

    let navigate = useNavigate();

    return <div>
        <p>
            Please select a streaming provider to connect:
        </p>
        {!window.MusicKit.getInstance().isAuthorized
            ? <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                      onClick={async () => {
                          await window.MusicKit.getInstance().authorize();
                          navigate("/select-playlist");
                      }
                      }>Connect to Apple Music
            </button>
            : <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                      onClick={() => {
                          window.MusicKit.getInstance().unauthorize();
                      }
                      }>Disconnect from Apple Music
            </button>
        }
    </div>;
}