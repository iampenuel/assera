// Keep this module dependency-free so vinext can load it without resolving the
// full Next.js compatibility package during local startup.
export default {
  // vinext streams dynamic metadata into a hidden body container. Keep favicon
  // links in the initial head so Chrome can discover them before hydration.
  htmlLimitedBots: /.*/,
};
