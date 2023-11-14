(function () {
    "use strict";
  
    var currentLocation = window.location,
      document = window.document,
      currentScript = document.currentScript,
      apiEndpoint =
        currentScript.getAttribute("data-api") ||
        new URL(currentScript.src).origin + "/api/event";
  
    function ignoreEvent(eventName) {
      console.warn("Ignoring Event: " + eventName);
    }
  
    function sendEvent(eventName, eventData) {
      if (
        /^localhost$|^127(\.[0-9]+){0,2}\.[0-9]+$|^\[::1?\]$/.test(
          currentLocation.hostname
        ) ||
        "file:" === currentLocation.protocol
      )
        return ignoreEvent("localhost");
  
      if (
        !(
          window._phantom ||
          window.__nightmare ||
          window.navigator.webdriver ||
          window.Cypress
        )
      ) {
        try {
          if ("true" === window.localStorage.plausible_ignore)
            return ignoreEvent("localStorage flag");
        } catch (e) {}
  
        var data = {};
        data.n = eventName;
        data.u = currentLocation.href;
        data.d = currentScript.getAttribute("data-domain");
        data.r = document.referrer || null;
        data.w = window.innerWidth;
  
        if (eventData && eventData.meta) data.m = JSON.stringify(eventData.meta);
        if (eventData && eventData.props) data.p = eventData.props;
  
        var xhr = new XMLHttpRequest();
        xhr.open("POST", apiEndpoint, true);
        xhr.setRequestHeader("Content-Type", "text/plain");
        xhr.send(JSON.stringify(data));
  
        xhr.onreadystatechange = function () {
          if (4 === xhr.readyState && eventData && eventData.callback)
            eventData.callback();
        };
      }
    }
  
    var plausibleQueue = window.plausible && window.plausible.q || [];
    window.plausible = sendEvent;
  
    for (var i = 0; i < plausibleQueue.length; i++) {
      sendEvent.apply(this, plausibleQueue[i]);
    }
  
    function handlePageview() {
      if (pathname !== currentLocation.pathname) {
        pathname = currentLocation.pathname;
        sendEvent("pageview");
      }
    }
  
    var pathname, history = window.history;
    if (history.pushState) {
      var originalPushState = history.pushState;
      history.pushState = function () {
        originalPushState.apply(this, arguments);
        handlePageview();
      };
  
      window.addEventListener("popstate", handlePageview);
    }
  
    if ("prerender" === document.visibilityState) {
      document.addEventListener("visibilitychange", function () {
        if (!pathname || "visible" !== document.visibilityState) handlePageview();
      });
    } else {
      handlePageview();
    }
  })();
  