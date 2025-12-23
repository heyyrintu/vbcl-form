import { Client, Account, Databases } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const projectName = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME;

if (!endpoint || !projectId || !projectName) {
  throw new Error(
    "Missing Appwrite configuration. Ensure endpoint, project ID, and project name are set in the environment.",
  );
}

// Client-side instance (browser and SSR)
const client = new Client().setEndpoint(endpoint).setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases, projectName };
