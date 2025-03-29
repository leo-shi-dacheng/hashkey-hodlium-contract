# 🔐 HashKeyChain Staking
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Tests](https://img.shields.io/badge/tests-100%25-brightgreen.svg)
![Solidity](https://img.shields.io/badge/solidity-0.8.28-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> A secure, gas-optimized HSK staking platform with flexible staking options, reward mechanisms, and enterprise-grade security features.

## 📋 Deployment Information

```
✅ HashKeyChainStaking deployed to: 0xC027985cda8DD019d80c74E06EFE44158D1305ac
✅ Verified hskPerBlock: 0.475646879756468797
✅ Verified startBlock: 8684771
✅ Contract version: 1
✅ Contract owner: 0x404bacf6f8C563181aa8Ffb82c3A0EB0442C6666
```

### Important Addresses
| Contract | Address |
|----------|---------|
| StHSK Token | `0x0068418bAE51127Fc3e0331274De5CB9CaD337E7` |
| Staking Implementation | `0xC027985cda8DD019d80c74E06EFE44158D1305ac` |

## 🏗️ Architecture

HashKeyChain Staking is built with a modular architecture using the proxy pattern for upgradability:

```
HashKeyChainStaking (Main Contract)
├── HashKeyChainStakingBase (Core functionality)
├── HashKeyChainStakingAdmin (Admin operations)
├── HashKeyChainStakingOperations (Staking logic)
├── HashKeyChainStakingEmergency (Safety measures)
└── HashKeyChainStakingStorage (State variables)
```

The platform issues **stHSK** tokens that represent staked HSK and accrue rewards over time.

## 🧪 Comprehensive Test Suite

Our project includes a battle-tested suite of tests designed to ensure the highest standards of security and functionality:

### 1. 🔄 Basic Initialization & Functionality
- Contract initialization with correct parameters
- Configuration of staking bonus rates
- Minimum stake amount enforcement
- Basic staking and unstaking operations

### 2. 🔒 Locked Staking Mechanisms
- Time-locked staking with multiple duration options:
  - 30-day lock (0% bonus)
  - 90-day lock (8% bonus)
  - 180-day lock (20% bonus)
  - 365-day lock (40% bonus)
- Early withdrawal penalty enforcement
- Lock period verification
- Proper handling of multiple locked stakes per user

### 3. 💰 Reward Distribution System
- Block-based reward accrual
- Proper APR calculation based on lock periods
- Reward pool updates and distribution
- Stake multiplier application

### 4. 👑 Admin Functionality
- Protected administrative functions
- HSK per block rate adjustments
- Minimum stake amount updates
- Pause/unpause mechanisms

### 5. 🚨 Emergency Operations
- Emergency withdrawal functionality
- Protection against malicious token recovery
- Circuit breaker mechanisms

### 6. 🛡️ Security Penetration Testing
Extensive security testing including:

- **Reentrancy Protection**: Custom attacker contract simulating reentrancy attacks
- **Access Control**: Verification of proper permission boundaries
- **DoS Resistance**: Tests for gas limit vulnerabilities and loop-based attacks  
- **Overflow/Underflow Protection**: Validation of Solidity 0.8+ safeguards
- **Front-Running Protection**: Sandwich attack simulations
- **Flash Loan Resistance**: Exchange rate manipulation attempts
- **Time-Based Attack Prevention**: Timestamp manipulation tests

### 7. 💯 Edge Case Coverage
- Extreme value testing
- Gas optimization verification
- State consistency under various conditions

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Reentrancy Guard | OpenZeppelin ReentrancyGuard |
| Access Control | Role-based permissions |
| Pausable | Circuit breaker pattern |
| Upgradable | Transparent proxy pattern |
| Arithmetic Safety | Solidity 0.8+ built-in overflow checks |
| Time Constraints | Block-based time calculations |

## 📈 Staking Features

- **Flexible Staking Options**: Choose between liquid staking or time-locked staking
- **Enhanced APR for Longer Commitments**: Up to 40% bonus for 1-year locks
- **Liquid Staking Token**: stHSK represents your stake and can be transferred
- **Automatic Reward Compounding**: Rewards automatically increase the value of stHSK

## 🌟 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/hashkeychain-staking.git

# Install dependencies
npm install

# Run tests
npx hardhat test

# Deploy to testnet
npx hardhat run scripts/deploy.js --network hashkeyTestnet
```

## 🔄 Usage

```javascript
// Stake HSK 
await stakingContract.stakeFlexible({ value: ethers.parseEther("100") });

// Stake with 90-day lock for increased APR
await stakingContract.stakeLocked(FIXED_90_DAYS, { value: ethers.parseEther("500") });

// View your staked balance
const myStHSK = await stHSKToken.balanceOf(myAddress);

// Unstake lock 
await stakingContract.unstakeLocked(0);

// Unstake flex
await stakingContract.requestUnstakeFlexible(0);

// wait two weeks
await stakingContract.claimWithdrawal(0);
```

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*HashKeyChain Staking - Secure your HSK, unlock your future*

## 📊 Test Report

### Test Summary
| Test Suite | Cases | Passing | Coverage |
|------------|-------|---------|----------|
| 01_InitAndBasic | 4 | ✅ 4/4 | 100% |
| 02_LockedStaking | 4 | ✅ 4/4 | 100% |
| 03_Rewards | 2 | ✅ 2/2 | 100% |
| 04_Admin | 3 | ✅ 3/3 | 100% |
| 05_Emergency | 2 | ✅ 2/2 | 100% |
| 06_BasicStaking | 3 | ✅ 3/3 | 100% |
| 07_SecurityPenetration | 9 | ✅ 9/9 | 100% |
| **TOTAL** | **27** | ✅ **27/27** | **100%** |

### Code Coverage
| Contract | Statements | Functions | Branches | Lines |
|----------|------------|-----------|----------|-------|
| HashKeyChainStaking | 100% | 100% | 100% | 100% |
| HashKeyChainStakingBase | 100% | 100% | 100% | 100% |
| HashKeyChainStakingAdmin | 100% | 100% | 100% | 100% |
| HashKeyChainStakingOperations | 100% | 100% | 92.86% | 100% |
| HashKeyChainStakingEmergency | 100% | 100% | 100% | 100% |
| StHSK | 100% | 100% | 87.5% | 100% |
| **All contracts** | **100%** | **100%** | **95.12%** | **100%** |

### Test Execution Time
- Total execution time: 2.74s
- Average: 101.48ms per test

### Key Test Highlights
- **Security Tests**: Successfully detected and prevented all simulated attacks
- **Edge Cases**: All boundary conditions tested including overflow/underflow scenarios
- **Gas Optimization**: All operations stay well below block gas limits
- **Reward Accuracy**: Reward calculations match expected values with 0.01% tolerance

### Security Penetration Test Results
| Attack Vector | Result | Details |
|---------------|--------|---------|
| Reentrancy | ✅ PASS | No successful reentrant calls detected |
| Access Control | ✅ PASS | All unauthorized access attempts blocked |
| Denial of Service | ✅ PASS | Operations efficient, resistant to gas limit attacks |
| Integer Overflow | ✅ PASS | Solidity 0.8+ safeguards effective |
| Front-running | ✅ PASS | Exchange rate variations within acceptable range |
| Flash Loan | ✅ PASS | No significant exchange rate manipulation possible |
| Time Manipulation | ✅ PASS | Lock periods correctly enforced |
