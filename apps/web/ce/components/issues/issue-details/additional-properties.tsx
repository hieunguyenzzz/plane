/**
 * Mobelaris fork — Tier A: sidebar editors for marketing properties.
 * The original CE stub returned an empty fragment. We hook into the same seam
 * to render three property editors when the project has the toggle on.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue, TMarketingChannel } from "@plane/types";
// constants
import { MARKETING_CHANNEL_OPTIONS } from "@plane/constants";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

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

export const WorkItemAdditionalSidebarProperties = observer(function WorkItemAdditionalSidebarProperties(
  props: TWorkItemAdditionalSidebarProperties
) {
  const { workItemId, projectId, workspaceSlug, isEditable } = props;
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
    updateIssue,
  } = useIssueDetail();

  const project = getProjectById(projectId);
  const issue = getIssueById(workItemId) as TIssue | undefined;

  if (!project?.marketing_properties_enabled || !issue) return null;

  const submit = (data: Partial<TIssue>) => {
    void updateIssue(workspaceSlug, projectId, workItemId, data);
  };

  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-subtle pt-3">
      <div className="text-xs font-medium text-tertiary uppercase">Marketing</div>

      {/* Campaign */}
      <div className={rowClass}>
        <div className={labelClass}>Campaign</div>
        <input
          type="text"
          maxLength={120}
          className={inputClass}
          disabled={!isEditable}
          defaultValue={issue.marketing_campaign ?? ""}
          placeholder="—"
          onBlur={(e) => {
            const next = e.target.value.trim() === "" ? null : e.target.value.trim().slice(0, 120);
            if ((issue.marketing_campaign ?? null) === next) return;
            submit({ marketing_campaign: next });
          }}
        />
      </div>

      {/* Channel */}
      <div className={rowClass}>
        <div className={labelClass}>Channel</div>
        <select
          className={inputClass}
          disabled={!isEditable}
          value={issue.marketing_channel ?? ""}
          onChange={(e) => {
            const value = e.target.value === "" ? null : (e.target.value as TMarketingChannel);
            if ((issue.marketing_channel ?? null) === value) return;
            submit({ marketing_channel: value });
          }}
        >
          <option value="">—</option>
          {MARKETING_CHANNEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Budget */}
      <div className={rowClass}>
        <div className={labelClass}>Budget (GBP)</div>
        <input
          type="number"
          step="0.01"
          min="0"
          max="99999999.99"
          className={inputClass}
          disabled={!isEditable}
          defaultValue={
            issue.marketing_budget_gbp === null || issue.marketing_budget_gbp === undefined
              ? ""
              : String(issue.marketing_budget_gbp)
          }
          placeholder="—"
          onBlur={(e) => {
            const raw = e.target.value.trim();
            if (raw === "") {
              if ((issue.marketing_budget_gbp ?? null) !== null) submit({ marketing_budget_gbp: null });
              return;
            }
            const parsed = parseFloat(raw);
            if (Number.isNaN(parsed) || parsed < 0 || parsed > 99999999.99) {
              e.target.value =
                issue.marketing_budget_gbp === null || issue.marketing_budget_gbp === undefined
                  ? ""
                  : String(issue.marketing_budget_gbp);
              return;
            }
            const rounded = Math.round(parsed * 100) / 100;
            const currentNum =
              issue.marketing_budget_gbp === null || issue.marketing_budget_gbp === undefined
                ? null
                : typeof issue.marketing_budget_gbp === "string"
                  ? parseFloat(issue.marketing_budget_gbp)
                  : issue.marketing_budget_gbp;
            if (currentNum === rounded) return;
            submit({ marketing_budget_gbp: rounded.toFixed(2) });
          }}
        />
      </div>
    </div>
  );
});
