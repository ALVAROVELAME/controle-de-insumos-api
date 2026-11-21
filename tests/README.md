# Testes automatizados

Execute `npm test` para rodar a suite de regras de negocio e a suite HTTP com Jest e Supertest. Para executar separadamente, use `npm run test:unit` ou `npm run test:http`. Execute `npm run test:coverage` para gerar o relatorio de cobertura da suite Jest em `coverage/`. O projeto e compilado antes dos testes Jest; isso permite testar o mesmo JavaScript gerado para producao.

Os testes de regras de negocio ficam em `unit/` e os testes Jest/Supertest em `http/`. As suites usam credenciais ficticias e simulam os repositorios. Um teste verifica o envio de email com um servidor SMTP local simulado. Nenhum banco MongoDB ou servidor SMTP externo e acessado. Os testes HTTP usam a montagem, rotas e middlewares reais com servicos simulados. Eles nao substituem testes de integracao com MongoDB e SMTP reais nem verificam concorrencia ou implantacao.

A compilacao limpa `dist/` antes de gerar os arquivos, evitando que codigo antigo apareca na cobertura. O relatorio de `test:coverage` mede somente os testes Jest; os testes executados pelo Node em `unit/` nao sao incluidos. Os testes de repositorio em `regras.jest.test.js` simulam os metodos dos modelos e conferem os filtros, sem substituir testes de integracao com MongoDB.
