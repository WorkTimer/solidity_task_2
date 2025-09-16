// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BeggingContract
 * @dev A begging contract that allows users to send Ether to the contract address
 */
contract BeggingContract is Ownable {
    // Records the donation amount for each donor
    mapping(address => uint256) public donations;
    
    // Records the total donation amount
    uint256 public totalDonations;
    
    // Records the number of donors
    uint256 public donorCount;
    
    // Records all donor addresses
    address[] public donors;
    
    // Top 3 donors (sorted by donation amount)
    struct TopDonor {
        address donor;
        uint256 amount;
    }
    
    TopDonor[3] public topDonors;
    
    // Time restriction variables (immutable - set only at deployment)
    uint256 public immutable donationStartTime;
    uint256 public immutable donationEndTime;
    
    // Event: Records each donation
    event Donation(address indexed donor, uint256 amount, uint256 timestamp);
    
    // Event: Records fund withdrawal
    event Withdrawal(address indexed owner, uint256 amount, uint256 timestamp);
    
    
    /**
     * @dev Constructor, sets the contract owner and time restriction
     * @param startTime Start time of donation period (Unix timestamp)
     * @param endTime End time of donation period (Unix timestamp)
     */
    constructor(uint256 startTime, uint256 endTime) Ownable(msg.sender) {
        require(startTime < endTime, "Start time must be before end time");
        
        donationStartTime = startTime;
        donationEndTime = endTime;
    }
    
    /**
     * @dev Updates the top 3 donors
     * @param donor Donor address
     * @param amount Donation amount
     */
    function _updateTopDonors(address donor, uint256 amount) private {
        // Directly compare 3 positions to avoid loops
        if (amount >= topDonors[0].amount) {
            // 1st place: Move 2nd and 3rd places, insert new 1st place
            topDonors[2] = topDonors[1];
            topDonors[1] = topDonors[0];
            topDonors[0] = TopDonor({donor: donor, amount: amount});
        } else if (amount >= topDonors[1].amount) {
            // 2nd place: Move 3rd place, insert new 2nd place
            topDonors[2] = topDonors[1];
            topDonors[1] = TopDonor({donor: donor, amount: amount});
        } else if (amount >= topDonors[2].amount) {
            // 3rd place: Direct replacement
            topDonors[2] = TopDonor({donor: donor, amount: amount});
        }
        // If none are greater or equal, then not in top 3, do nothing
    }
    
    /**
     * @dev Donation function, allows users to send Ether to the contract
     */
    function donate() external payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        // Check time restriction
        require(block.timestamp >= donationStartTime, "Donation period has not started yet");
        require(block.timestamp <= donationEndTime, "Donation period has ended");
        
        // If it's a new donor, increment donor count
        if (donations[msg.sender] == 0) {
            donorCount++;
            donors.push(msg.sender);
        }
        
        // Accumulate donation amount
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;
        
        // Update top 3 donors
        _updateTopDonors(msg.sender, donations[msg.sender]);
        
        // Trigger donation event
        emit Donation(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev Withdraw all funds, only the contract owner can call
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        // Transfer funds to owner address
        payable(owner()).transfer(balance);
        
        // Trigger withdrawal event
        emit Withdrawal(owner(), balance, block.timestamp);
    }
    
    /**
     * @dev Query the donation amount of a specific address
     * @param donor Donor address
     * @return The donation amount of this address
     */
    function getDonation(address donor) external view returns (uint256) {
        return donations[donor];
    }
    
    /**
     * @dev Get the current balance of the contract
     * @return Contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get the total donation amount
     * @return Total donation amount
     */
    function getTotalDonations() external view returns (uint256) {
        return totalDonations;
    }
    
    /**
     * @dev Get the number of donors
     * @return Number of donors
     */
    function getDonorCount() external view returns (uint256) {
        return donorCount;
    }
    
    /**
     * @dev Get all donor addresses
     * @return Array of donor addresses
     */
    function getAllDonors() external view returns (address[] memory) {
        return donors;
    }
    
    /**
     * @dev Get the top 3 donors
     * @return Address array and amount array
     */
    function getTop3Donors() external view returns (address[] memory, uint256[] memory) {
        address[] memory topDonorsList = new address[](3);
        uint256[] memory topAmounts = new uint256[](3);
        
        for (uint256 i = 0; i < 3; i++) {
            topDonorsList[i] = topDonors[i].donor;
            topAmounts[i] = topDonors[i].amount;
        }
        
        return (topDonorsList, topAmounts);
    }
    
    
    /**
     * @dev Check if donation is currently allowed based on time restriction
     * @return True if donation is allowed, false otherwise
     */
    function isDonationAllowed() external view returns (bool) {
        return block.timestamp >= donationStartTime && block.timestamp <= donationEndTime;
    }
    
    /**
     * @dev Get time restriction information
     * @return startTime Start time of donation period
     * @return endTime End time of donation period
     * @return currentTime Current block timestamp
     */
    function getTimeRestrictionInfo() external view returns (uint256 startTime, uint256 endTime, uint256 currentTime) {
        return (donationStartTime, donationEndTime, block.timestamp);
    }
}
