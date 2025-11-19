import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

export interface NetSuiteAuthConfig {
  accountId: string;
  consumerKey: string;
  certificateId: string;
  privateKeyPath: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * NetSuite OAuth 2.0 M2M Authentication
 * Handles token generation and caching
 */
export class NetSuiteAuth {
  private config: NetSuiteAuthConfig;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: NetSuiteAuthConfig) {
    this.config = config;
  }

  /**
   * Get a valid access token (cached or new)
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.cachedToken && Date.now() < this.tokenExpiry - 60000) {
      return this.cachedToken;
    }

    // Generate new token
    return this.generateAccessToken();
  }

  /**
   * Generate a new OAuth 2.0 access token
   */
  private async generateAccessToken(): Promise<string> {
    try {
      // Read private key
      const privateKey = readFileSync(this.config.privateKeyPath, 'utf8');

      // Create JWT assertion
      const assertion = this.createJWTAssertion(privateKey);

      // Exchange JWT for access token
      const tokenUrl = `https://${this.config.accountId}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_assertion_type:
            'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: assertion,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `NetSuite OAuth failed (${response.status}): ${errorText}`
        );
      }

      const data = (await response.json()) as AccessTokenResponse;

      // Cache token with expiry
      this.cachedToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return data.access_token;
    } catch (error) {
      throw new Error(
        `Failed to generate NetSuite access token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create JWT assertion signed with private key
   */
  private createJWTAssertion(privateKey: string): string {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: this.config.consumerKey,
      scope: ['rest_webservices', 'suite_analytics'],
      aud: `https://${this.config.accountId}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
      exp: now + 300, // 5 minutes
      iat: now,
    };

    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      header: {
        typ: 'JWT',
        alg: 'RS256',
        kid: this.config.certificateId,
      },
    });
  }

  /**
   * Force token refresh (useful for testing or after errors)
   */
  async refreshToken(): Promise<string> {
    this.cachedToken = null;
    this.tokenExpiry = 0;
    return this.getAccessToken();
  }

  /**
   * Clear cached token
   */
  clearCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = 0;
  }
}
