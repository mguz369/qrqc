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
var add_row_counter = '0';
var interval_timer = 3600000;   //1 hour
var users, username, password;

$(document).ready(function () {
  $('#login_button').click(function (){
    var level = Cookies.get('level');
    Press_Enter();
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

        if(parsed_data != "0"){
          Cookies.set('is_valid', 'valid');
          if(level == 'Plant')
            window.location.href = "/index";
          else if(level == 'Mixing')
            window.location.href = "/index_mixing";
          else if(level == 'Auto')
            window.location.href = "/index_auto";
          else if(level == "Jim")
            window.location.href = "/index_exec";
          else if(level == "Cadillac")
            window.location.href = "/icad";
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
    setTimeout(function(){
      var level = Cookies.get('level');

      if(level == "Plant")
        window.location.href = "/";
      else if(level == "Mixing")
        window.location.href = "/view_mixing"; 
      else if(level == 'Auto')
        window.location.href = "/view_auto";
      else if(level == 'Cadillac')
        window.location.href = "/vcad";
    }, interval_timer);
  }

  function Check_Valid(){
    var validity = Cookies.get('is_valid');
    var level = Cookies.get('level');

    if(level != "Cadillac"){
      if(validity == "invalid" && level == "Plant")
        window.location.href = "/";
      else if(validity == "invalid" && level == "Mixing")
          window.location.href = "/view_mixing";
      else if(validity == "invalid" && level == "Auto")
          window.location.href = "/view_auto";
      else if(validity == "invalid" && level == "Jim")
          window.location.href = "/view_exec";
    }   
    else{ 
      if(validity == "invalid")
        window.location.href = "/vcad";
    }
  }

  //View pages, not logged in
  $('#view_page').exists(function() {
    Cookies.set('is_valid', 'invalid');
    Cookies.set('level', 'Plant');

    var url = "view?id=";
    var query_url = "/show_current_alerts"
    Show_Current(query_url, url);
  });//End view_page

  $('#view_mixing_page').exists(function() {
    Cookies.set('is_valid', 'invalid');
    Cookies.set('level', 'Mixing');

    var url = "view?id=";
    var query_url = "/show_mixing_alerts"
    Show_Current(query_url, url);
  });//End view_page

  $('#view_auto_page').exists(function() {
    Cookies.set('is_valid', 'invalid');
    Cookies.set('level', 'Auto');

    var url = "view?id=";
    var query_url = "/show_auto_alerts"
    Show_Current(query_url, url);
  });//End view_page

  //View pages, not logged in
  $('#view_jt_page').exists(function() {
    Cookies.set('is_valid', 'invalid');
    Cookies.set('level', 'Jim');

    var url = "view2?id=";
    var query_url = "/show_jt_alerts"
    Show_JT_Current(query_url, url);
  });//End view_page


  $('#view_cadillac').exists(function() {
    Cookies.set('is_valid', 'invalid');
    Cookies.set('level', 'Cadillac');

    var url = "view?id=";
    var query_url = "/show_cad_alerts"
    Show_Current(query_url, url);
  });//End view_page

  //************************************************************************
  // Index Pages
  $('#index_page').exists(function() {
    Check_Valid();

    var url = "create?id=";
    var query_url = "/show_current_alerts"
    Show_Current(query_url, url);
    Start_Timer();    

    //If needing to make a new alert, create an entry in the DB and update it on submit later on
    $('.categories').on('click touchstart', function () {
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

  $('#mixing_page').exists(function(){
    Check_Valid();

    var url = "create_mixing?id=";
    var query_url = "/show_mixing_alerts";
    Show_Current(query_url, url);
    Start_Timer();

    $('.categories').on('click touchstart', function () {
      var elem_id = event.target.id;
      
      var payload = {
        category : elem_id
      };

      $.ajax({
        url         : "/create_mixing",
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
  });// End index_mixing
  
  $('#auto_page').exists(function(){
    Check_Valid();

    var url = "create_auto?id=";
    var query_url = "/show_auto_alerts";
    Show_Current(query_url, url);
    Start_Timer();

    $('.categories').on('click touchstart', function () {
      var elem_id = event.target.id;
      
      var payload = {
        category : elem_id
      };

      $.ajax({
        url         : "/create_auto",
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
  });

  $('#jt_page').exists(function(){
    Check_Valid();

    var url = "create_exec?id=";
    var query_url = "/show_jt_alerts";
    Show_Current(query_url, url);
    Start_Timer();

     $('.categories').on('click touchstart', function () {
      var elem_id = event.target.id;
      
      var payload = {
        category : elem_id
      };
      
      $.ajax({
        url           : "/create_jt",
        type          : "POST",
        contentType   : "application/json",
        data          : JSON.stringify(payload),
        processData   : false,
        complete      : function(data){
            var parsed_data = JSON.parse(data.responseText);
            window.location.href = url + parsed_data[0].insertId;
        }
      });
    });
  });//End index_jt

  $('#cadillac_page').exists(function(){
    Check_Valid();

    var url = "ccad?id=";
    var query_url = "/show_cad_alerts";
    Show_Current(query_url, url);
    Start_Timer();

    $('.categories').on('click touchstart', function () {
      var elem_id = event.target.id;
      
      var payload = {
        category : elem_id
      };

      $.ajax({
        url         : "/create_cad",
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
  });// End index_mixing

  //************************************************************************
  // Page is a template to be used by the various level (Plant, Mixing, etc)
  $('#create_page').exists(function(){
    var body;
    try{
       body = document.getElementsByClassName('disabled')[0].className;
    }catch(e){
      if(body === undefined)
        body = "";
      
      Check_Valid();
      Start_Timer();
    }
    Load_Create(body);    

    $('#return_home').on('click touchstart', function () {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/index';
      else
        return false;
    });

    $('#mixing_home').on('click touchstart', function () {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/index_mixing';
      else
        return false;
    });

    $('#auto_home').on('click touchstart', function () {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/index_auto';
      else
        return false;
    });

    $('#cad_home').on('click touchstart', function () {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/icad';
      else
        return false;
    });
  });

  $('#create_jt_page').exists(function(){
    var body;
    try{
       body = document.getElementsByClassName('disabled')[0].className;
    }catch(e){
      if(body === undefined)
        body = "";
      
      Check_Valid();
      Start_Timer();
    }

    Load_JT_Create(body);

    $('#jt_home').on('click touchstart', function () {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/index_exec';
      else
        return false;
    });    
  });//End create_page

  //************************************************************************
  // Adds another row to the Additional Info section
  //************************************************************************
  $('#add_row').on('click touchstart', function () {
    Add_New_Alert();
  });//End add_row

  $('#add_jt_row').on('click touchstart', function () {
    Add_New_JT_Alert();
  });//End add_row

  //************************************************************************
  // Creates a new aletry entry into the DB
  // Stores data entered in the fields from the webpage and sends them
  // to the server as a JSON string
  //************************************************************************
  $('#submit_plant').on('click touchstart', function (){
    //var go = 
    Submit_Data();
    //console.log(go)

    //if(go == 1)
      window.location.href = '/index';
  });//End submit_plant

  $('#submit_mix').on('click touchstart', function (){
    var go = Submit_Data();
    if(go == 1)
      window.location.href = '/index_mixing';  
  });//End submit_mix

  $('#submit_auto').on('click touchstart', function (){
    var go = Submit_Data();
    if(go == 1)
      window.location.href = '/index_auto';  
  });//End submit_auto

  $('#submit_jt').on('click touchstart', function (){
    Submit_JT_Data();
    window.location.href = '/index_jt';
  });//End subit_jt

  $('#submit_cad').on('click touchstart', function (){
    var go = Submit_Data();
    if(go == 1)
      window.location.href = '/icad';  
  });//End submit_cad

  $('#view_return').on('click touchstart', function (){
    var level = Cookies.get('level');

    if(level == "Plant")
        window.location.href = "/";
    else if(level == "Mixing")
        window.location.href = "/view_mixing";
    else if(level == "Auto")
        window.location.href = "/view_auto";
    else if(level == "Jim")
        window.location.href = "/view_exec";
    else if(level == "Cadillac")
        window.location.href = "/vcad";
  });

  //Remove the last newly added action row
  $(document).on('click', '#delete', function () {
    $('.' + (add_row_counter - 1)).closest('tr').remove();
    add_row_counter--;
    return false;
  });

  //Check for changes to a complete
  $(document).keypress(function (){

    var elem_id = event.target.id;
    var elem_data = $("#" + elem_id).val();
    var column_name = $("#" + elem_id).attr("name");
    if(column_name == 'description'){
      var elem_row = elem_id.lastIndexOf("_") + 1;
      elem_row = elem_id.substring(elem_row);
      $('#email_' + elem_row).prop('checked', false);
    }
  });

  $(document).change(function (event) {
    var elem_id = event.target.id;
    var elem_data = $("#" + elem_id).val();
    var column_name = $("#" + elem_id).attr("name");
    console.log(column_name);

    if(column_name == 'deadline'){
      var today = GetToday();

      var elem_row = elem_id.lastIndexOf("_") + 1;
      elem_row = elem_id.substring(elem_row);

      if(today == elem_data){
        $('#state_' + elem_row).html("Due");
        $('#state_' + elem_row).removeClass('task_late task_open task_new').addClass('task_due');
      }
      else if(today < elem_data){
        $('#state_' + elem_row).html("Open");
        $('#state_' + elem_row).removeClass('task_due task_open task_new').addClass('task_open');
      }
      else if (today > elem_data){
        $('#state_' + elem_row).html("Late");
        $('#state_' + elem_row).removeClass('task_due task_open task_new').addClass('task_late');
      }

      $('#email_' + elem_row).prop('checked', false);
    }
    else if(column_name == 'owner'){
      var elem_row = elem_id.lastIndexOf("_") + 1;
      elem_row = elem_id.substring(elem_row);
      $('#email_' + elem_row).prop('checked', false);
    }
    else if(column_name == 'complete'){
      var option = confirm("Are you sure you want to change the completion date?");
      if(option == true)
        return true;
      else
        $("#" + elem_id).val(null);
    }   
  });
});//End document.ready
//************************************************************************

//************************************************************************
// Add an addition info row for an alert.
//************************************************************************
function Add_Alert(disabled){
  $("#action_table").append(
    " <tr class='info_rows'>" +
    " <td class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "' " + disabled + ">"+ 
    "   <option value='Empty'>---</option>" + 
    "   <option value='1'>Immediate</option>" +
    "   <option value='2'>Temporary</option>" +
    "   <option value='3'>Permanent</option> </select></td>" +
    " <td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text' name='description'" + disabled + "> </input> </td>" +
    " <td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text' name='owner' "    + disabled + "> </select> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date' "                 + disabled + "> </input> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline' " + disabled + "> </input> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete' " + disabled + "> </input> </td>" +
    " <td class='table_data'> <div    class='added_row' id='state_"            + add_row_counter + "' " + disabled + ">Open</div></td>" +
    " <td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
    " <td class='table_data' style='text-align: center'>X</td>" +
    " <td class='hidden_element'> <input type='text' id='item_id_" + add_row_counter + "'/></td></tr>"
  );
  
  Update_Owners(users.length);
  add_row_counter++;  //Increment
}// End Add_alert()

function Add_New_Alert(){
  $("#action_table").append(
    " <tr class='info_rows "+ add_row_counter + "'>" +
    " <td  class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "'>"+ 
    "   <option value='Empty'>---</option>" + 
    "   <option value='1'>Immediate</option>" +
    "   <option value='2'>Temporary</option>" +
    "   <option value='3'>Permanent</option> </select></td>" +
    " <td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text' name='description'> </input> </td>" +
    " <td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text' name='owner'> </select> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date' disabled> </input> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline'> </input> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete'> </input> </td>" +
    " <td class='table_data'> <div    class='added_row task_new' id='state_"   + add_row_counter + "'>Open</div></td>" +
    " <td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
    " <td class='table_data'> <button class='added_row btn btn-blue' id='delete' type='button'>Delete</button></td>" +
    " <td class='hidden_element'> <input type='text' id='item_id_"       + add_row_counter + "'/></td></tr>"
  );
  
  var today = GetToday();
  
  $('#date_start_' + add_row_counter).val(today);
  $('#date_ending_'+ add_row_counter).val(today);
  Update_Owners(users.length);
  add_row_counter++;  //Increment
}

//************************************************************************
// Add an addition info row for an alert.
//************************************************************************
function Add_JT_Alert(disabled){
    $("#action_table").append(
      " <tr class='info_rows'>" +
      " <td class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "' " + disabled + ">"+ 
      "   <option value='Empty'>---</option>" + 
      "   <option value='1'>Project</option>" +
      "   <option value='2'>System</option>" +
      "   <option value='3'>Task</option> </select></td>" +
      " <td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text' " + disabled + "> </input> </td>" +
      " <td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text' name='owner' " + disabled + "> </select> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date' " + disabled + "> </input> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline' " + disabled + "> </input> </td>" +
      " <td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete' " + disabled + "> </input> </td>" +
      " <td class='table_data'> <div    class='added_row' id='state_"            + add_row_counter + "' " + disabled + ">Open</div></td>" +
      " <td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
      " <td class='table_data' style='text-align: center'>X</td>" +
      " <td class='hidden_element'> <input type='text' id='item_id_"       + add_row_counter + "'/></td></tr>"
    );
    
    Update_Owners(users.length);
    add_row_counter++;  //Increment
}// End Add_alert()

function Add_New_JT_Alert(){
  $("#action_table").append(
    " <tr class='info_rows "+ add_row_counter + "'>" +
    " <td  class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "'>"+ 
    "   <option value='Empty'>---</option>" + 
    "   <option value='1'>Project</option>" +
    "   <option value='2'>System</option>" +
    "   <option value='3'>Task</option> </select></td>" +
    " <td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text'> </input> </td>" +
    " <td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text' name='owner'> </select> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date' disabled> </input> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline'> </input> </td>" +
    " <td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete'> </input> </td>" +
    " <td class='table_data'> <div    class='added_row task_new' id='state_"   + add_row_counter + "'>Open</div></td>" +
    " <td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
    " <td class='table_data'> <button class='added_row btn btn-blue' id='delete' type='button'>Delete</button></td>" +
    " <td class='hidden_element'> <input type='text' id='item_id_"       + add_row_counter + "'/></td></tr>"
  );
  var today = GetToday();
  
  $('#date_start_' + add_row_counter).val(today);
  $('#date_ending_'+ add_row_counter).val(today);
  Update_Owners(users.length);
  add_row_counter++;  //Increment
}


function Load_Create(disabled){
  //Press_Enter();
  console.log("Load_Create");
  var url = "";
  var level = Cookies.get('level');
  console.log("Level: ", level);

  var dept = $('#department').val();
  var payload = { department : dept };

  //When department changes, change all owner boxes
  $('#department').on('change', function(){

    dept = $('#department').val();
    payload = { department : dept };
    console.log("Value changed to: ", dept);

    
    if(level == "Cadillac"){
      url = "/get_cad_users";
      console.log(url);
    }
    else
      url = "/get_users";

    $.ajax({
      url         : url,
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
    if(level == "Cadillac"){
      url = "/get_cad_users";
      console.log(url);
    }
    else
      url = "/get_users";

    $.ajax({
    url         : url,
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

       Pull_Data($.urlParam('id'), disabled);
    }
  });

  $('#id_number').html($.urlParam('id'));
}//End Load_Create()

function Load_JT_Create(disabled){
    //Press_Enter();
    var dept = $('#department').val();
    var payload = { department : dept };

    //preload users[] so that changing can be done
    $.ajax({
      url         : "/get_jt_users",
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
      url         : "/get_jt_part_nums",
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
      url         : "/get_jt_customers",
      type        : "POST",
      contentType : "application/json",
      complete    : function(data){
        var parsed_data = JSON.parse(data.responseText);

        for(var i = 0; i < parsed_data.length; i++){
          var customer = parsed_data[i].name;
          $('#customer').append("<option value='" + customer + "'>" + customer + "</option>" );
        }

         Pull_JT_Data($.urlParam('id'), disabled);
      }
    });

    $('#id_number').html($.urlParam('id'));
}//End Load_JT_Create()

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
      var today = GetToday()    
      loadAlerts(data, today, url);
    }
  });
}// End Show_Current();

function Show_JT_Current(query_url, url){
  $.ajax({
    url         : query_url,
    type        : "POST",
    contentType : "application/json",
    processData : false,
    complete    : function(data){
      var today = GetToday();      
      loadAlerts(data, today, url);
    }
  });
}// End Show_Current();

//************************************************************************
// When an alert is clicked from the home page, pull data from the DB
// and populate fields with the data
//************************************************************************
function Pull_Data(id, disabled){
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
            
            Add_Alert(disabled);//Add a row to the action area

            $('#term_length_' + j).val(t_length);
            $('#term_description_' + j).val(t_descript);
            $('#responsible_' + j).val(responsible);
            $('#date_start_' + j).val(date_start);
            $('#date_ending_' + j).val(date_ending);
            $('#date_completed_' + j).val(date_completed);
            if (email == 1) 
              $('#email_' + j).prop('checked', true);
            if (state == 'Late'){
              $('#state_' + j).removeClass('task_due task_open task_new').addClass('task_late');
            }

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
              $('#state_' + j).removeClass('task_late task_open task_due task_new').addClass('task_complete');
            }
            if(state == "Due"){
              $('#state_' + j).removeClass('task_late task_open task_new').addClass('task_due');
            }
            $('#email_' + j).attr('disabled', 'disabled');
          }          
        }
      }
    }//End complete*/
  });
}// End Pull_Data()

function Pull_JT_Data(id, disabled){
    var payload = {
      id : id,
    };

    $.ajax({
      url         : "/pull_jt_data",
      type        : "POST",
      contentType : "application/json",
      processData : false,
      data        : JSON.stringify(payload),
      complete    : function(data){      
        var parsed_data = JSON.parse(data.responseText);

        var a_type, date_posted, region, location, part_num, customer, repeat, issue, cause; //First section
        var t_length, t_descript, responsible, date_start, date_ending, date_completed, email, state, i_id;//Second section

        for(var i = 0; i < parsed_data.length; i++){
          for(var j = 0; j < parsed_data[i].length; j++){
            if(i == '0' && j == '0'){                   //Only grab General info once
              a_type      = parsed_data[i][j].alert_type;
              date_posted = parsed_data[i][j].date;
              region      = parsed_data[i][j].region;
              location    = parsed_data[i][j].location;
              part_num    = parsed_data[i][j].part;
              customer    = parsed_data[i][j].customer
              repeat      = parsed_data[i][j].recurrence;
              issue       = parsed_data[i][j].issue;
              cause       = parsed_data[i][j].cause;


              //Output to html
              $('#alert_type').val(a_type).trigger('change');
              $('#date_initial').val(date_posted);
              $('#region').val(region);
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
              
              Add_JT_Alert(disabled);//Add a row to the action area

              $('#term_length_' + j).val(t_length);
              $('#term_description_' + j).val(t_descript);
              $('#responsible_' + j).val(responsible);
              $('#date_start_' + j).val(date_start);
              $('#date_ending_' + j).val(date_ending);
              $('#date_completed_' + j).val(date_completed);
              if (email == 1) 
                $('#email_' + j).prop('checked', true);
              if (state == 'Late'){
                $('#state_' + j).removeClass('task_due task_open task_new').addClass('task_late');
              }

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
                $('#state_' + j).removeClass('task_late task_open task_due task_new').addClass('task_complete');
              }
              if(state == "Due"){
                $('#state_' + j).removeClass('task_late task_open task_new').addClass('task_due');
              }
              $('#email_' + j).attr('disabled', 'disabled');
            }          
          }
        }
      }//End complete*/
    });
}// End Pull_JT_Data()

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

  if(issue.length == 0 || location.length == 0 || cause.length == 0){
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
      var level = Cookies.get('level');

      if(!$('#email_' + i).is(':checked')){
        //depending on what level is in the cookie call a different format email function
        Format_Email(responsible, dept, location, part_num, issue, cust, t_descript, date_ending, level);
      }
      
      date_completed = null;
    }
    else if(date_completed != "")
      state = "Closed";
    
    //Make sure that important fields are filled in
    if(t_length == 'Empty' || date_start == "" || date_ending == ""){
      alert("Please make sure all fields are filled in for action " + (i + 1));
      //return 0;
    }
    //else{
      //return 1;
    //}
    var today = GetToday();
    
    if(date_ending == today && date_completed == null)
      state = "Due";      

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

function Submit_JT_Data() {
  var post_id;    

  //Information write to DB
  var a_type, date_posted, location, part_num, customer, repeat, issue, cause, active, region;
  a_type      = $('#alert_type').val();
  date_posted = $('#date_initial').val();
  region      = $('#region').val();
  location    = $('#location').val();
  part_num    = $('#part_num').val();
  cust        = $('#customer').val();
  repeat      = $('#recur').val();
  issue       = $('#issue_desc').val();
  cause       = $('#cause_desc').val();
  post_id     = $('#id_number').text();
  active      = 1;

  var payload = {
    type       : a_type,
    date       : date_posted,
    region     : region,
    location   : location,
    part       : part_num,
    customer   : cust,
    recurrence : repeat,
    i_desc     : issue,
    c_desc     : cause,      
    post_id    : post_id,
    is_active  : active,
  };

  $.ajax({
    url         : "/update_jt_post_it",
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
    active          = '1';
    item_id         = $('#item_id_' + i).val();
      

    //*****************************************************
    // Formatting and error checking
    if(date_completed == ""){
      date_completed = null;
      if(!$('#email_' + i).is(':checked'))
        Format_JT_Email(responsible, region, location, part_num, issue, cust, t_descript, date_ending);
    }
    else if(date_completed != "")
      state = "Closed";
    
    //Make sure that important fields are filled in
    if(t_length == '---' || responsible == '---' || date_start == "" || date_ending == ""){
      console.log(t_length + ' ' + responsible + ' ' + date_start + ' ' + date_ending)
      alert("Please make sure all fields are filled in for action " + (i + 1));
      return false;
    }
    else{
      window.location.href = '/index_exec';

      var today = GetToday();        
      if(date_ending == today && date_completed == null){
        state = "Due";
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
    }//end else
  }
}// End Submit_JT_Data()

function Format_Email(responsible, dept, location, part_num, issue, customer, t_descript, date_ending){
  var level = Cookies.get('level');
  
  if(level == "Cadillac"){
    url = 'get_cad_email';
  }
  if(level == "Jim"){
     Format_JT_Email();
  }
  else{
     url = 'get_email';
  }

  var payload3 = {
    owner      : responsible,
    department : dept,
    location   : location,
    part       : part_num,
    issue      : issue,
    customer   : customer,
    description: t_descript,
    ending     : date_ending
  };

  $.ajax({
    url         : url,
    type        : "POST",
    contentType : "application/json",
    processData : false,
    data        : JSON.stringify(payload3)
  });
}//End Format_Email()

function Format_JT_Email(responsible, region, location, part_num, issue, customer, t_descript, date_ending){
  var payload3 = {
    owner      : responsible,
    location   : location,
    part       : part_num,
    issue      : issue,
    customer   : customer,
    description: t_descript,
    ending     : date_ending
  };

  $.ajax({
    url         : "/get_jt_email",
    type        : "POST",
    contentType : "application/json",
    processData : false,
    data        : JSON.stringify(payload3)
  });
}//End Format_Email()

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
         $('#_table').append("<tr id='row_" + rows + "' class='row'><td class='day_of_week Monday'></td><td class='day_of_week Tuesday'></td>"
          + "<td class='day_of_week Wednesday'></td><td class='day_of_week Thursday'></td><td class='day_of_week Friday'></td></tr>");
        rows++;
      }
      
      var e = $('#row_' + j + ' .' + day);    //create a variable to hold query data. Look for class="row_j" and id=""
      if(rg[day][j].deadline < today){
        e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline' style='background-color:red; color: white;'>{short}</td>" + 
                "<td class='btn alert' id='{alert_type}' data-part_num='{post_it_id}'>{owner} - {description}</td>").format(rg[day][j]));
      }
      else if(rg[day][j].deadline == today){
        e.html( ("<td class='btn date' data-part_num='{post_it_id}' id='deadline' style='background-color:grey; color: white;'>{short}</td>" + 
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

function GetToday(){
  var date = new Date()
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var year = date.getFullYear();

      if(day < 10)
          day = '0' + day;
      if(month < 10)
          month = '0' + month;
  var today = year + "-" + month + "-" + day;

  return today;
}