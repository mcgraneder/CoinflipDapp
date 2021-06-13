const CoinFlip = artifacts.require("CoinFlip");

module.exports = function (deployer, n, accounts) {
  console.log(accounts);
  deployer.deploy(CoinFlip);
};
