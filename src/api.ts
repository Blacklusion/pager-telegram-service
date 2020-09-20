import {logger} from "./common";
import * as express from 'express';
import {getConnection} from "typeorm";
import {TelegramUser} from "./database/entity/TelegramUser";
import {Telegraf} from "telegraf";
import * as config from "config";
import * as telegraf from "telegraf";

const falseAlarmText: string = "Report as false alarm"

export function start() {
    const database = getConnection();

    const api = express();
    api.use(express.json())
    const port = 8080;

    const bot: Telegraf<any> = new Telegraf(config.get("telegram.public_token"))
    bot.use(telegraf.Telegraf.log())

    /**
     * DEFAULT ROUTE: All requests that don't match a route will be handled here
     */
    api.post("/", (req, res) => {
        res
            .status(404)
            .send("Invalid route. No telegram messages were send.")
    })

    /**
     * All routes use the following schema for post data
     * {
     *      "guild_name": string
     *      "isMainnet": boolean
     *      "message": string
     * }
     */

    /**
     * ORGANIZATION
     */
    api.post("/organization", (req, res) => {
        try {
            // Correct format for post data
            if (typeof req.body && typeof req.body.guild_name == "string" && typeof req.body.isMainnet == "boolean" && typeof req.body.message == "string") {
                logger.debug("/organization \t Received request in correct format: ", req.body);

                // Request all users from database that have subscribed to this guild
                database.manager.find(TelegramUser, {
                    where: [{guild: req.body.guild_name}]
                }).then(userArray => {
                    userArray.forEach(user => {

                        // Only send message if the user has enabled notifications for this chain and category
                        if (req.body.isMainnet ? (user.mainnet_subscribe && user.mainnet_organization) : (user.testnet_subscribe && user.testnet_organization)) {
                            bot.telegram.sendMessage(user.chatId, req.body.message, telegraf.Extra.HTML().markup((m) =>
                                m.inlineKeyboard([
                                    m.callbackButton(falseAlarmText, 'falseAlarm')
                                ])));
                            logger.debug("/organization \t Sent message to " + user.username);
                        }
                    })
                });
                res.send("Success");
            }

            // Wrong format for post data
            else {
                logger.info("/organization \t Received message in WRONG format: ", req.body)
                res
                    .status(400)
                    .send("Invalid Post data. Make sure it contains \"guild_name\", \"isMainnet\" and \"message\"");
            }
        } catch (error) {
            logger.fatal("Error during /organization API call: ", error);
        }
    })

    /**
     * API
     */
    api.post("/api", (req, res) => {
        try {
            // Correct format for post data
            if (typeof req.body && typeof req.body.guild_name == "string" && typeof req.body.isMainnet == "boolean" && typeof req.body.message == "string") {
                logger.debug("/api \t Received request in correct format: ", req.body);

                // Request all users from database that have subscribed to this guild
                database.manager.find(TelegramUser, {
                    where: [{guild: req.body.guild_name}]
                }).then(userArray => {
                    userArray.forEach(user => {

                        // Only send message if the user has enabled notifications for this chain and category
                        if (req.body.isMainnet ? (user.mainnet_subscribe && user.mainnet_api) : (user.testnet_subscribe && user.testnet_api)) {
                            bot.telegram.sendMessage(user.chatId, req.body.message, telegraf.Extra.HTML().markup((m) =>
                                m.inlineKeyboard([
                                    m.callbackButton(falseAlarmText, 'falseAlarm')
                                ])))
                            logger.debug("/api \t Sent message to " + user.username);
                        }
                    })
                });
                res.send("Success");
            }

            // Wrong format for post data
            else {
                logger.info("/api \t Received message in WRONG format: ", req.body)
                res
                    .status(400)
                    .send("Invalid Post data. Make sure it contains \"guild_name\", \"isMainnet\" and \"message\"");
            }
        } catch (error) {
            logger.fatal("Error during /api API call: ", error);
        }
    })

    /**
     * HISTORY
     */
    api.post("/history", (req, res) => {
        try {
            // Correct format for post data
            if (typeof req.body && typeof req.body.guild_name == "string" && typeof req.body.isMainnet == "boolean" && typeof req.body.message == "string") {
                logger.debug("/history \t Received request in correct format: ", req.body);

                // Request all users from database that have subscribed to this guild
                database.manager.find(TelegramUser, {
                    where: [{guild: req.body.guild_name}]
                }).then(userArray => {
                    userArray.forEach(user => {

                        // Only send message if the user has enabled notifications for this chain and category
                        if (req.body.isMainnet ? (user.mainnet_subscribe && user.mainnet_history) : (user.testnet_subscribe && user.testnet_history)) {
                            bot.telegram.sendMessage(user.chatId, req.body.message, telegraf.Extra.HTML().markup((m) =>
                                m.inlineKeyboard([
                                    m.callbackButton(falseAlarmText, 'falseAlarm')
                                ])))
                            logger.debug("/history \t Sent message to " + user.username);
                        }
                    })
                });
                res.send("Success");
            }

            // Wrong format for post data
            else {
                logger.info("/history \t Received message in WRONG format: ", req.body)
                res
                    .status(400)
                    .send("Invalid Post data. Make sure it contains \"guild_name\", \"isMainnet\" and \"message\"");
            }
        } catch (error) {
            logger.fatal("Error during /history API call: ", error);
        }
    })

    /**
     * SEED (P2P)
     */
    api.post("/seed", (req, res) => {
        try {
            // Correct format for post data
            if (typeof req.body && typeof req.body.guild_name == "string" && typeof req.body.isMainnet == "boolean" && typeof req.body.message == "string") {
                logger.debug("/seed \t Received request in correct format: ", req.body);

                // Request all users from database that have subscribed to this guild
                database.manager.find(TelegramUser, {
                    where: [{guild: req.body.guild_name}]
                }).then(userArray => {
                    userArray.forEach(user => {

                        // Only send message if the user has enabled notifications for this chain and category
                        if (req.body.isMainnet ? (user.mainnet_subscribe && user.mainnet_seed) : (user.testnet_subscribe && user.testnet_seed)) {
                            bot.telegram.sendMessage(user.chatId, req.body.message, telegraf.Extra.HTML().markup((m) =>
                                m.inlineKeyboard([
                                    m.callbackButton(falseAlarmText, 'falseAlarm')
                                ])))
                            logger.debug("/seed \t Sent message to " + user.username);
                        }
                    })
                });
                res.send("Success");
            }

            // Wrong format for post data
            else {
                logger.debug("/seed \t Received message in WRONG format: ", req.body)
                res
                    .status(400)
                    .send("Invalid Post data. Make sure it contains \"guild_name\", \"isMainnet\" and \"message\"");
            }
        } catch (error) {
            logger.fatal("Error during /seed API Request: ", error);
        }
    })

    /**
     * PRODUCER
     */
    api.post("/producer", (req, res) => {
        try {
            // Correct format for post data
            if (typeof req.body && typeof req.body.guild_name == "string" && typeof req.body.isMainnet == "boolean" && typeof req.body.message == "string") {
                logger.debug("/producer \t Received request in correct format: ", req.body);

                // Request all users from database that have subscribed to this guild
                database.manager.find(TelegramUser, {
                    where: [{guild: req.body.guild_name}]
                }).then(userArray => {
                    userArray.forEach(user => {

                        // Only send message if the user has enabled notifications for this chain and category
                        if (req.body.isMainnet ? (user.mainnet_subscribe && user.mainnet_producer) : (user.testnet_subscribe && user.testnet_producer)) {
                            bot.telegram.sendMessage(user.chatId, req.body.message, telegraf.Extra.HTML().markup((m) =>
                                m.inlineKeyboard([
                                    m.callbackButton(falseAlarmText, 'falseAlarm')
                                ])))
                            logger.debug("/producer \t Sent message to " + user.username);
                        }
                    })
                });
                res.send("Success");
            }

            // Wrong format for post data
            else {
                logger.info("/producer \t Received message in WRONG format: ", req.body)
                res
                    .status(400)
                    .send("Invalid Post data. Make sure it contains \"guild_name\", \"isMainnet\" and \"message\"");
            }
        } catch (error) {
            logger.fatal("Error during /producer API call: ", error);
        }
    })

    /**
     * SEND TO ALL: Should only be used in EMERGENCIES (e.g. Informing all users before maintenance)
     * {
     *     "security-token": string
     *     "isMainnet": boolean (optional; can be removed if not used)
     *     "message": string
     * }
     */
    api.post("/send-to-all", (req, res) => {
        try {
            // Correct format for post data
            if (typeof req.body && typeof req.body.message == "string" && typeof req.body["security_token"] == "string") {

                // Check security token: Not super secure, but better than nothing and should be enough for self hosted services
                if (config.get("telegram.security_token") === req.body["security_token"]) {
                    logger.info("/send-to-all \t Received request in correct format with correct security token.");

                    // Request all users from database that have subscribed to this guild
                    database.manager.find(TelegramUser).then(userArray => {
                        let userCounter: number = 0;
                        userArray.forEach(user => {

                            // Only send message if the user has enabled notifications for this chain and category
                            if (!req.body.isMainnet || (typeof req.body.isMainnet == "boolean" && (req.body.isMainnet ? user.mainnet_subscribe : user.testnet_subscribe))) {
                                bot.telegram.sendMessage(user.chatId, req.body.message)
                                userCounter++;
                            }
                        })
                        logger.info("/send-to-all \t Message was sent to " + userCounter + " users.", req.body);
                    });
                } else {
                    logger.warn("/send-to-all \t Received request but with no or the wrong security token: ", req.body);
                }
                res.send("Success");
            }

            // Wrong format for post data
            else {
                logger.info("/send-to-all \t Received message in WRONG format: ", req.body)
                res
                    .status(400)
                    .send("Invalid Post data. Make sure it contains \"security_token\", \"isMainnet\" and \"message\"");
            }
        } catch (error) {
            logger.fatal("Error during /send-to-all API call: ", error);
        }
    })


    /**
     * START Express Server
     */
    api.listen(port, () => {
        logger.info(`Api started! Accepting incoming requests at http://localhost:${port}`);
    });
}