/**
 * Mobelaris fork — Tier B: sidebar editors for generic custom properties.
 * Renders one row per CustomProperty defined for the project.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import type {
  TCustomProperty,
  TCustomPropertyOption,
  TCustomPropertyValuePrimitive,
} from "@plane/types";
import { useCustomProperty } from "@/hooks/store/use-custom-property";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

const labelClass = "flex h-8 items-center gap-2 text-sm text-tertiary w-2/5 flex-shrink-0";
const rowClass = "flex w-full min-h-8 items-center gap-2 py-1";
const inputClass =
  "h-8 w-full rounded border border-subtle bg-transparent px-2 text-13 text-primary outline-none focus:border-accent-primary";

function PropertyEditor({
  property,
  value,
  disabled,
  onChange,
}: {
  property: TCustomProperty;
  value: TCustomPropertyValuePrimitive;
  disabled: boolean;
  onChange: (next: TCustomPropertyValuePrimitive) => void;
}) {
  const stringValue = value === null || value === undefined ? "" : String(value);

  switch (property.type) {
    case "text":
    case "url":
    case "email":
      return (
        <input
          type={property.type === "email" ? "email" : property.type === "url" ? "url" : "text"}
          className={inputClass}
          disabled={disabled}
          defaultValue={stringValue}
          placeholder="—"
          onBlur={(e) => {
            const next = e.target.value.trim() === "" ? null : e.target.value;
            if ((value ?? null) === next) return;
            onChange(next);
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
          className={inputClass}
          disabled={disabled}
          defaultValue={stringValue}
          placeholder="—"
          onBlur={(e) => {
            const raw = e.target.value.trim();
            if (raw === "") {
              if (value !== null && value !== undefined) onChange(null);
              return;
            }
            const num = parseFloat(raw);
            if (Number.isNaN(num)) return;
            onChange(num);
          }}
        />
      );

    case "date":
      return (
        <input
          type="date"
          className={inputClass}
          disabled={disabled}
          defaultValue={typeof value === "string" ? value.slice(0, 10) : ""}
          onBlur={(e) => {
            const raw = e.target.value;
            onChange(raw || null);
          }}
        />
      );

    case "checkbox":
      return (
        <input
          type="checkbox"
          disabled={disabled}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
      );

    case "single_select": {
      const current = typeof value === "string" ? value : "";
      return (
        <select
          className={inputClass}
          disabled={disabled}
          value={current}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        >
          <option value="">—</option>
          {(property.options ?? []).map((opt: TCustomPropertyOption) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      );
    }

    case "multi_select": {
      const current = Array.isArray(value) ? value : [];
      const toggle = (optId: string) => {
        const next = current.includes(optId)
          ? current.filter((v) => v !== optId)
          : [...current, optId];
        onChange(next);
      };
      return (
        <div className="flex flex-wrap gap-1">
          {(property.options ?? []).map((opt: TCustomPropertyOption) => {
            const active = current.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => toggle(opt.id)}
                className={
                  "rounded-full border px-2 py-0.5 text-xs " +
                  (active
                    ? "border-accent-primary bg-accent-primary/15 text-accent-primary"
                    : "border-subtle text-tertiary hover:border-secondary")
                }
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      );
    }

    case "person":
      return (
        <input
          type="text"
          className={inputClass}
          disabled={disabled}
          defaultValue={stringValue}
          placeholder="User ID"
          onBlur={(e) => {
            const raw = e.target.value.trim();
            onChange(raw === "" ? null : raw);
          }}
        />
      );

    default:
      return <span className="text-13 text-tertiary">—</span>;
  }
}

export const WorkItemAdditionalSidebarProperties = observer(function WorkItemAdditionalSidebarProperties(
  props: TWorkItemAdditionalSidebarProperties
) {
  const { workItemId, projectId, workspaceSlug, isEditable } = props;
  const store = useCustomProperty();
  const properties = store.getProjectProperties(projectId);
  const values = store.getIssueValues(workItemId) ?? [];

  useEffect(() => {
    if (workspaceSlug && projectId) {
      store.fetchProjectProperties(workspaceSlug, projectId).catch(() => undefined);
    }
  }, [workspaceSlug, projectId, store]);

  useEffect(() => {
    if (workspaceSlug && projectId && workItemId) {
      store.fetchIssueValues(workspaceSlug, projectId, workItemId).catch(() => undefined);
    }
  }, [workspaceSlug, projectId, workItemId, store]);

  if (!properties || properties.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-subtle pt-3">
      <div className="text-xs font-medium uppercase text-tertiary">Custom properties</div>
      {properties.map((property) => {
        if (!property.is_active) return null;
        const current = values.find((v) => v.property === property.id)?.value ?? null;
        return (
          <div key={property.id} className={rowClass}>
            <div className={labelClass}>{property.name}</div>
            <PropertyEditor
              property={property}
              value={current}
              disabled={!isEditable}
              onChange={(next) => {
                void store.upsertIssueValue(workspaceSlug, projectId, workItemId, property.id, next);
              }}
            />
          </div>
        );
      })}
    </div>
  );
});
