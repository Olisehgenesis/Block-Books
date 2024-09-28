import { useState, useEffect } from 'react';
import { Web3 } from 'web3';
import { SwisstronikPlugin } from '@swisstronik/web3-plugin-swisstronik';
import InvoiceFactoryABI from '../contract/InvoiceFactory.abi.json';
import InvoiceABI from '../contract/Invoice.abi.json';

const FACTORY_ADDRESS = '0xeBf4A713F0cd981cf7fF4670f50101BF4519d965';
const RPC_URL = 'https://json-rpc.testnet.swisstronik.com/';

export const useInvoiceContract = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = new Web3(window.ethereum);
        web3Instance.registerPlugin(new SwisstronikPlugin(RPC_URL));
        setWeb3(web3Instance);
        console.log('Web3 and Swisstronik plugin initialized successfully');
      } catch (err) {
        console.error('Error initializing Web3:', err);
        setError('Failed to initialize Web3. Please check your network connection.');
      }
    };

    initWeb3();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        return accounts[0];
      } catch (err) {
        console.error('Failed to connect wallet:', err);
        setError('Failed to connect wallet. Please try again.');
        return null;
      }
    } else {
      setError('No Ethereum wallet found. Please install MetaMask.');
      return null;
    }
  };

  const createInvoice = async (invoiceDetails: {
    recipients: string[];
    shares: string[];
    totalAmount: string;
    description: string;
  }) => {
    if (!web3 || !account) {
      setError('Web3 or account not initialized');
      return null;
    }

    try {
      const factoryContract = new web3.eth.Contract(InvoiceFactoryABI, FACTORY_ADDRESS);
      const recipients = invoiceDetails.recipients;
      const shares = invoiceDetails.shares.map(Number);
      const totalAmount = web3.utils.toWei(invoiceDetails.totalAmount, 'ether');


      const tx = await factoryContract.methods
        .createInvoice(recipients, shares, totalAmount, invoiceDetails.description)
        .send({ from: account });
      console.log('Invoice created successfully:', tx);
      return tx;

    } catch (err) {
      console.error('Failed to create invoice:', err);
      setError('Failed to create invoice. Please try again.');
      return null;
    }
  };

  const fetchUserInvoices = async () => {
    if (!web3 || !account) {
      setError('Web3 or account not initialized');
      return [];
    }

    try {
      const factoryContract = new web3.eth.Contract(InvoiceFactoryABI, FACTORY_ADDRESS);
      console.log('Factory contract:', factoryContract);
      //log contract methods
      console.log('Factory methods:', factoryContract.methods);
      const invoiceAddresses = await factoryContract.methods.getUserInvoices(account).call();
      console.log('User invoices:', invoiceAddresses);
      const invoicesDetails = await Promise.all(
        invoiceAddresses.map(address => fetchInvoiceDetails(address))
      );

      return invoicesDetails.filter(invoice => invoice !== null);
    } catch (err) {
      console.error('Failed to fetch user invoices:', err);
      setError('Failed to fetch invoices. Please try again later.');
      return [];
    }
  };

  const fetchInvoiceDetails = async (invoiceAddress: string) => {
    if (!web3) {
      setError('Web3 not initialized');
      return null;
    }

    try {
      const invoiceContract = new web3.eth.Contract(InvoiceABI, invoiceAddress);
      const details = await invoiceContract.methods.getInvoiceDetails().call();
      return {
        address: invoiceAddress,
        recipients: details[0],
        shares: details[1],
        totalAmount: web3.utils.fromWei(details[2], 'ether'),
        description: details[3],
        isPaid: details[4],
        paidAmount: web3.utils.fromWei(details[5], 'ether'),
        payer: details[6]
      };
    } catch (err) {
      console.error(`Failed to fetch details for invoice at ${invoiceAddress}:`, err);
      return null;
    }
  };

  return {
    account,
    error,
    connectWallet,
    createInvoice,
    fetchUserInvoices,
    fetchInvoiceDetails
  };
};