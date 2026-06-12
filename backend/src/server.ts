import { createServer } from 'http';
import { createApp } from './app/createApp';
import { bootstrapEnvironment } from './shared/bootstrap';
import { attachRealtime } from './shared/realtime';

bootstrapEnvironment();

const app = createApp();
const port = process.env.PORT || 3001;
const server = createServer(app);

attachRealtime(server);

export const startServer = () =>
  server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });

export { app, server };
