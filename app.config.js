// Extends app.json. The GitHub Pages build serves the web app from /<repo>, so it sets
// EXPO_BASE_URL; local development and the phone app are served from the root.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : null),
  },
});
