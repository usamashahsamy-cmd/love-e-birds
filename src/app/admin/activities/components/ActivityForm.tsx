"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Pencil, Power } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { saveActivity } from "@/actions/activities-admin";

export type ActivityInput = {
  id: string | null;
  title: string;
  slug: string;
  startAt: string;
  endAt: string;
  maxQuantity: number;
  active: boolean;
};

export type ActivityFormValues = Omit<ActivityInput, "id">;

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toDateLocalInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toUtcIso(localValue: string) {
  if (!localValue) return "";
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function ActivityFields({
  values,
  onChange,
  disabled,
}: {
  values: ActivityFormValues;
  onChange: (next: ActivityFormValues) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="grid grid-cols-1 gap-2">
        <input
          value={values.title}
          onChange={(e) => onChange({ ...values, title: e.target.value })}
          placeholder="Title"
          aria-label="Title"
          disabled={disabled}
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
        <input
          value={values.slug}
          onChange={(e) => onChange({ ...values, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
          placeholder="Slug (lowercase-with-dashes)"
          aria-label="Slug"
          disabled={disabled}
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-muted-foreground">
          Start date and time
          <input
            type="datetime-local"
            value={values.startAt}
            onChange={(e) => onChange({ ...values, startAt: e.target.value })}
            disabled={disabled}
            className="block w-full mt-1 px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </label>
        <label className="text-[11px] text-muted-foreground">
          End date and time
          <input
            type="datetime-local"
            value={values.endAt}
            onChange={(e) => onChange({ ...values, endAt: e.target.value })}
            disabled={disabled}
            className="block w-full mt-1 px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-muted-foreground">
          Max quantity
          <input
            type="number"
            min={1}
            max={1000}
            value={values.maxQuantity}
            onChange={(e) => onChange({ ...values, maxQuantity: Number(e.target.value) })}
            disabled={disabled}
            className="block w-full mt-1 px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </label>
        <label className="text-[11px] text-muted-foreground">
          Status
          <select
            value={values.active ? "active" : "inactive"}
            onChange={(e) => onChange({ ...values, active: e.target.value === "active" })}
            disabled={disabled}
            className="block w-full mt-1 px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <p className="text-[11px] text-muted-foreground flex-1">
          {formatDateTime(values.startAt)} → {formatDateTime(values.endAt)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {values.active ? "Active" : "Inactive"}
        </p>
      </div>
    </div>
  );
}

export default function ActivityForm({ activity }: { activity?: ActivityInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initial = useMemo<ActivityFormValues>(
    () => ({
      title: activity?.title ?? "",
      slug: activity?.slug ?? "",
      startAt: activity ? toDateLocalInputValue(new Date(activity.startAt)) : "",
      endAt: activity ? toDateLocalInputValue(new Date(activity.endAt)) : "",
      maxQuantity: activity?.maxQuantity ?? 10,
      active: activity?.active ?? true,
    }),
    [activity]
  );

  const [values, setValues] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(next: ActivityFormValues) {
    setValues(next);
    if (error) setError(null);
  }

  function submit() {
    const title = values.title.trim();
    const slug = values.slug.trim();
    if (!title || !slug) {
      setError("Enter a title and slug");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("Slug must be lowercase letters, numbers, and dashes");
      return;
    }
    if (!values.startAt || !values.endAt) {
      setError("Pick a start and end time");
      return;
    }
    const startIso = toUtcIso(values.startAt);
    const endIso = toUtcIso(values.endAt);
    if (!startIso || !endIso) {
      setError("Invalid start or end time");
      return;
    }
    if (!(Number.isInteger(values.maxQuantity) && values.maxQuantity >= 1 && values.maxQuantity <= 1000)) {
      setError("Max quantity must be between 1 and 1000");
      return;
    }
    const invalidRange = new Date(endIso).getTime() <= new Date(startIso).getTime();
    if (invalidRange) {
      setError("End time must be after start time");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await saveActivity(activity?.id ?? null, {
          title,
          slug,
          startAt: startIso,
          endAt: endIso,
          maxQuantity: values.maxQuantity,
          active: values.active,
        });
        if (res.success) {
          toast(activity ? "Activity updated" : "Activity created", "success");
          if (activity) {
            setEditing(false);
          } else {
            setValues(initial);
          }
          router.refresh();
        } else {
          toast(res.error ?? "Unable to save activity", "error");
        }
      } catch {
        toast("Unable to save activity. Please try again.", "error");
      }
    });
  }

  function toggleActive() {
    if (!activity) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await saveActivity(activity.id, {
          title: activity.title,
          slug: activity.slug,
          startAt: activity.startAt,
          endAt: activity.endAt,
          maxQuantity: activity.maxQuantity,
          active: !activity.active,
        });
        if (res.success) {
          toast(activity.active ? "Activity deactivated" : "Activity activated", "success");
          router.refresh();
        } else {
          toast(res.error ?? "Unable to save activity", "error");
        }
      } catch {
        toast("Unable to update activity status. Please try again.", "error");
      }
    });
  }

  function beginEdit() {
    setValues(initial);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setValues(initial);
    setError(null);
    setEditing(false);
  }

  const busy = pending;
  const isCreate = !activity;

  if (!isCreate && !editing) {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <CalendarDays size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{activity.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              /{activity.slug} · {formatDateTime(activity.startAt)} → {formatDateTime(activity.endAt)} · max {activity.maxQuantity}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={beginEdit}
              disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              onClick={toggleActive}
              disabled={busy}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                activity.active
                  ? "bg-success/10 text-success hover:bg-success/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Power size={13} /> {busy ? "Saving..." : activity.active ? "Active" : "Inactive"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <p className="text-sm font-semibold mb-3">{isCreate ? "Create activity" : "Edit activity"}</p>
      <ActivityFields values={values} onChange={setField} disabled={busy} />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          <CalendarDays size={13} /> {busy ? "Saving..." : isCreate ? "Create activity" : "Save changes"}
        </button>
        {!isCreate && (
          <button
            onClick={cancelEdit}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
