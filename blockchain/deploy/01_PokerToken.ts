import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const PokerToken = await deploy("PokerToken", {
        from: deployer,
        log: true,
    });

    await deploy("PokerTokenFaucet", {
        from: deployer,
        log: true,
        args: [PokerToken.address],
    });
};

export default func;
export const tags = ["PokerToken"];
