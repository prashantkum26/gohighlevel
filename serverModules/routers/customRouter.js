const event = require('./../utility/event.js');

exports.routesConfig = (app) => {
    console.log("routesConfig =(app) ...");
    app.get('/getFreeSlots', [
        event.getFreeSlots
    ]);
    app.post('/registerEvent', [
        event.createEvent
    ]);
    app.get('/getEventList', [
        event.getEvents
    ]);
}