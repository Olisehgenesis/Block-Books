import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { SwisstronikPlugin } from '@swisstronik/web3-plugin-swisstronik';
import InvoiceFactoryABI from '../contract/InvoiceFactory.abi.json';
import InvoiceABI from '../contract/Invoice.abi.json';

const FACTORY_ADDRESS = '0x180d2967cb720dca95dab7306aa34369837d9345';
const RPC_URL = 'https://json-rpc.testnet.swisstronik.com/';

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

export const useInvoiceContract = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const initWeb3 = useCallback(async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const web3Instance = new Web3(window.ethereum);
        web3Instance.registerPlugin(new SwisstronikPlugin(RPC_URL));
        setWeb3(web3Instance);

        const id = await web3Instance.eth.getChainId();
        const newId = Number(id);
        console.log('Chain ID:', newId);
        setChainId(newId);

        window.ethereum.on('chainChanged', () => {
          setChainId(newId);  // No need to use the `chainId` param
        });

        console.log('Web3 and Swisstronik plugin initialized successfully');
      } else {
        throw new Error('No Ethereum wallet found');
      }
    } catch (err) {
      console.error('Error initializing Web3:', err);
      setError('Failed to initialize Web3. Please check your network connection.');
    }
  }, []);

  useEffect(() => {
    initWeb3();
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [initWeb3]);

  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!web3) {
      setError('Web3 not initialized');
      return null;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const connectedAccount = accounts[0];
      setAccount(connectedAccount);
      return connectedAccount;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet. Please try again.');
      return null;
    }
  }, [web3]);

  const createInvoice = useCallback(async (invoiceDetails: InvoiceDetails): Promise<any> => {
    if (!web3 || !account) {
      setError('Web3 or account not initialized');
      return null;
    }

    try {
      const factoryContract = new web3.eth.Contract(InvoiceFactoryABI, FACTORY_ADDRESS);
      const totalAmountWei = web3.utils.toWei(invoiceDetails.totalAmount, 'ether');
      const { recipients, shares, description } = invoiceDetails; // removed `totalAmount`

      const tx = await factoryContract.methods
        .createInvoice(recipients, shares, totalAmountWei, description)
        .send({ from: account });

      return tx;
    } catch (err) {
      console.error('Failed to create invoice:', err);
      setError('Failed to create invoice. Please try again.');
      return null;
    }
  }, [web3, account]);

  const fetchUserInvoices = useCallback(async (): Promise<InvoiceData[]> => {
    if (!web3 || !account) {
      setError('Web3 or account not initialized');
      return [];
    }

    try {
      const factoryContract = new web3.eth.Contract(InvoiceFactoryABI, FACTORY_ADDRESS);
      const invoiceAddresses: string[] = await factoryContract.methods.getUserInvoices(account).call();

      const invoicesDetails = await Promise.all(
        invoiceAddresses.map((address: string) => fetchInvoiceDetails(address))
      );

      return invoicesDetails.filter((invoice): invoice is InvoiceData => invoice !== null);
    } catch (err) {
      console.error('Failed to fetch user invoices:', err);
      setError('Failed to fetch invoices. Please try again later.');
      return [];
    }
  }, [web3, account]);

  const fetchInvoiceDetails = useCallback(async (invoiceAddress: string): Promise<InvoiceData | null> => {
    if (!web3) {
      setError('Web3 not initialized');
      return null;
    }
  
    try {
      const invoiceContract = new web3.eth.Contract(InvoiceABI, invoiceAddress);
      const details = await invoiceContract.methods.getInvoiceDetails().call();
  
      // Ensure details is an array and contains the expected values
      if (!Array.isArray(details) || details.length < 6) {
        return null;
      }
  
      // Validate that details[1] is an array before mapping
      const shares = Array.isArray(details[1]) ? details[1].map(Number) : [];
  
      return {
        address: invoiceAddress,
        recipients: details[0],
        shares,
        totalAmount: web3.utils.fromWei(details[2], 'ether'),
        description: details[3],
        isPaid: details[4],
        paidAmount: web3.utils.fromWei(details[5], 'ether')
      };
    } catch (err) {
      console.error(`Failed to fetch details for invoice at ${invoiceAddress}:`, err);
      return null;
    }
  }, [web3]);
  

  const getChainId = useCallback(async (): Promise<number | null> => {
    if (!web3) {
      setError('Web3 not initialized');
      return null;
    }
    try {
      const id = await web3.eth.getChainId();
      const newId = Number(id);
      setChainId(newId);
      return newId;
    } catch (err) {
      console.error('Failed to get chain ID:', err);
      setError('Failed to get chain ID. Please try again.');
      return null;
    }
  }, [web3]);

  return {
    account,
    chainId,
    error,
    connectWallet,
    createInvoice,
    fetchUserInvoices,
    fetchInvoiceDetails,
    getChainId,
  };
};
