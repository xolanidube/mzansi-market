"use client";

import { useState, useEffect } from "react";
import { Card, Button, Badge, Input, Spinner } from "@/components/ui";

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string | null;
  reference: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
  };
}

interface StatusStats {
  count: number;
  total: number;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Record<string, StatusStats>>({});
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    fetchWithdrawals();
  }, [page, statusFilter]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/withdrawals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (withdrawalId: string, action: "approve" | "reject" | "complete") => {
    setActionLoading(withdrawalId);
    try {
      const response = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId,
          action,
          ...(action === "reject" && rejectionReason && { rejectionReason }),
          ...(action === "complete" && reference && { reference }),
        }),
      });

      if (response.ok) {
        setSelectedWithdrawal(null);
        setRejectionReason("");
        setReference("");
        fetchWithdrawals();
      } else {
        const data = await response.json();
        alert(data.error || "Action failed");
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="primary">Approved</Badge>;
      case "PROCESSING":
        return <Badge variant="primary">Processing</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "REJECTED":
        return <Badge variant="error">Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTotalPending = () => {
    return stats.PENDING?.total || 0;
  };

  const getTotalApproved = () => {
    return stats.APPROVED?.total || 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Withdrawal Management</h1>
        <p className="text-muted-foreground">Review and process withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Requests</p>
          <p className="text-2xl font-bold text-warning">{stats.PENDING?.count || 0}</p>
          <p className="text-sm text-muted-foreground">R{getTotalPending().toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Approved (To Process)</p>
          <p className="text-2xl font-bold text-primary">{stats.APPROVED?.count || 0}</p>
          <p className="text-sm text-muted-foreground">R{getTotalApproved().toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-success">{stats.COMPLETED?.count || 0}</p>
          <p className="text-sm text-muted-foreground">R{(stats.COMPLETED?.total || 0).toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-danger">{stats.REJECTED?.count || 0}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="">All Withdrawals</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Withdrawals Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No withdrawal requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Bank Details</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-secondary/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{withdrawal.user.username}</p>
                        <p className="text-sm text-muted-foreground">{withdrawal.user.email}</p>
                        {withdrawal.user.phone && (
                          <p className="text-sm text-muted-foreground">{withdrawal.user.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-lg font-bold text-foreground">
                        R{withdrawal.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="font-medium">{withdrawal.bankName}</p>
                        <p className="text-muted-foreground">{withdrawal.accountHolder}</p>
                        <p className="text-muted-foreground">
                          ****{withdrawal.accountNumber.slice(-4)}
                          {withdrawal.branchCode && ` (${withdrawal.branchCode})`}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        {getStatusBadge(withdrawal.status)}
                        {withdrawal.rejectionReason && (
                          <p className="text-xs text-danger mt-1">{withdrawal.rejectionReason}</p>
                        )}
                        {withdrawal.reference && (
                          <p className="text-xs text-muted-foreground mt-1">Ref: {withdrawal.reference}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        <p>Requested: {new Date(withdrawal.createdAt).toLocaleDateString()}</p>
                        {withdrawal.processedAt && (
                          <p>Processed: {new Date(withdrawal.processedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {withdrawal.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleAction(withdrawal.id, "approve")}
                              disabled={actionLoading === withdrawal.id}
                            >
                              {actionLoading === withdrawal.id ? <Spinner size="sm" /> : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setSelectedWithdrawal(withdrawal)}
                              disabled={actionLoading === withdrawal.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {withdrawal.status === "APPROVED" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setReference(`WD-${withdrawal.id.slice(0, 8).toUpperCase()}`);
                            }}
                            disabled={actionLoading === withdrawal.id}
                          >
                            Mark Complete
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

      {/* Action Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold">
                {selectedWithdrawal.status === "APPROVED" ? "Complete Withdrawal" : "Reject Withdrawal"}
              </h2>

              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-medium">{selectedWithdrawal.user.username}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold">R{selectedWithdrawal.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Bank:</span>
                  <span>{selectedWithdrawal.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account:</span>
                  <span>****{selectedWithdrawal.accountNumber.slice(-4)}</span>
                </div>
              </div>

              {selectedWithdrawal.status === "APPROVED" ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Payment Reference
                  </label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Enter bank reference"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                    rows={3}
                    placeholder="Explain why this withdrawal is being rejected..."
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setRejectionReason("");
                    setReference("");
                  }}
                >
                  Cancel
                </Button>
                {selectedWithdrawal.status === "APPROVED" ? (
                  <Button
                    variant="success"
                    onClick={() => handleAction(selectedWithdrawal.id, "complete")}
                    disabled={actionLoading === selectedWithdrawal.id}
                  >
                    {actionLoading === selectedWithdrawal.id ? <Spinner size="sm" /> : "Complete"}
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() => handleAction(selectedWithdrawal.id, "reject")}
                    disabled={actionLoading === selectedWithdrawal.id || !rejectionReason}
                  >
                    {actionLoading === selectedWithdrawal.id ? <Spinner size="sm" /> : "Reject"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
