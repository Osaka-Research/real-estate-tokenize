const PropertyToken = artifacts.require("PropertyToken");
const Marketplace = artifacts.require("Marketplace");

module.exports = async function (deployer) {
  await deployer.deploy(PropertyToken, "https://api.example.com/property/{id}.json");
  const propertyToken = await PropertyToken.deployed();
  await deployer.deploy(Marketplace, propertyToken.address);
};
