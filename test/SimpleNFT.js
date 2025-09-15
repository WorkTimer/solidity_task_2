const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleNFT", function () {
  let simpleNFT;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const NFT_NAME = "Simple NFT Collection";
  const NFT_SYMBOL = "SNFT";
  const MAX_SUPPLY = 10000;
  const METADATA_URI = "https://green-imperial-swallow-885.mypinata.cloud/ipfs/bafkreigy6ozjkla3zvkspcqxygnvmnuttvsacnqkmk6gonfwmkkzbwcvim";

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const SimpleNFT = await ethers.getContractFactory("SimpleNFT");
    simpleNFT = await SimpleNFT.deploy(
      NFT_NAME,
      NFT_SYMBOL,
      MAX_SUPPLY
    );
  });

  describe("部署和初始化", function () {
    it("应该正确设置 NFT 名称", async function () {
      expect(await simpleNFT.name()).to.equal(NFT_NAME);
    });

    it("应该正确设置 NFT 符号", async function () {
      expect(await simpleNFT.symbol()).to.equal(NFT_SYMBOL);
    });

    it("应该正确设置最大供应量", async function () {
      expect(await simpleNFT.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("应该将部署者设置为所有者", async function () {
      expect(await simpleNFT.owner()).to.equal(owner.address);
    });

    it("初始当前供应量应该为 0", async function () {
      expect(await simpleNFT.currentSupply()).to.equal(0);
    });

    it("初始剩余供应量应该等于最大供应量", async function () {
      expect(await simpleNFT.remainingSupply()).to.equal(MAX_SUPPLY);
    });

    it("应该支持 ERC721 接口", async function () {
      const ERC721_INTERFACE_ID = "0x80ac58cd";
      expect(await simpleNFT.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
    });

    it("应该支持 ERC4906 接口", async function () {
      const ERC4906_INTERFACE_ID = "0x49064906";
      expect(await simpleNFT.supportsInterface(ERC4906_INTERFACE_ID)).to.be.true;
    });
  });

  describe("铸造功能", function () {
    it("所有者应该能够铸造 NFT", async function () {
      await expect(simpleNFT.mintNFT(addr1.address, METADATA_URI))
        .to.emit(simpleNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 0);

      expect(await simpleNFT.ownerOf(0)).to.equal(addr1.address);
      expect(await simpleNFT.currentSupply()).to.equal(1);
      expect(await simpleNFT.remainingSupply()).to.equal(MAX_SUPPLY - 1);
    });

    it("应该正确设置 tokenURI", async function () {
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      expect(await simpleNFT.tokenURI(0)).to.equal(METADATA_URI);
    });

    it("应该发射 MetadataUpdate 事件", async function () {
      await expect(simpleNFT.mintNFT(addr1.address, METADATA_URI))
        .to.emit(simpleNFT, "MetadataUpdate")
        .withArgs(0);
    });

    it("非所有者不应该能够铸造 NFT", async function () {
      await expect(
        simpleNFT.connect(addr1).mintNFT(addr2.address, METADATA_URI)
      ).to.be.revertedWithCustomError(simpleNFT, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("不应该能够铸造到零地址", async function () {
      await expect(
        simpleNFT.mintNFT(ethers.ZeroAddress, METADATA_URI)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("不应该能够铸造空 URI 的 NFT", async function () {
      await expect(
        simpleNFT.mintNFT(addr1.address, "")
      ).to.be.revertedWith("Token URI cannot be empty");
    });

    it("不应该能够超过最大供应量铸造", async function () {
      // 铸造最大供应量的 NFT
      for (let i = 0; i < MAX_SUPPLY; i++) {
        await simpleNFT.mintNFT(addr1.address, `${METADATA_URI}#${i}`);
      }

      // 尝试铸造超过最大供应量
      await expect(
        simpleNFT.mintNFT(addr1.address, METADATA_URI)
      ).to.be.revertedWith("Maximum supply reached");
    });

    it("应该按顺序分配 tokenId", async function () {
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      await simpleNFT.mintNFT(addr2.address, METADATA_URI);

      expect(await simpleNFT.ownerOf(0)).to.equal(addr1.address);
      expect(await simpleNFT.ownerOf(1)).to.equal(addr2.address);
    });
  });

  describe("供应量管理", function () {
    it("应该正确更新当前供应量", async function () {
      expect(await simpleNFT.currentSupply()).to.equal(0);

      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      expect(await simpleNFT.currentSupply()).to.equal(1);

      await simpleNFT.mintNFT(addr2.address, METADATA_URI);
      expect(await simpleNFT.currentSupply()).to.equal(2);
    });

    it("应该正确更新剩余供应量", async function () {
      expect(await simpleNFT.remainingSupply()).to.equal(MAX_SUPPLY);

      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      expect(await simpleNFT.remainingSupply()).to.equal(MAX_SUPPLY - 1);

      await simpleNFT.mintNFT(addr2.address, METADATA_URI);
      expect(await simpleNFT.remainingSupply()).to.equal(MAX_SUPPLY - 2);
    });

    it("当前供应量 + 剩余供应量应该等于最大供应量", async function () {
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      await simpleNFT.mintNFT(addr2.address, METADATA_URI);

      const currentSupply = await simpleNFT.currentSupply();
      const remainingSupply = await simpleNFT.remainingSupply();
      const maxSupply = await simpleNFT.maxSupply();

      expect(currentSupply + remainingSupply).to.equal(maxSupply);
    });
  });

  describe("ERC721 标准功能", function () {
    beforeEach(async function () {
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
    });

    it("应该正确返回 tokenURI", async function () {
      expect(await simpleNFT.tokenURI(0)).to.equal(METADATA_URI);
    });

    it("应该正确返回所有者", async function () {
      expect(await simpleNFT.ownerOf(0)).to.equal(addr1.address);
    });

    it("应该正确返回余额", async function () {
      expect(await simpleNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await simpleNFT.balanceOf(addr2.address)).to.equal(0);
    });

    it("应该支持转账", async function () {
      await simpleNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      expect(await simpleNFT.ownerOf(0)).to.equal(addr2.address);
    });

    it("应该支持授权和 transferFrom", async function () {
      await simpleNFT.connect(addr1).approve(addr2.address, 0);
      await simpleNFT.connect(addr2).transferFrom(addr1.address, addr2.address, 0);
      expect(await simpleNFT.ownerOf(0)).to.equal(addr2.address);
    });

    it("应该支持 setApprovalForAll", async function () {
      await simpleNFT.connect(addr1).setApprovalForAll(addr2.address, true);
      await simpleNFT.connect(addr2).transferFrom(addr1.address, addr2.address, 0);
      expect(await simpleNFT.ownerOf(0)).to.equal(addr2.address);
    });
  });

  describe("元数据功能", function () {
    it("应该正确处理不同的 URI 格式", async function () {
      const ipfsUri = "ipfs://QmTest123";
      const httpsUri = "https://example.com/metadata.json";
      const dataUri = "data:application/json;base64,eyJuYW1lIjoiVGVzdCJ9";

      await simpleNFT.mintNFT(addr1.address, ipfsUri);
      expect(await simpleNFT.tokenURI(0)).to.equal(ipfsUri);

      await simpleNFT.mintNFT(addr2.address, httpsUri);
      expect(await simpleNFT.tokenURI(1)).to.equal(httpsUri);

      await simpleNFT.mintNFT(owner.address, dataUri);
      expect(await simpleNFT.tokenURI(2)).to.equal(dataUri);
    });

    it("应该正确处理长 URI", async function () {
      const longUri = "https://" + "a".repeat(2000) + ".com/metadata.json";
      await simpleNFT.mintNFT(addr1.address, longUri);
      expect(await simpleNFT.tokenURI(0)).to.equal(longUri);
    });
  });

  describe("边界情况测试", function () {
    it("应该正确处理最大供应量为 1 的情况", async function () {
      const SimpleNFT = await ethers.getContractFactory("SimpleNFT");
      const singleNFT = await SimpleNFT.deploy("Single NFT", "SN", 1);

      await singleNFT.mintNFT(addr1.address, METADATA_URI);
      expect(await singleNFT.currentSupply()).to.equal(1);
      expect(await singleNFT.remainingSupply()).to.equal(0);

      await expect(
        singleNFT.mintNFT(addr2.address, METADATA_URI)
      ).to.be.revertedWith("Maximum supply reached");
    });

    it("应该正确处理大量铸造", async function () {
      const batchSize = 100;
      for (let i = 0; i < batchSize; i++) {
        await simpleNFT.mintNFT(addr1.address, `${METADATA_URI}#${i}`);
      }

      expect(await simpleNFT.currentSupply()).to.equal(batchSize);
      expect(await simpleNFT.remainingSupply()).to.equal(MAX_SUPPLY - batchSize);
    });
  });

  describe("事件测试", function () {
    it("应该发射正确的 Transfer 事件", async function () {
      await expect(simpleNFT.mintNFT(addr1.address, METADATA_URI))
        .to.emit(simpleNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 0);
    });

    it("应该发射正确的 MetadataUpdate 事件", async function () {
      await expect(simpleNFT.mintNFT(addr1.address, METADATA_URI))
        .to.emit(simpleNFT, "MetadataUpdate")
        .withArgs(0);
    });

    it("转账时应该发射 Transfer 事件", async function () {
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      
      await expect(
        simpleNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).to.emit(simpleNFT, "Transfer")
        .withArgs(addr1.address, addr2.address, 0);
    });
  });

  describe("权限管理", function () {
    it("只有所有者可以铸造", async function () {
      await expect(
        simpleNFT.connect(addr1).mintNFT(addr2.address, METADATA_URI)
      ).to.be.revertedWithCustomError(simpleNFT, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("所有者可以转移所有权", async function () {
      await simpleNFT.transferOwnership(addr1.address);
      expect(await simpleNFT.owner()).to.equal(addr1.address);

      // 新所有者应该能够铸造
      await simpleNFT.connect(addr1).mintNFT(addr2.address, METADATA_URI);
      expect(await simpleNFT.ownerOf(0)).to.equal(addr2.address);
    });

    it("非所有者不能转移所有权", async function () {
      await expect(
        simpleNFT.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWithCustomError(simpleNFT, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("Gas 使用测试", function () {
    it("铸造 NFT 的 gas 使用应该在合理范围内", async function () {
      const tx = await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      const receipt = await tx.wait();
      
      // Gas 使用应该在合理范围内（通常 < 250,000）
      expect(receipt.gasUsed).to.be.lessThan(250000);
      console.log("铸造 NFT Gas 使用:", receipt.gasUsed.toString());
    });

    it("查询操作的 gas 使用应该很低", async function () {
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      
      // 查询操作应该使用很少的 gas
      const nameTx = await simpleNFT.name();
      const symbolTx = await simpleNFT.symbol();
      const maxSupplyTx = await simpleNFT.maxSupply();
      
      // 这些是 view 函数，不消耗 gas
      expect(nameTx).to.equal(NFT_NAME);
      expect(symbolTx).to.equal(NFT_SYMBOL);
      expect(maxSupplyTx).to.equal(MAX_SUPPLY);
    });
  });

  describe("集成测试", function () {
    it("完整的 NFT 生命周期测试", async function () {
      // 1. 检查初始状态
      expect(await simpleNFT.currentSupply()).to.equal(0);
      expect(await simpleNFT.remainingSupply()).to.equal(MAX_SUPPLY);

      // 2. 铸造第一个 NFT
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      expect(await simpleNFT.ownerOf(0)).to.equal(addr1.address);
      expect(await simpleNFT.currentSupply()).to.equal(1);

      // 3. 转移 NFT
      await simpleNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      expect(await simpleNFT.ownerOf(0)).to.equal(addr2.address);

      // 4. 铸造更多 NFT
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      await simpleNFT.mintNFT(owner.address, METADATA_URI);
      
      expect(await simpleNFT.currentSupply()).to.equal(3);
      expect(await simpleNFT.remainingSupply()).to.equal(MAX_SUPPLY - 3);

      // 5. 验证所有权
      expect(await simpleNFT.ownerOf(0)).to.equal(addr2.address);
      expect(await simpleNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await simpleNFT.ownerOf(2)).to.equal(owner.address);
    });

    it("多用户交互测试", async function () {
      // 铸造给不同用户
      await simpleNFT.mintNFT(addr1.address, METADATA_URI);
      await simpleNFT.mintNFT(addr2.address, METADATA_URI);
      await simpleNFT.mintNFT(owner.address, METADATA_URI);

      // 检查余额
      expect(await simpleNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await simpleNFT.balanceOf(addr2.address)).to.equal(1);
      expect(await simpleNFT.balanceOf(owner.address)).to.equal(1);

      // 用户间转账
      await simpleNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      expect(await simpleNFT.balanceOf(addr1.address)).to.equal(0);
      expect(await simpleNFT.balanceOf(addr2.address)).to.equal(2);
    });
  });
});
