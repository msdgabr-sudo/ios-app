'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const gatewaySource = fs.readFileSync('js/astro-verification.js', 'utf8');

function loadGateway(sunAlt, moonAlt) {
  const context = {
    console,
    Date,
    Promise,
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout,
    clearTimeout,
    sunPos: () => ({ alt: sunAlt, altApp: sunAlt, az: 120, azApp: 120 }),
    moonPos: () => ({ alt: moonAlt, altApp: moonAlt, az: 240, azApp: 240 })
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(gatewaySource, context, { filename: 'astro-verification.js' });
  return context.AstroVerification;
}

let api = loadGateway(35, 28);
let pick = api.canStartVerification();
assert.strictEqual(pick.possible, true, 'Both visible bodies must allow verification.');
assert.strictEqual(pick.primary, 'sun', 'Daylight must prefer the Sun when both bodies are observable.');
assert.deepStrictEqual(Array.from(pick.alternatives), ['sun', 'moon'], 'Alternatives must preserve Sun then Moon priority.');

api = loadGateway(-8, 31);
pick = api.canStartVerification();
assert.strictEqual(pick.primary, 'moon', 'Moon must be selected when the Sun is unavailable.');
assert.deepStrictEqual(Array.from(pick.alternatives), ['moon']);

api = loadGateway(18, -12);
pick = api.canStartVerification();
assert.strictEqual(pick.primary, 'sun', 'Sun-only daytime observation must select the Sun.');
assert.deepStrictEqual(Array.from(pick.alternatives), ['sun']);

api = loadGateway(4.9, 4.9);
pick = api.canStartVerification();
assert.strictEqual(pick.possible, false, 'Bodies below the safe 5° observing threshold must not start verification.');

assert(gatewaySource.indexOf("if (sun.alt > 5) alternatives.push('sun')") <
       gatewaySource.indexOf("if (moon.alt > 5) alternatives.push('moon')"),
       'Source order must not regress to Moon-first selection.');
assert(/new Session\(\{[\s\S]*?body:\s*_selectedBody/.test(gatewaySource),
       'Production gateway must pass the selected observable body explicitly to VerificationSession.');

console.log('ASTRONOMICAL BODY SELECTION REGRESSION: PASS');
