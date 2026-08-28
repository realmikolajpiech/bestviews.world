import type { Metadata } from 'next';
import ProfilePage from './profile-page';

export const metadata: Metadata = {
  title: 'Your views — BestViews.world',
  description: 'The views you have experienced, saved, and shared.',
};

export default function Page() {
  return <ProfilePage />;
}
