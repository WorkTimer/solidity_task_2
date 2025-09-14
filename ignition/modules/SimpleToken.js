const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SimpleTokenModule", (m) => {
  // 代币参数
  const tokenName = "Simple Token";
  const tokenSymbol = "SIMPLE";
  const tokenDecimals = 18;
  const initialSupply = 1000000; // 100万代币

  const simpleToken = m.contract("SimpleERC20", [
    tokenName,
    tokenSymbol,
    tokenDecimals,
    initialSupply,
  ]);

  return { simpleToken };
});
