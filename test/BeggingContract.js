const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BeggingContract", function () {
  let beggingContract;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addrs;

  // 时间设置
  let startTime;
  let endTime;
  const DONATION_DURATION = 7 * 24 * 60 * 60; // 7天

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();

    // 设置时间：开始时间为当前时间，结束时间为7天后
    startTime = Math.floor(Date.now() / 1000);
    endTime = startTime + DONATION_DURATION;

    const BeggingContract = await ethers.getContractFactory("BeggingContract");
    beggingContract = await BeggingContract.deploy(startTime, endTime);
  });

  describe("部署和初始化", function () {
    it("应该正确设置合约所有者", async function () {
      expect(await beggingContract.owner()).to.equal(owner.address);
    });

    it("应该正确设置捐赠开始时间", async function () {
      expect(await beggingContract.donationStartTime()).to.equal(startTime);
    });

    it("应该正确设置捐赠结束时间", async function () {
      expect(await beggingContract.donationEndTime()).to.equal(endTime);
    });

    it("应该正确初始化状态变量", async function () {
      expect(await beggingContract.totalDonations()).to.equal(0);
      expect(await beggingContract.donorCount()).to.equal(0);
      expect(await beggingContract.getBalance()).to.equal(0);
    });

    it("应该拒绝开始时间晚于结束时间的部署", async function () {
      const BeggingContract = await ethers.getContractFactory("BeggingContract");
      await expect(BeggingContract.deploy(endTime, startTime))
        .to.be.revertedWith("Start time must be before end time");
    });
  });

  describe("捐赠功能", function () {
    const donationAmount = ethers.parseEther("1.0");

    it("应该成功接受捐赠", async function () {
      const tx = await beggingContract.connect(addr1).donate({ value: donationAmount });
      const receipt = await tx.wait();
      
      // 检查事件是否被发射
      const donationEvent = receipt.logs.find(log => {
        try {
          const parsed = beggingContract.interface.parseLog(log);
          return parsed && parsed.name === "Donation";
        } catch (e) {
          return false;
        }
      });
      
      expect(donationEvent).to.not.be.undefined;
      const parsedEvent = beggingContract.interface.parseLog(donationEvent);
      expect(parsedEvent.args.donor).to.equal(addr1.address);
      expect(parsedEvent.args.amount).to.equal(donationAmount);

      expect(await beggingContract.getDonation(addr1.address)).to.equal(donationAmount);
      expect(await beggingContract.totalDonations()).to.equal(donationAmount);
      expect(await beggingContract.donorCount()).to.equal(1);
      expect(await beggingContract.getBalance()).to.equal(donationAmount);
    });

    it("应该拒绝零金额捐赠", async function () {
      await expect(beggingContract.connect(addr1).donate({ value: 0 }))
        .to.be.revertedWith("Donation amount must be greater than 0");
    });

    it("应该允许同一地址多次捐赠", async function () {
      const firstDonation = ethers.parseEther("1.0");
      const secondDonation = ethers.parseEther("2.0");

      // 第一次捐赠
      await beggingContract.connect(addr1).donate({ value: firstDonation });
      expect(await beggingContract.getDonation(addr1.address)).to.equal(firstDonation);
      expect(await beggingContract.donorCount()).to.equal(1);

      // 第二次捐赠
      await beggingContract.connect(addr1).donate({ value: secondDonation });
      expect(await beggingContract.getDonation(addr1.address)).to.equal(firstDonation + secondDonation);
      expect(await beggingContract.totalDonations()).to.equal(firstDonation + secondDonation);
      expect(await beggingContract.donorCount()).to.equal(1); // 捐赠者数量不变
    });

    it("应该正确记录多个捐赠者", async function () {
      const donation1 = ethers.parseEther("1.0");
      const donation2 = ethers.parseEther("2.0");
      const donation3 = ethers.parseEther("3.0");

      await beggingContract.connect(addr1).donate({ value: donation1 });
      await beggingContract.connect(addr2).donate({ value: donation2 });
      await beggingContract.connect(addr3).donate({ value: donation3 });

      expect(await beggingContract.donorCount()).to.equal(3);
      expect(await beggingContract.totalDonations()).to.equal(donation1 + donation2 + donation3);
      
      const allDonors = await beggingContract.getAllDonors();
      expect(allDonors).to.include(addr1.address);
      expect(allDonors).to.include(addr2.address);
      expect(allDonors).to.include(addr3.address);
    });

    it("应该正确发射捐赠事件", async function () {
      const donationAmount = ethers.parseEther("1.5");

      const tx = await beggingContract.connect(addr1).donate({ value: donationAmount });
      const receipt = await tx.wait();
      
      // 检查事件是否被发射
      const donationEvent = receipt.logs.find(log => {
        try {
          const parsed = beggingContract.interface.parseLog(log);
          return parsed && parsed.name === "Donation";
        } catch (e) {
          return false;
        }
      });
      
      expect(donationEvent).to.not.be.undefined;
      const parsedEvent = beggingContract.interface.parseLog(donationEvent);
      expect(parsedEvent.args.donor).to.equal(addr1.address);
      expect(parsedEvent.args.amount).to.equal(donationAmount);
    });
  });

  describe("时间限制功能", function () {
    const donationAmount = ethers.parseEther("1.0");

    it("应该拒绝捐赠期开始前的捐赠", async function () {
      // 部署一个未来开始的合约
      const futureStartTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后开始
      const futureEndTime = futureStartTime + DONATION_DURATION;
      
      const BeggingContract = await ethers.getContractFactory("BeggingContract");
      const futureContract = await BeggingContract.deploy(futureStartTime, futureEndTime);

      await expect(futureContract.connect(addr1).donate({ value: donationAmount }))
        .to.be.revertedWith("Donation period has not started yet");
    });

    it("应该拒绝捐赠期结束后的捐赠", async function () {
      // 部署一个已结束的合约
      const pastStartTime = Math.floor(Date.now() / 1000) - 7200; // 2小时前开始
      const pastEndTime = Math.floor(Date.now() / 1000) - 3600; // 1小时前结束
      
      const BeggingContract = await ethers.getContractFactory("BeggingContract");
      const pastContract = await BeggingContract.deploy(pastStartTime, pastEndTime);

      await expect(pastContract.connect(addr1).donate({ value: donationAmount }))
        .to.be.revertedWith("Donation period has ended");
    });

    it("isDonationAllowed 应该正确返回状态", async function () {
      expect(await beggingContract.isDonationAllowed()).to.be.true;

      // 测试已结束的合约
      const pastStartTime = Math.floor(Date.now() / 1000) - 7200;
      const pastEndTime = Math.floor(Date.now() / 1000) - 3600;
      
      const BeggingContract = await ethers.getContractFactory("BeggingContract");
      const pastContract = await BeggingContract.deploy(pastStartTime, pastEndTime);
      
      expect(await pastContract.isDonationAllowed()).to.be.false;
    });

    it("getTimeRestrictionInfo 应该返回正确的时间信息", async function () {
      const timeInfo = await beggingContract.getTimeRestrictionInfo();
      expect(timeInfo.startTime).to.equal(startTime);
      expect(timeInfo.endTime).to.equal(endTime);
      expect(timeInfo.currentTime).to.be.closeTo(Math.floor(Date.now() / 1000), 30);
    });
  });

  describe("前3名捐赠者功能", function () {
    it("应该正确更新前3名捐赠者", async function () {
      // 设置不同金额的捐赠
      const donation1 = ethers.parseEther("1.0");  // addr1: 1 ETH
      const donation2 = ethers.parseEther("3.0");  // addr2: 3 ETH
      const donation3 = ethers.parseEther("2.0");  // addr3: 2 ETH
      const donation4 = ethers.parseEther("4.0");  // addr4: 4 ETH

      // 按顺序捐赠
      await beggingContract.connect(addr1).donate({ value: donation1 });
      await beggingContract.connect(addr2).donate({ value: donation2 });
      await beggingContract.connect(addr3).donate({ value: donation3 });
      await beggingContract.connect(addr4).donate({ value: donation4 });

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();

      // 应该按金额降序排列：addr4(4), addr2(3), addr3(2)
      expect(topDonors[0]).to.equal(addr4.address);
      expect(topAmounts[0]).to.equal(donation4);
      expect(topDonors[1]).to.equal(addr2.address);
      expect(topAmounts[1]).to.equal(donation2);
      expect(topDonors[2]).to.equal(addr3.address);
      expect(topAmounts[2]).to.equal(donation3);
    });

    it("应该处理同一捐赠者的多次捐赠", async function () {
      const firstDonation = ethers.parseEther("1.0");
      const secondDonation = ethers.parseEther("2.0");

      await beggingContract.connect(addr1).donate({ value: firstDonation });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("3.0") });
      await beggingContract.connect(addr1).donate({ value: secondDonation }); // 总共3 ETH

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();

      expect(topDonors[0]).to.equal(addr1.address);
      expect(topAmounts[0]).to.equal(firstDonation + secondDonation);
    });

    it("应该处理少于3个捐赠者的情况", async function () {
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("2.0") });

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();

      expect(topDonors[0]).to.equal(addr2.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("2.0"));
      expect(topDonors[1]).to.equal(addr1.address);
      expect(topAmounts[1]).to.equal(ethers.parseEther("1.0"));
      expect(topDonors[2]).to.equal(ethers.ZeroAddress);
      expect(topAmounts[2]).to.equal(0);
    });

    it("应该处理没有捐赠者的情况", async function () {
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();

      expect(topDonors[0]).to.equal(ethers.ZeroAddress);
      expect(topAmounts[0]).to.equal(0);
      expect(topDonors[1]).to.equal(ethers.ZeroAddress);
      expect(topAmounts[1]).to.equal(0);
      expect(topDonors[2]).to.equal(ethers.ZeroAddress);
      expect(topAmounts[2]).to.equal(0);
    });
  });

  describe("提取功能", function () {
    const donationAmount = ethers.parseEther("5.0");

    beforeEach(async function () {
      // 先进行一些捐赠
      await beggingContract.connect(addr1).donate({ value: donationAmount });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("2.0") });
    });

    it("应该允许所有者提取资金", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await beggingContract.getBalance();

      const tx = await beggingContract.withdraw();
      const receipt = await tx.wait();
      
      // 检查事件是否被发射
      const withdrawalEvent = receipt.logs.find(log => {
        try {
          const parsed = beggingContract.interface.parseLog(log);
          return parsed && parsed.name === "Withdrawal";
        } catch (e) {
          return false;
        }
      });
      
      expect(withdrawalEvent).to.not.be.undefined;
      const parsedEvent = beggingContract.interface.parseLog(withdrawalEvent);
      expect(parsedEvent.args.owner).to.equal(owner.address);
      expect(parsedEvent.args.amount).to.equal(contractBalance);

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.closeTo(balanceBefore + contractBalance, ethers.parseEther("0.1"));
      expect(await beggingContract.getBalance()).to.equal(0);
    });

    it("应该拒绝非所有者提取", async function () {
      await expect(beggingContract.connect(addr1).withdraw())
        .to.be.revertedWithCustomError(beggingContract, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("应该拒绝提取零余额", async function () {
      // 先提取所有资金
      await beggingContract.withdraw();
      
      // 再次尝试提取应该失败
      await expect(beggingContract.withdraw())
        .to.be.revertedWith("No funds to withdraw");
    });

    it("应该正确发射提取事件", async function () {
      const contractBalance = await beggingContract.getBalance();

      const tx = await beggingContract.withdraw();
      const receipt = await tx.wait();
      
      // 检查事件是否被发射
      const withdrawalEvent = receipt.logs.find(log => {
        try {
          const parsed = beggingContract.interface.parseLog(log);
          return parsed && parsed.name === "Withdrawal";
        } catch (e) {
          return false;
        }
      });
      
      expect(withdrawalEvent).to.not.be.undefined;
      const parsedEvent = beggingContract.interface.parseLog(withdrawalEvent);
      expect(parsedEvent.args.owner).to.equal(owner.address);
      expect(parsedEvent.args.amount).to.equal(contractBalance);
    });
  });

  describe("查看函数", function () {
    beforeEach(async function () {
      // 设置测试数据
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("2.0") });
      await beggingContract.connect(addr3).donate({ value: ethers.parseEther("3.0") });
    });

    it("getDonation 应该返回正确的捐赠金额", async function () {
      expect(await beggingContract.getDonation(addr1.address)).to.equal(ethers.parseEther("1.0"));
      expect(await beggingContract.getDonation(addr2.address)).to.equal(ethers.parseEther("2.0"));
      expect(await beggingContract.getDonation(addr3.address)).to.equal(ethers.parseEther("3.0"));
      expect(await beggingContract.getDonation(addr4.address)).to.equal(0);
    });

    it("getBalance 应该返回正确的合约余额", async function () {
      const expectedBalance = ethers.parseEther("6.0");
      expect(await beggingContract.getBalance()).to.equal(expectedBalance);
    });

    it("getTotalDonations 应该返回正确的总捐赠金额", async function () {
      const expectedTotal = ethers.parseEther("6.0");
      expect(await beggingContract.getTotalDonations()).to.equal(expectedTotal);
    });

    it("getDonorCount 应该返回正确的捐赠者数量", async function () {
      expect(await beggingContract.getDonorCount()).to.equal(3);
    });

    it("getAllDonors 应该返回所有捐赠者地址", async function () {
      const allDonors = await beggingContract.getAllDonors();
      expect(allDonors).to.have.lengthOf(3);
      expect(allDonors).to.include(addr1.address);
      expect(allDonors).to.include(addr2.address);
      expect(allDonors).to.include(addr3.address);
    });

    it("getTop3Donors 应该返回前3名捐赠者", async function () {
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      expect(topDonors[0]).to.equal(addr3.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("3.0"));
      expect(topDonors[1]).to.equal(addr2.address);
      expect(topAmounts[1]).to.equal(ethers.parseEther("2.0"));
      expect(topDonors[2]).to.equal(addr1.address);
      expect(topAmounts[2]).to.equal(ethers.parseEther("1.0"));
    });
  });

  describe("边界情况和错误处理", function () {
    it("应该处理最大捐赠金额", async function () {
      const maxAmount = ethers.parseEther("1000");
      
      const tx = await beggingContract.connect(addr1).donate({ value: maxAmount });
      const receipt = await tx.wait();
      
      // 检查事件是否被发射
      const donationEvent = receipt.logs.find(log => {
        try {
          const parsed = beggingContract.interface.parseLog(log);
          return parsed && parsed.name === "Donation";
        } catch (e) {
          return false;
        }
      });
      
      expect(donationEvent).to.not.be.undefined;
      const parsedEvent = beggingContract.interface.parseLog(donationEvent);
      expect(parsedEvent.args.donor).to.equal(addr1.address);
      expect(parsedEvent.args.amount).to.equal(maxAmount);

      expect(await beggingContract.getDonation(addr1.address)).to.equal(maxAmount);
    });

    it("应该处理非常小的捐赠金额", async function () {
      const smallAmount = 1; // 1 wei
      
      const tx = await beggingContract.connect(addr1).donate({ value: smallAmount });
      const receipt = await tx.wait();
      
      // 检查事件是否被发射
      const donationEvent = receipt.logs.find(log => {
        try {
          const parsed = beggingContract.interface.parseLog(log);
          return parsed && parsed.name === "Donation";
        } catch (e) {
          return false;
        }
      });
      
      expect(donationEvent).to.not.be.undefined;
      const parsedEvent = beggingContract.interface.parseLog(donationEvent);
      expect(parsedEvent.args.donor).to.equal(addr1.address);
      expect(parsedEvent.args.amount).to.equal(smallAmount);

      expect(await beggingContract.getDonation(addr1.address)).to.equal(smallAmount);
    });

    it("应该正确处理时间边界", async function () {
      // 测试开始时间边界
      const exactStartTime = startTime;
      const pastTime = startTime - 1;
      const futureTime = endTime + 1;

      // 部署一个精确时间边界的合约
      const BeggingContract = await ethers.getContractFactory("BeggingContract");
      const exactTimeContract = await BeggingContract.deploy(exactStartTime, endTime);

      // 在开始时间应该可以捐赠
      await expect(exactTimeContract.connect(addr1).donate({ value: ethers.parseEther("1.0") }))
        .to.emit(exactTimeContract, "Donation");
    });
  });

  describe("集成测试", function () {
    it("完整的捐赠流程", async function () {
      // 1. 初始状态检查
      expect(await beggingContract.getBalance()).to.equal(0);
      expect(await beggingContract.getTotalDonations()).to.equal(0);
      expect(await beggingContract.getDonorCount()).to.equal(0);
      expect(await beggingContract.isDonationAllowed()).to.be.true;

      // 2. 多个用户捐赠
      const donation1 = ethers.parseEther("1.0");
      const donation2 = ethers.parseEther("2.0");
      const donation3 = ethers.parseEther("3.0");

      await beggingContract.connect(addr1).donate({ value: donation1 });
      await beggingContract.connect(addr2).donate({ value: donation2 });
      await beggingContract.connect(addr3).donate({ value: donation3 });

      // 3. 验证状态
      expect(await beggingContract.getBalance()).to.equal(donation1 + donation2 + donation3);
      expect(await beggingContract.getTotalDonations()).to.equal(donation1 + donation2 + donation3);
      expect(await beggingContract.getDonorCount()).to.equal(3);

      // 4. 验证前3名
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      expect(topDonors[0]).to.equal(addr3.address);
      expect(topAmounts[0]).to.equal(donation3);

      // 5. 所有者提取资金
      const contractBalance = await beggingContract.getBalance();
      await beggingContract.withdraw();
      expect(await beggingContract.getBalance()).to.equal(0);

      // 6. 验证提取后的状态
      expect(await beggingContract.getTotalDonations()).to.equal(donation1 + donation2 + donation3);
      expect(await beggingContract.getDonorCount()).to.equal(3);
    });

    it("复杂的前3名更新场景", async function () {
      // 创建5个不同金额的捐赠
      const donations = [
        { addr: addr1, amount: ethers.parseEther("1.0") },
        { addr: addr2, amount: ethers.parseEther("5.0") },
        { addr: addr3, amount: ethers.parseEther("3.0") },
        { addr: addr4, amount: ethers.parseEther("2.0") },
        { addr: addrs[0], amount: ethers.parseEther("4.0") }
      ];

      // 按顺序捐赠
      for (const donation of donations) {
        await beggingContract.connect(donation.addr).donate({ value: donation.amount });
      }

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();

      // 验证前3名：addr2(5), addrs[0](4), addr3(3)
      expect(topDonors[0]).to.equal(addr2.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("5.0"));
      expect(topDonors[1]).to.equal(addrs[0].address);
      expect(topAmounts[1]).to.equal(ethers.parseEther("4.0"));
      expect(topDonors[2]).to.equal(addr3.address);
      expect(topAmounts[2]).to.equal(ethers.parseEther("3.0"));
    });
  });

  // 辅助函数
  async function getCurrentTimestamp() {
    const block = await ethers.provider.getBlock('latest');
    return block.timestamp;
  }
});
