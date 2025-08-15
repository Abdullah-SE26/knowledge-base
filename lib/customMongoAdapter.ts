import { MongoDBAdapter } from "@auth/mongodb-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import type { MongoClient } from "mongodb";

export interface ExtendedAdapterUser extends AdapterUser {
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function CustomMongoDBAdapter(
  clientPromise: Promise<MongoClient>
): Adapter {
  const originalAdapter = MongoDBAdapter(clientPromise);

  return {
    ...originalAdapter,

    async createUser(data: Partial<ExtendedAdapterUser>) {
      if (!data.role) {
        data.role = "user";
      }
      data.createdAt = new Date();
      data.updatedAt = new Date();

      // Cast to AdapterUser because originalAdapter expects that
      return originalAdapter.createUser!(data as AdapterUser);
    },

    async updateUser(data: Partial<ExtendedAdapterUser> & Pick<AdapterUser, "id">) {
      // Do not override role or timestamps on update
      return originalAdapter.updateUser!(data as AdapterUser);
    },
  };
}
