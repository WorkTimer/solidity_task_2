const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BeggingContract - Sepolia 测试网测试", function () {
  let beggingContract;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addrs;

  // 已部署的合约地址
  const DEPLOYED_CONTRACT_ADDRESS = "0x0B60569fc11e88B312582Cb1F94b7E8abE25051e";

  before(async function () {
    // 获取签名者
    [owner, addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();

    // 连接到已部署的合约
    const BeggingContract = await ethers.getContractFactory("BeggingContract");
    beggingContract = BeggingContract.attach(DEPLOYED_CONTRACT_ADDRESS);

    console.log("连接到已部署的合约:", DEPLOYED_CONTRACT_ADDRESS);
    console.log("合约所有者:", await beggingContract.owner());
    console.log("当前时间限制信息:", await beggingContract.getTimeRestrictionInfo());
  });

  describe("合约状态检查", function () {
    it("应该能够连接到已部署的合约", async function () {
      expect(beggingContract).to.not.be.undefined;
      expect(await beggingContract.owner()).to.be.a('string');
    });

    it("应该能够获取时间限制信息", async function () {
      const timeInfo = await beggingContract.getTimeRestrictionInfo();
      expect(timeInfo.startTime).to.be.a('bigint');
      expect(timeInfo.endTime).to.be.a('bigint');
      expect(timeInfo.currentTime).to.be.a('bigint');
      
      console.log("开始时间:", new Date(Number(timeInfo.startTime) * 1000).toLocaleString());
      console.log("结束时间:", new Date(Number(timeInfo.endTime) * 1000).toLocaleString());
      console.log("当前时间:", new Date(Number(timeInfo.currentTime) * 1000).toLocaleString());
    });

    it("应该能够检查捐赠是否被允许", async function () {
      const isAllowed = await beggingContract.isDonationAllowed();
      console.log("当前是否允许捐赠:", isAllowed);
      expect(isAllowed).to.be.a('boolean');
    });

    it("应该能够获取当前合约状态", async function () {
      const balance = await beggingContract.getBalance();
      const totalDonations = await beggingContract.getTotalDonations();
      const donorCount = await beggingContract.getDonorCount();
      
      console.log("合约余额:", ethers.formatEther(balance), "ETH");
      console.log("总捐赠金额:", ethers.formatEther(totalDonations), "ETH");
      console.log("捐赠者数量:", donorCount.toString());
      
      expect(balance).to.be.a('bigint');
      expect(totalDonations).to.be.a('bigint');
      expect(donorCount).to.be.a('bigint');
    });
  });

  describe("捐赠功能测试", function () {
    const donationAmount = ethers.parseEther("0.001"); // 使用较小的金额进行测试

    it("应该能够进行捐赠（如果时间允许）", async function () {
      const isAllowed = await beggingContract.isDonationAllowed();
      
      if (isAllowed) {
        const balanceBefore = await beggingContract.getBalance();
        const totalDonationsBefore = await beggingContract.getTotalDonations();
        const donorCountBefore = await beggingContract.getDonorCount();
        const personalDonationBefore = await beggingContract.getDonation(addr1.address);
        
        console.log("尝试捐赠:", ethers.formatEther(donationAmount), "ETH");
        
        const tx = await beggingContract.connect(addr1).donate({ value: donationAmount });
        const receipt = await tx.wait();
        
        console.log("捐赠交易哈希:", tx.hash);
        console.log("Gas 使用量:", receipt.gasUsed.toString());
        
        // 验证状态变化
        const balanceAfter = await beggingContract.getBalance();
        const totalDonationsAfter = await beggingContract.getTotalDonations();
        const donorCountAfter = await beggingContract.getDonorCount();
        
        expect(balanceAfter).to.equal(balanceBefore + donationAmount);
        expect(totalDonationsAfter).to.equal(totalDonationsBefore + donationAmount);
        expect(donorCountAfter).to.be.greaterThanOrEqual(donorCountBefore);
        
        // 验证个人捐赠记录
        const personalDonationAfter = await beggingContract.getDonation(addr1.address);
        expect(personalDonationAfter).to.equal(personalDonationBefore + donationAmount);
        
        console.log("捐赠成功！");
      } else {
        console.log("当前不在捐赠时间范围内，跳过捐赠测试");
        this.skip();
      }
    });

    it("应该拒绝零金额捐赠", async function () {
      await expect(beggingContract.connect(addr2).donate({ value: 0 }))
        .to.be.revertedWith("Donation amount must be greater than 0");
    });

    it("应该能够进行多次捐赠", async function () {
      const isAllowed = await beggingContract.isDonationAllowed();
      
      if (isAllowed) {
        const firstDonation = ethers.parseEther("0.001");
        const secondDonation = ethers.parseEther("0.002");
        
        // 使用 addr3 进行测试，避免与之前的测试冲突
        const initialDonation = await beggingContract.getDonation(addr3.address);
        console.log("addr3 初始捐赠记录:", ethers.formatEther(initialDonation), "ETH");
        
        // 第一次捐赠
        const tx1 = await beggingContract.connect(addr3).donate({ value: firstDonation });
        await tx1.wait();
        const donationAfterFirst = await beggingContract.getDonation(addr3.address);
        console.log("第一次捐赠后:", ethers.formatEther(donationAfterFirst), "ETH");
        expect(donationAfterFirst).to.equal(initialDonation + firstDonation);
        
        // 第二次捐赠
        const tx2 = await beggingContract.connect(addr3).donate({ value: secondDonation });
        await tx2.wait();
        const donationAfterSecond = await beggingContract.getDonation(addr3.address);
        console.log("第二次捐赠后:", ethers.formatEther(donationAfterSecond), "ETH");
        expect(donationAfterSecond).to.equal(initialDonation + firstDonation + secondDonation);
        
        console.log("多次捐赠测试成功");
      } else {
        console.log("当前不在捐赠时间范围内，跳过多次捐赠测试");
        this.skip();
      }
    });
  });

  describe("前3名捐赠者功能测试", function () {
    it("应该能够获取前3名捐赠者信息", async function () {
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      console.log("前3名捐赠者:");
      for (let i = 0; i < 3; i++) {
        console.log(`第${i + 1}名: ${topDonors[i]}, 金额: ${ethers.formatEther(topAmounts[i])} ETH`);
      }
      
      expect(topDonors).to.have.lengthOf(3);
      expect(topAmounts).to.have.lengthOf(3);
      
      // 验证排序（降序）
      for (let i = 0; i < 2; i++) {
        if (topAmounts[i] > 0 && topAmounts[i + 1] > 0) {
          expect(topAmounts[i]).to.be.greaterThanOrEqual(topAmounts[i + 1]);
        }
      }
    });
  });

  describe("查看函数测试", function () {
    it("应该能够获取所有捐赠者列表", async function () {
      const allDonors = await beggingContract.getAllDonors();
      console.log("所有捐赠者数量:", allDonors.length);
      console.log("捐赠者地址:", allDonors);
      
      expect(allDonors).to.be.an('array');
    });

    it("应该能够查询特定地址的捐赠金额", async function () {
      const donation = await beggingContract.getDonation(addr1.address);
      console.log(`地址 ${addr1.address} 的捐赠金额:`, ethers.formatEther(donation), "ETH");
      
      expect(donation).to.be.a('bigint');
    });

    it("应该能够获取合约余额", async function () {
      const balance = await beggingContract.getBalance();
      console.log("合约余额:", ethers.formatEther(balance), "ETH");
      
      expect(balance).to.be.a('bigint');
    });
  });

  describe("提取功能测试（仅所有者）", function () {
    it("应该允许所有者提取资金", async function () {
      const contractBalance = await beggingContract.getBalance();
      
      if (contractBalance > 0) {
        console.log("合约当前余额:", ethers.formatEther(contractBalance), "ETH");
        
        const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
        console.log("所有者提取前余额:", ethers.formatEther(ownerBalanceBefore), "ETH");
        
        const tx = await beggingContract.connect(owner).withdraw();
        const receipt = await tx.wait();
        
        console.log("提取交易哈希:", tx.hash);
        console.log("Gas 使用量:", receipt.gasUsed.toString());
        
        const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
        const contractBalanceAfter = await beggingContract.getBalance();
        
        console.log("所有者提取后余额:", ethers.formatEther(ownerBalanceAfter), "ETH");
        console.log("合约提取后余额:", ethers.formatEther(contractBalanceAfter), "ETH");
        
        expect(contractBalanceAfter).to.equal(0);
        console.log("提取功能测试成功");
      } else {
        console.log("合约余额为0，跳过提取测试");
        this.skip();
      }
    });

    it("应该拒绝非所有者提取", async function () {
      await expect(beggingContract.connect(addr1).withdraw())
        .to.be.revertedWithCustomError(beggingContract, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("时间限制测试", function () {
    it("应该正确返回时间限制信息", async function () {
      const timeInfo = await beggingContract.getTimeRestrictionInfo();
      const currentTime = Math.floor(Date.now() / 1000);
      
      console.log("时间信息:");
      console.log("- 开始时间:", new Date(Number(timeInfo.startTime) * 1000).toLocaleString());
      console.log("- 结束时间:", new Date(Number(timeInfo.endTime) * 1000).toLocaleString());
      console.log("- 当前时间:", new Date(Number(timeInfo.currentTime) * 1000).toLocaleString());
      console.log("- 当前区块时间:", new Date(Number(timeInfo.currentTime) * 1000).toLocaleString());
      
      expect(timeInfo.startTime).to.be.a('bigint');
      expect(timeInfo.endTime).to.be.a('bigint');
      expect(timeInfo.currentTime).to.be.a('bigint');
      expect(timeInfo.startTime).to.be.lessThan(timeInfo.endTime);
    });

    it("应该正确判断捐赠是否被允许", async function () {
      const isAllowed = await beggingContract.isDonationAllowed();
      const timeInfo = await beggingContract.getTimeRestrictionInfo();
      
      const shouldBeAllowed = timeInfo.currentTime >= timeInfo.startTime && 
                             timeInfo.currentTime <= timeInfo.endTime;
      
      console.log("捐赠是否被允许:", isAllowed);
      console.log("应该被允许:", shouldBeAllowed);
      
      expect(isAllowed).to.equal(shouldBeAllowed);
    });
  });

  describe("集成测试", function () {
    it("完整的合约状态报告", async function () {
      console.log("\n=== 合约状态报告 ===");
      
      // 基本信息
      const owner = await beggingContract.owner();
      console.log("合约所有者:", owner);
      
      // 时间信息
      const timeInfo = await beggingContract.getTimeRestrictionInfo();
      console.log("捐赠开始时间:", new Date(Number(timeInfo.startTime) * 1000).toLocaleString());
      console.log("捐赠结束时间:", new Date(Number(timeInfo.endTime) * 1000).toLocaleString());
      console.log("当前时间:", new Date(Number(timeInfo.currentTime) * 1000).toLocaleString());
      
      // 状态信息
      const balance = await beggingContract.getBalance();
      const totalDonations = await beggingContract.getTotalDonations();
      const donorCount = await beggingContract.getDonorCount();
      const isAllowed = await beggingContract.isDonationAllowed();
      
      console.log("合约余额:", ethers.formatEther(balance), "ETH");
      console.log("总捐赠金额:", ethers.formatEther(totalDonations), "ETH");
      console.log("捐赠者数量:", donorCount.toString());
      console.log("是否允许捐赠:", isAllowed);
      
      // 前3名捐赠者
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      console.log("\n前3名捐赠者:");
      for (let i = 0; i < 3; i++) {
        if (topDonors[i] !== ethers.ZeroAddress) {
          console.log(`第${i + 1}名: ${topDonors[i]} - ${ethers.formatEther(topAmounts[i])} ETH`);
        }
      }
      
      // 所有捐赠者
      const allDonors = await beggingContract.getAllDonors();
      console.log("\n所有捐赠者地址:");
      allDonors.forEach((donor, index) => {
        console.log(`${index + 1}. ${donor}`);
      });
      
      console.log("=== 报告结束 ===\n");
    });
  });

  // 辅助函数
  async function getCurrentTimestamp() {
    const block = await ethers.provider.getBlock('latest');
    return block.timestamp;
  }

  async function waitForTime(seconds) {
    console.log(`等待 ${seconds} 秒...`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }
});