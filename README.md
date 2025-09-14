# Solidity Task 2

## 部署信息

### SimpleERC20 合约

**网络**: Sepolia Testnet  
**合约地址**: `0xbA4e409941b679587a6F685F2146E47d64B72dD7`  
**部署时间**: 2025年09月14日 美东

### 验证合约

✅ **合约已验证** - 您可以在 [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xbA4e409941b679587a6F685F2146E47d64B72dD7#code) 上查看合约详情和源代码。

**合约参数**:
- 名称: Simple Token
- 符号: SIMPLE  
- 小数位: 18
- 初始供应量: 1,000,000 SIMPLE

### 使用方法

1. 确保您有 Sepolia ETH 用于 gas 费用
2. 使用合约地址与合约进行交互
3. 合约支持标准的 ERC20 功能：转账、授权、查询余额等

### 测试结果

✅ **Sepolia 网络测试通过** - 所有 15 个测试用例都成功通过！

**测试覆盖范围**:
- ✅ 合约基本信息验证（名称、符号、精度、总供应量）
- ✅ 余额查询功能
- ✅ 授权功能（approve/allowance）
- ✅ 网络连接和区块信息
- ✅ Gas 费用估算
- ✅ 合约状态验证
- ✅ 合约交互测试

**测试统计**:
- 测试用例: 28 个 (全面测试)
- 通过率: 100% ✅
- 执行时间: ~3 分钟 (优化后)
- 超时设置: 300 秒 (5分钟) 每个测试
- Gas 使用: 24,807 - 41,564 (各种操作)
- 优化措施: 增加延迟、延长超时、避免交易冲突

**代码覆盖率**:
- 语句覆盖率: 100% ✅
- 分支覆盖率: 100% ✅
- 函数覆盖率: 100% ✅
- 行覆盖率: 100% ✅
- 未覆盖行: 0

**全面测试覆盖**:
- ✅ 合约基本信息验证 (名称、符号、精度、总供应量)
- ✅ 多钱包转账功能 (owner → addr1 → addr2 → addr3)
- ✅ 转账边界测试 (零金额、小额、最大精度)
- ✅ 授权功能 (新授权、零授权、更新授权)
- ✅ transferFrom 功能 (使用授权转账)
- ✅ 多地址授权测试 (同时授权多个地址)
- ✅ 边界情况测试 (最大精度、大额授权)
- ✅ 事件发射验证 (Transfer & Approval 事件)
- ✅ 网络连接和 Gas 费用监控
- ✅ 合约状态验证 (ABI、字节码、权限)
- ✅ 最终状态验证 (总供应量守恒)

### 测试钱包配置

**钱包地址列表**:
- **钱包1 (owner)**: `0xAe60716D15e73DC174F782Fec3FAD41f142EF226` - 主要操作钱包
- **钱包2 (addr1)**: `0x65821B4447EE6d3Be375378B4f6AcB3E05F3a10f` - 接收和授权操作
- **钱包3 (addr2)**: `0xAa44a5E780411fB3188E2D59EDc5c05561aefC84` - 接收转账
- **钱包4 (addr3)**: `0x05158c1851d791B50FCc6aEDbDb5fdf6dF8b1e7e` - 最终接收者


### 环境配置

确保在 `.env` 文件中设置了以下环境变量：
- `INFURA_API_KEY`: Infura 项目 ID
- `ETHERSCAN_API_KEY`: Etherscan API 密钥（用于验证）
- `PRIVATE_KEY`: 钱包1私钥 合约拥有者
- `PRIVATE_KEY_2`: 钱包2私钥
- `PRIVATE_KEY_3`: 钱包3私钥
- `PRIVATE_KEY_4`: 钱包4私钥

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 编译合约
```bash
# 编译所有合约
npx hardhat compile

# 清理编译文件
npx hardhat clean
```

### 3. 启动本地节点
```bash
# 启动 Hardhat 本地网络
npx hardhat node

# 在另一个终端中运行测试或部署
```

### 4. 部署合约

#### 部署到本地网络
```bash
# 部署到本地 Hardhat 网络
npx hardhat ignition deploy ignition/modules/SimpleToken.js --network localhost

# 或者使用默认网络
npx hardhat ignition deploy ignition/modules/SimpleToken.js
```

#### 部署到 Sepolia 测试网
```bash
# 部署到 Sepolia 测试网
npx hardhat ignition deploy ignition/modules/SimpleToken.js --network sepolia
```

#### 验证合约（仅 Sepolia）
```bash
# 验证合约源码
npx hardhat verify --network sepolia 0xbA4e409941b679587a6F685F2146E47d64B72dD7 "Simple Token" "SIMPLE" 18 1000000
```

### 5. 运行测试

#### 本地网络测试
```bash
# 运行所有测试
npx hardhat test

# 运行特定测试文件
npx hardhat test test/SimpleERC20.js

# 运行测试并显示详细输出
npx hardhat test --verbose
```

#### Sepolia 网络测试
```bash
# 运行 Sepolia 网络测试
npx hardhat test test/SimpleERC20.sepolia.js --network sepolia

# 运行特定测试组
npx hardhat test test/SimpleERC20.sepolia.js --network sepolia --grep "转账功能测试"
```

### 6. 生成测试报告

#### 代码覆盖率报告
```bash
# 生成覆盖率报告
npx hardhat coverage

# 查看 HTML 覆盖率报告
open coverage/index.html

# 查看 JSON 覆盖率报告
cat coverage.json

# 在浏览器中打开覆盖率报告
open coverage/index.html
```

#### 测试报告
```bash
# 生成详细的测试报告
npx hardhat test --reporter spec

# 生成 JSON 格式测试报告
npx hardhat test --reporter json > test-results.json

# 生成 JUnit 格式测试报告
npx hardhat test --reporter junit > test-results.xml
```

### 7. 网络管理

#### 查看网络配置
```bash
# 查看所有可用网络
npx hardhat networks

# 查看特定网络信息
npx hardhat networks --network sepolia
```

#### 切换网络
```bash
# 使用本地网络
npx hardhat console --network localhost

# 使用 Sepolia 网络
npx hardhat console --network sepolia
```

### 8. 调试和开发

#### 启动调试模式
```bash
# 启动 Hardhat 控制台
npx hardhat console

# 启动调试模式
npx hardhat console --network localhost
```

#### 查看合约信息
```bash
# 查看合约 ABI
cat artifacts/contracts/SimpleERC20.sol/SimpleERC20.json | jq '.abi'

# 查看合约字节码
cat artifacts/contracts/SimpleERC20.sol/SimpleERC20.json | jq '.bytecode'
```

## 📊 测试和覆盖率

### 测试统计
- **本地测试**: 49 个测试用例，100% 通过
- **Sepolia 测试**: 28 个测试用例，100% 通过
- **代码覆盖率**: 100% (语句、分支、函数、行)

### 测试覆盖范围
- ✅ 合约基本信息验证
- ✅ 转账功能测试
- ✅ 授权功能测试
- ✅ 多地址交互测试
- ✅ 边界情况测试
- ✅ 事件发射验证
- ✅ 网络连接测试
- ✅ Gas 费用估算
- ✅ 合约状态验证

## 🔧 常用命令总结

| 操作 | 命令 |
|------|------|
| 编译合约 | `npx hardhat compile` |
| 启动本地节点 | `npx hardhat node` |
| 部署到本地 | `npx hardhat ignition deploy ignition/modules/SimpleToken.js` |
| 部署到 Sepolia | `npx hardhat ignition deploy ignition/modules/SimpleToken.js --network sepolia` |
| 验证合约 | `npx hardhat verify --network sepolia <合约地址> <参数>` |
| 本地测试 | `npx hardhat test` |
| Sepolia 测试 | `npx hardhat test test/SimpleERC20.sepolia.js --network sepolia` |
| 生成覆盖率 | `npx hardhat coverage` |
| 查看覆盖率报告 | `open coverage/index.html` |
| 清理文件 | `npx hardhat clean` |
