module.exports = {
  networks: {
    shasta: {
      privateKey: process.env.PRIVATE_KEY_SHASTA,
      userFeePercentage: 100,
      feeLimit: 1_000_000_000,
      fullHost: "https://api.shasta.trongrid.io",
      network_id: "*",
    },
    nile: {
      privateKey: process.env.PRIVATE_KEY_NILE,
      userFeePercentage: 100,
      feeLimit: 1_000_000_000,
      fullHost: "https://nile.trongrid.io",
      network_id: "*",
    },
    mainnet: {
      privateKey: process.env.PRIVATE_KEY_MAINNET,
      userFeePercentage: 100,
      feeLimit: 1_000_000_000,
      fullHost: "https://api.trongrid.io",
      network_id: "*",
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",
    },
  },
};
