import { Logger } from "tslog";
import * as config from "config";

/**
 * Logger used by all files
 */
export const logger: Logger = new Logger({
  name: config.get("general.name") + "-validation",
  minLevel: config.has("general.logging_level")
    ? config.get("general.logging_level")
    : "info",
  displayLoggerName: false,
  displayFilePath: "hidden"
});

export function createMessageFromJson(messages: any, isMainnet: boolean, type: MessageType, endpointUrl: string = ""): string {

  // Create Headermessage
  let headerMessage: string;
  switch (type) {
    case MessageType.organization:
      headerMessage = (isMainnet ? "Mainnet" : "Testnet") + " Organization Results:";
      break;
    case MessageType.api:
      headerMessage = (isMainnet ? "Mainnet" : "Testnet") + " Api results for: " + endpointUrl
      break;
    case MessageType.history:
      headerMessage = (isMainnet ? "Mainnet" : "Testnet") + " History results for: " + endpointUrl
      break;
    case MessageType.seed:
      headerMessage = (isMainnet ? "Mainnet" : "Testnet") + " P2P results for: " + endpointUrl
      break;
    default:
      headerMessage = "New Wax Pager message:"
  }

  // Add all messages to single string
  let message = "<b>" + headerMessage + "</b>"
  for (const key of Object.keys(messages)) {
    if (key !== undefined && messages[key] !== undefined) {
      message += "\n" + (messages[key] ? "✅" : "‼️") + key;
    }
  }
  return message;
}

export enum MessageType {
  organization,
  api,
  history,
  seed
}