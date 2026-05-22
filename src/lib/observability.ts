/**
 * Observability surface for the Lumecon site.
 *
 * Provides a vendor-agnostic API that wraps Datadog RUM (or any
 * equivalent browser RUM SDK). The API surface is stable, so call
 * sites — analytics tracking in the Cedar chat, contact form, demo
 * pages, errors caught in the API client — don't need to know
 * which vendor is wired underneath, or whether one is wired at all.
 *
 * Today: every `track*` call is a no-op unless the SDK is installed
 * and configured. The page ships zero observability JS by default,
 * so the bundle stays small.
 *
 * To go live with Datadog:
 *   1. `npm install @datadog/browser-rum`
 *   2. Set these env vars in the build environment:
 *        PUBLIC_DATADOG_APPLICATION_ID
 *        PUBLIC_DATADOG_CLIENT_TOKEN
 *        PUBLIC_DATADOG_SITE        (e.g., datadoghq.com)
 *        PUBLIC_DATADOG_SERVICE     (e.g., lumecon-site)
 *        PUBLIC_DATADOG_ENV         (production | staging | preview)
 *   3. Uncomment the `import` + init lines inside `initObservability()`
 *      below (search for "WIRE-UP").
 *   4. Extend BaseLayout.astro's CSP `connect-src` directive to allow
 *      `https://*.datadoghq.com` (or whatever DATADOG_SITE resolves
 *      to) so the RUM beacon can post events.
 *
 * Until step 1 is done, the dynamic import line is commented out so
 * `astro build` doesn't fail to resolve a package that isn't
 * installed.
 */

type Primitive = string | number | boolean | null | undefined;
type Attrs = Record<string, Primitive | Primitive[]>;

interface ObservabilityConfig {
  applicationId: string;
  clientToken: string;
  site: string;
  service: string;
  env: string;
}

interface ObservabilityClient {
  addAction(name: string, attrs?: Attrs): void;
  addError(err: unknown, attrs?: Attrs): void;
  setUser(props: { id?: string; email?: string; name?: string } & Attrs): void;
}

/* Reads PUBLIC_* env vars at build time. Returns null if any are
   missing — keeps the wire-up explicit (all five or nothing). */
const readConfig = (): ObservabilityConfig | null => {
  const env = import.meta.env;
  const cfg = {
    applicationId: env.PUBLIC_DATADOG_APPLICATION_ID,
    clientToken:   env.PUBLIC_DATADOG_CLIENT_TOKEN,
    site:          env.PUBLIC_DATADOG_SITE,
    service:       env.PUBLIC_DATADOG_SERVICE,
    env:           env.PUBLIC_DATADOG_ENV,
  };
  if (!cfg.applicationId || !cfg.clientToken || !cfg.site || !cfg.service || !cfg.env) {
    return null;
  }
  return cfg as ObservabilityConfig;
};

let client: ObservabilityClient | null = null;
let initPromise: Promise<void> | null = null;
let warnedUnconfigured = false;

/* No-op client used when the SDK is missing or env is unset. Keeps
   call sites simple — they always have something to call. */
const NOOP: ObservabilityClient = {
  addAction: () => {},
  addError: () => {},
  setUser: () => {},
};

/**
 * Initialize the observability SDK. Idempotent; safe to call from
 * multiple page-load hooks (astro:page-load fires on every view
 * transition).
 *
 * Honours Do Not Track — if the visitor has DNT enabled, no SDK is
 * loaded and the client stays a no-op.
 */
export function initObservability(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (typeof window === 'undefined') return;
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
      client = NOOP;
      return;
    }
    const cfg = readConfig();
    if (!cfg) {
      client = NOOP;
      if (!warnedUnconfigured && typeof console !== 'undefined') {
        warnedUnconfigured = true;
        // One-time hint in dev; muted in production builds.
        if (import.meta.env.DEV) console.info('[observability] Datadog env vars not set; tracking is a no-op.');
      }
      return;
    }

    /* WIRE-UP: when @datadog/browser-rum is installed, replace the
       NOOP assignment below with the real SDK init. The shape is:

         const { datadogRum } = await import('@datadog/browser-rum');
         datadogRum.init({
           applicationId: cfg.applicationId,
           clientToken: cfg.clientToken,
           site: cfg.site,
           service: cfg.service,
           env: cfg.env,
           sessionSampleRate: 100,
           sessionReplaySampleRate: 0,  // turn on later for replay
           trackUserInteractions: true,
           trackResources: true,
           trackLongTasks: true,
           defaultPrivacyLevel: 'mask-user-input',
         });
         client = {
           addAction: (name, attrs) => datadogRum.addAction(name, attrs),
           addError: (err, attrs) => datadogRum.addError(err, attrs),
           setUser: (props) => datadogRum.setUser(props),
         };

       Until then, ship as no-op so the bundle stays small and the
       build doesn't depend on an uninstalled package. */
    client = NOOP;
  })();
  return initPromise;
}

/** Track a custom action (page view, button click, chat send, etc). */
export function trackEvent(name: string, attrs?: Attrs): void {
  (client ?? NOOP).addAction(name, attrs);
}

/** Track an error caught in a try/catch or a Promise.catch. */
export function trackError(err: unknown, attrs?: Attrs): void {
  (client ?? NOOP).addError(err, attrs);
}

/** Identify the current visitor (call after the visitor authenticates
 *  against the future API). Until then, calling this is a no-op. */
export function identifyUser(props: { id?: string; email?: string; name?: string } & Attrs): void {
  (client ?? NOOP).setUser(props);
}

/** Test/escape hatch — lets tests inject a fake client. */
export function __setObservabilityClient(c: ObservabilityClient | null): void {
  client = c ?? NOOP;
}
