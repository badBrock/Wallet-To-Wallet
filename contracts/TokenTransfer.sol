// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenTransfer {
    event TokensTransferred(address indexed from, address indexed to, uint256 amount, address token);
    
    function transferTokens(
        address tokenAddress,
        address to,
        uint256 amount
    ) public {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(to, amount), "Transfer failed");
        
        emit TokensTransferred(msg.sender, to, amount, tokenAddress);
    }
    
    function transferFromTokens(
        address tokenAddress,
        address from,
        address to,
        uint256 amount
    ) public {
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(from, to, amount), "TransferFrom failed");
        
        emit TokensTransferred(from, to, amount, tokenAddress);
    }
    
    function getTokenBalance(address tokenAddress, address account) public view returns (uint256) {
        IERC20 token = IERC20(tokenAddress);
        return token.balanceOf(account);
    }
}
