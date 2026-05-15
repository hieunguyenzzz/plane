/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mobelaris fork — single view row in the sidebar tree.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { MoveRight } from "lucide-react";

import { useTranslation } from "@plane/i18n";
import { PhotoFilterIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectView } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";

import { useProjectView } from "@/hooks/store/use-project-view";
import { useViewFolder } from "@/hooks/store/use-view-folder";

type Props = {
  workspaceSlug: string;
  projectId: string;
  view: IProjectView;
  depth?: number;
};

export const ViewLeafItem = observer(function ViewLeafItem(props: Props) {
  const { workspaceSlug, projectId, view, depth = 0 } = props;
  const { t } = useTranslation();
  const pathname = usePathname();
  const params = useParams();
  const { updateView } = useProjectView();
  const { getFoldersByProjectId } = useViewFolder();

  const href = `/${workspaceSlug}/projects/${projectId}/views/${view.id}`;
  const isActive = params?.viewId === view.id || pathname === href;

  const folders = getFoldersByProjectId(projectId);
  // Folders the user can move this view INTO. Exclude its current folder.
  const targetFolders = folders.filter((f) => f.id !== view.folder);

  const handleMove = async (folderId: string | null) => {
    try {
      await updateView(workspaceSlug, projectId, view.id, { folder: folderId });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_move_view_to_folder"),
      });
    }
  };

  // 12px of left padding per nesting level, mirrors favorites tree.
  const indent = depth * 12;

  return (
    <div
      className={cn(
        "group/view-leaf flex items-center justify-between gap-1 rounded-sm pr-2 hover:bg-layer-transparent-hover",
        { "bg-layer-transparent-hover": isActive }
      )}
      style={{ paddingLeft: 8 + indent }}
    >
      <Link
        href={href}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-1"
        aria-current={isActive ? "page" : undefined}
      >
        <PhotoFilterIcon className="size-3.5 flex-shrink-0 stroke-[1.5]" />
        <span className="truncate text-11 font-medium">{view.name}</span>
      </Link>
      <div className="opacity-0 group-hover/view-leaf:opacity-100">
        <CustomMenu placement="bottom-end" ellipsis closeOnSelect>
          {view.folder && (
            <CustomMenu.MenuItem onClick={() => handleMove(null)}>
              <span className="flex items-center gap-2">
                <MoveRight className="size-3" />
                {t("view_folders_move_to_root")}
              </span>
            </CustomMenu.MenuItem>
          )}
          {targetFolders.length > 0 && (
            <>
              <div className="px-2 py-1 text-10 font-semibold text-placeholder uppercase">
                {t("view_folders_move_to")}
              </div>
              {targetFolders.map((folder) => (
                <CustomMenu.MenuItem key={folder.id} onClick={() => handleMove(folder.id)}>
                  {folder.name}
                </CustomMenu.MenuItem>
              ))}
            </>
          )}
          {targetFolders.length === 0 && !view.folder && (
            <CustomMenu.MenuItem disabled>{t("view_folders_no_views")}</CustomMenu.MenuItem>
          )}
        </CustomMenu>
      </div>
    </div>
  );
});
