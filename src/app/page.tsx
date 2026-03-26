import { MarginCalculator } from '@/components/calculator';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <main className="bg-background">
      <Header />
      <div className="px-3 py-4 sm:px-4 sm:py-6">
        <MarginCalculator />
      </div>
    </main>
  );
}
