"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Spinner, Badge } from "@/components/ui";
import { ThemeEditor } from "@/components/admin/theme";
import { ThemeTemplate } from "@/types/theme";

export default function EditThemePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchTheme();
  }, [id]);

  const fetchTheme = async () => {
    try {
      const response = await fetch(`/api/admin/theme/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTheme(data);
      } else {
        router.push("/admin/theme");
      }
    } catch (error) {
      console.error("Failed to fetch theme:", error);
      router.push("/admin/theme");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedTheme: Partial<ThemeTemplate>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/theme/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTheme),
      });

      if (response.ok) {
        const data = await response.json();
        setTheme(data.theme);
        // If this theme is active, reload to apply changes
        if (theme?.isActive) {
          window.location.reload();
        }
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update theme");
      }
    } catch (error) {
      console.error("Failed to update theme:", error);
      alert("Failed to update theme");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      const response = await fetch(`/api/admin/theme/${id}/activate`, {
        method: "POST",
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to activate theme");
      }
    } catch (error) {
      console.error("Failed to activate theme:", error);
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!theme) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/theme">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                Edit: {theme.name}
              </h1>
              {theme.isActive && <Badge variant="success">Active</Badge>}
              {theme.isDefault && <Badge variant="secondary">Default</Badge>}
            </div>
            <p className="text-muted-foreground">
              Modify theme settings and colors
            </p>
          </div>
        </div>

        {!theme.isActive && (
          <Button
            variant="primary"
            onClick={handleActivate}
            disabled={activating}
          >
            {activating ? <Spinner size="sm" /> : "Activate Theme"}
          </Button>
        )}
      </div>

      <ThemeEditor
        initialTheme={theme}
        onSave={handleSave}
        isLoading={saving}
      />
    </div>
  );
}
