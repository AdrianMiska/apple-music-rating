import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {SongRating} from "./routes/SongRating";
import {Login} from "./routes/Login";
import {SelectPlaylist} from "./routes/SelectPlaylist";
import {Authorize} from "./routes/Authorize";
import {RequireAuthentication} from "./RequireAuthentication";
import {RequireAuthorization} from "./RequireAuthorization";
import {LandingPage} from "./routes/LandingPage";

// noinspection SpellCheckingInspection
document.addEventListener('musickitloaded', async function () {
    await window.MusicKit.configure({
        developerToken: process.env.REACT_APP_MUSIC_KIT_DEVELOPER_TOKEN,
        app: {
            name: 'Elo Music Rating',
            build: '0.1.0'
        },
    });


    const root = ReactDOM.createRoot(
        document.getElementById('root') as HTMLElement
    );
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App/>}>
                        <Route index element={<LandingPage/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/authorize" element={
                            <RequireAuthentication>
                                <Authorize/>
                            </RequireAuthentication>
                        }/>
                        <Route path="/select-playlist" element={
                            <RequireAuthentication>
                                <RequireAuthorization>
                                    <SelectPlaylist/>
                                </RequireAuthorization>
                            </RequireAuthentication>
                        }/>
                        <Route path="/song-rating/:id" element={
                            <RequireAuthentication>
                                <RequireAuthorization>
                                    <SongRating/>
                                </RequireAuthorization>
                            </RequireAuthentication>
                        }/>
                    </Route>
                </Routes>
            </BrowserRouter>
        </React.StrictMode>
    );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
    reportWebVitals();
});