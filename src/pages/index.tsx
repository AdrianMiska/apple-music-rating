import React from "react";
import Head from "next/head";

export default function Index() {
  return (
    <div className="mt-12">
      <Head>
        <title>EloTunes - Discover Your Favorite Songs</title>
        <meta
          name="description"
          content="Discover your favorite songs with EloTunes, the easy way to rate your music library and create custom playlists based on your preferences."
        />
      </Head>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold text-gray-900">
          Discover Your Favorite Songs with EloTunes
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          The easy way to rate your music library and create custom playlists
          based on your preferences.
        </p>
      </div>
    </div>
  );
}
