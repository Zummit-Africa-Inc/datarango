import { Cookie } from "lucide-react";
import { useState } from "react";

import { useCookiePreferences } from "@datarango/ui";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Switch,
} from "@datarango/ui";


export const CookiePreferences = () => {
  const [open, setOpen] = useState(false);
  const preferences = useCookiePreferences((state) => state.preferences);
  const onPreferenceChange = useCookiePreferences(
    (state) => state.onPreferenceChange,
  );
  
  const COOKIES_OPTIONS = [
    { id: "essential", label: "Essential", required: true, description: "Required for the site to work securely." },
    { id: "functional", label: "Functional", required: false, description: "Remembers preferences and enhances features." },
    { id: "analytics", label: "Analytics", required: false, description: "Helps us understand how the site is used." },
    { id: "marketing", label: "Marketing", required: false, description: "Used to show relevant marketing." },
  ] as const;
  
  return (
    <Dialog onOpenChange={(open) => setOpen(open)} open={open}>
      <DialogTrigger>
        <button
          aria-label="Open cookie preferences"
          className="fixed right-4 bottom-4 rounded-full border bg-background px-4 py-2 text-sm shadow"
        >
          <Cookie />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cookie preferences</DialogTitle>
          <DialogDescription>
            Choose which optional cookies you want to allow.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {COOKIES_OPTIONS.map((option) => (
            <div className="flex items-center justify-between" key={option.id}>
              <div className="max-w-2/3">
                <h4>{option.label}</h4>
                <p className="text-muted-foreground text-xs">{option.description}</p>
              </div>
              <Switch
                checked={preferences[option.id]}
                disabled={option.required}
                onCheckedChange={(checked) =>
                  onPreferenceChange({ [option.id]: checked })
                }
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onPreferenceChange({
                essential: true,
                functional: false,
                analytics: false,
                marketing: false,
              });
              setOpen(false);
            }}
          >
            Reject All
          </Button>
          <Button
            onClick={() => {
              onPreferenceChange({
                essential: true,
                functional: true,
                analytics: true,
                marketing: true,
              });
              setOpen(false);
            }}
          >
            Accept All
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
