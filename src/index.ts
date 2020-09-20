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


            /*
            let telegramUser: TelegramUser = new TelegramUser();
            telegramUser.chatId = 1023621712;
            telegramUser.username = "leonardx";
            telegramUser.guild = "blacklusionx";
            telegramUser.mainnet_mute = new Date();

            await database.manager.save(telegramUser);
             */
        })
        .catch((error) => {
            logger.error("Error while connecting to database ", error);
        });
}

main();