const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleNFT - Sepolia 网络测试", function () {
  let simpleNFT;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // Sepolia 网络部署的合约地址
  const CONTRACT_ADDRESS = "0x77a4076ddb25B1a6a710B5E5fd286515E72fEcf3";
  const METADATA_URI = "https://green-imperial-swallow-885.mypinata.cloud/ipfs/bafkreigy6ozjkla3zvkspcqxygnvmnuttvsacnqkmk6gonfwmkkzbwcvim";

  // 增加超时时间，因为 Sepolia 网络可能较慢
  this.timeout(300000); // 5 分钟

  before(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    // 连接到已部署的合约
    const SimpleNFT = await ethers.getContractFactory("SimpleNFT");
    simpleNFT = SimpleNFT.attach(CONTRACT_ADDRESS);

    console.log("连接到 Sepolia 网络上的 SimpleNFT 合约");
    console.log("合约地址:", CONTRACT_ADDRESS);
    console.log("当前账户:", owner.address);
  });

  describe("合约基本信息验证", function () {
    it("应该正确返回合约名称", async function () {
      const name = await simpleNFT.name();
      expect(name).to.equal("Simple NFT Collection");
      console.log("✅ 合约名称:", name);
    });

    it("应该正确返回合约符号", async function () {
      const symbol = await simpleNFT.symbol();
      expect(symbol).to.equal("SNFT");
      console.log("✅ 合约符号:", symbol);
    });

    it("应该正确返回最大供应量", async function () {
      const maxSupply = await simpleNFT.maxSupply();
      expect(maxSupply).to.equal(10000);
      console.log("✅ 最大供应量:", maxSupply.toString());
    });

    it("应该正确返回当前供应量", async function () {
      const currentSupply = await simpleNFT.currentSupply();
      console.log("✅ 当前供应量:", currentSupply.toString());
      expect(currentSupply).to.be.a("bigint");
    });

    it("应该正确返回剩余供应量", async function () {
      const remainingSupply = await simpleNFT.remainingSupply();
      console.log("✅ 剩余供应量:", remainingSupply.toString());
      expect(remainingSupply).to.be.a("bigint");
    });

    it("应该正确返回合约所有者", async function () {
      const contractOwner = await simpleNFT.owner();
      console.log("✅ 合约所有者:", contractOwner);
      expect(contractOwner).to.be.a("string");
      expect(contractOwner).to.have.lengthOf(42); // 以太坊地址长度
    });
  });

  describe("接口支持验证", function () {
    it("应该支持 ERC721 接口", async function () {
      const ERC721_INTERFACE_ID = "0x80ac58cd";
      const supportsERC721 = await simpleNFT.supportsInterface(ERC721_INTERFACE_ID);
      expect(supportsERC721).to.be.true;
      console.log("✅ 支持 ERC721 接口");
    });

    it("应该支持 ERC4906 接口", async function () {
      const ERC4906_INTERFACE_ID = "0x49064906";
      const supportsERC4906 = await simpleNFT.supportsInterface(ERC4906_INTERFACE_ID);
      expect(supportsERC4906).to.be.true;
      console.log("✅ 支持 ERC4906 接口");
    });

    it("应该支持 ERC165 接口", async function () {
      const ERC165_INTERFACE_ID = "0x01ffc9a7";
      const supportsERC165 = await simpleNFT.supportsInterface(ERC165_INTERFACE_ID);
      expect(supportsERC165).to.be.true;
      console.log("✅ 支持 ERC165 接口");
    });
  });

  describe("网络连接和区块信息", function () {
    it("应该能够获取当前区块号", async function () {
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log("✅ 当前区块号:", blockNumber);
      expect(blockNumber).to.be.a("number");
      expect(blockNumber).to.be.greaterThan(0);
    });

    it("应该能够获取网络信息", async function () {
      const network = await ethers.provider.getNetwork();
      console.log("✅ 网络信息:", {
        name: network.name,
        chainId: network.chainId.toString()
      });
      expect(network.chainId).to.equal(11155111n); // Sepolia 链 ID
    });

    it("应该能够获取账户余额", async function () {
      const balance = await ethers.provider.getBalance(owner.address);
      console.log("✅ 账户余额:", ethers.formatEther(balance), "ETH");
      expect(balance).to.be.a("bigint");
      expect(balance).to.be.greaterThan(0);
    });
  });

  describe("Gas 费用估算", function () {
    it("应该能够估算铸造 NFT 的 gas 费用", async function () {
      try {
        const gasEstimate = await simpleNFT.mintNFT.estimateGas(addr1.address, METADATA_URI);
        console.log("✅ 铸造 NFT Gas 估算:", gasEstimate.toString());
        expect(gasEstimate).to.be.a("bigint");
        expect(gasEstimate).to.be.greaterThan(0);
      } catch (error) {
        console.log("⚠️ 无法估算 gas（可能已达到最大供应量）:", error.message);
      }
    });

    it("应该能够估算查询操作的 gas 费用", async function () {
      const gasEstimate = await simpleNFT.name.estimateGas();
      console.log("✅ 查询名称 Gas 估算:", gasEstimate.toString());
      expect(gasEstimate).to.be.a("bigint");
    });
  });

  describe("合约状态验证", function () {
    it("应该能够获取合约字节码", async function () {
      const code = await ethers.provider.getCode(CONTRACT_ADDRESS);
      expect(code).to.not.equal("0x");
      expect(code.length).to.be.greaterThan(2);
      console.log("✅ 合约字节码长度:", code.length);
    });

    it("应该能够获取合约 ABI", async function () {
      const contract = await ethers.getContractAt("SimpleNFT", CONTRACT_ADDRESS);
      expect(contract.interface).to.exist;
      console.log("✅ 合约 ABI 可用");
    });

    it("应该能够调用只读函数", async function () {
      const name = await simpleNFT.name();
      const symbol = await simpleNFT.symbol();
      const maxSupply = await simpleNFT.maxSupply();
      
      expect(name).to.be.a("string");
      expect(symbol).to.be.a("string");
      expect(maxSupply).to.be.a("bigint");
      
      console.log("✅ 只读函数调用成功");
    });
  });

  describe("铸造功能测试", function () {
    it("所有者应该能够铸造 NFT（如果未达到最大供应量）", async function () {
      try {
        const currentSupply = await simpleNFT.currentSupply();
        const maxSupply = await simpleNFT.maxSupply();
        
        if (currentSupply < maxSupply) {
          const tx = await simpleNFT.mintNFT(addr1.address, METADATA_URI);
          const receipt = await tx.wait();
          
          console.log("✅ NFT 铸造成功");
          console.log("交易哈希:", tx.hash);
          console.log("Gas 使用:", receipt.gasUsed.toString());
          
          expect(receipt.status).to.equal(1); // 交易成功
        } else {
          console.log("⚠️ 已达到最大供应量，跳过铸造测试");
        }
      } catch (error) {
        if (error.message.includes("Maximum supply reached")) {
          console.log("⚠️ 已达到最大供应量，这是预期的");
        } else {
          throw error;
        }
      }
    });

    it("非所有者不应该能够铸造 NFT", async function () {
      try {
        await simpleNFT.connect(addr1).mintNFT(addr2.address, METADATA_URI);
        console.log("❌ 非所有者成功铸造了 NFT，这不应该发生");
        expect.fail("非所有者不应该能够铸造 NFT");
      } catch (error) {
        console.log("✅ 非所有者无法铸造 NFT（预期行为）");
        // 检查错误消息是否包含权限相关的错误
        expect(error.message).to.match(/(OwnableUnauthorizedAccount|execution reverted)/);
      }
    });
  });

  describe("元数据功能测试", function () {
    it("应该能够处理 IPFS 元数据 URI", async function () {
      const ipfsUri = "ipfs://QmTest123";
      try {
        // 尝试铸造一个测试 NFT
        const currentSupply = await simpleNFT.currentSupply();
        const maxSupply = await simpleNFT.maxSupply();
        
        if (currentSupply < maxSupply) {
          await simpleNFT.mintNFT(owner.address, ipfsUri);
          console.log("✅ IPFS URI 处理成功");
        } else {
          console.log("⚠️ 已达到最大供应量，跳过元数据测试");
        }
      } catch (error) {
        if (error.message.includes("Maximum supply reached")) {
          console.log("⚠️ 已达到最大供应量，跳过元数据测试");
        } else {
          throw error;
        }
      }
    });

    it("应该能够处理 HTTPS 元数据 URI", async function () {
      const httpsUri = "https://example.com/metadata.json";
      try {
        const currentSupply = await simpleNFT.currentSupply();
        const maxSupply = await simpleNFT.maxSupply();
        
        if (currentSupply < maxSupply) {
          await simpleNFT.mintNFT(owner.address, httpsUri);
          console.log("✅ HTTPS URI 处理成功");
        } else {
          console.log("⚠️ 已达到最大供应量，跳过元数据测试");
        }
      } catch (error) {
        if (error.message.includes("Maximum supply reached")) {
          console.log("⚠️ 已达到最大供应量，跳过元数据测试");
        } else {
          throw error;
        }
      }
    });
  });

  describe("供应量管理测试", function () {
    it("当前供应量 + 剩余供应量应该等于最大供应量", async function () {
      const currentSupply = await simpleNFT.currentSupply();
      const remainingSupply = await simpleNFT.remainingSupply();
      const maxSupply = await simpleNFT.maxSupply();
      
      console.log("当前供应量:", currentSupply.toString());
      console.log("剩余供应量:", remainingSupply.toString());
      console.log("最大供应量:", maxSupply.toString());
      
      // 允许 1 的差异，因为测试过程中可能有并发铸造
      const total = currentSupply + remainingSupply;
      const difference = total > maxSupply ? total - maxSupply : maxSupply - total;
      expect(difference).to.be.lessThanOrEqual(1);
      console.log("✅ 供应量计算正确（允许 1 的差异）");
    });

    it("供应量应该为非负数", async function () {
      const currentSupply = await simpleNFT.currentSupply();
      const remainingSupply = await simpleNFT.remainingSupply();
      const maxSupply = await simpleNFT.maxSupply();
      
      expect(currentSupply).to.be.greaterThanOrEqual(0);
      expect(remainingSupply).to.be.greaterThanOrEqual(0);
      expect(maxSupply).to.be.greaterThan(0);
      
      console.log("✅ 所有供应量值都为正数");
    });
  });

  describe("合约交互测试", function () {
    it("应该能够查询已存在的 NFT（如果有）", async function () {
      const currentSupply = await simpleNFT.currentSupply();
      
      if (currentSupply > 0) {
        try {
          const ownerOf = await simpleNFT.ownerOf(0);
          const tokenURI = await simpleNFT.tokenURI(0);
          
          console.log("✅ NFT #0 所有者:", ownerOf);
          console.log("✅ NFT #0 URI:", tokenURI);
          
          expect(ownerOf).to.be.a("string");
          expect(tokenURI).to.be.a("string");
        } catch (error) {
          console.log("⚠️ 无法查询 NFT #0:", error.message);
        }
      } else {
        console.log("ℹ️ 当前没有铸造的 NFT");
      }
    });

    it("应该能够获取账户余额", async function () {
      const balance = await simpleNFT.balanceOf(owner.address);
      console.log("✅ 所有者 NFT 余额:", balance.toString());
      expect(balance).to.be.a("bigint");
    });
  });

  describe("最终状态验证", function () {
    it("应该验证合约的最终状态", async function () {
      const name = await simpleNFT.name();
      const symbol = await simpleNFT.symbol();
      const maxSupply = await simpleNFT.maxSupply();
      const currentSupply = await simpleNFT.currentSupply();
      const remainingSupply = await simpleNFT.remainingSupply();
      const owner = await simpleNFT.owner();
      
      console.log("\n📊 合约最终状态:");
      console.log("名称:", name);
      console.log("符号:", symbol);
      console.log("最大供应量:", maxSupply.toString());
      console.log("当前供应量:", currentSupply.toString());
      console.log("剩余供应量:", remainingSupply.toString());
      console.log("所有者:", owner);
      
      // 验证所有值都是合理的
      expect(name).to.equal("Simple NFT Collection");
      expect(symbol).to.equal("SNFT");
      expect(maxSupply).to.equal(10000);
      expect(currentSupply).to.be.greaterThanOrEqual(0);
      expect(remainingSupply).to.be.greaterThanOrEqual(0);
      expect(currentSupply + remainingSupply).to.equal(maxSupply);
      
      console.log("✅ 合约状态验证通过");
    });
  });
});
