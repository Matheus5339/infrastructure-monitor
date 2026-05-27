const express = require('express');
const client = require('prom-client');
const os = require('os');

const app = express();

const register = new client.Registry();

client.collectDefaultMetrics({
  register
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal
      .labels(req.method, req.path, res.statusCode)
      .inc();
  });

  next();
});

app.get('/', (req, res) => {
  res.json({
    service: 'Infrastructure Monitor',
    status: 'running',
    hostname: os.hostname(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000, () => {
  console.log('Rodando na porta 3000');
});