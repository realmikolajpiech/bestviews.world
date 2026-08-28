import Link from 'next/link';

export default function SiteBrand({ className = '' }: { className?: string }) {
  return (
    <Link className={`site-brand ${className}`.trim()} href="/" aria-label="BestViews.world home">
      <img src="/bestviews-logo.png" alt="" aria-hidden="true" />
      <span>BestViews<span>.world</span></span>
    </Link>
  );
}
