import mongoose from "mongoose";
import { env } from "../config/env";

export async function conectarMongo() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB conectado");
  } catch (error) {
    console.error("Erro ao conectar no MongoDB", error);
    process.exit(1);
  }
}
