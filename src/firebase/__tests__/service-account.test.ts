import { describe, it, expect } from 'vitest';
import { resolveServiceAccount } from '../service-account';

const KEY = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n';

describe('resolveServiceAccount', () => {
  it('reads the snake_case JSON downloaded from the Firebase console', () => {
    const env = {
      FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({
        type: 'service_account',
        project_id: 'my-project',
        client_email: 'sa@my-project.iam.gserviceaccount.com',
        private_key: KEY,
      }),
    };
    expect(resolveServiceAccount(env)).toEqual({
      projectId: 'my-project',
      clientEmail: 'sa@my-project.iam.gserviceaccount.com',
      privateKey: KEY,
    });
  });

  it('accepts camelCase JSON', () => {
    const env = {
      FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({
        projectId: 'p',
        clientEmail: 'e@p.iam.gserviceaccount.com',
        privateKey: KEY,
      }),
    };
    expect(resolveServiceAccount(env)?.projectId).toBe('p');
  });

  it('falls back to individual env vars and unescapes \\n in the key', () => {
    const env = {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'p',
      FIREBASE_CLIENT_EMAIL: 'e@p.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
    };
    expect(resolveServiceAccount(env)?.privateKey).toBe(KEY);
  });

  it('returns null when credentials are incomplete', () => {
    expect(resolveServiceAccount({})).toBeNull();
    expect(
      resolveServiceAccount({
        FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({ project_id: 'p' }),
      })
    ).toBeNull();
  });
});
