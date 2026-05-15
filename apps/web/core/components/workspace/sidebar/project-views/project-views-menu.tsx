/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mobelaris fork — expandable Views menu in the project sidebar.
 * Replaces the flat "Views" link with a collapsible tree of folders + views.
 * Mirrors the SidebarFavoritesMenu UX so the styling is consistent.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Disclosure, Transition } from "@headlessui/react";
import { FolderPlus } from "lucide-react";

import { IS_VIEWS_MENU_OPEN } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon, ViewsIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
import useLocalStorage from "@/hooks/use-local-storage";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useViewFolder } from "@/hooks/store/use-view-folder";

import { NewViewFolder } from "./new-view-folder";
import { ViewFolderRow } from "./view-folder-row";
import { ViewLeafItem } from "./view-leaf-item";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectViewsMenu = observer(function ProjectViewsMenu(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const pathname = usePathname();
  const params = useParams();
  const [creatingFolder, setCreatingFolder] = useState(false);

  const { storedValue, setValue } = useLocalStorage<boolean>(IS_VIEWS_MENU_OPEN, false);
  const isMenuOpen = !!storedValue;

  const { fetchViews, getViewsByFolder } = useProjectView();
  const { fetchFolders, getFoldersByProjectId } = useViewFolder();

  // Fetch on mount per project. The stores guard against duplicate fetches via fetchedMap.
  useEffect(() => {
    fetchViews(workspaceSlug, projectId);
    fetchFolders(workspaceSlug, projectId);
  }, [workspaceSlug, projectId, fetchViews, fetchFolders]);

  const folders = getFoldersByProjectId(projectId);
  const rootViews = getViewsByFolder(projectId, null);

  const viewsHref = `/${workspaceSlug}/projects/${projectId}/views`;
  // Active if user is on /views or any /views/<id> child route. The leaf items use
  // their own active styling, so we mark the parent active only for the index page.
  const isParentActive = pathname === viewsHref && !params?.viewId;

  return (
    <Disclosure as="div" defaultOpen={isMenuOpen}>
      <div className="group/views-button flex w-full items-center justify-between rounded-sm hover:bg-layer-transparent-hover">
        <Link href={viewsHref} className="flex min-w-0 flex-1 items-center" aria-label={t("sidebar.views")}>
          <SidebarNavItem isActive={isParentActive}>
            <div className="flex w-full items-center gap-1.5 py-[1px]">
              <ViewsIcon className="size-4 flex-shrink-0 stroke-[1.5]" />
              <span className="text-11 font-medium">{t("sidebar.views")}</span>
            </div>
          </SidebarNavItem>
        </Link>
        <div className="pointer-events-none flex items-center opacity-0 group-hover/views-button:pointer-events-auto group-hover/views-button:opacity-100">
          <Tooltip tooltipHeading={t("view_folders_create")} tooltipContent="">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setCreatingFolder(true);
                if (!isMenuOpen) setValue(true);
              }}
              aria-label={t("view_folders_create")}
              icon={FolderPlus}
            />
          </Tooltip>
          <Disclosure.Button
            as="button"
            type="button"
            className="grid flex-shrink-0 place-items-center rounded-sm p-0.5 hover:bg-layer-transparent-hover"
            onClick={() => setValue(!isMenuOpen)}
            aria-label={t(
              isMenuOpen
                ? "aria_labels.projects_sidebar.close_views_menu"
                : "aria_labels.projects_sidebar.open_views_menu"
            )}
          >
            <ChevronRightIcon
              className={cn("size-3 flex-shrink-0 transition-transform", {
                "rotate-90": isMenuOpen,
              })}
            />
          </Disclosure.Button>
        </div>
      </div>
      <Transition
        show={isMenuOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isMenuOpen && (
          <Disclosure.Panel as="div" className="mt-0.5 flex flex-col gap-0.5" static>
            {creatingFolder && (
              <NewViewFolder actionType="create" projectId={projectId} onClose={() => setCreatingFolder(false)} />
            )}
            {folders.length === 0 && rootViews.length === 0 && !creatingFolder ? (
              <span className="px-8 py-1.5 text-11 font-medium text-placeholder">{t("view_folders_no_views")}</span>
            ) : (
              <>
                {folders.map((folder) => (
                  <ViewFolderRow key={folder.id} workspaceSlug={workspaceSlug} projectId={projectId} folder={folder} />
                ))}
                {rootViews.map((view) => (
                  <ViewLeafItem key={view.id} workspaceSlug={workspaceSlug} projectId={projectId} view={view} />
                ))}
              </>
            )}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
