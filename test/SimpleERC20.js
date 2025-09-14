const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleERC20", function () {
  let simpleERC20;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const TOKEN_NAME = "SimpleToken";
  const TOKEN_SYMBOL = "STK";
  const TOKEN_DECIMALS = 18;
  const INITIAL_SUPPLY = 1000000; // 1,000,000 tokens
  const INITIAL_SUPPLY_WEI = ethers.parseUnits(INITIAL_SUPPLY.toString(), TOKEN_DECIMALS);

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
    simpleERC20 = await SimpleERC20.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_DECIMALS,
      INITIAL_SUPPLY
    );
  });

  describe("部署和初始化", function () {
    it("应该正确设置代币名称", async function () {
      expect(await simpleERC20.name()).to.equal(TOKEN_NAME);
    });

    it("应该正确设置代币符号", async function () {
      expect(await simpleERC20.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("应该正确设置代币精度", async function () {
      expect(await simpleERC20.decimals()).to.equal(TOKEN_DECIMALS);
    });

    it("应该正确设置总供应量", async function () {
      expect(await simpleERC20.totalSupply()).to.equal(INITIAL_SUPPLY_WEI);
    });

    it("应该将初始供应量分配给部署者", async function () {
      expect(await simpleERC20.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI);
    });

    it("应该发射 Transfer 事件", async function () {
      const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
      const newToken = await SimpleERC20.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, INITIAL_SUPPLY);
      await expect(newToken.deploymentTransaction())
        .to.emit(newToken, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, INITIAL_SUPPLY_WEI);
    });
  });

  describe("View 函数", function () {
    it("name() 应该返回正确的代币名称", async function () {
      expect(await simpleERC20.name()).to.equal(TOKEN_NAME);
    });

    it("symbol() 应该返回正确的代币符号", async function () {
      expect(await simpleERC20.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("decimals() 应该返回正确的精度", async function () {
      expect(await simpleERC20.decimals()).to.equal(TOKEN_DECIMALS);
    });

    it("totalSupply() 应该返回正确的总供应量", async function () {
      expect(await simpleERC20.totalSupply()).to.equal(INITIAL_SUPPLY_WEI);
    });

    it("balanceOf() 应该返回正确的余额", async function () {
      expect(await simpleERC20.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI);
      expect(await simpleERC20.balanceOf(addr1.address)).to.equal(0);
    });

    it("allowance() 应该返回正确的授权额度", async function () {
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(0);
    });
  });

  describe("transfer 函数", function () {
    const transferAmount = ethers.parseEther("1000");

    it("应该成功转移代币", async function () {
      await expect(simpleERC20.transfer(addr1.address, transferAmount))
        .to.emit(simpleERC20, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);

      expect(await simpleERC20.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI - transferAmount);
      expect(await simpleERC20.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("应该返回 true", async function () {
      const tx = await simpleERC20.transfer(addr1.address, transferAmount);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("应该拒绝向零地址转移", async function () {
      await expect(simpleERC20.transfer(ethers.ZeroAddress, transferAmount))
        .to.be.revertedWithCustomError(simpleERC20, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });

    it("应该拒绝余额不足的转移", async function () {
      const excessiveAmount = INITIAL_SUPPLY_WEI + 1n;
      await expect(simpleERC20.transfer(addr1.address, excessiveAmount))
        .to.be.revertedWithCustomError(simpleERC20, "ERC20InsufficientBalance")
        .withArgs(owner.address, INITIAL_SUPPLY_WEI, excessiveAmount);
    });

    it("应该处理零金额转移", async function () {
      await expect(simpleERC20.transfer(addr1.address, 0))
        .to.emit(simpleERC20, "Transfer")
        .withArgs(owner.address, addr1.address, 0);
    });
  });

  describe("approve 函数", function () {
    const approveAmount = ethers.parseEther("5000");

    it("应该成功授权代币", async function () {
      await expect(simpleERC20.approve(addr1.address, approveAmount))
        .to.emit(simpleERC20, "Approval")
        .withArgs(owner.address, addr1.address, approveAmount);

      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });

    it("应该返回 true", async function () {
      const tx = await simpleERC20.approve(addr1.address, approveAmount);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("应该拒绝向零地址授权", async function () {
      await expect(simpleERC20.approve(ethers.ZeroAddress, approveAmount))
        .to.be.revertedWithCustomError(simpleERC20, "ERC20InvalidSpender")
        .withArgs(ethers.ZeroAddress);
    });

    it("应该允许更新授权额度", async function () {
      const newAmount = ethers.parseEther("3000");
      
      await simpleERC20.approve(addr1.address, approveAmount);
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(approveAmount);

      await simpleERC20.approve(addr1.address, newAmount);
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(newAmount);
    });

    it("应该允许设置为零授权", async function () {
      await simpleERC20.approve(addr1.address, approveAmount);
      await simpleERC20.approve(addr1.address, 0);
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(0);
    });
  });

  describe("transferFrom 函数", function () {
    const approveAmount = ethers.parseEther("2000");
    const transferAmount = ethers.parseEther("1000");

    beforeEach(async function () {
      await simpleERC20.approve(addr1.address, approveAmount);
    });

    it("应该成功从授权账户转移代币", async function () {
      await expect(simpleERC20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
        .to.emit(simpleERC20, "Transfer")
        .withArgs(owner.address, addr2.address, transferAmount);

      expect(await simpleERC20.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI - transferAmount);
      expect(await simpleERC20.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(approveAmount - transferAmount);
    });

    it("应该返回 true", async function () {
      const tx = await simpleERC20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("应该拒绝从零地址转移", async function () {
      await expect(simpleERC20.connect(addr1).transferFrom(ethers.ZeroAddress, addr2.address, transferAmount))
        .to.be.revertedWithCustomError(simpleERC20, "ERC20InvalidSender")
        .withArgs(ethers.ZeroAddress);
    });

    it("应该拒绝向零地址转移", async function () {
      await expect(simpleERC20.connect(addr1).transferFrom(owner.address, ethers.ZeroAddress, transferAmount))
        .to.be.revertedWithCustomError(simpleERC20, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });

    it("应该拒绝授权不足的转移", async function () {
      const excessiveAmount = approveAmount + 1n;
      await expect(simpleERC20.connect(addr1).transferFrom(owner.address, addr2.address, excessiveAmount))
        .to.be.revertedWithCustomError(simpleERC20, "ERC20InsufficientAllowance")
        .withArgs(addr1.address, approveAmount, excessiveAmount);
    });

    it("应该拒绝余额不足的转移", async function () {
      const excessiveAmount = INITIAL_SUPPLY_WEI + 1n;
      await simpleERC20.approve(addr1.address, excessiveAmount);
      await expect(simpleERC20.connect(addr1).transferFrom(owner.address, addr2.address, excessiveAmount))
        .to.be.revertedWithCustomError(simpleERC20, "ERC20InsufficientBalance")
        .withArgs(owner.address, INITIAL_SUPPLY_WEI, excessiveAmount);
    });

    it("应该处理最大授权额度", async function () {
      await simpleERC20.approve(addr1.address, ethers.MaxUint256);
      await simpleERC20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(ethers.MaxUint256);
    });
  });

  describe("mint 函数", function () {
    const mintAmount = ethers.parseEther("50000");

    it("应该成功铸造代币", async function () {
      await expect(simpleERC20.mint(addr1.address, mintAmount))
        .to.emit(simpleERC20, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);

      expect(await simpleERC20.balanceOf(addr1.address)).to.equal(mintAmount);
      expect(await simpleERC20.totalSupply()).to.equal(INITIAL_SUPPLY_WEI + mintAmount);
    });

    it("应该拒绝非所有者调用", async function () {
      await expect(simpleERC20.connect(addr1).mint(addr2.address, mintAmount))
        .to.be.revertedWith("Not the owner");
    });

    it("应该拒绝向零地址铸造", async function () {
      await expect(simpleERC20.mint(ethers.ZeroAddress, mintAmount))
        .to.be.revertedWithCustomError(simpleERC20, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });

    it("应该允许向所有者铸造", async function () {
      const ownerBalanceBefore = await simpleERC20.balanceOf(owner.address);
      await simpleERC20.mint(owner.address, mintAmount);
      expect(await simpleERC20.balanceOf(owner.address)).to.equal(ownerBalanceBefore + mintAmount);
    });

    it("应该正确更新总供应量", async function () {
      const totalSupplyBefore = await simpleERC20.totalSupply();
      await simpleERC20.mint(addr1.address, mintAmount);
      expect(await simpleERC20.totalSupply()).to.equal(totalSupplyBefore + mintAmount);
    });
  });

  describe("事件发射", function () {
    it("Transfer 事件应该正确发射", async function () {
      const transferAmount = ethers.parseEther("1000");
      await expect(simpleERC20.transfer(addr1.address, transferAmount))
        .to.emit(simpleERC20, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Approval 事件应该正确发射", async function () {
      const approveAmount = ethers.parseEther("5000");
      await expect(simpleERC20.approve(addr1.address, approveAmount))
        .to.emit(simpleERC20, "Approval")
        .withArgs(owner.address, addr1.address, approveAmount);
    });

    it("Mint 事件应该正确发射", async function () {
      const mintAmount = ethers.parseEther("10000");
      await expect(simpleERC20.mint(addr1.address, mintAmount))
        .to.emit(simpleERC20, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);
    });
  });

  describe("边界情况", function () {
    it("应该处理最大 uint256 值", async function () {
      const maxAmount = ethers.MaxUint256;
      await simpleERC20.approve(addr1.address, maxAmount);
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(maxAmount);
    });

    it("应该处理零金额操作", async function () {
      await simpleERC20.transfer(addr1.address, 0);
      await simpleERC20.approve(addr1.address, 0);
      await simpleERC20.connect(addr1).transferFrom(owner.address, addr2.address, 0);
      await simpleERC20.mint(addr1.address, 0);
    });

    it("应该处理精确的余额转移", async function () {
      const exactAmount = INITIAL_SUPPLY_WEI;
      await simpleERC20.transfer(addr1.address, exactAmount);
      expect(await simpleERC20.balanceOf(owner.address)).to.equal(0);
      expect(await simpleERC20.balanceOf(addr1.address)).to.equal(exactAmount);
    });
  });

  describe("权限控制", function () {
    it("只有所有者可以调用 mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      
      // 所有者可以调用
      await simpleERC20.mint(addr1.address, mintAmount);
      
      // 非所有者不能调用
      await expect(simpleERC20.connect(addr1).mint(addr2.address, mintAmount))
        .to.be.revertedWith("Not the owner");
      
      await expect(simpleERC20.connect(addr2).mint(addr1.address, mintAmount))
        .to.be.revertedWith("Not the owner");
    });
  });

  describe("集成测试", function () {
    it("完整的代币生命周期", async function () {
      const transferAmount = ethers.parseEther("10000");
      const approveAmount = ethers.parseEther("5000");
      const mintAmount = ethers.parseEther("20000");

      // 1. 初始状态
      expect(await simpleERC20.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI);
      expect(await simpleERC20.balanceOf(addr1.address)).to.equal(0);

      // 2. 转移代币
      await simpleERC20.transfer(addr1.address, transferAmount);
      expect(await simpleERC20.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY_WEI - transferAmount);
      expect(await simpleERC20.balanceOf(addr1.address)).to.equal(transferAmount);

      // 3. 授权代币
      await simpleERC20.approve(addr1.address, approveAmount);
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(approveAmount);

      // 4. 从授权转移
      await simpleERC20.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount);
      expect(await simpleERC20.balanceOf(addr2.address)).to.equal(approveAmount);
      expect(await simpleERC20.allowance(owner.address, addr1.address)).to.equal(0);

      // 5. 铸造新代币
      await simpleERC20.mint(addr1.address, mintAmount);
      expect(await simpleERC20.balanceOf(addr1.address)).to.equal(transferAmount + mintAmount);
      expect(await simpleERC20.totalSupply()).to.equal(INITIAL_SUPPLY_WEI + mintAmount);
    });
  });
});
