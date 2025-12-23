// NOTE: This file is currently disabled as it depends on serverDatabases
// which requires the node-appwrite package. The project currently uses
// NextAuth for authentication instead of Appwrite.
//
// To enable this utility:
// 1. Install node-appwrite: npm install node-appwrite
// 2. Set up APPWRITE_API_KEY in your environment
// 3. Uncomment the code below

/*
import { serverDatabases } from "./appwrite";
import { Query } from "appwrite";

const DATABASE_ID = "vbcl"; // Update with your actual Appwrite database ID

export const appwriteUtils = {
  // Create document
  async createDocument(collectionId: string, data: any, docId?: string) {
    return await serverDatabases.createDocument(
      DATABASE_ID,
      collectionId,
      docId || "unique()",
      data
    );
  },

  // Get single document
  async getDocument(collectionId: string, docId: string) {
    return await serverDatabases.getDocument(DATABASE_ID, collectionId, docId);
  },

  // Get documents with optional queries
  async getDocuments(collectionId: string, queries: string[] = []) {
    return await serverDatabases.listDocuments(
      DATABASE_ID,
      collectionId,
      queries
    );
  },

  // Update document
  async updateDocument(collectionId: string, docId: string, data: any) {
    return await serverDatabases.updateDocument(
      DATABASE_ID,
      collectionId,
      docId,
      data
    );
  },

  // Delete document
  async deleteDocument(collectionId: string, docId: string) {
    return await serverDatabases.deleteDocument(
      DATABASE_ID,
      collectionId,
      docId
    );
  },

  // Query helper - create query conditions
  queryEqual: (attribute: string, value: any) =>
    Query.equal(attribute, value),
  queryContains: (attribute: string, value: string) =>
    Query.contains(attribute, value),
  queryGreater: (attribute: string, value: any) =>
    Query.greaterThan(attribute, value),
  queryLess: (attribute: string, value: any) =>
    Query.lessThan(attribute, value),
  queryOrderDesc: (attribute: string) => Query.orderDesc(attribute),
  queryOrderAsc: (attribute: string) => Query.orderAsc(attribute),
  queryLimit: (limit: number) => Query.limit(limit),
  queryOffset: (offset: number) => Query.offset(offset),
};
*/

// Placeholder export to prevent import errors
export const appwriteUtils = null;
