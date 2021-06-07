const Migrations = artifacts.require("Migrations");

module.exports = function (deployer, n, accounts) {
  console.log(accounts[0])
  deployer.deploy(Migrations);
};
