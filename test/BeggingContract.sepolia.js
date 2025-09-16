const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BeggingContract Sepolia 网络测试", function () {
  let beggingContract;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  
  // 已部署的合约地址
  const DEPLOYED_CONTRACT_ADDRESS = "0x35B24477c4Cfb806f076634aa0e170B28b631A95";
  
  // 钱包余额信息（基于查询结果）
  const WALLET_BALANCES = {
    owner: "2.099590327520430782", // ETH
    addr1: "1.499999455007563384", // ETH
    addr2: "0.99999978902543359",  // ETH
    addr3: "0.4999999565230045"    // ETH
  };

  before(async function () {
    // 获取签名者
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    
    // 连接到已部署的合约
    const BeggingContract = await ethers.getContractFactory("BeggingContract");
    beggingContract = BeggingContract.attach(DEPLOYED_CONTRACT_ADDRESS);
    
    console.log("=== Sepolia 网络测试开始 ===");
    console.log(`合约地址: ${DEPLOYED_CONTRACT_ADDRESS}`);
    console.log(`Owner: ${owner.address} - ${WALLET_BALANCES.owner} ETH`);
    console.log(`Addr1: ${addr1.address} - ${WALLET_BALANCES.addr1} ETH`);
    console.log(`Addr2: ${addr2.address} - ${WALLET_BALANCES.addr2} ETH`);
    console.log(`Addr3: ${addr3.address} - ${WALLET_BALANCES.addr3} ETH`);
  });

  describe("合约状态检查", function () {
    it("应该能够连接到已部署的合约", async function () {
      expect(beggingContract.target).to.equal(DEPLOYED_CONTRACT_ADDRESS);
    });

    it("应该能够查询合约所有者", async function () {
      const contractOwner = await beggingContract.owner();
      console.log(`合约所有者: ${contractOwner}`);
      expect(contractOwner).to.be.a('string');
      expect(contractOwner).to.not.equal(ethers.ZeroAddress);
    });

    it("应该能够查询当前合约状态", async function () {
      const balance = await beggingContract.getBalance();
      const totalDonations = await beggingContract.getTotalDonations();
      const donorCount = await beggingContract.getDonorCount();
      
      console.log(`当前合约余额: ${ethers.formatEther(balance)} ETH`);
      console.log(`总捐赠金额: ${ethers.formatEther(totalDonations)} ETH`);
      console.log(`捐赠者数量: ${donorCount}`);
      
      expect(balance).to.be.a('bigint');
      expect(totalDonations).to.be.a('bigint');
      expect(donorCount).to.be.a('bigint');
    });
  });

  describe("基于钱包余额的捐赠测试", function () {
    it("Addr1 应该能够进行小额捐赠 (0.1 ETH)", async function () {
      const donationAmount = ethers.parseEther("0.1");
      const balanceBefore = await ethers.provider.getBalance(addr1.address);
      const donationBefore = await beggingContract.getDonation(addr1.address);
      
      console.log(`Addr1 捐赠前余额: ${ethers.formatEther(balanceBefore)} ETH`);
      console.log(`Addr1 之前捐赠金额: ${ethers.formatEther(donationBefore)} ETH`);
      
      const tx = await beggingContract.connect(addr1).donate({ value: donationAmount });
      const receipt = await tx.wait();
      
      console.log(`Addr1 捐赠 0.1 ETH，Gas 使用: ${receipt.gasUsed}`);
      
      const balanceAfter = await ethers.provider.getBalance(addr1.address);
      const donationAfter = await beggingContract.getDonation(addr1.address);
      console.log(`Addr1 捐赠后余额: ${ethers.formatEther(balanceAfter)} ETH`);
      console.log(`Addr1 总捐赠金额: ${ethers.formatEther(donationAfter)} ETH`);
      
      expect(donationAfter).to.equal(donationBefore + donationAmount);
    });

    it("Addr2 应该能够进行中等金额捐赠 (0.2 ETH)", async function () {
      const donationAmount = ethers.parseEther("0.2");
      const balanceBefore = await ethers.provider.getBalance(addr2.address);
      const donationBefore = await beggingContract.getDonation(addr2.address);
      
      console.log(`Addr2 捐赠前余额: ${ethers.formatEther(balanceBefore)} ETH`);
      console.log(`Addr2 之前捐赠金额: ${ethers.formatEther(donationBefore)} ETH`);
      
      const tx = await beggingContract.connect(addr2).donate({ value: donationAmount });
      const receipt = await tx.wait();
      
      console.log(`Addr2 捐赠 0.2 ETH，Gas 使用: ${receipt.gasUsed}`);
      
      const balanceAfter = await ethers.provider.getBalance(addr2.address);
      const donationAfter = await beggingContract.getDonation(addr2.address);
      console.log(`Addr2 捐赠后余额: ${ethers.formatEther(balanceAfter)} ETH`);
      console.log(`Addr2 总捐赠金额: ${ethers.formatEther(donationAfter)} ETH`);
      
      expect(donationAfter).to.equal(donationBefore + donationAmount);
    });

    it("Addr3 应该能够进行小额捐赠 (0.05 ETH)", async function () {
      const donationAmount = ethers.parseEther("0.05");
      const balanceBefore = await ethers.provider.getBalance(addr3.address);
      const donationBefore = await beggingContract.getDonation(addr3.address);
      
      console.log(`Addr3 捐赠前余额: ${ethers.formatEther(balanceBefore)} ETH`);
      console.log(`Addr3 之前捐赠金额: ${ethers.formatEther(donationBefore)} ETH`);
      
      const tx = await beggingContract.connect(addr3).donate({ value: donationAmount });
      const receipt = await tx.wait();
      
      console.log(`Addr3 捐赠 0.05 ETH，Gas 使用: ${receipt.gasUsed}`);
      
      const balanceAfter = await ethers.provider.getBalance(addr3.address);
      const donationAfter = await beggingContract.getDonation(addr3.address);
      console.log(`Addr3 捐赠后余额: ${ethers.formatEther(balanceAfter)} ETH`);
      console.log(`Addr3 总捐赠金额: ${ethers.formatEther(donationAfter)} ETH`);
      
      expect(donationAfter).to.equal(donationBefore + donationAmount);
    });

    it("Owner 应该能够进行大额捐赠 (0.5 ETH)", async function () {
      const donationAmount = ethers.parseEther("0.5");
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const donationBefore = await beggingContract.getDonation(owner.address);
      
      console.log(`Owner 捐赠前余额: ${ethers.formatEther(balanceBefore)} ETH`);
      console.log(`Owner 之前捐赠金额: ${ethers.formatEther(donationBefore)} ETH`);
      
      const tx = await beggingContract.connect(owner).donate({ value: donationAmount });
      const receipt = await tx.wait();
      
      console.log(`Owner 捐赠 0.5 ETH，Gas 使用: ${receipt.gasUsed}`);
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      const donationAfter = await beggingContract.getDonation(owner.address);
      console.log(`Owner 捐赠后余额: ${ethers.formatEther(balanceAfter)} ETH`);
      console.log(`Owner 总捐赠金额: ${ethers.formatEther(donationAfter)} ETH`);
      
      expect(donationAfter).to.equal(donationBefore + donationAmount);
    });
  });

  describe("前3名捐赠者测试", function () {
    it("应该正确显示前3名捐赠者", async function () {
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      console.log("=== 前3名捐赠者 ===");
      for (let i = 0; i < 3; i++) {
        if (topDonors[i] !== ethers.ZeroAddress) {
          console.log(`第${i+1}名: ${topDonors[i]} - ${ethers.formatEther(topAmounts[i])} ETH`);
        }
      }
      
      // 验证第一名应该是 Owner
      expect(topDonors[0]).to.equal(owner.address);
      expect(topAmounts[0]).to.be.greaterThan(0);
    });
  });

  describe("合约状态更新测试", function () {
    it("应该正确更新总捐赠金额", async function () {
      const totalDonations = await beggingContract.getTotalDonations();
      
      console.log(`总捐赠金额: ${ethers.formatEther(totalDonations)} ETH`);
      expect(totalDonations).to.be.greaterThan(0);
    });

    it("应该正确更新捐赠者数量", async function () {
      const donorCount = await beggingContract.getDonorCount();
      console.log(`捐赠者数量: ${donorCount}`);
      expect(donorCount).to.equal(4);
    });

    it("应该正确更新合约余额", async function () {
      const contractBalance = await beggingContract.getBalance();
      const expectedBalance = ethers.parseEther("0.85");
      
      console.log(`合约余额: ${ethers.formatEther(contractBalance)} ETH`);
      expect(contractBalance).to.equal(expectedBalance);
    });
  });

  describe("重复捐赠测试", function () {
    it("Addr1 应该能够进行第二次捐赠", async function () {
      const secondDonation = ethers.parseEther("0.1");
      const balanceBefore = await ethers.provider.getBalance(addr1.address);
      const donationBefore = await beggingContract.getDonation(addr1.address);
      
      console.log(`Addr1 第二次捐赠前余额: ${ethers.formatEther(balanceBefore)} ETH`);
      console.log(`Addr1 第二次捐赠前总捐赠: ${ethers.formatEther(donationBefore)} ETH`);
      
      const tx = await beggingContract.connect(addr1).donate({ value: secondDonation });
      const receipt = await tx.wait();
      
      console.log(`Addr1 第二次捐赠 0.1 ETH，Gas 使用: ${receipt.gasUsed}`);
      
      const balanceAfter = await ethers.provider.getBalance(addr1.address);
      const donationAfter = await beggingContract.getDonation(addr1.address);
      console.log(`Addr1 第二次捐赠后余额: ${ethers.formatEther(balanceAfter)} ETH`);
      console.log(`Addr1 第二次捐赠后总捐赠: ${ethers.formatEther(donationAfter)} ETH`);
      
      // 验证总捐赠金额
      expect(donationAfter).to.equal(donationBefore + secondDonation);
    });

    it("重复捐赠后前3名应该正确更新", async function () {
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      console.log("=== 重复捐赠后的前3名捐赠者 ===");
      for (let i = 0; i < 3; i++) {
        if (topDonors[i] !== ethers.ZeroAddress) {
          console.log(`第${i+1}名: ${topDonors[i]} - ${ethers.formatEther(topAmounts[i])} ETH`);
        }
      }
      
      // 验证第一名是 Owner
      expect(topDonors[0]).to.equal(owner.address);
      expect(topAmounts[0]).to.be.greaterThan(0);
      
      // 验证前3名都有捐赠记录
      expect(topAmounts[0]).to.be.greaterThan(0);
      expect(topAmounts[1]).to.be.greaterThan(0);
      expect(topAmounts[2]).to.be.greaterThan(0);
    });
  });

  describe("提取功能测试", function () {
    it("Owner 应该能够提取所有资金", async function () {
      const contractBalanceBefore = await beggingContract.getBalance();
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      console.log(`提取前合约余额: ${ethers.formatEther(contractBalanceBefore)} ETH`);
      console.log(`提取前 Owner 余额: ${ethers.formatEther(ownerBalanceBefore)} ETH`);
      
      const tx = await beggingContract.connect(owner).withdraw();
      const receipt = await tx.wait();
      
      console.log(`提取 Gas 使用: ${receipt.gasUsed}`);
      
      const contractBalanceAfter = await beggingContract.getBalance();
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      console.log(`提取后合约余额: ${ethers.formatEther(contractBalanceAfter)} ETH`);
      console.log(`提取后 Owner 余额: ${ethers.formatEther(ownerBalanceAfter)} ETH`);
      
      expect(contractBalanceAfter).to.equal(0);
      expect(ownerBalanceAfter).to.be.greaterThan(ownerBalanceBefore);
    });
  });

  describe("边界情况测试", function () {
    it("应该拒绝零金额捐赠", async function () {
      await expect(beggingContract.connect(addr1).donate({ value: 0 }))
        .to.be.revertedWith("Donation amount must be greater than 0");
    });

    it("非所有者不应该能够提取资金", async function () {
      // 先进行一些捐赠
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("0.01") });
      
      await expect(beggingContract.connect(addr1).withdraw())
        .to.be.revertedWithCustomError(beggingContract, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("Gas 使用分析", function () {
    it("应该记录各种操作的 Gas 使用情况", async function () {
      console.log("\n=== Gas 使用分析 ===");
      
      // 捐赠操作
      const donateTx = await beggingContract.connect(addr2).donate({ value: ethers.parseEther("0.01") });
      const donateReceipt = await donateTx.wait();
      console.log(`捐赠操作 Gas 使用: ${donateReceipt.gasUsed}`);
      
      // 查询操作 - 这些是 view 函数，不消耗 gas
      console.log(`查询前3名: view 函数，不消耗 gas`);
      
      // 提取操作
      const withdrawTx = await beggingContract.connect(owner).withdraw();
      const withdrawReceipt = await withdrawTx.wait();
      console.log(`提取操作 Gas 使用: ${withdrawReceipt.gasUsed}`);
      
      // 验证 Gas 使用在合理范围内
      expect(donateReceipt.gasUsed).to.be.lessThan(100000);
      expect(withdrawReceipt.gasUsed).to.be.lessThan(100000);
    });
  });

  describe("最终状态验证", function () {
    it("应该显示最终的合约状态", async function () {
      const balance = await beggingContract.getBalance();
      const totalDonations = await beggingContract.getTotalDonations();
      const donorCount = await beggingContract.getDonorCount();
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      console.log("\n=== 最终合约状态 ===");
      console.log(`合约余额: ${ethers.formatEther(balance)} ETH`);
      console.log(`总捐赠金额: ${ethers.formatEther(totalDonations)} ETH`);
      console.log(`捐赠者数量: ${donorCount}`);
      console.log("前3名捐赠者:");
      for (let i = 0; i < 3; i++) {
        if (topDonors[i] !== ethers.ZeroAddress) {
          console.log(`  第${i+1}名: ${topDonors[i]} - ${ethers.formatEther(topAmounts[i])} ETH`);
        }
      }
    });
  });
});
