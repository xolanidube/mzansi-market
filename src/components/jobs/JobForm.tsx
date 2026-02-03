"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Save, Loader2, X } from "lucide-react";

interface JobFormData {
  title: string;
  description: string;
  categoryId: string;
  subCategory: string;
  skills: string[];
  jobType: string;
  customJobType: string;
  budgetMin: string;
  budgetMax: string;
  estimatedBudget: string;
  deliveryDays: string;
  preferredLocation: string;
}

interface JobFormProps {
  initialData?: Partial<JobFormData> & { id?: string };
  onSuccess?: () => void;
}

const jobTypes = [
  { value: "FIX", label: "Fixed Price" },
  { value: "HOURLY", label: "Hourly Rate" },
  { value: "FREELANCE", label: "Freelance Project" },
  { value: "FULLTIME", label: "Full-time Position" },
  { value: "PARTTIME", label: "Part-time Position" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "TEMPORARY", label: "Temporary Work" },
  { value: "CUSTOM", label: "Custom/Other" },
];

const categories = [
  { value: "", label: "Select a category" },
  { value: "tech", label: "Technology & IT" },
  { value: "design", label: "Design & Creative" },
  { value: "writing", label: "Writing & Content" },
  { value: "marketing", label: "Marketing & Sales" },
  { value: "admin", label: "Admin & Support" },
  { value: "finance", label: "Finance & Accounting" },
  { value: "engineering", label: "Engineering" },
  { value: "education", label: "Education & Training" },
  { value: "other", label: "Other" },
];

export function JobForm({ initialData, onSuccess }: JobFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || "",
    subCategory: initialData?.subCategory || "",
    skills: initialData?.skills || [],
    jobType: initialData?.jobType || "FIX",
    customJobType: initialData?.customJobType || "",
    budgetMin: initialData?.budgetMin?.toString() || "",
    budgetMax: initialData?.budgetMax?.toString() || "",
    estimatedBudget: initialData?.estimatedBudget || "",
    deliveryDays: initialData?.deliveryDays?.toString() || "",
    preferredLocation: initialData?.preferredLocation || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skills.includes(skill) && formData.skills.length < 10) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = initialData?.id
        ? `/api/jobs/${initialData.id}`
        : "/api/jobs";
      const method = initialData?.id ? "PATCH" : "POST";

      const payload = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId || undefined,
        subCategory: formData.subCategory || undefined,
        skills: formData.skills,
        jobType: formData.jobType,
        customJobType: formData.jobType === "CUSTOM" ? formData.customJobType : undefined,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        estimatedBudget: formData.estimatedBudget || undefined,
        deliveryDays: formData.deliveryDays ? parseInt(formData.deliveryDays) : undefined,
        preferredLocation: formData.preferredLocation || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save job");
      }

      setSuccess(data.message || "Job saved successfully");

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push("/dashboard/jobs");
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
        <h3 className="text-lg font-medium">Job Details</h3>

        <Input
          label="Job Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., Build a mobile app for e-commerce"
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={6}
          placeholder="Describe the job in detail. Include requirements, deliverables, and any relevant information..."
        />
      </div>

      {/* Category and Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Category & Type</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Job Type</label>
            <select
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {jobTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.jobType === "CUSTOM" && (
          <Input
            label="Custom Job Type"
            name="customJobType"
            value={formData.customJobType}
            onChange={handleChange}
            placeholder="Describe the job type"
          />
        )}
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Required Skills</h3>
        <p className="text-sm text-muted-foreground">
          Add up to 10 skills that are relevant to this job
        </p>

        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Add a skill"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addSkill}
            disabled={formData.skills.length >= 10}
          >
            Add
          </Button>
        </div>

        {formData.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Budget</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Minimum Budget (ZAR)"
            name="budgetMin"
            type="number"
            min="0"
            value={formData.budgetMin}
            onChange={handleChange}
            placeholder="0"
          />

          <Input
            label="Maximum Budget (ZAR)"
            name="budgetMax"
            type="number"
            min="0"
            value={formData.budgetMax}
            onChange={handleChange}
            placeholder="0"
          />

          <Input
            label="Or Estimated Budget"
            name="estimatedBudget"
            value={formData.estimatedBudget}
            onChange={handleChange}
            placeholder="e.g., Negotiable"
          />
        </div>
      </div>

      {/* Timeline and Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Timeline & Location</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Expected Delivery (days)"
            name="deliveryDays"
            type="number"
            min="1"
            value={formData.deliveryDays}
            onChange={handleChange}
            placeholder="e.g., 14"
          />

          <Input
            label="Preferred Location"
            name="preferredLocation"
            value={formData.preferredLocation}
            onChange={handleChange}
            placeholder="e.g., Remote, Johannesburg"
          />
        </div>
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
              {initialData?.id ? "Update Job" : "Post Job"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
