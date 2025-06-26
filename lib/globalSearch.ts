import { Query } from "appwrite";
import { databases } from "./appwrite";

const databaseId = "68537fd80002a07c3005";

export const globalSearch = async (searchText: string, userId: string) => {
  if (!searchText || !userId) return [];

  const queryText = searchText.toLowerCase();

  // Define collections with their searchable fields
  const collections = [
    { 
      id: process.env.NEXT_PUBLIC_COLLECTION_CLIENTS_ID!, 
      name: "clients",
      searchFields: ["name", "email", "company"]
    },
    { 
      id: process.env.NEXT_PUBLIC_COLLECTION_PROJECTS_ID!, 
      name: "projects",
      searchFields: ["name", "status"]
    },
    { 
      id: process.env.NEXT_PUBLIC_COLLECTION_INVOICES_ID!, 
      name: "invoices",
      searchFields: ["invoice_number", "client_email"]
    },
  ];

  const allResults = await Promise.all(
    collections.map(async (collection) => {
      try {
        const searchPromises = collection.searchFields.map(async (field) => {
          try {
            const res = await databases.listDocuments(
              databaseId,
              collection.id,
              [
                Query.equal("userId", userId),
                Query.search(field, queryText)
              ]
            );
            return res.documents;
          } catch (error) {
            console.warn(`Field ${field} not found in ${collection.name}:`, error);
            return [];
          }
        });

        const results = await Promise.all(searchPromises);
        const flatResults = results.flat();
        
        const uniqueResults = flatResults.filter((doc, index, self) => 
          index === self.findIndex(d => d.$id === doc.$id)
        );

        return uniqueResults.map((doc) => ({
          ...doc,
          collection: collection.name,
        }));
      } catch (error) {
        console.error(`Error searching in ${collection.name}:`, error);
        return [];
      }
    })
  );

  return allResults.flat();
};