//************************************************************************//
// Server.js is designed to handle all of the webpage requests            //
// and responses                                                          //
//************************************************************************//

//************************************************************************
// Requires
//************************************************************************
var express     = require('express');
var path        = require('path');
var bodyParser  = require('body-parser');
var mysql       = require('mysql');
var net         = require('net');
var favicon     = require('static-favicon');

var app = express();
app.use( bodyParser.json() );
 
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
// Fetch other pages
//************************************************************************
app.get('/create.html', (req, res) => {
    res.sendFile(path.join(__dirname, dir_path + '/create.html'));
});
app.get('/mixing.html', (req, res) => {
    res.sendFile(path.join(__dirname, dir_path + '/mixing.html'));
});
app.get('/mixing_alert.html', (req, res) => {
    res.sendFile(path.join(__dirname, dir_path + '/mixing_alert.html'));
});
app.get('/incomplete.html', (req, res) => {
    res.sendFile(path.join(__dirname, dir_path + '/incomplete.html'));
});

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
        host                : '172.24.253.4',
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
        host                : '172.24.253.4',
        user                : 'ind_maint',
        password            : 'zJC2LKjN6XHq5ETX',
        database            : 'smartplant',
        multipleStatements   : true
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
// Query any current alerts 
//************************************************************************
app.post('/show_current_alerts', (req, res) => {
    var select_dates = ("SELECT t1.id, DATE_FORMAT(t1.deadline, '%Y-%m-%d') AS deadline, t1.term, t2.id AS post_it_id, t2.alert_type, t2.location, t2.issue " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1';");

    var current_date = " ";

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        res.send(JSON.stringify(result));
    });       
});


app.post('/show_mixing_alerts', (req, res) => {
    var select_dates = ("SELECT t1.id, DATE_FORMAT(t1.deadline, '%Y-%m-%d') AS deadline, t1.term, t2.id AS post_it_id, t2.alert_type, t2.location, t2.issue " +
        "FROM `post_it_items` AS t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t2.`department` = 'Mixing' AND t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1'; ");

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        res.send(JSON.stringify(result));
    });       
});


app.post('/show_incomplete_alerts', (req, res) => {
    var select_dates = ("SELECT t1.id, t1.term, t2.id AS post_it_id, t2.alert_type, t2.location, t2.issue " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1';");

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
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
               "SELECT t2.id, t2.post_it_id, t2.term, t2.description, t2.owner, " +
               "DATE_FORMAT(t2.initial_date, '%Y-%m-%d') AS `initial_date`, DATE_FORMAT(t2.deadline, '%Y-%m-%d') AS `deadline`, DATE_FORMAT(t2.completed, '%Y-%m-%d') AS `completed`, t2.state " +
               "FROM `post_it` as t1 INNER JOIN `post_it_items` as t2 WHERE t1.id = t2.post_it_id AND t1.id = {id}"
               ).formatSQL(req.body);

    console.log(sql);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(JSON.stringify(result));
    });
});    


//************************************************************************
// Write a new alert to the QRQC DB
//************************************************************************
app.post('/create_post_it', (req, res) => {
    //Send the new QRQC Alert to the DB, info is in 2 
    
    var sql_create = ("INSERT INTO `post_it`(`date`, `active`) VALUES (CURRENT_DATE, '0'); SELECT LAST_INSERT_ID();").formatSQL(req.body); 
   
    //console.log("SQL: ", sql_create);
    connectionQRQC.query(sql_create, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});


//************************************************************************
// Update any changes made to an existing alert
//************************************************************************
app.post('/update_post_it', (req, res) => {
	
    var sql_update = (
        "INSERT INTO `post_it`(`id`) VALUES ({post_id}) ON DUPLICATE KEY UPDATE " +
        "`alert_type` = {type}, `department` = {department}, `location` = {location}, `part` = {part}, `customer` = {customer}," +
        "`recurrence` = {recurrence}, `issue` = {i_desc}, `cause` = {c_desc}, `active` = {is_active};").formatSQL(req.body);

    console.log("Update into POST_IT: ", sql_update);
    connectionQRQC.query(sql_update, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});


app.post('/update_post_it_items', (req, res) => {
    var sql_update = (
        "INSERT INTO `post_it_items`(`id`, `post_it_id`, `term`, `description`, `owner`, `initial_date`, `deadline`, `completed`, `state`, `active`) " +
        "VALUES ({item_id}, {post_id}, {term}, {term_descript}, {owner}, {starting}, {ending}, {completed}, {state}, {is_active}) " +
        "ON DUPLICATE KEY UPDATE `term` = {term}, `description` = {term_descript}, `owner` = {owner}, `initial_date` = {starting}, `deadline` = {ending}, " +
        " `completed` = {completed}, `state` = {state}, `active` = {is_active};"
        ).formatSQL(req.body);

    console.log("Update into Items: %s\n", sql_update);
    connectionQRQC.query(sql_update, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});


app.post('/get_part_nums', (req, res) => {
    var sql = ("SELECT `number` FROM `smartplant`.`test_part`");

    connectionSp.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_customers', (req, res) =>{
    var sql = "SELECT `name` FROM `customer`";

    connectionSp.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_users', (req, res) => {
    var sql = "SELECT `name` FROM `user`";

    connectionSp.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});


app.post('/mixing_alerts', (req, res) => {
    var sql = "SELECT * FROM `post_it` WHERE `department` = 'mixing'";

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});
//************************************************************************
// Get paths setup, load css, js, etc for the browser
//************************************************************************
var dir_path = 'public/';
var each = ["images", "css", "js", "datetimepicker"];
//var each = ['flot','reveal.js','snap','sparkline','jquery','d3','work_instructions', 'work_videos']
for (var i = 0; i < each.length; i++){
        app.use('/' + each[i], express.static(path.join(__dirname, dir_path + '/' + each[i])));
}

app.use(favicon(path.join(__dirname, dir_path + '/images' + 'favicon.ico')));

app.get('/', (req, res, next) => {
    if(req.path == '/'){
        res.locals.query = req.query;
        res.sendFile(path.join(__dirname, dir_path + 'index.html'));    
    }
    else{
        res.sendFile(path.join(__dirname, dir_path + req.path));
    }   
});