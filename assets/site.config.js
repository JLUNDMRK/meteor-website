/**
 * Meteor website configuration (reference).
 * Values below are mirrored in the HTML pages. Update both when going live.
 * See README.md for the full deployment checklist.
 */
window.METEOR_SITE = {
  siteName: "Meteor",
  siteTagline: "Your movies. Your library.",
  siteUrl: "https://meteor.jlundmark.org",
  /** Mirrored in every page footer â€” bump both when you ship a site change. */
  websiteVersion: "0.3",
  websiteUpdated: "August 2026",
  packageId: "com.meteor.mediaplayer",
  // TODO: replace when the Play listing is live
  appStoreUrl: "https://play.google.com/store/apps/details?id=com.meteor.mediaplayer",
  supportEmail: "meteor@jlundmark.org",
  privacyEmail: "meteor@jlundmark.org",
  // App source is private â€” do not link a private issues URL from the public site.
  githubUrl: null,
  githubIssuesUrl: null,
  social: {
    // TODO: add when available
  },
  appStatus: "coming_soon", // "coming_soon" | "live"
  // Site is unlisted until launch: robots.txt Disallow + meta noindex,nofollow on all pages
  crawlable: false,
  policyEffectiveDate: "2026-08-15",
  metadataProviders: [
    {
      id: "omdb",
      name: "OMDb",
      enabled: true,
      homepage: "https://www.omdbapi.com/",
      attribution:
        "This product uses the OMDb API (CC BY-NC 4.0; personal / non-commercial). Metadata is cached only on the device. Film art may include Wikimedia Commons images.",
      notice: "Confirm enabled provider against the shipped Android build before publication.",
      logo: null,
    },
    {
      id: "tmdb",
      name: "TMDB",
      enabled: false,
      homepage: "https://www.themoviedb.org/",
      attribution:
        "This product uses the TMDB API but is not endorsed or certified by TMDB.",
      notice: "Enable only when the commercial / Pro build uses TMDB.",
      logo: null,
    },
  ],
};
