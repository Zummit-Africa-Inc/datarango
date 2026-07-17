import React from "react";

import { MicrosoftIcon } from "@/assets/icons";
import { Button } from "../ui/button";

interface Props {
  isLoading?: boolean;
}

export const SsoLogin = ({ isLoading = false }: Props) => {
  const handleSsoLogin = async () => {};

  return (
    <Button className="w-full" disabled={isLoading} onClick={handleSsoLogin} variant="outline">
      <MicrosoftIcon /> Microsoft
    </Button>
  );
};
