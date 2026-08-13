import { Hono } from 'hono';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

app.use('*', (c, next) => {
  const allowed = [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8788',
    'http://localhost:4321',
    'http://localhost:4322',
    'http://localhost:4323',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8088',
    'http://127.0.0.1:8788',
    'http://127.0.0.1:4321',
    'http://127.0.0.1:4322',
    'http://127.0.0.1:4323',
    'https://astrowind-1cy.pages.dev',
    'https://ylg-admin.pages.dev',
    'https://astrowind-admin.pages.dev',
    'https://astrowind.pages.dev',
  ];
  const origin = c.req.header('Origin');
  if (origin && allowed.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, *');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.header('Access-Control-Max-Age', '86400');
  }
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }
  return next();
});

export default app;
