"use client";

import { useState, useEffect } from "react";
import { Card, Button, Badge, Input, Spinner, Avatar } from "@/components/ui";

interface User {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  userType: string;
  isVerified: boolean;
  isActive: boolean;
  picture: string | null;
  createdAt: string;
  _count: {
    services: number;
    appointmentsBooked: number;
    appointmentsReceived: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userType, setUserType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, userType]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(userType && { userType }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleAction = async (userId: string, action: "activate" | "deactivate" | "verify" | "makeAdmin") => {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getUserTypeBadge = (type: string) => {
    switch (type) {
      case "ADMIN":
        return <Badge variant="primary">Admin</Badge>;
      case "SERVICE_PROVIDER":
        return <Badge variant="success">Provider</Badge>;
      default:
        return <Badge variant="secondary">Client</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage platform users and their permissions</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={userType}
            onChange={(e) => {
              setUserType(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">All Users</option>
            <option value="CLIENT">Clients</option>
            <option value="SERVICE_PROVIDER">Service Providers</option>
            <option value="ADMIN">Administrators</option>
          </select>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Activity</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.picture} name={user.username} size="sm" />
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getUserTypeBadge(user.userType)}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {user.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="danger">Inactive</Badge>
                        )}
                        {user.isVerified && (
                          <Badge variant="primary">Verified</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {user.userType === "SERVICE_PROVIDER" ? (
                          <>
                            <p>{user._count.services} services</p>
                            <p>{user._count.appointmentsReceived} bookings</p>
                          </>
                        ) : (
                          <p>{user._count.appointmentsBooked} bookings</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {!user.isVerified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(user.id, "verify")}
                            disabled={actionLoading === user.id}
                          >
                            Verify
                          </Button>
                        )}
                        {user.isActive ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleAction(user.id, "deactivate")}
                            disabled={actionLoading === user.id}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleAction(user.id, "activate")}
                            disabled={actionLoading === user.id}
                          >
                            Activate
                          </Button>
                        )}
                        {user.userType !== "ADMIN" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(user.id, "makeAdmin")}
                            disabled={actionLoading === user.id}
                          >
                            Make Admin
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
