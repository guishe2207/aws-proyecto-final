import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const options = {
  stages: [
    { duration: '30s', target: 1 },
    { duration: '60s', target: 5 },
    { duration: '60s', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.98'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/health`, { tags: { endpoint: 'health' } });
  check(response, {
    'HTTP 200': (r) => r.status === 200,
    'respuesta indica estado OK': (r) => {
      try { return r.json('data.status') === 'ok'; } catch (_) { return false; }
    },
    'base de datos conectada': (r) => {
      try { return r.json('data.database') === 'connected'; } catch (_) { return false; }
    },
  });
  sleep(1);
}
