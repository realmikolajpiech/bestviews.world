import { getChatGPTUser } from './chatgpt-auth';
import ExploreApp from './explore-app';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getChatGPTUser();
  return <ExploreApp userName={user?.displayName ?? null} />;
}
