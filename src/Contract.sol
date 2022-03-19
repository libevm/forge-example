// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "@openzeppelin/token/ERC20/ERC20.sol";

contract Contract is ERC20("Token", "TKN") {
    function mint(address _recipient, uint256 _amount) public {
        _mint(_recipient, _amount);
    }
}
