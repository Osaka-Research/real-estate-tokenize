// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title PropertyToken (TRC-1155)
/// @notice Each tokenId = one real estate property. Supply = total fractional shares issued for it.
contract PropertyToken is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _propertyIds;

    struct Property {
        string metadataURI;   // off-chain JSON: address, docs, valuation, images
        uint256 totalShares;  // total fractional shares minted for this property
        uint256 pricePerShare; // in SUN (1 TRX = 1_000_000 SUN), set at issuance
        address custodian;    // legal entity / SPV holding the deed off-chain
        bool active;
    }

    mapping(uint256 => Property) public properties;

    event PropertyListed(uint256 indexed propertyId, uint256 totalShares, uint256 pricePerShare, address custodian);
    event PropertyDeactivated(uint256 indexed propertyId);

    constructor(string memory baseURI) ERC1155(baseURI) {}

    /// @notice Issue a new property, minting all fractional shares to the custodian/owner for sale.
    function issueProperty(
        string memory metadataURI,
        uint256 totalShares,
        uint256 pricePerShare,
        address custodian
    ) external onlyOwner returns (uint256 propertyId) {
        require(totalShares > 0, "totalShares=0");
        require(custodian != address(0), "bad custodian");

        _propertyIds.increment();
        propertyId = _propertyIds.current();

        properties[propertyId] = Property({
            metadataURI: metadataURI,
            totalShares: totalShares,
            pricePerShare: pricePerShare,
            custodian: custodian,
            active: true
        });

        _mint(custodian, propertyId, totalShares, "");
        emit PropertyListed(propertyId, totalShares, pricePerShare, custodian);
    }

    function deactivateProperty(uint256 propertyId) external onlyOwner {
        properties[propertyId].active = false;
        emit PropertyDeactivated(propertyId);
    }

    function uri(uint256 propertyId) public view override returns (string memory) {
        return properties[propertyId].metadataURI;
    }

    function isActive(uint256 propertyId) external view returns (bool) {
        return properties[propertyId].active;
    }

    function totalProperties() external view returns (uint256) {
        return _propertyIds.current();
    }
}
