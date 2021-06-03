import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, get } = deployments;
    const { deployer } = await getNamedAccounts();

    const Descartes = await get("Descartes");
    const Logger = await get("Logger");

    const TurnBasedGameContext = await deploy("TurnBasedGameContext", {
        from: deployer,
        log: true,
    });
    const TurnBasedGame = await deploy("TurnBasedGame", {
        from: deployer,
        log: true,
        args: [Descartes.address, Logger.address],
        libraries: { TurnBasedGameContext: TurnBasedGameContext.address },
    });

    // Get pokerToken contract previously deployed
    const pokerToken = await deployments.get('PokerToken');

    // Deploy TurnBasedGameLobby
    await deploy("TurnBasedGameLobby", {
        from: deployer,
        log: true,
        args: [pokerToken.address, TurnBasedGame.address],
    });
};

export default func;