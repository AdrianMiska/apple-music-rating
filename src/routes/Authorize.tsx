import React from "react";

export class Authorize extends React.Component {
    render() {
        return <div>
            <p>
                Please select a streaming provider to connect:
            </p>
            {!window.MusicKit.getInstance().isAuthorized
                ? <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                          onClick={() => {
                              window.MusicKit.getInstance().authorize();
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
}