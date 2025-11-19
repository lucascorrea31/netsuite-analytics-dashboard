import { NetSuiteAuth, type NetSuiteAuthConfig } from './auth';

export interface NetSuiteClientConfig extends NetSuiteAuthConfig {
  apiVersion?: string;
}

export interface SuiteQLResponse<T = any> {
  items: T[];
  hasMore: boolean;
  count: number;
  offset: number;
  totalResults: number;
  links?: Array<{
    rel: string;
    href: string;
  }>;
}

export interface SuiteQLQueryOptions {
  limit?: number;
  offset?: number;
}

/**
 * NetSuite REST API Client
 * Handles authenticated requests to NetSuite endpoints
 */
export class NetSuiteClient {
  private auth: NetSuiteAuth;
  private accountId: string;
  private apiVersion: string;

  constructor(config: NetSuiteClientConfig) {
    this.auth = new NetSuiteAuth(config);
    this.accountId = config.accountId;
    this.apiVersion = config.apiVersion || 'v1';
  }

  /**
   * Execute a SuiteQL query
   */
  async executeSuiteQL<T = any>(
    query: string,
    options: SuiteQLQueryOptions = {}
  ): Promise<SuiteQLResponse<T>> {
    const { limit = 100, offset = 0 } = options;

    const url = this.buildSuiteQLUrl(limit, offset);
    const token = await this.auth.getAccessToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'transient',
      },
      body: JSON.stringify({ q: query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `SuiteQL query failed (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Get a record by type and ID
   */
  async getRecord(recordType: string, id: string): Promise<any> {
    const url = `https://${this.accountId}.suitetalk.api.netsuite.com/services/rest/record/${this.apiVersion}/${recordType}/${id}`;
    const token = await this.auth.getAccessToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get record ${recordType}/${id} (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Build SuiteQL endpoint URL with query parameters
   */
  private buildSuiteQLUrl(limit: number, offset: number): string {
    const baseUrl = `https://${this.accountId}.suitetalk.api.netsuite.com/services/rest/query/${this.apiVersion}/suiteql`;
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return `${baseUrl}?${params}`;
  }

  /**
   * Refresh authentication token
   */
  async refreshAuth(): Promise<void> {
    await this.auth.refreshToken();
  }
}
