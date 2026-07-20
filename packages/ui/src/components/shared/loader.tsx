"use client";

import React, { useState } from "react";

import { LOADING_VERBS } from "../../constants/loading-verbs";
import { useInterval } from "../../hooks";
import { cn } from "../../lib";
import { Logo } from "./logo";

interface Props {
  className?: string;
}

export const Loader = ({ className }: Props) => {
  const [verb, setVerb] = useState(0);

  useInterval(() => {
    setVerb((v) => (v + 1) % LOADING_VERBS.length);
  }, 2500);

  return (
    <div
      className={cn(
        "bg-canvas fixed top-0 left-0 z-50! grid h-screen w-screen place-items-center",
        className,
      )}
    >
      <div className="text-center">
        <Logo />
        <h6 className="text-ink text-xl">{LOADING_VERBS[verb]}...</h6>
      </div>
    </div>
  );
};
