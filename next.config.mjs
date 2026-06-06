/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large JSON bodies for bulk result uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default nextConfig
