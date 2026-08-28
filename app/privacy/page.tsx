import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, LocateFixed, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — BestViews.world',
  description: 'How BestViews.world collects, uses, and protects personal information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <nav className="legal-nav" aria-label="Privacy page navigation">
        <Link href="/"><ArrowLeft size={17} /> BestViews.world</Link>
        <div className="legal-nav-links"><span aria-current="page">Privacy</span><Link href="/terms">Terms</Link></div>
      </nav>

      <article className="legal-document">
        <header className="legal-hero">
          <ShieldCheck size={32} aria-hidden="true" />
          <h1>Your privacy on BestViews.world.</h1>
          <p>What we collect, why we need it, and the choices you have.</p>
          <small>Last updated August 28, 2026</small>
        </header>

        <div className="legal-promises" aria-label="Privacy highlights">
          <div><strong>We do not sell your personal information.</strong><span>Your activity supports your experience and the community.</span></div>
          <div><LocateFixed size={20} /><strong>Near Me stays private.</strong><span>Your live location is used on your device and is not stored unless you choose to submit a viewpoint.</span></div>
        </div>

        <section>
          <h2>Who we are</h2>
          <p>BestViews.world is a community platform for discovering, saving, and sharing exact viewpoints. In this policy, “BestViews.world,” “we,” and “us” refer to the operator of the BestViews.world service.</p>
        </section>

        <section>
          <h2>Information we collect</h2>
          <h3>Account information</h3>
          <p>When you create an account with email and password, Supabase securely handles your email and authentication credentials; BestViews.world does not receive or store your readable password. When you continue with Google, we receive information made available by Google, such as your name, email address, profile image, and provider account identifier. We do not receive your Google password.</p>
          <h3>Things you choose to add</h3>
          <p>This includes viewpoints and their exact coordinates, photos, captions, practical tips, saved and visited places, collections, follows, and other community activity.</p>
          <h3>Location</h3>
          <p>If you choose Near Me or “I’m at the viewpoint now,” your browser provides your current location so the app can suggest a map pin. BestViews.world does not store this live location unless you submit the viewpoint. When you choose a photo to share, the app may read GPS coordinates and the original capture time embedded in that file on your device. If capture time is unavailable, it may show the file’s last-modified date as a clearly labeled fallback. If GPS is found or you use your current location, the coordinate is sent to OpenStreetMap’s Nominatim service to suggest the nearby region and country. Before upload, the visible image is re-created on your device without embedded metadata such as GPS, capture time, or device details. The processed photo and extracted details are stored by BestViews.world only when you deliberately submit the viewpoint.</p>
          <h3>Service and security information</h3>
          <p>Our hosting and authentication providers may process technical information such as IP address, browser and device details, request logs, cookies, and session identifiers to operate and secure the service.</p>
        </section>

        <section>
          <h2>How we use information</h2>
          <ul>
            <li>Provide accounts, saved views, visited places, collections, and community features.</li>
            <li>Display and map viewpoints, photos, profiles, and approved contributions.</li>
            <li>Review submissions, prevent duplicate or misleading locations, and moderate abuse or spam.</li>
            <li>Maintain security, diagnose problems, and improve the service.</li>
            <li>Comply with legal obligations and enforce our rules.</li>
          </ul>
          <p>Where applicable law requires a legal basis, we rely on performing our service agreement with you, our legitimate interests in operating and protecting the community, your consent where requested, and compliance with law.</p>
        </section>

        <section>
          <h2>What is public</h2>
          <p>BestViews.world is built for sharing. Viewpoints, coordinates, photos, tips, your display name, profile image, bio, location, and social link are public as soon as you add them. Public collections and follows are also visible to others. Saves, visited places, private collections, email addresses, and unfinished drafts are not public.</p>
        </section>

        <section>
          <h2>How information is shared</h2>
          <p>We use service providers to run BestViews.world, including Supabase for authentication, database, and file storage; Google when you use its sign-in option; and OpenStreetMap’s Nominatim service for nearby place lookup during viewpoint submission. They process information under their own terms and privacy commitments. We may also disclose information when required by law, to protect people or the service, or as part of a business transfer with appropriate safeguards. We do not sell personal information.</p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>We use cookies or similar browser storage that are necessary to keep you signed in, protect your session, and remember essential service state. If we introduce non-essential analytics or advertising cookies, we will provide any notice or choice required by law.</p>
        </section>

        <section>
          <h2>Retention</h2>
          <p>We keep account information while your account is active and retain other information only as long as reasonably necessary for the purposes described above. When an account is deleted, personal account data is removed or de-identified. Factual viewpoint submissions may remain without attribution so the shared map continues to work, unless removal is required by law.</p>
        </section>

        <section id="deletion">
          <h2>Access, correction, and deletion</h2>
          <p>You may ask to access, correct, export, or delete your personal information, or object to or restrict certain processing where applicable. To delete your BestViews.world account and associated personal information, email <a href="mailto:support@mikolajpiech.com?subject=BestViews.world%20account%20deletion">support@mikolajpiech.com</a> from the address connected to your account with the subject “Account deletion.” We may need to verify that you own the account before completing the request.</p>
          <p>You can also disconnect BestViews.world through the connected-app settings in your Google account. Disconnecting Google does not by itself delete your BestViews.world account; use the request above for full deletion. We will respond within the period required by applicable law.</p>
        </section>

        <section>
          <h2>International processing</h2>
          <p>Our providers may process information in countries other than your own. Where required, appropriate safeguards are used for international transfers of personal information.</p>
        </section>

        <section>
          <h2>Children</h2>
          <p>BestViews.world is not directed to children under 13, or a higher minimum age where local law requires it. If you believe a child has provided personal information, contact us so we can review and remove it.</p>
        </section>

        <section>
          <h2>Changes and contact</h2>
          <p>We may update this policy as the service evolves. Material changes will be identified by a new date on this page. Questions or privacy requests can be sent to <a href="mailto:support@mikolajpiech.com">support@mikolajpiech.com</a>.</p>
        </section>
      </article>
    </main>
  );
}
