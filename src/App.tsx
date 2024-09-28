import React, { useState, useEffect } from "react";
import { useInvoiceContract } from "./assets/hooks/useInvoice";

interface InvoiceDetails {
  recipients: string[];
  shares: string[];
  totalAmount: string;
  description: string;
}

const InvoiceApp: React.FC = () => {
  const {
    account,
    error: contractError,
    connectWallet,
    createInvoice,
    fetchUserInvoices,
  } = useInvoiceContract();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [view, setView] = useState<"login" | "dashboard" | "createInvoice">(
    "login"
  );
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    recipients: [""],
    shares: [""],
    totalAmount: "",
    description: "",
  });
  const [txHash, setTxHash] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deployedInvoices, setDeployedInvoices] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (account) {
      setIsLoggedIn(true);
      fetchInvoices();
    }
  }, [account]);

  useEffect(() => {
    if (contractError) {
      setError(contractError);
    }
  }, [contractError]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError("");
    try {
      const connected = await connectWallet();
      if (connected) {
        setIsLoggedIn(true);
        setView("dashboard");
      }
    } catch (err) {
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    setIsLoading(true);
    setError("");
    try {
      const tx = await createInvoice(invoiceDetails);
      if (tx) {
        console.log("we are here");
        console.log(tx);
        setTxHash(tx.transactionHash);
        await fetchInvoices();
        setView("dashboard");
        setInvoiceDetails({
          recipients: [""],
          shares: [""],
          totalAmount: "",
          description: "",
        });
      }
    } catch (err) {
      setError("Failed to create invoice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setError("");
    try {
      const invoices = await fetchUserInvoices();
      setDeployedInvoices(invoices);
    } catch (err) {
      setError("Failed to fetch invoices. Please try again.");
    }
  };

  const addRecipient = () => {
    setInvoiceDetails((prev) => ({
      ...prev,
      recipients: [...prev.recipients, ""],
      shares: [...prev.shares, ""],
    }));
  };

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...invoiceDetails.recipients];
    newRecipients[index] = value;
    setInvoiceDetails((prev) => ({ ...prev, recipients: newRecipients }));
  };

  const updateShare = (index: number, value: string) => {
    const newShares = [...invoiceDetails.shares];
    newShares[index] = value;
    setInvoiceDetails((prev) => ({ ...prev, shares: newShares }));
  };

  const renderError = () => {
    if (error) {
      return (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      );
    }
    return null;
  };

  const renderLogin = () => (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          BlockChain Invoicing
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Simplify your invoicing with the power of blockchain technology
        </p>
        {renderError()}
        <button
          onClick={handleConnect}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h2>
        <p className="text-gray-600 mb-6">
          Welcome to your blockchain-powered invoicing system. Create and manage
          invoices with ease and security.
        </p>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-500">Connected Account</p>
            <p className="text-md font-medium text-gray-800">{account}</p>
          </div>
          <button
            onClick={() => setView("createInvoice")}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Create New Invoice
          </button>
        </div>
        {txHash && (
          <div className="mt-6 p-4 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">Last Transaction Hash:</p>
            <p className="text-xs font-mono break-all">{txHash}</p>
          </div>
        )}
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Deployed Invoices</h3>
          {deployedInvoices.length > 0 ? (
            <ul className="space-y-4">
              {deployedInvoices.map((invoice, index) => (
                <li key={index} className="border p-4 rounded-lg">
                  <p>
                    <strong>Address:</strong> {invoice.address}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> {invoice.totalAmount} SWTR
                  </p>
                  <p>
                    <strong>Description:</strong> {invoice.description}
                  </p>
                  <p>
                    <strong>Paid:</strong> {invoice.isPaid ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Paid Amount:</strong> {invoice.paidAmount} SWTR
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No invoices created yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCreateInvoice = () => (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          Create Invoice
        </h2>
        <p className="text-gray-600 mb-6">
          Fill in the details below to create a new blockchain-based invoice.
        </p>
        {invoiceDetails.recipients.map((recipient, index) => (
          <div key={index} className="mb-4 flex space-x-2">
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => updateRecipient(index, e.target.value)}
              className="flex-grow shadow-sm border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Share (%)"
              value={invoiceDetails.shares[index]}
              onChange={(e) => updateShare(index, e.target.value)}
              className="w-1/4 shadow-sm border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ))}
        <button
          onClick={addRecipient}
          className="mb-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Recipient
        </button>
        <input
          type="number"
          placeholder="Total Amount (SWTR)"
          value={invoiceDetails.totalAmount}
          onChange={(e) =>
            setInvoiceDetails((prev) => ({
              ...prev,
              totalAmount: e.target.value,
            }))
          }
          className="w-full mb-4 shadow-sm border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <textarea
          placeholder="Description"
          value={invoiceDetails.description}
          onChange={(e) =>
            setInvoiceDetails((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          className="w-full mb-4 shadow-sm border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
        <button
          onClick={handleCreateInvoice}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          disabled={isLoading}
        >
          {isLoading ? "Creating Invoice..." : "Create Invoice"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {renderError()}
      {!isLoggedIn && renderLogin()}
      {isLoggedIn && view === "dashboard" && renderDashboard()}
      {isLoggedIn && view === "createInvoice" && renderCreateInvoice()}
    </div>
  );
};

export default InvoiceApp;
