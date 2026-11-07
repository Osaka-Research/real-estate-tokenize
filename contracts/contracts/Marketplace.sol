// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PropertyToken.sol";

/// @title Marketplace for buying/selling fractional property shares (TRC-1155)
contract Marketplace is ERC1155Holder, ReentrancyGuard {
    PropertyToken public immutable propertyToken;

    struct Listing {
        address seller;
        uint256 amount;       // shares listed
        uint256 pricePerShare; // in SUN
    }

    // propertyId => seller => Listing
    mapping(uint256 => mapping(address => Listing)) public listings;

    event SharesListed(uint256 indexed propertyId, address indexed seller, uint256 amount, uint256 pricePerShare);
    event SharesUnlisted(uint256 indexed propertyId, address indexed seller);
    event SharesPurchased(uint256 indexed propertyId, address indexed seller, address indexed buyer, uint256 amount, uint256 totalPaid);

    constructor(address propertyTokenAddr) {
        propertyToken = PropertyToken(propertyTokenAddr);
    }

    /// @notice List shares for sale. Caller must approve this contract via setApprovalForAll first.
    function listShares(uint256 propertyId, uint256 amount, uint256 pricePerShare) external nonReentrant {
        require(amount > 0, "amount=0");
        require(propertyToken.isActive(propertyId), "property inactive");
        require(propertyToken.balanceOf(msg.sender, propertyId) >= amount, "insufficient balance");

        propertyToken.safeTransferFrom(msg.sender, address(this), propertyId, amount, "");

        listings[propertyId][msg.sender] = Listing(msg.sender, amount, pricePerShare);
        emit SharesListed(propertyId, msg.sender, amount, pricePerShare);
    }

    /// @notice Cancel a listing, returning escrowed shares to seller.
    function unlistShares(uint256 propertyId) external nonReentrant {
        Listing memory l = listings[propertyId][msg.sender];
        require(l.amount > 0, "no listing");

        delete listings[propertyId][msg.sender];
        propertyToken.safeTransferFrom(address(this), msg.sender, propertyId, l.amount, "");
        emit SharesUnlisted(propertyId, msg.sender);
    }

    /// @notice Buy shares from a listing. Send exact TRX = amount * pricePerShare.
    function buyShares(uint256 propertyId, address seller, uint256 amount) external payable nonReentrant {
        Listing storage l = listings[propertyId][seller];
        require(l.amount >= amount && amount > 0, "bad amount");

        uint256 totalPrice = amount * l.pricePerShare;
        require(msg.value == totalPrice, "wrong TRX sent");

        l.amount -= amount;
        propertyToken.safeTransferFrom(address(this), msg.sender, propertyId, amount, "");

        (bool sent, ) = payable(seller).call{value: msg.value}("");
        require(sent, "payout failed");

        if (l.amount == 0) {
            delete listings[propertyId][seller];
        }

        emit SharesPurchased(propertyId, seller, msg.sender, amount, totalPrice);
    }

    function getListing(uint256 propertyId, address seller) external view returns (uint256 amount, uint256 pricePerShare) {
        Listing memory l = listings[propertyId][seller];
        return (l.amount, l.pricePerShare);
    }
}
