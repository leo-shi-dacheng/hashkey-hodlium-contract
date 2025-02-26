// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./HashKeyChainStakingEvents.sol";
import "./StHSK.sol";

/**
 * @title HashKeyChainStakingBase
 * @dev Basic functionality implementation, using a share-based staking model
 */
abstract contract HashKeyChainStakingBase is 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    HashKeyChainStakingEvents
{
    // Constants
    uint256 internal constant PRECISION_FACTOR = 1e18;
    uint256 internal constant MAX_PENALTY = 5000;      // Maximum penalty: 50%
    uint256 internal constant BASIS_POINTS = 10000;    // 100% in basis points
    uint256 internal constant MAX_APR = 3000;         // Maximum APR: 30%

    function __HashKeyChainStakingBase_init(
        uint256 _hskPerBlock,
        uint256 _startBlock,
        uint256 _maxHskPerBlock,
        uint256 _minStakeAmount
    ) internal onlyInitializing {
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);
        
        require(_hskPerBlock > 0, "HSK per block must be positive");
        require(_startBlock >= block.number, "Start block must be in the future");
        require(_maxHskPerBlock >= _hskPerBlock, "Max HSK per block must be >= HSK per block");
        require(_minStakeAmount >= 100 ether, "Min stake amount must be >= 100 HSK");
        
        stHSK = new StHSK();
        
        hskPerBlock = _hskPerBlock;
        startBlock = _startBlock;
        lastRewardBlock = startBlock;
        maxHskPerBlock = _maxHskPerBlock;
        minStakeAmount = _minStakeAmount;
        totalPooledHSK = 0;
        stakeEndTime = type(uint256).max;  // Default set to maximum value
        version = 1;
        
        // Calculate and set default annual budget
        uint256 blocksPerYear = (365 * 24 * 3600) / 2; // Blocks per year (assuming 2 seconds per block)
        annualRewardsBudget = _hskPerBlock * blocksPerYear;
        
        // Set early withdrawal penalties
        earlyWithdrawalPenalty[StakeType.FIXED_30_DAYS] = 500;    // 5%
        earlyWithdrawalPenalty[StakeType.FIXED_90_DAYS] = 1000;   // 10%
        earlyWithdrawalPenalty[StakeType.FIXED_180_DAYS] = 1500;  // 15%
        earlyWithdrawalPenalty[StakeType.FIXED_365_DAYS] = 2000;  // 20%
        
        // Set bonus for different staking periods
        stakingBonus[StakeType.FIXED_30_DAYS] = 0;      // 0%
        stakingBonus[StakeType.FIXED_90_DAYS] = 80;     // 0.8%
        stakingBonus[StakeType.FIXED_180_DAYS] = 200;   // 2.0%
        stakingBonus[StakeType.FIXED_365_DAYS] = 400;   // 4.0%
        
        emit StakingContractUpgraded(version);
        emit HskPerBlockUpdated(0, _hskPerBlock);
        emit MaxHskPerBlockUpdated(0, _maxHskPerBlock);
        emit MinStakeAmountUpdated(0, _minStakeAmount);
    }

    /**
     * @dev Update reward pool
     */
    function updateRewardPool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }
        
        if (totalPooledHSK == 0) {
            lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = block.number - lastRewardBlock;
        uint256 hskReward = multiplier * hskPerBlock;
        
        // Calculate and limit APR
        uint256 annualReward = hskPerBlock * (365 days / 2); // 2 seconds per block
        uint256 currentAPR = (annualReward * BASIS_POINTS) / totalPooledHSK;
        if (currentAPR > MAX_APR) {
            hskReward = (totalPooledHSK * MAX_APR * multiplier) / (BASIS_POINTS * (365 days / 2));
        }
        
        // Check if contract has enough HSK
        if (reservedRewards >= hskReward) {
            totalPooledHSK += hskReward;
            reservedRewards -= hskReward;
            
            // Update exchange rate
            emit ExchangeRateUpdated(totalPooledHSK, stHSK.totalSupply(), getHSKForShares(PRECISION_FACTOR));
        } else {
            if (reservedRewards > 0) {
                totalPooledHSK += reservedRewards;
                hskReward = reservedRewards;
                reservedRewards = 0;
                
                // Update exchange rate
                emit ExchangeRateUpdated(totalPooledHSK, stHSK.totalSupply(), getHSKForShares(PRECISION_FACTOR));
            }
            emit InsufficientRewards(hskReward, reservedRewards);
        }
        
        lastRewardBlock = block.number;
    }

    /**
     * @dev Calculate HSK amount for specified share amount
     * @param _sharesAmount Share amount
     * @return HSK amount
     */
    function getHSKForShares(uint256 _sharesAmount) public view returns (uint256) {
        uint256 totalShares = stHSK.totalSupply();
        if (totalShares == 0) {
            return _sharesAmount; // Initial 1:1 exchange rate
        }
        return (_sharesAmount * totalPooledHSK) / totalShares;
    }

    /**
     * @dev Calculate share amount for specified HSK amount
     * @param _hskAmount HSK amount
     * @return Share amount
     */
    function getSharesForHSK(uint256 _hskAmount) public view returns (uint256) {
        uint256 totalShares = stHSK.totalSupply();
        if (totalShares == 0 || totalPooledHSK == 0) {
            return _hskAmount; // Initial 1:1 exchange rate
        }
        return (_hskAmount * totalShares) / totalPooledHSK;
    }

    /**
     * @dev Safe HSK transfer function
     * @param _to Recipient address
     * @param _amount Amount
     * @return Whether transfer was successful
     */
    function safeHskTransfer(address payable _to, uint256 _amount) internal returns (bool) {
        uint256 availableBalance = address(this).balance - totalPooledHSK;
        uint256 amountToSend = _amount > availableBalance ? availableBalance : _amount;
        
        if (amountToSend > 0) {
            (bool success, ) = _to.call{value: amountToSend}("");
            return success;
        }
        return true;
    }

    /**
     * @dev Get current annual yield rate for HSK
     * @param _stakeAmount Simulated staking amount
     * @param _stakeType Stake type
     * @return Current APR (basis points)
     */
    function getCurrentAPR(uint256 _stakeAmount, StakeType _stakeType) public view returns (uint256) {
        // Base APR calculation - using annual budget instead of per-block rewards
        uint256 yearlyRewards = annualRewardsBudget;
        
        uint256 baseApr;
        if (totalPooledHSK == 0) {
            baseApr = MAX_APR;
        } else {
            uint256 newTotal = totalPooledHSK + _stakeAmount;
            baseApr = (yearlyRewards * BASIS_POINTS) / newTotal;
            
            // Ensure not exceeding maximum APR
            if (baseApr > MAX_APR) {
                baseApr = MAX_APR;
            }
        }
        
        // Add staking duration bonus
        uint256 totalApr = baseApr + stakingBonus[_stakeType];
        
        // Get maximum APR for corresponding stake type
        uint256 maxTypeApr;
        if (_stakeType == StakeType.FIXED_30_DAYS) {
            maxTypeApr = 120; // 1.2%
        } else if (_stakeType == StakeType.FIXED_90_DAYS) {
            maxTypeApr = 350; // 3.5%
        } else if (_stakeType == StakeType.FIXED_180_DAYS) {
            maxTypeApr = 650; // 6.5%
        } else {
            maxTypeApr = 1200; // 12.0%
        }
        
        // Ensure not exceeding this type's maximum APR
        return totalApr > maxTypeApr ? maxTypeApr : totalApr;
    }

    
}