/**
 * Mobelaris fork — Tier A marketing property: channel (enum).
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from "react";
import { observer } from "mobx-react";
// types
import type { TIssue, TMarketingChannel } from "@plane/types";
// constants
import { MARKETING_CHANNEL_OPTIONS } from "@plane/constants";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetMarketingChannelColumn = observer(function SpreadsheetMarketingChannelColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  const current = issue.marketing_channel ?? "";

  const handleChange = (next: string) => {
    const value = next === "" ? null : (next as TMarketingChannel);
    if ((issue.marketing_channel ?? null) === value) return;
    onChange(
      issue,
      { marketing_channel: value },
      { changed_property: "marketing_channel", change_details: value }
    );
  };

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <select
        className="h-full w-full bg-transparent px-page-x text-left text-13 outline-none group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10"
        value={current}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={onClose}
      >
        <option value="">—</option>
        {MARKETING_CHANNEL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});
