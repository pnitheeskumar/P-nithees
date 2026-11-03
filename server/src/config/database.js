import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows Node DNS SRV lookup for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in restricted environments
}

let cachedPromise = null;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finflow';

  mongoose.set('strictQuery', true);

  cachedPromise = mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    })
    .then((conn) => {
      console.log(`[FinFlow Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    })
    .catch((error) => {
      cachedPromise = null;
      console.warn(`[FinFlow Database Warning] Unable to connect to MongoDB: ${error.message}`);
      throw error;
    });

  return cachedPromise;
};

export const getDbStatus = () => {
  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    readyState: state,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

export default connectDatabase;
