import React, { useEffect, useState } from "react";
import { MusicProvider, useMusic } from "../MusicWrapper";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { RequireAuthentication } from "../RequireAuthentication";
import { useRouter } from "next/router";
import Head from "next/head";

function ProviderTile(props: {
  onClick: () => Promise<void>;
  icon: IconDefinition;
  label: string;
}) {
  return (
    <button
      className="mx-3 grid grid-cols-12 gap-4 rounded-lg bg-white p-4 shadow-lg hover:bg-gray-100 hover:shadow-md"
      onClick={props.onClick}
    >
      <FontAwesomeIcon
        icon={props.icon}
        className="col-span-2 text-center text-3xl"
      />
      <p className="col-span-10 text-xl font-bold">{props.label}</p>
    </button>
  );
}

export default function Authorize() {
  let [authorizations, setAuthorizations] = useState<MusicProvider[]>([]);
  let [isLoading, setIsLoading] = useState(true);

  let music = useMusic();

  useEffect(() => {
    music.getAuthorizations().then((authorizations) => {
      setAuthorizations(authorizations);
      setIsLoading(false);
    });
  });

  let router = useRouter();
  let params = new URLSearchParams(router.asPath.split("?")[1]);

  let code = params.get("code");
  let state = params.get("state");

  if (code && state) {
    music.generateSpotifyToken(code, state).then(() => {
      window.location.href = "/authorize";
    });
  }

  //TODO add a subpage header

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <RequireAuthentication>
      <div className="mt-12">
        <Head>
          <title>EloTunes - Discover Your Favorite Songs</title>
          <meta
            name="description"
            content="Authorize your music providers to continue."
          />
        </Head>
        <p>
          {authorizations.length > 0
            ? "Manage your authorized music providers:"
            : "Please connect a music provider to continue:"}
        </p>

        <div className="mx-auto mt-3 grid w-fit grid-cols-1 gap-4">
          {!authorizations.includes(MusicProvider.AppleMusic) ? (
            <ProviderTile
              icon={faMusic}
              label="Connect to Apple Music"
              onClick={async () => {
                await music.authorize(MusicProvider.AppleMusic);
                //navigate("/select-playlist");
              }}
            />
          ) : (
            <ProviderTile
              icon={faMusic}
              label="Disconnect from Apple Music"
              onClick={async () => {
                await music.unauthorize(MusicProvider.AppleMusic);
              }}
            />
          )}
          {!authorizations.includes(MusicProvider.Spotify) ? (
            <ProviderTile
              icon={faSpotify}
              label="Connect to Spotify"
              onClick={async () => {
                await music.authorize(MusicProvider.Spotify);
                //navigate("/select-playlist");
              }}
            />
          ) : (
            <ProviderTile
              icon={faSpotify}
              label="Disconnect from Spotify"
              onClick={async () => {
                await music.unauthorize(MusicProvider.Spotify);
              }}
            />
          )}
        </div>
      </div>
    </RequireAuthentication>
  );
}
