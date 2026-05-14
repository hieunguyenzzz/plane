/**
 * Mobelaris fork — Tier A marketing property: campaign (text).
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

export const SpreadsheetMarketingCampaignColumn = observer(function SpreadsheetMarketingCampaignColumn(props: Props) {
  const { issue, onChange, disabled, onClose } = props;
  const [value, setValue] = useState<string>(issue.marketing_campaign ?? "");

  useEffect(() => {
    setValue(issue.marketing_campaign ?? "");
  }, [issue.marketing_campaign]);

  const commit = () => {
    const next = value.trim() === "" ? null : value.trim().slice(0, 120);
    if ((issue.marketing_campaign ?? null) === next) return;
    onChange(
      issue,
      { marketing_campaign: next },
      { changed_property: "marketing_campaign", change_details: next }
    );
  };

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <input
        type="text"
        className="h-full w-full bg-transparent px-page-x text-left text-13 outline-none group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10"
        value={value}
        maxLength={120}
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
