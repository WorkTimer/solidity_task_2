const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BeggingContractModule", (m) => {
  // 设置30分钟的时间限制
  const currentTime = Math.floor(Date.now() / 1000); // 当前时间戳
  const startTime = currentTime; // 立即开始
  const endTime = currentTime + (30 * 60); // 30分钟后结束
  
  // 部署 BeggingContract，传入时间参数
  const beggingContract = m.contract("BeggingContract", [startTime, endTime]);

  return { beggingContract };
});
