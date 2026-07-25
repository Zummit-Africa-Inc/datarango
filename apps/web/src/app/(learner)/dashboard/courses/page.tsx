"use client";

import React from "react";

import { useParamsHandler } from "@datarango/ui";

const Page = () => {
  const { onParamsChange, params } = useParamsHandler({ page: 1, pageSize: 12, search: "" });

  return (
    <div className="space-y-6">
      <section className=""></section>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"></section>
      <section className="space-y-3"></section>
      <section className="space-y-3"></section>
    </div>
  );
};

export default Page;
