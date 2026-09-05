# BestViews.world

**The best exact viewpoints in the world** — discover memorable views shared by people who stood there, with precise coordinates you can revisit.

Live site: [bestviews.world](https://bestviews.world) · Deploy: [bestviewsworld.vercel.app](https://bestviewsworld.vercel.app)

## What it is

A Next.js app for exploring and sharing viewpoints on an interactive map. Contributors upload photos (with optional EXIF location/time), pick coordinates, and publish places others can open, save, and navigate to.

Features visible in the codebase:

- Explore map (MapLibre) with published viewpoints
- Photo upload with EXIF location / capture-time reading
- Auth, profiles, and moderation flows (Supabase)
- Categories such as sunsets, mountains, city lights, coastlines, and hidden gems

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · MapLibre GL · Supabase · Nominatim (geocoding)

## Run locally

Requires Node.js 22.x. Copy the example env file to a local env file and set Supabase URL plus publishable key, then:

Install dependencies, then start the Next.js dev server (see package.json scripts: dev, build, start, lint).

Open http://localhost:3000

## License

Private / all rights reserved unless otherwise stated.
