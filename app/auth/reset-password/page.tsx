import type { Metadata } from 'next';
import ResetPasswordForm from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reset your password — BestViews.world',
  description: 'Choose a new password for your BestViews.world account.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
