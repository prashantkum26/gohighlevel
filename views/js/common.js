$(document).ready(function(){
    $("#getFreeSlots, #createEvent, #getEvents").click(function(){
        let date = $("#date").val();
        let timezone = $("#timezone").val();
        console.log(this.name, date, timezone)
        if (date != "" && date != null && timezone != "" && timezone != null) {
            if (this.name === "getFreeSlots") {
                location.href = `/freeslots?date=${date}&timezone=${timezone}`;
            }
            if (this.name === "getEvents") {
                location.href = `/getevents?date=${date}&timezone=${timezone}`;
            }
            if (this.name === "createEvent") {
                location.href = `/selectslot?date=${date}&timezone=${timezone}`;
            }
        } else {
            alert("Please select date and timezone properly.")
        }
        
    })
});

function getParamValue(name) {
    if (name != null && name != "" && name.replace(/\s+/g, '') != "") {
        var url_string = window.location.href
        var url = new URL(url_string);
        var c = url.searchParams.get(name);
        return c;
    } else {
        return null;
    }
    
}


function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
}

