import * as telegraf from "telegraf";
import {BaseScene, session, Stage, Telegraf} from "telegraf";
import * as config from "config";
import {logger} from "./common";
import {TelegramUser} from "./database/entity/TelegramUser";
import {getConnection} from "typeorm";
import {ChainSelection} from "./ChainSelection";
import {SceneContextMessageUpdate} from "telegraf/typings/stage";
import {Guild} from "./database/entity/Guild";
import {createDeflateRaw} from "zlib";

export function start() {
    const database = getConnection();

    const bot: Telegraf<any> = new Telegraf(config.get("telegram.public_token"))


    let chainName: string = config.get("mainnet.name");
    let bothText: string = "both " + chainName + " Test- and Mainnet"
    let mainnetText: string = chainName + " Mainnet";
    let testnetText: string = chainName + " Testnet";

    if (config.has("general.logging_level") ? config.get("general.logging_level") == "silly" : false)
        bot.use(telegraf.Telegraf.log())


    /**
     * START COMMAND and initial setup of the bot
     */
    const startScene = new telegraf.BaseScene('start')
    startScene.enter(async (ctx) => {

        let user = await database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        })
        if (user) {
            ctx.scene.leave()
            return ctx.replyWithHTML("You are already monitoring " + user.guild)
        }

        await ctx.replyWithHTML("<b>How it works</b>:\n" +
            "The function of your endpoints will be validated once every <b>10 minutes</b>. If a change from the last validation is recognized, you will receive a message. This includes the monitoring of:\n" +
            "- Organization (bp.json etc.) \n- API \n- History \n- P2P \n" +
            "You can change the notification preferences for every category with /settings.");
        await ctx.replyWithHTML("What is the name of the account you would like to monitor?");
    })
    startScene.on('text', (ctx) => {
        let guildName = ctx.message.text.toLowerCase();
        database.manager.findOne(Guild, {
            where: [{name: guildName}],
        }).then(guild => {
            console.log(guild)
            if(guild) {
                let telegramUser = new TelegramUser();
                telegramUser.guild = guildName;
                telegramUser.username = ctx.chat.username;
                telegramUser.chatId = ctx.chat.id

                database.manager.save(telegramUser);

                ctx.replyWithHTML("Alright you are all setup <b>" + telegramUser.guild + "</b> is being monitored")
                ctx.replyWithHTML("Use /settings, to adjust notifications settings.")
                ctx.replyWithHTML("Use /lastvalidation, to get the results of our last validation.")
                ctx.scene.leave();
                return;
            } else {
                ctx.replyWithHTML("This guild is not monitored by our system. Please check spelling.")
                ctx.replyWithHTML("What is the name of the account you would like to monitor?");
            }
        })
    })
    startScene.on('message', (ctx) => ctx.reply('Only text messages please...'))

    /**
     * SETTINGS COMMAND
     */
    const settingsScene = new telegraf.BaseScene('settings')
    const settingsSceneBoth = new telegraf.BaseScene('settingsBoth')
    const settingsSceneMainnet = new telegraf.BaseScene('settingsMainnet')
    const settingsSceneTestnet = new telegraf.BaseScene('settingsTestnet')
    settingsScene.enter((ctx) => {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
            if (!user) {
                return ctx.replyWithHTML("You have not configured a guild. Please use /start first")
            }
            return ctx.replyWithHTML("Please select the chain you would like to configure", telegraf.Markup
                .keyboard([
                    ["🔗 Both Chains"],
                    ["① Mainnet", "② Testnet"],
                    ["cancel"]
                ])
                .oneTime()
                .resize()
                .extra()
            )
        })
    })

    // Cancel Settings menu
    settingsScene.hears('cancel', ctx => ctx.scene.leave());
    settingsScene.hears("🔗 Both Chains", ctx => ctx.scene.enter("settingsBoth"));
    settingsScene.hears("① Mainnet", ctx => ctx.scene.enter("settingsMainnet"));
    settingsScene.hears("② Testnet", ctx => ctx.scene.enter("settingsTestnet"));


    // Settings for both chains
    settingsSceneBoth.enter(ctx => {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
                //database.manager.update(TelegramUser, user.chatId, {current_settings: ChainSelection.BOTH})
                return ctx.replyWithHTML("What settings for " + bothText + " would you like to change?", telegraf.Markup
                    .keyboard([
                        ['🏛 Organization ' + (user.mainnet_organization ? "🔔" : "🔕") + (user.testnet_organization ? "🔔" : "🔕"), '🌐 API ' + (user.mainnet_api ? "🔔" : "🔕") + (user.testnet_api ? "🔔" : "🔕")],
                        ['📚 History ' + (user.mainnet_history ? "🔔" : "🔕") + (user.testnet_history ? "🔔" : "🔕"), '🤝 P2P ' + (user.mainnet_seed ? "🔔" : "🔕") + (user.testnet_seed ? "🔔" : "🔕")],
                        ['🚫 Stop monitoring', '↩️️ back']
                    ])
                    .oneTime()
                    .resize()
                    .extra()
                )
            }
        ).catch(error => {
            logger.error(error);
        })
    })

    // Settings for Mainnet
    settingsSceneMainnet.enter(ctx => {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
                //database.manager.update(TelegramUser, user.chatId, {current_settings: ChainSelection.MAINNET})
            if (user.mainnet_subscribe) {
                return ctx.replyWithHTML("What settings for " + mainnetText + " would you like to change?", telegraf.Markup
                    .keyboard([
                        ['🏛 Organization' + (user.mainnet_organization ? "" : " 🔕"), '🌐 API' + (user.mainnet_api ? "" : " 🔕")],
                        ['📚 History' + (user.mainnet_history ? "" : " 🔕"), '🤝 P2P' + (user.mainnet_seed ? "" : " 🔕")],
                        ['🚫 Stop monitoring', '↩️️ back']
                    ])
                    .oneTime()
                    .resize()
                    .extra()
                )
            } else {
                return ctx.replyWithHTML("Do you want to monitor " + mainnetText + " again?", telegraf.Markup
                    .keyboard([
                        ['✅ Start monitoring'],
                        ['↩️️ back']
                    ])
                    .oneTime()
                    .resize()
                    .extra()
                )
            }
            }
        ).catch(error => {
            logger.error(error);
        })
    })

    // Settings for Mainnet
    settingsSceneTestnet.enter(ctx => {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
                if (user.testnet_subscribe) {
                    return ctx.replyWithHTML("What settings for " + testnetText + " would you like to change?", telegraf.Markup
                        .keyboard([
                            ['🏛 Organization' + (user.testnet_organization ? "" : " 🔕"), '🌐 API' + (user.testnet_api ? "" : " 🔕")],
                            ['📚 History' + (user.testnet_history ? "" : " 🔕"), '🤝 P2P' + (user.testnet_seed ? "" : " 🔕")],
                            ['🚫 Stop monitoring', '↩️️ back']
                        ])
                        .oneTime()
                        .resize()
                        .extra()
                    )
                } else {
                    return ctx.replyWithHTML("Do you want to monitor " + testnetText + " again?", telegraf.Markup
                        .keyboard([
                            ['✅ Start monitoring'],
                            ['↩️️ back']
                        ])
                        .oneTime()
                        .resize()
                        .extra()
                    )
                }
            }
        ).catch(error => {
            logger.error(error);
        })
    })

    /**
     *                         ['🏛 Organization' + (user.mainnet_organization ? "" : " 🔕"), '🏭 Producer' + (user.mainnet_producer ? "" : " 🔕")],
     ['🤝 P2P'+ (user.mainnet_seed ? "" : " 🔕"), '🌐 API' + (user.mainnet_api ? "" : " 🔕"), '📚 History'],
     ['🔕 Mute', '🚫 Stop monitoring'],
     ['⬅️ Back']
     *
     *
     */

    settingsSceneMainnet.hears(/✅ Start monitoring.*/,  async ctx => {
        await database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
            database.manager.update(TelegramUser, user.chatId, {mainnet_subscribe: true})
            ctx.replyWithHTML("✅ Subscribed for <b>" + mainnetText + " again!</b>")
        })
        ctx.scene.enter('settings')
    })
    settingsSceneTestnet.hears(/✅ Start monitoring.*/, async ctx => {
        await database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
            database.manager.update(TelegramUser, user.chatId, {testnet_subscribe: true})
            ctx.replyWithHTML("✅ Subscribed for <b>" + testnetText + " again!</b>")
        })
        ctx.scene.enter('settings')
    })

    settingsSceneBoth.hears(/🏛 Organization.*/, async ctx => {
        await organization(ctx, ChainSelection.BOTH)
        ctx.scene.enter('settings')
    })
    settingsSceneMainnet.hears(/🏛 Organization.*/, async ctx => {
        await organization(ctx, ChainSelection.MAINNET)
        ctx.scene.enter('settings')
    })
    settingsSceneTestnet.hears(/🏛 Organization.*/, async ctx => {
        await organization(ctx, ChainSelection.TESTNET)
        ctx.scene.enter('settings')
    })

    function organization(ctx: SceneContextMessageUpdate, chain: ChainSelection) {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
            let muted: boolean = true;
            let chainText: string = bothText;
            switch (chain) {
                case ChainSelection.MAINNET:
                    muted = user.mainnet_organization;
                    chainText = mainnetText;
                    database.manager.update(TelegramUser, user.chatId, {mainnet_organization: !muted})
                    break;
                case ChainSelection.TESTNET:
                    muted = user.testnet_organization;
                    chainText = testnetText;
                    database.manager.update(TelegramUser, user.chatId, {testnet_organization: !muted})
                    break
                default:
                    if (user.mainnet_organization && user.testnet_organization) {
                        database.manager.update(TelegramUser, user.chatId, {mainnet_organization: false})
                        database.manager.update(TelegramUser, user.chatId, {testnet_organization: false})
                    } else {
                        database.manager.update(TelegramUser, user.chatId, {mainnet_organization: true})
                        database.manager.update(TelegramUser, user.chatId, {testnet_organization: true})
                        muted = false;
                    }
            }

            if (muted) {
                ctx.replyWithHTML("⚠️ Organization Muted for <b>" + chainText + "</b>. You will stop receiving messages about your website, chains.json and bp.json status.")
            } else {
                ctx.replyWithHTML("✅ Organization Unmuted for <b>" + chainText + "</b>.")
            }
            return;
        }).catch(error => {
            logger.error(error);
            return;
        })
    }

    settingsSceneBoth.hears(/🤝 P2P.*/, async ctx => {
        await seed(ctx, ChainSelection.BOTH)
        ctx.scene.enter('settings')
    })
    settingsSceneMainnet.hears(/🤝 P2P.*/, async ctx => {
        await seed(ctx, ChainSelection.MAINNET)
        ctx.scene.enter('settings')
    })
    settingsSceneTestnet.hears(/🤝 P2P.*/, async ctx => {
        await seed(ctx, ChainSelection.TESTNET)
        ctx.scene.enter('settings')
    })

    function seed(ctx: SceneContextMessageUpdate, chain: ChainSelection) {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
            let muted: boolean = true;
            let chainText: string = bothText;
            switch (chain) {
                case ChainSelection.MAINNET:
                    muted = user.mainnet_seed;
                    chainText = mainnetText;
                    database.manager.update(TelegramUser, user.chatId, {mainnet_seed: !muted})
                    break;
                case ChainSelection.TESTNET:
                    muted = user.testnet_seed;
                    chainText = testnetText;
                    database.manager.update(TelegramUser, user.chatId, {testnet_seed: !muted})
                    break
                default:
                    if (user.mainnet_seed && user.testnet_seed) {
                        database.manager.update(TelegramUser, user.chatId, {mainnet_seed: false})
                        database.manager.update(TelegramUser, user.chatId, {testnet_seed: false})
                    } else {
                        database.manager.update(TelegramUser, user.chatId, {mainnet_seed: true})
                        database.manager.update(TelegramUser, user.chatId, {testnet_seed: true})
                        muted = false;
                    }
            }

            if (muted) {
                ctx.replyWithHTML("⚠️ P2P Muted for <b>" + chainText + "</b>. You will stop receiving messages about the function of your P2P nodes.")
            } else {
                ctx.replyWithHTML("✅ P2P Unmuted for <b>" + chainText + "</b>.")
            }
        }).catch(error => {
            logger.debug(error);
        })
    }

    settingsSceneBoth.hears(/🌐 API.*/, async ctx => {
        await api(ctx, ChainSelection.BOTH)
        ctx.scene.enter('settings')
    })
    settingsSceneMainnet.hears(/🌐 API.*/, async ctx => {
        await api(ctx, ChainSelection.MAINNET)
        ctx.scene.enter('settings')
    })
    settingsSceneTestnet.hears(/🌐 API.*/, async ctx => {
        await api(ctx, ChainSelection.TESTNET)
        ctx.scene.enter('settings')
    })

    function api(ctx: SceneContextMessageUpdate, chain: ChainSelection) {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
            let muted: boolean = true;
            let chainText: string = bothText;
            switch (chain) {
                case ChainSelection.MAINNET:
                    muted = user.mainnet_api
                    chainText = mainnetText;
                    database.manager.update(TelegramUser, user.chatId, {mainnet_api: !muted})
                    database.manager.update(TelegramUser, user.chatId, {mainnet_history: !muted})
                    break;
                case ChainSelection.TESTNET:
                    muted = user.testnet_api;
                    chainText = testnetText;
                    database.manager.update(TelegramUser, user.chatId, {testnet_api: !muted})
                    database.manager.update(TelegramUser, user.chatId, {testnet_history: !muted})
                    break
                default:
                    if (user.mainnet_api && user.testnet_api) {
                        database.manager.update(TelegramUser, user.chatId, {mainnet_api: false})
                        database.manager.update(TelegramUser, user.chatId, {testnet_api: false})
                        database.manager.update(TelegramUser, user.chatId, {mainnet_history: false})
                        database.manager.update(TelegramUser, user.chatId, {testnet_history: false})
                    } else {
                        database.manager.update(TelegramUser, user.chatId, {mainnet_api: true})
                        database.manager.update(TelegramUser, user.chatId, {testnet_api: true})
                        database.manager.update(TelegramUser, user.chatId, {mainnet_history: true})
                        database.manager.update(TelegramUser, user.chatId, {testnet_history: true})
                        muted = false;
                    }
            }

            if (muted) {
                ctx.replyWithHTML("⚠️ Api Muted for <b>" + chainText + "</b>. You will stop receiving messages about the function of you API node(s). 📚 History (& Hyperion) was <b>muted</b> as well. You can turn on/off notifications separately in the settings.")
            } else {
                ctx.replyWithHTML("✅ Api Unmuted for <b>" + chainText + "</b>. 📚 History (& Hyperion) was <b>unmuted</b> as well. You can turn on/off notifications separately in the settings.")
            }
        }).catch(error => {
            logger.debug(error);
        })
    }

    settingsSceneBoth.hears(/📚 History.*/, async ctx => {
        await history(ctx, ChainSelection.BOTH)
        ctx.scene.enter('settings')
    })
    settingsSceneMainnet.hears(/📚 History.*/, async ctx => {
        await history(ctx, ChainSelection.MAINNET)
        ctx.scene.enter('settings')
    })
    settingsSceneTestnet.hears(/📚 History.*/, async ctx => {
        await history(ctx, ChainSelection.TESTNET)
        ctx.scene.enter('settings')
    })

    function history(ctx: SceneContextMessageUpdate, chain: ChainSelection) {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
            let muted: boolean = true;
            let chainText: string = bothText;
            switch (chain) {
                case ChainSelection.MAINNET:
                    muted = user.mainnet_history;
                    chainText = mainnetText;
                    database.manager.update(TelegramUser, user.chatId, {mainnet_history: !muted})
                    break;
                case ChainSelection.TESTNET:
                    muted = user.testnet_history;
                    chainText = testnetText;
                    database.manager.update(TelegramUser, user.chatId, {testnet_history: !muted})
                    break
                default:
                    if (user.mainnet_history && user.testnet_history) {
                        database.manager.update(TelegramUser, user.chatId, {mainnet_history: false})
                        database.manager.update(TelegramUser, user.chatId, {testnet_history: false})
                    } else {
                        database.manager.update(TelegramUser, user.chatId, {mainnet_history: true})
                        database.manager.update(TelegramUser, user.chatId, {testnet_history: true})
                        muted = false;
                    }
            }

            if (muted) {
                ctx.replyWithHTML("⚠️ History Muted for <b>" + chainText + "</b>. You will stop receiving messages about the function of your History/Hyperion. The notification settings for the api node were not changed.")
            } else {
                ctx.replyWithHTML("✅ History Unmuted for <b>" + chainText + "</b>.")
            }
        }).catch(error => {
            logger.debug(error);
        })
    }

    settingsSceneBoth.hears('↩️️ back', ctx => {
        ctx.scene.leave();
        ctx.scene.enter("settings");
    });
    settingsSceneMainnet.hears('↩️️ back', ctx => {
        ctx.scene.leave();
        ctx.scene.enter("settings");
    });
    settingsSceneTestnet.hears('↩️️ back', ctx => {
        ctx.scene.leave();
        ctx.scene.enter("settings");
    });


    // todo:
    settingsSceneBoth.hears(/🚫 Stop monitoring.*/, async ctx => {
        await monitoring(ctx, ChainSelection.BOTH)
        ctx.scene.leave()
    })
    settingsSceneMainnet.hears(/🚫 Stop monitoring.*/, async ctx => {
        await monitoring(ctx, ChainSelection.MAINNET)
        ctx.scene.leave()
    })
    settingsSceneTestnet.hears(/🚫 Stop monitoring.*/, async ctx => {
        await monitoring(ctx, ChainSelection.TESTNET)
        ctx.scene.leave()
    })

    const monitoringScene = new telegraf.BaseScene('monitoring')
    monitoringScene.enter(ctx => {
        ctx.reply('Are you sure? This will delete your database entry for <b>' + bothText + '</b>!', telegraf.Extra.HTML().markup((m) =>
            m.inlineKeyboard([
                m.callbackButton('Yes', 'monitoringYes'),
                m.callbackButton('No', 'monitoringNo'),
            ])))
    })
    monitoringScene.action("monitoringYes", async ( ctx) => {
        await database.manager.createQueryBuilder()
            .delete()
            .from(TelegramUser)
            .where("chatId = :chatId", {chatId: ctx.chat.id })
            .execute();


        ctx.scene.leave();
        return ctx.replyWithHTML('You personal data was removed from the database. You will receive no notifications anymore.')
    })
    monitoringScene.action("monitoringNo", (ctx) => {
        ctx.scene.leave();
        return ctx.replyWithHTML('OK, you will still receive notifications.')
    })


    function monitoring(ctx: SceneContextMessageUpdate, chain: ChainSelection) {
        database.manager.findOne(TelegramUser, {
            where: [{chatId: ctx.chat.id}],
        }).then(user => {
            let muted: boolean = true;
            let chainText: string = bothText;
            switch (chain) {
                case ChainSelection.MAINNET:
                    muted = user.mainnet_subscribe;
                    chainText = mainnetText;
                    database.manager.update(TelegramUser, user.chatId, {mainnet_subscribe: !user.mainnet_subscribe})
                    break;
                case ChainSelection.TESTNET:
                    muted = user.testnet_subscribe;
                    chainText = testnetText;
                    database.manager.update(TelegramUser, user.chatId, {testnet_subscribe: !user.testnet_subscribe})
                    break
                default:
                    ctx.scene.leave();
                    ctx.scene.enter("monitoring");
                    return;
            }

            if (muted) {
                ctx.replyWithHTML("‼️ Stopped Monitoring " + user.guild + " for <b>" + chainText + "</b>. You will stop receiving any messages")
            } else {
                ctx.replyWithHTML("✅ Monitoring " + user.guild + " for <b>" + chainText + "</b>.")
            }
        }).catch(error => {
            logger.debug(error);
        })
    }

    const falseAlarmScene = new BaseScene('falseAlarm')
    falseAlarmScene.enter(ctx => {
            ctx.reply('Please provide additional information, that may help to prevent future false alarms. Why do think this is a bug?', telegraf.Extra.HTML().markup((m) =>
                m.inlineKeyboard([
                    m.callbackButton('cancel', 'falseAlarmCancel')
                ])))
            console.log(ctx.update.callback_query.message)
        }
    )

    falseAlarmScene.action("falseAlarmCancel", (ctx) => {
        ctx.scene.leave();
        return ctx.replyWithHTML('OK, no report was sent.')
    })

    falseAlarmScene.on("text", ctx => {
        console.log(ctx.update)
        ctx.scene.leave();
        return ctx.replyWithHTML('Thank you for your feedback! The administrator was informed about your issue. Sorry for the inconvenience :(')
    })


    /**
     * START BOT
     */
    const stage = new Stage([startScene, falseAlarmScene, settingsScene, settingsSceneBoth, settingsSceneMainnet, settingsSceneTestnet, monitoringScene], {ttl: 60})
    bot.use(session())
    bot.use(stage.middleware())
    bot.command('start', (ctx) => ctx.scene.enter('start'))
    bot.command('settings', (ctx) => ctx.scene.enter('settings'))
    bot.action('falseAlarm', (ctx) => ctx.scene.enter("falseAlarm"))

    bot.launch().then(r => {
        logger.info("Bot started! Ready to handle telegram messages.")
    }).catch(error => {
        logger.fatal("Error while starting up bot. Not able to accept telegram messages.", error);
    })
}