import React, { Suspense } from "react";
import Link from "next/link";

import { cn, Loader, Logo } from "@datarango/ui";

interface Props {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: Props) => {
  return (
    <Suspense fallback={<Loader />}>
      <div className="grid h-auto lg:h-screen w-screen place-items-center overflow-hidden py-5 lg:py-10">
        <div className="flex max-w-4xl flex-col items-center gap-y-10">
          <Link href="/">
            <Logo className="h-10" />
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="grid place-items-center lg:pr-4">
              <div className="flex flex-col justify-center gap-y-10 p-8">
                <div className="space-y-1">
                  <p className="text-ink text-xl font-semibold">
                    Learn how to use Datarango to analyze and visualize your data.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Get started with our comprehensive guide to mastering Datarango.
                  </p>
                </div>
                <div className="relative grid h-50 w-full place-items-center">
                  {[...Array(4)].map((_, i) => (
                    <div
                      className={cn(
                        "border-primary-300 aspect-square bg-primary-50 rounded-md border shadow absolute",
                      )}
                      key={i}
                      style={{ 
                        width: `${40 + i * 10}px`,
                        top: i < 2 ? '0' : 'auto',
                        bottom: i >= 2 ? '0' : 'auto',
                        left: i % 2 === 0 ? '0' : 'auto',
                        right: i % 2 === 1 ? '0' : 'auto',
                        transform: `rotate(${(i + 1) * 5}deg)`
                      }}
                    ></div>
                  ))}
                  <div className="">
                    <Logo type="icon" />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:border-l lg:pl-4">{children}</div>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default AuthLayout;
