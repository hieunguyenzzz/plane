/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mobelaris fork — inline input for creating or renaming a view folder.
 */

import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";

import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { FavoriteFolderIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input } from "@plane/ui";

import { useViewFolder } from "@/hooks/store/use-view-folder";

type TForm = { name: string };

type TProps = {
  projectId: string;
  actionType: "create" | "rename";
  folderId?: string;
  defaultName?: string;
  onClose: () => void;
};

export const NewViewFolder = observer(function NewViewFolder(props: TProps) {
  const { projectId, actionType, folderId, defaultName, onClose } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { createFolder, updateFolder, getFoldersByProjectId } = useViewFolder();

  const ref = useRef<HTMLDivElement>(null);
  const { handleSubmit, control, setFocus } = useForm<TForm>({
    reValidateMode: "onChange",
    defaultValues: { name: defaultName ?? "" },
  });

  const existingNames = new Set(
    getFoldersByProjectId(projectId)
      .filter((f) => f.id !== folderId)
      .map((f) => f.name.toLowerCase())
  );

  const handleCreate: SubmitHandler<TForm> = async (formData) => {
    const trimmed = (formData.name ?? "").trim();
    if (!trimmed) {
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("folder_name_cannot_be_empty"),
      });
    }
    if (existingNames.has(trimmed.toLowerCase())) {
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("folder_already_exists"),
      });
    }
    try {
      await createFolder(workspaceSlug!.toString(), projectId, { name: trimmed });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("view_folder_created_successfully"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_create_view_folder"),
      });
    }
    onClose();
  };

  const handleRename: SubmitHandler<TForm> = async (formData) => {
    if (!folderId) return;
    const trimmed = (formData.name ?? "").trim();
    if (!trimmed) {
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("folder_name_cannot_be_empty"),
      });
    }
    if (existingNames.has(trimmed.toLowerCase())) {
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("folder_already_exists"),
      });
    }
    try {
      await updateFolder(workspaceSlug!.toString(), projectId, folderId, { name: trimmed });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("view_folder_renamed_successfully"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_rename_view_folder"),
      });
    }
    onClose();
  };

  useEffect(() => {
    setFocus("name");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useOutsideClickDetector(ref, () => onClose());

  return (
    <div className="flex items-center gap-1.5 px-2 py-[1px]" ref={ref}>
      <FavoriteFolderIcon className="size-4" />
      <form className="flex-1" onSubmit={handleSubmit(actionType === "create" ? handleCreate : handleRename)}>
        <Controller
          name="name"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              className="w-full"
              placeholder={t("view_folder_name_placeholder")}
              aria-label={t("view_folder_name_placeholder")}
              {...field}
            />
          )}
        />
      </form>
    </div>
  );
});
