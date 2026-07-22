import mongoose from "mongoose";

export async function conectarMongo() {

  try {

    await mongoose.connect(process.env.MONGO_URI as string);

    console.log("MongoDB conectado");

  } catch (error) {

    console.error("Erro ao conectar no MongoDB", error);
    process.exit(1);

  }

}