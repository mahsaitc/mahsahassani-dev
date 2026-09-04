import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Aurora } from '@/components/fx/aurora';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative grid min-h-[85svh] place-items-center overflow-hidden">
      <Aurora />
      <div className="container relative text-center">
        <p className="font-display text-[22vw] leading-none gold-text md:text-[12rem]">404</p>
        <h1 className="mt-4 font-display text-3xl text-foreground md:text-4xl">
          That route was never registered.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          The page you asked for does not exist — or it moved somewhere with a better name.
        </p>
        <Button asChild size="lg" className="mt-9">
          <Link href="/">
            <ArrowLeft />
            Back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
