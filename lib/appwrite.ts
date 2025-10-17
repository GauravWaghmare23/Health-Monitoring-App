import { Account, Client, Databases } from "react-native-appwrite";

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!);

export const account = new Account(client);
export const database = new Databases(client);

export const DatabaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
export const CollectionId = process.env.EXPO_PUBLIC_APPWRITE_USER_DETAILS_COLLECTION_ID!;
