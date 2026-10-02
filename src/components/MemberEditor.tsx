"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { saveMember } from "@/lib/actions/members";
import { SubmitButton } from "./SubmitButton";
import { Field, FormError, inputClass } from "./Form";
import { Avatar } from "./Avatar";
import { COLOR_CHOICES, EMOJI_AVATARS, cn } from "@/lib/utils";
import type { ActionState, Member } from "@/lib/types";

export function MemberEditor({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    saveMember,
    null,
  );
  const ranRef = useRef(false);
  const [emoji, setEmoji] = useState(member?.emoji ?? EMOJI_AVATARS[2]);
  const [color, setColor] = useState(member?.color ?? COLOR_CHOICES[2]);
  const [role, setRole] = useState<"parent" | "kid">(member?.role ?? "kid");

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
              {member ? `Edit ${member.name}` : "Add someone"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {member
                ? "Updating a password here resets it."
                : "They can sign in with these details straight away."}
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
          {member && <input type="hidden" name="id" value={member.id} />}
          <input type="hidden" name="emoji" value={emoji} />
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="role" value={role} />

          <FormError message={state?.error} />

          <Field label="Name">
            <input
              name="name"
              className={inputClass}
              defaultValue={member?.name}
              placeholder="Mia"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username">
              <input
                name="username"
                className={inputClass}
                defaultValue={member?.username}
                autoCapitalize="none"
                spellCheck={false}
                placeholder="mia"
                required
              />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <input
                name="password"
                type="password"
                className={inputClass}
                autoComplete="new-password"
                required
              />
            </Field>
          </div>

          <Field label="Role" hint="Only parents can manage chores and members">
            <div className="flex gap-2">
              {(["kid", "parent"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                    role === value
                      ? "border-accent/50 bg-accent/15"
                      : "border-line bg-white/5 text-muted hover:bg-white/10",
                  )}
                >
                  {value === "kid" ? "🧒 Kid" : "🧑 Parent"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Look">
            <div className="space-y-3">
              <Avatar emoji={emoji} color={color} size="lg" glow />
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_AVATARS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "grid size-9 place-items-center rounded-xl text-lg transition-all",
                      e === emoji
                        ? "scale-110 bg-white/15"
                        : "bg-white/5 hover:bg-white/10",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_CHOICES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Colour ${c}`}
                    className={cn(
                      "size-8 rounded-lg transition-all",
                      c === color
                        ? "scale-110 ring-2 ring-white/70"
                        : "opacity-70 hover:opacity-100",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </Field>

          <div className="flex gap-2 pt-1">
            <SubmitButton className="flex-1" pendingLabel="Saving…">
              {member ? "Save changes" : "Add to family"}
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
