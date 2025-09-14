require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY,
        process.env.PRIVATE_KEY_2, // 第二个钱包私钥
        process.env.PRIVATE_KEY_3, // 第三个钱包私钥
        process.env.PRIVATE_KEY_4, // 第四个钱包私钥
      ].filter(key => key), // 过滤掉未定义的私钥
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
