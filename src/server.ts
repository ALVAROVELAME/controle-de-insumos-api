import Fastify from "fastify";

const app = Fastify();

const nomes: string[] = [];

app.get("/", async () => {
  return {
    status: "API controle de insumos funcionando"
  };
});


app.post("/nomes", async (request, reply) => {

  const body = request.body as {
    nome: string;
  };

  nomes.push(body.nome);

  return reply.status(201).send({
    mensagem: "Nome cadastrado",
    nome: body.nome
  });

});


app.get("/nomes", async () => {

  return {
    nomes
  };

});


app.listen({
  host: "0.0.0.0",
  port: 3000
}).then(() => {

  console.log("API rodando na porta 3000");

});