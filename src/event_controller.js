
'use strict';

exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};

function dispatch (intentRequest, callback) {
    // console.log(router.intents[0].intentName);
    console.log('intentrequest in  dispatch method :)'+JSON.stringify(intentRequest));
    var sessionAttributes = intentRequest.sessionAttributes;
    var slots = intentRequest.currentIntent.slots;
    var intentName =  intentRequest.currentIntent.name; 
    var inputRequest= intentRequest.inputTranscript;
    
    var processed_state = process_state.getProcessState(intentRequest);
    if(processed_state.filled_slots){
        sessionAttributes.filledSlots = JSON.stringify(processed_state.filled_slots);
    }
    console.log('filled slots are '+ sessionAttributes.filledSlots);
    var intentConfirmStatus = intentRequest.currentIntent.confirmationStatus;
    console.log("intentConfirmStatus "+intentConfirmStatus);
    if(intentConfirmStatus && intentConfirmStatus != "None"){
        if(intentConfirmStatus == "Denied"){
            console.log(" denied stuff");
            if(deninedConfirmationHandledIntentsList.indexOf(intentName) <= -1)
                callback(elicitIntent(sessionAttributes, {'contentType': 'PlainText','content':"hello there"}));
        }
    }
    
    console.log('intent is '+intentName);
    switch(intentName) {
        case 'BookAppointment':
            console.log('going to book_appointment');
            book_appointment.getNextAction(intentRequest,slots, sessionAttributes, intentName, processed_state.fresh_slots, function(action) {
                takeAction(action, slots, sessionAttributes,intentRequest, callback);
            });
            break;
        case 'RegisterPatient':
            register_patient.getNextAction(intentRequest,slots, sessionAttributes, intentName, processed_state.fresh_slots, function(action) {
                takeAction(action, slots, sessionAttributes,intentRequest, callback);
            });
            break;
            
        case 'CancelAppointment':
            cancel_appointment.getNextAction(intentRequest,slots, sessionAttributes, intentName, processed_state.fresh_slots, function(action) {
                sessionAttributes.session_var = action.session_var;
                console.log(sessionAttributes);
                takeAction(action, slots, sessionAttributes,intentRequest, callback);
            });
            break;
        
        case 'ModifyAppointment':
            modify_appointment.getNextAction(intentRequest,slots, sessionAttributes, intentName, processed_state.fresh_slots, function(action) {
                takeAction(action, slots, sessionAttributes,intentRequest, callback);
            });
            break;
            
        case 'EnquireAppointment':
            enquire_appointment.getNextAction(intentRequest,slots, sessionAttributes, intentName, processed_state.fresh_slots, function(action) {
                takeAction(action, slots, sessionAttributes,intentRequest, callback);
            });            
            break;
        case 'SearchForDoctor':
            search_for_doctor.getNextAction(intentRequest,slots, sessionAttributes, intentName, processed_state.fresh_slots, function(action) {
                takeAction(action, slots, sessionAttributes,intentRequest, callback);
            });
            break;
        case 'NotSure': 
            not_sure.getNextAction(intentRequest, intentName, function(action){
                takeAction(action, slots, sessionAttributes, intentRequest, callback);
            });
            break;
        case 'AlternateTimeSlot': 
            alternate_time_slot.getNextAction(intentRequest, intentName, function(action){
                takeAction(action, slots, sessionAttributes, intentRequest, callback);
            });
            break;
        case 'RescheduleAppointment': 
            reschedule_appointment.getNextAction(intentRequest,slots, sessionAttributes, intentName, processed_state.fresh_slots, function(action) {
                sessionAttributes.session_var = action.session_var;
                console.log(sessionAttributes);
                takeAction(action, slots, sessionAttributes,intentRequest, callback);
            });
            break;
        default:
            // TODO
    }
}



function takeAction(action, slots, sessionAttributes,intentRequest, callback) {
    console.log('Action: '+ JSON.stringify(action));
    switch(action.value) {
        case 'ElicitIntent':
            console.log('Action: ElicitIntent');
            sessionAttributes.context = JSON.stringify({});
            sessionAttributes.filledSlots = JSON.stringify([]);
            callback(elicitIntent(sessionAttributes, {'contentType': 'PlainText','content': action.message}));
            // callback(elicitIntent(sessionAttributes, {'type': 'PlainText','group': 0 ,'value': action.message}));
            break;
        case 'ElicitSlot':
            console.log('Action: ElicitSlot');
            var rtn_obj = elicitSlot(sessionAttributes, action.slotToElicit, action.slots, {'contentType': 'PlainText', 'content': action.message}, action.intentName, action.responseCard, intentRequest);
            // var rtn_obj = elicitSlot(sessionAttributes, action.slotToElicit, slots, {'type': 'PlainText','group': 0 ,'value': action.message}, action.intentName);
            callback(rtn_obj);
            break;
        case 'ConfirmIntent':
            console.log('Action: ConfirmIntent');
            var rtn_obj = confirmIntent(sessionAttributes,  action.slots, {'contentType': 'PlainText', 'content': action.message}, action.intentName, action.dialogState);
            // var rtn_obj = confirmIntent(sessionAttributes,  slots, {'type': 'PlainText','group': 0 ,'value': action.message}, action.intentName);
            callback(rtn_obj);
            break;
        case 'Delegate':
            console.log('Action: Delegate');
            var rtn_obj = delegate(sessionAttributes,slots, action.possibleSlotToElicit, intentRequest.currentIntent.name);
            callback(rtn_obj);
            break;
        case 'Close':
            console.log('Action: Close');
            // TODO
            break;
        default: 
            console.log('Action: Default');
            var rtn_obj = delegate(sessionAttributes,slots, action.possibleSlotToElicit, intentRequest.currentIntent.name);
            callback(rtn_obj);
    }
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes: sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState: fulfillmentState,
            message: message,
        },
    };
}

function elicitIntent(sessionAttributes, message) {
    // var message_arr = message_multi(message);
    // message.content = message.content + "@newline Is there anything I can assist you with? $$Book an Appointment##Cancel Appointment##Show my appointments$$";
    sessionAttributes.context = JSON.stringify({});
    sessionAttributes.filledSlots = JSON.stringify([]);
    return {
      sessionAttributes: sessionAttributes,
      dialogAction: {
          type: 'ElicitIntent',
          message: message
      }
    };
}

function delegate(sessionAttributes, slots, possibleSlotToElicit, intentName){
    loadCurrentContext(sessionAttributes, slots, possibleSlotToElicit, intentName, 'delegate');
    return {
        sessionAttributes: sessionAttributes,
        dialogAction: {
            type: "Delegate",
            slots: slots
        }
    };
}

function elicitSlot(sessionAttributes, slotToElicit, slots, message,intentName, responseCard, intentRequest) {
    console.log("trying to elicit "+slotToElicit+ " slot");
    // var message_arr = message_multi(message);
    loadCurrentContext(sessionAttributes, slots, slotToElicit, intentRequest.currentIntent.name, 'elicitSlot');
    var nextState = {
    sessionAttributes: sessionAttributes,
      dialogAction: {
          type: 'ElicitSlot',
          intentName: intentName,
          slotToElicit: slotToElicit,
          slots: slots,
          message: message
      },
    };
    if(responseCard)
        nextState.dialogAction.responseCard = responseCard;
    console.log('Elicit slot nextState: '+ JSON.stringify(nextState));
    return nextState;
}

function confirmIntent(sessionAttributes,  slots, message,intentName, dialogState){
   // sessionAttributes = {};
    var state = dialogState? dialogState: 'ConfirmIntent';
    loadCurrentContext(sessionAttributes, slots, null, intentName, state);
    var dialogStateObj = {
       sessionAttributes: sessionAttributes,
        dialogAction: {
            type: 'ConfirmIntent',
            intentName: intentName,
            slots: slots,
            message: message
        }     
    };
    console.log('Dialoge State: '+ JSON.stringify(dialogStateObj));
    return dialogStateObj;
   
}

function loadCurrentContext(sessionAttributes, slots, slotToElicit, intentName, dialogState) {
    var oldContext = sessionAttributes.context;
    var primaryContext = null;
    if(oldContext) {
        oldContext = JSON.parse(sessionAttributes.context);
        primaryContext = oldContext.primaryContext;
    }
    var context = {};
    context.previousIntentName = intentName;
    context.previousSlots = slots;
    context.previousSlotToElicit = slotToElicit;
    context.previousDialogState = dialogState;
    context.primaryContext = primaryContext;
    sessionAttributes.context = JSON.stringify(context);
    
}

function isValid(value){
    if(value != null && value != '' && value != undefined){
        return true;
    }else{
        return false;
    }
}
