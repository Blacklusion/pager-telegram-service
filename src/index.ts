import * as config from "config";
import {logger} from "./common";
import * as api from "./api";
import * as bot from "./bot";
import {createConnection} from "typeorm";

export function main() {
    logger.info("Starting up telegram service...");
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
