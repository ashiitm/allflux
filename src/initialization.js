const fs = require('fs');
const request = require('request');
function initialization(event){
    if(fs.existsSync(event.currentIntent.name)){
        console.log("intent exists");
		if(fs.existsSync(event.currentIntent.name + "/intent_model.json")){
			console.log("intent model json exists");
		}
		if(fs.existsSync(event.currentIntent.name + "/domain_model.json")){
			console.log("domain model json exists");
		}
		if(fs.existsSync(event.currentIntent.name + "/responses.json")){
			console.log("responses json exists");
		}
		var intent_file = event.currentIntent.name + "/" + event.currentIntent.name.replace(/\.?([A-Z])/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "") + ".js"
		if(fs.existsSync(intent_file)){
			console.log("intent model js exists");
			var b_logic_file = require(process.cwd() + "/" + intent_file);
			var slot_function = "doctor_name" + "_validate";
			console.log(slot_function);
			var sessionAttributes = {}
			var dialogAction = {}
			if(b_logic_file[slot_function](event.currentIntent.slots.doctor_name)){
				dialogAction.type = "Delegate";
				return {
					sessionAttributes,
					dialogAction
				}
			}
			else{
				dialogAction.message = "Sorry there is no doctor by that name, please re-enter";
				dialogAction.slots = event.currentIntent.slots;
				dialogAction.slotToElicit = "doctor_name"
				dialogAction.type = "ElicitSlot";
				return {
					sessionAttributes,
					dialogAction
				}
			}
		}
    }
    else{
		if(process.env.LOCAL_HOST){
			request({url: process.env.LOCAL_HOST, method: "POST", json: event}, function(err, res, body){
				console.log("finally in lambda:" + JSON.stringify(body));
				return JSON.stringify(body);
			})
		}
		else{
			console.log("should create local file");
			return event;
		}
    }
}

module.exports = initialization;
