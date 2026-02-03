"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ThemeEditor } from "@/components/admin/theme";
import { ThemeTemplate } from "@/types/theme";

export default function CreateThemePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (theme: Partial<ThemeTemplate>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/theme/${data.theme.id}`);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create theme");
      }
    } catch (error) {
      console.error("Failed to create theme:", error);
      alert("Failed to create theme");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/theme">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Theme</h1>
          <p className="text-muted-foreground">
            Design a custom theme for your platform
          </p>
        </div>
      </div>

      <ThemeEditor onSave={handleSave} isLoading={isLoading} />
    </div>
  );
}
