// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EntropyGenerator
 * @notice A free public utility on the Base network for generating verifiable 
 * pseudo-random seeds based on block and transaction parameters.
 * * NOTE: The function is not declared 'payable', meaning users cannot accidentally 
 * send ETH/tokens to the contract when calling generateSeed().
 */
contract EntropyGenerator {
    
    // Mapping from user address to their last generated seed
    mapping(address => uint256) public lastGeneratedSeed;

    event SeedGenerated(address indexed user, uint256 seed);

    address public immutable owner;

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Generates a unique pseudo-random seed by hashing on-chain variables.
     * The function is non-payable, enforcing zero cost beyond network gas fees.
     * @dev Uses block data, sender addresses, and previous block hash for entropy.
     * @return The newly generated 256-bit seed.
     */
    function generateSeed() public returns (uint256) {
        
        // 1. Collect high-entropy on-chain variables.
        bytes32 entropySources = keccak256(
            abi.encodePacked(
                block.timestamp, 
                block.number, 
                msg.sender, 
                tx.origin,
                blockhash(block.number - 1) // Using the hash of the preceding block
            )
        );
        
        // 2. Convert the 32-byte hash into a 256-bit unsigned integer seed.
        uint256 newSeed = uint256(entropySources);
        
        // 3. Store the seed associated with the user's address.
        lastGeneratedSeed[msg.sender] = newSeed;

        // 4. Emit event for off-chain tracking and verification.
        emit SeedGenerated(msg.sender, newSeed);
        
        return newSeed;
    }

    /**
     * @notice Retrieves the last generated seed for a specific user.
     */
    function getSeed(address user) public view returns (uint256) {
        return lastGeneratedSeed[user];
    }
}
