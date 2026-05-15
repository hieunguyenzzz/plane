/**
 * Mobelaris fork — Tier B custom properties service.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TCustomProperty,
  TCustomPropertyOption,
  TCustomPropertyValuePrimitive,
  TCustomPropertyValueResponse,
} from "@plane/types";
import { APIService } from "@/services/api.service";

export class CustomPropertyService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private base(slug: string, projectId: string) {
    return `/api/workspaces/${slug}/projects/${projectId}/custom-properties`;
  }

  async list(slug: string, projectId: string): Promise<TCustomProperty[]> {
    return this.get(`${this.base(slug, projectId)}/`)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async create(
    slug: string,
    projectId: string,
    data: Partial<TCustomProperty>
  ): Promise<TCustomProperty> {
    return this.post(`${this.base(slug, projectId)}/`, data)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async update(
    slug: string,
    projectId: string,
    propertyId: string,
    data: Partial<TCustomProperty>
  ): Promise<TCustomProperty> {
    return this.patch(`${this.base(slug, projectId)}/${propertyId}/`, data)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async destroy(slug: string, projectId: string, propertyId: string): Promise<void> {
    return this.delete(`${this.base(slug, projectId)}/${propertyId}/`)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  // Options

  async listOptions(
    slug: string,
    projectId: string,
    propertyId: string
  ): Promise<TCustomPropertyOption[]> {
    return this.get(`${this.base(slug, projectId)}/${propertyId}/options/`)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async createOption(
    slug: string,
    projectId: string,
    propertyId: string,
    data: Partial<TCustomPropertyOption>
  ): Promise<TCustomPropertyOption> {
    return this.post(`${this.base(slug, projectId)}/${propertyId}/options/`, data)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async updateOption(
    slug: string,
    projectId: string,
    propertyId: string,
    optionId: string,
    data: Partial<TCustomPropertyOption>
  ): Promise<TCustomPropertyOption> {
    return this.patch(`${this.base(slug, projectId)}/${propertyId}/options/${optionId}/`, data)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async destroyOption(
    slug: string,
    projectId: string,
    propertyId: string,
    optionId: string
  ): Promise<void> {
    return this.delete(`${this.base(slug, projectId)}/${propertyId}/options/${optionId}/`)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  // Values on an issue

  async listValues(
    slug: string,
    projectId: string,
    issueId: string
  ): Promise<TCustomPropertyValueResponse[]> {
    return this.get(
      `/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/custom-property-values/`
    )
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async upsertValue(
    slug: string,
    projectId: string,
    issueId: string,
    propertyId: string,
    value: TCustomPropertyValuePrimitive
  ): Promise<TCustomPropertyValueResponse> {
    return this.patch(
      `/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/custom-property-values/`,
      { property_id: propertyId, value }
    )
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }

  async clearValue(slug: string, projectId: string, issueId: string, propertyId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/custom-property-values/?property_id=${propertyId}`
    )
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }
}
