import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileCheck2, TriangleAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — BestViews.world',
  description: 'The terms for using and contributing to BestViews.world.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <nav className="legal-nav" aria-label="Terms page navigation">
        <Link href="/"><ArrowLeft size={17} /> BestViews.world</Link>
        <div className="legal-nav-links"><Link href="/privacy">Privacy</Link><span aria-current="page">Terms</span></div>
      </nav>

      <article className="legal-document">
        <header className="legal-hero">
          <FileCheck2 size={32} aria-hidden="true" />
          <h1>Terms for sharing the view.</h1>
          <p>The simple rules that keep BestViews.world useful, safe, and personal.</p>
          <small>Last updated August 28, 2026</small>
        </header>

        <div className="legal-promises" aria-label="Terms highlights">
          <div><strong>You keep ownership of what you create.</strong><span>You give us permission to display and operate the content you choose to share.</span></div>
          <div><TriangleAlert size={20} /><strong>Real places require judgment.</strong><span>Conditions, access, and safety can change. Always follow local rules and assess the situation yourself.</span></div>
        </div>

        <section>
          <h2>Agreement</h2>
          <p>These Terms of Service govern your access to BestViews.world. By using the service or creating an account, you agree to these Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the service.</p>
          <p>You must be at least 13 years old, or older if the law where you live requires a higher minimum age. If you use BestViews.world for an organization, you confirm that you have authority to accept these Terms for it.</p>
        </section>

        <section>
          <h2>Your account</h2>
          <p>You may sign in through a supported third-party provider. Keep access to that account secure and provide accurate information. You are responsible for activity performed through your BestViews.world account. Contact <a href="mailto:support@mikolajpiech.com">support@mikolajpiech.com</a> if you believe your account is being misused.</p>
        </section>

        <section>
          <h2>What you may contribute</h2>
          <p>You may submit viewpoints, exact coordinates, directions to look, photos, captions, tips, collections, and other community content. Only submit material you have the right to share. Photos should honestly represent the view and must not impersonate another person, mislead visitors, or conceal sponsorship.</p>
          <p>You remain responsible for your contributions and for any people, private property, personal information, or intellectual property shown in them.</p>
        </section>

        <section>
          <h2>Permission to use contributions</h2>
          <p>You keep ownership of your content. When you submit content, you grant BestViews.world a worldwide, non-exclusive, royalty-free license to host, store, reproduce, display, format, crop, adapt for different devices, distribute, and promote that content for operating, improving, and explaining the service. This permission includes showing your contribution with its location and your public profile.</p>
          <p>The license ends when your content is deleted, except where copies reasonably remain in backups, were shared by others through service features, must be retained by law, or where factual viewpoint information is kept in de-identified form to preserve the shared map.</p>
        </section>

        <section>
          <h2>Community rules</h2>
          <p>Do not use BestViews.world to:</p>
          <ul>
            <li>Submit false coordinates, stolen photos, fake experiences, undisclosed promotions, or duplicate spam.</li>
            <li>Encourage trespassing, damage, unsafe conduct, or activity that violates local restrictions.</li>
            <li>Post illegal, threatening, hateful, exploitative, sexually abusive, harassing, or privacy-invasive material.</li>
            <li>Upload malware, interfere with the service, scrape it abusively, evade access controls, or manipulate rankings.</li>
            <li>Collect or expose another person’s personal information without a lawful reason.</li>
          </ul>
        </section>

        <section>
          <h2>Moderation</h2>
          <p>Community submissions may be reviewed by moderators before or after publication. We may reject, correct, limit, de-rank, or remove content, and may warn, restrict, suspend, or close accounts when we reasonably believe content is illegal, unsafe, misleading, promotional spam, inaccurate, duplicative, or inconsistent with these Terms.</p>
          <p>We consider the nature, context, severity, frequency, and likely impact of a violation. You may ask us to review a moderation decision by emailing <a href="mailto:support@mikolajpiech.com?subject=BestViews.world%20moderation%20review">support@mikolajpiech.com</a> with the viewpoint or account involved and why you believe the decision should change.</p>
        </section>

        <section>
          <h2>Safety and access</h2>
          <p>BestViews.world helps people understand where a view may be experienced; it is not a safety, navigation, weather, or emergency service. Paths, roads, property boundaries, opening hours, transport, fees, accessibility, and local rules can change without notice. Weather, altitude, wildlife, water, traffic, darkness, and terrain may create serious risks.</p>
          <p>Check authoritative local information, respect closures and private property, use appropriate equipment, and turn back when conditions are unsafe. Never rely on a viewpoint listing as permission to enter a place.</p>
        </section>

        <section>
          <h2>Rankings and community information</h2>
          <p>Ratings, rankings, comparisons, tips, photographs, and practical details reflect community contributions and judgment. They may be incomplete, subjective, outdated, or wrong. Placement in a list is not an endorsement, guarantee, or professional recommendation.</p>
        </section>

        <section>
          <h2>Third-party services</h2>
          <p>The service may connect to maps, directions, social sign-in providers, transport information, or external websites. Those services are controlled by their respective providers and have their own terms and privacy policies. BestViews.world is not responsible for third-party services or content.</p>
        </section>

        <section>
          <h2>Our service and intellectual property</h2>
          <p>BestViews.world and its original design, software, branding, and service content are protected by intellectual property laws. These Terms do not transfer ownership of them to you. You may use the service for its intended personal and community purposes, but may not copy, resell, reverse engineer, or commercially exploit it except where the law allows.</p>
        </section>

        <section>
          <h2>Availability and changes</h2>
          <p>We may add, change, suspend, or discontinue features to maintain, secure, or improve the service. We do not promise that BestViews.world will always be available or error-free. Where applicable law gives you mandatory rights concerning a digital service, those rights are not limited by these Terms.</p>
        </section>

        <section>
          <h2>Ending your use</h2>
          <p>You may stop using BestViews.world at any time and may request account deletion as described in the <Link href="/privacy#deletion">Privacy Policy</Link>. We may restrict or terminate access for serious or repeated violations, legal requirements, security risks, or harm to the service or community. Where appropriate, we will provide reasons and an opportunity to request review.</p>
        </section>

        <section>
          <h2>Disclaimers and responsibility</h2>
          <p>To the extent permitted by law, BestViews.world is provided “as is” and “as available.” We do not guarantee the accuracy of community content, that a location is accessible or safe, or that a view will match a photograph or expectation.</p>
          <p>To the extent permitted by law, BestViews.world is not liable for indirect, incidental, special, consequential, or punitive losses arising from use of the service or visits to listed places. Nothing in these Terms excludes liability or consumer rights that cannot legally be excluded or limited.</p>
        </section>

        <section>
          <h2>Changes to these Terms</h2>
          <p>We may update these Terms as the service changes. Material updates will be identified by a new date on this page and, when required, by additional notice. Continuing to use the service after updated Terms take effect means you accept them, except where applicable law requires another form of consent.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Questions, reports, or disputes about these Terms can be sent to <a href="mailto:support@mikolajpiech.com">support@mikolajpiech.com</a>. These Terms do not take away mandatory protections available under the law where you live.</p>
        </section>
      </article>
    </main>
  );
}
