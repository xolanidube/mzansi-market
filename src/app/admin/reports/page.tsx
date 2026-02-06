"use client";

import { useState, useEffect } from "react";
import { Card, Button, Badge, Input, Spinner, Avatar } from "@/components/ui";

interface Report {
  id: string;
  type: string;
  description: string;
  evidence: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: {
    id: string;
    username: string;
    email: string;
    picture: string | null;
  };
  reportedUser: {
    id: string;
    username: string;
    email: string;
    picture: string | null;
    userType: string;
  } | null;
  reportedService: {
    id: string;
    name: string;
    provider: {
      id: string;
      username: string;
    };
  } | null;
  reportedReview: {
    id: string;
    text: string;
    rating: number;
    sender: {
      id: string;
      username: string;
    };
  } | null;
  resolvedBy: {
    id: string;
    username: string;
  } | null;
}

type ReportStatus = "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
type ReportAction = "NONE" | "WARN_USER" | "SUSPEND_USER" | "BAN_USER" | "HIDE_CONTENT" | "DELETE_CONTENT";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedAction, setSelectedAction] = useState<ReportAction>("NONE");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>("RESOLVED");

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setTotalPages(data.pagination.totalPages);
        setStatusCounts(data.statusCounts || {});
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: selectedStatus,
          adminNotes,
          action: selectedAction,
        }),
      });

      if (response.ok) {
        setSelectedReport(null);
        setAdminNotes("");
        setSelectedAction("NONE");
        fetchReports();
      }
    } catch (error) {
      console.error("Error updating report:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>;
      case "INVESTIGATING":
        return <Badge variant="primary">Investigating</Badge>;
      case "RESOLVED":
        return <Badge variant="success">Resolved</Badge>;
      case "DISMISSED":
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReportTypeBadge = (type: string) => {
    const typeColors: Record<string, "error" | "warning" | "primary" | "secondary"> = {
      SPAM: "warning",
      FRAUD: "error",
      HARASSMENT: "error",
      INAPPROPRIATE_CONTENT: "warning",
      FAKE_REVIEW: "primary",
      OTHER: "secondary",
    };
    return <Badge variant={typeColors[type] || "secondary"}>{type.replace(/_/g, " ")}</Badge>;
  };

  const getReportedContent = (report: Report) => {
    if (report.reportedUser) {
      return (
        <div className="flex items-center gap-2">
          <Avatar src={report.reportedUser.picture} name={report.reportedUser.username} size="sm" />
          <div>
            <p className="font-medium">{report.reportedUser.username}</p>
            <p className="text-xs text-muted-foreground">User Account</p>
          </div>
        </div>
      );
    }
    if (report.reportedService) {
      return (
        <div>
          <p className="font-medium">{report.reportedService.name}</p>
          <p className="text-xs text-muted-foreground">Service by {report.reportedService.provider.username}</p>
        </div>
      );
    }
    if (report.reportedReview) {
      return (
        <div>
          <p className="font-medium line-clamp-1">&quot;{report.reportedReview.text}&quot;</p>
          <p className="text-xs text-muted-foreground">
            Review ({report.reportedReview.rating}★) by {report.reportedReview.sender.username}
          </p>
        </div>
      );
    }
    return <span className="text-muted-foreground">Unknown content</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Report Management</h1>
        <p className="text-muted-foreground">Review and moderate user reports</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-warning">{statusCounts.PENDING || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Investigating</p>
          <p className="text-2xl font-bold text-primary">{statusCounts.INVESTIGATING || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-success">{statusCounts.RESOLVED || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Dismissed</p>
          <p className="text-2xl font-bold text-muted-foreground">{statusCounts.DISMISSED || 0}</p>
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
            <option value="">All Reports</option>
            <option value="PENDING">Pending</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </Card>

      {/* Reports Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Reported Content</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Reporter</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-secondary/30">
                    <td className="p-4">{getReportTypeBadge(report.type)}</td>
                    <td className="p-4">{getReportedContent(report)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={report.reporter.picture} name={report.reporter.username} size="sm" />
                        <span className="text-sm">{report.reporter.username}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {report.description}
                      </p>
                    </td>
                    <td className="p-4">{getStatusBadge(report.status)}</td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report);
                            setAdminNotes(report.adminNotes || "");
                          }}
                        >
                          Review
                        </Button>
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

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Review Report</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                >
                  ✕
                </Button>
              </div>

              {/* Report Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Report Type</p>
                    <div className="mt-1">{getReportTypeBadge(selectedReport.type)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Reported Content</p>
                  <div className="mt-2 p-3 bg-secondary/50 rounded-lg">
                    {getReportedContent(selectedReport)}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Reporter&apos;s Description</p>
                  <p className="mt-1 text-foreground">{selectedReport.description}</p>
                </div>

                {selectedReport.evidence && (
                  <div>
                    <p className="text-sm text-muted-foreground">Evidence/Links</p>
                    <p className="mt-1 text-foreground">{selectedReport.evidence}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reported By</p>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={selectedReport.reporter.picture}
                      name={selectedReport.reporter.username}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{selectedReport.reporter.username}</p>
                      <p className="text-sm text-muted-foreground">{selectedReport.reporter.email}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Update Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="INVESTIGATING">Mark as Investigating</option>
                    <option value="RESOLVED">Resolve Report</option>
                    <option value="DISMISSED">Dismiss Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Take Action (Optional)
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value as ReportAction)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="NONE">No Action</option>
                    <option value="WARN_USER">Warn User</option>
                    <option value="SUSPEND_USER">Suspend User Account</option>
                    <option value="BAN_USER">Ban User Account</option>
                    <option value="HIDE_CONTENT">Hide Content</option>
                    <option value="DELETE_CONTENT">Delete Content</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                    rows={3}
                    placeholder="Add internal notes about this report..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateReport}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner size="sm" /> : "Submit"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
