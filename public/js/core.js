$.fn.exists = function (callback) {
    if (this.length !== 0)
      callback.call(this);
}
String.prototype.format = function() {
  /*   var str = 'pass arg0 = {0} {1} {2} {foo}'.formatSQL('arg0', 1, 2, {foo:'foo'})  */

    var args = arguments;         //arguemens is a keyword
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
                    return args[i][key] ;
                }
            }
            return match;
        }
    }.bind(this));
}

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}
//************************************************************************
// jQuery that will handle the requests and responses between
// the server and the webpages
//************************************************************************
$(document).ready(function () {
  var add_row_counter = '0';  //Yeah it's a global, used for Add_alert()

  //************************************************************************
  // When the home page is loaded, populate with a list of existing issues
  // based on the days of the week
  //************************************************************************
  $('#index_page').exists(function() {
    //debugger;
    $.ajax({
      url         : "/show_current_alerts",
      type        : "POST",
      contentType : "application/json",
      processData : false,
      complete    : function(data){
        var date = new Date();

        //Format the date
        var day = date.getDate();
        var month = (date.getMonth() + 1);
        var year = date.getFullYear();

        if(day < 10)
          day = '0' + day;
        if(month < 10)
          month = '0' + month;


        var today = (year + "-" + month + "-" + day);
        loadAlerts(data, today);
      }
    });

    //If needing to make a new alert, create an entry in the DB and update it on submit later on
    $('#new_alert_redirect').on('click touchstart', function(){ 
      $.ajax({
        url         : "/create_post_it",
        type        : "POST",
        contentType : "application/json",
        processData : false,
        complete    : function(data){
            var parsed_data = JSON.parse(data.responseText);
            window.location.href = 'create.html?id=' + parsed_data[0].insertId;
        }
      });
    });

    $('#mixing_alert_redirect').on('click touchstart', function(){ 
      $.ajax({
        url         : "/mixing_alerts",
        type        : "POST",
        contentType : "application/json",
        processData : false,
        complete    : function(data){
            var parsed_data = JSON.parse(data.responseText);
            window.location.href = 'mixing_alert.html?id=' + parsed_data[0].id;
        }
      });      
    });
  });//End index_page


  //************************************************************************
  // When the "New Alert" button is clicked, load the create_post_it page
  //************************************************************************
  $('#create_page').exists(function(){    
    $.ajax({
      url   : "/get_part_nums",
      type  : "POST",
      contentType : "application/json",
      complete    : function(data){
          var parsed_data = JSON.parse(data.responseText);

          for(var i = 0; i < parsed_data.length; i++){
            var part = parsed_data[i].number;

            $('#part_num').append("<option value='" + part + "'>" + part + "</option>" );
          }

          console.log("Done with parts");
      }
    });

    $.ajax({
      url   : "/get_customers",
      type  : "POST",
      contentType : "application/json",
      complete    : function(data){
          var parsed_data = JSON.parse(data.responseText);

          for(var i = 0; i < parsed_data.length; i++){
            var customer = parsed_data[i].name;

            $('#customer').append("<option value='" + customer + "'>" + customer + "</option>" );
          }

           console.log("Done with customers");
      }
    });

    
    Pull_Data($.urlParam('id'));
    $('#id_number').html($.urlParam('id'));
  });//End create_page


  $('#mixing_page').exists(function(){
    $.ajax({
      url         : "/show_mixing_alerts",
      type        : "POST",
      contentType : "application/json",
      processData : false,
      complete    : loadMixingAlerts,
    });
  });

  //************************************************************************
  // Adds another row to the Additional Info section
  //************************************************************************
  $('#add_row').click(function(){
    Add_Alert();  
  });//End add_row


  //************************************************************************
  // Creates a new aletry entry into the DB
  // Stores data entered in the fields from the webpage and sends them
  // to the server as a JSON string
  //************************************************************************
  $('#submit_btn').click(function() {      
    var post_id, active;    

    //Information write to DB
    var a_type, date_posted, dept, location, part_num, customer, repeat, issue, cause;
    a_type      = $('#alert_type').val();
    date_posted = $('#date_initial').val();
    dept        = $('#department').val();
    location    = $('#location').val();
    part_num    = $('#part_num').val();
    cust        = $('#customer').val();
    repeat      = $('#recur').val();
    issue       = $('#issue_desc').val();
    cause       = $('#cause_desc').val();
    post_id     = $('#id_number').text();
    active      = 1;

    var payload = {
      type        : a_type,
      date        : date_posted,
      department  : dept,
      location    : location,
      part        : part_num,
      customer    : cust,
      recurrence  : repeat,
      i_desc      : issue,
      c_desc      : cause,      
      post_id     : post_id,
      is_active   : active,
    };

    $.ajax({
      url         : "/update_post_it",
      type        : "POST",
      contentType : "application/json",
      processData : false,
      data        : JSON.stringify(payload),
    });

    //Action Plan row(s) write to DB
    var t_length, t_descript, responsible, date_start, date_ending, date_completed, state, item_id;
    for(var i = 0; i < add_row_counter; i++){
      t_length        = $('#term_length_' + i).val();        
      t_descript      = $('#term_description_' + i).val();
      responsible     = $('#responsible_' + i).val();
      date_start      = $('#date_start_' + i).val();
      date_ending     = $('#date_ending_' + i).val();
      date_completed  = $('#date_completed_' + i).val();
      item_id         = $('#item_id_' + i).val();
      state           = $('#state_' + i).val();
      active          = 1;
      item_id         = $('#item_id_' + i).val();
  
      if(date_completed == "")
        date_completed = null;
      if(date_ending == ""){
        date_ending = null;
        active = '0';
      }
      
      var payload2 = {
        item_id       : item_id,
        post_id       : post_id,
        term          : t_length,
        term_descript : t_descript,
        owner         : responsible,
        starting      : date_start,
        ending        : date_ending,
        completed     : date_completed,
        state         : state,
        is_active     : active,
      };

      $.ajax({
        url         : "/update_post_it_items",
        type        : "POST",
        contentType : "application/json",
        processData : false,
        data        : JSON.stringify(payload2),
      });
    }

    //Redirect after all is done
    window.location.href = '/';      
  });//End submit_btn

  //************************************************************************
  // Add an addition info row for an alert.
  //************************************************************************
  function Add_Alert(){
    $("#action_table").append(
        " <tr class='info_rows'>" +
        " <td><select class='added_row' id='term_length_" + add_row_counter + "'>"+ 
        "   <option value='Empty'>---</option>" + 
        "   <option value='1'>Immediate</option>" +
        "   <option value='2'>Temporary</option>" +
        "   <option value='3'>Permanent</option> </select></td>" +
        " <td> <input class='added_row' id='term_description_" + add_row_counter + "' type='text'> </input> </td>" +
        " <td> <select class='added_row' id='responsible_" + add_row_counter + "' type='text'> </select> </td>" +
        " <td> <input class='added_row' id='date_start_" + add_row_counter + "' type='date'> </input> </td>" +
        " <td> <input class='added_row' id='date_ending_" + add_row_counter + "' type='date'> </input> </td>" +
        " <td> <input class='added_row' id='date_completed_" + add_row_counter + "' type='date'> </input> </td>" +
        " <td> <select class='added_row' id='state_" + add_row_counter + "'>"+ 
        "   <option value='Empty'>---</option>" + 
        "   <option value='1'>Open</option>" +
        "   <option value='2'>Closed</option>" +
        "   <option value='3'>Late</option> </select></td>" +
        " <td class='hidden_element'> <input type='text' id='item_id_" + add_row_counter + "'/></td></tr>"
    );    


    $.ajax({
      url   : "/get_users",
      type  : "POST",
      contentType : "application/json",
      complete    : function(data){
        var parsed_data = JSON.parse(data.responseText);

        console.log(parsed_data);
        
        
        for(var i = 0; i < parsed_data.length; i++){
          for(var j = 0; j < add_row_counter; j++){
          var owner = parsed_data[i].name;
          $('#responsible_' + j).append("<option value='" + owner + "'>" + owner + "</option>" );
          }
        }
      }
    });

    add_row_counter++;  //Increment i
  }//End Add_alert()

  //************************************************************************
  // When an alert is clicked from the home page, pull data from the DB
  // and populate fields with the data
  //************************************************************************
  function Pull_Data(id){
    var payload = {
      id : id,
    };

    $.ajax({
      url         : "/pull_qrqc_data",
      type        : "POST",
      contentType : "application/json",
      processData : false,
      data        : JSON.stringify(payload),
      complete    : function(data){      
        var parsed_data = JSON.parse(data.responseText);


        var a_type, date_posted, dept, location, part_num, customer, repeat, issue, cause; //First section
        var t_length, t_descript, responsible, date_start, date_ending, date_completed, state, i_id;//Second section

        for(var i = 0; i < parsed_data.length; i++){
          for(var j = 0; j < parsed_data[i].length; j++){
            if(i == '0' && j == '0'){                   //Only grab General info once
              a_type      = parsed_data[i][j].alert_type;
              date_posted = parsed_data[i][j].date;
              dept        = parsed_data[i][j].department;
              location    = parsed_data[i][j].location;
              part_num    = parsed_data[i][j].part;
              customer    = parsed_data[i][j].customer
              repeat      = parsed_data[i][j].recurrence;
              issue       = parsed_data[i][j].issue;
              cause       = parsed_data[i][j].cause;


              //Output to html
              $('#alert_type').val(a_type);
              $('#date_initial').val(date_posted);
              $('#department').val(dept);
              $('#location').val(location);
              $('#part_num').val(part_num);
              $('#customer').delay(200).val(customer);
              $('#recur').val(repeat);
              $('#issue_desc').html(issue);
              $('#cause_desc').html(cause);
            }
            else{
              i_id           = parsed_data[i][j].id;
              t_length       = parsed_data[i][j].term;
              t_descript     = parsed_data[i][j].description;
              responsible    = parsed_data[i][j].owner;
              date_start     = parsed_data[i][j].initial_date;
              date_ending    = parsed_data[i][j].deadline;
              date_completed = parsed_data[i][j].completed;
              state          = parsed_data[i][j].state;
              

              //Add a row to the additional info area
              Add_Alert();

              $('#term_length_' + j).val(t_length);
              $('#term_description_' + j).val(t_descript);
              $('#responsible_' + j).val(responsible);
              $('#date_start_' + j).val(date_start);
              $('#date_ending_' + j).val(date_ending);
              $('#date_completed_' + j).val(date_completed);
              $('#state_' + j).val(state);
              $('#item_id_' + j).val(i_id);
            }          
          }
        }
      }//End complete*/
    });

        console.log("Pulled data");
  }// End Pull_Data()
});//End document.ready
//************************************************************************


//************************************************************************
// Sort the queryed alerts based on the Deadline column and display
// them based on the day-of-the-week they fall on.
//
// Used by $('#index_page')
//************************************************************************
function loadAlerts(data, today){
  var d = JSON.parse(data.responseText);

  //Grabs the name of the day based on the deadline date in the DB
  for (var i = 0; i < d.length; i++){
    var day = whichDay(d[i].deadline);
    d[i]['day']= day;
  }

  var rg = regroup_list_by(d, 'day');
  var rows = 0;
  var list = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  for (var i = 0; i < list.length; i++){
    var day = list[i];    //Get the day

    if (!rg[day])         //If there aren't any days that have an entry continue on
      continue;    

    for (var j = 0; j < rg[day].length; j++){
      while ($(".row").length < rg[day].length){
        $('#issues_table').append("<tr id='row_" + rows + "' class='row'><td class='day_of_week Monday'></td><td class='day_of_week Tuesday'></td>"
          + "<td class='day_of_week Wednesday'></td><td class='day_of_week Thursday'></td><td class='day_of_week Friday'></td></tr>");
        rows++;
      }
      var e = $('#row_' + j + ' .' + day);    //create a variable to hold query data. Look for class="row_j" and id=""


      if(d[i].deadline <= today){
        console.log("Today: ", today);
        console.log(d[i].deadline + " is late");
      }
      else{
        //console.log("Today: ", today);
        //console.log(day + " " + d[i].deadline + " is ok");
      }
    
      e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline' style='background-color:red;'>{deadline}</td>" + 
                "<td class='btn alert' data-part_num='{post_it_id}' id='{alert_type}'>{issue}</td>").format(rg[day][j]));

      e.promise().done(function(){
        $(".btn", this).on('click touchstart', function(){ 
          window.location.href = 'create.html?id=' + jQuery.attr(this, "data-part_num");
        });
      });
    }
  }  
}//End loadAlerts

function loadMixingAlerts(data, textStatus){
  var d = JSON.parse(data.responseText);
  //var today = d[1][0].today;

  //Grabs the name of the day based on the deadline date in the DB
  for (var i = 0; i < d.length; i++){
    var day = whichDay(d[i].deadline);
    d[i]['day']= day;
  }

  var rg = regroup_list_by(d, 'day');
  var rows = 0;
  var list = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  for (var i = 0; i < list.length; i++){
    var day = list[i];    //Get the day
    
    if (!rg[day])         //If there aren't any days that have an entry continue on
      continue;
    
    for (var j = 0; j < rg[day].length; j++){
      while ($(".row").length < rg[day].length){
        $('#issues_table').append("<tr id='row_" + rows + "' class='row'><td class='day_of_week Monday'></td><td class='day_of_week Tuesday'></td>"
          + "<td class='day_of_week Wednesday'></td><td class='day_of_week Thursday'></td><td class='day_of_week Friday'></td></tr>");
        rows++;
      }

      var e = $('#row_'+j + ' .' + day);    //create a variable to hold query data. Look for class="row_j" and id=""

      e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline' style='background-color:;'>{deadline}</td>" + 
                "<td class='btn alert' data-part_num='{post_it_id}' id='{alert_type}'>{issue}</td>").format(rg[day][j]));

      e.promise().done(function(){
        $(".btn", this).on('click touchstart', function(){ 
          window.location.href = 'mixing_alert.html?id=' + jQuery.attr(this, "data-part_num");
        });
      });
    }
  }
}// End loadMixingAlerts

//************************************************************************
// Used by loadAlerts() to format that way the data will be
// displayed in the table element
//************************************************************************
function regroup_list_by(list,categorize) {  
  var map = {};
  for (var i = 0; i < list.length; ++i) {
    var category = list[i][categorize];
    
    if (!map[category]) 
      map[category] = [];
    
    var value = list[i];
    
    delete value[categorize]
    map[category].push(list[i]);
  }
  return map;
}//End regroup_list_by()


//************************************************************************
// Called by load alerts to get the current day of the week
// based on an incoming date string
//************************************************************************
function whichDay(dateString) {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][new Date(dateString).getDay()];
}