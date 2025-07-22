import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!

if(!MONGODB_URI){
    throw new Error ("Please define a MONGODB_URI environment variable inside .env.local");
}

const cached = global.mongoose || {conn:null, promise:null};

export async function connectToDatabase(){
    if(cached.conn) return cached.conn;
    if (!cached.promise){
        cached.promise = mongoose.connect(MONGODB_URI,{
             dbName: "it-kb-cluster",
             bufferCommands: false,
        });
    }
        cached.conn = await cached.promise;
        return cached.conn;
    }
