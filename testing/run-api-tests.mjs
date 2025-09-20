#!/usr/bin/env node
import assert from 'node:assert/strict';
import { argv, exit } from 'node:process';

const DEFAULT_TARGET = 'http://localhost:3000';

function parseArgs() {
  const args = { target: DEFAULT_TARGET };
  for (let i = 2; i < argv.length; i++) {
    const [key, value] = argv[i].split('=');
    if (key === '--target' && value) {
      args.target = value;
    }
  }
  return args;
}

async function checkEndpoint(target, path, { method = 'GET', expected = 200, name }) {
  const url = `${target}${path}`;
  const res = await fetch(url, { method });
  if (res.status !== expected) {
    const body = await res.text();
    throw new Error(`${name} expected ${expected} got ${res.status}: ${body}`);
  }
  return { name, status: res.status };
}

async function login(target, email, password) {
  const csrfRes = await fetch(`${target}/api/auth/csrf`);
  assert.equal(csrfRes.status, 200, 'csrf token request failed');
  const { csrfToken } = await csrfRes.json();
  assert.ok(csrfToken, 'missing csrf token');
  const csrfCookieHeader = csrfRes.headers.get('set-cookie');
  const csrfCookie = csrfCookieHeader ? csrfCookieHeader.split(';')[0] : null;

  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${target}/account`,
    redirect: 'false',
    json: 'true',
  });

  const res = await fetch(`${target}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(csrfCookie ? { cookie: csrfCookie } : {}),
    },
    body,
  });

  const text = await res.text();
  if (res.status !== 200) {
    throw new Error(`login failed: ${res.status} ${text}`);
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`login response not JSON: ${text}`);
  }
  if (json?.error) {
    throw new Error(`login returned error: ${JSON.stringify(json)}`);
  }

  const header = res.headers.get('set-cookie');
  const cookies = header ? header.split(/,(?=\s*[^=]+=)/).map((c) => c.trim()) : [];
  if (!cookies.length) {
    throw new Error('login succeeded but no cookies returned.');
  }
  const sessionCookie = cookies.find((c) => c.includes('session-token'));
  if (!sessionCookie) {
    throw new Error(`missing session cookie. Cookies: ${cookies.join('; ')}`);
  }

  const callbackCookie = cookies.find((c) => c.startsWith('next-auth.callback-url'));
  const parts = [sessionCookie.split(';')[0]];
  if (callbackCookie) parts.push(callbackCookie.split(';')[0]);

  return parts.join('; ');
}

async function fetchSession(target, cookie) {
  const res = await fetch(`${target}/api/auth/session`, {
    headers: {
      cookie,
    },
  });
  if (res.status !== 200) {
    const msg = await res.text();
    throw new Error(`session fetch failed: ${res.status} ${msg}`);
  }
  const data = await res.json();
  return data;
}

async function main() {
  const { target } = parseArgs();
  const results = [];

  try {
    results.push(await checkEndpoint(target, '/api/health', { name: 'health' }));
    results.push(await checkEndpoint(target, '/api/health/database', { name: 'database health' }));
    results.push(await checkEndpoint(target, '/api/settings', { name: 'settings' }));
    results.push(await checkEndpoint(target, '/api/shoes', { name: 'shoes' }));

    const cookie = await login(target, 'newsteps.dev@gmail.com', 'TestPass123!');
    const session = await fetchSession(target, cookie);
    assert.ok(session?.user?.email === 'newsteps.dev@gmail.com', 'session email mismatch');
    results.push({ name: 'login+session', status: 200 });

    console.log('API smoke results:', results);
  } catch (err) {
    console.error('API test failure:', err);
    exit(1);
  }
}

main();
