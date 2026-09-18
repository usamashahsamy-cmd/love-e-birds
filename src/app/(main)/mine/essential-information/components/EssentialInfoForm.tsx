"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { updateProfile } from "@/actions/settings";

const GENDERS = ["FEMALE", "MALE", "OTHER"] as const;

export default function EssentialInfoForm({
  displayName,
  bio,
  location,
  gender,
  dateOfBirth,
}: {
  displayName: string;
  bio: string;
  location: string;
  gender: string;
  dateOfBirth: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [bioValue, setBioValue] = useState(bio);
  const [locationValue, setLocationValue] = useState(location);
  const [genderValue, setGenderValue] = useState(gender);
  const [dobValue, setDobValue] = useState(dateOfBirth);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim() || name.trim().length < 2) {
      toast("Display name must be at least 2 characters", "error");
      return;
    }
    startTransition(async () => {
      const res = await updateProfile({
        displayName: name.trim(),
        bio: bioValue.trim(),
        location: locationValue.trim(),
        gender: genderValue as "MALE" | "FEMALE" | "OTHER",
        dateOfBirth: dobValue || undefined,
      });
      if (res.success) {
        toast("Profile updated", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to update profile", "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Display name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
        <textarea
          value={bioValue}
          onChange={(e) => setBioValue(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Tell people about yourself..."
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Location</label>
        <input
          value={locationValue}
          onChange={(e) => setLocationValue(e.target.value)}
          placeholder="e.g. Rishikesh"
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
        <div className="grid grid-cols-3 gap-1.5">
          {GENDERS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenderValue(g)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize border transition-colors ${
                genderValue === g
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-card-border text-muted-foreground"
              }`}
            >
              {g.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Date of birth</label>
        <input
          type="date"
          value={dobValue}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDobValue(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none"
        />
        {dobValue && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Age updates automatically from your date of birth.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold gradient-primary hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
      >
        <Save size={15} />
        {pending ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}