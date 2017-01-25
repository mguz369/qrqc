$(function(){

	// Cache some selectors

	var clock = $('#clock'),
		ampm = clock.find('.ampm');

	// Map digits to their names (this will be an array)
	var digit_to_name = 'zero one two three four five six seven eight nine'.split(' ');

	// This object will hold the digit elements
	var digits = {};

	// Positions for the hours, minutes, and seconds
	var positions = [
		'h1', 'h2', ':', 'm1', 'm2'/*, ':', 's1', 's2'*/
	];

	// Generate the digits with the needed markup,
	// and add them to the clock

	var digit_holder = clock.find('.digits');

	$.each(positions, function(){

		if(this == ':'){
			digit_holder.append('<div class="dots">');
		}
		else{
			var pos = $('<div>');

			for(var i=1; i<8; i++){
				pos.append('<span class="d' + i + '">');
			}

			digits[this] = pos;	// Set the digits as key:value pairs in the digits object
			digit_holder.append(pos);	// Add the digit elements to the page
		}

	});

	// Add the weekday names

	/*var weekday_names = 'MON TUE WED THU FRI SAT SUN'.split(' '),
		weekday_holder = clock.find('.weekdays');

	$.each(weekday_names, function(){
		weekday_holder.append('<span>' + this + '</span>');
	});

	var weekdays = clock.find('.weekdays span');*/


	// Run a timer every second and update the clock
	(function update_time(){

		// Use moment.js to output the current time as a string
		// hh is for the hours in 12-hour format,
		// mm - minutes, ss-seconds (all with leading zeroes),
		// d is for day of week and A is for AM/PM

		var now = moment().format("hhmmA");
		var date = moment().format("dddd,MMMM,Do,YYYY").split(',');

		digits.h1.attr('class', digit_to_name[now[0]]);
		digits.h2.attr('class', digit_to_name[now[1]]);
		digits.m1.attr('class', digit_to_name[now[2]]);
		digits.m2.attr('class', digit_to_name[now[3]]);
		//digits.s1.attr('class', digit_to_name[now[4]]);
		//digits.s2.attr('class', digit_to_name[now[5]]);

		$(".weekdays").html(date[0]);
		$(".month_date").html(date[1] + ", " + date[2]);
		$(".year").html(date[3]);

		// Set the am/pm text:
		ampm.text(now[4]+now[5]);

		// Schedule this function to be run again in 1 sec
		setTimeout(update_time, 5000);

	})();
});

/*
$(function(){
	var clock = $('#clock'),
		alarm = clock.find('.alarm'),
		ampm = clock.find('.ampm');

	var digit_to_name = 'zero one two three four five six seven eight nine'.split(' '); //Map digit to their names
	var digits = {};	//Object that will hold digit elements
	var position = [	//Positions for the hours, minutes, seconds
		'h1', 'h2', ':', 'm1', 'm2', ':', 's1', 's1'
	];

	var digit_holder = clock.find('.digits');

	$.each(position, function(){
		if(this == ':')
			digit_holder.append('<div class="dots">');
		else{
			var pos = $('<div>');

			for(var i = 1; i < 8; i++)
				pos.append('<span class="d' + i + '">');

			digits[this] = pos;
			digit_holder.append(pos);
		}
	});

	var weekday_names = "MON TUE WED THU FRI SAT SUN".split(' '),
	    weekday_holder = clock.find('.weekdays');

	//Run a timer every second and update clock
	(function update_time(){
		//Use moment.js to output current time as a string
		// hh is for the hours in 12-hour format, mm - minutes, ss-seconds (all with leading zeroes),
		// d is for day of week and A is for AM/PM
		var now = moment().format("hmmssdA");

		digit.h1.attr('class', digit_to_name[now[0]]);
		digit.h2.attr('class', digit_to_name[now[1]]);
		digit.m1.attr('class', digit_to_name[now[2]]);
		digit.m2.attr('class', digit_to_name[now[3]]);
		digit.s1.attr('class', digit_to_name[now[4]]);
		digit.s2.attr('class', digit_to_name[now[5]]);

		var dow = now[6];
		dow--;

		if(dow < 0)
			dow = 6 //Make it last

		weekdays.removeClass('active').eq(dow).addClass('active'); //Mark active day of week
		ampm.text(now[7]+now[8]);		//Set am/pm
		setTimeout(update_time, 1000);	//Update every second
	})();
});*/