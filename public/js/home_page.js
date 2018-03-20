$(document).ready(function(){
  Cookies.set('level', ' ');
  Cookies.set('utility', ' ');
  Cookies.set('is_valid', 'false');

  console.log("utility: ", Cookies.get('utility'));

  //Set Cookies
  $('#gr_plant').click(function(){
    Cookies.set('level', 'Plant');
  });

  $('#gr_mixing').click(function(){
    Cookies.set('level', 'Mixing');
  });

  $('#gr_auto').click(function(){
    Cookies.set('level', 'Automation');
  });


  // Cement is disabled
  // $('#gr_cement').click(function(){
  //   Cookies.set('level', 'Cement');
  // });

  $('#gr_exec').click(function(){
    Cookies.set('level', 'Jim');
  });

  $('#cd_plant').click(function(){
    Cookies.set('level', 'Cadillac');
  });
  
  //For the modification links
  $('#mod_owners').click(function(){
    Cookies.set('utility', 'modOwners');
  });
  
  $('#mod_parts').click(function(){
    Cookies.set('utility', 'modParts');
  });
});