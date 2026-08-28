import Image from "next/image";
import { SiteNav } from "./site-nav";

export function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-heading">
      <Image
        className="hero-photo"
        src="/media/assera-hero-background.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
      />
      <div className="hero-shade" aria-hidden="true" />
      <SiteNav />

      <div className="hero-copy">
        <p className="hero-eyebrow">PATIENT-SIDE HEALTHCARE ACCESS</p>
        <h1 id="hero-heading">A denial isn&apos;t<br />the final word.</h1>
        <p className="hero-body">
          Understand what happened, see what&apos;s missing, and prepare the next
          step with your agent—while you stay in control.
        </p>
        <div className="hero-actions">
          <a className="hero-primary-action" href="/case/NS-PA-48291">
            Open Maya&apos;s case <span aria-hidden="true">→</span>
          </a>
          <a className="hero-secondary-action" href="#how-it-works">
            See how ASSERA works
          </a>
        </div>
      </div>

      <p className="hero-word" aria-hidden="true">ASSERA</p>
      <div className="hero-principles">
        <p>READ <span>·</span> PREPARE <span>·</span> ACT</p>
        <small>You approve consequential actions.</small>
      </div>
    </section>
  );
}
