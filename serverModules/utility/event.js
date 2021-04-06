var admin = require("firebase-admin");
let config = require("./../config");
var db = require("./../db/firebase.js");
exports.getFreeSlots = async (req, res, next) => {
    try {
        var errors = [];
        let query = req.query;
        if (!query.date) {
            errors.push('date is missing.');
        }
        if (errors.length) {
            return res.status(400).send({
                message: errors.join(', '),
                data: { status: "fail", message: `Server Issue - \nError : ${ errors.join(', ') }` }
            });
        } else {
            var dt = query.date;
            var date = query.date;
            var userSelectedTimezone = query.timezone;
            var timezone = "";
            // Start
            console.log(":: DEBUG ::", dt);
            let scheduledData = [];
            let colData = [];
            let scheduledTimeZone = "";

            var starttime = config.startHours;
            var interval = config.duration;
            var endtime = config.endHours;
            var timeslots = [];
            if(userSelectedTimezone != null && userSelectedTimezone != "") {
                timezone = userSelectedTimezone;
            } else {
                timezone = config.timezone;
            }

            let d = new Date();
            console.log('new Date() datetime: ' + d);
            let modifiedDate = d.toLocaleString("en-US", { timeZone: timezone });
            console.log(" Time Zone = " , timezone);
            console.log('Modified datetime: ' + (modifiedDate));
              
                let appointmentRef = db.getCollection("appointment");
                let docRef = await appointmentRef.doc(dt);
                docRef.get()
                .then(async (doc) => {
                    if (doc.exists) {
                        colData = doc.data();
                          
                        if (colData['scheduled'] != undefined) {
                            scheduledData = colData['scheduled'];
                            scheduledTimeZone = colData['timezone'] != undefined ? colData['timezone'] : "";
                        }

                        console.log("Collection data = ", scheduledData, " :::: Time zone = ", scheduledTimeZone);
  
                        let exist = await compareAppointment(scheduledData, scheduledTimeZone, starttime, timezone);
                        timeslots = [{st: starttime, isScheduled: exist}];
                        
                        while (starttime != endtime) {
                            starttime = addMinutes(starttime, interval);
                            let exist = await compareAppointment(scheduledData, scheduledTimeZone, starttime, timezone);
                            timeslots.push({st: starttime, isScheduled: exist});
                        }
                        res.status(200).send({slots: timeslots})
                        res.end();

                    } else {

                        timeslots = [{st: starttime, isScheduled: false}];
                        
                        while (starttime != endtime) {
                            starttime = addMinutes(starttime, interval);
                            timeslots.push({st: starttime, isScheduled: false});
                        }

                        res.status(200).send({slots: timeslots})
                        res.end();
                    }
                });

            //End
        }
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            message: 'Required Fields Missing.',
            data: { status: "fail", message: `Get Free Slots Failed - ${ e }.` }
        });
    }
}
exports.createEvent = async (req, res, next) => {
    try {
        var status = "success";
        var errors = [];
        let body = req.body;
        if (!body.selectedSlot) {
            errors.push('Create Slot - Try After Sometime.');
        }
        if (!body.date) {
            errors.push('Date is missing.');
        }
        if (errors.length) {
            return res.status(400).send({
                message: errors.join(', '),
                data: { status: "failed", message: `Server Issue - \nError : ${ errors.join(', ') }` }
            });
        } else {
            // Start
            let slotStr = body.selectedSlot.split(":");
            let date = new Date(body.date);
            date.setHours(slotStr[0]);
            date.setMinutes(slotStr[1]);
            let startTime = admin.firestore.Timestamp.fromDate(new Date(date));
            const arrayUnion = admin.firestore.FieldValue.arrayUnion;

            console.log(startTime)
            const data = {
                'scheduled':[{
                    email: body.email,
                    name: body.name,
                    phone: body.phone,
                    startTime: startTime
                }],
                'timezone': body.timeZone
            };
            let appointmentRef = db.getCollection("appointment");
            let docRef = await appointmentRef.doc(body.date);
            docRef.get()
            .then(async (doc) => {
                if (doc.exists) {
                    console.log(":: DEBUG :: Document Exists.");
                    checkEmailPhoneExistance(docRef, data.scheduled[0], function (err, emailPhoneExist) {
                        if (err != null) {
                            //Throw error
                        }

                        console.log(":: DEBUG :: - emailPhoneExist = ", emailPhoneExist);
                        if (emailPhoneExist == false) {
                            docRef.update({scheduled: arrayUnion(data.scheduled[0])});
                        } else {
                            status = "failed"
                        }

                        res.status(200).send({status: status, data: data})
                        res.end();

                    })
                    
                } else {
                    console.log(":: DEBUG :: Document Not Exists.");
                    console.log(":: DEBUG :: Start Document creation :: Name = ", body.date);
                    docRef.set(data);
                    console.log(":: DEBUG :: Document Created..");
                    res.status(200).send({status: status, data: data})
                    res.end();
                }
            })
            .catch((error) => {
                console.log(":: ERROR_DEBUG ::", error);
                status = "failed";

                res.status(400).send({status: status, data: data})
                res.end();
            });

            //End
        }
    } catch (e) {
        console.log(e)
        return res.status(400).send({
            message: 'Required Fields Missing.',
            data: { status: "failed", message: `Create Event Failed - ${ e }.` }
        });
    }
}

exports.getEvents = async (req, res, next) => {
    try {
        var errors = [];
        let query = req.query;
        if (!query.date) {
            errors.push('Date is missing.');
        }
        if (errors.length) {
            return res.status(400).send({
                message: errors.join(', '),
                data: { status: "fail", message: `Server Issue - \nError : ${ errors.join(', ') }` }
            });
        } else {
            //Start
            var dt = query.date;
            console.log(":: DEBUG ::", dt);
            let scheduledData = [];
            let scheduledTimeZone = "";
            
            let appointmentRef = db.getCollection("appointment");
                let docRef = await appointmentRef.doc(dt);
                docRef.get()
                .then(async (doc) => {
                    if (doc.exists) {
                        colData = doc.data();
                          
                        if (colData['scheduled'] != undefined) {
                            scheduledData = colData['scheduled'];
                            scheduledTimeZone = colData['timezone'] != undefined ? colData['timezone'] : "";
                        }

                        scheduledData.filter( function(value, index, array) {
                            if (value["startTime"] && value["startTime"].toDate()) {
                                let date = value["startTime"].toDate();
                                date.toLocaleString("en-US", { timeZone: scheduledTimeZone });
                                let min = date.getMinutes();
                                let hr = date.getHours();
                                // console.log(":: Date, min, hr ::", date, min, hr);
                                // console.log(value['startTime'], " :::: ", `${hr}:${min}:00`)        
                                value['startTime'] = `${hr}:${min} ${hr >= 12 ? "PM" : "AM"}`
                            }
                            //console.log(":: DEBUG :: (compareAppointment) => ", value.toDate())
                        });
                        console.log(":: DEBUG :: scheduledData = ", scheduledData);
                        //End
                        res.status(200).send({bookedSlots: scheduledData})
                        res.end();
                    } else {
                        res.status(200).send({bookedSlots: scheduledData})
                        res.end();
                    }
                });
            // console.log("Collection data = ", scheduledData, " :::: Time zone = ", scheduledTimeZone);
            
            
        }
    } catch (e) {
        return res.status(400).send({
            message: 'Required Fields Missing.',
            data: { status: "fail", message: `Get Event Details Failed - ${ e }.` }
        });
    }
}


function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function addMinutes(time, minutes) {
    var date = new Date(new Date('01/01/2015 ' + time).getTime() + minutes * 60000);    
    var tempTime = ((date.getHours().toString().length == 1) ? '0' + date.getHours() : date.getHours()) + ':' +
      ((date.getMinutes().toString().length == 1) ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
      ((date.getSeconds().toString().length == 1) ? '0' + date.getSeconds() : date.getSeconds());
    return tempTime;
}

async function compareAppointment(scheduledData, scheduledTimeZone, startT, userSelectedTimezone) {
    console.log(" ::::START:::: ");
    let dtString = startT.split(":");
    var d = new Date(new Date().setHours(dtString[0]));
    d = new Date(new Date(d).setMinutes(dtString[1]))
    // console.log("Date :1: ", d)
    d.toLocaleString("en-US", { timeZone: scheduledTimeZone });
    // console.log("Date :2: ", d)
    let starttime = d;
    let sm = starttime.getMonth();
    let sy = starttime.getFullYear();
    let shr = starttime.getHours();
    let smin = starttime.getMinutes();
    var exist = false;
    // console.log(sm, sy, shr, smin);
    scheduledData.filter( function(value, index, array) {
        console.log("Value = ", value);
        if (value["startTime"] && value["startTime"].toDate()) {
            
            let date = value["startTime"].toDate();
            // console.log("Date :3: ", date)
            date.toLocaleString("en-US", { timeZone: scheduledTimeZone });
            // console.log("Date :4: ", date)
            let min = date.getMinutes();
            let hr = date.getHours();
            // console.log("::", date, min, hr);

            console.log(shr, hr, smin, min)

            if (shr == hr && smin == min) {
                exist = true;
            }
        }
        //console.log(":: DEBUG :: (compareAppointment) => ", value.toDate())
    });
    
    console.log(" ::::END:::: ", exist);   
    return exist;
}

async function checkEmailPhoneExistance (docRef, data, callback) {
    let scheduledData = [];
    let colData = [];
    let scheduledTimeZone = "";
    let isExist = false;
    console.log(data['email'])
    docRef.get()
        .then(async (doc) => {
            colData = doc.data();
            if (colData['scheduled'] != undefined) {
                scheduledData = colData['scheduled'];
            }
            
            scheduledData.filter( function(value, index, array) {
                if (value["email"] && value["phone"]) {
                    let email = value["email"];
                    let phone = value["phone"];
                    console.log(":: DEBUG :(checkEmailPhoneExistance): Result = ", email, data['email'], phone, data['phone']);
                    if (email == data['email'] || phone == data['phone']) {
                        isExist = true;
                    }
                }
            });

            callback(null, isExist)
            
        })
}