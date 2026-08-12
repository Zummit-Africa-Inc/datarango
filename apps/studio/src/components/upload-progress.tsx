"use client";

import { Button } from "@datarango/ui";

/**
 * Send progress, with a way out.
 *
 * The video limit is 5 GB, so this is a bar somebody may watch for a long time
 * — which is also why cancelling is offered rather than only reachable by
 * closing the dialog. `aria-valuenow` and friends are set because a progress
 * bar that only communicates through width tells a screen-reader user nothing.
 */
export const UploadProgress = ({
  fraction,
  onCancel,
}: {
  fraction: number;
  onCancel?: () => void;
}) => {
  const percent = Math.min(100, Math.round(fraction * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Uploading… {percent}%</span>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="bg-muted h-1.5 w-full overflow-hidden rounded-xs"
      >
        <div
          className="bg-primary h-full transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
