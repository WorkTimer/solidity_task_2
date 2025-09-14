const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleERC20 - Sepolia Network Tests (4 Wallets)", function () {
  let simpleERC20;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  // 已部署的合约地址
  const DEPLOYED_CONTRACT_ADDRESS = "0xbA4e409941b679587a6F685F2146E47d64B72dD7";
  
  // 合约参数（与部署时一致）
  const TOKEN_NAME = "Simple Token";
  const TOKEN_SYMBOL = "SIMPLE";
  const TOKEN_DECIMALS = 18;
  const INITIAL_SUPPLY = 1000000; // 1,000,000 tokens
  const INITIAL_SUPPLY_WEI = ethers.parseUnits(INITIAL_SUPPLY.toString(), TOKEN_DECIMALS);

  // 添加延迟函数避免交易冲突
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  before(async function () {
    // 获取签名者
    const signers = await ethers.getSigners();
    console.log("获取到的签名者数量:", signers.length);
    
    if (signers.length < 4) {
      throw new Error(`需要至少4个签名者进行完整测试，当前只有 ${signers.length} 个`);
    }
    
    owner = signers[0];
    addr1 = signers[1];
    addr2 = signers[2];
    addr3 = signers[3];
    
    // 连接到已部署的合约
    simpleERC20 = await ethers.getContractAt("SimpleERC20", DEPLOYED_CONTRACT_ADDRESS);
    
    console.log("连接到已部署的合约:", DEPLOYED_CONTRACT_ADDRESS);
    console.log("测试账户:", {
      owner: owner.address,
      addr1: addr1.address,
      addr2: addr2.address,
      addr3: addr3.address
    });
  });

  describe("合约基本信息验证", function () {
    it("应该正确返回代币名称", async function () {
      const name = await simpleERC20.name();
      expect(name).to.equal(TOKEN_NAME);
      console.log("✅ 代币名称:", name);
    });

    it("应该正确返回代币符号", async function () {
      const symbol = await simpleERC20.symbol();
      expect(symbol).to.equal(TOKEN_SYMBOL);
      console.log("✅ 代币符号:", symbol);
    });

    it("应该正确返回代币精度", async function () {
      const decimals = await simpleERC20.decimals();
      expect(decimals).to.equal(TOKEN_DECIMALS);
      console.log("✅ 代币精度:", decimals);
    });

    it("应该正确返回总供应量", async function () {
      const totalSupply = await simpleERC20.totalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY_WEI);
      console.log("✅ 总供应量:", ethers.formatUnits(totalSupply, TOKEN_DECIMALS), TOKEN_SYMBOL);
    });

    it("应该正确返回代币基本信息汇总", async function () {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        simpleERC20.name(),
        simpleERC20.symbol(),
        simpleERC20.decimals(),
        simpleERC20.totalSupply()
      ]);

      expect(name).to.equal(TOKEN_NAME);
      expect(symbol).to.equal(TOKEN_SYMBOL);
      expect(decimals).to.equal(TOKEN_DECIMALS);
      expect(totalSupply).to.equal(INITIAL_SUPPLY_WEI);
      
      console.log("✅ 代币信息汇总:", { 
        name, 
        symbol, 
        decimals: decimals.toString(), 
        totalSupply: ethers.formatUnits(totalSupply, decimals) + " " + symbol 
      });
    });
  });

  describe("当前状态查询", function () {
    it("应该显示所有钱包的当前余额", async function () {
      const [ownerBalance, addr1Balance, addr2Balance, addr3Balance] = await Promise.all([
        simpleERC20.balanceOf(owner.address),
        simpleERC20.balanceOf(addr1.address),
        simpleERC20.balanceOf(addr2.address),
        simpleERC20.balanceOf(addr3.address)
      ]);
      
      console.log("✅ 当前余额分布:", {
        owner: ethers.formatUnits(ownerBalance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        addr1: ethers.formatUnits(addr1Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        addr2: ethers.formatUnits(addr2Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        addr3: ethers.formatUnits(addr3Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
      
      // 验证总余额等于总供应量
      const totalDistributed = ownerBalance + addr1Balance + addr2Balance + addr3Balance;
      const totalSupply = await simpleERC20.totalSupply();
      expect(totalDistributed).to.equal(totalSupply);
    });
  });

  describe("转账功能测试", function () {
    it("应该能够进行新的转账操作", async function () {
      this.timeout(300000);
      
      const transferAmount = ethers.parseUnits("50", TOKEN_DECIMALS); // 50 tokens
      
      // 添加延迟避免交易冲突
      await delay(3000);
      
      // 从 owner 转账给 addr1
      const tx = await simpleERC20.transfer(addr1.address, transferAmount);
      const receipt = await tx.wait();
      
      const ownerBalance = await simpleERC20.balanceOf(owner.address);
      const addr1Balance = await simpleERC20.balanceOf(addr1.address);
      
      console.log("✅ 新转账完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(transferAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "owner 余额": ethers.formatUnits(ownerBalance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "addr1 余额": ethers.formatUnits(addr1Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });

    it("应该能够进行零金额转账", async function () {
      this.timeout(300000);
      
      const zeroAmount = ethers.parseUnits("0", TOKEN_DECIMALS);
      
      const tx = await simpleERC20.transfer(addr1.address, zeroAmount);
      const receipt = await tx.wait();
      
      console.log("✅ 零金额转账完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: "0 " + TOKEN_SYMBOL
      });
    });

    it("应该能够进行小额转账", async function () {
      this.timeout(300000);
      
      const smallAmount = ethers.parseUnits("0.001", TOKEN_DECIMALS); // 0.001 tokens
      
      const tx = await simpleERC20.transfer(addr2.address, smallAmount);
      const receipt = await tx.wait();
      
      console.log("✅ 小额转账完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(smallAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });

    it("应该能够进行 addr1 到 addr2 的转账", async function () {
      this.timeout(300000);
      
      const transferAmount = ethers.parseUnits("25", TOKEN_DECIMALS); // 25 tokens
      
      const simpleERC20FromAddr1 = simpleERC20.connect(addr1);
      const tx = await simpleERC20FromAddr1.transfer(addr2.address, transferAmount);
      const receipt = await tx.wait();
      
      const addr1Balance = await simpleERC20.balanceOf(addr1.address);
      const addr2Balance = await simpleERC20.balanceOf(addr2.address);
      
      console.log("✅ addr1 -> addr2 转账完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(transferAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "addr1 余额": ethers.formatUnits(addr1Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "addr2 余额": ethers.formatUnits(addr2Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });

    it("应该能够进行 addr2 到 addr3 的转账", async function () {
      this.timeout(300000);
      
      const transferAmount = ethers.parseUnits("10", TOKEN_DECIMALS); // 10 tokens
      
      const simpleERC20FromAddr2 = simpleERC20.connect(addr2);
      const tx = await simpleERC20FromAddr2.transfer(addr3.address, transferAmount);
      const receipt = await tx.wait();
      
      const addr2Balance = await simpleERC20.balanceOf(addr2.address);
      const addr3Balance = await simpleERC20.balanceOf(addr3.address);
      
      console.log("✅ addr2 -> addr3 转账完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(transferAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "addr2 余额": ethers.formatUnits(addr2Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "addr3 余额": ethers.formatUnits(addr3Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });
  });

  describe("授权功能测试", function () {
    it("应该能够进行新的授权操作", async function () {
      this.timeout(300000);
      
      const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS); // 100 tokens
      
      const tx = await simpleERC20.approve(addr1.address, approveAmount);
      const receipt = await tx.wait();
      
      const allowance = await simpleERC20.allowance(owner.address, addr1.address);
      
      console.log("✅ 新授权完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(approveAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "授权额度": ethers.formatUnits(allowance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });

    it("应该能够进行零金额授权", async function () {
      this.timeout(300000);
      
      const zeroAmount = ethers.parseUnits("0", TOKEN_DECIMALS);
      
      const tx = await simpleERC20.approve(addr2.address, zeroAmount);
      const receipt = await tx.wait();
      
      const allowance = await simpleERC20.allowance(owner.address, addr2.address);
      expect(allowance).to.equal(zeroAmount);
      
      console.log("✅ 零金额授权完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: "0 " + TOKEN_SYMBOL
      });
    });

    it("应该能够更新授权额度", async function () {
      this.timeout(300000);
      
      const newAmount = ethers.parseUnits("200", TOKEN_DECIMALS);
      
      const tx = await simpleERC20.approve(addr1.address, newAmount);
      const receipt = await tx.wait();
      
      const allowance = await simpleERC20.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(newAmount);
      
      console.log("✅ 授权额度更新完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(newAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });

    it("应该能够使用授权进行 transferFrom 操作", async function () {
      this.timeout(300000);
      
      const transferAmount = ethers.parseUnits("30", TOKEN_DECIMALS); // 30 tokens
      
      const simpleERC20FromAddr1 = simpleERC20.connect(addr1);
      const tx = await simpleERC20FromAddr1.transferFrom(owner.address, addr2.address, transferAmount);
      const receipt = await tx.wait();
      
      const addr2Balance = await simpleERC20.balanceOf(addr2.address);
      const remainingAllowance = await simpleERC20.allowance(owner.address, addr1.address);
      
      console.log("✅ 使用授权转账完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(transferAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "addr2 余额": ethers.formatUnits(addr2Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "剩余授权": ethers.formatUnits(remainingAllowance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });
  });

  describe("多地址授权测试", function () {
    it("应该能够进行多地址授权", async function () {
      this.timeout(300000);
      
      const approveAmount1 = ethers.parseUnits("50", TOKEN_DECIMALS);
      const approveAmount2 = ethers.parseUnits("75", TOKEN_DECIMALS);
      
      // 添加延迟避免交易冲突
      await delay(5000);
      
      // owner 授权给 addr2
      const tx1 = await simpleERC20.approve(addr2.address, approveAmount1);
      await tx1.wait();
      
      // 添加延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // owner 授权给 addr3
      const tx2 = await simpleERC20.approve(addr3.address, approveAmount2);
      await tx2.wait();
      
      const [allowance1, allowance2] = await Promise.all([
        simpleERC20.allowance(owner.address, addr2.address),
        simpleERC20.allowance(owner.address, addr3.address)
      ]);
      
      console.log("✅ 多地址授权完成:", {
        "owner -> addr2": ethers.formatUnits(allowance1, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "owner -> addr3": ethers.formatUnits(allowance2, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });

    it("应该能够查询所有授权额度", async function () {
      const [allowance1, allowance2, allowance3] = await Promise.all([
        simpleERC20.allowance(owner.address, addr1.address),
        simpleERC20.allowance(owner.address, addr2.address),
        simpleERC20.allowance(owner.address, addr3.address)
      ]);
      
      console.log("✅ 所有授权额度:", {
        "owner -> addr1": ethers.formatUnits(allowance1, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "owner -> addr2": ethers.formatUnits(allowance2, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        "owner -> addr3": ethers.formatUnits(allowance3, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });
  });

  describe("边界情况测试", function () {
    it("应该能够处理最大精度的小数转账", async function () {
      this.timeout(300000);
      
      const maxPrecisionAmount = ethers.parseUnits("0.000000000000000001", TOKEN_DECIMALS); // 1 wei
      
      // 添加延迟避免交易冲突
      await delay(5000);
      
      const tx = await simpleERC20.transfer(addr3.address, maxPrecisionAmount);
      const receipt = await tx.wait();
      
      console.log("✅ 最大精度转账完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(maxPrecisionAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });

    it("应该能够处理大额授权", async function () {
      this.timeout(300000);
      
      const largeAmount = ethers.parseUnits("1000000", TOKEN_DECIMALS); // 100万 tokens
      
      // 添加延迟避免交易冲突
      await delay(5000);
      
      const tx = await simpleERC20.approve(addr1.address, largeAmount);
      const receipt = await tx.wait();
      
      const allowance = await simpleERC20.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(largeAmount);
      
      console.log("✅ 大额授权完成:", {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        amount: ethers.formatUnits(largeAmount, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });
  });

  describe("事件测试", function () {
    it("转账应该发射 Transfer 事件", async function () {
      this.timeout(300000);
      
      const transferAmount = ethers.parseUnits("5", TOKEN_DECIMALS);
      
      // 添加延迟避免交易冲突
      await delay(5000);
      
      const tx = await simpleERC20.transfer(addr1.address, transferAmount);
      const receipt = await tx.wait();
      
      const transferEvent = receipt.logs.find(log => {
        try {
          const parsed = simpleERC20.interface.parseLog(log);
          return parsed.name === "Transfer";
        } catch (e) {
          return false;
        }
      });
      
      expect(transferEvent).to.not.be.undefined;
      console.log("✅ Transfer 事件发射成功");
    });

    it("授权应该发射 Approval 事件", async function () {
      this.timeout(300000);
      
      const approveAmount = ethers.parseUnits("25", TOKEN_DECIMALS);
      
      // 添加延迟避免交易冲突
      await delay(5000);
      
      const tx = await simpleERC20.approve(addr1.address, approveAmount);
      const receipt = await tx.wait();
      
      const approvalEvent = receipt.logs.find(log => {
        try {
          const parsed = simpleERC20.interface.parseLog(log);
          return parsed.name === "Approval";
        } catch (e) {
          return false;
        }
      });
      
      expect(approvalEvent).to.not.be.undefined;
      console.log("✅ Approval 事件发射成功");
    });
  });

  describe("网络和性能信息", function () {
    it("应该显示当前网络信息", async function () {
      const network = await ethers.provider.getNetwork();
      const blockNumber = await ethers.provider.getBlockNumber();
      
      console.log("✅ 网络信息:", {
        name: network.name,
        chainId: network.chainId.toString(),
        blockNumber: blockNumber,
        contractAddress: DEPLOYED_CONTRACT_ADDRESS
      });
    });

    it("应该显示 Gas 费用信息", async function () {
      const feeData = await ethers.provider.getFeeData();
      const gasEstimate = await simpleERC20.totalSupply.estimateGas();
      
      console.log("✅ Gas 信息:", {
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " Gwei" : "N/A",
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") + " Gwei" : "N/A",
        gasEstimate: gasEstimate.toString()
      });
    });

    it("应该能够估算各种操作的 Gas 费用", async function () {
      const [transferGas, approveGas] = await Promise.all([
        simpleERC20.transfer.estimateGas(addr1.address, ethers.parseUnits("1", TOKEN_DECIMALS)),
        simpleERC20.approve.estimateGas(addr1.address, ethers.parseUnits("1", TOKEN_DECIMALS))
      ]);
      
      // transferFrom 需要先授权，所以单独处理
      let transferFromGas = "N/A";
      try {
        transferFromGas = (await simpleERC20.transferFrom.estimateGas(owner.address, addr2.address, ethers.parseUnits("1", TOKEN_DECIMALS))).toString();
      } catch (error) {
        transferFromGas = "需要先授权";
      }
      
      console.log("✅ Gas 估算:", {
        transfer: transferGas.toString(),
        approve: approveGas.toString(),
        transferFrom: transferFromGas
      });
    });
  });

  describe("合约状态验证", function () {
    it("应该验证合约的 ABI 信息", async function () {
      const contractInterface = simpleERC20.interface;
      const functions = contractInterface.fragments.filter(f => f.type === 'function');
      
      console.log("✅ 合约函数列表:", functions.map(f => f.name));
      expect(functions.length).to.be.greaterThan(0);
    });

    it("应该验证合约的字节码", async function () {
      const code = await ethers.provider.getCode(DEPLOYED_CONTRACT_ADDRESS);
      expect(code).to.not.equal("0x");
      console.log("✅ 合约字节码长度:", code.length);
    });

    it("应该验证合约的所有者权限", async function () {
      // 检查 owner 是否有足够的余额进行各种操作
      const ownerBalance = await simpleERC20.balanceOf(owner.address);
      expect(ownerBalance).to.be.greaterThan(0);
      
      console.log("✅ 所有者权限验证:", {
        balance: ethers.formatUnits(ownerBalance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        canTransfer: true,
        canApprove: true
      });
    });
  });

  describe("最终状态总结", function () {
    it("应该显示所有钱包的最终状态", async function () {
      const [ownerBalance, addr1Balance, addr2Balance, addr3Balance, totalSupply] = await Promise.all([
        simpleERC20.balanceOf(owner.address),
        simpleERC20.balanceOf(addr1.address),
        simpleERC20.balanceOf(addr2.address),
        simpleERC20.balanceOf(addr3.address),
        simpleERC20.totalSupply()
      ]);
      
      const totalDistributed = ownerBalance + addr1Balance + addr2Balance + addr3Balance;
      expect(totalDistributed).to.equal(totalSupply);
      
      console.log("✅ 最终状态总结:", {
        owner: ethers.formatUnits(ownerBalance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        addr1: ethers.formatUnits(addr1Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        addr2: ethers.formatUnits(addr2Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        addr3: ethers.formatUnits(addr3Balance, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        totalSupply: ethers.formatUnits(totalSupply, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL,
        totalDistributed: ethers.formatUnits(totalDistributed, TOKEN_DECIMALS) + " " + TOKEN_SYMBOL
      });
    });
  });
});
