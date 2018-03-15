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
var add_row_counter = '-1';
var interval_timer = 3600000;   //1 hour
var users, username, password;
var idleTime = 0;


$(document).ready(function () {
  console.log(Cookies.get('level'));
  
  //Check if user is idle
  var idleInterval = setInterval(IncrementIdle, 60000); //Every minute

  //Look for mouse movement and key presses
  $(this).mousemove(function(e){
    idleTime = 0;
  });

  $(this).keypress(function(e){
    idleTime = 0;
  });

  //Increment the counter, at 60 go back to main index and invalidate cookie
  function IncrementIdle(){
    idleTime++;

    if(idleTime > 59){
      window.location.href = '/';
      Cookies.set('is_valid', 'false');
    }
  }

  //For the login page
  $('#login_button').click(function (){
    var level;

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

        //Direct user to correct QRQC
        if(parsed_data != "0"){
          Cookies.set('level', parsed_data);
          Cookies.set('is_valid', 'valid');

          level = Cookies.get('level');
          console.log(Cookies.get('level'));

          if (parsed_data == 'Jim'){
            window.location.href = "/index_exec";
          }
          else if(parsed_data == 'Plant' || parsed_data == 'Mixing' || parsed_data == 'Automation' || 
                  parsed_data == 'Cadillac'){ 
            window.location.href = "/index";
          }
          else{
            $('.admin-login-form .error').text("Invalid login").show().addClass('invalid');
            Cookies.set('is_valid', 'invalid');
          }
        }
        else{
          $('.admin-login-form .error').text("Invalid login").show().addClass('invalid');
          Cookies.set('is_valid', 'invalid');
        }
      }
    });
  });

  function Check_Valid(){
    var validity = Cookies.get('is_valid');
    var level = Cookies.get('level');

    if(validity == "invalid" && level == "Plant")
      window.location.href = "/";
    else if(validity == "invalid" && level == "Mixing")
        window.location.href = "/view_mixing";
    else if(validity == "invalid" && level == "Automation")
        window.location.href = "/view_Automation";
    else if(validity == "invalid" && level == "Jim")
        window.location.href = "/view_exec";
    else if(validity == "invalid" && level == "Cadillac")
      window.location.href = "/vcad";
  }

  //View pages, not logged in
  $('#view_page').exists(function() {
    var url = "view?id=";
    var query_url = "";

    if(Cookies.get('level') == "Plant"){
      query_url = "/show_current_alerts";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Plant Level");
    }
    else if(Cookies.get('level') == "Mixing"){
      query_url = "/show_mixing_alerts";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Mixing Level");
    }
    else if(Cookies.get('level') == "Automation"){
      query_url = "/show_Automation_alerts";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Automation Level");
    }
    else if(Cookies.get('level') == "Cement"){
      query_url = "/show_cement_alerts";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Cementing Level");
    }
    else if(Cookies.get('level') == "Cadillac"){
      query_url = "/show_cad_alerts";
      $('#iqrqc_header').html("iQRQC - Cadillac - Plant Level");
    }
    else if(Cookies.get('level') == "Jim"){
      query_url = "/show_jt_alerts";
      url = "view2?id=";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Executive Level");
    }
    
    // Cookies.set('is_valid', 'invalid');
    // Cookies.set('level', 'Plant');

    // var url = "view?id=";
    // var query_url = "/show_current_alerts"
    if(Cookies.get('level') == "Jim")
      Show_JT_Current(query_url, url);
    else
      Show_Current(query_url, url);
  });//End view_page


  //************************************************************************
  // Index Pages
  $('#index_page').exists(function() {
    //Check_Valid();

    var url = "";
    var query_url = "";
    var category_url = "";

    if(Cookies.get('level') == "Plant"){
      url = "/create?id=";
      query_url = "/show_current_alerts";
      category_url = "/create_plant";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Plant Level");
    }
    else if(Cookies.get('level') == "Mixing"){
      url = "/create?id=";
      query_url = "/show_mixing_alerts";
      category_url="/create_mixing";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Mixing Level");
    }
    else if(Cookies.get('level') == "Automation"){
      url = "/create?id=";
      query_url = "/show_Automation_alerts";
      category_url="/create_Automation";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Automation Level");
    }
    else if(Cookies.get('level') == "Cement"){
      url = "/create?id=";
      query_url = "/show_jt_alerts";
      category_url="/create_cement";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Cementing Level");
    }
    else if(Cookies.get('level') == "Jim"){
      url = "/create_exec?id=";
      query_url = "/show_jt_alerts";
      category_url="/create_jt";
      $('#iqrqc_header').html("iQRQC - Grand Rapids - Executive Level");
    }
    else if(Cookies.get('level') == "Cadillac"){
      url = "/create?id=";
      query_url = "/show_cad_alerts";
      category_url="/create_cad";
      $('#iqrqc_header').html("iQRQC - Cadillac - Plant Level");
    }


    //var url = "create?id=";
    //var query_url = "/show_current_alerts"
    Show_Current(query_url, url);
        

    //If needing to make a new alert, create an entry in the DB and update it on submit later on
    $('.categories').on('click touchstart', function () {
      var elem_id = event.target.id;
      
      var payload = {
        category : elem_id
      };

      $.ajax({
        url         : category_url,
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
  // Page is a template to be used by the various level (Plant, Mixing, etc)
  $('#create_page').exists(function(){
    var body;
    try{
       body = document.getElementsByClassName('disabled')[0].className;
    }catch(e){
      if(body === undefined)
        body = "";
      
      Check_Valid();    
    }

    if(Cookies.get('level') == "Plant" || Cookies.get('level') == "Mixing" ||
       Cookies.get('level') == "Automation" || Cookies.get('level') == "Cement"){
        $('#iqrqc_header').html("iQRQC - Grand Rapids - eLert"); 
    }
    else if(Cookies.get('level') == "Cadillac"){ 
      $('#iqrqc_header').html("iQRQC - Cadillac - eLert"); 
    }


    Load_Create(body);

    $('#return_home').on('click touchstart', function () {
      var option = confirm("Warning - Any unsaved date will be lost\n\nProceed?");
      if(option == true)
        window.location.href = '/index';
      else
        return false;
    });
  });

  $('#create_jt').exists(function(){
    var body;
    try{
       body = document.getElementsByClassName('disabled')[0].className;
    }catch(e){
      if(body === undefined)
        body = "";
      
      Check_Valid();      
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
  $('#submit').on('click touchstart', function (){
    var go = Submit_Data();



    if(go != 0){
      var option = confirm("All actions will be submitted\n\nProceed?");
      if(option == true)
        window.location.href = '/index';
      else
        return false;
    }
  });//End submit_plant

  $('#view_return').on('click touchstart', function (){
    var level = Cookies.get('level');

    if(level == "Plant" || level == "Mixing" ||
       level == "Automation"  || level == "Cadillac")
        window.location.href = "/view_current";
    else if(level == "Jim")
        window.location.href = "/view_exec";
  });

  //Remove the last newly added action row
  $(document).on('click', '#delete', function () {
    $('.info_rows_' + add_row_counter).closest('tr').hide(1000).remove();
    add_row_counter--;

    $(".div_footer").animate({ bottom: "+=29.5px" }, 50);
	  
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
  add_row_counter++;  //Increment
  
  $("<tr class='info_rows_" + add_row_counter +"' >" +
    "<td class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "' " + disabled + ">"+ 
    "   <option value='Empty'>---</option>" + 
    "   <option value='1'>Immediate</option>" +
    "   <option value='2'>Temporary</option>" +
    "   <option value='3'>Permanent</option> </select></td>" +
    "<td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text' name='description'" + disabled + "> </input> </td>" +
    "<td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text' name='owner' "    + disabled + "> </select> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date' "                 + disabled + "> </input> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline' " + disabled + "> </input> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete' " + disabled + "> </input> </td>" +
    "<td class='table_data'> <div    class='added_row' id='state_"            + add_row_counter + "' " + disabled + ">Open</div></td>" +
    "<td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
    "<td class='table_data' style='text-align: center'>X</td>" +
    "<td class='hidden_element'> <input type='text' id='item_id_" + add_row_counter + "'/></td></tr>"
  ).hide().appendTo("#action_table").show(2000);

  $(".div_footer").animate({ bottom: "-=29.5px" }, 50);
  
  Update_Owners(users.length);
}// End Add_alert()

function Add_New_Alert(){
  add_row_counter++;  //Increment
  $("<tr class='info_rows_" + add_row_counter + "'>" +
    "<td  class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "'>"+ 
    "   <option value='Empty'>---</option>" + 
    "   <option value='1'>Immediate</option>" +
    "   <option value='2'>Temporary</option>" +
    "   <option value='3'>Permanent</option> </select></td>" +
    "<td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text' name='description'> </input> </td>" +
    "<td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text' name='owner'> </select> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date' disabled> </input> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline'> </input> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete'> </input> </td>" +
    "<td class='table_data'> <div    class='added_row task_new' id='state_"   + add_row_counter + "'>Open</div></td>" +
    "<td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
    "<td class='table_data'> <button class='added_row btn btn-blue' id='delete' type='button'>Delete</button></td>" +
    "<td class='hidden_element'> <input type='text' id='item_id_"       + add_row_counter + "'/></td></tr>"
  ).hide().appendTo("#action_table").show(1000);
  

  $(".div_footer").animate({ bottom: "-=29.5px" }, 50);

  var today = GetToday();
  
  $('#date_start_' + add_row_counter).val(today);
  $('#date_ending_'+ add_row_counter).val(today);
  Update_Owners(users.length);
}

//************************************************************************
// Add an addition info row for an alert.
//************************************************************************
function Add_JT_Alert(disabled){
  add_row_counter++;  //Increment
  
  $("<tr class='info_rows_" + add_row_counter + "'>" +
    "<td class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "' " + disabled + ">"+ 
    "   <option value='Empty'>---</option>" + 
    "   <option value='1'>Project</option>" +
    "   <option value='2'>System</option>" +
    "   <option value='3'>Task</option> </select></td>" +
    "<td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text' " + disabled + "> </input> </td>" +
    "<td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text' name='owner' " + disabled + "> </select> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date' " + disabled + "> </input> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline' " + disabled + "> </input> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete' " + disabled + "> </input> </td>" +
    "<td class='table_data'> <div    class='added_row' id='state_"            + add_row_counter + "' " + disabled + ">Open</div></td>" +
    "<td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
    "<td class='table_data' style='text-align: center'>X</td>" +
    "<td class='hidden_element'> <input type='text' id='item_id_"       + add_row_counter + "'/></td></tr>"
  ).hide().appendTo("#action_table").show(2000);

  $(".div_footer").animate({ bottom: "-=30px" }, 50);
  
  Update_Owners(users.length);
}// End Add_alert()

function Add_New_JT_Alert(){
  add_row_counter++;  //Increment

  $("<tr class='info_rows_" + add_row_counter + "'>" +
    "<td class='table_data'><select class='added_row' id='term_length_" + add_row_counter + "'>"+ 
    "  <option value='Empty'>---</option>" + 
    "  <option value='1'>Project</option>" +
    "  <option value='2'>System</option>" +
    "  <option value='3'>Task</option> </select></td>" +
    "<td class='table_data'> <input  class='added_row' id='term_description_" + add_row_counter + "' type='text'> </input> </td>" +
    "<td class='table_data'> <select class='added_row' id='responsible_"      + add_row_counter + "' type='text' name='owner'> </select> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_start_"       + add_row_counter + "' type='date' disabled> </input> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_ending_"      + add_row_counter + "' type='date' name='deadline'> </input> </td>" +
    "<td class='table_data'> <input  class='added_row' id='date_completed_"   + add_row_counter + "' type='date' name='complete'> </input> </td>" +
    "<td class='table_data'> <div    class='added_row task_new' id='state_"   + add_row_counter + "'>Open</div></td>" +
    "<td class='table_data'> <input  class='added_row' id='email_"            + add_row_counter + "' type='checkbox' disabled readonly> </div></td>" +
    "<td class='table_data'> <button class='added_row btn btn-blue' id='delete' type='button'>Delete</button></td>" +
    "<td class='hidden_element'> <input type='text' id='item_id_"       + add_row_counter + "'/></td></tr>"
  ).hide().appendTo("#action_table").show(2000);

  $(".div_footer").animate({ bottom: "-=30px" }, 50);

  var today = GetToday();  
  $('#date_start_' + add_row_counter).val(today);
  $('#date_ending_'+ add_row_counter).val(today);
  Update_Owners(users.length);
}

function Load_Create(disabled){
  //Press_Enter();
  var url_users, url_parts = "";
  var level = Cookies.get('level');

  //When department changes, change all owner boxes
  $('#department').on('change', function(){

    dept = $('#department').val();
    payload = { department : dept };
    console.log("Value changed to: ", dept);

    
    if(level == "Cadillac"){
      url_users = "/get_cad_users";
      url_parts = "/get_cad_part_nums";
    }
    else{
      url_users = "/get_users";
      url_parts = "/get_part_nums"
    }

    $.ajax({
      url         : url_users,
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
  
  var payload;
  if(level == "Cadillac"){
    url_users = "/get_cad_users";
    url_parts = "/get_cad_part_nums";
    payload = { department : "Plant" };
  }
  else{
    url_users = "/get_users";
    url_parts = "/get_part_nums"
    payload = { department : level };
  }
   


  $.ajax({
    url         : url_users,
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
    url         : url_parts,
    type        : "POST",
    contentType : "application/json",
    complete    : function(data){
        var parsed_data = JSON.parse(data.responseText);

        for(var i = 0; i < parsed_data.length; i++){
          var part = parsed_data[i].number;
          $('#part_num').append("<option value='" + part + "'>" + part + "</option>" );
          $('#part_list').append("<option value='" + part + "'>" + part + "</option>" );
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
    var task_complete = $("#date_completed_" + j).val();
    if(task_complete == "")
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
      var today = GetToday(); 
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


var lock_out_post = false,
    lock_out_action = false;
function Submit_Data() {
  var post_id, post_url, items_url,
      level = Cookies.get('level');

  if(level == "Plant" || level == "Mixing" || level == "Automation"){
    post_url = "update_post_it";
    items_url = "update_post_it_items";
  }
  else if(level == "Jim"){
    post_url = "update_jt_post_it";
    items_url = "update_post_it_items";
  }
  else if(level == "Cadillac"){
    post_url = "cad_post_it";
    items_url = "cad_post_it_items";
  }

  var payload;
  if(level == "Jim"){
    //Information write to DB
    var a_type    = $('#alert_type').val(),
      date_posted = $('#date_initial').val(),
      region      = $('#region').val()
      location    = $('#location').val(),
      part_num    = $('#part_num').val(),
      cust        = $('#customer').val(),
      repeat      = $('#recur').val(),
      issue       = $('#issue_desc').val(),
      cause       = $('#cause_desc').val(),
      post_id     = $('#id_number').text(),
      active      = 1;

      payload = {
        type        : a_type,
        date        : date_posted,
        region      : region,
        location    : location,
        part        : part_num,
        customer    : cust,
        recurrence  : repeat,
        i_desc      : issue,
        c_desc      : cause,      
        post_id     : post_id,
        is_active   : active
      }
  }
  else{
    //Information write to DB
    var a_type    = $('#alert_type').val(),
      date_posted = $('#date_initial').val(),
      dept        = $('#department').val(),
      location    = $('#location').val(),
      part_num    = $('#part_num').val(),
      cust        = $('#customer').val(),
      repeat      = $('#recur').val(),
      issue       = $('#issue_desc').val(),
      cause       = $('#cause_desc').val(),
      post_id     = $('#id_number').text(),
      active      = 1;

      if(level == 'Cadillac')
        dept = "CP";

      payload = {
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
  }
  

  if(issue.length == 0 || location.length == 0 || cause.length == 0){
    alert("Please fill in all Information fields");
    console.log("Information failed");
    return 0;      
  }

  if(add_row_counter < 0){
    alert("At least one action needs to be created");
    return 0;
  }
  
  if(lock_out_post == false){
    $.ajax({
      url         : post_url,
      type        : "POST",
      contentType : "application/json",
      processData : false,
      data        : JSON.stringify(payload),
    });

    lock_out_post = true;
  }
  //Action Plan row(s) write to DB
  var tLen = [], tDesc = [], resp = [], dStart = [], dEnd = [],
      dComplete = [], itemId = [], state = [], eMail = [],
      act = [], itemId = [];

  for(var i = 0; i < (add_row_counter + 1); i++){
    tLen[i]      = $('#term_length_' + i).val(),
    tDesc[i]     = $('#term_description_' + i).val(),
    resp[i]      = $('#responsible_' + i).val(),
    dStart[i]    = $('#date_start_' + i).val(),
    dEnd[i]      = $('#date_ending_' + i).val(),
    dComplete[i] = $('#date_completed_' + i).val(),
    itemId[i]    = $('#item_id_' + i).val(),
    state[i]  = $('#state_' + i).html(),
    eMail[i]     = 1,
    act[i]       = 1,
    itemId[i]    = $('#item_id_' + i).val();
  }
      

  //*****************************************************
  // Formatting and error checking
  var all_clear = false;
  for(var i = 0; i < (add_row_counter + 1); i++){
    if(tLen[i] == 'Empty' || tDesc[i].length == 0 || dEnd[i] == ""){
      alert("Please make sure 'Type' 'Description' and 'Deadline'are filled in for action " + (i + 1));
      all_clear = false;
      return 0;
    }
    else{
      all_clear = true;
    }
  }
  

  if(all_clear == true){
    console.log("All action fields filled in");

    for(var i = 0; i < (add_row_counter + 1); i++){
      if(dComplete[i] == ""){
        //If the email hasn't been sent -> send it
        if(!$('#email_' + i).is(':checked') && level !== "Jim"){
          //Depending on what level is in the cookie call a different format email function
          Format_Email(resp[i], dept, location, part_num, issue, cust, tDesc[i], dEnd[i], level);
        }
        else if(!$('#email_' + i).is(':checked') && level == "Jim"){
          Format_JT_Email(resp[i], region, location, part_num, issue, cust, tDesc[i], dEnd[i]);
        }
        
        dComplete[i] = 'NULL';
      }
      else
        state[i] = "Closed";
    }

    //Form a payload of arrays. Let the server deal with the it
    var payload2 = {
      item_id       : itemId,
      post_id       : post_id,
      term          : tLen,
      term_descript : tDesc,
      owner         : resp,
      starting      : dStart,
      ending        : dEnd,
      completed     : dComplete,
      emailed       : eMail,
      state         : state,
      is_active     : act,
      array_length  : tLen.length
    };

    if(lock_out_action == false){
      $.ajax({
        url         : items_url,
        type        : "POST",
        contentType : "application/json",
        processData : false,
        data        : JSON.stringify(payload2),
      });

      lock_out_action = true;
    }
  }
}// End Submit_Data()


function Format_Email(responsible, dept, location, part_num, issue, customer, t_descript, date_ending, level){  
  if(level == "Cadillac"){
    url = 'get_cad_email';
	dept = "Plant";
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
  console.log("IN JT EMAIL");
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
        $("<tr id='row_" + rows + "' class='row'><td class='day_of_week Monday'></td><td class='day_of_week Tuesday'></td>"
          + "<td class='day_of_week Wednesday'></td><td class='day_of_week Thursday'></td><td class='day_of_week Friday'></td></tr>").hide().appendTo('#issues_table').show(1000);
        
        $('#_table').append("<tr id='row_" + rows + "' class='row'><td class='day_of_week Monday'></td><td class='day_of_week Tuesday'></td>"
          + "<td class='day_of_week Wednesday'></td><td class='day_of_week Thursday'></td><td class='day_of_week Friday'></td></tr>");
        rows++;
      }
      
      var e = $('#row_' + j + ' .' + day);    //create a variable to hold query data. Look for class="row_j" and id=""
      if(rg[day][j].deadline < today){
        e.html(("<td class='btn-alert date' data-part_num='{post_it_id}' id='deadline' style='background-color:red; color: white;'>{short}</td>" + 
                "<td class='btn-alert alert' id='{alert_type}' data-part_num='{post_it_id}'>{owner} - {description}</td>").format(rg[day][j]));
      }
      else if(rg[day][j].deadline == today){
        e.html(("<td class='btn-alert date' data-part_num='{post_it_id}' id='deadline' style='background-color:grey; color: white;'>{short}</td>" + 
                "<td class='btn-alert alert' id='{alert_type}' data-part_num='{post_it_id}'>{owner} - {description}</td>").format(rg[day][j]));
      }
      else{
        e.html(("<td class='btn-alert date' data-part_num='{post_it_id}' id='deadline'>{short}</td>" + 
                "<td class='btn-alert alert' id='{alert_type}' data-part_num='{post_it_id}'>{owner} - {description}</td>").format(rg[day][j]));
      }
        
      e.promise().done(function(){
        $(".btn-alert", this).on('click touchstart', function(){ 
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