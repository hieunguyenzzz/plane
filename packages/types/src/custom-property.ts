/**
 * Mobelaris fork — Tier B custom properties.
 * User-definable, project-scoped properties.
 */

export type TCustomPropertyType =
  | "text"
  | "number"
  | "currency"
  | "rating"
  | "single_select"
  | "multi_select"
  | "date"
  | "checkbox"
  | "person"
  | "url"
  | "email";

export type TCustomPropertyOption = {
  id: string;
  property: string;
  name: string;
  color?: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

export type TCustomProperty = {
  id: string;
  project: string;
  workspace: string;
  name: string;
  type: TCustomPropertyType;
  display_order: number;
  is_active: boolean;
  config?: Record<string, unknown>;
  options: TCustomPropertyOption[];
  created_at?: string;
  updated_at?: string;
};

// Wire-format value primitive.
export type TCustomPropertyValuePrimitive =
  | string
  | string[]
  | number
  | boolean
  | null;

// Map from property id -> wire value
export type TCustomPropertiesMap = Record<string, TCustomPropertyValuePrimitive>;

export type TCustomPropertyValueResponse = {
  id: string;
  issue: string;
  property: string;
  property_type: TCustomPropertyType;
  value: TCustomPropertyValuePrimitive;
  created_at?: string;
  updated_at?: string;
};

export const CUSTOM_PROPERTY_TYPES: { type: TCustomPropertyType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "number", label: "Number" },
  { type: "currency", label: "Currency" },
  { type: "rating", label: "Rating" },
  { type: "single_select", label: "Single select" },
  { type: "multi_select", label: "Multi select" },
  { type: "date", label: "Date" },
  { type: "checkbox", label: "Checkbox" },
  { type: "person", label: "Person" },
  { type: "url", label: "URL" },
  { type: "email", label: "Email" },
];
