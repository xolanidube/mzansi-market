"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Alert,
  Avatar,
  Spinner,
} from "@/components/ui";
import { User, Bell, Lock, Trash2, Camera, Save } from "lucide-react";

interface UserSettings {
  id: string;
  username: string;
  email: string;
  phone?: string;
  picture?: string;
  userType: string;
  notificationPreferences?: {
    emailBookings: boolean;
    emailMessages: boolean;
    emailMarketing: boolean;
    pushBookings: boolean;
    pushMessages: boolean;
  };
}

const defaultNotificationPrefs = {
  emailBookings: true,
  emailMessages: true,
  emailMarketing: false,
  pushBookings: true,
  pushMessages: true,
};

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile state
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone: "",
    picture: "",
  });

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification state
  const [notifications, setNotifications] = useState(defaultNotificationPrefs);

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          setProfile({
            username: data.username || "",
            email: data.email || "",
            phone: data.phone || "",
            picture: data.picture || "",
          });
          if (data.notificationPreferences) {
            setNotifications({
              ...defaultNotificationPrefs,
              ...data.notificationPreferences,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchUserSettings();
    }
  }, [session]);

  const handleProfileSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profile.username,
          phone: profile.phone,
          picture: profile.picture,
        }),
      });

      if (response.ok) {
        setSuccess("Profile updated successfully");
        await updateSession();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setError("");
    setSuccess("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (response.ok) {
        setSuccess("Password changed successfully");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to change password");
      }
    } catch (err) {
      setError("An error occurred while changing password");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPreferences: notifications }),
      });

      if (response.ok) {
        setSuccess("Notification preferences updated");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update notifications");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    if (!confirm("All your data including bookings, messages, and reviews will be permanently deleted. Continue?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/users/me", {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete account");
      }
    } catch (err) {
      setError("An error occurred while deleting account");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
    { id: "account", label: "Account", icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <Card padding="none" className="lg:w-64 flex-shrink-0">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError("");
                    setSuccess("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card padding="none">
              <CardHeader className="p-6 pb-4">
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profile.picture ? (
                      <Image
                        src={profile.picture}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <Avatar name={profile.username || "User"} size="xl" className="w-24 h-24 text-2xl" />
                    )}
                    <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Profile Picture</p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Username
                    </label>
                    <Input
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      placeholder="Your username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+27 XX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Profile Picture URL
                    </label>
                    <Input
                      value={profile.picture}
                      onChange={(e) => setProfile({ ...profile, picture: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card padding="none">
              <CardHeader className="p-6 pb-4">
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-6">
                <div>
                  <h3 className="font-medium text-foreground mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Booking Updates</p>
                        <p className="text-sm text-muted-foreground">
                          Receive emails about booking confirmations and changes
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailBookings}
                        onChange={(e) =>
                          setNotifications({ ...notifications, emailBookings: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Messages</p>
                        <p className="text-sm text-muted-foreground">
                          Receive emails when you get new messages
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailMessages}
                        onChange={(e) =>
                          setNotifications({ ...notifications, emailMessages: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Marketing</p>
                        <p className="text-sm text-muted-foreground">
                          Receive promotional emails and updates
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailMarketing}
                        onChange={(e) =>
                          setNotifications({ ...notifications, emailMarketing: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                    </label>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-medium text-foreground mb-4">Push Notifications</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Booking Alerts</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified about booking updates in real-time
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.pushBookings}
                        onChange={(e) =>
                          setNotifications({ ...notifications, pushBookings: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Message Alerts</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when you receive new messages
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.pushMessages}
                        onChange={(e) =>
                          setNotifications({ ...notifications, pushMessages: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNotificationsSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <Card padding="none">
              <CardHeader className="p-6 pb-4">
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, currentPassword: e.target.value })
                    }
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, newPassword: e.target.value })
                    }
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirmPassword: e.target.value })
                    }
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handlePasswordChange} disabled={saving}>
                    <Lock className="w-4 h-4 mr-2" />
                    {saving ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <Card padding="none">
                <CardHeader className="p-6 pb-4">
                  <CardTitle>Account Type</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {session?.user?.userType === "SERVICE_PROVIDER"
                          ? "Service Provider Account"
                          : "Client Account"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your account type determines what features you can access
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card padding="none" className="border-error/50">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-error">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-error text-error hover:bg-error hover:text-white"
                      onClick={handleDeleteAccount}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
