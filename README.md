# Real Estate Tokenize

Fractional real estate ownership on TRON. Each property = one TRC-1155 token ID; supply = total fractional shares. Shares trade on a custom marketplace contract.

## Structure

- `contracts/` — TronBox + Solidity. `PropertyToken.sol` (TRC-1155 issuance), `Marketplace.sol` (escrow listing/buy in TRX).
- `backend/` — Express + SQLite. Off-chain property metadata (serves TRC-1155 `uri()` JSON), stub KYC intake.
- `frontend/` — React + Vite + TronWeb. TronLink wallet connect, property browsing, buy flow.

## Flow

1. Admin creates property draft via `POST /api/properties` (backend, status=pending).
2. Admin calls `PropertyToken.issueProperty(metadataURI, totalShares, pricePerShare, custodian)` on-chain — mints all shares to custodian (the SPV/legal entity holding the deed).
3. Admin links the on-chain ID back: `PATCH /api/properties/:id/activate { chain_property_id }` — property goes `active`.
4. Custodian lists shares for sale: `Marketplace.listShares(propertyId, amount, pricePerShare)` (after `PropertyToken.setApprovalForAll(marketplace, true)`).
5. Buyers connect TronLink, browse active properties, call `Marketplace.buyShares(propertyId, seller, amount)` sending exact TRX — shares transfer, TRX pays seller directly.
6. Users submit KYC (`POST /api/kyc`) before buying — enforce check in frontend/backend middleware before mainnet launch (current KYC gate is a stub, not wired to the buy flow yet).

## Setup

```bash
# contracts
cd contracts && npm install
npm run compile
PRIVATE_KEY_SHASTA=<key> npm run migrate:shasta   # testnet deploy

# backend
cd ../backend && npm install
npm run dev   # :4000

# frontend
cd ../frontend && npm install
cp .env.example .env   # fill in deployed contract addresses
npm run dev   # :5173
```

Requires TronLink browser extension (or mobile in-app browser) for wallet connect/buy.

## Not production-ready yet

- KYC stub doesn't gate `buyShares` — add on-chain or backend-enforced allowlist before real funds.
- No admin auth on `/api/properties` POST / `/api/kyc/:wallet/review` — add auth middleware.
- Legal: tokenized shares require actual SPV/custodian legal structure off-chain; contracts alone don't confer legal property rights.
- No contract tests yet — add TronBox test suite under `contracts/test/` before mainnet.
