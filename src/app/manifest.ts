import type { MetadataRoute } from "next";

// Lets the app be installed to a phone's home screen (Android "Add to Home
// Screen", iOS "Add to Home Screen"). Colours match the tokens in
// src/app/globals.css and the themeColor in src/app/layout.tsx.
//
// start_url points at /dashboard rather than / so that launching the installed
// app lands inside it. An anonymous request to /dashboard is already sent to
// /login by the route gate in src/proxy.ts, so no extra logic is needed here.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Hub",
    short_name: "Family Hub",
    description:
      "A simple, stylish home for your family's chores, points and rewards.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0912",
    theme_color: "#0a0912",
    categories: ["lifestyle", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Android crops this one to the launcher's shape, so the artwork sits
        // inside the 80% safe zone — see public/icon-maskable.svg.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}