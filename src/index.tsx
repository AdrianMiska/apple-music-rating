import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as Sentry from "@sentry/react";
import App from './App';
import reportWebVitals from './reportWebVitals';
import {
    BrowserRouter,
    createRoutesFromChildren,
    matchRoutes,
    Route,
    Routes,
    useLocation,
    useNavigationType
} from 'react-router-dom';
import {SongRating} from "./routes/SongRating";
import {Login} from "./routes/Login";
import {SelectPlaylist} from "./routes/SelectPlaylist";
import {Authorize} from "./routes/Authorize";
import {RequireAuthentication} from "./RequireAuthentication";
import {RequireAuthorization} from "./RequireAuthorization";
import {LandingPage} from "./routes/LandingPage";
import {BrowserTracing} from "@sentry/tracing";

Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes,
        ),
    })],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
});

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes)


const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <SentryRoutes>
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
            </SentryRoutes>
        </BrowserRouter>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
