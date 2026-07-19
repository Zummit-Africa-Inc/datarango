"use client";

import { useParams } from "next/navigation";
import React from "react";

const Page = () => {
  const id = useParams().id as string;

  return <div className="space-y-6">Page</div>;
};

export default Page;
