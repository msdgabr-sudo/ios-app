/*
 * QiblaAstro — Astronomical module loader (migration adapter)
 * Loads the existing protected production files in their original order.
 * It contains no equations and does not alter any scientific constants.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';

  var loadingPromise = null;

  function manifest() {
    var value = root.QiblaAstronomicalModuleManifest;
    if (!value || !Array.isArray(value.MODULES)) {
      throw new Error('QiblaAstronomicalModuleManifest is unavailable.');
    }
    return value;
  }

  function alreadyLoaded(src) {
    if (!root.document) return false;
    var scripts = root.document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var current = scripts[i].getAttribute('src') || '';
      if (current === src || current.endsWith('/' + src)) return true;
    }
    return false;
  }

  function loadOne(src) {
    return new Promise(function (resolve, reject) {
      if (alreadyLoaded(src)) return resolve(src);
      if (!root.document || !root.document.body) return reject(new Error('Document is unavailable.'));
      var script = root.document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute('data-qibla-astronomical-module', 'true');
      script.onload = function () { resolve(src); };
      script.onerror = function () { reject(new Error('Failed to load protected module: ' + src)); };
      root.document.body.appendChild(script);
    });
  }

  function loadProtectedStack() {
    if (loadingPromise) return loadingPromise;
    var modules = manifest().MODULES;
    loadingPromise = modules.reduce(function (chain, item) {
      return chain.then(function () { return loadOne(item.path); });
    }, Promise.resolve()).then(function () {
      return Object.freeze({
        loaded: true,
        count: modules.length,
        foundationCommit: manifest().FOUNDATION_COMMIT
      });
    }).catch(function (error) {
      loadingPromise = null;
      throw error;
    });
    return loadingPromise;
  }

  root.QiblaAstronomicalModuleLoader = Object.freeze({
    loadProtectedStack: loadProtectedStack
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
