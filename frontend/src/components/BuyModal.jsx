import { useState } from "react";
import { getMarketplaceContract, getTronWeb } from "../tron.js";

export default function BuyModal({ property, seller, onClose }) {
  const [amount, setAmount] = useState(1);
  const [status, setStatus] = useState("");

  const pricePerShare = property.price_per_share_sun;
  const totalSun = amount * pricePerShare;

  async function handleBuy() {
    try {
      setStatus("Sending transaction...");
      const marketplace = await getMarketplaceContract();
      const tronWeb = getTronWeb();

      await marketplace
        .buyShares(property.chain_property_id, seller, amount)
        .send({ callValue: totalSun, shouldPollResponse: true });

      setStatus("Purchase confirmed.");
    } catch (err) {
      setStatus(`Failed: ${err.message || err}`);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Buy shares — {property.title}</h3>
        <label>
          Amount
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
          />
        </label>
        <p>Total: {(totalSun / 1_000_000).toFixed(2)} TRX</p>
        <button onClick={handleBuy}>Confirm purchase</button>
        {status && <p className="status">{status}</p>}
        <button className="link" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
