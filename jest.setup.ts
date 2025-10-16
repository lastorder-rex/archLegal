import '@testing-library/jest-dom';
import 'whatwg-fetch';

if (typeof Response !== 'undefined' && typeof (Response as any).json !== 'function') {
  (Response as any).json = function json(body: any, init?: ResponseInit) {
    const headers = new Headers(init?.headers ?? {});
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return new Response(JSON.stringify(body), { ...init, headers });
  };
}
