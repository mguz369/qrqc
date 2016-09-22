function adminPartHourlyRate($scope, $http){
//function adminPartRelationshipController($scope, $http) {
  // DEFINE OBJECTS
  // ===================================================================
  $scope.cellSchedule = [];
  $scope.boxID;
  $scope.cellInfo = {};
  $scope.parts = {};

  var selectedCell;
  var oldDisplayOrderIDs;

  
    $scope.parentParts = {};
    $scope.completedOrders = {};


  // INITIALZE DATA ON PAGE
  // ===================================================================

        var request = $http({
            method: "post",
            url: "/get_cell_box_schedule",
            data: {
                cell_id: 5
            }
        })
        .success(function(data) {
            $scope.cellSchedule = data;
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });


  $http.post('/get_cells')
    .success(function(data) {
        $scope.cellInfo = data;
    })
    .error(function(data) {
        console.log('Error: ' + data);
    });

  $http.post('/get_part')
    .success(function(data) {
      $scope.parts = data;
    })
    .error(function(data) {
      console.log('Error: ' + data);
    });

  $http.post('/get_parent_part')
    .success(function(data) {
      $scope.parentParts = data;
    })
    .error(function(data) {
      console.log('Error: ' + data);
    });

setTimeout(function() {
$('#cellSelect').on('change', function() {
$scope.getBoxScheduleNoDelay();
});
}, 250);


$scope.getBoxSchedule = function() {
        // Don't run this function until 2 seconds after it is called.
        setTimeout(function(){
                var request = $http({
                    method: "post",
                    url: "/get_cell_box_schedule",
                    data: {
                        cell_id: $('#cellSelect').find('option:selected').val()
                    }
                })
                .success(function(data) {
                    // Refresh the data
                    $scope.cellSchedule = data;
                    resetButtons();
                    // Remove the class that is disabling the boxes
                    $('span[data*='+ $scope.boxID + ']').removeClass('schedule-box-disabled');
                    // Remove the class that is disabling the admin buttons
                    $('div#box-' + $scope.boxID + ' > section.box-schedule-admin a').removeClass('schedule-box-disabled');
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
            }, 2000);
    }

$scope.getBoxScheduleNoDelay = function() {
        selectedCell = $('#cellSelect').find('option:selected').val();
        var request = $http({
                method: "post",
                url: "/get_cell_box_schedule",
                data: {
                    cell_id: selectedCell
                }
            })
            .success(function(data) {
                console.log(data);
                if (data.length > 0) {
                    $('#box-schedule .scheduleEmpty').remove();
                    // Refresh the data
                    $scope.cellSchedule = data;
                    resetButtons();
                }
                else {
                    $scope.cellSchedule = [];
                    $('#box-schedule').append('<span class="scheduleEmpty">No Results Available</span>');
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    }


  // FUNCTIONS
  // ===================================================================
  $scope.handleHourlyRateSubmit = function() {
    var partID = $('#rate-part').find("option:selected").val();
    var partName = $('#rate-part').find(":selected").text();
    var cellID = $('#rate-cell').find("option:selected").val();
    var partRate = $('#part-rate').val();



        var comment = $('#box-comment').val();
        var displayOrder;

    if(partID != 1 && cellID != 1){
      if(partRate != 0 || partRate != ''){
        var request = $http({
          method: "post",
          url: "/get_cell_box_schedule",
          //url: "/get_hourly_rates",
          data: {
              cell_id: cellID
          }
        })
        .success(function(data) {
          var request = $http({
            method: "post",
            url: "/insert_hourly_rate",
            data: {
              cell_id: cellID,
              part_id: partID,
              part_rate: partRate
            }
          })
          .success(function(data) {
            console.log('Successful.');
            $('#box-part').find("option:first").attr('selected', 'selected');
            $('#quizQuestionCategory').find("option:first").attr('selected', 'selected');
            $('#box-quantity').val('');
            $('#box-cell').find("option:first").attr('selected', 'selected');
            $('#box-comment').val('');

            var request = $http({
              method: "post",
              url: "/get_cell_box_schedule",
              data: {
                cell_id: $('#cellSelect').find('option:selected').val()
              }
            })
          })
          .error(function(data){
            console.log('Error: ' + data);
          }); 
        })           
        .error(function(data) {
          console.log('Error: ' + data);
        });
      }
      else{
        $('#app-notifications').css('background-color', 'red');
        $('#app-notifications p').text('Hourly Rate can not be 0 or blank');
        notificationPopup();
        setTimeout(function() {
            $('#app-notifications').css('background-color', 'green');
        }, 4000);
      }//Else
    }//if
    else {
      $('#app-notifications').css('background-color', 'red');
      $('#app-notifications p').text('Please select a cell and part');
      notificationPopup();
      setTimeout(function() {
          $('#app-notifications').css('background-color', 'green');
      }, 4000);
    }//Else
  }//End handleHourlyRateSubmit()
  
  $scope.getCellName = function() {
    var cellName = ($('#search-field').val()).trim();
    for (var i=0; i < $scope.parts.length; i++) {
     if ($scope.parts[i].number === cellName) {
        cellName = $scope.parts[i].id;
      }
    }
  }//End getCellName
  
  // Function to get all parts
  $scope.getAllParts = function() {
    // Parts
    $http.post('/get_part')
      .success(function(data) {
        $scope.parts = data;
        $('#val_add_part_number').val('');
        $('#val_add_part_description').val('');
        $('#val_part_quantity').val('');
      })
      .error(function(data) {
        console.log('Error: ' + data);
    });
  }//End getAllParts



$scope.adminEditComment = function(boxID) {
        var initialComment = $('section#box-schedule > div#box-' + boxID + ' > span').text();
        $('section#box-schedule > div#box-' + boxID + ' > span').hide();
        $('section#box-schedule > div#box-' + boxID + ' input[name="boxComment"]').val(initialComment);
        $('section#box-schedule > div#box-' + boxID + ' input[name="boxComment"]').show();
        $('section#box-schedule > div#box-' + boxID + ' a.adminEditComment').hide();
        $('section#box-schedule > div#box-' + boxID + ' a.adminSaveComment').css({'display':'inline-block'});
    }

    $scope.adminAddComment = function(boxID) {
        $('section#box-schedule > div#box-' + boxID + ' input[name="boxComment"]').show();
        $('section#box-schedule > div#box-' + boxID + ' a.adminAddComment').hide();
        $('section#box-schedule > div#box-' + boxID + ' a.adminSaveComment').css({'display':'inline-block'});
    }

    $scope.adminSaveComment = function(boxID) {
        var comment = $('section#box-schedule > div#box-' + boxID + ' input[name="boxComment"]').val().trim();
        var request = $http({
                method: "post",
                url: "/box_schedule_comment",
                data: {
                    box_id: boxID,
                    comment: comment
                }
            })
            .success(function(data) {
                console.log("Success");
                var request = $http({
                    method: "post",
                    url: "/get_cell_box_schedule",
                    data: {
                        cell_id: $('#cellSelect').find('option:selected').val()
                    }
                })
                .success(function(data) {
                    $scope.cellSchedule = data;
                    resetButtons();
                    $('#app-notifications p').text('Your comment has been saved.');
                    notificationPopup();
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    }

    $scope.adminCompleteBox = function(boxID) {
        var confirm = window.confirm("Are you sure you want to complete this box?");
        if (confirm == true) {
            var request = $http({
                    method: "post",
                    url: "/box_schedule_complete",
                    data: {
                        queue_id: boxID,
                        admin_id: authenticated_users.admin.id
                    }
                })
                .success(function(data) {
                    console.log("Success");
                    var request = $http({
                        method: "post",
                        url: "/get_cell_box_schedule",
                        data: {
                            cell_id: $('#cellSelect').find('option:selected').val()
                        }
                    })
                    .success(function(data) {
                        $scope.cellSchedule = data;
                        setTimeout(function() {
                            oldDisplayOrderIDs = $('#box-schedule').sortable("toArray", {attribute: 'data-boxid'});

                            for(var i = 0; i < $scope.cellSchedule.length; i++) {
                                var request = $http({
                                    method: "post",
                                    url: "/update_box_schedule_order",
                                    data: {
                                        new_display_order: i,
                                        image_id: parseInt(oldDisplayOrderIDs[i])
                                    }
                                })
                                .success(function(data) {
                                    console.log("Success.");
                                })
                                .error(function(data) {
                                    console.log('Error: ' + data);
                                });
                            }
                            resetButtons();
                            $('#app-notifications p').text('Box schedule successfully completed.');
                            notificationPopup();
                        },250);
                    })
                    .error(function(data) {
                        console.log('Error: ' + data);
                    });
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        }
    }

    function resetButtons() {
        setTimeout(function() {
            $('#box-schedule > div').each(function() {
                if ($(this).find('span:first').is(':empty')) {
                    $(this).find('a.adminAddComment').css({'display':'inline-block'});
                }
                else {
                    $(this).find('a.adminEditComment').css({'display':'inline-block'});
                }
            });
        }, 200);
    }

    $scope.activateOrder = function(orderID, cellID) {
        var confirm = window.confirm("Are you sure you want to activate this order?");
        if (confirm == true) {
            var request = $http({
                method: "post",
                url: "/get_order_count_by_cell",
                data: {
                    cell_id: cellID
                }
            })
            .success(function(data) {
                var displayOrder = data[0].row_count;
                var request = $http({
                    method: "post",
                    url: "/get_box_completed_by_id",
                    data: {
                        box_id: orderID
                    }
                })
                .success(function(data) {
                    console.log("Success.");
                    var request = $http({
                        method: "post",
                        url: "/activate_order",
                        data: {
                            activate_order_id: orderID,
                            display_order: displayOrder,
                            consumed: data[0].consumed
                        }
                    })
                    .success(function(data) {
                      //get_box_completed_by_id
                        $http.post('/get_completed_orders')
                        .success(function(data) {
                            if(data.length > 0) {
                              $scope.completedOrders = data;
                              $('#page-id-box-schedule-complete .ordersEmpty').remove();
                              $('#page-id-box-schedule-complete table').show();
                            }
                            else {
                                $('#page-id-box-schedule-complete table').hide();
                                $('#page-id-box-schedule-complete').append('<span class="ordersEmpty">No Completed Orders!</span>');
                            }
                        })
                        .error(function(data) {
                            console.log('Error: ' + data);
                        });
                        $('#app-notifications p').text('The order has been activated successfully.');
                        notificationPopup();
                    })
                    .error(function(data) {
                        console.log('Error: ' + data);
                    });
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
        }
    }

    $scope.deleteOrder = function(orderID) {
        var confirm = window.confirm("Are you sure you want to delete this order?");
        if (confirm == true) {
            var request = $http({
                method: "post",
                url: "/remove_order",
                data: {
                    remove_order_id: orderID
                }
            })
            .success(function(data) {
                $http.post('/get_completed_orders')
                .success(function(data) {
                    if(data.length > 0) {
                      $scope.completedOrders = data;
                      $('#page-id-box-schedule-complete .ordersEmpty').remove();
                      $('#page-id-box-schedule-complete table').show();
                    }
                    else {
                        $('#page-id-box-schedule-complete table').hide();
                        $('#page-id-box-schedule-complete').append('<span class="ordersEmpty">No Completed Orders!</span>');
                    }
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
                $('#app-notifications p').text('The order has been deleted successfully.');
                notificationPopup();
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
        }
    }


}//End adminPartHourlyRate()