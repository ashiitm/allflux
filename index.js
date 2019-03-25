'use strict'
const initialization = require('./src/initialization.js');
const response_dispatcher = require('./src/response_dispatcher.js');
global.request = require('request');

function allflux(){
	return {
		initialization: initialization,
		response_dispatcher: response_dispatcher
	}
}


module.exports = allflux();

