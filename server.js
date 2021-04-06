var custom_router = require("./serverModules/routers/customRouter.js");
var config = require("./serverModules/config.js");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

let fb = require("./serverModules/db/firebase.js");

const app = express();
const cors = require('cors')
app.use(cors())
app.use(bodyParser.json());
app.use(express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');  // Set views (index.html) to root directory
app.engine('html', ejs.renderFile);     // Default for express is Jade as the rendering engine. Change that to EJS for HTML over JADE
app.use(bodyParser.json());             // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({// to support URL-encoded bodies
    extended: true
}));

app.use((req, res, next) => {
    console.log("::Calling Server....::")
    res.header('Access-Control-Allow-Origin', '*'); // It  will allow requests from any origin.
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    console.log("Req::", req.method, req.body, req.params, req.query);
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    } else {
        return next();
    }
});

app.get('/freeslots', (req, res) => res.render('freeslots.html'));
app.get('/getevents', (req, res) => res.render('getevents.html'));
app.get('/createevent', (req, res) => res.render('createevent.html'));
app.get('/selectslot', (req, res) => res.render('selectslot.html'));
app.get('/', (req, res) => res.render('index.html'));

app.post("/test", (req, res) => {
    res.status(200).send({
        data : req.body
    });
});

custom_router.routesConfig(app);

app.listen(config.port);
console.log("Listen PORT: ", config.port);

try {

} catch (e) {
    console.log("ERROR :: ", new Date(), e); 
}
