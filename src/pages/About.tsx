import { Link } from 'react-router-dom'
import { DATABASES } from '../mashx/databases'

export function About() {
  return (
    <div className="about-page">
      <section>
        <h2>About MashX</h2>
        <p>
          MashX is a browser-based Mash distance tool for rapid species identification and
          contamination screening. Upload one or more bacterial genome assemblies in FASTA
          format, choose a sketch database, and find the closest matching reference genomes —
          all computed locally using WebAssembly.
        </p>
        <div className="privacy-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p>
            No data leaves your machine — all processing happens client-side using WebAssembly.
            Databases are cached in your browser after the first download.
          </p>
        </div>
      </section>

      <section>
        <h2>Features</h2>
        <ul>
          <li>Rapid species identification against reference genome databases</li>
          <li>Multi-sample batch processing — screen any number of assemblies at once</li>
          <li>Results ranked by Mash distance with taxonomy annotation</li>
          <li>Multiple reference databases (Kalamari, RefSeq representatives, and more)</li>
          <li>CSV export of all results</li>
          <li>Works offline after first database download — databases cached in browser</li>
        </ul>
      </section>

      <section>
        <h2>How it works</h2>
        <p>
          MashX sketches your query FASTA files using Mash (via WebAssembly), then computes
          MinHash distances against the selected precompiled sketch database. Results are
          sorted by Mash distance and annotated with taxonomy information where available.
        </p>
        <p>
          Mash distance is a MinHash-based approximation of the mutation rate between two
          sequences. Values close to 0 indicate high similarity; values above ~0.15 suggest
          distant or unrelated sequences.
        </p>
      </section>

      <section>
        <h2>Available Databases</h2>
        {DATABASES.map((db) => (
          <div key={db.id} className="about-db-entry">
            <h3>{db.name} <span className="db-version">{db.version}</span></h3>
            <p>{db.description}</p>
            {db.citation && <p className="about-citation">{db.citation}</p>}
          </div>
        ))}
        {DATABASES.length === 0 && (
          <p>No databases configured.</p>
        )}
      </section>

      <section>
        <h2>Technology</h2>
        <ul>
          <li><strong>Mash</strong> — MinHash distance estimation (via Aioli/biowasm WebAssembly)</li>
          <li><strong>React + Vite</strong> — frontend framework</li>
          <li><strong>Cloudflare Pages + R2</strong> — hosting and database storage</li>
        </ul>
      </section>

      <section>
        <h2>Citation</h2>
        <p>If you use MashX in your research, please cite:</p>
        <blockquote style={{ borderLeft: '4px solid var(--gx-accent)', paddingLeft: '1rem', color: 'var(--gx-text-muted)', fontStyle: 'italic', margin: '0.75rem 0' }}>
          Ondov BD, Treangen TJ, Melsted P, Mallonee AB, Bergman NH, Koren S, Phillippy AM.
          Mash: fast genome and metagenome distance estimation using MinHash.{' '}
          <em>Genome Biol.</em> 2016;17:132.
        </blockquote>
      </section>

      <section>
        <h2>Source Code</h2>
        <p>
          MashX is open-source software. Contributions and issues welcome on{' '}
          <a href="https://github.com/genomicx/mashx" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>.
        </p>
      </section>

      <section>
        <h2>About the Author</h2>
        <h3>Nabil-Fareed Alikhan</h3>
        <p className="about-role">
          Senior Bioinformatician, Centre for Genomic Pathogen Surveillance, University of Oxford
        </p>
        <p>
          Bioinformatics researcher and software developer specialising in microbial genomics.
          Builder of widely used open-source tools, peer-reviewed researcher, and co-host of
          the MicroBinfie podcast.
        </p>
        <div className="about-links">
          <a href="https://www.happykhan.com" target="_blank" rel="noopener noreferrer">happykhan.com</a>
          <a href="https://orcid.org/0000-0002-1243-0767" target="_blank" rel="noopener noreferrer">ORCID: 0000-0002-1243-0767</a>
          <a href="mailto:nabil@happykhan.com">nabil@happykhan.com</a>
          <a href="https://twitter.com/happy_khan" target="_blank" rel="noopener noreferrer">@happy_khan</a>
          <a href="https://mstdn.science/@happykhan" target="_blank" rel="noopener noreferrer">@happykhan@mstdn.science</a>
        </div>
      </section>

      <div style={{ marginTop: '1rem' }}>
        <Link to="/" style={{ color: 'var(--gx-accent)', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to Application
        </Link>
      </div>
    </div>
  )
}
