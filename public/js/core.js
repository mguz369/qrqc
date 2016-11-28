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
  var users, username, password;
  
  $('#page-id-index').exists(() => {
    Cookies.set('is_valid', 'invalid');
  });

  $('#login_button').click(() => {
    password = $('#password').val().trim();
    username = $('#username').val().trim();
    
    var login_info = {
      user : username,
      pass : password
    };
    
    
    $.ajax({
      url         : "/login_user",
      method      : "POST",
      contentType : "application/json",
      data        : JSON.stringify(login_info),
      processData : false,
      complete    : function(data){
        const parsed_data = JSON.parse(data.responseText);

        if(parsed_data == "1"){
          Cookies.set('is_valid', 'valid');
          window.location.href = "/index";
        }
        else{
          $('.admin-login-form .error').text("Invalid login").show().addClass('invalid');
          Cookies.set('is_valid', 'invalid');
        }
      }
    });
  });


  //************************************************************************
  // When the home page is loaded, populate with a list of existing issues
  // based on the days of the week
  function Start_Timer(){
     setInterval(function(){
      window.location.href = "/";
      Cookies.set('is_valid', 'invalid');
    }, 1800000);
  }
  function Check_Valid(){
    if(Cookies.get('is_valid') == "invalid")
      window.location.href = "/";
  }

  $('#index_page').exists(function() {
    Check_Valid();

    var url = "create?id=";
    var query_url = "/show_current_alerts"
    Show_Current(query_url, url);
    Start_Timer();
   
    setInterval(function(){
      $.ajax({
        url  : '/get_now',
        type : 'POST',
        contentType : "application/json",
        processData : false,
        complete    : function(data){
          var parsed_data = JSON.parse(data.responseText);

          $("#Date").text(parsed_data[0].date);
          $("#Time").text(parsed_data[0].time);
        }
      }, 10000);
    });

    //If needing to make a new alert, create an entry in the DB and update it on submit later on
    $('.categories').on('click touchstart', () => {
      var elem_id = event.target.id;
      
      var payload = {
        category : elem_id
      };

      $.ajax({
        url         : "/create_plant",
        type        : "POST",
        contentType : "application/json",
        data        : JSON.stringify(payload),
        processData : false,
        complete    : function(data){
          var parsed_data = JSON.parse(data.responseText);
          window.location.href = url + parsed_data[0].insertId;
        }
      });
    });
  
  });//End index_page

  //************************************************************************
  // Mixing
  $('#mixing_page').exists(function(){
    Check_Valid();
    var url = "mixing_alert?id=";
    var query_url = "/show_mixing_alerts"

    Start_Timer();

    $('#mixing_alert_redirect').on('click touchstart', () => { 
      $.ajax({
        url         : "/create_mixing",
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

  //************************************************************************
  // Page is a template to be used by the various level (Plant, Mixing, etc)
  $('#create_page').exists(function(){
    Check_Valid();
    Start_Timer();
    Load_Create();

    $('#return_home').on('click touchstart', () => {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/index';
      else
        return false;
    });

    $('#mixing_home').on('click touchstart', () => {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/mixing';
      else
        return false;
    });
  });//End create_page


 
  //************************************************************************
  // Adds another row to the Additional Info section
  //************************************************************************
  $('#add_row').click(() => {
    Add_New_Alert("action_table");
  });//End add_row

  //************************************************************************
  // Creates a new aletry entry into the DB
  // Stores data entered in the fields from the webpage and sends them
  // to the server as a JSON string
  //************************************************************************
  $('#submit_plant').click(function(){
    Submit_Data();

  
    // Wait 5 seconds before redirect so emails can be sent
    setTimeout(function(){
      window.location.href = '/index';
    }, 2000);  
  });//End submit_plant

  $('#submit_mix').click(function(){
    Submit_Data();

    console.log(this.id);
    // Wait 5 seconds before redirect so emails can be sent
    setTimeout(function(){
      window.location.href = '/mixing';
    }, 2000);  
  });//End submit_plant
  //************************************************************************
  // Add an addition info row for an alert.
  //************************************************************************
  function Add_Alert(){
    $("#action_table").append(
      " <tr class='info_rows'>" +
      " <td class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "'>"+ 
      "   <option value='Empty'>---</option>" + 
      "   <option value='1'>Immediate</option>" +
      "   <option value='2'>Temporary</option>" +
      "   <option value='3'>Permanent</option> </select></td>" +
      " <td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text'> </input> </td>" +
      " <td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text'> </select> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date'> </input> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline'> </input> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete'> </input> </td>" +
      " <td class='table_data'> <div    class='added_row' id='state_"            + add_row_counter + "'>Open</div></td>" +
      " <td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
      " <td class='table_data' style='text-align: center'>X</td>" +
      " <td class='hidden_element'> <input type='text' id='item_id_"       + add_row_counter + "'/></td></tr>"
    );
    
    Update_Owners(users.length);
    add_row_counter++;  //Increment
  }// End Add_alert()


  function Add_New_Alert(tableID){
    $("#action_table").append(
      " <tr class='info_rows "+ add_row_counter + "'>" +
      " <td  class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "'>"+ 
      "   <option value='Empty'>---</option>" + 
      "   <option value='1'>Immediate</option>" +
      "   <option value='2'>Temporary</option>" +
      "   <option value='3'>Permanent</option> </select></td>" +
      " <td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text'> </input> </td>" +
      " <td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text'> </select> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date'> </input> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline'> </input> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete'> </input> </td>" +
      " <td class='table_data'> <div    class='added_row' id='state_"            + add_row_counter + "'>Open</div></td>" +
      " <td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
      " <td class='table_data'> <button class='added_row btn btn-blue' id='delete' type='button'>Delete</button></td>" +
      " <td class='hidden_element'> <input type='text' id='item_id_"       + add_row_counter + "'/></td></tr>"
    );
    
    Update_Owners(users.length);
    add_row_counter++;  //Increment
  }

  function Load_Create(){
    Press_Enter();
    var dept = $('#department').val();
    var payload = { department : dept };

    //When department changes, change all owner boxes
    $('#department').on('change', function(){
      dept = $('#department').val();
      payload = { department : dept };
      console.log("Value changed to: ", dept);

      $.ajax({
        url         : "/get_users",
        type        : "POST",
        contentType : "application/json",
        data        : JSON.stringify(payload),
        complete    : function(data){ 
          var parsed_data = JSON.parse(data.responseText); 
          users = parsed_data;
         
          Empty_Owners();
          Repopulate_Owners(users.length);
        }
      });
    });


    //preload users[] so that changing can be done
    $.ajax({
      url         : "/get_users",
      type        : "POST",
      contentType : "application/json",
      data        : JSON.stringify(payload),
      complete    : function(data){ 
        var parsed_data = JSON.parse(data.responseText); 
        users = parsed_data;

        Update_Owners(users.length);
      }
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
  }//End Load_CReate()

  function Empty_Owners(){
    for(var j = 0; j <= add_row_counter; j++){
      $('#responsible_' + j).empty();
    }
  }//End Empty_Owners()
  
  function Update_Owners(length){
    for(var i = 0; i < length; i++){
      for(var j = add_row_counter; j > add_row_counter - 1; j--){
        var owner = users[i].name;
        $('#responsible_' + j).append("<option value='" + owner + "'>" + owner + "</option>" );
      }
    }
  }// End Update_Owners
  
  function Repopulate_Owners(length){
    for(var i = 0; i < length; i++){
      for(var j = 0; j <= add_row_counter; j++){
        var owner = users[i].name;
        $('#responsible_' + j).append("<option value='" + owner + "'>" + owner + "</option>" );
      }
    }
  }// End Repopulate_Owners
  
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
              $('#alert_type').val(a_type).trigger('change');
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
              
              Add_Alert();//Add a row to the action area

              $('#term_length_' + j).val(t_length);
              $('#term_description_' + j).val(t_descript);
              $('#responsible_' + j).val(responsible);
              $('#date_start_' + j).val(date_start);
              $('#date_ending_' + j).val(date_ending);
              $('#date_completed_' + j).val(date_completed);
              if (email == 1) 
                $('#email_' + j).prop('checked', true);
              if (state == 'Late')
                 $('#state_' + j).css('background-color', 'red');
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
                $('#state_' + j).css('background-color', 'green');
                $('#state_' + j).css('color', 'white');
                $('#state_' + j).css('border-color', 'black');
              }
              if(state == "Due"){
                $('#state_' + j).css('background-color', '#006bb3');
                $('#state_' + j).css('color', 'white');
                $('#state_' + j).css('border-color', 'black');
              }
              $('#email_' + j).attr('disabled', 'disabled');
            }          
          }
        }
      }//End complete*/
    });

  }// End Pull_Data()

  function Submit_Data() {
    var post_id;    

    //Information write to DB
    var a_type, date_posted, dept, location, part_num, customer, repeat, issue, cause, active;
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

    if(a_type == null || date_posted == "" || dept == null){
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
      state           = $('#state_' + i).html();
      email           = 1;
      active          = 1;
      item_id         = $('#item_id_' + i).val();
        

      //*****************************************************
      // Formatting and error checking
      if(date_completed == ""){
        if(!$('#email_' + i).is(':checked'))
          Format_Email(responsible, dept, location, part_num, issue, cust, t_descript, date_ending);
        
        date_completed = null;
      }
      else if(date_completed != "")
        state = "Closed";
      
      //Make sure that important fields are filled in
      if(t_length == '---' || responsible == '---' || date_start == "" || date_ending == ""){
        alert("Please make sure all fields are filled in for action " + (i + 1));
        return false;
      }

      //
      var date = new Date()
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var year = date.getFullYear();

      if(day < 10)
          day = '0' + day;
      if(month < 10)
          month = '0' + month;
      var today = year + "-" + month + "-" + day;
      
      console.log(date_ending + " " + today)
      if(date_ending == today && date_completed == null){
        state = "Due";
        console.log(state)
      }

      //var weekend_day = new Date(date_ending).getUTCDay();
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
  }// End Submit_Data()
  
  function Format_Email(responsible, dept, location, part_num, issue, customer, t_descript, date_ending){
    var payload3 = {
      owner     : responsible,
      department : dept,
    };

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
          var message = ("You have been assigned a task for QRQC:\n\n" +
                         "Location: "+ location + " \nPart Number: "+ part_num +" \nCustomer: "+ customer +
                         "\nIssue Description: " + issue + 
                         "\nAction to be Taken: "+ t_descript + " \nTask deadline is: "+ date_ending);
          
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


  //Remove the last newly added action row
  $(document).on('click', '#delete', () => {    
    $('.' + (add_row_counter - 1)).closest('tr').remove();
    add_row_counter--;
    return false;
  });

  //Check for changes to a complete 
  $(document).change((event) => {
    var elem_id = event.target.id;
    var elem_data = $("#" + elem_id).val();
    var column_name = $("#" + elem_id).attr("name");


    if(column_name == 'complete'){
      var option = confirm("Are you sure you want to change the completion date?");
      if(option == true)
        return true;
      else
        $("#" + elem_id).val(null);
    }

    if(column_name == 'deadline'){      
      var date = new Date();
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var year = date.getFullYear();
      
      if(day < 10)
          day = '0' + day;
      if(month < 10)
          month = '0' + month;
      var today = year + "-" + month + "-" + day;

      var elem_row = elem_id.lastIndexOf("_") + 1;
      elem_row = elem_id.substring(elem_row);
      

      if(today == elem_data){
        $('#state_' + elem_row).html("Due");
        $('#state_' + elem_row).css('background-color', '#006bb3');
        $('#state_' + elem_row).css('color', 'white');
        $('#state_' + elem_row).css('border-color', 'black');
        $('#email_' + elem_row).prop('checked', false);
      }
      else if(today < elem_data){
        $('#state_' + elem_row).html("Open");
        $('#state_' + elem_row).css('background-color', 'white');
        $('#state_' + elem_row).css('color', 'black');
        $('#email_' + elem_row).prop('checked', false);
      }
      else if (today > elem_data){
        $('#state_' + elem_row).html("Late");
        $('#state_' + elem_row).css('background-color', 'red');
      }
    }
  });
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

    if(day == "Saturday")
      day = "Friday";
    if(day == "Sunday")
      day = "Monday";

    d[i]['day']= day;
  }

  var rg = regroup_list_by(d, 'day');
  var rows = 0;
  var list = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


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
                "<td class='btn alert' id='{alert_type}' data-part_num='{post_it_id}'>{owner} - {description}</td>").format(rg[day][j]));
      }
      else if(rg[day][j].deadline == today){
        e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline' style='background-color:grey;'>{short}</td>" + 
                "<td class='btn alert' id='{alert_type}' data-part_num='{post_it_id}'>{owner} - {description}</td>").format(rg[day][j]));
      }
      else{
        e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline'>{short}</td>" + 
                "<td class='btn alert' id='{alert_type}' data-part_num='{post_it_id}'>{owner} - {description}</td>").format(rg[day][j]));
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
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][new Date(dateString).getDay()];
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

  function Set_State(){
    
  }//End Late
}// End Press_Enter