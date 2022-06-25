import React from 'react';
import './App.css';
import {NotLoggedInScreen} from "./NotLoggedInScreen";
import {Rating} from "./Rating";

function App() {

    // TODO setup firebase

    window.MusicKit.configure({
        developerToken: process.env.REACT_APP_MUSIC_KIT_DEVELOPER_TOKEN,
        app: {
            name: 'Music Rating',
            build: '0.1.0'
        },
    });

    //navbar
    return (
        <div className="App">
            <header className="App-header">
                <h1>Music Rating</h1>
            </header>
            <div className="App-body">
                {window.MusicKit.getInstance().isAuthorized
                    ? <Rating/>
                    : <NotLoggedInScreen/>
                }

            </div>
        </div>
    );
}

export default App;
