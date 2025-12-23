// "use server";

// NOTE: This file is currently disabled as it requires the 'node-appwrite' package
// instead of the 'appwrite' (web SDK) package. The web SDK's Client does not have
// a .setKey() method - that's only available in the Node.js Server SDK.
//
// To enable server-side Appwrite operations:
// 1. Install node-appwrite: npm install node-appwrite
// 2. Uncomment the code below and update the import

/*
import { Client, Databases } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  throw new Error(
    "Missing Appwrite server configuration. Ensure endpoint, project ID, and API key are set in the environment.",
  );
}

// Server-side instance (with API key for privileged operations)
const serverClient = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const serverDatabases = new Databases(serverClient);

export { serverClient, serverDatabases };
*/

// Placeholder exports to prevent import errors if this file was previously imported
export const serverClient = null;
export const serverDatabases = null;
