/*
 * QiblaAstro — Qibla Card Runtime
 * UI-only adapter. Keeps the existing public API and mounts the final home UI
 * from a script path that index.html actually loads.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';

  var intervalId = 0;
  var homeRequested = false;
  var liveRequested = false;
  var astroStoreRequested = false;
  var lastSuccessfulAstroDisplay = null;

  function byId(id) {
    return root.document ? root.document.getElementById(id) : null;
  }

  function loadScript(src, marker, onload) {
    if (!root.document) return;
    if (root.document.querySelector('script[' + marker + ']')) {
      if (onload) onload();
      return;
    }
    var script = root.document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(marker, 'true');
    if (onload) script.onload = onload;
    (root.document.head || root.document.documentElement).appendChild(script);
  }

  function loadPersistedAstroStore() {
    if (astroStoreRequested || root.QiblaAstronomicalVerificationStore) return;
    astroStoreRequested = true;
    loadScript('js/astronomical-verification-store.js?v=20260813-persist1', 'data-qibla-astro-store', function () {
      updateCards();
    });
  }

  function loadFinalHome() {
    if (homeRequested || byId('qa-home')) return;
    homeRequested = true;
    loadScript('js/home-final.js?v=20260806-2325', 'data-qibla-home-final', function () {
      root.dispatchEvent(new CustomEvent('qiblaastro:home-final-loaded'));
    });
  }

  function loadLiveCelestialModule() {
    if (liveRequested || root.QiblaPostVerificationLiveCompass) return;
    liveRequested = true;
    loadScript('js/post-verification-live-compass.js', 'data-qibla-live-module');
  }

  function rememberSuccessfulAstroDisplay(cards) {
    var qibla = cards && cards.astroQibla;
    var deviation = cards && cards.astroDeviation;
    if (!qibla || !deviation) return;
    if (qibla.state !== 'active' || deviation.state !== 'active') return;
    if (!qibla.value || !deviation.value || deviation.value === '---') return;
    lastSuccessfulAstroDisplay = {
      qiblaValue: qibla.value,
      qiblaHint: qibla.captureAge || qibla.label || '',
      deviationValue: deviation.value,
      deviationHint: deviation.hint || deviation.label || ''
    };
  }

  function updateAstroCards(cards) {
    var astroValue = byId('astro-qibla-value');
    var astroHint = byId('astro-qibla-hint');
    var devValue = byId('astro-deviation-value');
    var devHint = byId('astro-deviation-hint');
    var qibla = cards && cards.astroQibla;
    var deviation = cards && cards.astroDeviation;

    rememberSuccessfulAstroDisplay(cards);

    if (qibla && qibla.value) {
      if (astroValue) astroValue.textContent = qibla.value;
      if (astroHint) astroHint.textContent = qibla.captureAge || qibla.label || '';
    } else if (lastSuccessfulAstroDisplay) {
      if (astroValue) astroValue.textContent = lastSuccessfulAstroDisplay.qiblaValue;
      if (astroHint) astroHint.textContent = lastSuccessfulAstroDisplay.qiblaHint;
    } else {
      if (astroValue) astroValue.textContent = '---°';
      if (astroHint && qibla) astroHint.textContent = qibla.label || '';
    }

    if (deviation && deviation.value && deviation.value !== '---') {
      if (devValue) devValue.textContent = deviation.value;
      if (devHint) devHint.textContent = deviation.hint || deviation.label || '';
    } else if (lastSuccessfulAstroDisplay) {
      if (devValue) devValue.textContent = lastSuccessfulAstroDisplay.deviationValue;
      if (devHint) devHint.textContent = lastSuccessfulAstroDisplay.deviationHint;
    } else {
      if (devValue) devValue.textContent = '---';
      if (devHint && deviation) devHint.textContent = deviation.label || '';
    }
  }

  function updateCards() {
    var Cards = root.CompassCards;
    if (!Cards || typeof Cards.getAllCards !== 'function') return;
    var cards = Cards.getAllCards();
    if (!cards || cards.loading) return;

    var heading = byId('box-heading');
    var liveHint = byId('live-compass-hint');
    if (heading && cards.liveCompass) {
      heading.style.display = cards.liveCompass.value ? 'block' : 'none';
      if (cards.liveCompass.value) heading.textContent = cards.liveCompass.value;
    }
    if (liveHint && cards.liveCompass) {
      liveHint.textContent = cards.liveCompass.value ? 'حية' : cards.liveCompass.label;
    }

    updateAstroCards(cards);
  }

  function activateLiveCompass() {
    if (typeof root.activateCompass === 'function') root.activateCompass();
    [150, 400, 800, 1500].forEach(function (delay) { root.setTimeout(updateCards, delay); });
  }

  function start() {
    if (intervalId) return;
    loadPersistedAstroStore();
    loadFinalHome();
    loadLiveCelestialModule();
    updateCards();
    intervalId = root.setInterval(updateCards, 250);
  }

  function stop() {
    if (!intervalId) return;
    root.clearInterval(intervalId);
    intervalId = 0;
  }

  root.QiblaCardRuntime = Object.freeze({ update: updateCards, activateLiveCompass: activateLiveCompass, start: start, stop: stop });
  root._qiblaUpdateNewCards = updateCards;
  root._qiblaActivateLiveCompass = activateLiveCompass;

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
