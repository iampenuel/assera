const steps = [
  ["01", "Understand the denial", "See the insurer’s source language beside a clear, patient-side explanation."],
  ["02", "Compare requirements with evidence", "Check the administrative requirements against the records already in the case."],
  ["03", "Prepare the next step", "Bring the missing details together in a structured, reviewable workspace."],
  ["04", "Approve consequential actions", "Nothing is sent or submitted until you explicitly approve it."],
] as const;

const approachPoints = [
  ["Source clarity", "Insurer source language stays separate from ASSERA’s explanation, so provenance is always visible."],
  ["Deterministic checks", "Administrative requirements are checked directly—never reduced to an appeal-success probability."],
  ["Structured agent access", "Your agent can use a purpose-built read tool instead of guessing its way through an interface."],
  ["Human decision‑making", "The patient remains the decision-maker for every consequential action."],
] as const;

const evidence = [
  ["4.1M", "prior-authorization requests denied in Medicare Advantage in 2024"],
  ["11.5%", "of denied requests were appealed"],
  ["80.7%", "of appeals were partially or fully overturned"],
] as const;

export function EditorialSections() {
  return (
    <div className="landing-editorial">
      <section className="evidence-section" aria-labelledby="evidence-title">
        <div className="evidence-intro">
          <p className="landing-kicker">WHY THIS MATTERS</p>
          <h2 id="evidence-title">Too few denials are ever challenged—even when appeals often succeed.</h2>
        </div>
        <dl className="evidence-grid">
          {evidence.map(([stat, detail]) => (
            <div key={stat}>
              <dt>{stat}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
        <p className="evidence-source">
          Medicare Advantage · 2024 · Source: KFF analysis of CMS Medicare Advantage data, 2024
        </p>
      </section>

      <section id="how-it-works" className="landing-section how-section" aria-labelledby="how-title">
        <div className="section-intro">
          <p className="landing-kicker">HOW IT WORKS</p>
          <h2 id="how-title">From a <span className="keep-together">hard-to-read</span> denial to a clear next step.</h2>
          <p>ASSERA keeps the work understandable, auditable, and under your control.</p>
        </div>
        <ol className="steps-list">
          {steps.map(([number, title, body]) => (
            <li key={number}>
              <span>{number}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section id="our-approach" className="landing-section approach-section" aria-labelledby="approach-title">
        <div className="approach-intro">
          <div className="approach-context">
            <p className="landing-kicker">OUR APPROACH</p>
            <p>Built for patients and the agents they choose—not for autonomous decision-making.</p>
          </div>
          <h2 id="approach-title">Clarity before automation.</h2>
        </div>
        <div className="approach-grid">
          {approachPoints.map(([title, body]) => (
            <article key={title}><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
      </section>

      <section id="safety" className="landing-section safety-section" aria-labelledby="safety-title">
        <div className="safety-copy">
          <p className="landing-kicker">SAFETY</p>
          <h2 id="safety-title">Agency stays with you.</h2>
          <p>ASSERA makes the boundary between reading, preparing, and acting unmistakable.</p>
        </div>
        <dl className="safety-levels">
          <div className="safety-read"><dt>READ</dt><span className="safety-rule" aria-hidden="true" /><dd>Your agent may inspect information in the case workspace.</dd></div>
          <div className="safety-prepare"><dt>PREPARE</dt><span className="safety-rule" aria-hidden="true" /><dd>Your agent may prepare material inside ASSERA when that capability is available.</dd></div>
          <div className="safety-act"><dt>ACT</dt><span className="safety-rule" aria-hidden="true" /><dd>Consequential or external actions require your explicit approval.</dd></div>
        </dl>
        <p className="demo-disclaimer">
          ASSERA is a demonstration of healthcare access navigation using synthetic data.
          It does not provide medical or legal advice.
        </p>
      </section>

      <section className="final-cta" aria-labelledby="final-cta-title">
        <p className="landing-kicker">A CLEAR NEXT STEP</p>
        <h2 id="final-cta-title">A denial isn&apos;t the final word.</h2>
        <p>See how ASSERA turns a denial into a clear next step.</p>
        <a className="final-cta-link" href="/case/NS-PA-48291">
          Open Maya&apos;s case <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>ASSERA</strong>
        <p>Healthcare access navigation<br />Synthetic demonstration</p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#our-approach">Our approach</a>
        <a href="#safety">Safety</a>
      </nav>
      <div className="footer-meta">
        <span>Human-centered healthcare access with WebMCP</span>
        <span>© 2026 ASSERA</span>
      </div>
    </footer>
  );
}
