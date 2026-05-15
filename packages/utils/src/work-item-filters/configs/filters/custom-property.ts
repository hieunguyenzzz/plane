// Mobelaris fork — Tier B custom property filter config builder.

import type {
  IUserLite,
  TCustomProperty,
  TCustomPropertyOption,
  TFilterProperty,
  TSupportedOperators,
} from "@plane/types";
import { COLLECTION_OPERATOR, EQUALITY_OPERATOR } from "@plane/types";

import type { IFilterIconConfig, TCreateFilterConfig, TCreateFilterConfigParams } from "../../../rich-filters";
import {
  createFilterConfig,
  createOperatorConfigEntry,
  getDatePickerConfig,
  getMemberMultiSelectConfig,
  getMultiSelectConfig,
  getSingleSelectConfig,
} from "../../../rich-filters";

/**
 * Returns whether a custom property type can be surfaced as a filter
 * dropdown entry. Unsupported types remain editable in the sidebar and
 * usable for sort/group — they just don't appear in the filter picker.
 */
export const isCustomPropertyFilterSupported = (type: TCustomProperty["type"]): boolean =>
  type === "single_select" || type === "multi_select" || type === "person" || type === "date" || type === "checkbox";

// ---------- single_select / multi_select ----------

export type TCreateCustomPropertyOptionFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<TCustomPropertyOption> & {
    propertyDisplayName: string;
    options: TCustomPropertyOption[];
  };

export const getCustomPropertyOptionFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateCustomPropertyOptionFilterParams> =>
  (params: TCreateCustomPropertyOptionFilterParams) =>
    createFilterConfig<P>({
      id: key,
      ...params,
      label: params.propertyDisplayName,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(COLLECTION_OPERATOR.IN, params, (updatedParams) =>
          getMultiSelectConfig<TCustomPropertyOption, string, TCustomPropertyOption>(
            {
              items: params.options,
              getId: (option) => option.id,
              getLabel: (option) => option.name,
              getValue: (option) => option.id,
              getIconData: (option) => option,
            },
            {
              singleValueOperator: EQUALITY_OPERATOR.EXACT as TSupportedOperators,
              ...updatedParams,
            },
            {
              getOptionIcon: params.getOptionIcon,
            }
          )
        ),
      ]),
    });

// ---------- person ----------

export type TCreateCustomPropertyMemberFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<IUserLite> & {
    propertyDisplayName: string;
    members: IUserLite[];
  };

export const getCustomPropertyMemberFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateCustomPropertyMemberFilterParams> =>
  (params: TCreateCustomPropertyMemberFilterParams) =>
    createFilterConfig<P>({
      id: key,
      ...params,
      label: params.propertyDisplayName,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, params, (updatedParams) =>
          getMemberMultiSelectConfig(
            {
              ...updatedParams,
              members: params.members,
            },
            EQUALITY_OPERATOR.EXACT
          )
        ),
      ]),
    });

// ---------- date ----------

export type TCreateCustomPropertyDateFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<Date> & {
    propertyDisplayName: string;
  };

export const getCustomPropertyDateFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateCustomPropertyDateFilterParams> =>
  (params: TCreateCustomPropertyDateFilterParams) =>
    createFilterConfig<P>({
      id: key,
      ...params,
      label: params.propertyDisplayName,
      icon: params.filterIcon,
      allowMultipleFilters: true,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, params, (updatedParams) =>
          getDatePickerConfig(updatedParams)
        ),
      ]),
    });

// ---------- checkbox ----------

export type TCreateCustomPropertyCheckboxFilterParams = TCreateFilterConfigParams &
  IFilterIconConfig<string> & {
    propertyDisplayName: string;
  };

const BOOLEAN_ITEMS = [
  { id: "true", label: "True", value: "true" },
  { id: "false", label: "False", value: "false" },
];

export const getCustomPropertyCheckboxFilterConfig =
  <P extends TFilterProperty>(key: P): TCreateFilterConfig<P, TCreateCustomPropertyCheckboxFilterParams> =>
  (params: TCreateCustomPropertyCheckboxFilterParams) =>
    createFilterConfig<P>({
      id: key,
      ...params,
      label: params.propertyDisplayName,
      icon: params.filterIcon,
      supportedOperatorConfigsMap: new Map([
        createOperatorConfigEntry(EQUALITY_OPERATOR.EXACT, params, (updatedParams) =>
          getSingleSelectConfig<{ id: string; label: string; value: string }, string>(
            {
              items: BOOLEAN_ITEMS,
              getId: (item) => item.id,
              getLabel: (item) => item.label,
              getValue: (item) => item.value,
            },
            { ...updatedParams }
          )
        ),
      ]),
    });
