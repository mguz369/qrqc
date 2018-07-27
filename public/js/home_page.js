$(document).ready(function(){
  Cookies.set('level', ' ');
  Cookies.set('utility', ' ');
  Cookies.set('is_valid', 'false');

  console.log("utility: ", Cookies.get('utility'));

  //Set Cookies
  $('#gr_plant').click(function(){
    Cookies.set('level', 'gr_plant');
  });

  $('#gr_mixing').click(function(){
    Cookies.set('level', 'gr_mixing');
  });

  $('#gr_auto').click(function(){
    Cookies.set('level', 'gr_auto');
  });


  // Cement is disabled
  // $('#gr_cement').click(function(){
  //   Cookies.set('level', 'Cement');
  // });

  $('#gr_exec').click(function(){
    Cookies.set('level', 'gr_exec');
  });

  $('#cd_plant').click(function(){
    Cookies.set('level', 'cd_plant');
  });
  
  $('#cd_tooling').click(function(){
    Cookies.set('level', 'cd_tooling');
  });

  //For the modification links
  $('#mod_owners').click(function(){
    Cookies.set('utility', 'modOwners');
  });
  
  $('#mod_parts').click(function(){
    Cookies.set('utility', 'modParts');
  });
});