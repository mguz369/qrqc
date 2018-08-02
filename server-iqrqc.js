//************************************************************************//
// Server.js is designed to handle all of the webpage requests            //
// and responses                                                          //
//************************************************************************//

//************************************************************************
// Requires
//************************************************************************
var ejs        = require('ejs');
var express    = require('express');
var favicon    = require('static-favicon');
var session    = require('express-session');
var bodyParser = require('body-parser');
var path       = require('path');
var md5        = require('md5');
var mysql      = require('mysql');
var net        = require('net');
var nodemailer = require('nodemailer');
var Cookies    = require('js-cookie');



// Set up express
var app = express();
app.use( bodyParser.json() );

// app.use(function(req, res, next){
//     res.status(404);

//     //respond with html page
//     if(req.accepts('html')){
//         res.render('404', { url: req.ur });
//         return;
//     }

//     // respond with json
//     if (req.accepts('json')) {
//         res.send({ error: 'Not found' });
//         return;
//     }

//     // default to plain-text. send()
//     res.type('txt').send('Not found');
// })

//************************************************************************
// Lotus Notes connection
//************************************************************************
var transporter = nodemailer.createTransport({
    host : '10.36.96.206',
    port : 25,
    requireTLS : false,
    secure: false,
});

transporter.verify(function(error, success) {
   if (error) {
        console.log(error);
   } else {
        console.log('Lotus is ready to take our messages');
   }
});


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
    var args = arguments;                   //arugemens is a keyword
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
    //connectionQRQC = mysql.createConnection({
    connectionQRQC = mysql.createPool({
        connectionLimit     : 10,
        //host                : '172.24.253.4',
        host                : 'localhost',
        user                : 'qrqc',
        password            : 'Paulstra1',
        database            : 'qrqc',
        multipleStatements  : true
    });

    connectionQRQC.query('USE `qrqc`', function(err){
        if(err)
            console.log('Error connecting to `qrqc` - ',err);
        
        console.log('connected to DB');
    });

    connectionQRQC.on('error', (err) => {
        console.log('DB Error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST'){
            console.log('DB Connection closed by database. Reconnecting');
            ConnectToQRQC();
        }
        else 
            throw err;
    });
}//End ConnectToQRQC
ConnectToQRQC();


//************************************************************************
// Login - This doesn't use HTTPS or TLS/SSL (yet)
// It only check if the user is authorized
//************************************************************************
app.post('/login_user', (req, res) => {
    var username = "{user}".format(req.body);
    var password = "{pass}".format(req.body);
    var level = "{level}".format(req.body);
    var access;

    if(level == "{level}" || level == " ")
        level = "Level";

    password = md5(password);
    var validate_user = ("SELECT `" + level + "` as 'access' FROM `login` WHERE `username` = '" + username + "' AND `password` = '" + password + "'").formatSQL(req.body);

    console.log(validate_user)
    //   Login disabled
    //res.send(JSON.stringify(0));  

    connectionQRQC.query(validate_user, (err, result) => {
        if (err) console.log(err);
    

        if(result.length == 0)
            res.send(JSON.stringify(0));
        else{
            console.log("Result: ", result[0].access)
            access = result[0].access;

            //Send response
            if(access != 0 || access == 'gr_plant' || access == 'gr_mixing' || access == 'gr_auto' || access == 'gr_exec'){
                res.send(JSON.stringify(access));
            }
            else{;
                res.send(JSON.stringify(0));
            }
        }
        
    });
});

app.post('/get_participants', (req, res) => {
    var department = "{department}".formatSQL(req.body);

    var sql = ("SELECT `name` FROM `owner` WHERE `department` = " + department + ";").formatSQL(req.body);
    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_cad_participants', (req, res) => {
    var department = "{department}".formatSQL(req.body);

    var sql = ("SELECT `name` FROM `owner_cad` WHERE `department` = {department};").formatSQL(req.body);
    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_exec_participants', (req, res) => {
    var sql = ("SELECT `name` FROM `owner_exec` WHERE `department` = {department};"
               ).formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/submit_participants', (req, res) => {
    var parsed_data = req.body.value;
    var today = GetDate();
    var department = req.body.level;

    if(parsed_data.length > 0){
        for(var i = 0; i < parsed_data.length; i++){
            var sql = ("INSERT INTO `checkin_log`(`name`, `date`, `department`) VALUES('" + parsed_data[i] + "', '" + today + "', '" + department +"');");
            // console.log(sql);
        
            connectionQRQC.query(sql, (err, result) => {
                if(err) throw err;
            }); 
        }
    }

    res.sendFile(path.join(__dirname, admin_path + 'index.html'));
});

app.post('/attend_dates', (req, res) => {
    var sql = ("SELECT `name`, DATE_FORMAT(`date`, '%Y-%m-%d') as date FROM `checkin_log` WHERE `date` BETWEEN {start} AND {end} AND `department` = {department}").formatSQL(req.body);
    console.log(sql)

    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        res.send(JSON.stringify(result));
    });
})

//************************************************************************
// Query any current alerts 
//************************************************************************
app.post('/show_current_alerts', (req, res) => {
    var select_dates = ("SELECT t1.`id`, DATE_FORMAT(t1.`deadline`, '%Y-%m-%d') AS deadline, DATE_FORMAT(t1.deadline, '%b-%d') AS `short`, t1.`term`, t1.`description`, t1.`owner`, t2.`id` AS post_it_id, t2.alert_type, t2.location " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1' AND `department` = {department} ORDER BY t1.deadline ASC;").formatSQL(req.body);

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;

        var now = GetDateTime();
        console.log("Show GR Plant Alerts at: %s", now);
        res.send(JSON.stringify(result));
    });
});

app.post('/show_jt_alerts', (req, res) => {
    var select_dates = ("SELECT t1.`id`, DATE_FORMAT(t1.`deadline`, '%Y-%m-%d') AS deadline, DATE_FORMAT(t1.deadline, '%b-%d') AS `short`, t1.`term`, t1.`description`, t1.`owner`, t2.`id` AS post_it_id, t2.alert_type, t2.location " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1' AND `department` = 'gr_exec' ORDER BY t1.deadline ASC;");

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        
        var now = GetDateTime();
        console.log("Show GR Executive Alerts at: %s", now);
        res.send(JSON.stringify(result));
    });
});

app.post('/show_cad_alerts', (req, res) => {
    var select_dates = ("SELECT t1.`id`, DATE_FORMAT(t1.`deadline`, '%Y-%m-%d') AS deadline, DATE_FORMAT(t1.deadline, '%b-%d') AS `short`, t1.`term`, t1.`description`, t1.`owner`, t2.`id` AS post_it_id, t2.alert_type, t2.location " +
        "FROM `post_it_items` as t1 INNER JOIN `post_it` AS t2 ON t1.`post_it_id` = t2.`id` " + 
        "WHERE t1.`completed` IS NULL AND t1.`deadline` IS NOT NULL AND t2.`active` = '1' AND `department` = {department} ORDER BY t1.deadline ASC;").formatSQL(req.body);

    connectionQRQC.query(select_dates, (err, result) => {
        if(err) throw err;
        
        var now = GetDateTime();
        console.log("Show CD Alerts at: %s", now);
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
        
        res.send(JSON.stringify(result));
    });
});    

//************************************************************************
// Write a new alert to the QRQC DB
//************************************************************************
app.post('/create_gr', (req, res) => {
    //Send the new QRQC Alert to the DB, info is in 2 
    var sql_create = ("INSERT INTO `post_it`(`alert_type`, `date`, `department`, `location`, `customer`, `issue`, `cause`, `active`) " +
                      "VALUES ({category}, CURRENT_DATE, {department}, 'TBD', '---', 'TBD', 'TBD', '0'); SELECT LAST_INSERT_ID();"
                     ).formatSQL(req.body); 

    connectionQRQC.query(sql_create, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/create_jt', (req, res) => {
    var sql_create = ("INSERT INTO `post_it`(`alert_type`, `date`, `department`, `region`, `location`, `customer`, `issue`, `cause`, `active`) "+
                      "VALUES ({category}, CURRENT_DATE, 'gr_exec', '---', 'TBD', '---', 'TBD', 'TBD', '1'); SELECT LAST_INSERT_ID();"
                     ).formatSQL(req.body); 
   
    connectionQRQC.query(sql_create, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/create_cd', (req, res) => {
    var sql_create = ("INSERT INTO `post_it`(`alert_type`, `date`, `department`, `location`, `customer`, `issue`, `cause`, `active`) "+
                      "VALUES ({category}, CURRENT_DATE, {department}, 'TBD', '---', 'TBD', 'TBD', '0'); SELECT LAST_INSERT_ID();"
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
    var sql_update = (
        "INSERT INTO `post_it`(`id`) VALUES ({post_id}) ON DUPLICATE KEY UPDATE " +
        "`alert_type` = {type}, `department` = {department}, `location` = {location}, `part` = {part}, `customer` = {customer}," +
        "`recurrence` = {recurrence}, `issue` = {i_desc}, `cause` = {c_desc}, `active` = {is_active};").formatSQL(req.body);
    
    //console.log("UPDATE POSTIT ", sql_update);
    

    connectionQRQC.query(sql_update, (err, result) => {
        if (err) throw err;

        // console.log("update_post_it:  ", result);
    });

    res.send(true);
});

app.post('/update_jt_post_it', (req, res) => {
    res.send(true);

    
    var sql_update = (
        "INSERT INTO `post_it`(`id`) VALUES ({post_id}) ON DUPLICATE KEY UPDATE " +
        "`alert_type` = {type}, `region` = {region}, `location` = {location}, `part` = {part}, `customer` = {customer}, " +
        "`recurrence` = {recurrence}, `issue` = {i_desc}, `cause` = {c_desc}, `active` = {is_active};").formatSQL(req.body);
    
    connectionQRQC.query(sql_update, (err, result) => {
        if (err) throw err;

        console.log(result);
    });
});

app.post('/cad_post_it', (req, res) => {
    var sql_update = (
        "INSERT INTO `post_it`(`id`) VALUES ({post_id}) ON DUPLICATE KEY UPDATE " +
        "`alert_type` = {type}, `department` = {department}, `location` = {location}, `part` = {part}, `customer` = {customer}," +
        "`recurrence` = {recurrence}, `issue` = {i_desc}, `cause` = {c_desc}, `active` = {is_active};").formatSQL(req.body);

    connectionQRQC.query(sql_update, (err, result) => {
        if (err) throw err;

        // console.log("update_post_it:  ", result);
    });

    res.send(true);
});


app.post('/update_post_it_items', (req, res) => {
    var length = ("{array_length}").formatSQL(req.body);
    console.log("UPDATE ITEMS");
    for(var i = 0; i < length; i++){
        var complete;
        if(req.body.completed[i] == "NULL")
            complete = " `completed` = NULL";
        else
            complete = " `completed` = '"+req.body.completed[i]+"'";

        var sql_update = (
            'INSERT INTO `post_it_items` VALUES ("'+req.body.item_id[i]+'", {post_id}, "'+req.body.term[i]+'", "'+req.body.term_descript[i]+'", "'+
                req.body.owner[i]+'", "'+req.body.starting[i]+'", "'+req.body.ending[i]+'", '+complete+', "'+
                req.body.state[i]+'", "'+req.body.emailed[i]+'", "1") ' +
            'ON DUPLICATE KEY UPDATE `term` = "'+req.body.term[i]+'", `description` = "'+req.body.term_descript[i]+'", `owner` = "'+req.body.owner[i]+
                '", `initial_date` = "'+req.body.starting[i]+'", `deadline` = "'+req.body.ending[i]+
                '", '+ complete +', `state` = "'+req.body.state[i]+'", `active` = "'+req.body.is_active[i]+'";'
        ).formatSQL(req.body);
        console.log("\n", sql_update);

        connectionQRQC.query(sql_update, (err, result) => {
            if (err) console.log("Update error: ", err);
        });
    }

    console.log("\n\nDONE WITH LOOP");
    res.send(true);
});

app.post('/cad_post_it_items', (req, res) => {
    var length = ("{array_length}").formatSQL(req.body);

    for(var i = 0; i < length; i++){
        var complete;
        if(req.body.completed[i] == "NULL")
            complete = " `completed` = NULL";
        else
            complete = " `completed` = '"+req.body.completed[i]+"'";

        var sql_update = (
            "INSERT INTO `post_it_items` VALUES ('"+req.body.item_id[i]+"', {post_id}, '"+req.body.term[i]+"', '"+req.body.term_descript[i]+"', '"+
                req.body.owner[i]+"', '"+req.body.starting[i]+"', '"+req.body.ending[i]+"', "+complete+", '"+
                req.body.state[i]+"', '"+req.body.emailed[i]+"', '1') " +
            "ON DUPLICATE KEY UPDATE `term` = '"+req.body.term[i]+"', `description` = '"+req.body.term_descript[i]+"', `owner` = '"+req.body.owner[i]+
                "', `initial_date` = '"+req.body.starting[i]+"', `deadline` = '"+req.body.ending[i]+
                "', "+ complete +", `state` = '"+req.body.state[i]+"', `active` = '"+req.body.is_active[i]+"';"
        ).formatSQL(req.body);
        //console.log("\n", sql_update);

        connectionQRQC.query(sql_update, (err, result) => {
            if (err) throw err;
        });
    }

    res.send(true);
});

//************************************************************************
// Grab parts numbers
//************************************************************************
app.post('/get_part_nums', (req, res) => {
    var sql = ("SELECT `number` FROM `smartplant`.`part` ORDER BY `number`");

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});

app.post('/get_cad_part_nums', (req, res) => {
    var sql = ("SELECT `number` FROM `part_cad` ORDER BY `number`");

    connectionQRQC.query(sql, (err, result) => {
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

app.post('/get_full_cad_part_info',  (req, res) => {
    //var sql = ("SELECT COUNT(*) FROM `part_cad`; SELECT `id`, `number`, `p_cust`, `p_dest` FROM `part_cad` ORDER BY `id`;");
    var sql = ("SELECT COUNT(*) FROM `part_cad`; SELECT * FROM `part_cad` ORDER BY `id`;");
    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        var ret = {
            'draw' : parseInt(req.query['draw']),
            "recordsTotal": result[0][0]['COUNT(*)'],
            "recordsFiltered":result[0][0]['COUNT(*)'], //data[1].length,
        };

        var d = [];
        for(var i = 0; i < result[1].length; i++){
            var item = []
            var keys = Object.keys(result[1][i])
            
            for (var j = 0; j < keys.length; j++){
                item.push(result[1][i][keys[j]])
            }

            d.push(item)
        }

        ret['data'] = d;
        // console.log("RET:",ret);
        res.send( JSON.stringify(ret) );
    });
});

//Add new part to Cadillac list
app.post('/add_cad_part', (req, res) => {
    var sql = ("INSERT INTO `part_cad` (`number`, `p_cust`, `p_dest`, `p_part`, `tier_12`, `pintcs`, `customer`) " +
               "VALUES({part_num}, {cust}, {dest}, {part_num}, {tier}, {pintcs}, {cust_num});").formatSQL(req.body);


    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        res.send(true);
    });
});

//Delete Cadillac part from list
app.post('/delete_cad_part', (req, res) => {
    var sql = ("DELETE FROM `part_cad` WHERE `id` = {id}").formatSQL(req.body);


    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        res.send(true);
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
    var sql = ("SELECT `name` FROM `owner_cad` WHERE `department` = {department};").formatSQL(req.body);
    console.log(sql)

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(JSON.stringify(result));
    });
});


//Add and delete owners for the various post-it levels
app.post('/get_full_users_plant', (req, res) => {
    //var sql = ("SELECT COUNT(*) FROM `owner` WHERE `department` = 'Plant'; SELECT * FROM `owner` WHERE `department` = {department} ").formatSQL(req.body);
    console.log(req.body)
    var sql = ("SELECT COUNT(*) FROM `owner` WHERE `department` = 'gr_plant'; SELECT * FROM `owner` WHERE `department` = 'gr_plant'").formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        var ret = {
            'draw' : parseInt(req.query['draw']),
            "recordsTotal": result[0][0]['COUNT(*)'],
            "recordsFiltered":result[0][0]['COUNT(*)'], //data[1].length,
        };

        var d = [];
        for(var i = 0; i < result[1].length; i++){
            var item = []
            var keys = Object.keys(result[1][i])
            
            for (var j = 0; j < keys.length; j++){
                item.push(result[1][i][keys[j]])
            }

            d.push(item)
        }

        ret['data'] = d;
        // console.log("RET:",ret);
        res.send( JSON.stringify(ret) );
    });
});

app.post('/get_full_users_mixing', (req, res) => {
    //var sql = ("SELECT COUNT(*) FROM `owner` WHERE `department` = 'Plant'; SELECT * FROM `owner` WHERE `department` = {department} ").formatSQL(req.body);

    var sql = ("SELECT COUNT(*) FROM `owner` WHERE `department` = 'gr_mixing'; SELECT * FROM `owner` WHERE `department` = 'gr_mixing' ").formatSQL(req.body);

    console.log(sql);
    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        var ret = {
            'draw' : parseInt(req.query['draw']),
            "recordsTotal": result[0][0]['COUNT(*)'],
            "recordsFiltered":result[0][0]['COUNT(*)'], //data[1].length,
        };

        var d = [];
        for(var i = 0; i < result[1].length; i++){
            var item = []
            var keys = Object.keys(result[1][i])
            
            for (var j = 0; j < keys.length; j++){
                item.push(result[1][i][keys[j]])
            }

            d.push(item)
        }

        ret['data'] = d;
        // console.log("RET:",ret);
        res.send( JSON.stringify(ret) );
    });
});

app.post('/get_full_users_auto', (req, res) => {
    //var sql = ("SELECT COUNT(*) FROM `owner` WHERE `department` = 'Plant'; SELECT * FROM `owner` WHERE `department` = {department} ").formatSQL(req.body);

    var sql = ("SELECT COUNT(*) FROM `owner` WHERE `department` = 'gr_auto'; SELECT * FROM `owner` WHERE `department` = 'gr_auto' ").formatSQL(req.body);

    console.log(sql);
    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        var ret = {
            'draw' : parseInt(req.query['draw']),
            "recordsTotal": result[0][0]['COUNT(*)'],
            "recordsFiltered":result[0][0]['COUNT(*)'], //data[1].length,
        };

        var d = [];
        for(var i = 0; i < result[1].length; i++){
            var item = []
            var keys = Object.keys(result[1][i])
            
            for (var j = 0; j < keys.length; j++){
                item.push(result[1][i][keys[j]])
            }

            d.push(item)
        }

        ret['data'] = d;
        // console.log("RET:",ret);
        res.send( JSON.stringify(ret) );
    });
});

app.post('/get_full_users_exec', (req, res) => {
    //var sql = ("SELECT COUNT(*) FROM `owner` WHERE `department` = 'Plant'; SELECT * FROM `owner` WHERE `department` = {department} ").formatSQL(req.body);

    var sql = ("SELECT COUNT(*) FROM `owner_exec`; SELECT * FROM `owner_exec`").formatSQL(req.body);

    console.log(sql);
    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        var ret = {
            'draw' : parseInt(req.query['draw']),
            "recordsTotal": result[0][0]['COUNT(*)'],
            "recordsFiltered":result[0][0]['COUNT(*)'], //data[1].length,
        };

        var d = [];
        for(var i = 0; i < result[1].length; i++){
            var item = []
            var keys = Object.keys(result[1][i])
            
            for (var j = 0; j < keys.length; j++){
                item.push(result[1][i][keys[j]])
            }

            d.push(item)
        }

        ret['data'] = d;
        // console.log("RET:",ret);
        res.send( JSON.stringify(ret) );
    });
});

app.post('/get_full_users_cad', (req, res) => {
    //var sql = ("SELECT COUNT(*) FROM `owner` WHERE `department` = 'Plant'; SELECT * FROM `owner` WHERE `department` = {department} ").formatSQL(req.body);

    var sql = ("SELECT COUNT(*) FROM `owner_cad` WHERE `department` = 'cd_plant'; SELECT * FROM `owner_cad` WHERE `department` = 'cd_plant' ").formatSQL(req.body);

    console.log(sql);
    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        var ret = {
            'draw' : parseInt(req.query['draw']),
            "recordsTotal": result[0][0]['COUNT(*)'],
            "recordsFiltered":result[0][0]['COUNT(*)'], //data[1].length,
        };

        var d = [];
        for(var i = 0; i < result[1].length; i++){
            var item = []
            var keys = Object.keys(result[1][i])
            
            for (var j = 0; j < keys.length; j++){
                item.push(result[1][i][keys[j]])
            }

            d.push(item)
        }

        ret['data'] = d;
        // console.log("RET:",ret);
        res.send( JSON.stringify(ret) );
    });
});

// Add and delete owners
app.post('/add_new_owner', (req, res) => {
    var sql = ("INSERT INTO `owner` (`name`, `email`, `department`) VALUES ({name}, {email}, {department});").formatSQL(req.body);

    console.log(sql);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(true);
    });
});

app.post('/add_new_exec_owner', (req, res) => {
    var sql = ("INSERT INTO `owner_exec` (`name`, `email`, `department`) VALUES ({name}, {email}, {department});").formatSQL(req.body);

    console.log(sql);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(true);
    });
});

app.post('/add_new_cad_owner', (req, res) => {
    var sql = ("INSERT INTO `owner_cad` (`name`, `email`, `department`) VALUES ({name}, {email}, {department});").formatSQL(req.body);

    console.log(sql);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(true);
    });
});

app.post('/delete_owner', (req, res) => {
    var sql = ("DELETE FROM `owner` WHERE `id` = {id};").formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(true);
    });
});

app.post('/delete_exec_owner', (req, res) => {
    var sql = ("DELETE FROM `owner_exec` WHERE `id` = {id};").formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(true);
    });
});

app.post('/delete_cad_owner', (req, res) => {
    var sql = ("DELETE FROM `owner_cad` WHERE `id` = {id};").formatSQL(req.body);

    connectionQRQC.query(sql, (err, result) => {
        if (err) throw err;

        res.send(true);
    });
});

//************************************************************************
// 1) Get the required email address based on the user
// 2) Create the email transporter to send the email
//************************************************************************
app.post('/get_email', (req, res) => {
    res.send(true);
    
    var sql = ("SELECT `email` FROM `owner` WHERE `name` = {owner} AND `department` = {department}").formatSQL(req.body);
    var subject = "iQRQC Task: {issue}".formatSQL(req.body);
    var message = ("You have been assigned a task for QRQC:\n\n" +
                   "Location: {location}\nPart Number: {part}\nCustomer: {customer}" +
                   "\nIssue Description: {issue}" +
                   "\nAction to be Taken: {description}\nTask deadline is: {ending}").formatSQL(req.body);
    var address;
    
    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        console.log(result);

        try{
            address = result[0].email;
            console.log(address);
        }catch (err){}

        SendEmail(subject, address, message);
    });   
});

app.post('/get_cad_email', (req,res) => {
    res.send(true);

    var sql = ("SELECT `email` FROM `owner_cad` WHERE `name` = {owner} AND `department` = {department}").formatSQL(req.body);
    var subject = "iQRQC Task: {issue}".formatSQL(req.body);
    var message = ("You have been assigned a task for QRQC:\n\n" +
                   "Location: {location}\nPart Number: {part}\nCustomer: {customer}" +
                   "\nIssue Description: {issue}" +
                   "\nAction to be Taken: {description}\nTask deadline is: {ending}").formatSQL(req.body);

    console.log(sql);
    
    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        console.log(result);

        try{
            address = result[0].email;
            console.log(address);
        }catch (err){}

        SendEmail(subject, address, message);
    });
});

app.post('/get_jt_email', (req, res) => {
    res.send(true);
    
    var sql = ("SELECT `email` FROM `owner_exec` WHERE `name` = {owner}").formatSQL(req.body);
    var subject = "iQRQC Task: {issue}".formatSQL(req.body);
    
    var message = (
    "<div>" +
      "<div style='background: linear-gradient(45deg, white, #132057); width: 100%; height: 100px;''></div>"+
        "<b>You have been assigned a task for QRQC:</b>"+
        "<p><b>Location:</b> {location}</p>"+
        "<p><b>Part Number:</b> {part}</p>"+
        "<p><b>Customer:</b> {customer}</p>"+
        "<p><b>Issue Description:</b> {issue}</p>"+
        "<p><b>Action to be Taken:</b> {description}</p>"+
        "<p><b>Task deadline is:</b> {ending}</p>"+
      "<div style='background: linear-gradient(to left, white, #132057); width: 100%; height: 100px;'></div>"+
   "</div>").formatSQL(req.body);

    // var message = ("You have been assigned a task for QRQC:\n\n" +
    //                "Location: {location}\nPart Number: {part}\nCustomer: {customer}" +
    //                "\nIssue Description: {issue}" +
    //                "\nAction to be Taken: {description}\nTask deadline is: {ending}").formatSQL(req.body);
                   
    connectionQRQC.query(sql, (err, result) => {
        if(err) throw err;

        try{
            address = result[0].email;
        }catch (err){}

        SendEmail(subject, address, message);
    });
});


function SendEmail(subject, address, message){
    //var recipient = ('<%s>', address)
    //var message = ('{email_text}').format(req.body);
    
    // transporter.sendMail({
    // from: 'qrqc-task@hutchinsonna.com',
    // to: 'remy.guegan@hutchinsonna.com',
    // subject : 'test emailing with IT', 
    // text    : 'Hi. Did you receive this?'
    // });
    var msg_body = {
        from    : 'qrqc-task@hutchinsonna.com',
        to      : address,
        subject : subject, 
        html    : message
    };

    transporter.sendMail(msg_body, (error, info) => {
        if (error) {
            console.log('Error occurred: ', error.message);
            return;
        }
        
        console.log('Message sent to %s successfully!', address);
        //console.log('Server responded with "%s"', info.response);
    });

    //console.log("\n\nsent email");
}


function GetDateTime(){
    var datetime = new Date();
    
    //Get the current time
    var hour    = datetime.getHours();
    var minutes = datetime.getMinutes();

    //Get today's date
    var day   = datetime.getDate();
    var month = datetime.getMonth() + 1;
    var year  = datetime.getFullYear();


    //Format time
    if(hour < 10)
        hour = '0' + hour;
    if(minutes < 10)
        minutes = '0' + minutes;

    //Format date
    if(day < 10)
        day = '0' + day;
    if(month < 10)
        month = '0' + month;
    
    var now = (year + "-" + month + "-" + day + " " + hour + ":" + minutes);

    return now;
}

function GetDate(){
    var datetime = new Date();

    //Get today's date
    var day   = datetime.getDate();
    var month = datetime.getMonth() + 1;
    var year  = datetime.getFullYear();


    //Format date
    if(day < 10)
        day = '0' + day;
    if(month < 10)
        month = '0' + month;
    
    var now = (year + "-" + month + "-" + day);

    return now;
}


//************************************************************************
// Get paths setup, load css, js, etc for the browser
//************************************************************************
var dir_path = 'public/';
var admin_path = 'public/admin/';
var each = ["images", "css", "js", "datetimepicker", "jquery"];

for (var i = 0; i < each.length; i++){
    app.use('/' + each[i], express.static(path.join(__dirname, dir_path + '/' + each[i])));
}

app.use(favicon(path.join(__dirname, dir_path + 'images/' + 'favicon.ico')));

app.get('/', (req, res) => {
    if(req.path == '/'){
        res.locals.query = req.query;
        res.sendFile(path.join(__dirname, dir_path + 'home_page.html'));
    }
    else{
        res.sendFile(path.join(__dirname, dir_path + req.path));
    }   
});

//************************************************************************
// Serve up the pages
//************************************************************************
app.get('/view_current', (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'view_current.html')); });
app.get('/view',         (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'disabled_view.html')); });
app.get('/view2',        (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'disabled_exec.html')); });


//Index Pages
app.get('/index',  (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'index.html')); });


//Create Pages
app.get('/create', (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'create.html')); });


// login page
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'login.html' )); });
app.get('/login_checkin', (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'login_checkin.html' )); });


//Todoroff's island
app.get('/view_exec',   (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'view_jt.html'  )); });
app.get('/index_exec',  (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'index_jt.html' )); });
app.get('/create_exec', (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'create_jt.html')); });

//Allow for the editing of owners
app.get('/modify_owners',         (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'mod_owners.html')); });
app.get('/modify_cadillac_parts', (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'mod_cad_parts.html')); });
app.get('/login_util',            (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'login_utils.html' )); });
app.get('/forgot_password',       (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'forgot_pass.html' )); });
app.get('/checkin',               (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'checkin.html' )); });

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, admin_path + '404.html')); });

//Prototype pdf for Electron
app.get('/pdf', (req, res) => { res.sendFile(path.join(__dirname, admin_path + 'pdf_test.html')); });