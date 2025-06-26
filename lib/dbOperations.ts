import { databases, Query } from "./appwrite";

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const CLIENTS_ID = process.env.NEXT_PUBLIC_COLLECTION_CLIENTS_ID!;
const PROJECTS_ID = process.env.NEXT_PUBLIC_COLLECTION_PROJECTS_ID!;
const INVOICES_ID = process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ID!;
const INVOICE_ITEMS_ID = process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ITEMS_ID!;
const PAYMENTS_ID = process.env.NEXT_PUBLIC_COLLECTION_PAYMENT_ID!;

const getQuery = (userId?: string) =>
  userId ? [Query.equal("userId", userId)] : [];

export default {
  clients: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(databaseId, CLIENTS_ID, getQuery(userId));
    },
  },

  projects: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(databaseId, PROJECTS_ID, getQuery(userId));
    },
  },

  invoices: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(databaseId, INVOICES_ID, getQuery(userId));
    },
  },

  invoiceItems: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(databaseId, INVOICE_ITEMS_ID, getQuery(userId));
    },
  },

  payments: {
    getAll: async (userId?: string) => {
      return await databases.listDocuments(databaseId, PAYMENTS_ID, getQuery(userId));
    },
  },
};
