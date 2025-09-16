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

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();

    const BeggingContract = await ethers.getContractFactory("BeggingContract");
    beggingContract = await BeggingContract.deploy();
  });

  describe("部署和初始化", function () {
    it("应该正确设置合约所有者", async function () {
      expect(await beggingContract.owner()).to.equal(owner.address);
    });

    it("初始总捐赠金额应该为 0", async function () {
      expect(await beggingContract.totalDonations()).to.equal(0);
    });

    it("初始捐赠者数量应该为 0", async function () {
      expect(await beggingContract.getDonorCount()).to.equal(0);
    });

    it("初始合约余额应该为 0", async function () {
      expect(await beggingContract.getBalance()).to.equal(0);
    });

    it("初始前3名捐赠者应该为空", async function () {
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      expect(topDonors[0]).to.equal(ethers.ZeroAddress);
      expect(topDonors[1]).to.equal(ethers.ZeroAddress);
      expect(topDonors[2]).to.equal(ethers.ZeroAddress);
      expect(topAmounts[0]).to.equal(0);
      expect(topAmounts[1]).to.equal(0);
      expect(topAmounts[2]).to.equal(0);
    });
  });

  describe("捐赠功能", function () {
    it("应该成功接受捐赠", async function () {
      const donationAmount = ethers.parseEther("1.0");
      
      await expect(beggingContract.connect(addr1).donate({ value: donationAmount }))
        .to.emit(beggingContract, "Donation");

      expect(await beggingContract.getDonation(addr1.address)).to.equal(donationAmount);
      expect(await beggingContract.getTotalDonations()).to.equal(donationAmount);
      expect(await beggingContract.getDonorCount()).to.equal(1);
      expect(await beggingContract.getBalance()).to.equal(donationAmount);
    });

    it("应该拒绝零金额捐赠", async function () {
      await expect(beggingContract.connect(addr1).donate({ value: 0 }))
        .to.be.revertedWith("Donation amount must be greater than 0");
    });

    it("应该允许同一用户多次捐赠", async function () {
      const firstDonation = ethers.parseEther("1.0");
      const secondDonation = ethers.parseEther("2.0");
      const totalDonation = firstDonation + secondDonation;

      await beggingContract.connect(addr1).donate({ value: firstDonation });
      await beggingContract.connect(addr1).donate({ value: secondDonation });

      expect(await beggingContract.getDonation(addr1.address)).to.equal(totalDonation);
      expect(await beggingContract.getTotalDonations()).to.equal(totalDonation);
      expect(await beggingContract.getDonorCount()).to.equal(1); // 仍然是同一个捐赠者
    });

    it("应该正确记录多个捐赠者", async function () {
      const donation1 = ethers.parseEther("1.0");
      const donation2 = ethers.parseEther("2.0");
      const donation3 = ethers.parseEther("3.0");

      await beggingContract.connect(addr1).donate({ value: donation1 });
      await beggingContract.connect(addr2).donate({ value: donation2 });
      await beggingContract.connect(addr3).donate({ value: donation3 });

      expect(await beggingContract.getDonorCount()).to.equal(3);
      expect(await beggingContract.getTotalDonations()).to.equal(donation1 + donation2 + donation3);
      
      const allDonors = await beggingContract.getAllDonors();
      expect(allDonors).to.include(addr1.address);
      expect(allDonors).to.include(addr2.address);
      expect(allDonors).to.include(addr3.address);
    });

    it("应该正确更新前3名捐赠者", async function () {
      const donation1 = ethers.parseEther("1.0");
      const donation2 = ethers.parseEther("2.0");
      const donation3 = ethers.parseEther("3.0");
      const donation4 = ethers.parseEther("4.0");

      // 按顺序捐赠
      await beggingContract.connect(addr1).donate({ value: donation1 });
      await beggingContract.connect(addr2).donate({ value: donation2 });
      await beggingContract.connect(addr3).donate({ value: donation3 });
      await beggingContract.connect(addr4).donate({ value: donation4 });

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      // 应该按捐赠金额降序排列
      expect(topDonors[0]).to.equal(addr4.address);
      expect(topAmounts[0]).to.equal(donation4);
      expect(topDonors[1]).to.equal(addr3.address);
      expect(topAmounts[1]).to.equal(donation3);
      expect(topDonors[2]).to.equal(addr2.address);
      expect(topAmounts[2]).to.equal(donation2);
    });

    it("应该正确处理前3名捐赠者的更新", async function () {
      // 先创建3个捐赠者
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("2.0") });
      await beggingContract.connect(addr3).donate({ value: ethers.parseEther("3.0") });

      // addr1 再次捐赠，成为第一名
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("4.0") });

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      expect(topDonors[0]).to.equal(addr1.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("5.0")); // 1.0 + 4.0
    });

    it("应该正确处理相同捐赠金额的情况", async function () {
      const sameAmount = ethers.parseEther("1.0");
      
      await beggingContract.connect(addr1).donate({ value: sameAmount });
      await beggingContract.connect(addr2).donate({ value: sameAmount });
      await beggingContract.connect(addr3).donate({ value: sameAmount });

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      // 应该包含所有3个捐赠者
      expect(topDonors).to.include(addr1.address);
      expect(topDonors).to.include(addr2.address);
      expect(topDonors).to.include(addr3.address);
      expect(topAmounts[0]).to.equal(sameAmount);
      expect(topAmounts[1]).to.equal(sameAmount);
      expect(topAmounts[2]).to.equal(sameAmount);
    });
  });

  describe("提取功能", function () {
    beforeEach(async function () {
      // 先进行一些捐赠
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("2.0") });
    });

    it("所有者应该能够提取所有资金", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await beggingContract.getBalance();
      
      await expect(beggingContract.withdraw())
        .to.emit(beggingContract, "Withdrawal");

      expect(await beggingContract.getBalance()).to.equal(0);
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      // 注意：由于 gas 费用，余额增加可能略小于合约余额
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("非所有者不应该能够提取资金", async function () {
      await expect(beggingContract.connect(addr1).withdraw())
        .to.be.revertedWithCustomError(beggingContract, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("当合约余额为0时不应该能够提取", async function () {
      await beggingContract.withdraw(); // 先提取所有资金
      
      await expect(beggingContract.withdraw())
        .to.be.revertedWith("No funds to withdraw");
    });

    it("提取后应该正确更新合约余额", async function () {
      const initialBalance = await beggingContract.getBalance();
      await beggingContract.withdraw();
      expect(await beggingContract.getBalance()).to.equal(0);
    });
  });

  describe("查询函数", function () {
    beforeEach(async function () {
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
      expect(allDonors).to.include(addr1.address);
      expect(allDonors).to.include(addr2.address);
      expect(allDonors).to.include(addr3.address);
      expect(allDonors.length).to.equal(3);
    });

    it("getTop3Donors 应该返回正确的前3名捐赠者", async function () {
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      expect(topDonors[0]).to.equal(addr3.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("3.0"));
      expect(topDonors[1]).to.equal(addr2.address);
      expect(topAmounts[1]).to.equal(ethers.parseEther("2.0"));
      expect(topDonors[2]).to.equal(addr1.address);
      expect(topAmounts[2]).to.equal(ethers.parseEther("1.0"));
    });
  });

  describe("事件测试", function () {
    it("捐赠时应该发射 Donation 事件", async function () {
      const donationAmount = ethers.parseEther("1.0");
      
      await expect(beggingContract.connect(addr1).donate({ value: donationAmount }))
        .to.emit(beggingContract, "Donation");
    });

    it("提取时应该发射 Withdrawal 事件", async function () {
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      
      await expect(beggingContract.withdraw())
        .to.emit(beggingContract, "Withdrawal");
    });
  });

  describe("边界情况测试", function () {
    it("应该处理大量捐赠", async function () {
      const largeAmount = ethers.parseEther("1000.0");
      
      await beggingContract.connect(addr1).donate({ value: largeAmount });
      
      expect(await beggingContract.getDonation(addr1.address)).to.equal(largeAmount);
      expect(await beggingContract.getBalance()).to.equal(largeAmount);
    });

    it("应该处理最小有效捐赠", async function () {
      const minAmount = 1; // 1 wei
      
      await beggingContract.connect(addr1).donate({ value: minAmount });
      
      expect(await beggingContract.getDonation(addr1.address)).to.equal(minAmount);
      expect(await beggingContract.getBalance()).to.equal(minAmount);
    });

    it("应该处理超过3个捐赠者的情况", async function () {
      const amounts = [
        ethers.parseEther("1.0"),
        ethers.parseEther("2.0"),
        ethers.parseEther("3.0"),
        ethers.parseEther("4.0"),
        ethers.parseEther("5.0")
      ];

      for (let i = 0; i < amounts.length; i++) {
        await beggingContract.connect(addrs[i]).donate({ value: amounts[i] });
      }

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      // 应该只包含前3名
      expect(topDonors[0]).to.equal(addrs[4].address); // 5.0 ETH
      expect(topAmounts[0]).to.equal(amounts[4]);
      expect(topDonors[1]).to.equal(addrs[3].address); // 4.0 ETH
      expect(topAmounts[1]).to.equal(amounts[3]);
      expect(topDonors[2]).to.equal(addrs[2].address); // 3.0 ETH
      expect(topAmounts[2]).to.equal(amounts[2]);
    });

    it("应该正确处理捐赠者重复捐赠的情况", async function () {
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("2.0") });
      await beggingContract.connect(addr3).donate({ value: ethers.parseEther("3.0") });
      
      // addr1 再次捐赠，成为第一名
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("4.0") });

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      expect(topDonors[0]).to.equal(addr1.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("5.0"));
    });
  });

  describe("权限管理", function () {
    it("只有所有者可以提取资金", async function () {
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      
      await expect(beggingContract.connect(addr1).withdraw())
        .to.be.revertedWithCustomError(beggingContract, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("所有者可以转移所有权", async function () {
      await beggingContract.transferOwnership(addr1.address);
      expect(await beggingContract.owner()).to.equal(addr1.address);
    });

    it("新所有者应该能够提取资金", async function () {
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("1.0") });
      
      await beggingContract.transferOwnership(addr1.address);
      
      await expect(beggingContract.connect(addr1).withdraw())
        .to.emit(beggingContract, "Withdrawal");
    });
  });

  describe("Gas 使用测试", function () {
    it("捐赠的 gas 使用应该在合理范围内", async function () {
      const tx = await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      const receipt = await tx.wait();
      
      // Gas 使用应该在合理范围内
      expect(receipt.gasUsed).to.be.lessThan(200000);
      console.log("捐赠 Gas 使用:", receipt.gasUsed.toString());
    });

    it("提取的 gas 使用应该在合理范围内", async function () {
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      
      const tx = await beggingContract.withdraw();
      const receipt = await tx.wait();
      
      // Gas 使用应该在合理范围内
      expect(receipt.gasUsed).to.be.lessThan(100000);
      console.log("提取 Gas 使用:", receipt.gasUsed.toString());
    });
  });

  describe("集成测试", function () {
    it("完整的捐赠和提取流程", async function () {
      // 1. 初始状态检查
      expect(await beggingContract.getBalance()).to.equal(0);
      expect(await beggingContract.getTotalDonations()).to.equal(0);
      expect(await beggingContract.getDonorCount()).to.equal(0);

      // 2. 多个用户捐赠
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("2.0") });
      await beggingContract.connect(addr3).donate({ value: ethers.parseEther("3.0") });

      // 3. 验证状态
      expect(await beggingContract.getBalance()).to.equal(ethers.parseEther("6.0"));
      expect(await beggingContract.getTotalDonations()).to.equal(ethers.parseEther("6.0"));
      expect(await beggingContract.getDonorCount()).to.equal(3);

      // 4. 验证前3名捐赠者
      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      expect(topDonors[0]).to.equal(addr3.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("3.0"));

      // 5. 提取资金
      await beggingContract.withdraw();
      expect(await beggingContract.getBalance()).to.equal(0);
    });

    it("复杂的前3名捐赠者更新场景", async function () {
      // 创建初始前3名
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("1.0") });
      await beggingContract.connect(addr2).donate({ value: ethers.parseEther("2.0") });
      await beggingContract.connect(addr3).donate({ value: ethers.parseEther("3.0") });

      // addr4 成为新的第一名
      await beggingContract.connect(addr4).donate({ value: ethers.parseEther("4.0") });

      // addr1 再次捐赠，成为第二名
      await beggingContract.connect(addr1).donate({ value: ethers.parseEther("2.0") });

      const [topDonors, topAmounts] = await beggingContract.getTop3Donors();
      
      expect(topDonors[0]).to.equal(addr4.address);
      expect(topAmounts[0]).to.equal(ethers.parseEther("4.0"));
      // 由于 addr1 和 addr3 的捐赠金额相同，顺序可能不同
      expect(topDonors[1]).to.be.oneOf([addr1.address, addr3.address]);
      expect(topAmounts[1]).to.equal(ethers.parseEther("3.0"));
      expect(topDonors[2]).to.be.oneOf([addr1.address, addr3.address]);
      expect(topAmounts[2]).to.equal(ethers.parseEther("3.0"));
    });
  });
});