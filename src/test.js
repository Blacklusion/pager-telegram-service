"use strict";
exports.__esModule = true;
var array = new Array();
console.log(array.length);
array.push(null);
console.log(array.length);
array.push(undefined);
console.log(array.length);
array = array.filter(function (message) { return message; });
console.log(array.length);