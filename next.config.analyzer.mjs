// This file is used to configure Next.js with the bundle analyzer.
// It should only be used when running the 'analyze' script.

import withBundleAnalyzer from '@next/bundle-analyzer';
import nextConfig from './next.config.mjs'; // Import the main clean config

const analyzer = withBundleAnalyzer({
  enabled: true, // The analyzer is always enabled when this config is used
});

export default analyzer(nextConfig);
