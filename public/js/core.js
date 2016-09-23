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
  var users;
  
  //************************************************************************
  // When the home page is loaded, populate with a list of existing issues
  // based on the days of the week
  //************************************************************************
  $('#index_page').exists(function() {
    var url = "create.html?id=";
    var query_url = "/show_current_alerts"
    //Refresh the page every 5 minutes
    Show_Current(query_url, url);
    setInterval(function(){
      location.reload();
    }, 300000);
   

    //If needing to make a new alert, create an entry in the DB and update it on submit later on
    $('#new_alert_redirect').on('click touchstart', () => { 
      $.ajax({
        url         : "/create_post_it",
        type        : "POST",
        contentType : "application/json",
        processData : false,
        complete    : function(data){
            var parsed_data = JSON.parse(data.responseText);
            window.location.href = url + parsed_data[0].insertId;
        }
      });
    });
  
  });//End index_page

  $('#create_page').exists(function(){ 
    Press_Enter();

    $.ajax({
      url         : "/get_users",
      type        : "POST",
      contentType : "application/json",
      complete    : function(data){ users = JSON.parse(data.responseText); }
    });

    $.ajax({
      url         : "/get_part_nums",
      type        : "POST",
      contentType : "application/json",
      complete    : function(data){
          var parsed_data = JSON.parse(data.responseText);

          for(var i = 0; i < parsed_data.length; i++){
            var part = parsed_data[i].number;

            $('#part_num').append("<option value='" + part + "'>" + part + "</option>" );
          }
      }
    });

    $.ajax({
      url         : "/get_customers",
      type        : "POST",
      contentType : "application/json",
      complete    : function(data){
          var parsed_data = JSON.parse(data.responseText);

          for(var i = 0; i < parsed_data.length; i++){
            var customer = parsed_data[i].name;

            $('#customer').append("<option value='" + customer + "'>" + customer + "</option>" );
          }

           Pull_Data($.urlParam('id'));
      }
    });

    $('#id_number').html($.urlParam('id'));
    $('#return_home').on('click touchstart', () => {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/';
      else
        return false;
    });

  });//End create_page

  $('#mixing_page').exists(function(){
    var url = "mixing_alert.html?id=";
    var query_url = "/show_mixing_alerts"

    Show_Current(query_url, url);
    setInterval(function(){
      Show_Current(query_url, url);
    }, 300000);


    $('#return_home').on('click touchstart', () => {
      window.location.href = '/';
    });

    $('#mixing_alert_redirect').on('click touchstart', () => { 
      $.ajax({
        url         : "/create_post_it",
        type        : "POST",
        contentType : "application/json",
        processData : false,
        complete    : function(data){
            var parsed_data = JSON.parse(data.responseText);
            window.location.href = url + parsed_data[0].insertId;
        }
      });
    });
  
  });// End mixing

  $('#incomplete_page').exists(function(){
    $.ajax({
      url         : "/show_incomplete_alerts",
      type        : "POST",
      contentType : "application/json",
      processData : false,
      complete    : loadIncompleteAlerts,
    });

    $('#return_home').on('click touchstart', () => {
      window.location.href = '/';
    });
  
  });// End incomplete


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
  $('#submit_btn').click(function(){
    Submit_Data();

    // Wait 5 seconds before redirect so emails can be sent
    setTimeout(function(){
      window.location.href = '/';
    }, 2000);   
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
      " <td> <div class='added_row' id='state_" + add_row_counter + "'>Open</div></td>" +
      " <td> <input class='added_row' id='email_" + add_row_counter + "' type='checkbox'> </div></td>" +
      " <td class='hidden_element'> <input type='text' id='item_id_" + add_row_counter + "'/></td></tr>"
    );

    //Populate the 'Owners' dropdown box
    for(var i = 0; i < users.length; i++){
      for(var j = add_row_counter; j <= add_row_counter; j++){
        var owner = users[i].name;
        $('#responsible_' + j).append("<option value='" + owner + "'>" + owner + "</option>" );
      }
    }

    add_row_counter++;  //Increment
  
  }// End Add_alert()

  
  function Show_Current(query_url, url){
    $.ajax({
      url         : query_url,
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
        loadAlerts(data, today, url);
      }
    });
  }// End Show_Current();

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
        var t_length, t_descript, responsible, date_start, date_ending, date_completed, email, state, i_id;//Second section

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
              $('#customer').val(customer);
              $('#recur').val(repeat);
              $('#issue_desc').html(issue);
              $('#cause_desc').html(cause);

               if(a_type != null && date_posted != null)
               $('#date_initial').attr('disabled', 'disabled');
            }
            else{
              i_id           = parsed_data[i][j].id;
              t_length       = parsed_data[i][j].term;
              t_descript     = parsed_data[i][j].description;
              responsible    = parsed_data[i][j].owner;
              date_start     = parsed_data[i][j].initial_date;
              date_ending    = parsed_data[i][j].deadline;
              date_completed = parsed_data[i][j].completed;
              email          = parsed_data[i][j].email_sent;
              state          = parsed_data[i][j].state;

              

              //Add a row to the additional info area
              Add_Alert();

              $('#term_length_' + j).val(t_length);
              $('#term_description_' + j).val(t_descript);
              $('#responsible_' + j).val(responsible);
              $('#date_start_' + j).val(date_start);
              $('#date_ending_' + j).val(date_ending);
              $('#date_completed_' + j).val(date_completed);
              if (email == 1) 
                $('#email_' + j).prop('checked', true);
              $('#state_' + j).html(state);
              $('#item_id_' + j).val(i_id);

              
              if(date_start != null)
                $('#date_start_' + j).attr('disabled', 'disabled');
              if(date_ending != null && date_completed != null)
                $('#date_ending_' + j).attr('disabled', 'disabled');
              //Disable an entire row if Action has been completed
              if (date_completed != null){
                $('#term_length_' + j).attr('disabled', 'disabled');
                $('#term_description_' + j).attr('disabled', 'disabled');
                $('#responsible_' + j).attr('disabled', 'disabled');
                $('#date_completed_' + j).attr('disabled', 'disabled');
              }
              $('#email_' + j).attr('disabled', 'disabled');

            }          
          }
        }
      }//End complete*/
    });

  }// End Pull_Data()

  function Submit_Data() {
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

    if(a_type == null || date_posted == "" || dept == null || cust == null){
      alert("Please fill in all Information fields");
      return false;
    } 

    var payload = {
      type        : a_type,
      date        : date_posted,
      department  : dept,
      start_dept  : dept,
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
    var t_length, t_descript, responsible, date_start, date_ending, date_completed, email, state, item_id;
    for(var i = 0; i < add_row_counter; i++){
      t_length        = $('#term_length_' + i).val();        
      t_descript      = $('#term_description_' + i).val();
      responsible     = $('#responsible_' + i).val();
      date_start      = $('#date_start_' + i).val();
      date_ending     = $('#date_ending_' + i).val();
      date_completed  = $('#date_completed_' + i).val();
      item_id         = $('#item_id_' + i).val();
      state           = $('#state_' + i).val();
      email           = 1;
      active          = 1;
      item_id         = $('#item_id_' + i).val();
        

      //*****************************************************
      // Formatting and error checking
      if(date_completed == ""){
        if(!$('#email_' + i).is(':checked'))
          Format_Email(responsible, dept, t_descript, date_start, date_ending);
        
        date_completed = null;
      }
      else if(date_completed != "")
        state = "Closed";
      
      if(t_length == '---' || responsible == '---' || date_start == "" || date_ending == ""){
        alert("Please make sure all fields are filled in for action " + (i + 1));
        return false;
      }

      var weekend_day = new Date(date_ending).getUTCDay(); 
      console.log("Week Day number: %s", weekend_day);

      var payload2 = {
        item_id       : item_id,
        post_id       : post_id,
        term          : t_length,
        term_descript : t_descript,
        owner         : responsible,
        starting      : date_start,
        ending        : date_ending,
        completed     : date_completed,
        emailed       : email,
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
  }// End Send_Data()
  

  function Format_Email(responsible, dept, t_descript, start_date, deadline){
    var payload3 = {
      owner     : responsible,
      department : dept,
    };

    console.log("payload 3: ", payload3);

    $.ajax({
      url         : "/get_email",
      type        : "POST",
      contentType : "application/json",
      processData : false,
      data        : JSON.stringify(payload3),
      complete    : function(data){
        var parsed_data = JSON.parse(data.responseText);
        console.log(parsed_data);


        for(var i = 0; i < parsed_data.length; i++){
          var email = parsed_data[i].email;
          var message = ("You have been assigned a task for QRQC:\n\n" + t_descript +
                         "\n\nTask assigned on: " + start_date +
                         "\nTask deadline is: " + deadline);
          
          var email_body = {
            owner      : responsible,
            email_addr : email,
            email_text : message,
          };
        }
        
        $.ajax({
            url         : "/send_email",
            type        : "POST",
            contentType : "application/json",
            processData : false,
            data        : JSON.stringify(email_body),
            complete    : function(){
              return;
            }
          });
      }//End/complete
    });
  }//End Format_Email()

});//End document.ready
//************************************************************************


//************************************************************************
// Sort the queryed alerts based on the Deadline column and display
// them based on the day-of-the-week they fall on.
//
// Used by $('#index_page')
//************************************************************************
function loadAlerts(data, today, url){
  var d = JSON.parse(data.responseText);

  //Grabs the name of the day based on the deadline date in the DB
  for (var i = 0; i < d.length; i++){
    var day = whichDay(d[i].deadline);
    d[i]['day']= day;
  }

  var rg = regroup_list_by(d, 'day');
  var rows = 0;
  var list = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];


  for (var i = 0; i < list.length; i++){    //list is 
    var day = list[i];    //Get the day

    if (!rg[day]) continue;        //If there aren't any days that have an entry continue on
          

    for (var j = 0; j < rg[day].length; j++){
      while ($(".row").length < rg[day].length){
        $('#issues_table').append("<tr id='row_" + rows + "' class='row'><td class='day_of_week Monday'></td><td class='day_of_week Tuesday'></td>"
          + "<td class='day_of_week Wednesday'></td><td class='day_of_week Thursday'></td><td class='day_of_week Friday'></td></tr>");
        rows++;
      }
      

      var e = $('#row_' + j + ' .' + day);    //create a variable to hold query data. Look for class="row_j" and id=""
      if(rg[day][j].deadline < today){
        e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline' style='background-color:red;'>{short}</td>" + 
                "<td class='btn alert' data-part_num='{post_it_id}' id='{alert_type}'>{owner} - {description}</td>").format(rg[day][j]));
      }
      else if(rg[day][j].deadline == today){
        e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline' style='background-color:grey;'>{short}</td>" + 
                "<td class='btn alert' data-part_num='{post_it_id}' id='{alert_type}'>{owner} - {description}</td>").format(rg[day][j]));
      }
      else{
        e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline'>{short}</td>" + 
                "<td class='btn alert' data-part_num='{post_it_id}' id='{alert_type}'>{owner} - {description}</td>").format(rg[day][j]));
      }
      

      e.promise().done(function(){
        $(".btn", this).on('click touchstart', function(){ 
          window.location.href = url + jQuery.attr(this, "data-part_num");
        });
      });
    }
  }  
}// End loadAlerts


//************************************************************************
// Used by loadAlerts() to format that way the data will be
// displayed in the table element
//************************************************************************
function regroup_list_by(list, categorize) {  
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
}// End regroup_list_by()


//************************************************************************
// Called by load alerts to get the current day of the week
// based on an incoming date string
//************************************************************************
function whichDay(dateString) {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][new Date(dateString).getDay()];
}

function Press_Enter(){
  $("form input").keypress(function (e) {
    if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
      $('button[type=submit] .default').click();
      return false;
    }
    else 
      return true;
  });
}// End Press_Enter