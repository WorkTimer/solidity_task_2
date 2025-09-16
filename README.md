# Solidity Task 2 - ERC20 & ERC721 合约项目

## 🚀 部署信息

### SimpleERC20 合约
- **网络**: Sepolia Testnet
- **地址**: `0xbA4e409941b679587a6F685F2146E47d64B72dD7`
- **验证**: ✅ [Etherscan](https://sepolia.etherscan.io/address/0xbA4e409941b679587a6F685F2146E47d64B72dD7#code)
- **参数**: Simple Token (SIMPLE), 18位精度, 1,000,000 供应量

### SimpleNFT 合约
- **网络**: Sepolia Testnet
- **地址**: `0x77a4076ddb25B1a6a710B5E5fd286515E72fEcf3`
- **验证**: ✅ [Etherscan](https://sepolia.etherscan.io/address/0x77a4076ddb25B1a6a710B5E5fd286515E72fEcf3#code)
- **NFT 市场**: [Rarible 测试网](https://testnet.rarible.com/collection/0x77a4076ddb25b1a6a710b5e5fd286515e72fecf3)
- **参数**: Simple NFT Collection (SNFT), 最大供应量 10,000
- **元数据**: [IPFS 链接](https://green-imperial-swallow-885.mypinata.cloud/ipfs/bafkreigy6ozjkla3zvkspcqxygnvmnuttvsacnqkmk6gonfwmkkzbwcvim)

## 📊 测试结果

| 合约 | 本地测试 | Sepolia 测试 | 覆盖率 |
|------|----------|--------------|--------|
| SimpleERC20 | 49/49 ✅ | 28/28 ✅ | 100% |
| SimpleNFT | 39/39 ✅ | 26/26 ✅ | 100% |

## 🔧 快速开始

### 安装依赖
```bash
npm install
```

### 编译合约
```bash
npx hardhat compile
```

### 部署合约
```bash
# 本地网络
npx hardhat ignition deploy ignition/modules/SimpleToken.js
npx hardhat ignition deploy ignition/modules/SimpleNFT.js

# Sepolia 网络
npx hardhat ignition deploy ignition/modules/SimpleToken.js --network sepolia
npx hardhat ignition deploy ignition/modules/SimpleNFT.js --network sepolia
```

### 运行测试
```bash
# 本地测试
npx hardhat test

# Sepolia 测试
npx hardhat test test/SimpleERC20.sepolia.js --network sepolia
npx hardhat test test/SimpleNFT.sepolia.js --network sepolia
```

### 验证合约
```bash
# ERC20
npx hardhat verify --network sepolia 0xbA4e409941b679587a6F685F2146E47d64B72dD7 "Simple Token" "SIMPLE" 18 1000000

# NFT
npx hardhat verify --network sepolia 0x77a4076ddb25B1a6a710B5E5fd286515E72fEcf3 "Simple NFT Collection" "SNFT" 10000
```

## 📁 项目结构

```
contracts/          # 智能合约
├── SimpleERC20.sol
└── SimpleNFT.sol

test/              # 测试文件
├── SimpleERC20.js
├── SimpleERC20.sepolia.js
├── SimpleNFT.js
└── SimpleNFT.sepolia.js

ignition/modules/  # 部署模块
├── SimpleToken.js
└── SimpleNFT.js

metadata/          # 元数据
└── 1.json
```

## 🔗 相关链接

- **ERC20 合约**: [Etherscan](https://sepolia.etherscan.io/address/0xbA4e409941b679587a6F685F2146E47d64B72dD7#code)
- **NFT 合约**: [Etherscan](https://sepolia.etherscan.io/address/0x77a4076ddb25B1a6a710B5E5fd286515E72fEcf3#code)
- **NFT 市场**: [Rarible 测试网](https://testnet.rarible.com/collection/0x77a4076ddb25b1a6a710b5e5fd286515e72fecf3)
- **NFT 元数据**: [IPFS](https://green-imperial-swallow-885.mypinata.cloud/ipfs/bafkreigy6ozjkla3zvkspcqxygnvmnuttvsacnqkmk6gonfwmkkzbwcvim)

## 📝 环境配置

在 `.env` 文件中设置：
```bash
INFURA_API_KEY=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
PRIVATE_KEY=your_private_key
PRIVATE_KEY_2=your_private_key_2
PRIVATE_KEY_3=your_private_key_3
PRIVATE_KEY_4=your_private_key_4
```

