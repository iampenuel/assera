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
  ["Human decision-making", "The patient remains the decision-maker for every consequential action."],
] as const;

export function EditorialSections() {
  return (
    <div className="landing-editorial">
      <section id="how-it-works" className="landing-section how-section" aria-labelledby="how-title">
        <div className="section-intro">
          <p className="landing-kicker">HOW IT WORKS</p>
          <h2 id="how-title">From a hard-to-read denial<br />to a clear next step.</h2>
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
        <div className="approach-heading">
          <p className="landing-kicker">OUR APPROACH</p>
          <h2 id="approach-title">Clarity before automation.</h2>
          <p>Built for patients and the agents they choose—not for autonomous decision-making.</p>
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
          <div><dt>READ</dt><dd>Your agent may inspect information in the case workspace.</dd></div>
          <div><dt>PREPARE</dt><dd>Your agent may prepare material inside ASSERA when that capability is available.</dd></div>
          <div><dt>ACT</dt><dd>Consequential or external actions require your explicit approval.</dd></div>
        </dl>
        <p className="demo-disclaimer">
          ASSERA is a demonstration of healthcare access navigation using synthetic data.
          It does not provide medical or legal advice.
        </p>
      </section>
    </div>
  );
}
