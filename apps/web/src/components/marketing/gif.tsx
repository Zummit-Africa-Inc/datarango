"use client";

import React from "react";

interface Props {
  title: string;
}

export const Gif = ({ title }: Props) => {
  const url = `/assets/videos/${title}.mp4`;

  return (
    <div className="mx-auto h-full w-full">
      <video
        autoPlay
        controls={false}
        className="size-full"
        muted
        loop
        playsInline
        src={url}
      ></video>
    </div>
  );
};
