"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Spinner,
  Modal,
  Input,
  Select,
  Alert,
} from "@/components/ui";

type Transaction = {
  id: string;
  amount: string;
  type: "CREDIT" | "DEBIT" | "REFUND" | "WITHDRAWAL";
  description: string | null;
  reference: string | null;
  createdAt: string;
};

type WalletData = {
  id: string;
  balance: string;
  currency: string;
  transactions: Transaction[];
};

type WithdrawalRequest = {
  id: string;
  amount: string;
  status: "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED";
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string | null;
  reference: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
  createdAt: string;
};

const transactionColors: Record<string, { bg: string; text: string; sign: string }> = {
  CREDIT: { bg: "bg-success/10", text: "text-success", sign: "+" },
  DEBIT: { bg: "bg-error/10", text: "text-error", sign: "-" },
  REFUND: { bg: "bg-warning/10", text: "text-warning", sign: "+" },
  WITHDRAWAL: { bg: "bg-primary/10", text: "text-primary", sign: "-" },
};

const withdrawalStatusColors: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "primary",
  PROCESSING: "primary",
  COMPLETED: "success",
  REJECTED: "error",
  CANCELLED: "secondary",
};

const SOUTH_AFRICAN_BANKS = [
  { value: "ABSA", label: "ABSA Bank" },
  { value: "FNB", label: "First National Bank (FNB)" },
  { value: "STANDARD_BANK", label: "Standard Bank" },
  { value: "NEDBANK", label: "Nedbank" },
  { value: "CAPITEC", label: "Capitec Bank" },
  { value: "INVESTEC", label: "Investec" },
  { value: "AFRICAN_BANK", label: "African Bank" },
  { value: "BIDVEST", label: "Bidvest Bank" },
  { value: "DISCOVERY", label: "Discovery Bank" },
  { value: "TYME", label: "TymeBank" },
  { value: "OTHER", label: "Other" },
];

export default function WalletPage() {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals">("transactions");

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    branchCode: "",
  });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/wallet");

      if (!response.ok) {
        if (response.status === 404) {
          setWallet(null);
        } else {
          setError("Failed to load wallet data");
        }
        return;
      }

      const data = await response.json();
      setWallet(data);
    } catch (err) {
      console.error("Error fetching wallet:", err);
      setError("An error occurred while loading your wallet");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch("/api/wallet/withdraw");
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchWallet();
      fetchWithdrawals();
    }
  }, [session]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawError(null);

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawForm.amount),
          bankName: withdrawForm.bankName,
          accountNumber: withdrawForm.accountNumber,
          accountHolder: withdrawForm.accountHolder,
          branchCode: withdrawForm.branchCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setWithdrawError(data.error || "Failed to submit withdrawal request");
        return;
      }

      setWithdrawSuccess(true);
      setWithdrawForm({
        amount: "",
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        branchCode: "",
      });
      fetchWithdrawals();

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(false);
      }, 2000);
    } catch (err) {
      setWithdrawError("An error occurred. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this withdrawal request?")) return;

    try {
      const response = await fetch(`/api/wallet/withdraw?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchWithdrawals();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to cancel withdrawal");
      }
    } catch (err) {
      alert("An error occurred while cancelling");
    }
  };

  const balance = wallet ? parseFloat(wallet.balance) : 0;
  const pendingWithdrawals = withdrawals
    .filter(w => w.status === "PENDING" || w.status === "APPROVED" || w.status === "PROCESSING")
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);
  const availableBalance = balance - pendingWithdrawals;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        <p className="text-muted-foreground">
          Manage your earnings and withdrawals
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-primary-foreground/80 text-sm">Available Balance</p>
              <p className="text-4xl font-bold mt-1">
                R {availableBalance.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
              {pendingWithdrawals > 0 && (
                <p className="text-primary-foreground/60 text-sm mt-1">
                  R {pendingWithdrawals.toLocaleString("en-ZA", { minimumFractionDigits: 2 })} pending withdrawal
                </p>
              )}
              <p className="text-primary-foreground/60 text-sm mt-1">
                {wallet?.currency || "ZAR"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setShowWithdrawModal(true)}
                disabled={availableBalance < 50}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">
              R {wallet?.transactions
                .filter(t => t.type === "CREDIT")
                .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                .toLocaleString("en-ZA", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
            <p className="text-sm text-muted-foreground">Total Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-error">
              R {wallet?.transactions
                .filter(t => t.type === "WITHDRAWAL" || t.type === "DEBIT")
                .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                .toLocaleString("en-ZA", { minimumFractionDigits: 2 }) || "0.00"}
            </p>
            <p className="text-sm text-muted-foreground">Total Withdrawn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {wallet?.transactions.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {withdrawals.filter(w => w.status === "PENDING").length}
            </p>
            <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "transactions"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "withdrawals"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Withdrawal Requests
          {withdrawals.filter(w => w.status === "PENDING").length > 0 && (
            <Badge variant="warning" className="ml-2">
              {withdrawals.filter(w => w.status === "PENDING").length}
            </Badge>
          )}
        </button>
      </div>

      {/* Transaction History */}
      {activeTab === "transactions" && (
        <Card padding="none">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {error ? (
              <div className="text-center py-8">
                <p className="text-error">{error}</p>
              </div>
            ) : !wallet || wallet.transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your earnings from completed bookings will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallet.transactions.map((transaction) => {
                  const colors = transactionColors[transaction.type];
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${colors.bg}`}>
                          <svg className={`w-5 h-5 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {transaction.type === "CREDIT" || transaction.type === "REFUND" ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {transaction.description || transaction.type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${colors.text}`}>
                          {colors.sign}R {parseFloat(transaction.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </p>
                        <Badge variant={transaction.type === "CREDIT" ? "success" : transaction.type === "REFUND" ? "warning" : "secondary"}>
                          {transaction.type.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Requests */}
      {activeTab === "withdrawals" && (
        <Card padding="none">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Withdrawal Requests</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-muted-foreground">No withdrawal requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the Withdraw button to request a withdrawal
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">
                        R {parseFloat(withdrawal.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={withdrawalStatusColors[withdrawal.status] as "success" | "warning" | "error" | "primary" | "secondary"}>
                        {withdrawal.status.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{withdrawal.bankName} - ****{withdrawal.accountNumber.slice(-4)}</p>
                      <p>{withdrawal.accountHolder}</p>
                      <p>
                        Requested: {new Date(withdrawal.createdAt).toLocaleDateString("en-ZA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {withdrawal.processedAt && (
                        <p>
                          Processed: {new Date(withdrawal.processedAt).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                      {withdrawal.reference && (
                        <p className="text-primary">Ref: {withdrawal.reference}</p>
                      )}
                      {withdrawal.rejectionReason && (
                        <p className="text-error">Reason: {withdrawal.rejectionReason}</p>
                      )}
                    </div>
                    {withdrawal.status === "PENDING" && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelWithdrawal(withdrawal.id)}
                        >
                          Cancel Request
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">How withdrawals work</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Minimum withdrawal amount is R50. Once you submit a withdrawal request, it will be reviewed and processed within 2-3 business days.
                You&apos;ll receive an email when your withdrawal is completed with the bank reference number.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          setWithdrawError(null);
          setWithdrawSuccess(false);
        }}
        title="Request Withdrawal"
        size="md"
      >
        {withdrawSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Withdrawal Requested!</h3>
            <p className="text-muted-foreground mt-2">
              Your withdrawal request has been submitted and is pending review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {withdrawError && (
              <Alert variant="error">{withdrawError}</Alert>
            )}

            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-foreground">
                R {availableBalance.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <Input
              label="Amount (R)"
              type="number"
              min="50"
              max={availableBalance}
              step="0.01"
              placeholder="Enter amount to withdraw"
              value={withdrawForm.amount}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
              required
              helperText="Minimum withdrawal: R50"
            />

            <Select
              label="Bank Name"
              options={SOUTH_AFRICAN_BANKS}
              value={withdrawForm.bankName}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
              required
            />

            <Input
              label="Account Holder Name"
              type="text"
              placeholder="Name as it appears on account"
              value={withdrawForm.accountHolder}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
              required
            />

            <Input
              label="Account Number"
              type="text"
              placeholder="Your bank account number"
              value={withdrawForm.accountNumber}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
              required
            />

            <Input
              label="Branch Code (Optional)"
              type="text"
              placeholder="e.g., 250655"
              value={withdrawForm.branchCode}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, branchCode: e.target.value })}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={withdrawing || !withdrawForm.amount || parseFloat(withdrawForm.amount) < 50}
                className="flex-1"
              >
                {withdrawing ? <Spinner size="sm" /> : "Submit Request"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
