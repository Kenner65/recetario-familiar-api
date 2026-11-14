import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (y sus dependencias de gRPC/Firestore) deben cargarse desde
  // node_modules en runtime y no empaquetarse con Turbopack.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
