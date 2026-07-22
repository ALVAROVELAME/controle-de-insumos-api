import Fastify from "fastify";
import dotenv from "dotenv";

import { conectarMongo } from "./database/mongo";
import { Nome } from "./models/Nome";


dotenv.config();


const app = Fastify({
  logger: true
});



app.get("/", async () => {

  return {
    status: "API controle de insumos funcionando"
  };

});



app.post("/nomes", async (request, reply) => {

  try {

    const body = request.body as {
      nome?: string;
    };


    if (!body.nome) {

      return reply.status(400).send({
        erro: "O campo nome é obrigatório"
      });

    }



    const novoNome = await Nome.create({

      nome: body.nome

    });



    return reply.status(201).send({

      mensagem: "Nome cadastrado",

      dados: novoNome

    });



  } catch (erro) {

    request.log.error(erro);


    return reply.status(500).send({

      erro: "Erro interno do servidor"

    });

  }

});





app.get("/nomes", async (request, reply) => {

  try {


    const nomes = await Nome.find();


    return {

      nomes

    };


  } catch (erro) {


    request.log.error(erro);


    return reply.status(500).send({

      erro: "Erro ao buscar nomes"

    });


  }

});






async function iniciar() {


  try {


    await conectarMongo();



    const porta = Number(process.env.PORT);



    if (!porta) {

      throw new Error("PORT não configurada no .env");

    }




    await app.listen({

      host: "0.0.0.0",

      port: porta

    });



    console.log(`API rodando na porta ${porta}`);



  } catch (erro) {


    app.log.error(erro);

    process.exit(1);


  }


}




iniciar();