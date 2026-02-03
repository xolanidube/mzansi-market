"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Save, Loader2, Upload, FileText, X, ExternalLink } from "lucide-react";

interface ShopFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  openingHours: string;
  closingHours: string;
  workingDays: string;
  tax: string;
  contact: string;
  registrationDocument: string;
}

interface ShopFormProps {
  initialData?: Partial<ShopFormData> & { id?: string };
  onSuccess?: () => void;
}

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export function ShopForm({ initialData, onSuccess }: ShopFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ShopFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    province: initialData?.province || "",
    postalCode: initialData?.postalCode || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    website: initialData?.website || "",
    openingHours: initialData?.openingHours || "08:00",
    closingHours: initialData?.closingHours || "17:00",
    workingDays: initialData?.workingDays || "Mon-Fri",
    tax: initialData?.tax || "15",
    contact: initialData?.contact || "",
    registrationDocument: initialData?.registrationDocument || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF, Word document, or image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", "document");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      setFormData((prev) => ({ ...prev, registrationDocument: data.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeDocument = () => {
    setFormData((prev) => ({ ...prev, registrationDocument: "" }));
  };

  const getFileName = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    return parts[parts.length - 1] || "Document";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = initialData?.id
        ? `/api/shops/${initialData.id}`
        : "/api/shops";
      const method = initialData?.id ? "PATCH" : "POST";

      // Transform form data to API schema
      const apiData = {
        name: formData.name,
        description: formData.description,
        address: [formData.address, formData.city, formData.province, formData.postalCode]
          .filter(Boolean)
          .join(", "),
        contact: formData.contact || formData.phone,
        startTime: formData.openingHours,
        endTime: formData.closingHours,
        openingDays: formData.workingDays.split(",").map((d) => d.trim()),
        tax: formData.tax,
        registrationDocument: formData.registrationDocument || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save shop");
      }

      setSuccess(data.message || "Shop saved successfully");

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          router.push("/dashboard/shop");
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
        <h3 className="text-lg font-medium">Basic Information</h3>

        <Input
          label="Shop Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter your shop name"
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Describe your shop and services..."
        />
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Location</h3>

        <Input
          label="Street Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="123 Main Street"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Johannesburg"
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">Province</label>
            <select
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select province</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Postal Code"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="2000"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+27 12 345 6789"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="shop@example.com"
          />
        </div>

        <Input
          label="Website"
          name="website"
          type="url"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://www.example.com"
        />
      </div>

      {/* Hours */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Hours</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Opening Time"
            name="openingHours"
            type="time"
            value={formData.openingHours}
            onChange={handleChange}
          />

          <Input
            label="Closing Time"
            name="closingHours"
            type="time"
            value={formData.closingHours}
            onChange={handleChange}
          />

          <Input
            label="Working Days"
            name="workingDays"
            value={formData.workingDays}
            onChange={handleChange}
            placeholder="Mon-Fri, Sat"
          />
        </div>
      </div>

      {/* Tax Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tax & Billing</h3>
        <p className="text-sm text-muted-foreground">
          Configure tax settings for your invoices and services
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="VAT / Tax Rate (%)"
              name="tax"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.tax}
              onChange={handleChange}
              placeholder="15"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Standard VAT in South Africa is 15%. Set to 0 if not VAT registered.
            </p>
          </div>

          <Input
            label="Business Contact Number"
            name="contact"
            type="tel"
            value={formData.contact}
            onChange={handleChange}
            placeholder="+27 12 345 6789"
          />
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Tax Information</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>Tax will be automatically calculated on all invoices</li>
            <li>Customers will see the tax breakdown on their receipts</li>
            <li>Make sure your VAT registration is valid if charging VAT</li>
          </ul>
        </div>
      </div>

      {/* Registration Document */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Registration</h3>
        <p className="text-sm text-muted-foreground">
          Upload your business registration document for verification. This helps build trust with customers and speeds up the approval process.
        </p>

        <div className="space-y-3">
          {formData.registrationDocument ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
              <FileText className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getFileName(formData.registrationDocument)}
                </p>
                <p className="text-xs text-muted-foreground">Document uploaded</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={formData.registrationDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  title="View document"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
                <button
                  type="button"
                  onClick={removeDocument}
                  className="p-2 hover:bg-error/10 rounded-md transition-colors"
                  title="Remove document"
                >
                  <X className="w-4 h-4 text-error" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload document</p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, or image files up to 10MB
                  </p>
                </div>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Accepted Documents</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>CIPC registration certificate</li>
            <li>Business license or permit</li>
            <li>Tax clearance certificate</li>
            <li>Professional registration (if applicable)</li>
          </ul>
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
              {initialData?.id ? "Update Shop" : "Create Shop"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
