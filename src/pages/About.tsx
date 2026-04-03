import { DATABASES } from '../mashx/databases'

export function About() {
  return (
    <div className="about-page">
      <section>
        <h2>About mashx</h2>
        <p>
          mashx is a browser-based Mash distance tool. Upload one or more FASTA
          files, choose a sketch database, and find the closest matching
          reference genomes — all computed locally using WebAssembly.
        </p>
        <div className="privacy-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p>
            No data leaves your machine — all processing happens client-side
            using WebAssembly. Databases are cached in your browser after the
            first download.
          </p>
        </div>
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
          <p>No databases configured. Add entries to <code>src/mashx/databases.ts</code>.</p>
        )}
      </section>

      <section>
        <h2>How it works</h2>
        <p>
          mashx sketches your query FASTA files using Mash (via WebAssembly), then
          computes distances against the selected precompiled sketch database.
          Results are sorted by Mash distance and annotated with taxonomy
          information where available.
        </p>
        <p>
          Mash distance is a MinHash-based approximation of the mutation rate
          between two sequences. Values close to 0 indicate high similarity;
          values above ~0.15 suggest distant or unrelated sequences.
        </p>
      </section>

      <section>
        <h2>About the Author</h2>
        <h3>Nabil-Fareed Alikhan</h3>
        <p className="about-role">
          Senior Bioinformatician, Centre for Genomic Pathogen Surveillance,
          University of Oxford
        </p>
        <div className="about-links">
          <a href="https://www.happykhan.com" target="_blank" rel="noopener noreferrer">happykhan.com</a>
          <a href="https://orcid.org/0000-0002-1243-0767" target="_blank" rel="noopener noreferrer">ORCID</a>
          <a href="mailto:nabil@happykhan.com">nabil@happykhan.com</a>
          <a href="https://twitter.com/happy_khan" target="_blank" rel="noopener noreferrer">@happy_khan</a>
        </div>
      </section>
    </div>
  )
}
