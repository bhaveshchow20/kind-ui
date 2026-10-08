import { isIndexable } from "./indexing.mjs";

/** Measurement IDs are public routing identifiers, not credentials. */
export function analyticsScript(env = process.env) {
  const id = env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-1WENXL62G2";
  if (!isIndexable(env) || !id) return null;
  if (!/^G-[A-Z0-9]+$/.test(id)) throw new Error("Invalid GA4 measurement ID");
  return `(${initializeAnalytics.toString()})(${JSON.stringify(id)});`;
}

/** Runs only in the website, never in the published chart package. */
export function initializeAnalytics(id) {
  if (location.hostname !== "kindui.dev" || window.kindAnalyticsInitialized) return;
  window.kindAnalyticsInitialized = true;
  const key = "kind-ui-analytics-consent";
  const blocked = navigator.globalPrivacyControl || navigator.doNotTrack === "1";
  let consent = "unknown";
  let loaded = false;
  let lastPath = "";
  try {
    consent = localStorage.getItem(key) ?? "unknown";
  } catch {
    // Storage restrictions must not break navigation or imply consent.
  }
  if (blocked) consent = "denied";
  function gtag() {
    // biome-ignore lint/complexity/noArguments: gtag consumes Arguments objects in its documented queue format.
    window.dataLayer.push(arguments);
  }
  function send(name, parameters = {}) {
    if (consent !== "granted" || blocked || !loaded) return;
    gtag("event", name, {
      ...parameters,
      page_location: location.origin + location.pathname,
    });
  }
  function pageView() {
    if (consent !== "granted" || blocked || lastPath === location.pathname) return;
    lastPath = location.pathname;
    send("page_view", { page_title: document.title });
  }
  function enable() {
    if (loaded || blocked) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    gtag("js", new Date());
    let referrer = "";
    try {
      referrer = new URL(document.referrer).origin;
    } catch {
      // Direct visits have no referrer.
    }
    gtag("config", id, {
      send_page_view: false,
      page_location: location.origin + location.pathname,
      page_referrer: referrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.append(script);
    pageView();
  }
  const panel = document.createElement("section");
  panel.setAttribute("aria-label", "Analytics preferences");
  panel.style.cssText =
    "position:fixed;bottom:12px;left:12px;z-index:1000;max-width:min(350px,calc(100vw - 24px));padding:12px;border:1px solid #aaa;border-radius:12px;background:Canvas;color:CanvasText;font:13px/1.5 system-ui;box-shadow:0 2px 12px #0001";
  const message = document.createElement("p");
  message.style.cssText = "margin:0 0 8px";
  message.textContent =
    "Allow Google Analytics to measure visits and chart usage? Optional; no advertising tracking.";
  const privacy = document.createElement("a");
  privacy.href = "/charts/docs/privacy/";
  privacy.textContent = "Privacy details";
  privacy.style.cssText = "color:inherit;margin-right:10px";
  panel.append(message, privacy);
  function button(label, action) {
    const element = document.createElement("button");
    element.type = "button";
    element.textContent = label;
    element.style.cssText =
      "font:inherit;color:inherit;background:Canvas;border:1px solid #aaa;border-radius:6px;padding:5px 9px;margin-right:6px;cursor:pointer";
    element.addEventListener("click", action);
    return element;
  }
  const preferences = button("Analytics preferences", () => {
    panel.hidden = false;
    preferences.hidden = true;
    decline.focus();
  });
  preferences.style.cssText += ";position:fixed;bottom:12px;left:12px;z-index:999";
  function choose(value) {
    consent = value;
    try {
      localStorage.setItem(key, value);
    } catch {
      // The choice still applies for this page.
    }
    panel.hidden = true;
    preferences.hidden = false;
    preferences.focus();
    if (value === "granted") enable();
    else if (loaded) {
      window[`ga-disable-${id}`] = true;
      location.reload();
    }
  }
  const decline = button("Decline", () => choose("denied"));
  const accept = button("Allow", () => choose("granted"));
  if (blocked) {
    message.textContent = "Analytics is disabled because your browser requests privacy.";
    panel.append(
      button("Close", () => {
        panel.hidden = true;
        preferences.hidden = false;
      }),
    );
  } else panel.append(decline, accept);
  panel.hidden = consent !== "unknown";
  preferences.hidden = !panel.hidden;
  document.body.append(panel, preferences);
  if (consent === "granted") enable();
  window.addEventListener("storage", (event) => {
    if (event.key !== key) return;
    consent = event.newValue ?? "unknown";
    if (consent !== "granted" && loaded) {
      window[`ga-disable-${id}`] = true;
      location.reload();
    } else if (consent === "granted") enable();
  });
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      setTimeout(pageView, 0);
      return result;
    };
  }
  window.addEventListener("popstate", () => setTimeout(pageView, 0));
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.hostname === "github.com") send("github_click");
    else if (url.hostname === "www.npmjs.com" || url.hostname === "npmjs.com") send("npm_click");
    else if (url.origin === location.origin && url.pathname.startsWith("/charts/docs")) {
      send("docs_navigation", { destination_path: url.pathname });
    }
  });
  window.addEventListener("kind-ui-copy", (event) => {
    if (["code", "prompt", "install", "markdown"].includes(event.detail)) {
      send("copy_example", { content_type: event.detail });
    }
  });
}
