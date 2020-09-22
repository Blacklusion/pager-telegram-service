# Pager Telegram Service
Microservice, part of the Blacklusion Pager. This service handles the distribution of messages to a list of telegram subscribers and the user interaction.

## Features:
1. **Custom Keyboards**: The user can configure notification settings via custom telegram keyboards. This includes muting a complete chain (e.g. all notifications for Testnet) or only single categories (e.g. Api notifications). 
2. **Api**: Telegram messages are sent by making an Api Call to the telegram service. The api is structured into 5 routes: /api, /history, /seed, /organization and /send-to-all. The last api call is useful for informing all subscriber before maintenance or after global outages (e.g. cloudflare down, causing major validationproblems).
3. **Repot false alarm**: If an user thinks, that the validation is incorrect, they have the possibility to report the alarm and write a custom explanation. These reports will be logged for the administrator.
