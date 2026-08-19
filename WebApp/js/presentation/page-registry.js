/*
 * QiblaAstro — Presentation Page Registry
 * Presentation-only. Does not import, call, mutate, or replace scientific engines.
 * © 2026 محمد سيد جبر بحيرى — Mohamed SG Behairy. All Rights Reserved.
 */
(function (root) {
  'use strict';

  var pages = Object.freeze({
    prayer: Object.freeze({
      rootId: 'page-prayer',
      fragment: 'pages/prayer.html',
      requiredIds: Object.freeze([
        'page-prayer','prayer-location-label','qa-next-name','qa-next-time','qa-next-countdown',
        'qa-prayer-table','qa-adhan-card','qa-prayer-details','pr-r','pr-s','pr-n','pr-h',
        'p-cd','p-nn','p-prog','p-list'
      ]),
      presentationCss: Object.freeze([
        'css/presentation/prayer/screen.css',
        'css/presentation/prayer/refinement.css',
        'css/presentation/prayer/final-polish.css',
        'css/presentation/prayer/settings-overrides.css'
      ])
    }),
    quran: Object.freeze({
      rootId: 'page-quran',
      fragment: 'pages/quran.html',
      requiredIds: Object.freeze([
        'page-quran','qr-list-view','qr-reader-view','qr-surah-list','qr-search',
        'qr-surah-title','qr-ayahs','qr-font-size','qr-bookmark-btn'
      ]),
      presentationCss: Object.freeze(['css/presentation/quran/screen.css'])
    }),
    azkar: Object.freeze({
      rootId: 'page-azkar',
      fragment: 'pages/azkar.html',
      requiredIds: Object.freeze([
        'page-azkar','az-categories-screen','az-reading-screen','az-reading-title',
        'zk-pf','zk-pt','zs-sabah','zs-masa','zs-nawm','zs-fajr','zs-salah','zs-duaa'
      ]),
      presentationCss: Object.freeze(['css/presentation/azkar/screen.css'])
    }),
    serenity: Object.freeze({
      rootId: 'page-serenity',
      fragment: 'pages/serenity.html',
      requiredIds: Object.freeze([
        'page-serenity','sk-canvas','sk-track-list','sk-now-title','sk-now-sub',
        'sk-progress','sk-current','sk-duration','sk-play-btn'
      ]),
      presentationCss: Object.freeze([
        'css/presentation/serenity/screen.css',
        'css/presentation/serenity/final-polish.css'
      ])
    })
  });

  root.QiblaPresentationPageRegistry = Object.freeze({
    get: function (name) { return pages[name] || null; },
    names: function () { return Object.keys(pages); },
    all: pages
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
