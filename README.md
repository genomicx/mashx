# mashx

Browser-based Mash distance tool for querying precompiled sketch databases. No data leaves your machine — all computation runs via WebAssembly.

## Getting started

```bash
npm install
npm run dev
```

## Adding databases

Edit `src/mashx/databases.ts` and append a new entry to the `DATABASES` array:

```ts
{
  id: 'my-database-v1',         // unique slug, used as cache key
  name: 'My Database',
  description: 'What it contains',
  url: 'https://your-cdn.example.com/my-database-v1.msh',  // must be CORS-accessible
  metaUrl: 'https://...tsv',    // optional: TSV with columns Assembly, TaxID, Name
  sizeBytes: 50_000_000,        // rough estimate for progress display
  version: 'v1.0',
  citation: 'Author et al. 2024. ...',
}
```

**CORS requirement:** The `.msh` URL must be served with permissive CORS headers (`Access-Control-Allow-Origin: *`). GitHub release assets do not support CORS. Host on Cloudflare R2, AWS S3, or any CDN with CORS enabled.

To bump the cache version (force all users to re-download), update `CACHE_VERSION` in `databases.ts`.

## Scripts

```bash
npm run dev          # development server
npm run build        # production build
npm run check        # test + lint + build
```

## License

GPL-3.0-only — Nabil-Fareed Alikhan <nabil@happykhan.com>
