/**
 * Mobelaris fork — Tier B custom properties MobX store.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";

import type {
  TCustomProperty,
  TCustomPropertyOption,
  TCustomPropertyValuePrimitive,
  TCustomPropertyValueResponse,
} from "@plane/types";
import { CustomPropertyService } from "@/services/project/custom-property.service";
import type { RootStore } from "@/plane-web/store/root.store";

export interface ICustomPropertyStore {
  propertiesByProject: Record<string, TCustomProperty[]>;
  valuesByIssue: Record<string, TCustomPropertyValueResponse[]>;
  loadingProject: Record<string, boolean>;
  loadingIssue: Record<string, boolean>;

  getProjectProperties: (projectId: string | null | undefined) => TCustomProperty[] | undefined;
  getIssueValues: (issueId: string | null | undefined) => TCustomPropertyValueResponse[] | undefined;
  getIssueValueByProperty: (
    issueId: string | null | undefined,
    propertyId: string | null | undefined
  ) => TCustomPropertyValueResponse | undefined;

  fetchProjectProperties: (workspaceSlug: string, projectId: string) => Promise<TCustomProperty[]>;
  createProperty: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TCustomProperty>
  ) => Promise<TCustomProperty>;
  updateProperty: (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<TCustomProperty>
  ) => Promise<TCustomProperty>;
  deleteProperty: (workspaceSlug: string, projectId: string, propertyId: string) => Promise<void>;

  createOption: (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<TCustomPropertyOption>
  ) => Promise<TCustomPropertyOption>;
  updateOption: (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string,
    data: Partial<TCustomPropertyOption>
  ) => Promise<TCustomPropertyOption>;
  deleteOption: (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string
  ) => Promise<void>;

  fetchIssueValues: (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ) => Promise<TCustomPropertyValueResponse[]>;
  upsertIssueValue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    value: TCustomPropertyValuePrimitive
  ) => Promise<TCustomPropertyValueResponse>;
  clearIssueValue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string
  ) => Promise<void>;
}

export class CustomPropertyStore implements ICustomPropertyStore {
  propertiesByProject: Record<string, TCustomProperty[]> = {};
  valuesByIssue: Record<string, TCustomPropertyValueResponse[]> = {};
  loadingProject: Record<string, boolean> = {};
  loadingIssue: Record<string, boolean> = {};
  rootStore: RootStore;
  service: CustomPropertyService;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      propertiesByProject: observable,
      valuesByIssue: observable,
      loadingProject: observable,
      loadingIssue: observable,
      fetchProjectProperties: action,
      createProperty: action,
      updateProperty: action,
      deleteProperty: action,
      createOption: action,
      updateOption: action,
      deleteOption: action,
      fetchIssueValues: action,
      upsertIssueValue: action,
      clearIssueValue: action,
    });
    this.rootStore = rootStore;
    this.service = new CustomPropertyService();
  }

  getProjectProperties = computedFn((projectId: string | null | undefined) => {
    if (!projectId) return undefined;
    return this.propertiesByProject[projectId];
  });

  getIssueValues = computedFn((issueId: string | null | undefined) => {
    if (!issueId) return undefined;
    return this.valuesByIssue[issueId];
  });

  getIssueValueByProperty = computedFn(
    (issueId: string | null | undefined, propertyId: string | null | undefined) => {
      if (!issueId || !propertyId) return undefined;
      return (this.valuesByIssue[issueId] ?? []).find((v) => v.property === propertyId);
    }
  );

  fetchProjectProperties = async (workspaceSlug: string, projectId: string) => {
    runInAction(() => {
      this.loadingProject[projectId] = true;
    });
    try {
      const list = await this.service.list(workspaceSlug, projectId);
      runInAction(() => {
        this.propertiesByProject[projectId] = list;
      });
      return list;
    } finally {
      runInAction(() => {
        this.loadingProject[projectId] = false;
      });
    }
  };

  createProperty = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TCustomProperty>
  ) => {
    const created = await this.service.create(workspaceSlug, projectId, data);
    runInAction(() => {
      const list = this.propertiesByProject[projectId] ?? [];
      this.propertiesByProject[projectId] = [...list, created];
    });
    return created;
  };

  updateProperty = async (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<TCustomProperty>
  ) => {
    const updated = await this.service.update(workspaceSlug, projectId, propertyId, data);
    runInAction(() => {
      const list = this.propertiesByProject[projectId] ?? [];
      this.propertiesByProject[projectId] = list.map((p) => (p.id === propertyId ? updated : p));
    });
    return updated;
  };

  deleteProperty = async (workspaceSlug: string, projectId: string, propertyId: string) => {
    await this.service.destroy(workspaceSlug, projectId, propertyId);
    runInAction(() => {
      const list = this.propertiesByProject[projectId] ?? [];
      this.propertiesByProject[projectId] = list.filter((p) => p.id !== propertyId);
    });
  };

  private _updatePropertyOptions(
    projectId: string,
    propertyId: string,
    updater: (options: TCustomPropertyOption[]) => TCustomPropertyOption[]
  ) {
    runInAction(() => {
      const list = this.propertiesByProject[projectId] ?? [];
      this.propertiesByProject[projectId] = list.map((p) =>
        p.id === propertyId ? { ...p, options: updater(p.options ?? []) } : p
      );
    });
  }

  createOption = async (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    data: Partial<TCustomPropertyOption>
  ) => {
    const created = await this.service.createOption(workspaceSlug, projectId, propertyId, data);
    this._updatePropertyOptions(projectId, propertyId, (opts) => [...opts, created]);
    return created;
  };

  updateOption = async (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string,
    data: Partial<TCustomPropertyOption>
  ) => {
    const updated = await this.service.updateOption(workspaceSlug, projectId, propertyId, optionId, data);
    this._updatePropertyOptions(projectId, propertyId, (opts) =>
      opts.map((o) => (o.id === optionId ? updated : o))
    );
    return updated;
  };

  deleteOption = async (
    workspaceSlug: string,
    projectId: string,
    propertyId: string,
    optionId: string
  ) => {
    await this.service.destroyOption(workspaceSlug, projectId, propertyId, optionId);
    this._updatePropertyOptions(projectId, propertyId, (opts) => opts.filter((o) => o.id !== optionId));
  };

  fetchIssueValues = async (workspaceSlug: string, projectId: string, issueId: string) => {
    runInAction(() => {
      this.loadingIssue[issueId] = true;
    });
    try {
      const values = await this.service.listValues(workspaceSlug, projectId, issueId);
      runInAction(() => {
        this.valuesByIssue[issueId] = values;
      });
      return values;
    } finally {
      runInAction(() => {
        this.loadingIssue[issueId] = false;
      });
    }
  };

  upsertIssueValue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    value: TCustomPropertyValuePrimitive
  ) => {
    const updated = await this.service.upsertValue(workspaceSlug, projectId, issueId, propertyId, value);
    runInAction(() => {
      const list = this.valuesByIssue[issueId] ?? [];
      const exists = list.some((v) => v.property === propertyId);
      this.valuesByIssue[issueId] = exists
        ? list.map((v) => (v.property === propertyId ? updated : v))
        : [...list, updated];
    });
    return updated;
  };

  clearIssueValue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    propertyId: string
  ) => {
    await this.service.clearValue(workspaceSlug, projectId, issueId, propertyId);
    runInAction(() => {
      const list = this.valuesByIssue[issueId] ?? [];
      this.valuesByIssue[issueId] = list.filter((v) => v.property !== propertyId);
    });
  };
}
