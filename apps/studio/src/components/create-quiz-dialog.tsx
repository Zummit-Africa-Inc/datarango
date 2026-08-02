"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from "@datarango/ui";

import { useCreateQuiz } from "@/hooks/assessment";

export const CreateQuizDialog = () => {
  const router = useRouter();
  const create = useCreateQuiz();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [threshold, setThreshold] = useState("70");
  const [maxAttempts, setMaxAttempts] = useState("0");
  const [minutes, setMinutes] = useState("");

  const thresholdValue = Number(threshold);
  const attemptsValue = Number(maxAttempts);
  const canSubmit =
    title.trim().length > 0 &&
    Number.isInteger(thresholdValue) &&
    thresholdValue >= 0 &&
    thresholdValue <= 100 &&
    Number.isInteger(attemptsValue) &&
    attemptsValue >= 0;

  const reset = () => {
    setTitle("");
    setDescription("");
    setThreshold("70");
    setMaxAttempts("0");
    setMinutes("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const parsedMinutes = Number(minutes);
    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        passThresholdPercent: thresholdValue,
        maxAttempts: attemptsValue,
        // Blank means untimed, which is a real choice rather than a missing value.
        timeLimitSeconds: minutes.trim() && parsedMinutes > 0 ? parsedMinutes * 60 : null,
      },
      {
        onSuccess: (quiz) => {
          setOpen(false);
          reset();
          router.push(`/quizzes/${quiz.id}`);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>New quiz</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a quiz</DialogTitle>
            <DialogDescription>
              Settings stay editable until you publish. Publishing makes the quiz visible to
              learners and freezes it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="quiz-title">Title</Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Pandas fundamentals check"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quiz-description">Description</Label>
              <Textarea
                id="quiz-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this quiz checks."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quiz-threshold">Pass mark %</Label>
                <Input
                  id="quiz-threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quiz-attempts">Attempts</Label>
                <Input
                  id="quiz-attempts"
                  type="number"
                  min={0}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">0 = unlimited</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quiz-minutes">Time limit</Label>
                <Input
                  id="quiz-minutes"
                  type="number"
                  min={0}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="—"
                />
                <p className="text-muted-foreground text-xs">minutes, blank = untimed</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || create.isPending}>
              {create.isPending ? "Creating…" : "Create quiz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
