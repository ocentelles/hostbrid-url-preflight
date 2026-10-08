import test from 'node:test';
import assert from 'node:assert/strict';
import {check} from './check.mjs';
const base = 'https://site.example.invalid/app/';
test('browser-style URL normalization catches loopback variants', () => {
  for (const reference of ['http://localhost:3000/api', 'http://LOCALHOST./api', 'http://preview.localhost/', 'http://127.1/', 'http://2130706433/', 'http://[::1]/']) assert.equal(check(reference, base).status, 'LOOPBACK_TARGET');
});
test('listening address is not a public destination', () => {
  for (const reference of ['http://0.0.0.0:8080/', 'http://[::]:8080/']) assert.equal(check(reference, base).status, 'UNSPECIFIED_TARGET');
});
test('relative target follows supplied page origin and path', () => {
  assert.deepEqual(check('/api/contact', base), {status: 'REVIEW_HTTP_TARGET', sameOrigin: true, secureScheme: true});
  assert.equal(check('/api/contact', 'http://localhost:3000/').status, 'LOOPBACK_TARGET');
});
test('a name containing localhost is not a loopback hostname', () => {
  assert.equal(check('https://localhost.example.invalid/', base).status, 'REVIEW_HTTP_TARGET');
});
test('external HTTP is flagged for review, not declared operational', () => {
  assert.deepEqual(check('http://api.example.invalid/', base), {status: 'REVIEW_HTTP_TARGET', sameOrigin: false, secureScheme: false});
});
test('invalid URLs and non-HTTP schemes are separate', () => {
  assert.equal(check('http://[broken', base).status, 'INVALID_URL');
  assert.equal(check('file:///Users/demo/index.html', base).status, 'NON_HTTP');
});
test('credentials and query values are never returned', () => {
  const marker = 'synthetic-private-marker';
  const result = check('https://demo:' + marker + '@api.example.invalid/?token=' + marker, base);
  assert.equal(result.status, 'CREDENTIALS_IN_URL'); assert.ok(!JSON.stringify(result).includes(marker));
  assert.ok(!JSON.stringify(check('https://api.example.invalid/?token=' + marker, base)).includes(marker));
});

test("DNS hostname beginning with 127 is not an IPv4 literal",()=>{assert.equal(check("https://127.example.invalid/api",base).status,"REVIEW_HTTP_TARGET");assert.equal(check("https://127.0.0.1.example.invalid/",base).status,"REVIEW_HTTP_TARGET");});
