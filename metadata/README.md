# NFT Metadata

这个目录包含NFT的元数据JSON文件。

## 文件命名规则
- 使用数字命名：`1.json`, `2.json`, `3.json` 等
- 数字对应NFT的tokenId

## 元数据格式
每个JSON文件包含以下字段：
- `name`: NFT名称
- `description`: NFT描述
- `image`: 图片URL（通常是IPFS链接）
- `external_url`: 外部链接（可选）
- `attributes`: 特征数组

## 使用方式
在部署合约时，将元数据文件上传到IPFS或其他去中心化存储服务，然后将返回的URI用于铸造NFT。

## 当前IPFS链接
- **PIKAMEOW NFT (Token ID: 1)**: [https://green-imperial-swallow-885.mypinata.cloud/ipfs/bafkreigy6ozjkla3zvkspcqxygnvmnuttvsacnqkmk6gonfwmkkzbwcvim](https://green-imperial-swallow-885.mypinata.cloud/ipfs/bafkreigy6ozjkla3zvkspcqxygnvmnuttvsacnqkmk6gonfwmkkzbwcvim)

## 示例
```javascript
// 在测试或部署脚本中
const metadataURI = "https://green-imperial-swallow-885.mypinata.cloud/ipfs/bafkreigy6ozjkla3zvkspcqxygnvmnuttvsacnqkmk6gonfwmkkzbwcvim";
await nftContract.mintNFT(recipientAddress, metadataURI);
```

## 运行铸造脚本
```bash
npx hardhat run scripts/mintWithMetadata.js --network localhost
```
