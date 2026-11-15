Object.assign(process.env, {
  NODE_ENV: 'test',
  MONGO_URI: 'mongodb://127.0.0.1:27017/teste',
  MAIL_HOST: 'localhost', MAIL_PORT: '1025', MAIL_USERNAME: 'teste',
  MAIL_PASSWORD: 'teste', MAIL_FROM: 'teste@example.com',
  JWT_SECRET: 'segredo-exclusivo-para-testes-com-mais-de-32-caracteres',
  JWT_ISSUER: 'testes', JWT_AUDIENCE: 'testes', JWT_EXPIRATION: '3600000',
  CORS_ORIGIN: 'http://localhost:5173',
  APP_BASE_URL: 'http://localhost:3000', APP_FRONTEND_URL: 'http://localhost:5173',
});
