const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("SimpleNFTModule", (m) => {
  // NFT 参数
  const nftName = "Simple NFT Collection";
  const nftSymbol = "SNFT";
  const maxSupply = 10000; // 最大供应量 10000 个 NFT

  const simpleNFT = m.contract("SimpleNFT", [
    nftName,
    nftSymbol,
    maxSupply,
  ]);

  return { simpleNFT };
});
