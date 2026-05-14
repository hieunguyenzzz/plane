/**
 * Mobelaris fork — Tier A marketing property: budget in GBP (decimal).
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// types
import type { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

const formatGBP = (raw: string | number | null | undefined): string => {
  if (raw === null || raw === undefined || raw === "") return "";
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  if (Number.isNaN(n)) return "";
  return n.toFixed(2);
};

// Allowed up to 10 digits incl. 2 decimal places => max value 99,999,999.99.
const MAX_VALUE = 99_999_999.99;

export const SpreadsheetMarketingBudgetColumn = observer(function SpreadsheetMarketingBudgetColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  const [value, setValue] = useState<string>(formatGBP(issue.marketing_budget_gbp ?? null));

  useEffect(() => {
    setValue(formatGBP(issue.marketing_budget_gbp ?? null));
  }, [issue.marketing_budget_gbp]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed === "") {
      if ((issue.marketing_budget_gbp ?? null) !== null) {
        onChange(
          issue,
          { marketing_budget_gbp: null },
          { changed_property: "marketing_budget_gbp", change_details: null }
        );
      }
      return;
    }
    const parsed = parseFloat(trimmed);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > MAX_VALUE) {
      // Reset display to current model value on invalid input.
      setValue(formatGBP(issue.marketing_budget_gbp ?? null));
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
    onChange(
      issue,
      { marketing_budget_gbp: rounded.toFixed(2) },
      { changed_property: "marketing_budget_gbp", change_details: rounded }
    );
  };

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <input
        type="number"
        step="0.01"
        min="0"
        max={MAX_VALUE}
        className="h-full w-full bg-transparent px-page-x text-left text-13 outline-none group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10"
        value={value}
        disabled={disabled}
        placeholder="—"
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          commit();
          onClose();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
});
