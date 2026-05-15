/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mobelaris fork — MobX store for project-scoped view folders.
 * Mirrors ProjectViewStore shape so the sidebar tree can lean on the same
 * patterns (observable map, computedFn lookups, optimistic updates).
 */

import { set, unset } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";

import type { IViewFolder } from "@plane/types";

import { ViewFolderService } from "@/services/view-folder.service";

import type { CoreRootStore } from "./root.store";

export interface IViewFolderStore {
  loader: boolean;
  folderMap: Record<string, IViewFolder>;
  fetchedMap: Record<string, boolean>;
  // computed actions
  getFoldersByProjectId: (projectId: string) => IViewFolder[];
  getFolderById: (folderId: string) => IViewFolder | undefined;
  // fetch
  fetchFolders: (workspaceSlug: string, projectId: string) => Promise<IViewFolder[] | undefined>;
  // CRUD
  createFolder: (workspaceSlug: string, projectId: string, data: Partial<IViewFolder>) => Promise<IViewFolder>;
  updateFolder: (
    workspaceSlug: string,
    projectId: string,
    folderId: string,
    data: Partial<IViewFolder>
  ) => Promise<IViewFolder>;
  deleteFolder: (workspaceSlug: string, projectId: string, folderId: string) => Promise<void>;
}

export class ViewFolderStore implements IViewFolderStore {
  loader: boolean = false;
  folderMap: Record<string, IViewFolder> = {};
  fetchedMap: Record<string, boolean> = {};
  rootStore: CoreRootStore;
  service: ViewFolderService;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      folderMap: observable,
      fetchedMap: observable,
      // actions
      fetchFolders: action,
      createFolder: action,
      updateFolder: action,
      deleteFolder: action,
    });
    this.rootStore = rootStore;
    this.service = new ViewFolderService();
  }

  getFoldersByProjectId = computedFn((projectId: string): IViewFolder[] => {
    if (!this.fetchedMap[projectId]) return [];
    const folders = Object.values(this.folderMap).filter((f) => f?.project === projectId);
    return folders.toSorted((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
  });

  getFolderById = computedFn((folderId: string): IViewFolder | undefined => this.folderMap[folderId]);

  fetchFolders = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      const response = await this.service.getViewFolders(workspaceSlug, projectId);
      runInAction(() => {
        response.forEach((folder) => set(this.folderMap, [folder.id], folder));
        set(this.fetchedMap, projectId, true);
        this.loader = false;
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch view folders", error);
      this.loader = false;
      return undefined;
    }
  };

  createFolder = async (workspaceSlug: string, projectId: string, data: Partial<IViewFolder>) => {
    const response = await this.service.createViewFolder(workspaceSlug, projectId, data);
    runInAction(() => {
      set(this.folderMap, [response.id], response);
    });
    return response;
  };

  updateFolder = async (workspaceSlug: string, projectId: string, folderId: string, data: Partial<IViewFolder>) => {
    const current = this.folderMap[folderId];
    // optimistic update
    runInAction(() => {
      set(this.folderMap, [folderId], { ...current, ...data });
    });
    try {
      const response = await this.service.patchViewFolder(workspaceSlug, projectId, folderId, data);
      runInAction(() => {
        set(this.folderMap, [folderId], response);
      });
      return response;
    } catch (error) {
      // rollback
      runInAction(() => {
        set(this.folderMap, [folderId], current);
      });
      throw error;
    }
  };

  deleteFolder = async (workspaceSlug: string, projectId: string, folderId: string) => {
    await this.service.deleteViewFolder(workspaceSlug, projectId, folderId);
    runInAction(() => {
      unset(this.folderMap, [folderId]);
      // Demote any views that referenced this folder (server already SET_NULL'd, mirror locally).
      Object.values(this.rootStore.projectView.viewMap).forEach((view) => {
        if (view?.folder === folderId) {
          set(this.rootStore.projectView.viewMap, [view.id, "folder"], null);
        }
      });
    });
  };
}
