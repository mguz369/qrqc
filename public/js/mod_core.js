$.fn.exists = function (callback) {
  if (this.length !== 0)
    callback.call(this);
}



var idleTime = 0;

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


  console.log(Cookies.get('utility'))

  //************************************************************************
  // Login
  //************************************************************************
  $('#login_button').click(function (){
    var level, utility;
    password = $('#password').val().trim();
    username = $('#username').val().trim();
    level = Cookies.get('level');
    
    var login_info = {
      user : username,
      pass : password,
      level : level
    };

    $.ajax({
      url         : "/login_user",
      method      : "POST",
      contentType : "application/json",
      data        : JSON.stringify(login_info),
      processData : false,
      complete    : function(data){
        const parsed_data = JSON.parse(data.responseText);

        utility = Cookies.get('utility')
        

        if(utility == "modOwners"){
          if(parsed_data != "0"){
            Cookies.set('level', parsed_data);
            Cookies.set('is_valid', 'valid');

            window.location.href = "/modify_owners";
          }
          else{
            $('.admin-login-form .error').text("Invalid login").show().addClass('invalid');
            Cookies.set('is_valid', 'invalid');
          }
        }

        else if(utility == "modParts" && parsed_data == "Cadillac"){
          Cookies.set('level', parsed_data);
          Cookies.set('is_valid', 'valid');
          
          window.location.href = "/modify_cadillac_parts";
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
  $('#owners_page').exists(function(){
    var level = Cookies.get('level');
    var url; 
    var url_add    = "/add_new_owner";
    var url_delete = "/delete_owner";

    if(level == 'gr_plant'){
      url = "/get_full_users_plant";
    }
    else if(level == 'gr_mixing'){
      url = "/get_full_users_mixing";
    }
    else if(level == 'gr_auto'){
      url = "/get_full_users_auto";
    }
    else if(level == 'gr_exec'){
      url_add = "/add_new_exec_owner";
      url_delete = "/delete_exec_owner"
      url = "/get_full_users_exec";
    }
    else if(level == 'cd_plant'){
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
          method: "POST"
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
  });


  $('#parts_page').exists(function(){
    //Display the data from the DB
    $('#table_parts').DataTable({
      rowCallback : function( row, data, index ) {
        $(row).click(function(row, data, index){
    
          var myModalIDs = ["delete_id", "delete_part_number", "delete_customer", "delete_destination", "delete_tier", "delete_PINTCS", "delete_customer_num"];

          for (var i = 0; i < data.length; i++){
            $('#' + myModalIDs[i]).val(data[i]);
          }

          $("#modal_edit_part").modal("show");
        }.bind(this, row, data, index));
      },
      processing : true,
      ordering   : true,
      pageLength : 10,
      paginate   : true,
      //serverSide : true,
      ajax : {
        url   : "/get_full_cad_part_info",
        method: "POST",
        //contentType: "application/json",
        // data : function(level) {
        //   console.log(level);
        //   return { 'department' : JSON.stringify(level) };
        // }
      }
    });

    //Add new part to DB
    $('#submit_part').click(function(){
      var payload = {
        part_num : $('#add_part_num').val(),
        cust     : $('#add_customer').val(),
        dest     : $('#add_dest').val(),
        tier     : $('#add_tier').val(),
        pintcs   : $('#add_pintcs').val(),
        cust_num : $('#add_cust_num').val()
      };


      $.ajax({
          url         : "/add_cad_part",
          type        : "POST",
          contentType : "application/json",
          data        : JSON.stringify(payload),
          processData : false
        });


      location.reload(true);
    });


    $('#delete_part').click(function(){
      var payload = {
        id : $('#delete_id').val()        
      };


      $.ajax({
          url         : "/delete_cad_part",
          type        : "POST",
          contentType : "application/json",
          data        : JSON.stringify(payload),
          processData : false
        });


      location.reload(true);
    });
  });
  
}); //DOC.READY