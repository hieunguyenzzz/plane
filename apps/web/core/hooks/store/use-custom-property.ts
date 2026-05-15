/**
 * Mobelaris fork — Tier B custom properties hook.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { ICustomPropertyStore } from "@/store/custom-property";

export const useCustomProperty = (): ICustomPropertyStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCustomProperty must be used within StoreProvider");
  return context.customProperty;
};
