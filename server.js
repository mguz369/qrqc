//************************************************************************//
// Server.js is designed to handle all of the webpage requests            //
// and responses                                                          //
//************************************************************************//

//************************************************************************
// Requires
//************************************************************************
var express     = require('express');
var favicon     = require('static-favicon');
var session     = require('express-session');
var bodyParser  = require('body-parser');
var path        = require('path');
var md5         = require('md5');
var mysql       = require('mysql');
var net         = require('net');
var nodemailer  = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var Cookies     = require('js-cookie');

var ejs  = require('ejs');

// Set up express
var app = express();
//app.engine('html', ejs.renderFile)
app.use( bodyParser.json() );

var transporter = nodemailer.createTransport(smtpTransport({
    service     : 'gmail',
    host        : 'smtp.gmail.com',
    port        : 587,    
    requireTLS  : true,
    secure      : true,
    logger      : true, // log to console
    debug       : true, // include SMTP traffic in the logs
    auth: {
        user: 'smartplant3@gmail.com',
        pass: 'Paulstra1'
    }
}));

String.prototype.format = function() {
    var args = arguments;
    this.unkeyed_index = 0;
    return this.replace(/\{(\w*)\}/g, function(match, key) {
        if (key === '') {
            key = this.unkeyed_index;
            this.unkeyed_index++
        }
        if (key == +key) {
            return args[key] !== 'undefined'
                ? args[key]
                : match;
        } else {
            for (var i = 0; i < args.length; i++) {
                if (typeof args[i] === 'object' && typeof args[i][key] !== 'undefined') {
                    return args[i][key];
                }
            }
            return match;
        }
    }.bind(this));
};
 
//************************************************************************
// DB query string formatting
//************************************************************************
String.prototype.formatSQL = function() {
    var args = arguments;					//arugemens is a keyword
    this.unkeyed_index = 0;
    return this.replace(/\{(\w*)\}/g, function(match, key) {
        if (key === '') {
            key = this.unkeyed_index;
            this.unkeyed_index++
        }
        if (key == +key) {
            return args[key] !== 'undefined'
                ? mysql.escape( args[key] )
                : match;
        } else {
            for (var i = 0; i < args.length; i++) {
                if (typeof args[i] === 'object' && typeof args[i][key] !== 'undefined') {
                    return mysql.escape( args[i][key] );
                }
            }
            return match;
        }
    }.bind(this));
}

//************************************************************************
// Deploy the webserver to listen to webpage requests
//************************************************************************
var myPort = 8090;
var server = app.listen(myPort, () => {
    var host = server.address().address;
    var port = server.address().port;
});


//************************************************************************
// Connect to the QRQC database
//************************************************************************
var connectionQRQC;
function ConnectToQRQC(){
    connectionQRQC = mysql.createConnection({
        host                : 'localhost',
        //host                : '172.24.253.4',
        user                : 'qrqc',
        password            : 'Paulstra1',
        database            : 'qrqc',
        multipleStatements  : true
    });

    //Establish connection
    connectionQRQC.connect((err) => {
        if(err){
            throw err;
            console.log("DB Connection Error - Retrying", err);
            setTimeout(ConnectToQRQC(), 2000);
        }
    });

    connectionQRQC.query('USE `qrqc`', function(err){
        if(err)
            console.log('Error connecting to `qrqc` - ',err);
        
        console.log('`qrqc` selected');
    });

    connectionQRQC.on('error', (err) => {
        console.log('DB Error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST')
            ConnectToQRQC();
        else 
            throw err;
    });
}//End ConnectToQRQC
ConnectToQRQC();


//************************************************************************
// Connect to smartplant database
//************************************************************************
var connectionSp;
function ConnectToSp(){
    connectionSp = mysql.createConnection({
        host                : 'localhost',
        //host                : '172.24.253.4',
        user                : 'ind_maint',
        password            : 'zJC2LKjN6XHq5ETX',
        database            : 'smartplant',
        multipleStatements  : true
    });

    //Establish connection
    connectionSp.connect((err) => {
        if(err){
            throw err;
            console.log("DB Connection Error - Retrying", err)
            setTimeout(ConnectToQRQC(), 2000);
        }
    });

    connectionSp.query('USE `smartplant`', function(err){
        if(err)
            console.log('Error connecting to `smartplant` - ',err);
        else
            console.log('`smartplant` selected');
    });

    connectionSp.on('error', (err) => {
        console.log('DB Error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST')
            ConnectToSp();
        else 
            throw err;
    });
}//End ConnectToQRQC
ConnectToSp();


//************************************************************************
// Login - This doesn't use HTTPS or TLS/SSL (yet)
// It only check if the user is authorized
//************************************************************************
app.post('/login_user', (req, res) => {
    var username = "{user}".format(req.body);
    var password = "{pass}".format(req.body);

    password = md5(password);
    var validate_user = ("SELECT * FROM `executive_login` WHERE `username` = '" + username + "' AND `password` = '" + password + "'").formatSQL(req.body);

    connectionSp.query(validate_user, (err, result) => {
        if (err) console.log(err);

        if(result.length > 0)
            res.send(JSON.stringify(1));
        else
            res.send(JSON.stringify(0));
    });
});


//************************************************************************
// Query any current alerts 
//************************************************************************
app.post('/show_current_alerts', (req, res) => {
    var select_dates = ("SELECT t1.`id`, DATE_FORMAT(t1.`deadline`, '%Y-%m-%d') AS deadline, DATE_FORMAT(t1.deadline, '%b-%d') AS `short`, t1.`term`, t1.`description`, t1.`owner`, t2.`id` AS post_it_id, t2.alert_type, t2.location " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1' AND `department` = 'Plant' ORDER BY t1.deadline ASC;");

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        res.send(JSON.stringify(result));
    });       
});

app.post('/show_mixing_alerts', (req, res) => {
    var select_dates = ("SELECT t1.`id`, DATE_FORMAT(t1.`deadline`, '%Y-%m-%d') AS deadline, DATE_FORMAT(t1.deadline, '%b-%d') AS `short`, t1.`term`, t1.`description`, t1.`owner`, t2.`id` AS post_it_id, t2.alert_type, t2.location " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1' AND `department` = 'Mixing' ORDER BY t1.deadline ASC;");

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        //console.log(result);
        res.send(JSON.stringify(result));
    });       
});

app.post('/show_auto_alerts', (req, res) => {
    var select_dates = ("SELECT t1.`id`, DATE_FORMAT(t1.`deadline`, '%Y-%m-%d') AS deadline, DATE_FORMAT(t1.deadline, '%b-%d') AS `short`, t1.`term`, t1.`description`, t1.`owner`, t2.`id` AS post_it_id, t2.alert_type, t2.location " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1' AND `department` = 'Automation' ORDER BY t1.deadline ASC;");

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        //console.log(result);
        res.send(JSON.stringify(result));
    });       
});

app.post('/show_jt_alerts', (req, res) => {
    var select_dates = ("SELECT t1.`id`, DATE_FORMAT(t1.`deadline`, '%Y-%m-%d') AS deadline, DATE_FORMAT(t1.deadline, '%b-%d') AS `short`, t1.`term`, t1.`description`, t1.`owner`, t2.`id` AS post_it_id, t2.alert_type, t2.location " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1' AND `department` = 'Jim' ORDER BY t1.deadline ASC;");

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        //console.log(result);
        res.send(JSON.stringify(result));
    });       
});

app.post('/show_cad_alerts', (req, res) => {
    var select_dates = ("SELECT t1.`id`, DATE_FORMAT(t1.`deadline`, '%Y-%m-%d') AS deadline, DATE_FORMAT(t1.deadline, '%b-%d') AS `short`, t1.`term`, t1.`description`, t1.`owner`, t2.`id` AS post_it_id, t2.alert_type, t2.location " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1' AND `department` = 'CP' ORDER BY t1.deadline ASC;");

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        //console.log(result);
        res.send(JSON.stringify(result));
    });       
});


//************************************************************************
// Pull data from the DB
// Get all data from post_it
// and select fields from post_it_id
//************************************************************************
app.post('/pull_qrqc_data', (req, res) => {
    var sql = ("SELECT `id`, `alert_type`, DATE_FORMAT(`date`, '%Y-%m-%d') AS `date`, `department`, `location`, `part`, `customer`, `recurrence`, `issue`, `cause`, `active` FROM `post_it` WHERE `id` = {id}; " +
               "SELECT t2.id, t2.post_it_id, t2.term, t2.description, t2.owner, DATE_FORMAT(t2.initial_date, '%Y-%m-%d') AS `initial_date`," +
               "DATE_FORMAT(t2.deadline, '%Y-%m-%d') AS `deadline`, DATE_FORMAT(t2.completed, '%Y-%m-%d') AS `completed`, t2.email_sent, t2.state " +
               "FROM `post_it` as t1 INNER JOIN `post_it_items` as t2 WHERE t1.id = t2.post_it_id AND t1.id = {id} ORDER BY t2.deadline AND t2.id ASC "
               ).formatSQL(req.body);


    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;
        
        //console.log(result);
        res.send(JSON.stringify(result));
    });
});    
app.post('/pull_jt_data', (req, res) => {
    var sql = ("SELECT `id`, `alert_type`, DATE_FORMAT(`date`, '%Y-%m-%d') AS `date`, `region`, `location`, `part`, `customer`, `recurrence`, `issue`, `cause`, `active` FROM `post_it` WHERE `id` = {id}; " +
               "SELECT t2.id, t2.post_it_id, t2.term, t2.description, t2.owner, DATE_FORMAT(t2.initial_date, '%Y-%m-%d') AS `initial_date`," +
               "DATE_FORMAT(t2.deadline, '%Y-%m-%d') AS `deadline`, DATE_FORMAT(t2.completed, '%Y-%m-%d') AS `completed`, t2.email_sent, t2.state " +
               "FROM `post_it` as t1 INNER JOIN `post_it_items` as t2 WHERE t1.id = t2.post_it_id AND t1.id = {id} ORDER BY t2.deadline ASC"
               ).formatSQL(req.body);


    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;
        
        //console.log(result);
        res.send(JSON.stringify(result));
    });
});    

//************************************************************************
// Write a new alert to the QRQC DB
//************************************************************************
app.post('/create_plant', (req, res) => {
    //Send the new QRQC Alert to the DB, info is in 2 
    var sql_create = ("INSERT INTO `post_it`(`alert_type`, `date`, `department`, `part`, `customer`, `active`) VALUES ({category}, CURRENT_DATE, 'Plant', '---', '---', '0'); SELECT LAST_INSERT_ID();"
                     ).formatSQL(req.body); 

    connectionQRQC.query(sql_create, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/create_mixing', (req, res) => {
    var sql_create = ("INSERT INTO `post_it`(`alert_type`, `date`, `department`, `part`, `customer`, `active`) VALUES ({category}, CURRENT_DATE, 'Mixing', '---', '---', '0'); SELECT LAST_INSERT_ID();"
                     ).formatSQL(req.body); 
   
    connectionQRQC.query(sql_create, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/create_auto', (req, res) => {
    var sql_create = ("INSERT INTO `post_it`(`alert_type`, `date`, `department`, `part`, `customer`, `active`) VALUES ({category}, CURRENT_DATE, 'Automation', '---', '---', '0'); SELECT LAST_INSERT_ID();"
                     ).formatSQL(req.body); 
   
    connectionQRQC.query(sql_create, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/create_jt', (req, res) => {
    var sql_create = ("INSERT INTO `post_it`(`alert_type`, `date`, `department`, `part`, `customer`, `active`) VALUES ({category}, CURRENT_DATE, 'Jim', '---', '---', '0'); SELECT LAST_INSERT_ID();"
                     ).formatSQL(req.body); 
   
    connectionQRQC.query(sql_create, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/create_cad', (req, res) => {
    var sql_create = ("INSERT INTO `post_it`(`alert_type`, `date`, `department`, `part`, `customer`, `active`) VALUES ({category}, CURRENT_DATE, 'CP', '---', '---', '0'); SELECT LAST_INSERT_ID();"
                     ).formatSQL(req.body); 
   
    connectionQRQC.query(sql_create, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

//************************************************************************
// Update any changes made to an existing alert
//************************************************************************
app.post('/update_post_it', (req, res) => {
    res.send(true);

    var sql_update = (
        "INSERT INTO `post_it`(`id`) VALUES ({post_id}) ON DUPLICATE KEY UPDATE " +
        "`alert_type` = {type}, `department` = {department}, `location` = {location}, `part` = {part}, `customer` = {customer}," +
        "`recurrence` = {recurrence}, `issue` = {i_desc}, `cause` = {c_desc}, `active` = {is_active};").formatSQL(req.body);

    connectionQRQC.query(sql_update, (err, result) => {
        if (err) throw err;
    });
});

app.post('/update_post_it_items', (req, res) => {
    res.send(true);

    var sql_update = (
        "INSERT INTO `post_it_items` VALUES ({item_id}, {post_id}, {term}, {term_descript}, {owner}, {starting}, {ending}, {completed}, {state}, '1', {is_active}) " +
        "ON DUPLICATE KEY UPDATE `term` = {term}, `description` = {term_descript}, `owner` = {owner}, `initial_date` = {starting}, `deadline` = {ending}, " +
        " `completed` = {completed}, `state` = {state}, `active` = {is_active};"
        ).formatSQL(req.body);

    connectionQRQC.query(sql_update, (err, result) => {
        if (err) throw err;
    });
});

app.post('/update_jt_post_it', (req, res) => {
    res.send(true);
    
    var sql_update = (
        "INSERT INTO `post_it`(`id`) VALUES ({post_id}) ON DUPLICATE KEY UPDATE " +
        "`alert_type` = {type}, `region` = {region}, `location` = {location}, `part` = {part}, `customer` = {customer}," +
        "`recurrence` = {recurrence}, `issue` = {i_desc}, `cause` = {c_desc}, `active` = {is_active};").formatSQL(req.body);

    connectionQRQC.query(sql_update, (err, result) => {
        if (err) throw err;
    });
});


//************************************************************************
// Grab parts numbers
//************************************************************************
app.post('/get_part_nums', (req, res) => {
    var sql = ("SELECT `number` FROM `part` ORDER BY `number`");

    connectionSp.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_jt_part_nums', (req, res) => {
    var sql = ("SELECT `number` FROM `part_exec` ORDER BY `number`");

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

//************************************************************************
// Grab customers
//************************************************************************
app.post('/get_customers', (req, res) =>{
    var sql = "SELECT `name` FROM `customers_plant`";

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_jt_customers', (req, res) =>{
    var sql = "SELECT `name` FROM `customers_exec`";

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});


//************************************************************************
// Grab users
//************************************************************************
app.post('/get_users', (req, res) => {
    var sql = ("SELECT `name` FROM `owner` WHERE `department` = {department}").formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_jt_users', (req, res) => {
    var sql = ("SELECT `name` FROM `owner_exec`").formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_cad_users', (req, res) => {
    var sql = ("SELECT `name` FROM `owner_cad`").formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});
//************************************************************************
// 1) Get the required email address based on the user
// 2) Create the email transporter to send the email
//************************************************************************
app.post('/get_email', (req, res) => {
    res.send(true);

    var sql = ("SELECT `email` FROM `owner_cad` WHERE `name` = {owner} AND `department` = {department}").formatSQL(req.body);
    var owner = "{owner}".formatSQL(req.body);
    var subject = "iQRQC Task: {issue}".formatSQL(req.body);
    var message = ("You have been assigned a task for QRQC:\n\n" +
                     "Location: {location}\nPart Number: {part}\nCustomer: {customer}" +
                     "\nIssue Description: {issue}" +
                     "\nAction to be Taken: {description}\nTask deadline is: {ending}").formatSQL(req.body);

    console.log(sql);
    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;
        
        SendEmail(owner, subject, result[0].email, message);
    });
});

app.post('/get_jt_email', (req, res) => {
    var sql = ("SELECT `email` FROM `owner_exec` WHERE `name` = {owner}").formatSQL(req.body);
    var owner = "{owner}".formatSQL(req.body);
    var subject = "iQRQC Task: {issue}".formatSQL(req.body);
    var message = ("You have been assigned a task for QRQC:\n\n" +
                     "Location: {location}\nPart Number: {part}\nCustomer: {customer}" +
                     "\nIssue Description: {issue}" +
                     "\nAction to be Taken: {description}\nTask deadline is: {ending}").formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;
    
        SendEmail(owner, subject, result[0].email, message);
    });
});


function SendEmail(owner, subject, address, message){
    var recipient = ('%s <%s>', owner, address)
    //var message = ('{email_text}').format(req.body);

    var msg_body = {
        from    : 'iQRQC automated email',
        to      : recipient,
        subject : subject, 
        text    : message
    };

    transporter.sendMail(msg_body, (error, info) => {
        if (error) {
            console.log('Error occurred');
            console.log(error.message);
            return;
        }
        console.log('Message sent successfully!');
        //console.log('Server responded with "%s"', info.response);
    });

    //console.log("\n\nsent email");
}

/*app.post('/send_email', (req, res) => {
    var recipient = ('{owner} <{email_addr}>').format(req.body);
    var message = ('{email_text}').format(req.body);

    var message = {
        from    : 'iQRQC automated email',
        to      : recipient,
        subject : 'iQRQC Action Notification', 
        text    : message
    };

    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.log('Error occurred');
            console.log(error.message);
            return;
        }
        console.log('Message sent successfully!');
        //console.log('Server responded with "%s"', info.response);
    });

    //console.log("\n\nsent email");
});*/


//************************************************************************
// Get paths setup, load css, js, etc for the browser
//************************************************************************
var dir_path = 'public/';
var admin_path = 'public/admin/';
var each = ["images", "css", "js", "datetimepicker", "jquery"];
//var each = ['flot','reveal.js','snap','sparkline','d3','work_instructions', 'work_videos']

for (var i = 0; i < each.length; i++){
        app.use('/' + each[i], express.static(path.join(__dirname, dir_path + '/' + each[i])));
}

app.use(favicon(path.join(__dirname, dir_path + '/images' + '/favicon.ico')));

app.get('/', (req, res) => {
    if(req.path == '/'){
        //console.log('Cookies', req.cookies);
        res.locals.query = req.query;
        res.sendFile(path.join(__dirname, dir_path + 'view_plant.html'));
    }
    else{
        res.sendFile(path.join(__dirname, dir_path + req.path));
    }   
});

//Views and login 
app.get('/view',        (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/disabled_view.html')); });
app.get('/view2',       (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/disabled_exec.html')); });
app.get('/view_mixing', (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/view_mixing.html')); });
app.get('/view_auto',   (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/view_auto.html')); });
app.get('/view_exec',   (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/view_jt.html')); });
app.get('/login',       (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/login.html')); });

//plant index and login
app.get('/index',       (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/index_plant.html')); });
app.get('/create',      (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/create.html')); });

//Mixing index and create
app.get('/index_mixing',  (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/index_mixing.html')); });
app.get('/create_mixing', (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/create_mixing.html')); });

//Automation index and create
app.get('/index_auto',  (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/index_auto.html')); });
app.get('/create_auto', (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/create_auto.html')); });

//Todoroff's island
app.get('/index_exec',  (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/index_jt.html')); });
app.get('/create_exec', (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/create_jt.html')); });

 
//Cadillac's island
app.get('/vcad',  (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/view_cad.html')); });
app.get('/icad',  (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/index_cad.html')); });
app.get('/ccad',  (req, res) => { res.sendFile(path.join(__dirname, admin_path + '/create_cad.html')); });