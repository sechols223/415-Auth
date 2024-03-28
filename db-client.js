
import "dotenv/config";
import { MongoClient } from "mongodb";

const DB_URL = process.env.MONGO_URI
async function getDatabase() {
  const client = new MongoClient(DB_URL);
  await client.connect();
  return client.db(process.env.MONGO_DATABSE);
}

async function getUsersCollection() {
  const db = await getDatabase();

  return db.collection("Users");
}

export const DatabaseClient = {
  getDatabase: getDatabase,
  getUsersCollection: getUsersCollection
}
