import * as config from "config";
import {logger} from "./common";
import * as api from "./api";
import * as bot from "./bot";
import {createConnection} from "typeorm";
import {URL} from "url";

export function main() {
    logger.info("Starting up telegram service...");

    // Check if config file with all necessary settings exists
    if (!checkConfig()) {
        logger.fatal("Not all settings were set. Aborting startup...");
        return;
    } else {
        logger.info("Valid config/local.toml was found!");
    }

    createConnection({type: "postgres", host: config.get("database.postgres_host"), port: config.get("database.postgres_port"), username: config.get("database.postgres_user"), password: config.get("database.postgres_password"), database: config.get("database.postgres_db"), entities: [__dirname + "/database/entity/*{.js,.ts}"],
        synchronize: true})
        .then(async (database) => {

            logger.info("Successfully connected to database");

            /**
             * START BOT
             */
            bot.start();

            /**
             * START API (express server)
             */
            api.start();
        })
        .catch((error) => {
            logger.error("Error while connecting to database ", error);
        });
}

main();

/**
 * Checks if all necessary settings are provided in config/local.toml
 * @return {boolean} = if true all settings are set correctly. Otherwise false is returned
 */
function checkConfig(): boolean {
    let allVariablesSet = true;

    const settings = [
        ["general.name", "string"],
        ["general.json_directory", "string"],

        ["telegram.public_token", "string"],
        ["telegram.security_token", "string"],
        // Logging_level must not be provided -> defaults to info

        ["mainnet.name", "string"],
        ["mainnet.chain_id", "string"],
        
        ["testnet.name", "string"],
        ["testnet.chain_id", "string"],
        ["database.postgres_host", "string"],
        ["database.postgres_port", "number"],
        ["database.postgres_user", "string"],
        ["database.postgres_password", "string"],
        ["database.postgres_db", "string"]
    ];

    settings.forEach((setting) => {
        try {
            const configItem = config.get(setting[0])
            if (setting[1] === "url") {
                try {
                    new URL(configItem)
                } catch (e) {
                    logger.error(setting[0] + " was provided. But it is not a valid url.");
                    allVariablesSet = false;
                }
            }
            else if (
                (setting[1] === "array" && !Array.isArray(configItem)) ||
                (setting[1] !== "array" && !(typeof configItem === setting[1]))
            ) {
                logger.error(setting[0] + " was provided. But it is not of type " + setting[1]);
                allVariablesSet = false;
            }
        } catch (e) {
            logger.error(setting[0] + " was not provided!");
            allVariablesSet = false;
        }
    });

    return allVariablesSet;
}
