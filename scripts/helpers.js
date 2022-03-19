import { formatUnits } from "@ethersproject/units"
import dotenv from "dotenv"
import ethers from 'ethers'
import chalk from 'chalk'
import readline from 'readline'
import ora from "ora";
dotenv.config()

let validConfig = true
if (process.env.RPC_URL === undefined) {
  console.log('Missing RPC_URL')
  validConfig = false
}
if (process.env.PRIVATE_KEY === undefined) {
  console.log('Missing PRIVATE_KEY')
  validConfig = false
}
if (!validConfig) {
  process.exit(1)
}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

const ask = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(chalk.yellow(question), input => {
      resolve(input);
      rl.close();
    });
  });
};
const deployContract = async ({
  name,
  deployer,
  factory,
  args,
  opts,
}) => {
  console.log(chalk.grey(`============ Contract ${name} @ ${process.env.RPC_URL} ============`));

  const balance = await deployer.getBalance();
  console.log(chalk.blueBright(`Deployer ${deployer.address} (balance: ${formatUnits(balance)} ETH)`));

  if (factory.interface.deploy.inputs) {
    if (factory.interface.deploy.inputs.length !== args.length) {
      console.log(
        chalk.red(`${name} expected ${factory.interface.deploy.inputs.length} arguments, got ${args.length}`),
      );
      console.log(chalk.grey(`=========================================`));
      process.exit(0);
    }
  }

  const displayArgs = factory.interface.deploy.inputs
    .map((x, i) => {
      return {
        [x.name]: args[i],
      };
    })
    .reduce((acc, x) => {
      return { ...acc, ...x };
    }, {});

  console.log(chalk.yellow(`Deploy ${name} with the following args: `));
  console.log(chalk.yellow(JSON.stringify(displayArgs, null, 4)));
  let confirmDeploy = await ask("Continue? (y/n): ");

  while (confirmDeploy === "" || (confirmDeploy !== "y" && confirmDeploy !== "n")) {
    confirmDeploy = await ask("Continue? (y/n): ");
  }

  if (confirmDeploy.toLowerCase() !== "y") {
    console.log(chalk.red("Contract deployment cancelled"));
    console.log(chalk.grey(`=========================================`));
    process.exit(0);
  }

  const curBlock = await provider.getBlock()
  let maxFeePerGas, maxPriorityFeePerGas
  if (opts && "maxFeePerGas" in opts) {
    maxFeePerGas = opts.maxFeePerGas;
  } else {
    maxFeePerGas = curBlock.baseFeePerGas.mul(115).div(100)
  }

  if (opts && "maxPriorityFee" in opts) {
    maxPriorityFeePerGas = opts.maxPriorityFee;
  } else {
    // Hardcode to 2 gwei
    maxPriorityFeePerGas = ethers.utils.parseUnits('2', 9)
  }

  const spinner = ora(`Deploying ${name} with maxFeePerGas ${formatUnits(maxFeePerGas, 9)} gwei & maxPriorityFeePerGas ${formatUnits(maxPriorityFeePerGas, 9)}`).start();

  let contract;
  try {
    contract = await factory.connect(deployer).deploy(...args, {
      ...opts,
      maxFeePerGas,
      maxPriorityFeePerGas
    });
    await contract.deployed();
    spinner.succeed(`Deployed ${name} to ${contract.address}`);
  } catch (e) {
    contract = null;
    spinner.fail(`Failed to deploy: ${e.toString()}`);
  }
  console.log(chalk.grey(`=========================================`));

  if (contract === null) {
    process.exit(0);
  }

  return contract;
};

export {
  provider, wallet, ask, deployContract
}