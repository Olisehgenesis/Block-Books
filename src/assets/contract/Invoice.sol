// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Invoice {
    address[] public recipients;
    uint256[] public shares;
    uint256 public totalAmount;
    string public description;
    bool public isPaid;
    uint256 public paidAmount;

    event PaymentReceived(address payer, uint256 amount);
    event PaymentDistributed(address recipient, uint256 amount);

    constructor(address[] memory _recipients, uint256[] memory _shares, uint256 _totalAmount, string memory _description) {
        require(_recipients.length == _shares.length, "Recipients and shares must have the same length");
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            totalShares += _shares[i];
        }
        require(totalShares == 100, "Total shares must equal 100");

        recipients = _recipients;
        shares = _shares;
        totalAmount = _totalAmount;
        description = _description;
        isPaid = false;
        paidAmount = 0;
    }

    function pay() public payable {
        require(!isPaid, "Invoice is already paid");
        require(msg.value + paidAmount <= totalAmount, "Overpayment not allowed");

        paidAmount += msg.value;
        emit PaymentReceived(msg.sender, msg.value);

        if (paidAmount == totalAmount) {
            isPaid = true;
            distributePayment();
        }
    }

    function distributePayment() private {
        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 payment = (totalAmount * shares[i]) / 100;
            payable(recipients[i]).transfer(payment);
            emit PaymentDistributed(recipients[i], payment);
        }
    }

    function getInvoiceDetails() public view returns (address[] memory, uint256[] memory, uint256, string memory, bool, uint256) {
        return (recipients, shares, totalAmount, description, isPaid, paidAmount);
    }
}