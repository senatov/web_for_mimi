(function () {
    'use strict';
    if (window.location.hostname !== 'miminavi.tech' || navigator.doNotTrack === '1') return;

    function appendScript(src) {
        var script = document.createElement('script');
        script.async = true;
        script.src = src;
        document.head.appendChild(script);
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-8TLEMWJB1L', {anonymize_ip: true});
    window.sc_project = 13215703;
    window.sc_invisible = 1;
    window.sc_security = 'd2c2ae13';
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };

    function loadCounters() {
        appendScript('https://www.googletagmanager.com/gtag/js?id=G-8TLEMWJB1L');
        appendScript('https://www.statcounter.com/counter/counter.js');
        appendScript('https://www.clarity.ms/tag/whiyuue7ge');
    }

    if ('requestIdleCallback' in window) window.requestIdleCallback(loadCounters, {timeout: 2500});
    else window.setTimeout(loadCounters, 1200);
}());
