import {log} from "util";
import {getMetadataArgsStorage} from "typeorm";

let array: Array<string> = new Array<string>();

console.log(array.length)
array.push(null);
console.log(array.length)
array.push(undefined)
console.log(array.length)

array = array.filter(message => message)
console.log(array.length)
