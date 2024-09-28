// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Invoice.sol";

contract InvoiceFactory {
    event InvoiceCreated(address invoiceAddress, address[] recipients, uint256[] shares);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    address[] public deployedInvoices;
    mapping(address => address[]) public userInvoices;
    address private _owner;

    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function createInvoice(
        address[] memory _recipients,
        uint256[] memory _shares,
        uint256 _totalAmount,
        string memory _description
    ) public returns (address) {
        require(_recipients.length == _shares.length, "Recipients and shares must have the same length");
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            totalShares += _shares[i];
        }
        require(totalShares == 100, "Total shares must equal 100");

        Invoice newInvoice = new Invoice(_recipients, _shares, _totalAmount, _description);
        address invoiceAddress = address(newInvoice);

        deployedInvoices.push(invoiceAddress);
        for (uint256 i = 0; i < _recipients.length; i++) {
            userInvoices[_recipients[i]].push(invoiceAddress);
        }

        emit InvoiceCreated(invoiceAddress, _recipients, _shares);
        return invoiceAddress;
    }

    function getDeployedInvoices() public view returns (address[] memory) {
        return deployedInvoices;
    }

    function getUserInvoices(address user) public view returns (address[] memory) {
        return userInvoices[user];
    }

    function getInvoiceCount() public view returns (uint256) {
        return deployedInvoices.length;
    }

    function withdrawTokens(address tokenAddress, uint256 amount) public onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }

    function withdrawEther(uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(msg.sender).transfer(amount);
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}
