"use client";

import React from "react";

import { useParamsHandler } from "@datarango/ui";

const Page = () => {
  const { onParamsChange, params } = useParamsHandler({ page: 1, pageSize: 12, search: "" });

  return <div className="space-y-6"></div>;
};

export default Page;
