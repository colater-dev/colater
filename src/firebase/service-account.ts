export interface ServiceAccountCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

type Env = Record<string, string | undefined>;

/**
 * Resolves Firebase Admin credentials from env.
 * FIREBASE_SERVICE_ACCOUNT_KEY may be the JSON downloaded from the Firebase
 * console (snake_case: project_id, client_email, private_key) or camelCase.
 * Otherwise falls back to individual FIREBASE_* env vars.
 */
export function resolveServiceAccount(env: Env): ServiceAccountCredentials | null {
  let projectId: string | undefined;
  let clientEmail: string | undefined;
  let privateKey: string | undefined;

  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const json = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    projectId = json.project_id ?? json.projectId;
    clientEmail = json.client_email ?? json.clientEmail;
    privateKey = json.private_key ?? json.privateKey;
  } else {
    projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    clientEmail = env.FIREBASE_CLIENT_EMAIL;
    privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}
