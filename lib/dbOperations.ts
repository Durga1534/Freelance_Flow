import { databases, Query } from "./appwrite";

const databaseId = "68537fd80002a07c3005";

const getQuery = (userId?: string) =>
  userId ? [Query.equal("userId", userId)] : [];

export default {
  clients: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(
        databaseId,
        "685382d20009506336c5",
        getQuery(userId)
      );
    },
  },

  projects: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(
        databaseId,
        "6853def50008468fd583",
        getQuery(userId)
      );
    },
  },

  invoices: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(
        databaseId,
        "6854dee1000bb6583a6d",
        getQuery(userId)
      );
    },
  },

  invoiceItems: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(
        databaseId,
        "6854e66100129eb5b9a8",
        getQuery(userId)
      );
    },
  },

  payments: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(
        databaseId,
        "6854e6e50034d6f8acf5",
        getQuery(userId)
      );
    },
  },
};
