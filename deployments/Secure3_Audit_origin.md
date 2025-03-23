# $

## # Competitive Security Assessment

## Hashkey_staking

Jan 23rd, 2025

## Secure 3

secure3.io


- Summary
- Overview
- Audit Scope
- Code Assessment Findings
- HSS-1The unstake() function and claimReward() function do not function properly
- HSS-2Lack of check lockPeriod in stake function
- HSS-3Incorrect Variable Usage
- HSS-4Update an existing lockOptions would result in assets being locked
- HSS-5Reward calculation is incomplete when the unstake time is unlocked.
- HSS-6Missing Reward Calculation in emergencyWithdraw() Function
- HSS-7Insufficient Reward Pool Protection Could Lead to Last User Fund Loss
- HSS-8Instable rate risk, when admin update staking rate
- HSS-9Inconsistent Emergency Withdrawal Mechanism Allows Unfair Reward Distribution
- HSS-10Using unchecked arithmetic in for loops
- HSS-11Use of Hardhat Console in Production Code
- HSS-12Unused/Ineffective Whitelist Mode
- HSS-13Unused code
- HSS-14Unnecessary Storage Writes in Whitelist Management Functions
- HSS-15Two-step ownership transfer
- HSS-16Missing Events for Privileged Operations
- HSS-17Missing Emergency Mode Controls and Redundant Emergency System Implementation
- HSS-18Mismatched Error
- HSS-19Lack of Reward Rate Validation in _updateReward
- HSS-20Inconsistency between the addLockOption and updateLockOption functions
- Disclaimer


## Summary

This report is prepared for the project to identify vulnerabilities and issues in the smart contract

source code. A group of NDA covered experienced security experts have participated in the

Secure3’s Audit Contest to find vulnerabilities and optimizations. Secure3 team has participated in

the contest process as well to provide extra auditing coverage and scrutiny of the finding

submissions.

The comprehensive examination and auditing scope includes:

- Cross checking contract implementation against functionalities described in the documents and

white paper disclosed by the project owner.

- Contract Privilege Role Review to provide more clarity on smart contract roles and privilege.
- Using static analysis tools to analyze smart contracts against common known vulnerabilities

patterns.

- Verify the code base is compliant with the most up-to-date industry standards and security best

practices.

- Comprehensive line-by-line manual code review of the entire codebase by industry experts.

The security assessment resulted in findings that are categorized in four severity levels: Critical,

Medium, Low, Informational. For each of the findings, the report has included recommendations

of fix or mitigation for security and best practices.


## Overview

Project Name Hashkey_staking

Language solidity

```
Codebase
https://github.com/SpectreMercury/staking
```
audit version-c3eb0d84012d576b10fd430251587468ecb4cf

0

final version-ce9508ad0f4b45c1d959a1648e516150cf4a2e0e


## Audit Scope

```
File SHA256 Hash
```
```
contracts/staking.sol 9eb64864ee245fed780c23b258e38959f8bf0058e
078ddf7340c38a5c9e
```
```
contracts/libraries/StakingLib.sol 922087ecb115468135ce270211fcbcc5697980735b9a
10ec49af12aebe75f3c
```
```
contracts/StakingStorage.sol 46d505db4e280549fb33f5ec5daea34876b24886c8c
a95ffed8097c64ee
```

## Code Assessment Findings

```
ID Name Category Severity Client Response Contributor
```
```
HSS-1 The unstake() function and
```
```
claimReward() function do n
ot function properly
```
```
Logical Medium Mitigated ***
```
```
HSS-2 Lack of check lockPeriod in
```
```
stake function
```
```
Logical Medium Mitigated ***
```
```
HSS-3 Incorrect Variable Usage Logical Medium Fixed ***
```
```
HSS-4 Update an existing lockOpti
```
```
ons would result in assets b
eing locked
```
```
Privilege Rela
ted
```
```
Low Acknowledged ***
```
```
HSS-5 Reward calculation is incom
```
```
plete when the unstake time
is unlocked.
```
```
Logical Low Fixed ***
```
```
HSS-6 Missing Reward Calculation
```
```
in emergencyWithdraw() Fu
nction
```
```
Logical Low Fixed ***
```

HSS-8 Instable rate risk, when adm

```
in update staking rate
```
```
Logical Low Fixed ***
```
HSS-9 Inconsistent Emergency Wit

```
hdrawal Mechanism Allows
Unfair Reward Distribution
```
```
Logical Low Fixed ***
```
HSS-10 Using unchecked arithmetic

```
in for loops
```
```
Logical Informational Fixed ***
```
HSS-11 Use of Hardhat Console in P

```
roduction Code
```
```
Logical Informational Fixed ***
```
HSS-12 Unused/Ineffective Whitelist

```
Mode
```
```
Logical Informational Fixed ***
```
HSS-13 Unused code Code Style Informational Fixed ***

HSS-14 Unnecessary Storage Writes

```
in Whitelist Management Fu
nctions
```
```
Gas Optimiza
tion
```
```
Informational Fixed ***
```
HSS-15 Two-step ownership transfe

```
r
```
```
Logical Informational Acknowledged ***
```
HSS-16 Missing Events for Privilege

```
d Operations
```
```
Code Style Informational Fixed ***
```
HSS-17 Missing Emergency Mode C

```
ontrols and Redundant Eme
rgency System Implementat
ion
```
```
Logical Informational Acknowledged ***
```
HSS-18 Mismatched Error Logical Informational Fixed ***

HSS-19 Lack of Reward Rate Validati

```
on in _updateReward
```
```
Logical Informational Fixed ***
```
HSS-20 Inconsistency between the

```
addLockOption and updateLo
ckOption functions
```
```
Logical Informational Fixed ***
```

## HSS-1The unstake() function and claimReward() function do not function properly

## not function properly

```
Category Severity Client Response Contributor
```
```
Logical Medium Mitigated ***
```
**Code Reference**

```
code/contracts/libraries/StakingLib.sol#L32-L
code/contracts/libraries/StakingLib.sol#L45-L
code/contracts/libraries/StakingLib.sol#L
```
```
32 : function calculateReward(
33 : uint256 amount,
34 : uint256 timeElapsed,
35 : uint256 rewardRate
36 : ) public pure returns (uint256 reward) {
37 : // Early return for zero values
38 : if (amount == 0 || timeElapsed == 0 || rewardRate == 0 ) {
39 : return 0 ;
40 : }
41 :
42 : // High precision calculations using 18 decimals
43 : uint256 PRECISION = 1e18;
44 :
45 : // Input validation to prevent overflow
46 : require(amount <= type(uint256).max / PRECISION, "Amount too large");
47 : require(timeElapsed <= SECONDS_PER_YEAR, "Time elapsed too large");
48 : require(rewardRate <= BASIS_POINTS, "Rate too large");
49 :
50 : // Step 1: Calculate annual rate with high precision
51 : uint256 annualRate = (rewardRate * PRECISION) / BASIS_POINTS;
```
```
52 : require(annualRate <= type(uint256).max / PRECISION, "Annual rate overflow");
53 :
54 : // Step 2: Calculate time ratio with high precision
55 : uint256 timeRatio = (timeElapsed * PRECISION) / SECONDS_PER_YEAR;
56 : require(timeRatio <= PRECISION, "Time ratio overflow");
57 :
58 : // Step 3: Calculate reward ratio
59 : uint256 rewardRatio = (annualRate * timeRatio) / PRECISION;
60 : require(rewardRatio <= type(uint256).max / PRECISION, "Reward ratio overflow");
61 :
62 : // Step 4: Calculate final reward amount
63 : reward = (amount * rewardRatio) / PRECISION;
64 : require(reward <= amount * rewardRate / BASIS_POINTS, "Reward overflow");
65 :
66 : return reward;
67 : }
68 :
69 : /**
70: * @dev Validates lock period and reward rate for staking options
71: * @param period Lock period in seconds
```

72 : * @param rewardRate Annual reward rate in basis points
73 : * @return bool True if the lock option is valid
74 : */
75 : function isValidLockOption(
76 : uint256 period,
77 : uint256 rewardRate
78 : ) public pure returns (bool) {
79 : // Period must be between 1 day and 2 years
80 : if (period < 1 days || period > 730 days) {
81 : return false;
82 : }
83 :
84 : // Rate must not exceed 100%
85 : if (rewardRate > BASIS_POINTS) {
86 : return false;
87 : }
88 :
89 : return true;
90 : }

45 : // Input validation to prevent overflow
46 : require(amount <= type(uint256).max / PRECISION, "Amount too large");
47 : require(timeElapsed <= SECONDS_PER_YEAR, "Time elapsed too large");
48 : require(rewardRate <= BASIS_POINTS, "Rate too large");

80 : if (period < 1 days || period > 730 days) {

```
code/contracts/staking.sol#L139-L
code/contracts/staking.sol#L351-L
```
139 : function unstake(
140 : uint256 positionId
141 : ) external override nonReentrant validPosition(positionId) {
142 : Position[] storage positions = userPositions[msg.sender];
143 : Position storage position;
144 : uint256 posIndex;
145 : bool found = false;
146 :
147 : for (uint256 i = 0 ; i < positions.length; i++) {
148 : if (positions[i].positionId == positionId) {
149 : position = positions[i];
150 : posIndex = i;
151 : found = true;
152 : break;
153 : }
154 : }
155 :
156 : if (!found) revert PositionNotFound();
157 :
158 : position = positions[posIndex];


159 : if (position.isUnstaked) revert PositionNotFound();
160 : require(
161 : block.timestamp + TIME_TOLERANCE >= position.stakedAt + position.lockPeriod,
162 : "Still locked"
163 : );
164 :
165 : uint256 reward = _updateReward(msg.sender, posIndex);
166 : uint256 amount = position.amount;
167 : uint256 totalPayout = amount + reward;
168 :
169 : position.isUnstaked = true;
170 : userTotalStaked[msg.sender] -= amount;
171 : totalStaked -= amount;
172 :
173 : emit RewardClaimed(msg.sender, positionId, reward, block.timestamp);
174 : emit PositionUnstaked(msg.sender, positionId, amount, block.timestamp);
175 :
176 : (bool success, ) = msg.sender.call{value: totalPayout}("");
177 : require(success, "Transfer failed");
178 : }

### 179 :

180 : function claimReward(
181 : uint256 positionId
182 : ) external override nonReentrant whenNotPaused validPosition(positionId) returns (uint256) {
183 : Position[] storage positions = userPositions[msg.sender];
184 : uint256 posIndex;
185 : bool found = false;
186 :
187 : for (uint256 i = 0 ; i < positions.length; i++) {
188 : if (positions[i].positionId == positionId) {
189 : posIndex = i;
190 : found = true;
191 : break;
192 : }
193 : }
194 :
195 : if (!found) revert PositionNotFound();
196 :
197 : uint256 reward = _updateReward(msg.sender, posIndex);
198 : if (reward == 0 ) revert NoReward();


### 199 :

```
200 : (bool success, ) = msg.sender.call{value: reward}("");
201 : require(success, "Reward transfer failed");
202 : emit RewardClaimed(msg.sender, positionId, reward, block.timestamp);
203 :
204 : return reward;
205 : }
206 :
207 : function pendingReward(
208 : uint256 positionId
209 : ) external view override returns (uint256) {
210 : Position[] memory positions = userPositions[msg.sender];
211 :
212 : for (uint256 i = 0 ; i < positions.length; i++) {
213 : Position memory position = positions[i];
214 : if (position.positionId == positionId && !position.isUnstaked) {
215 : uint256 timeElapsed = block.timestamp - position.lastRewardAt;
216 : uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);
217 : return StakingLib.calculateReward(
218 : position.amount,
```
```
219 : timeElapsed,
220 : rewardRate
221 : );
222 : }
223 : }
224 :
225 : return 0 ;
226 : }
```
```
351 : function _updateReward(
352 : address _staker,
353 : uint256 _positionIndex
354 : ) internal returns (uint256 reward) {
355 : Position storage position = userPositions[_staker][_positionIndex];
356 : if (position.isUnstaked) return 0 ;
357 :
358 : uint256 timeElapsed = block.timestamp - position.lastRewardAt;
359 : if (timeElapsed == 0 ) return 0 ;
360 : uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);
361 : reward = StakingLib.calculateReward(
362 : position.amount,
363 : timeElapsed,
364 : rewardRate
365 : );
366 :
367 : position.lastRewardAt = block.timestamp;
368 : }
```
**Description**

*** **:** The **calculateReward** function in **StakingLib** contains a critical inconsistency with the staking period

validation. While **isValidLockOption** allows staking periods up to 730 days (2 years), the **calculateReward**

function restricts **timeElapsed** to a maximum of 365 days through the validation:

```
require(timeElapsed <= SECONDS_PER_YEAR, "Time elapsed too large");
```

```
function isValidLockOption(
uint256 period,
uint256 rewardRate
) public pure returns (bool) {
// Period must be between 1 day and 2 years
if (period < 1 days || period > 730 days) {
return false;
}
```
```
// Rate must not exceed 100%
if (rewardRate > BASIS_POINTS) {
return false;
}
```
```
return true;
}
```
This creates a significant issue for long-term stakers:

1. Users can stake for up to 730 days according to **isValidLockOption**
2. However, when calculating rewards, if the time elapsed since their last reward claim exceeds 365 days, the
    transaction will revert
3. This effectively traps user funds in the contract as they cannot claim rewards
    or even retrieve their original funds for periods longer than a year
4. The issue is particularly severe for users who don't claim rewards frequently.

The root cause is a mismatch between the staking period validation and reward calculation logic, where the

reward calculation doesn't properly account for the full range of allowed staking periods.

*** **:** In the **calculateReward()** function, line 47 of the code:

```
require(timeElapsed <= SECONDS_PER_YEAR, "Time elapsed too large");
```
indicates that the function will only execute correctly if the **timeElapsed** parameter is less than or equal to 365

days.

Upon inspecting the **staking.sol** contract, we find that the two functions calling **calculateReward()** , namely **_up**

**dateReward()** and **pendingReward()** , calculate **timeElapsed** as **timeElapsed = block.timestamp - position.lastReward**

**At**. From this, we can conclude that the time interval between reward claims is always less than or equal to 365

days. However, no relevant warning or indication is provided within the **staking.sol** contract.

If a user forgets to claim their rewards within a year after staking, they will not be able to claim rewards in the

future. Moreover, they will not be able to unstake their assets or view ongoing rewards. This means that the **unst**

**ake()** , **claimReward()** , and **pendingReward()** functions will not work properly. This issue is possible to occur.

Please review the **isValidLockOption()** function, where on line 80:

```
if (period < 1 days || period > 730 days) {
```

It indicates that the lock-up period must be between 1 day and 730 days (inclusive).

**Recommendation**

*** **:** Modify the time validation in calculateReward to match the maximum staking period.

*** **:** 1

Delete this check

```
https://github.com/Secure3Audit/code_Hashkey_staking/blob/main/code/contracts/libraries/StakingLib.sol#L46-L
48
require(amount <= type(uint256).max / PRECISION, "Amount too large");
```
- require(timeElapsed <= SECONDS_PER_YEAR, "Time elapsed too large");
require(rewardRate <= BASIS_POINTS, "Rate too large");

2

Correctly handling the **calculateReward()** code logic to align with the logic of **isValidLockOption()**.

**Client Response**

client response : Mitigated.

Regarding the time validation inconsistency between isValidLockOption() and calculateReward():

Can be avoided through compliant operation patterns

This is a design constraint rather than a security vulnerability. changed severity to Medium

Secure3:. changed severity to Medium

client response : Mitigated. changed severity to Medium

Regarding the 365-day time limit in calculateReward():

This is a clearly defined business constraint in the contract

Users can avoid timeout issues by claiming rewards on schedule

No fund security risk exists, only operational timing constraints

Secure3:. changed severity to Medium


## HSS-2Lack of check lockPeriod in stake function

```
Category Severity Client Response Contributor
```
```
Logical Medium Mitigated ***
```
**Code Reference**

```
code/contracts/libraries/StakingLib.sol#L183-L
```
```
183 : function validateAndGetRate(
184 : uint256 lockPeriod,
185 : IStaking.LockOption[] memory options
186 : ) public pure returns (uint256 rate) {
187 : for (uint256 i = 0 ; i < options.length; i++) {
188 : if (options[i].period == lockPeriod) {
189 : return options[i].rewardRate;
190 : }
191 : }
192 : revert InvalidPeriod();
```
```
code/contracts/staking.sol#L97-L
code/contracts/staking.sol#L139-L
code/contracts/staking.sol#L351-L
```
```
97 : function stake(
98 : uint256 lockPeriod
99 : ) external payable nonReentrant whenNotPaused notBlacklisted returns (uint256) {
100 : console.log("Current time:", block.timestamp);
101 : console.log("Stake end time:", stakeEndTime);
102 :
103 : require(block.timestamp < stakeEndTime, "Staking period has ended");
104 :
105 : uint256 amount = msg.value;
106 : amount = StakingLib.validateAndFormatAmount(amount, minStakeAmount);
107 :
108 : if (historicalTotalStaked + amount > maxTotalStake) revert MaxTotalStakeExceeded();
109 :
110 : uint256 positionId = nextPositionId++;
111 : Position memory newPosition = Position({
112 : positionId: positionId,
113 : amount: amount,
114 : lockPeriod: lockPeriod,
115 : stakedAt: block.timestamp,
116 : lastRewardAt: block.timestamp,
```
```
117 : isUnstaked: false
118 : });
```

```
139 : function unstake(
140 : uint256 positionId
141 : ) external override nonReentrant validPosition(positionId) {
142 : Position[] storage positions = userPositions[msg.sender];
143 : Position storage position;
144 : uint256 posIndex;
145 : bool found = false;
146 :
147 : for (uint256 i = 0 ; i < positions.length; i++) {
148 : if (positions[i].positionId == positionId) {
149 : position = positions[i];
150 : posIndex = i;
151 : found = true;
152 : break;
153 : }
154 : }
155 :
156 : if (!found) revert PositionNotFound();
157 :
158 : position = positions[posIndex];
```
```
159 : if (position.isUnstaked) revert PositionNotFound();
160 : require(
161 : block.timestamp + TIME_TOLERANCE >= position.stakedAt + position.lockPeriod,
162 : "Still locked"
163 : );
164 :
165 : uint256 reward = _updateReward(msg.sender, posIndex);
```
```
351 : function _updateReward(
352 : address _staker,
353 : uint256 _positionIndex
354 : ) internal returns (uint256 reward) {
355 : Position storage position = userPositions[_staker][_positionIndex];
356 : if (position.isUnstaked) return 0 ;
357 :
358 : uint256 timeElapsed = block.timestamp - position.lastRewardAt;
359 : if (timeElapsed == 0 ) return 0 ;
360 : uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);
```
**Description**

*** **:** The **stake()** function creates a new staking position with any period:


```
function stake(
uint256 lockPeriod
) external payable nonReentrant whenNotPaused notBlacklisted returns (uint256) {
...
Position memory newPosition = Position({
positionId: positionId,
amount: amount,
lockPeriod: lockPeriod,//@here
stakedAt: block.timestamp,
lastRewardAt: block.timestamp,
isUnstaked: false
});
```
The **unstake()** function only unlocks a staking position within availabe periods, the **unstake()** function calls the

```
_updateReward() function, then calls the validateAndGetRate() function that requires the period should be in an
```
array of available options:

```
function unstake(
uint256 positionId
) external override nonReentrant validPosition(positionId) {
..
uint256 reward = _updateReward(msg.sender, posIndex);//@here
..
}
```
```
function _updateReward(
address _staker,
uint256 _positionIndex
) internal returns (uint256 reward) {
..
uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);//@here
..
}
```
```
//StakingLib.sol
function validateAndGetRate(
uint256 lockPeriod,
IStaking.LockOption[] memory options
) public pure returns (uint256 rate) {
for (uint256 i = 0 ; i < options.length; i++) {
if (options[i].period == lockPeriod) {
return options[i].rewardRate;
}
}
revert InvalidPeriod();//@here
}
```

The availalbe periods are 180 days and 365 days, which is specified in the **__StakingStorage_init()** function:

```
// Set up initial staking options
lockOptions.push(IStaking.LockOption({
period: 180 days, // 6-month lock period
rewardRate: 700 // 7% annual reward rate
}));
```
```
lockOptions.push(IStaking.LockOption({
period: 365 days, // 1-year lock period
rewardRate: 1500 // 15% annual reward rate
}));
```
If the user stake assets with a period of one month, it definitely fails when the user unstake the position due to

one month is not an avaialbe periods, which results in the assets of the user being locked.

**Recommendation**

*** **:** Consider checking if the period is availabe when staking.

**Client Response**

client response : Mitigated.

Regarding the staking period validation in stake() function:

Users can check supported staking periods through lockOptions

Position struct and validPosition modifier ensure the basic logic security

This is a design issue that can be optimized through upfront validation, not a severe logical vulnerability


## HSS-3Incorrect Variable Usage

```
Category Severity Client Response Contributor
```
```
Logical Medium Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L92-L
code/contracts/staking.sol#L
code/contracts/staking.sol#L432-L
```
### 92 : /**

```
93: * @dev Creates a new staking position
94: * @param lockPeriod Duration for which tokens will be locked
95: * @return uint256 ID of the newly created position
96: */
97 : function stake(
98 : uint256 lockPeriod
99 : ) external payable nonReentrant whenNotPaused notBlacklisted returns (uint256) {
100 : console.log("Current time:", block.timestamp);
101 : console.log("Stake end time:", stakeEndTime);
102 :
103 : require(block.timestamp < stakeEndTime, "Staking period has ended");
104 :
105 : uint256 amount = msg.value;
106 : amount = StakingLib.validateAndFormatAmount(amount, minStakeAmount);
107 :
108 : if (historicalTotalStaked + amount > maxTotalStake) revert MaxTotalStakeExceeded();
109 :
110 : uint256 positionId = nextPositionId++;
111 : Position memory newPosition = Position({
```
```
112 : positionId: positionId,
113 : amount: amount,
114 : lockPeriod: lockPeriod,
115 : stakedAt: block.timestamp,
116 : lastRewardAt: block.timestamp,
117 : isUnstaked: false
118 : });
119 :
120 : userPositions[msg.sender].push(newPosition);
121 : userPositionCount[msg.sender]++;
122 : positionOwner[positionId] = msg.sender;
123 : userTotalStaked[msg.sender] += amount;
124 : totalStaked += amount;
125 :
126 : historicalTotalStaked += amount;
127 :
128 : emit PositionCreated(
129 : msg.sender,
130 : positionId,
131 : amount,
```

132 : lockPeriod,
133 : block.timestamp
134 : );
135 :
136 : return positionId;
137 : }
138 :
139 : function unstake(
140 : uint256 positionId
141 : ) external override nonReentrant validPosition(positionId) {
142 : Position[] storage positions = userPositions[msg.sender];
143 : Position storage position;
144 : uint256 posIndex;
145 : bool found = false;
146 :
147 : for (uint256 i = 0 ; i < positions.length; i++) {
148 : if (positions[i].positionId == positionId) {
149 : position = positions[i];
150 : posIndex = i;
151 : found = true;

152 : break;
153 : }
154 : }
155 :
156 : if (!found) revert PositionNotFound();
157 :
158 : position = positions[posIndex];
159 : if (position.isUnstaked) revert PositionNotFound();
160 : require(
161 : block.timestamp + TIME_TOLERANCE >= position.stakedAt + position.lockPeriod,
162 : "Still locked"
163 : );
164 :
165 : uint256 reward = _updateReward(msg.sender, posIndex);
166 : uint256 amount = position.amount;
167 : uint256 totalPayout = amount + reward;
168 :
169 : position.isUnstaked = true;
170 : userTotalStaked[msg.sender] -= amount;
171 : totalStaked -= amount;

### 172 :

173 : emit RewardClaimed(msg.sender, positionId, reward, block.timestamp);
174 : emit PositionUnstaked(msg.sender, positionId, amount, block.timestamp);
175 :
176 : (bool success, ) = msg.sender.call{value: totalPayout}("");
177 : require(success, "Transfer failed");
178 : }

108 : if (historicalTotalStaked + amount > maxTotalStake) revert MaxTotalStakeExceeded();


```
432 : function getStakingProgress() external view returns (
433 : uint256 total,
434 : uint256 current,
435 : uint256 remaining,
436 : uint256 progressPercentage
437 : ) {
438 : total = maxTotalStake;
439 : current = totalStaked;
440 : remaining = totalStaked >= maxTotalStake? 0 : maxTotalStake - totalStaked;
441 : progressPercentage = (current * 10000 ) / total;
442 : return (total, current, remaining, progressPercentage);
443 : }
```
**Description**

*** **:** State **historicalTotalStaked** represents the total amount staked throughout the contract's history,

regardless of whether tokens have been unstaked. State **totalStaked** should accurately reflect the current total

amount of staked tokens, considering both staked and unstaked tokens. If the **historicalTotalStaked** at some

point in the exceeded **maxTotalStake** , even if the current **totalStaked** is below the limit, the if condition would

always revert. This is because **historicalTotalStaked** is a cumulative value that doesn't decrease.

In addition, the following function demonstrates why **totalStaked** should be used, as this function represents

the remaining amount that can be staked.

```
function remainingStakeCapacity() external view returns (uint256) {
if (totalStaked >= maxTotalStake) {
return 0 ;
}
return maxTotalStake - totalStaked;
}
```
*** **:** The **progressPercentage** calculation in the **getStakingProgress** function has a logical flaw. The issue arises

because **maxTotalStake** can only increase, while **totalStaked** can decrease due to **unstake**. Additionally, **historic**

**alTotalStaked** is also only increasing, which further complicates the calculation. Consider following case:

1. **Initial State:**

```
maxTotalStake = 100
historicalTotalStaked = 0
totalStaked = 0
```
2. **User Stakes 100:**

```
historicalTotalStaked = 100
totalStaked = 100
progressPercentage = ( 100 * 10000 ) / 100 = 100 %
```
3. **User Unstakes 100:**


```
historicalTotalStaked = 100 (remains unchanged)
totalStaked = 0
progressPercentage = ( 0 * 10000 ) / 100 = 0 %
```
4. **User Attempts to Stake Again:**
    The staking fails because **historicalTotalStaked + amount > maxTotalStake** (100 + 100 > 100).

The **progressPercentage** remains at 0%, even though the contract is effectively "full" due to the cumulative

nature of **historicalTotalStaked**.

**Recommendation**

*** **:** Replace **historicalTotalStaked** with **totalStaked** in the if condition.

*** **:** Replace **historicalTotalStaked** with **totalStaked** in the if condition.

**Client Response**

client response : Fixed.


## HSS-4Update an existing lockOptions would result in assets being locked

## being locked

```
Category Severity Client Response Contributor
```
```
Privilege Related Low Acknowledged ***
```
**Code Reference**

```
code/contracts/libraries/StakingLib.sol#L183-L192
```
```
183 : function validateAndGetRate(
184 : uint256 lockPeriod,
185 : IStaking.LockOption[] memory options
186 : ) public pure returns (uint256 rate) {
187 : for (uint256 i = 0 ; i < options.length; i++) {
188 : if (options[i].period == lockPeriod) {
189 : return options[i].rewardRate;
190 : }
191 : }
192 : revert InvalidPeriod();
```
```
code/contracts/staking.sol#L139-L165
code/contracts/staking.sol#L277-L285
code/contracts/staking.sol#L351-L360
```
```
139 : function unstake(
140 : uint256 positionId
141 : ) external override nonReentrant validPosition(positionId) {
142 : Position[] storage positions = userPositions[msg.sender];
143 : Position storage position;
144 : uint256 posIndex;
145 : bool found = false;
146 :
147 : for (uint256 i = 0 ; i < positions.length; i++) {
148 : if (positions[i].positionId == positionId) {
149 : position = positions[i];
150 : posIndex = i;
151 : found = true;
152 : break;
153 : }
154 : }
155 :
156 : if (!found) revert PositionNotFound();
157 :
158 : position = positions[posIndex];
```
```
159 : if (position.isUnstaked) revert PositionNotFound();
160 : require(
161 : block.timestamp + TIME_TOLERANCE >= position.stakedAt + position.lockPeriod,
162 : "Still locked"
163 : );
164 :
165 : uint256 reward = _updateReward(msg.sender, posIndex);
```

```
277 : function updateLockOption(
278 : uint256 index,
279 : uint256 newPeriod,
280 : uint256 newRate
281 : ) external onlyAdmin {
282 : require(index < lockOptions.length, "Invalid index");
283 : require(StakingLib.isValidLockOption(newPeriod, newRate), "Invalid lock option");
284 :
285 : lockOptions[index].period = newPeriod;
```
```
351 : function _updateReward(
352 : address _staker,
353 : uint256 _positionIndex
354 : ) internal returns (uint256 reward) {
355 : Position storage position = userPositions[_staker][_positionIndex];
356 : if (position.isUnstaked) return 0 ;
357 :
358 : uint256 timeElapsed = block.timestamp - position.lastRewardAt;
359 : if (timeElapsed == 0 ) return 0 ;
360 : uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);
```
**Description**

*** **:** The **updateLockOption()** function allows the admin to update an existing **lockOptions** :

```
function updateLockOption(
uint256 index,
uint256 newPeriod,
uint256 newRate
) external onlyAdmin {
..
```
```
lockOptions[index].period = newPeriod;//@here
```
Taking the below case into account:

```
If lockOptions[0].period is 180 days.
```
```
Users create staking positions with a valid period, like 180 days.
```
```
The admin update the existing lockOptions[0].period to 90 days with the updateLockOption() function
```
```
Users who create staking period with 180 days fail to unstake, due to the unstake() function will check if
the period is valid or not and the period of 180 days is not valid after the admin's update.
```
The unstake function only unlocks a staking position within availabe periods, the **unstake()** function calls the **_u**

**pdateReward()** function, then calls the **validateAndGetRate()** function that requires the period should be in an

array of available options:


```
function unstake(
uint256 positionId
) external override nonReentrant validPosition(positionId) {
..
uint256 reward = _updateReward(msg.sender, posIndex);//@here
..
}
```
```
function _updateReward(
address _staker,
uint256 _positionIndex
) internal returns (uint256 reward) {
..
uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);//@here
..
}
```
```
//StakingLib.sol
function validateAndGetRate(
uint256 lockPeriod,
IStaking.LockOption[] memory options
) public pure returns (uint256 rate) {
for (uint256 i = 0 ; i < options.length; i++) {
if (options[i].period == lockPeriod) {
return options[i].rewardRate;
}
}
revert InvalidPeriod();//@here
}
```
**Recommendation**

*** **:** Update the existing **lockOptions** is dangerous for the existing staking positions. It is better to only update

an unused option.

**Client Response**

client response : Acknowledged.


## HSS-5Reward calculation is incomplete when the unstake time is unlocked.

## time is unlocked.

```
Category Severity Client Response Contributor
```
```
Logical Low Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L351-L368
```
```
351 : function _updateReward(
352 : address _staker,
353 : uint256 _positionIndex
354 : ) internal returns (uint256 reward) {
355 : Position storage position = userPositions[_staker][_positionIndex];
356 : if (position.isUnstaked) return 0 ;
357 :
358 : uint256 timeElapsed = block.timestamp - position.lastRewardAt;
359 : if (timeElapsed == 0 ) return 0 ;
360 : uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);
361 : reward = StakingLib.calculateReward(
362 : position.amount,
363 : timeElapsed,
364 : rewardRate
365 : );
366 :
367 : position.lastRewardAt = block.timestamp;
368 : }
```
**Description**

*** **:** The calculation of the **timeElapsed** variable in the **_updateReward** function is incorrect.

1. The user stakes 10,000 tokens on 2025-01-01 with a period of 180 days and a rate of 3000 (30%).
2. If the user unstakes on 2025-09-28(270 days), they will receive 4,500 reward tokens along with the original
    10,000 tokens.

Between 2025-06-30(180 days) and 2025-09-28(270 days), the user's staking period has already ended, and the

staking is unlocked. During this period, the rate could potentially change to a lower value.

**Recommendation**

*** **: Method 1 :**

Staking has not reward when unlocked.


```
delete :
uint256 timeElapsed = currentTime - positions[i].lastRewardAt;
add:
// It is better to wrap an internal function.
uint256 timeElapsedTemp = block.timestamp - position.lastRewardAt;
uint256 maxPeriod = position.lockPeriod * 24 * 60 * 60 ;
uint256 timeElapsed = timeElapsedTemp < maxPeriod? timeElapsedTemp : maxPeriod;
```
**Method 2 :**

Please consider introducing a **Demand Deposit**.

Use a lowest rate to claculate instrest for unlocked days.

**Client Response**

client response : Fixed.


## HSS-6Missing Reward Calculation in emergencyWithdraw() Function

## Function

```
Category Severity Client Response Contributor
```
```
Logical Low Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L321-L349
```
```
321 : function emergencyWithdraw(uint256 positionId) external nonReentrant {
322 : require(emergencyMode, "Not in emergency mode");
323 : require(positionOwner[positionId] == msg.sender, "Not position owner");
324 :
325 : Position[] storage positions = userPositions[msg.sender];
326 : Position storage position;
327 : uint256 posIndex;
328 : bool found = false;
329 :
330 : for (uint256 i = 0 ; i < positions.length; i++) {
331 : if (positions[i].positionId == positionId && !positions[i].isUnstaked) {
332 : position = positions[i];
333 : posIndex = i;
334 : found = true;
335 : break;
336 : }
337 : }
338 :
339 : require(found, "Position not found or already unstaked");
340 :
```
```
341 : uint256 amount = positions[posIndex].amount;
342 : positions[posIndex].isUnstaked = true;
343 : userTotalStaked[msg.sender] -= amount;
344 : totalStaked -= amount;
345 :
346 : (bool success, ) = msg.sender.call{value: amount}("");
347 : require(success, "Emergency withdraw failed");
348 : emit EmergencyWithdrawn(msg.sender, positionId, amount, block.timestamp);
349 : }
```
**Description**

*** **:** The emergencyWithdraw() function in the Layer2Staking contract does not calculate and distribute accrued

rewards to the user before withdrawing the staked amount.

This results in users losing any accrued rewards when performing an emergency withdrawal.

**Recommendation**

*** **:** Modify emergencyWithdraw():

Calculate Rewards: Before withdrawing the staked amount, call the _updateReward() function for the specified

position to calculate any accrued rewards.

Distribute Rewards: Transfer the calculated rewards to the user along with the staked amount.


**Client Response**

client response : Fixed.


## HSS-7Insufficient Reward Pool Protection Could Lead to Last User Fund Loss

## User Fund Loss

```
Category Severity Client Response Contributor
```
```
Logical Low Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L397-L399
```
```
397 : receive() external payable {
398 : emit Received(msg.sender, msg.value);
399 : }
```
**Description**

*** **:** The staking contract's reward distribution mechanism relies on direct ETH transfers to fund the reward pool.

However, there's no systematic validation or guarantee that the reward pool will maintain sufficient funds to

cover all potential reward claims. This creates a critical vulnerability where users who stake their funds might not

receive their promised rewards/or even get their money back if the pool becomes depleted.

The current implementation in StakingLib.sol calculates rewards using calculateReward() function but doesn't

verify the contract's ability to pay these rewards:

```
function calculateReward(
uint256 amount,
uint256 timeElapsed,
uint256 rewardRate
) public pure returns (uint256 reward) {
// ... input validation ...
```
```
// Calculates reward without checking available funds
reward = (amount * rewardRatio) / PRECISION;
require(reward <= amount * rewardRate / BASIS_POINTS, "Reward overflow");
```
```
return reward;
}
```
This creates several risks:

1. Users who stake later in the contract's lifecycle may not receive their promised rewards/or their own funds if
    earlier users have depleted the pool
2. The contract could promise rewards it cannot fulfill, leading to a "last man standing" problem
3. There's no mechanism to ensure rewards are properly funded before new stakes are accepted

**Recommendation**

*** **:** Consider moving to a token-based reward system where rewards must be pre-committed before accepting

stakes, ensuring guaranteed reward availability. Or do a reward pool monitoring.


**Client Response**

client response : Fixed.


## HSS-8Instable rate risk, when admin update staking rate

```
Category Severity Client Response Contributor
```
```
Logical Low Fixed ***
```
**Code Reference**

```
code/contracts/libraries/StakingLib.sol#L183-L193
```
```
183 : function validateAndGetRate(
184 : uint256 lockPeriod,
185 : IStaking.LockOption[] memory options
186 : ) public pure returns (uint256 rate) {
187 : for (uint256 i = 0 ; i < options.length; i++) {
188 : if (options[i].period == lockPeriod) {
189 : return options[i].rewardRate;
190 : }
191 : }
192 : revert InvalidPeriod();
193 : }
```
```
code/contracts/staking.sol#L197-L198
code/contracts/staking.sol#L277-L287
code/contracts/staking.sol#L351-L368
```
```
197 : uint256 reward = _updateReward(msg.sender, posIndex);
198 : if (reward == 0 ) revert NoReward();
```
```
277 : function updateLockOption(
278 : uint256 index,
279 : uint256 newPeriod,
280 : uint256 newRate
281 : ) external onlyAdmin {
282 : require(index < lockOptions.length, "Invalid index");
283 : require(StakingLib.isValidLockOption(newPeriod, newRate), "Invalid lock option");
284 :
285 : lockOptions[index].period = newPeriod;
286 : lockOptions[index].rewardRate = newRate;
287 : }
```

```
351 : function _updateReward(
352 : address _staker,
353 : uint256 _positionIndex
354 : ) internal returns (uint256 reward) {
355 : Position storage position = userPositions[_staker][_positionIndex];
356 : if (position.isUnstaked) return 0 ;
357 :
358 : uint256 timeElapsed = block.timestamp - position.lastRewardAt;
359 : if (timeElapsed == 0 ) return 0 ;
360 : uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);
361 : reward = StakingLib.calculateReward(
362 : position.amount,
363 : timeElapsed,
364 : rewardRate
365 : );
366 :
367 : position.lastRewardAt = block.timestamp;
368 : }
```
**Description**

*** **:** The reward will be updated immediately when the admin calls **updateLockOption**.

Steps:

1. The user stakes 10,000 tokens on 2024-01-01 for a period of 366 days, with a reward rate of 100 (1%) at the
    time of staking.
2. On 2025-01-01, the admin changes the reward rate for the 366-day period to 1,000 (10%).
3. The user unstakes on 2025-01-02, i.e., after the admin changes the rate. As a result, the user will receive
    1,000 tokens as a reward along with the original 10,000 tokens.
4. The user ends up receiving 900 additional reward tokens. However, the user expects to receive only 100
    reward tokens.

*** **:** The current staking implementation is vulnerable to front-running attacks and potential reward losses due

to how rewards are calculated and the ability to update lock options. The issues manifest in two key ways:

First, users can front-run with **claimReward** transaction when they detect an upcoming reward rate decrease. By

claiming rewards just before the rate change, they can maximize their returns at the old (higher) rate. This

creates an unfair advantage for users who can monitor and react to pending transactions.

2. If the reward rate is decreased, users who have already staked will suffer from reduced rewards for the whole

lock period, despite having staked under the promise of a higher rate. This breaks the principle of fair contract

terms and could be seen as a breach of the implicit agreement with stakers.

```
function updateLockOption(
uint256 index,
uint256 newPeriod,
uint256 newRate
) external onlyAdmin {
require(index < lockOptions.length, "Invalid index");
require(StakingLib.isValidLockOption(newPeriod, newRate), "Invalid lock option");
```
```
lockOptions[index].period = newPeriod;
lockOptions[index].rewardRate = newRate;
}
```

**Recommendation**

*** **:** 1. add a table reward rate in posistion

```
struct Position {
uint256 positionId; // Position ID
uint256 amount; // Staked amount
uint256 lockPeriod; // Lock period in seconds
uint256 stakedAt; // Timestamp when staked
uint256 lastRewardAt; // Last reward claim timestamp
bool isUnstaked; // Whether position is unstaked
// TODO: +++++++++++++++++++++++++++++++++++++++++
uint256 rewardRate; // TODO: add a stable rate for calculating rewards
}
```
2. get reward rate using position's field

function _updateReward(

address _staker,

uint256 _positionIndex

) internal returns (uint256 reward) {

Position storage position = userPositions[_staker][_positionIndex];

if (position.isUnstaked) return 0;

uint256 timeElapsed = block.timestamp - position.lastRewardAt;

if (timeElapsed == 0) return 0;

// TODO: +++++++++---------+++++++++

uint256 rewardRate = position.rewardRate; // TODO: here

reward = StakingLib.calculateReward(

position.amount,

timeElapsed,

rewardRate

);

position.lastRewardAt = block.timestamp;

}

3. pendingReward function


```
function pendingReward(
uint256 positionId
) external view override returns (uint256) {
Position[] memory positions = userPositions[msg.sender];
```
```
for (uint256 i = 0 ; i < positions.length; i++) {
Position memory position = positions[i];
if (position.positionId == positionId && !position.isUnstaked) {
uint256 timeElapsed = block.timestamp - position.lastRewardAt;
uint256 rewardRate = position.rewardRate; // TODO: here
return StakingLib.calculateReward(
position.amount,
timeElapsed,
rewardRate
);
}
}
```
```
return 0 ;
}
```
4. calculateBatchRewards function

```
function calculateBatchRewards(
IStaking.Position[] memory positions,
uint256 currentTime,
IStaking.LockOption[] memory options
) public pure returns (uint256[] memory rewards) {
rewards = new uint256[](positions.length);
```
```
for (uint256 i = 0 ; i < positions.length; i++) {
if (!positions[i].isUnstaked) {
uint256 timeElapsed = currentTime - positions[i].lastRewardAt;
uint256 rate = positions[i].rewardRate; // TODO: here
rewards[i] = calculateReward(
positions[i].amount,
timeElapsed,
rate
);
}
}
```
```
return rewards;
}
```

*** **:** To address these vulnerabilities, consider implementing the following changes: store the reward rate with

each staking position at the time of staking:

**Client Response**

client response : Fixed.


## HSS-9Inconsistent Emergency Withdrawal Mechanism Allows Unfair Reward Distribution

## Unfair Reward Distribution

```
Category Severity Client Response Contributor
```
```
Logical Low Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L180-L183
code/contracts/staking.sol#L341-L342
```
```
180 : function claimReward(
181 : uint256 positionId
182 : ) external override nonReentrant whenNotPaused validPosition(positionId) returns (uint256) {
183 : Position[] storage positions = userPositions[msg.sender];
```
```
341 : uint256 amount = positions[posIndex].amount;
342 : positions[posIndex].isUnstaked = true;
```
**Description**

*** **:** The current implementation of the emergency withdrawal system contains a critical inconsistency in how

rewards are handled during emergency situations.

While **emergencyWithdraw** is designed to allow users to quickly withdraw their staked amounts without rewards

during emergency scenarios, the system doesn't prevent users from calling **claimReward** before executing **emerge**

**ncyWithdraw**.

This creates an unfair advantage where sophisticated users who monitor the blockchain can claim their rewards

before initiating an emergency withdrawal, while less active users might miss out on their earned rewards.

This behavior undermines the intended fairness of the emergency withdrawal mechanism and could lead to:

1. Unequal distribution of rewards during emergency situations
2. Potential front-running opportunities where users monitor for emergency signals and quickly claim rewards
3. When **rewards** are not intended, user **A** could claim the money as reward which should belong to user **B**.


```
function calculateReward(
uint256 amount,
uint256 timeElapsed,
uint256 rewardRate
) public pure returns (uint256 reward) {
// Early return for zero values
if (amount == 0 || timeElapsed == 0 || rewardRate == 0 ) {
return 0 ;
}
```
```
// ... reward calculation logic ...
```
```
return reward;
}
```
**Recommendation**

*** **:** Use the emergencyMode flag that automatically revert for reward accrual.

**Client Response**

client response : Fixed.


## HSS-10Using unchecked arithmetic in for loops

```
Category Severity Client Response Contributor
```
```
Logical Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L467
code/contracts/staking.sol#L480
```
```
467 : require(users.length <= 100 , "Batch too large"); // 防止 gas 限制
```
```
480 : for (uint256 i = 0 ; i < users.length; i++) {
```
**Description**

*** **:** Using **unchecked** increments can save gas by bypassing the built-in overflow checks. This can save 30-40 gas

per iteration. It is recommended to use unchecked increments when overflow is not possible.

**Recommendation**

*** **:** use it

```
function removeFromWhitelistBatch(address[] calldata users) external onlyAdmin {
require(users.length <= 100 , "Batch too large"); // 防止 gas 限制
for (uint256 i = 0 ; i < users.length; ) {
whitelisted[users[i]] = false;
emit WhitelistStatusChanged(users[i], false);
unchecked { ++i; }
}
}
```
**Client Response**

client response : Fixed.


## HSS-11Use of Hardhat Console in Production Code

```
Category Severity Client Response Contributor
```
```
Logical Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L97-L101
```
```
97 : function stake(
98 : uint256 lockPeriod
99 : ) external payable nonReentrant whenNotPaused notBlacklisted returns (uint256) {
100 : console.log("Current time:", block.timestamp);
101 : console.log("Stake end time:", stakeEndTime);
```
**Description**

*** **:** In **Layer2Staking** contract, the **stake** function is using **console.log** :

```
function stake(
uint256 lockPeriod
) external payable nonReentrant whenNotPaused notBlacklisted returns (uint256) {
console.log("Current time:", block.timestamp);
console.log("Stake end time:", stakeEndTime);
```
```
console.log is a debugging tool provided by Hardhat, used to output log information during local development
```
and testing. However, it should not appear in production contract code for the following reasons:

1. **console.log** is a Hardhat-specific feature and relies on Hardhat's runtime environment. If you deploy the
    contract to Ethereum mainnet or other EVM-compatible chains (e.g., Polygon, BSC, etc.), **console.log** will
    not work because these chains do not support Hardhat's debugging tools. During deployment, the Solidity
    compiler will attempt to parse **console.log** , but since it is not a standard Solidity feature, it may result in
    compilation errors or deployment failures.
2. Even if **console.log** works on some chains (e.g., local testnets), it will add additional gas costs. In a
    production environment, every transaction incurs gas fees, and any unnecessary operations should be
    avoided.

**Recommendation**

*** **:** Consider removing all **console.log** statements.

**Client Response**

client response : Fixed.


## HSS-12Unused/Ineffective Whitelist Mode

```
Category Severity Client Response Contributor
```
```
Logical Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L88-L89
```
```
88 : onlyWhitelistCanStake = true; // Start in whitelist-only mode
89 : historicalTotalStaked = 0 ; // Initialize historical total
```
**Description**

*** **:** The staking contract implements a whitelist system with a boolean flag **onlyWhitelistCanStake** that is

initialized to **true** in both the **StakingStorage** contract and the **Layer2Staking** contract's initialize() function.

```
onlyWhitelistCanStake = true; // Start in whitelist-only mode
```
This flag is intended to restrict staking operations to whitelisted users only. However, despite setting this flag

and maintaining whitelist-related functions (like addToWhitelist, removeFromWhitelist),, there is no actual

enforcement of such restriction in the staking logic.


```
function addToWhitelistBatch(address[] calldata users) external onlyAdmin {
uint256 length = users.length;
require(length <= 100 , "Batch too large");
for (uint256 i = 0 ; i < length;) {
whitelisted[users[i]] = true;
emit WhitelistStatusChanged(users[i], true);
unchecked { ++i; }
}
}
```
```
function removeFromWhitelistBatch(address[] calldata users) external onlyAdmin {
require(users.length <= 100 , "Batch too large"); // 防止 gas 限制
for (uint256 i = 0 ; i < users.length; i++) {
whitelisted[users[i]] = false;
emit WhitelistStatusChanged(users[i], false);
}
}
```
```
function checkWhitelistBatch(address[] calldata users)
external
view
returns (bool[] memory results)
{
results = new bool[](users.length);
for (uint256 i = 0 ; i < users.length; i++) {
results[i] = whitelisted[users[i]];
}
return results;
}
```
The stake() function, which is the main entry point for staking operations, lacks any validation against the **onlyWh**

**itelistCanStake** flag and the user's **whitelist** status. This means that even though the contract maintains a

whitelist system, any user can stake tokens regardless of their whitelist status, rendering the entire whitelist

mechanism ineffective.

```
function stake(
uint256 lockPeriod
) external payable nonReentrant whenNotPaused notBlacklisted returns (uint256) {
// Missing check for whitelist status
// Should have something like:
// if (onlyWhitelistCanStake) {
// require(whitelisted[msg.sender], "Not whitelisted");
// }
```
```
require(block.timestamp < stakeEndTime, "Staking period has ended");
// ... rest of the function
}
```

**Recommendation**

*** **:** 1. Add a whitelist validation modifier

2. Apply the modifier to the stake function.

**Client Response**

client response : Fixed.


## HSS-13Unused code

```
Category Severity Client Response Contributor
```
```
Code Style Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L75-L90
code/contracts/staking.sol#L89
```
### 75 : /**

```
76: * @dev Initializes the contract with default settings
77: * Sets up initial staking parameters and enables whitelist-only mode
78: */
79 : function initialize() external initializer {
80 : __ReentrancyGuard_init();
81 : __Pausable_init();
82 : __Ownable_init(msg.sender);
83 : __UUPSUpgradeable_init();
84 : __StakingStorage_init(msg.sender);
85 :
86 : // Set initial values
87 : stakeEndTime = type(uint256).max; // No initial end time
88 : onlyWhitelistCanStake = true; // Start in whitelist-only mode
89 : historicalTotalStaked = 0 ; // Initialize historical total
90 : }
```
```
89 : historicalTotalStaked = 0 ; // Initialize historical total
```
```
code/contracts/StakingStorage.sol#L17-L19
code/contracts/StakingStorage.sol#L36-L37
code/contracts/StakingStorage.sol#L52-L53
code/contracts/StakingStorage.sol#L59-L88
```
```
17 : // Constants for calculations and configurations
18 : uint256 internal constant BASIS_POINTS = 10000 ; // Base for percentage calculations (100% = 10000)
19 : uint256 internal constant SECONDS_PER_YEAR = 365 days; // Number of seconds in a year
```
```
36 : address public pendingAdmin; // Pending admin for two-step transfer
```
```
52 : // Reentrancy guard
53 : bool internal _notEntered;
```

```
59 : function __StakingStorage_init(
60 : address _admin
61 : ) internal onlyInitializing {
62 : require(_admin != address( 0 ), "StakingStorage: zero admin");
63 :
64 : // Initialize basic parameters
65 : admin = _admin;
66 : _notEntered = true;
67 : minStakeAmount = 100 * 10 **HSK_DECIMALS;
68 : nextPositionId = 1 ;
69 :
70 : // Set up initial staking options
71 : lockOptions.push(IStaking.LockOption({
72 : period: 180 days, // 6-month lock period
73 : rewardRate: 700 // 7% annual reward rate
74 : }));
75 :
76 : lockOptions.push(IStaking.LockOption({
77 : period: 365 days, // 1-year lock period
78 : rewardRate: 1500 // 15% annual reward rate
```
### 79 : }));

### 80 :

```
81 : // Set maximum total stake limit
82 : maxTotalStake = 10_000 * 10 **HSK_DECIMALS;
83 :
84 : // Initialize timing and access controls
85 : stakeEndTime = type(uint256).max; // No initial end time
86 : onlyWhitelistCanStake = true; // Start in whitelist-only mode
87 : }
88 : }
```
**Description**

*** **:** The **StakingStorage** contract contains several state variables that are declared but never/not actually utilized

throughout the contract's implementation, leading to unnecessary gas costs during deployment and potential

confusion for developers. Specifically:

1. **ASIS_POINTS** (10000) : same variable defined in **StakingLib**
2. **SECONDS_PER_YEAR** (365 days) : same variable defined in **StakingLib**
3. **pendingAdmin** - This variable suggests a two-step admin transfer pattern, but there are no functions
    implementing this pattern (like transferAdmin or acceptAdmin).
4. **rewardReserve** - Declared for future reward distribution but lacks any implementation for managing or
    distributing rewards.
5. **_notEntered** - While initialized to true in the constructor, suggesting a reentrancy guard, there are no
    modifiers or functions using this variable for reentrancy protection.

*** **:** The line historicalTotalStaked = 0; within the initialize() function is unnecessary.

State variables in Solidity are automatically initialized to their default values. Since historicalTotalStaked is

declared as uint256, its default value is already 0.

*** **:** In **Layer2Staking** contract, the **initialize** function will call **__StakingStorage_init** to set up initial staking

parameters:


```
function initialize() external initializer {
__ReentrancyGuard_init();
__Pausable_init();
__Ownable_init(msg.sender);
__UUPSUpgradeable_init();
__StakingStorage_init(msg.sender);
```
```
// Set initial values
stakeEndTime = type(uint256).max; // No initial end time
onlyWhitelistCanStake = true; // Start in whitelist-only mode
historicalTotalStaked = 0 ; // Initialize historical total
}
```
In the **__StakingStorage_init** function (in the **StakingStorage** contract), **stakeEndTime** and **onlyWhitelistCanStake**

are initialized as follows:

```
stakeEndTime = type(uint256).max; // No initial end time
onlyWhitelistCanStake = true; // Start in whitelist-only mode
```
However, in the **initialize** function (in the **Layer2Staking** contract), these variables are initialized again:

```
stakeEndTime = type(uint256).max; // No initial end time
onlyWhitelistCanStake = true; // Start in whitelist-only mode
```
The **initialize** function in **Layer2Staking** calls **__StakingStorage_init** , which already sets these variables.

Therefore, setting them again in the **initialize** function is unnecessary and redundant.

This redundancy doesn't affect the functionality of the contract, but it does result in unnecessary gas

consumption during deployment.

**Recommendation**

*** **:** 1. Remove unused variables to optimize gas costs.

2. If these variables are intended for future use, it is required to **Document their intended purpose with detailed co**

**mments** and **Implement the related functionality (e.g., two-step admin transfer for pendingAdmin)**

*** **:** Remove the line historicalTotalStaked = 0; from the initialize() function.

*** **:** To fix this issue, you should remove the redundant initialization from the **initialize** function in the **Layer2S**

**taking** contract.

**Client Response**

client response : Fixed.


## HSS-14Unnecessary Storage Writes in Whitelist Management Functions

## Functions

```
Category Severity Client Response Contributor
```
```
Gas Optimization Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L401-L409
code/contracts/staking.sol#L456-L472
```
```
401 : function addToWhitelist(address user) external onlyAdmin {
402 : whitelisted[user] = true;
403 : emit WhitelistStatusChanged(user, true);
404 : }
405 :
406 : function removeFromWhitelist(address user) external onlyAdmin {
407 : whitelisted[user] = false;
408 : emit WhitelistStatusChanged(user, false);
409 : }
```
```
456 : function addToWhitelistBatch(address[] calldata users) external onlyAdmin {
457 : uint256 length = users.length;
458 : require(length <= 100 , "Batch too large");
459 : for (uint256 i = 0 ; i < length;) {
460 : whitelisted[users[i]] = true;
461 : emit WhitelistStatusChanged(users[i], true);
462 : unchecked { ++i; }
463 : }
464 : }
465 :
466 : function removeFromWhitelistBatch(address[] calldata users) external onlyAdmin {
467 : require(users.length <= 100 , "Batch too large"); // 防止 gas 限制
468 : for (uint256 i = 0 ; i < users.length; i++) {
469 : whitelisted[users[i]] = false;
470 : emit WhitelistStatusChanged(users[i], false);
471 : }
472 : }
```
**Description**

*** **:** The addToWhitelist(), removeFromWhitelist(), addToWhitelistBatch() and removeFromWhitelistBatch()

functions unnecessarily write to **whitelisted[users[i]]** storage even if the user's whitelist status is already the

desired state.

**Recommendation**

*** **:** Before setting the whitelisted state, the function should check the current state and only perform the write

operation if the state needs to be changed.

**Client Response**

client response : Fixed.


## HSS-15Two-step ownership transfer

```
Category Severity Client Response Contributor
```
```
Logical Informational Acknowledged ***
```
**Code Reference**

```
code/contracts/staking.sol#L5
code/contracts/staking.sol#L28
code/contracts/staking.sol#L51-L55
```
```
5 : import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
```
```
28 : OwnableUpgradeable,
```
```
51 : // Access control modifiers
52 : modifier onlyAdmin() {
53 : if (msg.sender != admin) revert OnlyAdmin();
54 : _;
55 : }
```
```
code/contracts/StakingStorage.sol#L59-L68
```
```
59 : function __StakingStorage_init(
60 : address _admin
61 : ) internal onlyInitializing {
62 : require(_admin != address( 0 ), "StakingStorage: zero admin");
63 :
64 : // Initialize basic parameters
65 : admin = _admin;
66 : _notEntered = true;
67 : minStakeAmount = 100 * 10 **HSK_DECIMALS;
68 : nextPositionId = 1 ;
```
**Description**

*** **:** All contracts are inherited from OpenZeppelin’s OwnableUpgradable contract which enables the onlyOwner

role to transfer ownership to another address. It’s possible that the onlyOwner role mistakenly transfers

ownership to the wrong address, resulting in a loss of the onlyOwner role. The current ownership transfer

process involves the current owner calling Unlock.transferOwnership(). This function checks the new owner is

not the zero address and proceeds to write the new owner’s address into the owner’s state variable. If the

nominated EOA account is not a valid account, it is entirely possible the owner may accidentally transfer

ownership to an uncontrolled account, breaking all functions with the onlyOwner() modifier. Lack of two-step

procedure for critical operations leaves them error-prone

if the address is incorrect, the new address will take on the functionality of the new role immediately

*** **:** The **Layer2Staking** contract currently relies on a single **admin** address to manage critical functions, such as:

```
Upgrading the contract.
```
```
Changing staking parameters (e.g., minStakeAmount, maxTotalStake).
```
```
Managing the whitelist and blacklist.
```

```
Enabling emergency mode or pausing the contract.
```
The **admin** is set in **__StakingStorage_init** :

```
function __StakingStorage_init(
address _admin
) internal onlyInitializing {
require(_admin != address( 0 ), "StakingStorage: zero admin");
```
```
// Initialize basic parameters
admin = _admin;
```
Once set, it cannot be updated because there is no function to update the admin.

As a result, If the **admin** private key is compromised (e.g., through phishing, hacking, or social engineering), the

attacker could:

```
Upgrade the contract to introduce malicious code, such as draining user funds or disabling security
mechanisms.
```
```
Change staking parameters to manipulate rewards, lock periods, or other critical settings.
```
```
Pause the contract to prevent users from unstaking or claiming rewards.
```
```
Blacklist legitimate users or whitelist malicious addresses.
```
```
Enable emergency mode and withdraw funds directly.
```
This single point of failure makes the protocol vulnerable to catastrophic attacks, especially since the **admin**

address is often controlled by a single entity or a small team.

**Recommendation**

*** **:** It is recommended to implement a two-step owner replacement process. Instead of immediately replacing

the old owners, the function should first require new owners to confirm their ownership of the specified

addresses. Only after all new owners have successfully confirmed their ownership, should the final owner

replacement take place. This approach reduces the risk of a contract lock due to incorrect or inaccessible owner

addresses.

*** **:** Consider implementing a two-step process for transferring the admin role:

```
address public pendingAdmin;
```
```
function transferAdmin(address newAdmin) external onlyAdmin {
require(newAdmin != address( 0 ), "Invalid address");
pendingAdmin = newAdmin;
}
```
```
function acceptAdmin() external {
require(msg.sender == pendingAdmin, "Caller is not pending admin");
admin = pendingAdmin;
pendingAdmin = address( 0 );
}
```

**Client Response**

client response : Acknowledged.


## HSS-16Missing Events for Privileged Operations

```
Category Severity Client Response Contributor
```
```
Code Style Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L277-L307
```
```
277 : function updateLockOption(
278 : uint256 index,
279 : uint256 newPeriod,
280 : uint256 newRate
281 : ) external onlyAdmin {
282 : require(index < lockOptions.length, "Invalid index");
283 : require(StakingLib.isValidLockOption(newPeriod, newRate), "Invalid lock option");
284 :
285 : lockOptions[index].period = newPeriod;
286 : lockOptions[index].rewardRate = newRate;
287 : }
288 :
289 :
290 : function setMinStakeAmount(uint256 newAmount) external onlyAdmin {
291 : minStakeAmount = newAmount;
292 : }
293 :
294 :
295 : function addToBlacklist(address user) external onlyAdmin {
296 : blacklisted[user] = true;
```
### 297 : }

### 298 :

```
299 : function removeFromBlacklist(address user) external onlyAdmin {
300 : blacklisted[user] = false;
301 : }
302 :
303 :
304 : function enableEmergencyMode() external onlyAdmin {
305 : emergencyMode = true;
306 : }
```
**Description**

*** **:** Several privileged functions in the **Layer2Staking** contract that modify critical contract parameters or user

statuses do not emit events.


```
function updateLockOption(
uint256 index,
uint256 newPeriod,
uint256 newRate
) external onlyAdmin {
require(index < lockOptions.length, "Invalid index");
require(StakingLib.isValidLockOption(newPeriod, newRate), "Invalid lock option");
```
```
lockOptions[index].period = newPeriod;
lockOptions[index].rewardRate = newRate;
}
```
```
function setMinStakeAmount(uint256 newAmount) external onlyAdmin {
minStakeAmount = newAmount;
}
```
```
function addToBlacklist(address user) external onlyAdmin {
blacklisted[user] = true;
}
```
```
function removeFromBlacklist(address user) external onlyAdmin {
blacklisted[user] = false;
}
```
```
function enableEmergencyMode() external onlyAdmin {
emergencyMode = true;
}
```
This lack of event emission makes it difficult for users and monitoring systems to track important administrative

actions. This is bad for transparency.

**Recommendation**

*** **:** Add appropriate events for each privileged function.

**Client Response**

client response : Fixed.


## HSS-17Missing Emergency Mode Controls and Redundant Emergency System Implementation

## Emergency System Implementation

```
Category Severity Client Response Contributor
```
```
Logical Informational Acknowledged ***
```
**Code Reference**

```
code/contracts/staking.sol#L305
code/contracts/staking.sol#L322
```
```
305 : emergencyMode = true;
```
```
322 : require(emergencyMode, "Not in emergency mode");
```
**Description**

*** **:** The contract implements an emergency system through the **emergencyMode** flag, which is used exclusively for

the `emergencyWithdraw function. However, there are several issues with its implementation:

```
function enableEmergencyMode() external onlyAdmin {
emergencyMode = true;
}
```
```
function emergencyWithdraw(uint256 positionId) external nonReentrant {
require(emergencyMode, "Not in emergency mode");
...
}
```
1. The **emergencyMode** can only be enabled (true) through **enableEmergencyMode()** but lacks the ability to be
    disabled, making it a one-way switch. This could be problematic if the emergency situation is resolved and
    normal operations need to resume.
2. The emergency system appears redundant when compared to the existing Pausable functionality.

```
contract Layer2Staking is
IStaking,
StakingStorage,
ReentrancyGuardUpgradeable,
PausableUpgradeable,
OwnableUpgradeable,
UUPSUpgradeable
{
```
3. The emergencyMode flag is not considered in other critical functions like **stake** , **unstake** and **claimReward**.


```
function stake(uint256 lockPeriod) external payable nonReentrant whenNotPaused notBlacklisted returns (uint2
56 ) {
// ... can still stake even in emergencyMode
}
```
```
function claimReward(uint256 positionId) external nonReentrant whenNotPaused validPosition(positionId) retur
ns (uint256) {
// ... can still claim rewards even in emergencyMode
}
```
*** **:** The contract has an **emergencyMode** flag intended to handle critical situations, enabling users to withdraw

their staked funds through the **emergencyWithdraw** function. However, the contract does not enforce restrictions

on staking operations during emergency mode. Specifically, the **stake** function lacks a check to ensure that

staking is disallowed when the system is in emergency mode.

In this code, there is no validation to check if **emergencyMode** is active. As a result, users can continue to create

new staking positions and deposit funds even during emergency situations. This can complicate recovery efforts

or make it harder to halt system activity in response to vulnerabilities or attacks.

**Impact**

The primary impact is that allowing staking during emergency mode undermines the purpose of the **emergencyMo**

**de** flag, which is to secure the system and focus on recovering funds. Continuing to accept new stakes in an

emergency could lead to operational chaos, increased liability for the contract, and exposure to additional risks.

**Recommendation**

*** **:** Either consolidate the emergency handling into a single system using the existing **Pausable** functionality, or

properly implement the separate **emergencyMode**

*** **:** Introduce a **whenNotEmergency** modifier that explicitly disallows staking operations when **emergencyMode** is

active.

**Client Response**

client response : Acknowledged.


## HSS-18Mismatched Error

```
Category Severity Client Response Contributor
```
```
Logical Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L41
code/contracts/staking.sol#L159
```
```
41 : error AlreadyUnstaked();
```
```
159 : if (position.isUnstaked) revert PositionNotFound();
```
**Description**

*** **:** Mismatched error in unstake function, there is a checking position is unstaked.But it revert a

PositionNotFound error.

**Recommendation**

*** **:** Change PositionNotFound

```
159 : if (position.isUnstaked) revert PositionNotFound();
```
to AlreadyUnstaked

```
159 : if (position.isUnstaked) revert AlreadyUnstaked();
```
**Client Response**

client response : Fixed.


## HSS-19Lack of Reward Rate Validation in _updateReward

```
Category Severity Client Response Contributor
```
```
Logical Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L360
```
```
360 : uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);
```
**Description**

*** **:** In the **_updateReward** function, there's a call to StakingLib.validateAndGetRate which retrieves the reward rate

based on the **lockPeriod** of a position:

```
uint256 rewardRate = StakingLib.validateAndGetRate(position.lockPeriod, lockOptions);
```
However, there's no check to ensure that **rewardRate** returned is a valid or non-zero value before proceeding

with reward calculation. If **StakingLib.validateAndGetRate** fails to return a valid rate (e.g. due to an invalid **lockPe**

**riod** which might not be caught if **lockOptions** is empty or incorrectly managed), the reward calculation will

proceed with potentially incorrect data:

```
reward = StakingLib.calculateReward(
position.amount,
timeElapsed,
rewardRate
);
```
This could lead to reward being calculated with an unintended or zero reward rate, resulting in either

overpayment or no rewards being distributed.

Impact: Incorrect reward distribution, where users might not receive the expected rewards or might receive

inflated rewards due to an erroneous reward rate calculation.

**Recommendation**

*** **:** Implement a check to ensure that the **rewardRate** returned by **StakingLib.validateAndGetRate** is greater than

zero before proceeding with reward calculation.

**Client Response**

client response : Fixed.


## HSS-20Inconsistency between the addLockOption and updateLockOption functions

## kOption functions

```
Category Severity Client Response Contributor
```
```
Logical Informational Fixed ***
```
**Code Reference**

```
code/contracts/staking.sol#L258-L287
```
```
258 : function addLockOption(
259 : uint256 period,
260 : uint256 rewardRate
261 : ) external onlyAdmin {
262 : require(StakingLib.isValidLockOption(period, rewardRate), "Invalid lock option");
263 :
264 : for (uint256 i = 0 ; i < lockOptions.length; i++) {
265 : if (lockOptions[i].period == period) revert InvalidPeriod();
266 : }
267 :
268 : lockOptions.push(LockOption({
269 : period: period,
270 : rewardRate: rewardRate
271 : }));
272 :
273 : emit LockOptionAdded(period, rewardRate, block.timestamp);
274 : }
275 :
276 :
277 : function updateLockOption(
```
```
278 : uint256 index,
279 : uint256 newPeriod,
280 : uint256 newRate
281 : ) external onlyAdmin {
282 : require(index < lockOptions.length, "Invalid index");
283 : require(StakingLib.isValidLockOption(newPeriod, newRate), "Invalid lock option");
284 :
285 : lockOptions[index].period = newPeriod;
286 : lockOptions[index].rewardRate = newRate;
287 : }
```
**Description**

*** **:** In **addLockOption** function, when adding a new lock period option, the function checks whether the **period**

already exists in the **lockOptions** array. If a duplicate period is found, the function reverts with an **InvalidPeriod**

error:

```
for (uint256 i = 0 ; i < lockOptions.length; i++) {
if (lockOptions[i].period == period) revert InvalidPeriod();
}
```

However, in **updateLockOption** function, when updating an existing lock period option, the function does not

check whether the new period ( **newPeriod** ) already exists in the **lockOptions** array:

```
function updateLockOption(
uint256 index,
uint256 newPeriod,
uint256 newRate
) external onlyAdmin {
require(index < lockOptions.length, "Invalid index");
require(StakingLib.isValidLockOption(newPeriod, newRate), "Invalid lock option");
```
```
lockOptions[index].period = newPeriod;
lockOptions[index].rewardRate = newRate;
}
```
This allows the creation of duplicate period values, which can lead to logical inconsistencies and errors in reward

calculations.

**Recommendation**

*** **:** Consider following fix:

```
function updateLockOption(
uint256 index,
uint256 newPeriod,
uint256 newRate
) external onlyAdmin {
require(index < lockOptions.length, "Invalid index");
require(StakingLib.isValidLockOption(newPeriod, newRate), "Invalid lock option");
```
```
// Check if newPeriod already exists (excluding the current index)
for (uint256 i = 0 ; i < lockOptions.length; i++) {
if (i != index && lockOptions[i].period == newPeriod) {
revert InvalidPeriod();
}
}
```
```
// Update the lock option
lockOptions[index].period = newPeriod;
lockOptions[index].rewardRate = newRate;
```
```
emit LockOptionUpdated(index, newPeriod, newRate, block.timestamp);
}
```
**Client Response**

client response : Fixed. Fixed.


## Disclaimer

This report is subject to the terms and conditions (including without limitation, description of services,

confidentiality, disclaimer and limitation of liability) set forth in the Invoices, or the scope of services, and terms

and conditions provided to you (“Customer” or the “Company”) in connection with the Invoice. This report

provided in connection with the services set forth in the Invoices shall be used by the Company only to the

extent permitted under the terms and conditions set forth in the Invoice. This report may not be transmitted,

disclosed, referred to or relied upon by any person for any purposes, nor may copies be delivered to any other

person other than the Company, without Secure3’s prior written consent in each instance.

This report is not an “endorsement” or “disapproval” of any particular project or team. This report is not an

indication of the economics or value of any “product” or “asset” created by any team or project that contracts

Secure3 to perform a security assessment. This report does not provide any warranty or guarantee of free of

bug of codes analyzed, nor do they provide any indication of the technologies, business model or legal

compliancy.

This report should not be used in any way to make decisions around investment or involvement with any

particular project. Instead, it represents an extensive assessing process intending to help our customers increase

the quality of their code and high-level consistency of implementation and business model, while reducing the

risk presented by cryptographic tokens and blockchain technology.

Secure3’s position on the final decisions over blockchain technologies and corresponding associated

transactions is that each company and individual are responsible for their own due diligence and continuous

security.

The assessment services provided by Secure3 is subject to dependencies and under continuing development.

The assessment reports could include false positives, false negatives, and other unpredictable results. The

services may access, and depend upon, multiple layers of third-parties.


