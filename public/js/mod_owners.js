$(document).ready(function (){
  //************************************************************************
  // Idle timeout
  //************************************************************************
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

  //************************************************************************
  // Login
  //************************************************************************
  $('#login_button').click(function (){
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

          window.location.href = "/modify_owners";
        }
        else{
          $('.admin-login-form .error').text("Invalid login").show().addClass('invalid');
          Cookies.set('is_valid', 'invalid');
        }
      }
    });
  });


  //************************************************************************
  // DataTables - Display, add, delete
  //************************************************************************
  var level = Cookies.get('level');
  var url; 
  var url_add    = "/add_new_owner";
  var url_delete = "/delete_owner";

  if(level == 'Plant'){
    url = "/get_full_users_plant";
  }
  else if(level == 'Mixing'){
    url = "/get_full_users_mixing";
  }
  else if(level == 'Auto'){
    url = "/get_full_users_auto";
  }
  else if(level == 'Jim'){
    level = "Executive";
    url_add = "/add_new_exec_owner";
    url_delete = "/delete_exec_owner"
    url = "/get_full_users_exec";
  }
  else if(level == 'Cadillac'){
    level = 'Plant';
    url_add = "/add_new_cad_owner";
    url_delete = "/delete_cad_owner"
    url = "/get_full_users_cad";
  }



  //Display the data from the DB
  try{
    $('#table_owners').DataTable({
      rowCallback : function( row, data, index ) {
        $(row).click(function(row, data, index){
    
          var myModalIDs = ["delete_id", "delete_full_name", "delete_email_addr", "delete_qrqc_level"];

          for (var i = 0; i < data.length; i++){
            $('#' + myModalIDs[i]).val(data[i]);
          }

          $("#myModal2").modal("show");
        }.bind(this, row, data, index));
      },
      processing : true,
      ordering   : true,
      pageLength : 10,
      paginate   : true,
      //serverSide : true,
      ajax       : {
        url  : url,
        method: "POST",
        //contentType: "application/json",
        // data : function(level) {
        //   console.log(level);
        //   return { 'department' : JSON.stringify(level) };
        // }
      }
    });
  } catch(err){}

  //Create a new person
  $("#new_person").click(function(){
    $("#add_qrqc_level").val(level);
    
    //Auto insert domain
    var domain_string = "@hutchinsonna.com";
    $('#add_email_addr').val(domain_string);
    

    //auto fill the email address line while typing a name
    $('#add_full_name').bind('input', function(){
      var input_string = $(this).val();
      var input_string = input_string.replace(' ', '.');  //Replace whitespace with a '.'

      $('#add_email_addr').val(input_string + domain_string);
    });
  });
  
  $("#submit_person").click(function(){
      var name   = $("#add_full_name").val(),
      email      = $("#add_email_addr").val(),
      department = $("#add_qrqc_level").val();
      
      var new_data  = {
        name, 
        email, 
        department
      };
      console.log(new_data);
      
      $.ajax({
        url         : url_add,
        type        : "POST",
        contentType : "application/json",
        data        : JSON.stringify(new_data),
        processData : false
      });

      location.reload(true);
  });

  //Delete a person from the list
  $("#delete_person").click(function(){
    var option = confirm("This person will be deleted\n\nProceed?");
    
    if(option == true){
      var payload = {
        id : $("#delete_id").val()
      }


      $.ajax({
        url         : url_delete,
        type        : "POST",
        contentType : "application/json",
        data        : JSON.stringify(payload),
        processData : false

      });

      location.reload(true);
    }
    else
      return false;
  });
}); //DOC.READY