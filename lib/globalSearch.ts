import { Query } from "appwrite";
import { databases } from "./appwrite";

const databaseId = "68537fd80002a07c3005";

export const globalSearch = async (searchText: string, userId: string) => {
  if (!searchText || !userId) return [];

  const queryText = searchText.toLowerCase();

  const collections = [
    { id: process.env.NEXT_PUBLIC_COLLECTION_CLIENTS_ID!, name: "clients" },
    { id: process.env.NEXT_PUBLIC_COLLECTION_PROJECTS_ID!, name: "projects" },
    { id: process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ID!,name: "invoices" },
  ];

  const allResults = await Promise.all(
    collections.map(async (collection) => {
      const res = await databases.listDocuments(
        databaseId,
        collection.id,
        [
          Query.equal("userId", userId),
          Query.search("name", queryText)
        ]
      );
      return res.documents.map((doc) => ({
        ...doc,
        _collection: collection.name,
      }));
    })
  );

  return allResults.flat();
};
