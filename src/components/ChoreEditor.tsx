"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { saveChore } from "@/lib/actions/chores";
import { SubmitButton } from "./SubmitButton";
import { Field, FormError, inputClass } from "./Form";
import {
  DAY_INITIALS,
  EMOJI_CHOICES,
  MASK_EVERY_DAY,
  MASK_WEEKENDS,
  MASK_WEEKDAYS,
  cn,
  describeSchedule,
  isDayScheduled,
} from "@/lib/utils";
import type { ActionState, Chore, Member } from "@/lib/types";

const PRESETS = [
  { label: "Every day", mask: MASK_EVERY_DAY },
  { label: "Weekdays", mask: MASK_WEEKDAYS },
  { label: "Weekends", mask: MASK_WEEKENDS },
];

// Monday-first ordering for the day picker.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function ChoreEditor({
  chore,
  members,
  onClose,
}: {
  chore: Chore | null;
  members: Member[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    saveChore,
    null,
  );
  const ranRef = useRef(false);
  const [emoji, setEmoji] = useState(chore?.emoji ?? EMOJI_CHOICES[0]);
  const [mask, setMask] = useState(chore?.daysMask ?? MASK_EVERY_DAY);
  const [assignee, setAssignee] = useState(
    chore?.assigneeId ? String(chore.assigneeId) : "",
  );
  const [points, setPoints] = useState(String(chore?.points ?? 5));

  // Close once the action settles and it did not report an error.
  useEffect(() => {
    if (isPending) {
      ranRef.current = true;
      return;
    }
    if (ranRef.current && !state?.error) {
      ranRef.current = false;
      onClose();
    }
  }, [isPending, state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-ink-soft shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {chore ? "Edit chore" : "New chore"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {chore
                ? "Changes apply from the next due date."
                : "Add a job to the family chart."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-line bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-fg"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </header>

        <form action={formAction} className="flex-1 space-y-5 px-6 py-6">
          {chore && <input type="hidden" name="id" value={chore.id} />}
          <input type="hidden" name="emoji" value={emoji} />
          <input type="hidden" name="daysMask" value={mask} />
          <input type="hidden" name="assigneeId" value={assignee} />

          <FormError message={state?.error} />

          <Field label="Chore">
            <input
              name="title"
              className={inputClass}
              placeholder="Take out the recycling"
              defaultValue={chore?.title}
              required
            />
          </Field>

          <Field label="Icon">
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "grid size-10 place-items-center rounded-xl text-lg transition-all",
                    e === emoji
                      ? "scale-110 bg-accent/20 ring-1 ring-accent/50"
                      : "bg-white/5 hover:bg-white/10",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Points" hint="1–100">
              <input
                name="points"
                type="number"
                min={1}
                max={100}
                className={inputClass}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                required
              />
            </Field>

            <Field label="Who does it">
              <select
                className={inputClass}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Anyone</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.emoji} {m.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Repeats">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setMask(preset.mask)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      mask === preset.mask
                        ? "border-accent/50 bg-accent/15"
                        : "border-line bg-white/5 text-muted hover:bg-white/10",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1.5">
                {DAY_ORDER.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setMask((prev) => prev ^ (1 << day))}
                    aria-pressed={isDayScheduled(mask, day)}
                    className={cn(
                      "size-10 rounded-xl border text-xs font-semibold transition-all",
                      isDayScheduled(mask, day)
                        ? "border-accent/50 bg-accent text-[#1a0f05]"
                        : "border-line bg-white/5 text-muted hover:bg-white/10",
                    )}
                  >
                    {DAY_INITIALS[day]}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted">{describeSchedule(mask)}</p>
            </div>
          </Field>

          <div className="flex gap-2 pt-1">
            <SubmitButton className="flex-1" pendingLabel="Saving…">
              {chore ? "Save changes" : "Add chore"}
            </SubmitButton>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line bg-white/5 px-5 py-2.5 text-sm text-muted transition-colors hover:bg-white/10 hover:text-fg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
