/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mobelaris fork — collapsible folder row in the views sidebar tree.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Disclosure, Transition } from "@headlessui/react";
import { Pencil, Trash2 } from "lucide-react";

import { VIEW_FOLDER_OPEN_PREFIX } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon, FavoriteFolderIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IViewFolder } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";

import useLocalStorage from "@/hooks/use-local-storage";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useViewFolder } from "@/hooks/store/use-view-folder";

import { NewViewFolder } from "./new-view-folder";
import { ViewLeafItem } from "./view-leaf-item";

type Props = {
  workspaceSlug: string;
  projectId: string;
  folder: IViewFolder;
};

export const ViewFolderRow = observer(function ViewFolderRow(props: Props) {
  const { workspaceSlug, projectId, folder } = props;
  const { t } = useTranslation();

  const { getViewsByFolder } = useProjectView();
  const { deleteFolder } = useViewFolder();

  const [renaming, setRenaming] = useState(false);

  // Per-folder collapse state — persists across reloads.
  const { storedValue, setValue } = useLocalStorage<boolean>(`${VIEW_FOLDER_OPEN_PREFIX}${folder.id}`, false);
  const isOpen = !!storedValue;

  const childViews = getViewsByFolder(projectId, folder.id);

  const handleDelete = async () => {
    if (typeof window !== "undefined" && !window.confirm(t("view_folders_delete_confirm"))) return;
    try {
      await deleteFolder(workspaceSlug, projectId, folder.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("view_folder_deleted_successfully"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_delete_view_folder"),
      });
    }
  };

  if (renaming) {
    return (
      <NewViewFolder
        actionType="rename"
        projectId={projectId}
        folderId={folder.id}
        defaultName={folder.name}
        onClose={() => setRenaming(false)}
      />
    );
  }

  return (
    <Disclosure as="div" defaultOpen={isOpen}>
      <div
        className={cn(
          "group/view-folder flex w-full items-center justify-between rounded-sm pr-2 hover:bg-layer-transparent-hover"
        )}
      >
        <Disclosure.Button
          as="button"
          type="button"
          onClick={() => setValue(!isOpen)}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1 pl-2 text-left"
          aria-label={folder.name}
        >
          <ChevronRightIcon className={cn("size-3 flex-shrink-0 transition-transform", { "rotate-90": isOpen })} />
          <FavoriteFolderIcon className="size-3.5 flex-shrink-0" />
          <span className="truncate text-11 font-medium">{folder.name}</span>
          {childViews.length > 0 && <span className="text-10 text-placeholder">{childViews.length}</span>}
        </Disclosure.Button>
        <div className="opacity-0 group-hover/view-folder:opacity-100">
          <CustomMenu placement="bottom-end" ellipsis closeOnSelect>
            <CustomMenu.MenuItem onClick={() => setRenaming(true)}>
              <span className="flex items-center gap-2">
                <Pencil className="size-3" />
                {t("view_folders_rename")}
              </span>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={handleDelete}>
              <span className="text-red-500 flex items-center gap-2">
                <Trash2 className="size-3" />
                {t("view_folders_delete")}
              </span>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
      <Transition
        show={isOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isOpen && (
          <Disclosure.Panel as="div" className="mt-0.5 flex flex-col gap-0.5" static>
            {childViews.length === 0 ? (
              <span className="px-8 py-1 text-10 text-placeholder">{t("view_folders_empty")}</span>
            ) : (
              childViews.map((view) => (
                <ViewLeafItem key={view.id} workspaceSlug={workspaceSlug} projectId={projectId} view={view} depth={1} />
              ))
            )}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
