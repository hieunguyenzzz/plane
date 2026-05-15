/**
 * Mobelaris fork — Tier B: generic spreadsheet column for a single custom property.
 *
 * Renders an inline editor whose type depends on `property.type` and writes back
 * via `useCustomProperty().upsertIssueValue`.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type {
  TCustomProperty,
  TCustomPropertyValuePrimitive,
  TIssue,
} from "@plane/types";
import { useCustomProperty } from "@/hooks/store/use-custom-property";

type Props = {
  issue: TIssue;
  property: TCustomProperty;
  disabled?: boolean;
};

const cellClass =
  "h-11 w-full px-2 text-13 text-primary outline-none focus:bg-layer-2 disabled:opacity-60";

export const SpreadsheetCustomPropertyColumn = observer(function SpreadsheetCustomPropertyColumn(
  props: Props
) {
  const { issue, property, disabled = false } = props;
  const store = useCustomProperty();
  const { workspaceSlug } = useParams() as { workspaceSlug?: string };
  const slug = workspaceSlug ?? "";

  useEffect(() => {
    if (slug && issue.project_id && issue.id) {
      store.fetchIssueValues(slug, issue.project_id, issue.id).catch(() => undefined);
    }
  }, [slug, issue.project_id, issue.id, store]);

  const current = store.getIssueValueByProperty(issue.id, property.id)?.value ?? null;

  const commit = (next: TCustomPropertyValuePrimitive) => {
    if (!issue.project_id) return;
    void store.upsertIssueValue(slug, issue.project_id, issue.id, property.id, next);
  };

  switch (property.type) {
    case "text":
    case "url":
    case "email":
      return (
        <input
          type={property.type === "email" ? "email" : property.type === "url" ? "url" : "text"}
          className={cellClass + " border-none bg-transparent"}
          disabled={disabled}
          defaultValue={typeof current === "string" ? current : ""}
          onBlur={(e) => {
            const next = e.target.value.trim() === "" ? null : e.target.value;
            if ((current ?? null) === next) return;
            commit(next);
          }}
        />
      );
    case "number":
    case "currency":
    case "rating":
      return (
        <input
          type="number"
          step={property.type === "rating" ? "1" : "0.01"}
          className={cellClass + " border-none bg-transparent"}
          disabled={disabled}
          defaultValue={typeof current === "number" || typeof current === "string" ? String(current) : ""}
          onBlur={(e) => {
            const raw = e.target.value.trim();
            if (raw === "") {
              if (current !== null && current !== undefined) commit(null);
              return;
            }
            const n = parseFloat(raw);
            if (Number.isNaN(n)) return;
            commit(n);
          }}
        />
      );
    case "date":
      return (
        <input
          type="date"
          className={cellClass + " border-none bg-transparent"}
          disabled={disabled}
          defaultValue={typeof current === "string" ? current.slice(0, 10) : ""}
          onBlur={(e) => commit(e.target.value || null)}
        />
      );
    case "checkbox":
      return (
        <div className="flex h-11 items-center px-2">
          <input
            type="checkbox"
            disabled={disabled}
            checked={!!current}
            onChange={(e) => commit(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      );
    case "single_select": {
      const value = typeof current === "string" ? current : "";
      return (
        <select
          className={cellClass + " border-none bg-transparent"}
          disabled={disabled}
          value={value}
          onChange={(e) => commit(e.target.value === "" ? null : e.target.value)}
        >
          <option value="">—</option>
          {(property.options ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      );
    }
    case "multi_select": {
      const values = Array.isArray(current) ? current : [];
      const labels = (property.options ?? []).filter((o) => values.includes(o.id)).map((o) => o.name);
      return (
        <div className="flex h-11 items-center gap-1 px-2 text-13 text-tertiary">
          {labels.length === 0 ? "—" : labels.join(", ")}
        </div>
      );
    }
    case "person":
      return (
        <div className="flex h-11 items-center px-2 text-13 text-tertiary">
          {typeof current === "string" ? current : "—"}
        </div>
      );
    default:
      return <div className="h-11 px-2 text-13 text-tertiary">—</div>;
  }
});
