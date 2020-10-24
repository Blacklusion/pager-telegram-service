import * as config from "config";
import {logger} from "./common";
import * as api from "./api";
import * as bot from "./bot";
import {createConnection} from "typeorm";
import {TelegramUser} from "./database/entity/TelegramUser";


export function main() {
    logger.info("Starting up telegram service...");
    createConnection()
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
