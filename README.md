# MashX

> Browser-based Mash distance tool for rapid species identification — no server required.

MashX is a browser-based Mash distance tool for rapid species identification and contamination screening. Upload one or more bacterial genome assemblies in FASTA format, choose a sketch database, and find the closest matching reference genomes — all computed locally using WebAssembly. No installation or data upload required.

## Features

- Rapid species identification against reference genome databases
- Multi-sample batch processing — screen any number of assemblies at once
- Results ranked by Mash distance with taxonomy annotation
- Multiple reference databases (Kalamari, RefSeq representatives, and more)
- CSV export of all results
- Works offline after first database download — databases cached in browser

## Tech Stack

- **Mash** — MinHash distance estimation (via Aioli/biowasm WebAssembly)
- **React + Vite** — frontend framework
- **Cloudflare Pages + R2** — hosting and database storage

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Running Tests

```bash
npm test           # unit tests
npm run test:e2e   # end-to-end tests (requires build first)
```

## Contributing

Contributions welcome. Please open an issue first to discuss changes.

## License

GPL-3.0-only — see [LICENSE](LICENSE)
