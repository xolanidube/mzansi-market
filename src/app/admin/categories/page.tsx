"use client";

import { useState, useEffect } from "react";
import { Card, Button, Badge, Input, Spinner } from "@/components/ui";

interface Category {
  id: string;
  name: string;
  description: string | null;
  iconPath: string | null;
  isActive: boolean;
  createdAt: string;
  counts: {
    services: number;
    jobs: number;
    products: number;
    total: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIconPath, setFormIconPath] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [includeInactive]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        includeInactive: includeInactive.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/categories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCategories();
  };

  const openCreateModal = () => {
    setFormName("");
    setFormDescription("");
    setFormIconPath("");
    setFormIsActive(true);
    setEditingCategory(null);
    setShowCreateModal(true);
  };

  const openEditModal = (category: Category) => {
    setFormName(category.name);
    setFormDescription(category.description || "");
    setFormIconPath(category.iconPath || "");
    setFormIsActive(category.isActive);
    setEditingCategory(category);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingCategory) {
        // Update existing category
        const response = await fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: editingCategory.id,
            name: formName,
            description: formDescription || undefined,
            iconPath: formIconPath || undefined,
            isActive: formIsActive,
          }),
        });

        if (response.ok) {
          closeModal();
          fetchCategories();
        } else {
          const data = await response.json();
          alert(data.error || "Failed to update category");
        }
      } else {
        // Create new category
        const response = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            description: formDescription || undefined,
            iconPath: formIconPath || undefined,
            isActive: formIsActive,
          }),
        });

        if (response.ok) {
          closeModal();
          fetchCategories();
        } else {
          const data = await response.json();
          alert(data.error || "Failed to create category");
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.id,
          isActive: !category.isActive,
        }),
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error toggling category:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.filter((c) => !c.isActive).length;
  const totalItems = categories.reduce((sum, c) => sum + c.counts.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Category Management</h1>
          <p className="text-muted-foreground">Manage service, job, and product categories</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Categories</p>
          <p className="text-2xl font-bold text-foreground">{categories.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-success">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-muted-foreground">{inactiveCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold text-primary">{totalItems}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Show inactive</span>
          </label>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </Card>

      {/* Categories Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories found</p>
            <Button variant="primary" className="mt-4" onClick={openCreateModal}>
              Create First Category
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Items</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className={`hover:bg-secondary/30 ${!category.isActive ? "opacity-60" : ""}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {category.iconPath ? (
                          <img
                            src={category.iconPath}
                            alt={category.name}
                            className="w-8 h-8 rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-secondary rounded flex items-center justify-center text-muted-foreground">
                            {category.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {category.description || "No description"}
                      </span>
                    </td>
                    <td className="p-4">
                      {category.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="text-foreground">{category.counts.total} total</p>
                        <p className="text-muted-foreground">
                          {category.counts.services} services, {category.counts.jobs} jobs, {category.counts.products} products
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(category)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={category.isActive ? "danger" : "success"}
                          onClick={() => handleToggleActive(category)}
                          disabled={actionLoading}
                        >
                          {category.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        {category.counts.total === 0 && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(category)}
                            disabled={actionLoading}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingCategory ? "Edit Category" : "Create Category"}
                </h2>
                <Button variant="ghost" size="sm" type="button" onClick={closeModal}>
                  ✕
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category Name *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Hair & Beauty"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                  rows={3}
                  placeholder="Brief description of this category..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Icon URL
                </label>
                <Input
                  value={formIconPath}
                  onChange={(e) => setFormIconPath(e.target.value)}
                  placeholder="https://example.com/icon.png"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Category is active</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" type="button" onClick={closeModal}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={actionLoading || !formName.trim()}>
                  {actionLoading ? (
                    <Spinner size="sm" />
                  ) : editingCategory ? (
                    "Save Changes"
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
