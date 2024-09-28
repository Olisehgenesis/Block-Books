import React, { useState, useEffect, useCallback } from "react";
import { useInvoiceContract } from "./assets/hooks/useInvoice";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { QRCodeSVG } from "qrcode.react";
import { Clipboard, CheckCircle, XCircle } from "lucide-react";

type InvoiceDetails = {
  recipients: string[];
  shares: number[];
  totalAmount: string;
  description: string;
};

type InvoiceData = {
  address: string;
  recipients: string[];
  shares: number[];
  totalAmount: string;
  description: string;
  isPaid: boolean;
  paidAmount: string;
};

type ViewState = "login" | "dashboard" | "createInvoice";

const SWISSTRONIK_CHAIN_ID = 1291;
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const InvoiceApp: React.FC = () => {
  const {
    account,
    chainId,
    error: contractError,
    connectWallet,
    createInvoice,
    fetchUserInvoices,
    getChainId,
  } = useInvoiceContract();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [view, setView] = useState<ViewState>("login");
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    recipients: [""],
    shares: [100],
    totalAmount: "",
    description: "",
  });
  const [txHash, setTxHash] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deployedInvoices, setDeployedInvoices] = useState<InvoiceData[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (account) {
      setIsLoggedIn(true);
      fetchInvoices();
      getChainId();
    }
  }, [account, fetchUserInvoices, getChainId]);

  useEffect(() => {
    if (contractError) {
      setError(contractError);
    }
  }, [contractError]);

  const fetchInvoices = useCallback(async () => {
    const invoices = await fetchUserInvoices();
    setDeployedInvoices(invoices);
  }, [fetchUserInvoices]);

  const handleConnect = useCallback(async () => {
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
  }, [connectWallet]);

  const handleCreateInvoice = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const tx = await createInvoice(invoiceDetails);
      if (tx) {
        setTxHash(tx.transactionHash);
        await fetchInvoices();
        setView("dashboard");
        setInvoiceDetails({
          recipients: [""],
          shares: [100],
          totalAmount: "",
          description: "",
        });
      }
    } catch (err) {
      setError("Failed to create invoice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [createInvoice, fetchInvoices, invoiceDetails]);

  const renderChainId = () => {
    if (chainId === null) return null;
    const isCorrectChain = chainId === SWISSTRONIK_CHAIN_ID;
    return (
      <div
        className={`text-sm ${
          isCorrectChain ? "text-green-600" : "text-red-600"
        } mb-4`}
      >
        {isCorrectChain
          ? "Connected to the correct chain"
          : `Connected to the wrong chain. Please switch to ${SWISSTRONIK_CHAIN_ID}`}
      </div>
    );
  };

  const renderLogin = () => (
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://img.freepik.com/free-vector/printing-invoices-concept-illustration_114360-2390.jpg?t=st=1727536851~exp=1727540451~hmac=10ffbf95552f8b301f2e113f776260410e34e2a4f9978d1a59827172b215f1d5&w=740')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-2xl max-w-md w-full backdrop-filter backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          BlockChain Invoicing
        </h2>
        {renderChainId()}
        <p className="text-gray-600 mb-6 text-center">
          Simplify your invoicing with the power of blockchain technology
        </p>
        {error && <div className="text-red-500 mb-4">{error}</div>}
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
    <div className="bg-gradient-to-r from-green-100 to-green-200 min-h-screen p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h2>
        {renderChainId()}
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
          <div className="mt-6 p-4 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800">Last Transaction Hash:</p>
            <p className="text-xs font-mono break-all">{txHash}</p>
          </div>
        )}
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Deployed Invoices</h3>
          {deployedInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-green-500 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Address</th>
                    <th className="py-3 px-4 text-left">Description</th>
                    <th className="py-3 px-4 text-left">Total Amount</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">QR Code</th>
                  </tr>
                </thead>
                <tbody>
                  {deployedInvoices.map((invoice, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-100 transition-colors duration-200"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="mr-2 font-mono text-sm">
                            {invoice.address.slice(0, 10)}...
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(invoice.address);
                              // You might want to add a state to show a copied notification
                            }}
                            className="text-green-500 hover:text-green-700"
                          >
                            <Clipboard size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">{invoice.description}</td>
                      <td className="py-3 px-4">{invoice.totalAmount} SWTR</td>
                      <td className="py-3 px-4">
                        {invoice.isPaid ? (
                          <span className="flex items-center text-green-500">
                            <CheckCircle size={16} className="mr-1" /> Paid
                          </span>
                        ) : (
                          <span className="flex items-center text-red-500">
                            <XCircle size={16} className="mr-1" /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <QRCodeSVG value={invoice.address} size={64} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No invoices created yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCreateInvoice = () => (
    <div
      className="bg-gradient-to-r from-purple-100 to-pink-100 min-h-screen p-8"
      style={{
        backgroundImage: "url('/api/placeholder/1920/1080')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-4xl mx-auto bg-white bg-opacity-90 rounded-lg shadow-lg p-8 backdrop-filter backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          Create Invoice
        </h2>
        {renderChainId()}
        <p className="text-gray-600 mb-6">Connected Account: {account}</p>
        <p className="text-gray-600 mb-6">
          Fill in the details below to create a new blockchain-based invoice.
        </p>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2">
            {invoiceDetails.recipients.map((recipient, index) => (
              <div key={index} className="mb-4 flex space-x-2">
                <input
                  type="text"
                  placeholder="Recipient Address"
                  value={recipient}
                  onChange={(e) => {
                    const newRecipients = [...invoiceDetails.recipients];
                    newRecipients[index] = e.target.value;
                    setInvoiceDetails((prev) => ({
                      ...prev,
                      recipients: newRecipients,
                    }));
                  }}
                  className="flex-grow shadow-sm border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Share (%)"
                  value={invoiceDetails.shares[index]}
                  onChange={(e) => {
                    const newShares = [...invoiceDetails.shares];
                    newShares[index] = parseInt(e.target.value);
                    setInvoiceDetails((prev) => ({
                      ...prev,
                      shares: newShares,
                    }));
                  }}
                  className="w-1/4 shadow-sm border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            <button
              onClick={() => {
                setInvoiceDetails((prev) => ({
                  ...prev,
                  recipients: [...prev.recipients, ""],
                  shares: [...prev.shares, 0],
                }));
              }}
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
          </div>
          <div className="w-full md:w-1/2 px-2">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Share Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceDetails.recipients.map((recipient, index) => ({
                      name: recipient || `Recipient ${index + 1}`,
                      value: invoiceDetails.shares[index],
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {invoiceDetails.recipients.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
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
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {!isLoggedIn && renderLogin()}
      {isLoggedIn && view === "dashboard" && renderDashboard()}
      {isLoggedIn && view === "createInvoice" && renderCreateInvoice()}
    </div>
  );
};

export default InvoiceApp;
