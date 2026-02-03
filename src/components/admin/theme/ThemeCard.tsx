"use client";

import { Card, Button, Badge } from "@/components/ui";
import { ThemeTemplate } from "@/types/theme";

interface ThemeCardProps {
  theme: ThemeTemplate;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isActivating?: boolean;
}

export function ThemeCard({
  theme,
  onActivate,
  onEdit,
  onDelete,
  isActivating,
}: ThemeCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Color Preview Strip */}
      <div className="h-16 flex">
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.success }}
        />
        <div
          className="flex-1"
          style={{ backgroundColor: theme.colors.background }}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{theme.name}</h3>
            {theme.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {theme.description}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {theme.isActive && <Badge variant="success">Active</Badge>}
            {theme.isDefault && <Badge variant="secondary">Default</Badge>}
          </div>
        </div>

        {/* Dark Mode Preview */}
        {theme.darkMode && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-gray-800" />
            Dark mode enabled
          </div>
        )}

        {/* Meta */}
        <div className="text-xs text-muted-foreground">
          {theme.createdBy && <span>By {theme.createdBy.username}</span>}
          {theme.createdAt && (
            <span className="ml-2">
              Created {new Date(theme.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {!theme.isActive && (
            <Button
              size="sm"
              variant="primary"
              onClick={onActivate}
              disabled={isActivating}
              className="flex-1"
            >
              {isActivating ? "Activating..." : "Activate"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
            Edit
          </Button>
          {!theme.isDefault && !theme.isActive && (
            <Button size="sm" variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
