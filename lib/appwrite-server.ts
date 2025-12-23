"use server";

import { Client, Databases } from "appwrite";

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
