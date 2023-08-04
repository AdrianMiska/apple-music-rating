import { Artwork } from "./Artwork";
import { HeartIcon } from "@heroicons/react/24/solid";
import { PlayButton } from "./PlayButton";
import React from "react";
import { RatingPair } from "../pages/song-rating/[id]";

export function MatchUpPlayer(props: {
  processResult: (winner: "baseline" | "candidate" | "tie") => Promise<void>;
  matchUp: RatingPair;
}) {
  const { baseline, candidate } = props.matchUp;
  return (
    <>
      <div className="mx-auto my-2 grid max-w-xl grid-cols-2">
        <div className="mx-4 mt-auto">
          <Artwork artwork={baseline.artwork || null} />
        </div>
        <div className="mx-4 mt-auto">
          <Artwork artwork={candidate.artwork || null} />
        </div>

        <h1 className="m-2 text-center text-xl font-bold">{baseline.title}</h1>
        <h1 className="m-2 text-center text-xl font-bold">{candidate.title}</h1>

        <h2 className="mx-2 text-center text-sm font-semibold">
          {baseline.artist}
        </h2>
        <h2 className="mx-2 text-center text-sm font-semibold">
          {candidate.artist}
        </h2>
      </div>
      <div className="mx-auto my-2 flex max-w-lg flex-row">
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full flex-row items-center justify-between">
            <button
              className="m-2 h-10 w-10 rounded-full border-0 bg-gray-500 p-2 text-white hover:bg-gray-700"
              onClick={() => props.processResult("baseline")}
            >
              <HeartIcon />
            </button>
            <PlayButton song={baseline} />
            <div />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <button
            className="m-2 h-10 w-10 rounded-full border-0 bg-gray-500 p-2 font-bold text-white hover:bg-gray-700"
            onClick={() => props.processResult("tie")}
          >
            Tie
          </button>
        </div>
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full flex-row items-center justify-between">
            <div />

            <PlayButton song={candidate} />
            <button
              className="m-2 h-10 w-10 rounded-full border-0 bg-gray-500 p-2 text-white hover:bg-gray-700"
              onClick={() => props.processResult("candidate")}
            >
              <HeartIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
