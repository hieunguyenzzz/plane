/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mobelaris fork — hook for the view-folder MobX store.
 */

import { useContext } from "react";

import { StoreContext } from "@/lib/store-context";
import type { IViewFolderStore } from "@/plane-web/store/view-folder.store";

export const useViewFolder = (): IViewFolderStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useViewFolder must be used within StoreProvider");
  return context.viewFolder;
};
