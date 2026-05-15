/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mobelaris fork — CRUD for project-scoped view folders.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IViewFolder } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ViewFolderService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getViewFolders(workspaceSlug: string, projectId: string): Promise<IViewFolder[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/view-folders/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createViewFolder(workspaceSlug: string, projectId: string, data: Partial<IViewFolder>): Promise<IViewFolder> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/view-folders/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchViewFolder(
    workspaceSlug: string,
    projectId: string,
    folderId: string,
    data: Partial<IViewFolder>
  ): Promise<IViewFolder> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/view-folders/${folderId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteViewFolder(workspaceSlug: string, projectId: string, folderId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/view-folders/${folderId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
