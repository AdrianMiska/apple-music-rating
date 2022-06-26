import React from "react";

export class NotLoggedInScreen extends React.Component {
    render() {
        return <div>
            <button className="bg-slate-500 hover:bg-slate-700
                text-white font-bold py-2 px-4 rounded"
                onClick={() =>  {
                    window.MusicKit.getInstance().authorize();
                }
                }>Login with Apple Music
            </button>
        </div>;
    }
}