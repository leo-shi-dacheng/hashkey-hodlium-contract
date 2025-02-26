// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./StHSK.sol";
import "./HashKeyChainStakingOperations.sol";
import "./HashKeyChainStakingAdmin.sol";
import "./HashKeyChainStakingEmergency.sol";

/**
 * @title HashKeyChainStaking
 * @dev Main staking contract, based on share model, users can choose locked or unlocked staking
 */
contract HashKeyChainStaking is 
    Initializable,
    HashKeyChainStakingOperations,
    HashKeyChainStakingAdmin,
    HashKeyChainStakingEmergency
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
    * @dev Initialize the contract
    * @param _hskPerBlock HSK reward per block
    * @param _startBlock Starting block
    * @param _maxHskPerBlock Maximum reward per block
    * @param _minStakeAmount Minimum staking amount
    * @param _annualBudget Annual budget (optional, if 0 it will be calculated based on hskPerBlock)
    */
    function initialize(
        uint256 _hskPerBlock,
        uint256 _startBlock,
        uint256 _maxHskPerBlock,
        uint256 _minStakeAmount,
        uint256 _annualBudget
    ) public reinitializer(2) {
        __HashKeyChainStakingBase_init(
            _hskPerBlock,
            _startBlock,
            _maxHskPerBlock,
            _minStakeAmount
        );
        
        if (_annualBudget > 0) {
            annualRewardsBudget = _annualBudget;
        }
    }

    /**
     * @dev Set staking end time
     * @param _endTime New end time
     */
    function setStakeEndTime(uint256 _endTime) external onlyOwner {
        require(_endTime > block.timestamp, "End time must be in future");
        stakeEndTime = _endTime;
    }

    /**
     * @dev Check if staking is open
     */
    function isStakingOpen() public view returns (bool) {
        return block.timestamp < stakeEndTime;
    }

    /**
     * @dev Get current stHSK exchange rate (1 stHSK = ? HSK)
     */
    function getCurrentExchangeRate() external view returns (uint256) {
        return getHSKForShares(PRECISION_FACTOR);
    }

    /**
     * @dev Get user's locked stake count
     * @param _user User address
     */
    function getUserLockedStakeCount(address _user) external view returns (uint256) {
        return lockedStakes[_user].length;
    }

    /**
     * @dev Get user's active (not withdrawn) locked stake count
     * @param _user User address
     */
    function getUserActiveLockedStakes(address _user) external view returns (uint256) {
        LockedStake[] storage userStakes = lockedStakes[_user];
        uint256 activeStakes = 0;
        
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (!userStakes[i].withdrawn && userStakes[i].sharesAmount > 0) {
                activeStakes++;
            }
        }
        
        return activeStakes;
    }

    /**
     * @dev Get locked stake information
     * @param _user User address
     * @param _stakeId Stake ID
     */
    function getLockedStakeInfo(address _user, uint256 _stakeId) external view returns (
        uint256 sharesAmount,
        uint256 hskAmount,
        uint256 currentHskValue,
        uint256 lockEndTime,
        bool isWithdrawn,
        bool isLocked
    ) {
        require(_stakeId < lockedStakes[_user].length, "Invalid stake ID");
        LockedStake storage stake = lockedStakes[_user][_stakeId];
        
        return (
            stake.sharesAmount,
            stake.hskAmount,
            getHSKForShares(stake.sharesAmount),
            stake.lockEndTime,
            stake.withdrawn,
            block.timestamp < stake.lockEndTime
        );
    }

    /**
     * @dev Get total value locked in the contract
     */
    function totalValueLocked() external view returns (uint256) {
        return totalPooledHSK;
    }

    /**
     * @dev Get APRs for all staking durations
     * @param _stakeAmount Simulated staking amount
     */
    function getAllStakingAPRs(uint256 _stakeAmount) external view returns (
        uint256[4] memory estimatedAPRs,
        uint256[4] memory maxAPRs
    ) {
        estimatedAPRs[0] = getCurrentAPR(_stakeAmount, StakeType.FIXED_30_DAYS);
        estimatedAPRs[1] = getCurrentAPR(_stakeAmount, StakeType.FIXED_90_DAYS);
        estimatedAPRs[2] = getCurrentAPR(_stakeAmount, StakeType.FIXED_180_DAYS);
        estimatedAPRs[3] = getCurrentAPR(_stakeAmount, StakeType.FIXED_365_DAYS);
        
        maxAPRs[0] = 120;   // MAX_APR_30_DAYS
        maxAPRs[1] = 350;   // MAX_APR_90_DAYS 
        maxAPRs[2] = 650;   // MAX_APR_180_DAYS
        maxAPRs[3] = 1200;  // MAX_APR_365_DAYS
        
        return (estimatedAPRs, maxAPRs);
    }

    /**
     * @dev Get detailed staking statistics
     * @param _simulatedStakeAmount Simulated staking amount
     */
    function getDetailedStakingStats(uint256 _simulatedStakeAmount) external view returns (
        uint256 totalStakedAmount,
        uint256[4] memory durations,
        uint256[4] memory currentAPRs,
        uint256[4] memory maxPossibleAPRs,
        uint256[4] memory baseBonus
    ) {
        totalStakedAmount = totalPooledHSK;
        
        // Set different staking durations (seconds)
        durations[0] = 30 days;
        durations[1] = 90 days;
        durations[2] = 180 days;
        durations[3] = 365 days;
        
        // Base bonuses
        baseBonus[0] = stakingBonus[StakeType.FIXED_30_DAYS];
        baseBonus[1] = stakingBonus[StakeType.FIXED_90_DAYS];
        baseBonus[2] = stakingBonus[StakeType.FIXED_180_DAYS];
        baseBonus[3] = stakingBonus[StakeType.FIXED_365_DAYS];
        
        // Maximum possible APRs
        maxPossibleAPRs[0] = 120;   // MAX_APR_30_DAYS
        maxPossibleAPRs[1] = 350;   // MAX_APR_90_DAYS 
        maxPossibleAPRs[2] = 650;   // MAX_APR_180_DAYS
        maxPossibleAPRs[3] = 1200;  // MAX_APR_365_DAYS
        
        // Calculate current estimated APRs
        currentAPRs[0] = getCurrentAPR(_simulatedStakeAmount, StakeType.FIXED_30_DAYS);
        currentAPRs[1] = getCurrentAPR(_simulatedStakeAmount, StakeType.FIXED_90_DAYS);
        currentAPRs[2] = getCurrentAPR(_simulatedStakeAmount, StakeType.FIXED_180_DAYS);
        currentAPRs[3] = getCurrentAPR(_simulatedStakeAmount, StakeType.FIXED_365_DAYS);
        
        return (totalStakedAmount, durations, currentAPRs, maxPossibleAPRs, baseBonus);
    }

    /**
     * @dev Get HSK staking APR information
     * @param _stakeAmount Simulated staking amount
     */
    function getHSKStakingAPR(uint256 _stakeAmount) public view returns (
        uint256 baseApr,
        uint256 minApr,
        uint256 maxApr
    ) {
        // Calculate base APR - using annual budget
        uint256 yearlyRewards = annualRewardsBudget;
        
        if (totalPooledHSK == 0) {
            baseApr = MAX_APR > 1200 ? 1200 : MAX_APR; // MAX_APR_365_DAYS = 1200
            return (baseApr, 120, 1200); // Return default values
        }
        
        uint256 newTotal = totalPooledHSK + _stakeAmount;
        baseApr = (yearlyRewards * BASIS_POINTS) / newTotal;
        
        // Minimum APR for 30-day lock
        minApr = (baseApr + stakingBonus[StakeType.FIXED_30_DAYS]) > 120 ? 
            120 : (baseApr + stakingBonus[StakeType.FIXED_30_DAYS]);
        
        // Maximum APR for 365-day lock
        maxApr = (baseApr + stakingBonus[StakeType.FIXED_365_DAYS]) > 1200 ? 
            1200 : (baseApr + stakingBonus[StakeType.FIXED_365_DAYS]);
            
        return (baseApr, minApr, maxApr);
    }

    /**
     * @dev Callback function for receiving HSK
     */
    receive() external payable {
        // Treat received HSK as rewards
        reservedRewards += msg.value;
        emit RewardsAdded(msg.value, msg.sender);
    }
}