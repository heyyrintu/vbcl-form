import { Client, Account, Databases } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const projectName = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME;

// Create client only if configuration is available
let client: Client | null = null;
let account: Account | null = null;
let databases: Databases | null = null;

if (endpoint && projectId) {
  client = new Client().setEndpoint(endpoint).setProject(projectId);
  account = new Account(client);
  databases = new Databases(client);
}

export { client, account, databases, projectName };
