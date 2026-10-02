"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, createFamily, joinFamily } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";
import { Field, FormError, inputClass } from "./Form";
import { Avatar } from "./Avatar";
import { COLOR_CHOICES, EMOJI_AVATARS } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

export function SignInForm() {
  const [state, action] = useActionState<ActionState, FormData>(signIn, null);
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormError message={state?.error} />

      <Field label="Username">
        <input
          name="username"
          className={inputClass}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="alex"
          required
        />
      </Field>

      <Field label="Password">
        <input
          name="password"
          type="password"
          className={inputClass}
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

function AccountFields() {
  return (
    <>
      <Field label="Your name">
        <input name="name" className={inputClass} placeholder="Alex" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Username" hint="Used to sign in">
          <input
            name="username"
            className={inputClass}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="alex"
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
    </>
  );
}

function AvatarPicker({
  emoji,
  color,
  onPick,
}: {
  emoji: string;
  color: string;
  onPick: (next: { emoji?: string; color?: string }) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Avatar emoji={emoji} color={color} size="lg" glow />
        <p className="text-xs text-muted">Pick a look for the family board.</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_AVATARS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick({ emoji: e })}
            className={`grid size-9 place-items-center rounded-xl text-lg transition-all ${
              e === emoji ? "scale-110 bg-white/15" : "bg-white/5 hover:bg-white/10"
            }`}
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
            onClick={() => onPick({ color: c })}
            aria-label={`Colour ${c}`}
            className={`size-8 rounded-lg transition-all ${
              c === color ? "scale-110 ring-2 ring-white/70" : "opacity-70 hover:opacity-100"
            }`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

type Mode = "create" | "join";

export function OnboardingForm() {
  const [mode, setMode] = useState<Mode>("create");
  const [emoji, setEmoji] = useState(EMOJI_AVATARS[1]);
  const [color, setColor] = useState(COLOR_CHOICES[1]);
  const [createState, createAction] = useActionState<ActionState, FormData>(
    createFamily,
    null,
  );
  const [joinState, joinAction] = useActionState<ActionState, FormData>(
    joinFamily,
    null,
  );

  const pick = (next: { emoji?: string; color?: string }) => {
    if (next.emoji) setEmoji(next.emoji);
    if (next.color) setColor(next.color);
  };

  const hiddenLook = (
    <>
      <input type="hidden" name="emoji" value={emoji} />
      <input type="hidden" name="color" value={color} />
      <AvatarPicker emoji={emoji} color={color} onPick={pick} />
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-full border border-line bg-white/5 p-1">
        {(["create", "join"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              mode === value ? "bg-accent text-[#1a0f05]" : "text-muted hover:text-fg"
            }`}
          >
            {value === "create" ? "New family" : "Join with code"}
          </button>
        ))}
      </div>

      {mode === "create" ? (
        <form action={createAction} className="space-y-4">
          <FormError message={createState?.error} />
          <Field label="Family name">
            <input
              name="familyName"
              className={inputClass}
              placeholder="The Rivera Family"
              required
            />
          </Field>
          <AccountFields />
          {hiddenLook}
          <SubmitButton className="w-full" pendingLabel="Creating…">
            Create family
          </SubmitButton>
        </form>
      ) : (
        <form action={joinAction} className="space-y-4">
          <FormError message={joinState?.error} />
          <Field label="Invite code" hint="Ask a parent in your family">
            <input
              name="inviteCode"
              className={`${inputClass} font-mono tracking-[0.2em] uppercase`}
              placeholder="RIVERA24"
              required
            />
          </Field>

          <Field label="I am a">
            <div className="flex gap-2">
              {(["kid", "parent"] as const).map((role) => (
                <label
                  key={role}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-white/5 px-4 py-2.5 text-sm transition-colors has-[:checked]:border-accent/60 has-[:checked]:bg-accent/15"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    defaultChecked={role === "kid"}
                    className="accent-accent"
                  />
                  {role === "kid" ? "🧒 A kid" : "🧑 A parent"}
                </label>
              ))}
            </div>
          </Field>

          <AccountFields />
          {hiddenLook}
          <SubmitButton className="w-full" pendingLabel="Joining…">
            Join family
          </SubmitButton>
        </form>
      )}

      <p className="text-center text-xs text-muted/70">
        {mode === "create"
          ? "You'll be the first parent — add everyone else from the Members page."
          : "Kids can join too. A parent can change roles later."}
      </p>
    </div>
  );
}
