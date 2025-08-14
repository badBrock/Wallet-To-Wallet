// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private storedData;
    address public owner;
    
    event DataUpdated(uint256 newValue, address updatedBy);
    
    constructor() {
        owner = msg.sender;
        storedData = 0;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function set(uint256 x) public {
        storedData = x;
        emit DataUpdated(x, msg.sender);
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
    
    function increment() public {
        storedData += 1;
        emit DataUpdated(storedData, msg.sender);
    }
    
    function decrement() public {
        require(storedData > 0, "Cannot decrement below zero");
        storedData -= 1;
        emit DataUpdated(storedData, msg.sender);
    }
}
