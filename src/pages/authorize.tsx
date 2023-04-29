import React, { useEffect, useState } from "react";
import { MusicProvider, useMusic } from "../MusicWrapper";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { RequireAuthentication } from "../RequireAuthentication";
import { useRouter } from "next/router";

function ProviderTile(props: {
  onClick: () => Promise<void>;
  icon: IconDefinition;
  label: string;
}) {
  return (
    <button
      className="mx-3 flex w-1/3 flex-row justify-evenly rounded-lg bg-white px-4 py-2 shadow-lg hover:bg-gray-100 hover:shadow-md"
      onClick={props.onClick}
    >
      <FontAwesomeIcon
        icon={props.icon}
        className="mr-2 self-center text-center text-3xl"
      />
      <p className="my-auto text-xl font-bold">{props.label}</p>
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
      <div>
        <p>
          {" "}
          {authorizations.length > 0
            ? "Manage your authorized music providers:"
            : "Please connect a music provider to continue:"}{" "}
        </p>

        <div className="mt-3 flex flex-wrap justify-center">
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
