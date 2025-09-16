const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BeggingContractModule", (m) => {
  // 部署 BeggingContract
  const beggingContract = m.contract("BeggingContract");

  return { beggingContract };
});
