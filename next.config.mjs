import withSerwist from '@serwist/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
})(nextConfig);
