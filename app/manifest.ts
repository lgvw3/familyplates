import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Family Plates',
        short_name: 'VW Plates',
        description: 'The Van Wagoner family shared plates',
        start_url: '/',
        display: 'standalone',
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
            {
                "src": "/web-app-manifest-192x192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/web-app-manifest-512x512.png",
                "sizes": "256x256",
                "type": "image/png"
            }
        ],
    }
}