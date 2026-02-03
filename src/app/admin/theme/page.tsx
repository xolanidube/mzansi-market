"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button, Spinner, Modal } from "@/components/ui";
import { ThemeCard } from "@/components/admin/theme";
import { ThemeTemplate } from "@/types/theme";

export default function ThemeManagementPage() {
  const router = useRouter();
  const [themes, setThemes] = useState<ThemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    theme?: ThemeTemplate;
  }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await fetch("/api/admin/theme");
      if (response.ok) {
        const data = await response.json();
        setThemes(data);
      }
    } catch (error) {
      console.error("Failed to fetch themes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (themeId: string) => {
    setActivating(themeId);
    try {
      const response = await fetch(`/api/admin/theme/${themeId}/activate`, {
        method: "POST",
      });
      if (response.ok) {
        await fetchThemes();
        // Refresh the page to apply new theme
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to activate theme");
      }
    } catch (error) {
      console.error("Failed to activate theme:", error);
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.theme) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/theme/${deleteModal.theme.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchThemes();
        setDeleteModal({ open: false });
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete theme");
      }
    } catch (error) {
      console.error("Failed to delete theme:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Theme Management</h1>
          <p className="text-muted-foreground">
            Customize the look and feel of your platform
          </p>
        </div>
        <Link href="/admin/theme/create">
          <Button variant="primary">+ Create New Theme</Button>
        </Link>
      </div>

      {themes.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            No themes created yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first custom theme to personalize your platform.
          </p>
          <Link href="/admin/theme/create">
            <Button variant="primary">Create First Theme</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onActivate={() => handleActivate(theme.id)}
              onEdit={() => router.push(`/admin/theme/${theme.id}`)}
              onDelete={() => setDeleteModal({ open: true, theme })}
              isActivating={activating === theme.id}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        title="Delete Theme"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete &quot;{deleteModal.theme?.name}&quot;?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner size="sm" /> : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
