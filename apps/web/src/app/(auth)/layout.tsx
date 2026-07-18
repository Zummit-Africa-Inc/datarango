import React from "react";

import { Logo } from "@datarango/ui";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: Props) => {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-16 items-center justify-between px-4 sm:h-21 sm:px-6 lg:px-10">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div className="bg-dot grid min-h-[calc(100dvh-8rem)] w-full flex-1 place-items-center bg-cover bg-center bg-no-repeat px-4 sm:min-h-[calc(100dvh-10.5rem)]">
        {children}
      </div>
      <div className="flex h-16 items-center justify-between px-4 text-sm sm:h-21 sm:px-6 lg:px-10">
        <p>&copy;{new Date().getFullYear()} Zummit Africa</p>
        <p>All rights reserved</p>
      </div>
    </div>
  );
};

export default AuthLayout;
