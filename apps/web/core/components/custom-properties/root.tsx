/**
 * Mobelaris fork — Tier B custom properties: settings admin root.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { AlertModalCore, Button } from "@plane/ui";
import type { TCustomProperty } from "@plane/types";
import { useCustomProperty } from "@/hooks/store/use-custom-property";
import { CustomPropertyForm } from "./property-form";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const TYPE_LABEL: Record<string, string> = {
  text: "Text",
  number: "Number",
  currency: "Currency",
  rating: "Rating",
  single_select: "Single select",
  multi_select: "Multi select",
  date: "Date",
  checkbox: "Checkbox",
  person: "Person",
  url: "URL",
  email: "Email",
};

export const CustomPropertiesRoot = observer(function CustomPropertiesRoot({ workspaceSlug, projectId }: Props) {
  const store = useCustomProperty();
  const { t } = useTranslation();
  const properties = store.getProjectProperties(projectId);
  const loading = !!store.loadingProject[projectId];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TCustomProperty | undefined>(undefined);
  const [deleting, setDeleting] = useState<TCustomProperty | undefined>(undefined);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    if (workspaceSlug && projectId) {
      store.fetchProjectProperties(workspaceSlug, projectId).catch(() => undefined);
    }
  }, [workspaceSlug, projectId, store]);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (p: TCustomProperty) => {
    setEditing(p);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteSubmitting(true);
    try {
      await store.deleteProperty(workspaceSlug, projectId, deleting.id);
      setDeleting(undefined);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-tertiary">
          {t("custom_properties_description", {
            defaultValue: "Define your own properties per project.",
          })}
        </p>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("custom_properties_add", { defaultValue: "Add property" })}
        </Button>
      </div>

      <div className="rounded-md border border-secondary">
        {loading && !properties ? (
          <div className="p-6 text-center text-sm text-tertiary">Loading…</div>
        ) : !properties || properties.length === 0 ? (
          <div className="p-6 text-center text-sm text-tertiary">
            {t("custom_properties_empty", {
              defaultValue: "No custom properties yet. Create one to track extra data on work items.",
            })}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-tertiary">
              <tr className="border-b border-secondary">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Options</th>
                <th className="px-4 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t border-secondary">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-tertiary">{TYPE_LABEL[p.type] ?? p.type}</td>
                  <td className="px-4 py-2 text-tertiary">
                    {p.type === "single_select" || p.type === "multi_select"
                      ? (p.options ?? []).map((o) => o.name).join(", ") || "—"
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-tertiary hover:text-primary" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
                        className="text-tertiary hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CustomPropertyForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        property={editing}
      />

      <AlertModalCore
        isOpen={!!deleting}
        handleClose={() => setDeleting(undefined)}
        handleSubmit={confirmDelete}
        isSubmitting={deleteSubmitting}
        title="Delete custom property"
        content={
          <span>
            Are you sure you want to delete <strong>{deleting?.name}</strong>? All values on work items will be removed.
            This cannot be undone.
          </span>
        }
        primaryButtonText={{ loading: "Deleting…", default: "Delete" }}
        secondaryButtonText="Cancel"
        variant="danger"
      />
    </div>
  );
});
