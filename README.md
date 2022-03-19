# Forge Example

A barebones example project on how I setup forge with VSCode along with custom deploy scripts.

- [remappings.txt](https://github.com/libevm/forge-example/blob/main/remappings.txt) for vscode solidity [linter](https://github.com/juanfranblanco/vscode-solidity#remappings)
- [foundry.toml](https://github.com/libevm/forge-example/blob/main/foundry.toml) to config [forge](https://github.com/gakonst/foundry)

Tested on `forge 0.1.0 (03bed46 2022-03-15T00:11:36.438888+00:00)`

## Overview

- Uses [forge](https://github.com/gakonst/foundry) to compile, test, and debug.
- Uses a custom JS script to deploy, see [deploy.js](https://github.com/libevm/forge-example/blob/main/scripts/deploy.js).

I prefer to write the deployment scripts as programatically as possible on a widely supported language as every deployment itself is unique, and sometimes there's inter-dependencies between contracts.

For example:

1. Deploy contract A
2. Deploy contract B
3. Call addOwner on B with A's address

This is overly tricky with bash for me, and would require a LOT of unreadable (and error-prone) commands-line composition with jq and awk to achieve that with the default `forge create`.

## Development

Building and testing
```bash
forge build
forge test

# forking from existing state
# -vvv = very very verbose
# forge test -f http://127.0.0.1:8545 -vvv

# To access the debugger
# forge run --debug src/test/Contract.t.sol --sig "testExample()"
```

## Contract Deployment

Copy `.env.example` to `.env` and fill it out with correct details.

```bash
node --experimental-json-modules scripts/deploy.js
```

## Etherscan Verification

Forge has a very useful in-built etherscan verification utility.

```bash
# For list of compiler versions https://etherscan.io/solcversions
forge verify-contract --compiler-version v0.8.12+commit.f00d7308 [CONTRACT ADDRESS] --constructor-args <ARGS> --num-of-optimizations 200 [CONTRACT_PATH:CONTRACT_NAME] [ETHERSCAN_API_KEY]

# To check verification status
forge verify-check [GUID] [ETHERSCAN_KEY]
```

If you have multiple contracts with `pragma abiencoderv2`, there is a possibility that you can't verify your contracts on etherscan, there's an [open issue on this](https://github.com/gakonst/foundry/issues/852).

One way to get around it is via [paulrberg's multisol](https://github.com/paulrberg/multisol) or [hjubb's solt](https://github.com/hjubb/solt) and verify it manually via the official interface.

The caveat to the approach above is that you have to have to copy the libraries in `lib` to `node_modules` and make sure the path matches as it doesn't read remappings. 

For example:

```bash
cp -r lib/openzeppelin-contracts node_modules/@openzeppelin
mv node_modules/@openzeppelin/contracts/* node_modules/@openzeppelin
multisol src/Contract.sol
```