"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Save, Loader2, X } from "lucide-react";

interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  chargeTime: string;
  category: string;
  subcategory: string;
  duration: string;
  tags: string[];
}

interface ServiceFormProps {
  initialData?: Partial<ServiceFormData> & { id?: string };
  onSuccess?: () => void;
}

const categories = [
  { value: "beauty", label: "Beauty & Wellness", subcategories: ["Hair", "Nails", "Makeup", "Spa", "Skincare"] },
  { value: "home", label: "Home Services", subcategories: ["Cleaning", "Plumbing", "Electrical", "Painting", "Gardening"] },
  { value: "automotive", label: "Automotive", subcategories: ["Repairs", "Detailing", "Towing", "Parts"] },
  { value: "tech", label: "Technology", subcategories: ["Computer Repair", "Phone Repair", "Web Development", "IT Support"] },
  { value: "education", label: "Education & Tutoring", subcategories: ["Academic", "Languages", "Music", "Skills Training"] },
  { value: "health", label: "Health & Fitness", subcategories: ["Personal Training", "Nutrition", "Therapy", "Yoga"] },
  { value: "events", label: "Events & Entertainment", subcategories: ["Photography", "DJ", "Catering", "Decor"] },
  { value: "professional", label: "Professional Services", subcategories: ["Legal", "Accounting", "Consulting", "Writing"] },
  { value: "other", label: "Other", subcategories: [] },
];

const chargeTimeOptions = [
  { value: "HOURLY", label: "Per Hour" },
  { value: "DAILY", label: "Per Day" },
  { value: "FIXED", label: "Fixed Price" },
  { value: "NEGOTIABLE", label: "Negotiable" },
];

export function ServiceForm({ initialData, onSuccess }: ServiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState<ServiceFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    chargeTime: initialData?.chargeTime || "FIXED",
    category: initialData?.category || "",
    subcategory: initialData?.subcategory || "",
    duration: initialData?.duration?.toString() || "",
    tags: initialData?.tags || [],
  });

  const selectedCategory = categories.find((c) => c.value === formData.category);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");

    // Reset subcategory when category changes
    if (name === "category") {
      setFormData((prev) => ({ ...prev, subcategory: "" }));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = initialData?.id
        ? `/api/services/${initialData.id}`
        : "/api/services";
      const method = initialData?.id ? "PATCH" : "POST";

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        chargeTime: formData.chargeTime,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        tags: formData.tags,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save service");
      }

      setSuccess(data.message || "Service saved successfully");

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push("/dashboard/services");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Service Details</h3>

        <Input
          label="Service Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., Haircut and Styling"
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          placeholder="Describe what this service includes..."
        />
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pricing</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Price (ZAR)"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            required
            placeholder="0.00"
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">Charge Type</label>
            <select
              name="chargeTime"
              value={formData.chargeTime}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {chargeTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Duration (minutes)"
          name="duration"
          type="number"
          min="0"
          value={formData.duration}
          onChange={handleChange}
          placeholder="e.g., 60"
          helperText="How long does this service typically take?"
        />
      </div>

      {/* Category */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Category</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Subcategory</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a subcategory</option>
                {selectedCategory.subcategories.map((sub) => (
                  <option key={sub} value={sub.toLowerCase()}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tags</h3>
        <p className="text-sm text-muted-foreground">
          Add up to 5 tags to help customers find your service
        </p>

        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={formData.tags.length >= 5}
          >
            Add
          </Button>
        </div>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {initialData?.id ? "Update Service" : "Create Service"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
