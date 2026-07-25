import React from "react";

import { IconBase, type IconProps } from "./icon-base";

export const FacebookIcon = ({ className, ...props }: IconProps) => {
  return <IconBase className={className} viewBox="0 0 24 24" {...props}></IconBase>;
};
