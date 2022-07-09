import {useNavigate} from "react-router-dom";
import {MusicNoteIcon} from "@heroicons/react/solid";

export function LandingPage() {

    let navigate = useNavigate();

    return <div className="text-center">
        <h1 className="text-2xl font-bold">
            Elo Music Rating
        </h1>
        <h2 className="text-sm font-semibold mb-2">
            An app that allows you to rate your music using an Elo algorithm.
        </h2>
        <h2 className="text-sm font-semibold mb-2">
            Under construction.
        </h2>
        <h2 className="text-sm font-semibold mb-2">
            Select a playlist to rate.
        </h2>
        <button
            className="mx-auto flex items-center bg-transparent hover:bg-gray-200 text-gray-800 font-semibold hover:text-gray-900 py-2 pr-4 rounded"
            onClick={() => {
                navigate("/select-playlist");
            }}>
            <MusicNoteIcon className="w-4 h-4 mr-2"/> Let's go!
        </button>
    </div>;
}