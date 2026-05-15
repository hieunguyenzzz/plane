/**
 * Mobelaris fork — Tier B custom properties: create/edit modal form.
 */

import { useEffect, useState, type FormEvent } from "react";
import { observer } from "mobx-react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button, Input, ModalCore, EModalPosition, EModalWidth } from "@plane/ui";
import { CUSTOM_PROPERTY_TYPES } from "@plane/types";
import type { TCustomProperty, TCustomPropertyOption, TCustomPropertyType } from "@plane/types";
import { useCustomProperty } from "@/hooks/store/use-custom-property";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  property?: TCustomProperty;
};

const requiresOptions = (type: TCustomPropertyType) => type === "single_select" || type === "multi_select";

export const CustomPropertyForm = observer(function CustomPropertyForm({
  isOpen,
  onClose,
  workspaceSlug,
  projectId,
  property,
}: Props) {
  const store = useCustomProperty();
  const { t } = useTranslation();
  const [name, setName] = useState(property?.name ?? "");
  const [type, setType] = useState<TCustomPropertyType>(property?.type ?? "text");
  const [options, setOptions] = useState<{ id?: string; name: string }[]>(
    (property?.options ?? []).map((o) => ({ id: o.id, name: o.name }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(property?.name ?? "");
      setType(property?.type ?? "text");
      setOptions((property?.options ?? []).map((o) => ({ id: o.id, name: o.name })));
      setError(null);
    }
  }, [isOpen, property]);

  const addOption = () => setOptions((prev) => [...prev, { name: "" }]);
  const removeOption = (idx: number) => setOptions((prev) => prev.filter((_, i) => i !== idx));
  const setOptionName = (idx: number, next: string) =>
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, name: next } : o)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (requiresOptions(type) && options.filter((o) => o.name.trim()).length === 0) {
      setError("At least one option is required for select types");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let saved: TCustomProperty;
      if (property) {
        saved = await store.updateProperty(workspaceSlug, projectId, property.id, { name, type });
      } else {
        saved = await store.createProperty(workspaceSlug, projectId, { name, type });
      }

      if (requiresOptions(type)) {
        const existing = property?.options ?? [];
        const cleaned = options.map((o) => ({ ...o, name: o.name.trim() })).filter((o) => o.name);

        // Delete removed options
        for (const ex of existing) {
          if (!cleaned.find((c) => c.id === ex.id)) {
            await store.deleteOption(workspaceSlug, projectId, saved.id, ex.id);
          }
        }
        // Create / update remaining
        let order = 0;
        for (const opt of cleaned) {
          if (opt.id) {
            const original = existing.find((e) => e.id === opt.id);
            if (original && original.name !== opt.name) {
              await store.updateOption(workspaceSlug, projectId, saved.id, opt.id, {
                name: opt.name,
                display_order: order,
              });
            }
          } else {
            await store.createOption(workspaceSlug, projectId, saved.id, {
              name: opt.name,
              display_order: order,
            });
          }
          order += 1;
        }
        await store.fetchProjectProperties(workspaceSlug, projectId);
      }

      onClose();
    } catch (err: any) {
      setError(err?.error ?? err?.detail ?? "Failed to save property");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <h3 className="text-lg font-medium">
          {property ? "Edit custom property" : "New custom property"}
        </h3>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Campaign"
            autoFocus
            className="w-full"
            type="text"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TCustomPropertyType)}
            disabled={!!property}
            className="w-full rounded-md border border-secondary bg-layer-1 px-3 py-2 text-sm disabled:opacity-60"
          >
            {CUSTOM_PROPERTY_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
          {property ? (
            <p className="text-xs text-tertiary">Type cannot be changed after creation.</p>
          ) : null}
        </div>
        {requiresOptions(type) ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Options</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt.name}
                    onChange={(e) => setOptionName(idx, e.target.value)}
                    placeholder="Option name"
                    className="flex-1"
                    type="text"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="text-tertiary hover:text-red-600"
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" /> Add option
              </button>
            </div>
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose} type="button" disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : property ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
