import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-primary/20">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-2 -mt-4">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. The page
          might have been removed, renamed, or doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button>Go home</Button>
          </Link>
          <Link href="/services">
            <Button variant="outline">Browse services</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
