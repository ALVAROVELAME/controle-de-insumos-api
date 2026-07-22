import mongoose from "mongoose";


const NomeSchema = new mongoose.Schema({

  nome: {
    type: String,
    required: true
  }

});


export const Nome = mongoose.model(
  "Nome",
  NomeSchema
);