/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint is run separately via `npm run lint`. Backend API routes have
    // pre-existing lint issues that should be fixed when the backend is implemented.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
