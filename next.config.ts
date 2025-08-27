
import type {NextConfig} from 'next';
import dotenv from 'dotenv';

dotenv.config();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      }
    ],
  },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'es',
  },
  env: {
    NEXT_PUBLIC_EMAIL_HOST: process.env.NEXT_PUBLIC_EMAIL_HOST,
    NEXT_PUBLIC_EMAIL_PORT: process.env.NEXT_PUBLIC_EMAIL_PORT,
    NEXT_PUBLIC_EMAIL_USER: process.env.NEXT_PUBLIC_EMAIL_USER,
    NEXT_PUBLIC_EMAIL_PASS: process.env.NEXT_PUBLIC_EMAIL_PASS,
  }
};

export default nextConfig;
