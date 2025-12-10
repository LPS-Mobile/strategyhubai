import { NextConfig } from 'next';

// --- Security Configuration: Content Security Policy (CSP) ---
const createContentSecurityPolicy = (isDevelopment: boolean) => {
  let csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com/ https://www.googleapis.com/ https://apis.google.com/ https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    
    img-src 'self' data: 
            https://firebasestorage.googleapis.com/ 
            https://img.youtube.com/ 
            https://i.ytimg.com/ 
            https://mock.firebase.storage.url/
            https://i.imgur.com/
            https://placehold.co/; /* ADDED: Placeholder service */
            
    font-src 'self';
    connect-src 'self' https://identitytoolkit.googleapis.com/ https://securetoken.googleapis.com/ https://firestore.googleapis.com/ https://storage.googleapis.com/ https://www.googleapis.com/ https://*.firebaseapp.com https://*.firebaseio.com https://api.stripe.com ws://localhost:3000 wss://localhost:3000;
    frame-src 'self' https://securetoken.googleapis.com/ https://accounts.google.com/ https://*.firebaseapp.com https://js.stripe.com https://hooks.stripe.com;
    object-src 'none';
    base-uri 'self';
  `;

  if (isDevelopment) {
    csp += "script-src-elem 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com/ https://www.googleapis.com/ https://apis.google.com/ https://js.stripe.com blob:;";
  } else {
    csp += "script-src-elem 'self' 'unsafe-inline' https://www.gstatic.com/ https://www.googleapis.com/ https://apis.google.com/ https://js.stripe.com;";
  }

  return csp.replace(/\s{2,}/g, ' ').trim();
};

const nextConfig: NextConfig = {
  // --- Webpack Configuration ---
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false };
    }
    return config;
  },

  // --- Image Configuration (YouTube + Firebase + Imgur + Placeholders) ---
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'mock.firebase.storage.url',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      // --- ADDED: Placeholder service ---
      {
        protocol: 'https' as const,
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // --- Headers for CSP Injection AND COOP FIX ---
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const csp = createContentSecurityPolicy(isDevelopment);

    const headersList = [
      {
        key: 'Content-Security-Policy',
        value: csp,
      },
    ];

    if (isDevelopment) {
      headersList.push({
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      });
    }

    return [
      {
        source: '/(.*)',
        headers: headersList,
      },
    ];
  },
};

export default nextConfig;