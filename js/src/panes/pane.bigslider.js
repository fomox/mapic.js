Wu.BigSlider = Wu.Class.extend({

	initialize : function () {

		this.initData();
		
		this.initSlider();

		this.initGraph();

		this.updateDayOfYear();

		this.addHooks();		
		

	},


	initData : function () {

		// Array of JSON with all days with every year, one by one
		this.allYears = this.getAllYears();

		// Array of JSON with all days, categorized by year
		this.years = this.sanitizeYears(this.allYears);

		// Array of JSON with all days, categorized by year
		this.days = this.sanitizeDays(this.allYears);

		// Get min, max and average values for one year
		this.maxSCF = this.getMaxSCF(this.days);
		this.minSCF = this.getMinSCF(this.days);
		this.avgSCF = this.getAvgSCF(this.days);
		
		// Create blank array
		this.allData = []

		// Populate array with data
		this.maxSCF.forEach(function (mx,i) {
			var obj = {
				no   : i,
				max  : mx,
				date : this._dateFromNo(i),				
				min  : this.minSCF[i],
				avg  : this.avgSCF[i]
			};
			this.allData.push(obj);
		}.bind(this))		




		this.ticks = [];

		var currentMonth = '';

		this.allYears.forEach(function (y) {
			var year    = y.Year;
			var month   = this.getMonthName(y.Doy, y.Year);
			var doy     = y.Doy;

		  	var blankDate = new Date(year, 0);
	  		var date = new Date(blankDate.setDate(doy));
			var day = date.getDate();
			var monthNo = date.getMonth()+1;			

			if ( currentMonth != month ) {
				currentMonth = month;
				
				this.ticks.push({ 
					month   : month, 
					year    : year,
					doy     : doy,
					monthNo : monthNo
				})
			}

		}.bind(this))


		// Find last day
		
		// Get object
		var lastDay = this.allYears[this.allYears.length-1];

		// Get last year
		var lastYear = lastDay.Year;

		// Get last day of year
		var lastDoy = lastDay.Doy;

		// Get last month name
		var lastMonth = this.getMonthName(lastDoy, lastYear);

		// Set date, so that we can get month number, and day of month number
	  	var blankDate = new Date(lastYear, 0);
  		var setDate = new Date(blankDate.setDate(lastDoy));

  		// Get last month number
		var lastDofMonth = setDate.getDate();

		// Get last day of last month
		var lastMonthNo = setDate.getMonth()+1;

		// Store final day
		this.finalDay = {
			Year    : lastYear,
			Month   : lastMonth,
			Day     : lastDofMonth,
			Doy     : lastDoy,
			MonthNo : lastMonthNo

		}


		// Push in blank month at end of year
		// (if last date is November 17th, 
		// we want to have the scle go all the way to December)

		// if ( lastDofMonth > 1 ) {
		// 	this.ticks.push({ month : '', year : lastYear })
		// }



		this.tickStart = this.ticks.length-13;
		this.tickEnd = this.ticks.length;
		this.currentSliderValue = 365;

	},



	getMonthName : function (doy, year) {
		var monthNames = [ "Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember" ];
	  	var blankDate = new Date(year, 0);
  		var date = new Date(blankDate.setDate(doy));
		var day = date.getDate();
		var monthIndex = date.getMonth();
		return monthNames[monthIndex];
	},

	_dateFromNo : function (no) {

	  	var blankDate = new Date(2014, 0);
  		var date = new Date(blankDate.setDate(no));
		return date;

	},	

	initSlider : function () {

		this.sliderOuterContainer = Wu.DomUtil.create('div', 'big-slider-outer-container', app._appPane);

		var sliderInnerContainer = Wu.DomUtil.create('div', 'big-slider-inner-container', this.sliderOuterContainer);
		this.playButton = Wu.DomUtil.create('div', 'big-slider-play-button', sliderInnerContainer, '<i class="fa fa-play"></i>');


		var slider = Wu.DomUtil.create('div', 'big-slider', sliderInnerContainer);

		this.stepForward = Wu.DomUtil.create('div', 'big-slider-step-forward', sliderInnerContainer, '<i class="fa fa-step-forward"></i>');
		this.stepBackward = Wu.DomUtil.create('div', 'big-slider-step-backward', sliderInnerContainer, '<i class="fa fa-step-backward"></i>');

		this.currentDateContainer = Wu.DomUtil.create('div', 'big-slider-current-date', sliderInnerContainer);

		this.tickContainer = Wu.DomUtil.create('div', 'big-slider-tick-container', sliderInnerContainer);

		this.updateTicks();
		this.updateButtons();


		this.slider = noUiSlider.create(slider, {
			start: [this.currentSliderValue],
			range: {
				'min': 0,
				'max': 365
			}
		});


	},


	initGraph : function () {

		// AVERAGE DATA FOR ALL YEARS
		// AVERAGE DATA FOR ALL YEARS
		// AVERAGE DATA FOR ALL YEARS

		// Prepare DC dimensions
		var ndx     = crossfilter(this.allData);
		var xDim    = ndx.dimension(function(d) { return d.date });
		var yMaxDim = xDim.group().reduceSum(function(d) { return d.max });
		var yMinDim = xDim.group().reduceSum(function(d) { return d.min });
		var yAvgDim = xDim.group().reduceSum(function(d) { return d.avg });

    		var minDate = xDim.bottom(1)[0].date;
		var maxDate = xDim.top(1)[0].date;

		// DATA FOR CURRENT YEAR
		// DATA FOR CURRENT YEAR
		// DATA FOR CURRENT YEAR

		// Data will get populated in updateGraph()
		this.graphData = [];

		// Prepare DC dimensions
		this.ndx = crossfilter(this.graphData);

		// LINE DIMENSION
		// LINE DIMENSION
		var thisXdim = this.ndx.dimension(function(d) { return d.date });
		var yThisDim = thisXdim.group().reduceSum(function(d) { return d.SCF; });

		// SCATTER DIMENSION
		// SCATTER DIMENSION
		var scatterDim = thisXdim.group().reduceSum(function(d) { 
			return d.SCF
			// if ( this.graphData && d.key == this.graphData[this.graphData.length-1].date ) return d.SCF;
			// return false;
		}.bind(this));


		var graphOuterContainer = Wu.DomUtil.create('div', 'big-graph-outer-container', this.sliderOuterContainer);

		var graphInfoContainer = Wu.DomUtil.create('div', 'big-graph-info-container', graphOuterContainer);

		this.dayNameTitle = Wu.DomUtil.create('div', 'big-graph-current-day', graphInfoContainer);

		this.currentSCF = Wu.DomUtil.create('div', 'big-graph-current-scf inline', graphInfoContainer);
		this.cloud = Wu.DomUtil.create('div', 'big-graph-current-cloud inline', graphInfoContainer);
		this.age = Wu.DomUtil.create('div', 'big-graph-current-age inline', graphInfoContainer);

		this.maxSCF = Wu.DomUtil.create('div', 'big-graph-current-maxscf inline', graphInfoContainer);
		this.minSCF = Wu.DomUtil.create('div', 'big-graph-current-minscf inline', graphInfoContainer);


		var graphInnerContainer = Wu.DomUtil.create('div', 'big-graph-inner-container', graphOuterContainer)

		// Get HTML element, and define it as graph container
		var hitslineChart = dc.compositeChart(graphInnerContainer)


		// Run graph
		hitslineChart
			.width(500).height(220)
			.dimension(xDim)
		
			.x(d3.time.scale().domain([minDate,maxDate]))
		 	.y(d3.scale.linear().domain([0, 100]))

			.clipPadding(10)   	
			.elasticY(false)
			.elasticX(false)
			.brushOn(false)
			.transitionDuration(0)			

			
			// Each of these will be a new graph
			.compose([

				// MAX value
				dc.lineChart(hitslineChart)
					.group(yMaxDim)
					.colors('#DDDDDD')
					.renderArea(true)   	
					.renderDataPoints(false)
					.xyTipsOn(false)			
				,

				// MIN value
				dc.lineChart(hitslineChart)
					.group(yMinDim)
					.colors('#ffffff')
					.renderArea(true)   	
					.renderDataPoints(false)
					.xyTipsOn(false)			
				,

				// AVERAGE value
				dc.lineChart(hitslineChart)
					.group(yAvgDim)
					.colors('#999999')
					.renderDataPoints(false)
					.xyTipsOn(false)			
				,

				// THIS YEAR value – LINE
				dc.lineChart(hitslineChart)
					.group(yThisDim)
					.colors('#ff6666')
					.renderDataPoints(false)
					.xyTipsOn(false)
				,

				// THIS YEAR value – LAST DATE (DOT)
				dc.scatterPlot(hitslineChart)
					.group(scatterDim)
					.symbolSize(8)
					.excludedOpacity(0)
					.colors('#ff0000')
					.symbol('triangle-up')
				    	.keyAccessor(function(d) {

				    		if ( this.graphData && d.key == this.graphData[this.graphData.length-1].date ) return +d.key;
				    		return false;
				    	}.bind(this))
		    			.valueAccessor(function(d) {
		    				if ( this.graphData && d.key == this.graphData[this.graphData.length-1].date ) return +d.value;
		    				return false;
		    			}.bind(this))
				,
			])


		
			hitslineChart
				.xUnits(d3.time.months)
				.xAxis()
				.tickFormat(d3.time. format('%b'))



		dc.renderAll(); 


	},

	updateGraph : function () {

		// Current year
		var year = this.currentYear;

		// Day on slider (this can be more than 365, as it can start in the middle of the year).
		var day = this.currentDay;

		// Check how many days it's in the current year
		var daysInYear = this.years[year].length;

		// Skip over to next year at end of year
		if ( day > daysInYear ) {
			day -= daysInYear;
			year ++;
		}

		// Reset graph data
		this.graphData = [];

		// Rebuild graph data
		this.years[year].forEach(function (d, i) {

			if ( d.Doy < day ) {
				d.date = this._dateFromNo(i)
				this.graphData.push(d);
			}

		}.bind(this));


		// If we're at the end of the road
		if ( !this.years[year][day-1] ) {
			this.stopPlaying();
			return;
		}

		// Clear old data
		this.ndx.remove();

		// Add new data	
		this.ndx.add(this.graphData);

		// Redraw graph
		dc.redrawAll()

		var scf = Math.round(this.years[year][day-1].SCF * 100) / 100;
		var cloud = Math.round(this.years[year][day-1].Cloud * 10) / 10;
		var age = Math.round(this.years[year][day-1].Age * 10) / 10;

		// Update HTML
		this.dayNameTitle.innerHTML = this.dayName;
		this.currentSCF.innerHTML = 'SCF: ' + scf + '%';
		this.cloud.innerHTML = 'Cloud: ' + cloud;
		this.age.innerHTML = 'Age: ' + age;



	},


	addHooks : function () {

		Wu.DomEvent.on(this.stepBackward, 'click', this.moveBackward, this);
		Wu.DomEvent.on(this.stepForward, 'click', this.moveForward, this);
		Wu.DomEvent.on(this.playButton, 'click', this.play, this);
	
		this.slider.on('change', function( values, handle ) {
			this.currentSliderValue = Math.round(values);
			this.updateDayOfYear();
		}.bind(this));

	},


	play : function () {		

		this.playing ? this.stopPlaying() : this.startPlaying();
	
	},

	startPlaying : function () {

		this.playButton.innerHTML = '<i class="fa fa-pause"></i>';

		this.playing = true;

		this.playInterval = setInterval(function() {
			if ( this.currentSliderValue == 365 ) {
				clearInterval(this.playInterval);
				return;
			} else {
				this.slider.set(this.currentSliderValue++);
				this.updateDayOfYear()
			}			
		}.bind(this), 250) 
	},

	stopPlaying : function () {

		this.playButton.innerHTML = '<i class="fa fa-play"></i>';

		clearInterval(this.playInterval);
		this.playing = false;
	},

	updateDayOfYear : function () {


		// Month names
		var monthNames = [ "Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember" ];


		// What is wrong here?
		// We calculate from the beginning of the year,
		// when we should ALWAYS count from the last day
		// we've got, and work our ways backwards from
		// there...

		var lastDayObj = this.finalDay,
		    lastYear = lastDayObj.Year,
		    lastMonth = lastDayObj.Month,
		    lastDay = lastDayObj.Day,
		    lastDoy = lastDayObj.Doy,
		    lastMonthNo = lastDayObj.MonthNo;

		var _firstDay = lastDoy - 365;

		// console.log('_firstDay', _firstDay);
		// console.log('365 + _firstDay', 365 + _firstDay);

		// console.log('lastDayObj', lastDayObj);



		// Find out where we start
		var tickStartMonthName = this.ticks[this.tickStart].month;
		var tickStartMonthNo = monthNames.indexOf(tickStartMonthName);
		var tickStartYear = this.ticks[this.tickStart].year;

		// What day of the year do we start?
		// var now = new Date(tickStartYear, tickStartMonthNo, tickStartDay);
		// var start = new Date(tickStartYear, 0, 0);
		// var diff = now - start;
		// var oneDay = 1000 * 60 * 60 * 24;
		// var startDay = Math.floor(diff / oneDay);

		var startDay = 365 + _firstDay;


		// Start figuring out what day we are showing
		var year = this.currentYear = tickStartYear;
		var day = this.currentDay = this.currentSliderValue + startDay - 1;
	
	  	var blankDate = new Date(year, 0);
  		var date = new Date(blankDate.setDate(day));
		var day = date.getDate();
		var monthIndex = date.getMonth();
		var year = date.getFullYear();
		this.dayName = day + ' ' + monthNames[monthIndex] + ' ' + year;

		this.currentDateContainer.innerHTML = this.dayName;

		this.updateGraph();

	},


	moveBackward : function () {

		if ( this.diableBackward ) return;

		this.tickEnd--;
		this.tickStart--;

		this.updateTicks();
		this.updateButtons();

		this.updateDayOfYear();

	},


	moveForward : function () {

		if ( this.diableForward ) return;

		this.tickEnd++;
		this.tickStart++;

		this.updateTicks();
		this.updateButtons();

		this.updateDayOfYear();		

	},	


	// xoxoxoxoxoxoxoxoxoxox
	updateTicks : function () {


		// console.log('this.tickStart', this.tickStart);
		// console.log('this.tickEnd', this.tickEnd);
		// console.log('ticks', this.tickEnd - this.tickStart);

		var lastDayObj  = this.finalDay,
		    lastYear    = lastDayObj.Year,		    
		    lastDay     = lastDayObj.Day,
		    lastMonthNo = lastDayObj.MonthNo,
		    daysInMonth = new Date(lastYear, lastMonthNo, 0).getDate(),
		    diffDays    = daysInMonth - lastDay;


		    console.log('daysInMonth', daysInMonth);
		    console.log('lastDay', lastDay);
		    console.log('diffDays', diffDays);


		// Now we need to figure out how many days it adds up to...
		// var allDays = diffDays;
		var allDays = 0;
		for ( var i = this.tickStart; i < this.tickEnd; i++ ) {	
			allDays += new Date(this.ticks[i].year, this.ticks[i].monthNo, 0).getDate();
		}

		// var pixelProp = 365 / allDays;
		// var promp = (diffDays / allDays) * 100;



		this.tickContainer.innerHTML = '';
	
		var year = '';

		for ( var i = this.tickStart; i < this.tickEnd; i++ ) {

			var month = this.ticks[i].month.substr(0,3);
			var _tick = Wu.DomUtil.create('div', 'big-slider-tick', this.tickContainer, month);

			if ( year != this.ticks[i].year ) {
				var newYear = Wu.DomUtil.create('div', 'big-slider-year-tick', _tick, this.ticks[i].year);
				year = this.ticks[i].year;	
			}

			// Days in this month...
			var DIM = new Date(year, this.ticks[i].monthNo, 0).getDate();

			if ( i == this.tickStart ) DIM -= lastDay;
			if ( i == this.tickEnd-1 ) DIM -= diffDays;


			// var dimprop = allDays / DIM;
			var dimprop = (DIM / 366) * 100;


			_tick.style.width = dimprop + '%';




		}



	
	},

	updateButtons : function () {


		if ( this.tickEnd == this.ticks.length ) {
			this.diableForward = true;
			Wu.DomUtil.addClass(this.stepForward, 'disable-button');
		} else {
			this.diableForward = false;
			Wu.DomUtil.removeClass(this.stepForward, 'disable-button');
		}

		if ( this.tickStart == 0 ) {
			this.diableBackward = true;
			Wu.DomUtil.addClass(this.stepBackward, 'disable-button');
		} else {
			this.diableBackward = false;
			Wu.DomUtil.removeClass(this.stepBackward, 'disable-button');
		}
		
		

	},


	// Update message box, if it exists before
	update : function (message, severity) {
	},

	remove : function (id) {
	},


















	getMaxSCF : function (days) { 

		var eachDay = [];

		for ( var day in days ) {

			var maxD = false;		

			if( Object.prototype.toString.call( days[day] ) === '[object Array]' ) {

				if ( !maxD ) maxD = days[day][1].SCF;
				days[day].forEach(function (d) { 
					if ( d.SCF > maxD ) maxD = d.SCF 
				});
				eachDay[day] = Math.round(maxD);
			}

		}

		return eachDay;

	},

	getMinSCF : function (days) { 

		var eachDay = [];

		for ( var day in days ) {	

			var minD = false;

			if( Object.prototype.toString.call( days[day] ) === '[object Array]' ) {
				if ( !minD ) minD = days[day][1].SCF;
				days[day].forEach(function (d) { if ( d.SCF < minD ) minD = d.SCF });
				eachDay[day] = Math.round(minD);
			}
		}

		return eachDay;

	},

	getAvgSCF : function (days) {

		var eachDay = [];

		for ( var day in days ) {		
			if( Object.prototype.toString.call( days[day] ) === '[object Array]' ) {
				var avg = 0;
				days[day].forEach(function(d) { avg += d.SCF; });
				eachDay[day] = Math.round(avg / days[day].length);
			}
		}
		return eachDay;
	},

	sanitizeDays : function (allYears) {

		var days = [];
		allYears.forEach(function (each) {
			if ( !days[each.Doy] ) days[each.Doy] = [];
			days[each.Doy].push(each);
		})
		return days;
	},


	sanitizeYears : function (allYears) {

		var years = [];
		var currentYear = '';

		allYears.forEach(function (each) {
			// New year!
			if (  currentYear != each.Year ) {
				currentYear = each.Year;
				years[currentYear] = [];
			}
			years[currentYear].push(each)
		})

		return years;
	},




























	getAllYears : function () {

		var allYears = [

		  {
		    "Year": 2001,
		    "Doy": 1,
		    "SCF": 80.6895,
		    "Cloud": 99.7337,
		    "Age": 0.99741
		  },
		  {
		    "Year": 2001,
		    "Doy": 2,
		    "SCF": 80.694,
		    "Cloud": 95.9196,
		    "Age": 1.91606
		  },
		  {
		    "Year": 2001,
		    "Doy": 3,
		    "SCF": 80.7558,
		    "Cloud": 84.8775,
		    "Age": 2.47988
		  },
		  {
		    "Year": 2001,
		    "Doy": 4,
		    "SCF": 81.5949,
		    "Cloud": 79.9112,
		    "Age": 2.80071
		  },
		  {
		    "Year": 2001,
		    "Doy": 5,
		    "SCF": 83.8169,
		    "Cloud": 91.4477,
		    "Age": 3.47053
		  },
		  {
		    "Year": 2001,
		    "Doy": 6,
		    "SCF": 84.2259,
		    "Cloud": 91.9278,
		    "Age": 4.10345
		  },
		  {
		    "Year": 2001,
		    "Doy": 7,
		    "SCF": 85.1874,
		    "Cloud": 80.1126,
		    "Age": 4.07116
		  },
		  {
		    "Year": 2001,
		    "Doy": 8,
		    "SCF": 86.0177,
		    "Cloud": 56.1985,
		    "Age": 2.85155
		  },
		  {
		    "Year": 2001,
		    "Doy": 9,
		    "SCF": 89.9826,
		    "Cloud": 35.7729,
		    "Age": 1.56422
		  },
		  {
		    "Year": 2001,
		    "Doy": 10,
		    "SCF": 89.0893,
		    "Cloud": 62.132,
		    "Age": 1.49702
		  },
		  {
		    "Year": 2001,
		    "Doy": 11,
		    "SCF": 85.9689,
		    "Cloud": 69.2253,
		    "Age": 1.76516
		  },
		  {
		    "Year": 2001,
		    "Doy": 12,
		    "SCF": 88.2625,
		    "Cloud": 99.9636,
		    "Age": 2.7651
		  },
		  {
		    "Year": 2001,
		    "Doy": 13,
		    "SCF": 88.2625,
		    "Cloud": 99.6843,
		    "Age": 3.75626
		  },
		  {
		    "Year": 2001,
		    "Doy": 14,
		    "SCF": 88.2699,
		    "Cloud": 57.4712,
		    "Age": 2.83147
		  },
		  {
		    "Year": 2001,
		    "Doy": 15,
		    "SCF": 88.9026,
		    "Cloud": 11.7067,
		    "Age": 0.549862
		  },
		  {
		    "Year": 2001,
		    "Doy": 16,
		    "SCF": 89.0982,
		    "Cloud": 16.1695,
		    "Age": 0.566884
		  },
		  {
		    "Year": 2001,
		    "Doy": 17,
		    "SCF": 90.5608,
		    "Cloud": 9.61248,
		    "Age": 0.440693
		  },
		  {
		    "Year": 2001,
		    "Doy": 18,
		    "SCF": 90.2071,
		    "Cloud": 42.6531,
		    "Age": 0.815215
		  },
		  {
		    "Year": 2001,
		    "Doy": 19,
		    "SCF": 91.219,
		    "Cloud": 10.5671,
		    "Age": 0.479513
		  },
		  {
		    "Year": 2001,
		    "Doy": 20,
		    "SCF": 85.5404,
		    "Cloud": 83.6324,
		    "Age": 1.3018
		  },
		  {
		    "Year": 2001,
		    "Doy": 21,
		    "SCF": 84.5766,
		    "Cloud": 97.5918,
		    "Age": 2.26975
		  },
		  {
		    "Year": 2001,
		    "Doy": 22,
		    "SCF": 84.6584,
		    "Cloud": 93.0632,
		    "Age": 3.0415
		  },
		  {
		    "Year": 2001,
		    "Doy": 23,
		    "SCF": 85.6725,
		    "Cloud": 93.4166,
		    "Age": 3.7999
		  },
		  {
		    "Year": 2001,
		    "Doy": 24,
		    "SCF": 87.009,
		    "Cloud": 97.0377,
		    "Age": 4.66176
		  },
		  {
		    "Year": 2001,
		    "Doy": 25,
		    "SCF": 87.1572,
		    "Cloud": 84.585,
		    "Age": 4.85053
		  },
		  {
		    "Year": 2001,
		    "Doy": 26,
		    "SCF": 89.0408,
		    "Cloud": 96.4706,
		    "Age": 5.61544
		  },
		  {
		    "Year": 2001,
		    "Doy": 27,
		    "SCF": 89.7,
		    "Cloud": 89.5723,
		    "Age": 5.92042
		  },
		  {
		    "Year": 2001,
		    "Doy": 28,
		    "SCF": 90.9683,
		    "Cloud": 73.3151,
		    "Age": 5.10032
		  },
		  {
		    "Year": 2001,
		    "Doy": 29,
		    "SCF": 92.4335,
		    "Cloud": 31.8733,
		    "Age": 2.0995
		  },
		  {
		    "Year": 2001,
		    "Doy": 30,
		    "SCF": 94.6691,
		    "Cloud": 9.2622,
		    "Age": 0.728803
		  },
		  {
		    "Year": 2001,
		    "Doy": 31,
		    "SCF": 91.9555,
		    "Cloud": 59.4968,
		    "Age": 1.14386
		  },
		  {
		    "Year": 2001,
		    "Doy": 32,
		    "SCF": 92.3981,
		    "Cloud": 7.79949,
		    "Age": 0.196756
		  },
		  {
		    "Year": 2001,
		    "Doy": 33,
		    "SCF": 83.0902,
		    "Cloud": 53.4643,
		    "Age": 0.686066
		  },
		  {
		    "Year": 2001,
		    "Doy": 34,
		    "SCF": 83.1195,
		    "Cloud": 58.6082,
		    "Age": 1.05692
		  },
		  {
		    "Year": 2001,
		    "Doy": 35,
		    "SCF": 85.2604,
		    "Cloud": 30.0708,
		    "Age": 0.861939
		  },
		  {
		    "Year": 2001,
		    "Doy": 36,
		    "SCF": 87.9696,
		    "Cloud": 23.4048,
		    "Age": 0.838841
		  },
		  {
		    "Year": 2001,
		    "Doy": 37,
		    "SCF": 87.5272,
		    "Cloud": 64.1775,
		    "Age": 1.39308
		  },
		  {
		    "Year": 2001,
		    "Doy": 38,
		    "SCF": 93.0112,
		    "Cloud": 97.6166,
		    "Age": 2.31403
		  },
		  {
		    "Year": 2001,
		    "Doy": 39,
		    "SCF": 93.4919,
		    "Cloud": 51.1313,
		    "Age": 2.04957
		  },
		  {
		    "Year": 2001,
		    "Doy": 40,
		    "SCF": 95.6844,
		    "Cloud": 11.5514,
		    "Age": 0.655521
		  },
		  {
		    "Year": 2001,
		    "Doy": 41,
		    "SCF": 93.5037,
		    "Cloud": 16.5637,
		    "Age": 0.673623
		  },
		  {
		    "Year": 2001,
		    "Doy": 42,
		    "SCF": 89.5181,
		    "Cloud": 100,
		    "Age": 1.67374
		  },
		  {
		    "Year": 2001,
		    "Doy": 43,
		    "SCF": 89.5181,
		    "Cloud": 33.0562,
		    "Age": 1.23036
		  },
		  {
		    "Year": 2001,
		    "Doy": 44,
		    "SCF": 90.0329,
		    "Cloud": 88.9421,
		    "Age": 1.91544
		  },
		  {
		    "Year": 2001,
		    "Doy": 45,
		    "SCF": 90.6242,
		    "Cloud": 95.3386,
		    "Age": 2.6939
		  },
		  {
		    "Year": 2001,
		    "Doy": 46,
		    "SCF": 90.7136,
		    "Cloud": 40.9244,
		    "Age": 1.64675
		  },
		  {
		    "Year": 2001,
		    "Doy": 47,
		    "SCF": 95.4123,
		    "Cloud": 1.9607,
		    "Age": 0.105206
		  },
		  {
		    "Year": 2001,
		    "Doy": 48,
		    "SCF": 89.9887,
		    "Cloud": 83.3047,
		    "Age": 0.931046
		  },
		  {
		    "Year": 2001,
		    "Doy": 49,
		    "SCF": 90.9709,
		    "Cloud": 35.2318,
		    "Age": 0.727107
		  },
		  {
		    "Year": 2001,
		    "Doy": 50,
		    "SCF": 88.298,
		    "Cloud": 76.4281,
		    "Age": 1.29008
		  },
		  {
		    "Year": 2001,
		    "Doy": 51,
		    "SCF": 88.4057,
		    "Cloud": 99.9316,
		    "Age": 2.28983
		  },
		  {
		    "Year": 2001,
		    "Doy": 52,
		    "SCF": 88.4057,
		    "Cloud": 32.3126,
		    "Age": 1.23775
		  },
		  {
		    "Year": 2001,
		    "Doy": 53,
		    "SCF": 85.7934,
		    "Cloud": 70.5891,
		    "Age": 1.89126
		  },
		  {
		    "Year": 2001,
		    "Doy": 54,
		    "SCF": 85.0281,
		    "Cloud": 67.645,
		    "Age": 1.4231
		  },
		  {
		    "Year": 2001,
		    "Doy": 55,
		    "SCF": 83.7743,
		    "Cloud": 89.1547,
		    "Age": 2.14533
		  },
		  {
		    "Year": 2001,
		    "Doy": 56,
		    "SCF": 83.4281,
		    "Cloud": 77.2222,
		    "Age": 2.32587
		  },
		  {
		    "Year": 2001,
		    "Doy": 57,
		    "SCF": 84.5799,
		    "Cloud": 92.1957,
		    "Age": 3.08168
		  },
		  {
		    "Year": 2001,
		    "Doy": 58,
		    "SCF": 85.6873,
		    "Cloud": 40.3279,
		    "Age": 1.75781
		  },
		  {
		    "Year": 2001,
		    "Doy": 59,
		    "SCF": 85.0184,
		    "Cloud": 69.0879,
		    "Age": 2.13422
		  },
		  {
		    "Year": 2001,
		    "Doy": 60,
		    "SCF": 86.7364,
		    "Cloud": 68.2404,
		    "Age": 2.30973
		  },
		  {
		    "Year": 2001,
		    "Doy": 61,
		    "SCF": 89.8915,
		    "Cloud": 16.8789,
		    "Age": 0.945731
		  },
		  {
		    "Year": 2001,
		    "Doy": 62,
		    "SCF": 89.0616,
		    "Cloud": 51.7659,
		    "Age": 1.32118
		  },
		  {
		    "Year": 2001,
		    "Doy": 63,
		    "SCF": 90.684,
		    "Cloud": 97.0975,
		    "Age": 2.209
		  },
		  {
		    "Year": 2001,
		    "Doy": 64,
		    "SCF": 91.0574,
		    "Cloud": 99.952,
		    "Age": 3.20715
		  },
		  {
		    "Year": 2001,
		    "Doy": 65,
		    "SCF": 91.0726,
		    "Cloud": 18.6777,
		    "Age": 0.858075
		  },
		  {
		    "Year": 2001,
		    "Doy": 66,
		    "SCF": 91.8405,
		    "Cloud": 98.7366,
		    "Age": 1.83229
		  },
		  {
		    "Year": 2001,
		    "Doy": 67,
		    "SCF": 91.9453,
		    "Cloud": 98.8876,
		    "Age": 2.80869
		  },
		  {
		    "Year": 2001,
		    "Doy": 68,
		    "SCF": 92.0483,
		    "Cloud": 100,
		    "Age": 3.80869
		  },
		  {
		    "Year": 2001,
		    "Doy": 69,
		    "SCF": 92.0483,
		    "Cloud": 99.9695,
		    "Age": 4.80753
		  },
		  {
		    "Year": 2001,
		    "Doy": 70,
		    "SCF": 92.056,
		    "Cloud": 99.772,
		    "Age": 5.79562
		  },
		  {
		    "Year": 2001,
		    "Doy": 71,
		    "SCF": 92.0767,
		    "Cloud": 99.8185,
		    "Age": 6.78372
		  },
		  {
		    "Year": 2001,
		    "Doy": 72,
		    "SCF": 92.1013,
		    "Cloud": 90.2949,
		    "Age": 6.9728
		  },
		  {
		    "Year": 2001,
		    "Doy": 73,
		    "SCF": 92.2918,
		    "Cloud": 99.5179,
		    "Age": 7.93705
		  },
		  {
		    "Year": 2001,
		    "Doy": 74,
		    "SCF": 92.3654,
		    "Cloud": 32.037,
		    "Age": 2.78666
		  },
		  {
		    "Year": 2001,
		    "Doy": 75,
		    "SCF": 89.4717,
		    "Cloud": 93.1531,
		    "Age": 3.64178
		  },
		  {
		    "Year": 2001,
		    "Doy": 76,
		    "SCF": 89.6269,
		    "Cloud": 38.4691,
		    "Age": 2.06045
		  },
		  {
		    "Year": 2001,
		    "Doy": 77,
		    "SCF": 89.8661,
		    "Cloud": 37.9115,
		    "Age": 1.34021
		  },
		  {
		    "Year": 2001,
		    "Doy": 78,
		    "SCF": 91.5958,
		    "Cloud": 2.049,
		    "Age": 0.0445958
		  },
		  {
		    "Year": 2001,
		    "Doy": 79,
		    "SCF": 96.5313,
		    "Cloud": 3.32544,
		    "Age": 0.0372333
		  },
		  {
		    "Year": 2001,
		    "Doy": 80,
		    "SCF": 92.6209,
		    "Cloud": 33.0352,
		    "Age": 0.338731
		  },
		  {
		    "Year": 2001,
		    "Doy": 81,
		    "SCF": 95.7936,
		    "Cloud": 10.38,
		    "Age": 0.132059
		  },
		  {
		    "Year": 2001,
		    "Doy": 82,
		    "SCF": 94.524,
		    "Cloud": 0.880008,
		    "Age": 0.0135632
		  },
		  {
		    "Year": 2001,
		    "Doy": 83,
		    "SCF": 95.4033,
		    "Cloud": 0.453074,
		    "Age": 0.0100925
		  },
		  {
		    "Year": 2001,
		    "Doy": 84,
		    "SCF": 96.2372,
		    "Cloud": 0.287527,
		    "Age": 0.00300597
		  },
		  {
		    "Year": 2001,
		    "Doy": 85,
		    "SCF": 92.8085,
		    "Cloud": 5.53853,
		    "Age": 0.0556612
		  },
		  {
		    "Year": 2001,
		    "Doy": 86,
		    "SCF": 95.9434,
		    "Cloud": 10.4715,
		    "Age": 0.111642
		  },
		  {
		    "Year": 2001,
		    "Doy": 87,
		    "SCF": 92.1942,
		    "Cloud": 78.554,
		    "Age": 0.850832
		  },
		  {
		    "Year": 2001,
		    "Doy": 88,
		    "SCF": 92.399,
		    "Cloud": 74.4131,
		    "Age": 1.39796
		  },
		  {
		    "Year": 2001,
		    "Doy": 89,
		    "SCF": 91.7071,
		    "Cloud": 99.0509,
		    "Age": 2.37967
		  },
		  {
		    "Year": 2001,
		    "Doy": 90,
		    "SCF": 91.7921,
		    "Cloud": 99.7569,
		    "Age": 3.379
		  },
		  {
		    "Year": 2001,
		    "Doy": 91,
		    "SCF": 91.7932,
		    "Cloud": 47.767,
		    "Age": 2.10108
		  },
		  {
		    "Year": 2001,
		    "Doy": 92,
		    "SCF": 91.2119,
		    "Cloud": 98.4768,
		    "Age": 3.0459
		  },
		  {
		    "Year": 2001,
		    "Doy": 93,
		    "SCF": 91.2283,
		    "Cloud": 100,
		    "Age": 4.0461
		  },
		  {
		    "Year": 2001,
		    "Doy": 94,
		    "SCF": 91.2283,
		    "Cloud": 99.9388,
		    "Age": 5.04422
		  },
		  {
		    "Year": 2001,
		    "Doy": 95,
		    "SCF": 91.2393,
		    "Cloud": 99.9898,
		    "Age": 6.04375
		  },
		  {
		    "Year": 2001,
		    "Doy": 96,
		    "SCF": 91.2393,
		    "Cloud": 59.0536,
		    "Age": 4.23409
		  },
		  {
		    "Year": 2001,
		    "Doy": 97,
		    "SCF": 91.3342,
		    "Cloud": 100,
		    "Age": 5.23451
		  },
		  {
		    "Year": 2001,
		    "Doy": 98,
		    "SCF": 91.3342,
		    "Cloud": 99.9563,
		    "Age": 6.23272
		  },
		  {
		    "Year": 2001,
		    "Doy": 99,
		    "SCF": 91.3406,
		    "Cloud": 39.3771,
		    "Age": 2.80071
		  },
		  {
		    "Year": 2001,
		    "Doy": 100,
		    "SCF": 91.0581,
		    "Cloud": 49.5641,
		    "Age": 2.33245
		  },
		  {
		    "Year": 2001,
		    "Doy": 101,
		    "SCF": 90.4115,
		    "Cloud": 91.5908,
		    "Age": 2.93556
		  },
		  {
		    "Year": 2001,
		    "Doy": 102,
		    "SCF": 90.9372,
		    "Cloud": 11.5818,
		    "Age": 0.642554
		  },
		  {
		    "Year": 2001,
		    "Doy": 103,
		    "SCF": 84.0475,
		    "Cloud": 51.5661,
		    "Age": 0.890732
		  },
		  {
		    "Year": 2001,
		    "Doy": 104,
		    "SCF": 83.7592,
		    "Cloud": 76.6999,
		    "Age": 1.48153
		  },
		  {
		    "Year": 2001,
		    "Doy": 105,
		    "SCF": 83.6226,
		    "Cloud": 89.1363,
		    "Age": 2.19481
		  },
		  {
		    "Year": 2001,
		    "Doy": 106,
		    "SCF": 84.4614,
		    "Cloud": 85.3321,
		    "Age": 2.76349
		  },
		  {
		    "Year": 2001,
		    "Doy": 107,
		    "SCF": 84.8309,
		    "Cloud": 93.6339,
		    "Age": 3.56114
		  },
		  {
		    "Year": 2001,
		    "Doy": 108,
		    "SCF": 84.9066,
		    "Cloud": 58.9674,
		    "Age": 2.80744
		  },
		  {
		    "Year": 2001,
		    "Doy": 109,
		    "SCF": 85.1326,
		    "Cloud": 69.965,
		    "Age": 3.11558
		  },
		  {
		    "Year": 2001,
		    "Doy": 110,
		    "SCF": 84.7261,
		    "Cloud": 3.48273,
		    "Age": 0.16512
		  },
		  {
		    "Year": 2001,
		    "Doy": 111,
		    "SCF": 81.7194,
		    "Cloud": 88.8049,
		    "Age": 1.04233
		  },
		  {
		    "Year": 2001,
		    "Doy": 112,
		    "SCF": 80.286,
		    "Cloud": 86.9415,
		    "Age": 1.79567
		  },
		  {
		    "Year": 2001,
		    "Doy": 113,
		    "SCF": 79.3251,
		    "Cloud": 39.6697,
		    "Age": 1.09588
		  },
		  {
		    "Year": 2001,
		    "Doy": 114,
		    "SCF": 76.5097,
		    "Cloud": 100,
		    "Age": 2.096
		  },
		  {
		    "Year": 2001,
		    "Doy": 115,
		    "SCF": 76.5097,
		    "Cloud": 99.5101,
		    "Age": 3.09514
		  },
		  {
		    "Year": 2001,
		    "Doy": 116,
		    "SCF": 76.5097,
		    "Cloud": 99.914,
		    "Age": 4.093
		  },
		  {
		    "Year": 2001,
		    "Doy": 117,
		    "SCF": 76.5,
		    "Cloud": 93.9992,
		    "Age": 4.8409
		  },
		  {
		    "Year": 2001,
		    "Doy": 118,
		    "SCF": 76.528,
		    "Cloud": 99.3571,
		    "Age": 5.81365
		  },
		  {
		    "Year": 2001,
		    "Doy": 119,
		    "SCF": 76.5492,
		    "Cloud": 97.9618,
		    "Age": 6.63763
		  },
		  {
		    "Year": 2001,
		    "Doy": 120,
		    "SCF": 76.4996,
		    "Cloud": 28.323,
		    "Age": 2.00206
		  },
		  {
		    "Year": 2001,
		    "Doy": 121,
		    "SCF": 70.3728,
		    "Cloud": 63.3297,
		    "Age": 1.87467
		  },
		  {
		    "Year": 2001,
		    "Doy": 122,
		    "SCF": 69.711,
		    "Cloud": 82.6457,
		    "Age": 2.52286
		  },
		  {
		    "Year": 2001,
		    "Doy": 123,
		    "SCF": 69.1087,
		    "Cloud": 30.3869,
		    "Age": 1.64587
		  },
		  {
		    "Year": 2001,
		    "Doy": 124,
		    "SCF": 64.5879,
		    "Cloud": 59.3643,
		    "Age": 0.985099
		  },
		  {
		    "Year": 2001,
		    "Doy": 125,
		    "SCF": 64.2663,
		    "Cloud": 76.1141,
		    "Age": 1.50719
		  },
		  {
		    "Year": 2001,
		    "Doy": 126,
		    "SCF": 64.0207,
		    "Cloud": 1.23316,
		    "Age": 0.0431096
		  },
		  {
		    "Year": 2001,
		    "Doy": 127,
		    "SCF": 63.7894,
		    "Cloud": 1.88889,
		    "Age": 0.0263627
		  },
		  {
		    "Year": 2001,
		    "Doy": 128,
		    "SCF": 57.7488,
		    "Cloud": 5.37889,
		    "Age": 0.0601548
		  },
		  {
		    "Year": 2001,
		    "Doy": 129,
		    "SCF": 57.3561,
		    "Cloud": 3.65351,
		    "Age": 0.0550218
		  },
		  {
		    "Year": 2001,
		    "Doy": 130,
		    "SCF": 54.601,
		    "Cloud": 66.7742,
		    "Age": 0.711227
		  },
		  {
		    "Year": 2001,
		    "Doy": 131,
		    "SCF": 52.8602,
		    "Cloud": 6.02397,
		    "Age": 0.13213
		  },
		  {
		    "Year": 2001,
		    "Doy": 132,
		    "SCF": 52.5994,
		    "Cloud": 61.1907,
		    "Age": 0.717903
		  },
		  {
		    "Year": 2001,
		    "Doy": 133,
		    "SCF": 50.9755,
		    "Cloud": 28.7437,
		    "Age": 0.511232
		  },
		  {
		    "Year": 2001,
		    "Doy": 134,
		    "SCF": 48.6838,
		    "Cloud": 52.2698,
		    "Age": 0.776423
		  },
		  {
		    "Year": 2001,
		    "Doy": 135,
		    "SCF": 47.1128,
		    "Cloud": 52.922,
		    "Age": 0.975348
		  },
		  {
		    "Year": 2001,
		    "Doy": 136,
		    "SCF": 46.1014,
		    "Cloud": 99.0859,
		    "Age": 1.97585
		  },
		  {
		    "Year": 2001,
		    "Doy": 137,
		    "SCF": 46.1014,
		    "Cloud": 99.9956,
		    "Age": 2.97585
		  },
		  {
		    "Year": 2001,
		    "Doy": 138,
		    "SCF": 46.1014,
		    "Cloud": 98.4214,
		    "Age": 3.92415
		  },
		  {
		    "Year": 2001,
		    "Doy": 139,
		    "SCF": 46.0167,
		    "Cloud": 33.6084,
		    "Age": 1.64955
		  },
		  {
		    "Year": 2001,
		    "Doy": 140,
		    "SCF": 44.0118,
		    "Cloud": 74.3221,
		    "Age": 2.00802
		  },
		  {
		    "Year": 2001,
		    "Doy": 141,
		    "SCF": 42.9238,
		    "Cloud": 26.5463,
		    "Age": 1.01493
		  },
		  {
		    "Year": 2001,
		    "Doy": 142,
		    "SCF": 39.2021,
		    "Cloud": 87.7721,
		    "Age": 1.88718
		  },
		  {
		    "Year": 2001,
		    "Doy": 143,
		    "SCF": 38.9497,
		    "Cloud": 82.4169,
		    "Age": 2.53285
		  },
		  {
		    "Year": 2001,
		    "Doy": 144,
		    "SCF": 38.6258,
		    "Cloud": 14.4411,
		    "Age": 0.821538
		  },
		  {
		    "Year": 2001,
		    "Doy": 145,
		    "SCF": 33.5655,
		    "Cloud": 12.226,
		    "Age": 0.340917
		  },
		  {
		    "Year": 2001,
		    "Doy": 146,
		    "SCF": 22.7681,
		    "Cloud": 87.9482,
		    "Age": 1.21858
		  },
		  {
		    "Year": 2001,
		    "Doy": 147,
		    "SCF": 22.5194,
		    "Cloud": 72.2591,
		    "Age": 1.68764
		  },
		  {
		    "Year": 2001,
		    "Doy": 148,
		    "SCF": 20.5882,
		    "Cloud": 98.8481,
		    "Age": 2.66861
		  },
		  {
		    "Year": 2001,
		    "Doy": 149,
		    "SCF": 20.3988,
		    "Cloud": 99.0495,
		    "Age": 3.63877
		  },
		  {
		    "Year": 2001,
		    "Doy": 150,
		    "SCF": 19.7063,
		    "Cloud": 96.0121,
		    "Age": 4.37129
		  },
		  {
		    "Year": 2001,
		    "Doy": 151,
		    "SCF": 19.2713,
		    "Cloud": 66.8959,
		    "Age": 3.65484
		  },
		  {
		    "Year": 2001,
		    "Doy": 152,
		    "SCF": 17.9292,
		    "Cloud": 74.1605,
		    "Age": 3.3881
		  },
		  {
		    "Year": 2001,
		    "Doy": 153,
		    "SCF": 15.844,
		    "Cloud": 87.9746,
		    "Age": 3.86785
		  },
		  {
		    "Year": 2001,
		    "Doy": 154,
		    "SCF": 14.6698,
		    "Cloud": 43.3699,
		    "Age": 2.14886
		  },
		  {
		    "Year": 2001,
		    "Doy": 155,
		    "SCF": 13.8045,
		    "Cloud": 16.7853,
		    "Age": 0.704026
		  },
		  {
		    "Year": 2001,
		    "Doy": 156,
		    "SCF": 12.0858,
		    "Cloud": 97.8411,
		    "Age": 1.67891
		  },
		  {
		    "Year": 2001,
		    "Doy": 157,
		    "SCF": 11.984,
		    "Cloud": 99.6903,
		    "Age": 2.67299
		  },
		  {
		    "Year": 2001,
		    "Doy": 158,
		    "SCF": 11.9785,
		    "Cloud": 98.4705,
		    "Age": 3.67294
		  },
		  {
		    "Year": 2001,
		    "Doy": 159,
		    "SCF": 11.9785,
		    "Cloud": 99.9021,
		    "Age": 4.66894
		  },
		  {
		    "Year": 2001,
		    "Doy": 160,
		    "SCF": 11.9599,
		    "Cloud": 77.0813,
		    "Age": 4.444
		  },
		  {
		    "Year": 2001,
		    "Doy": 161,
		    "SCF": 11.1558,
		    "Cloud": 52.8076,
		    "Age": 3.13832
		  },
		  {
		    "Year": 2001,
		    "Doy": 162,
		    "SCF": 6.63382,
		    "Cloud": 80.1124,
		    "Age": 3.37848
		  },
		  {
		    "Year": 2001,
		    "Doy": 163,
		    "SCF": 4.23435,
		    "Cloud": 89.8435,
		    "Age": 4.01603
		  },
		  {
		    "Year": 2001,
		    "Doy": 164,
		    "SCF": 2.61405,
		    "Cloud": 48.8784,
		    "Age": 2.5209
		  },
		  {
		    "Year": 2001,
		    "Doy": 165,
		    "SCF": 2.52884,
		    "Cloud": 81.8034,
		    "Age": 3.09808
		  },
		  {
		    "Year": 2001,
		    "Doy": 166,
		    "SCF": 1.55203,
		    "Cloud": 8.75657,
		    "Age": 4.0974
		  },
		  {
		    "Year": 2001,
		    "Doy": 167,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 168,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 169,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 170,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 171,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 172,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 173,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 174,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 175,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 176,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 177,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 178,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 179,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 180,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 181,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 182,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 183,
		    "SCF": 1.55203,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2001,
		    "Doy": 184,
		    "SCF": 1.55203,
		    "Cloud": 55.8431,
		    "Age": 3.30095
		  },
		  {
		    "Year": 2001,
		    "Doy": 185,
		    "SCF": 1.52042,
		    "Cloud": 28.73,
		    "Age": 1.6996
		  },
		  {
		    "Year": 2001,
		    "Doy": 186,
		    "SCF": 1.081,
		    "Cloud": 1.65444,
		    "Age": 0.102949
		  },
		  {
		    "Year": 2001,
		    "Doy": 187,
		    "SCF": 0.887067,
		    "Cloud": 16.5994,
		    "Age": 0.234298
		  },
		  {
		    "Year": 2001,
		    "Doy": 188,
		    "SCF": 1.14519,
		    "Cloud": 15.9891,
		    "Age": 0.243228
		  },
		  {
		    "Year": 2001,
		    "Doy": 189,
		    "SCF": 1.9709,
		    "Cloud": 63.3194,
		    "Age": 0.821808
		  },
		  {
		    "Year": 2001,
		    "Doy": 190,
		    "SCF": 2.79334,
		    "Cloud": 84.7406,
		    "Age": 1.52928
		  },
		  {
		    "Year": 2001,
		    "Doy": 191,
		    "SCF": 3.03199,
		    "Cloud": 59.3391,
		    "Age": 1.55187
		  },
		  {
		    "Year": 2001,
		    "Doy": 192,
		    "SCF": 4.0433,
		    "Cloud": 96.3366,
		    "Age": 2.48906
		  },
		  {
		    "Year": 2001,
		    "Doy": 193,
		    "SCF": 4.09134,
		    "Cloud": 84.4633,
		    "Age": 2.98216
		  },
		  {
		    "Year": 2001,
		    "Doy": 194,
		    "SCF": 3.54606,
		    "Cloud": 82.9442,
		    "Age": 3.27786
		  },
		  {
		    "Year": 2001,
		    "Doy": 195,
		    "SCF": 2.71121,
		    "Cloud": 70.3298,
		    "Age": 3.19907
		  },
		  {
		    "Year": 2001,
		    "Doy": 196,
		    "SCF": 3.55902,
		    "Cloud": 99.8003,
		    "Age": 4.19328
		  },
		  {
		    "Year": 2001,
		    "Doy": 197,
		    "SCF": 3.52696,
		    "Cloud": 88.5791,
		    "Age": 4.76943
		  },
		  {
		    "Year": 2001,
		    "Doy": 198,
		    "SCF": 2.02517,
		    "Cloud": 90.3139,
		    "Age": 5.12176
		  },
		  {
		    "Year": 2001,
		    "Doy": 199,
		    "SCF": 2.34347,
		    "Cloud": 95.6159,
		    "Age": 5.87706
		  },
		  {
		    "Year": 2001,
		    "Doy": 200,
		    "SCF": 2.50861,
		    "Cloud": 99.8393,
		    "Age": 6.86404
		  },
		  {
		    "Year": 2001,
		    "Doy": 201,
		    "SCF": 2.51545,
		    "Cloud": 78.9481,
		    "Age": 6.48086
		  },
		  {
		    "Year": 2001,
		    "Doy": 202,
		    "SCF": 1.02284,
		    "Cloud": 83.6541,
		    "Age": 6.4723
		  },
		  {
		    "Year": 2001,
		    "Doy": 203,
		    "SCF": 0.607684,
		    "Cloud": 98.8261,
		    "Age": 7.39264
		  },
		  {
		    "Year": 2001,
		    "Doy": 204,
		    "SCF": 0.428285,
		    "Cloud": 72.1401,
		    "Age": 6.53147
		  },
		  {
		    "Year": 2001,
		    "Doy": 205,
		    "SCF": 0.438336,
		    "Cloud": 58.7926,
		    "Age": 4.66116
		  },
		  {
		    "Year": 2001,
		    "Doy": 206,
		    "SCF": 0.460106,
		    "Cloud": 39.3638,
		    "Age": 2.41298
		  },
		  {
		    "Year": 2001,
		    "Doy": 207,
		    "SCF": 0.322726,
		    "Cloud": 10.188,
		    "Age": 0.455915
		  },
		  {
		    "Year": 2001,
		    "Doy": 208,
		    "SCF": 0.406613,
		    "Cloud": 63.5333,
		    "Age": 1.02305
		  },
		  {
		    "Year": 2001,
		    "Doy": 209,
		    "SCF": 0.356056,
		    "Cloud": 26.2154,
		    "Age": 0.686993
		  },
		  {
		    "Year": 2001,
		    "Doy": 210,
		    "SCF": 0.578924,
		    "Cloud": 96.1642,
		    "Age": 1.63362
		  },
		  {
		    "Year": 2001,
		    "Doy": 211,
		    "SCF": 0.573734,
		    "Cloud": 54.6179,
		    "Age": 1.42036
		  },
		  {
		    "Year": 2001,
		    "Doy": 212,
		    "SCF": 0.532451,
		    "Cloud": 36.3833,
		    "Age": 0.998568
		  },
		  {
		    "Year": 2001,
		    "Doy": 213,
		    "SCF": 0.582264,
		    "Cloud": 86.7279,
		    "Age": 1.72675
		  },
		  {
		    "Year": 2001,
		    "Doy": 214,
		    "SCF": 0.476512,
		    "Cloud": 10.2091,
		    "Age": 0.339616
		  },
		  {
		    "Year": 2001,
		    "Doy": 215,
		    "SCF": 1.32757,
		    "Cloud": 99.9985,
		    "Age": 1.33953
		  },
		  {
		    "Year": 2001,
		    "Doy": 216,
		    "SCF": 1.32625,
		    "Cloud": 39.2342,
		    "Age": 0.976918
		  },
		  {
		    "Year": 2001,
		    "Doy": 217,
		    "SCF": 2.73073,
		    "Cloud": 96.3178,
		    "Age": 1.90999
		  },
		  {
		    "Year": 2001,
		    "Doy": 218,
		    "SCF": 2.75431,
		    "Cloud": 59.4932,
		    "Age": 1.80547
		  },
		  {
		    "Year": 2001,
		    "Doy": 219,
		    "SCF": 2.66529,
		    "Cloud": 41.6692,
		    "Age": 1.26993
		  },
		  {
		    "Year": 2001,
		    "Doy": 220,
		    "SCF": 1.94223,
		    "Cloud": 94.5507,
		    "Age": 2.14957
		  },
		  {
		    "Year": 2001,
		    "Doy": 221,
		    "SCF": 1.991,
		    "Cloud": 87.336,
		    "Age": 2.77631
		  },
		  {
		    "Year": 2001,
		    "Doy": 222,
		    "SCF": 0.922196,
		    "Cloud": 44.3592,
		    "Age": 1.85489
		  },
		  {
		    "Year": 2001,
		    "Doy": 223,
		    "SCF": 1.22595,
		    "Cloud": 74.2535,
		    "Age": 2.07497
		  },
		  {
		    "Year": 2001,
		    "Doy": 224,
		    "SCF": 0.911776,
		    "Cloud": 68.4874,
		    "Age": 2.11237
		  },
		  {
		    "Year": 2001,
		    "Doy": 225,
		    "SCF": 0.625111,
		    "Cloud": 68.7853,
		    "Age": 2.23713
		  },
		  {
		    "Year": 2001,
		    "Doy": 226,
		    "SCF": 0.73457,
		    "Cloud": 65.4039,
		    "Age": 2.15656
		  },
		  {
		    "Year": 2001,
		    "Doy": 227,
		    "SCF": 0.560702,
		    "Cloud": 45.9052,
		    "Age": 1.76604
		  },
		  {
		    "Year": 2001,
		    "Doy": 228,
		    "SCF": 0.86815,
		    "Cloud": 90.6623,
		    "Age": 2.6135
		  },
		  {
		    "Year": 2001,
		    "Doy": 229,
		    "SCF": 0.532833,
		    "Cloud": 56.7382,
		    "Age": 2.34211
		  },
		  {
		    "Year": 2001,
		    "Doy": 230,
		    "SCF": 0.343991,
		    "Cloud": 35.1618,
		    "Age": 1.28697
		  },
		  {
		    "Year": 2001,
		    "Doy": 231,
		    "SCF": 0.36881,
		    "Cloud": 29.6273,
		    "Age": 0.892151
		  },
		  {
		    "Year": 2001,
		    "Doy": 232,
		    "SCF": 0.430772,
		    "Cloud": 99.8379,
		    "Age": 1.89126
		  },
		  {
		    "Year": 2001,
		    "Doy": 233,
		    "SCF": 0.430772,
		    "Cloud": 10.6569,
		    "Age": 0.301572
		  },
		  {
		    "Year": 2001,
		    "Doy": 234,
		    "SCF": 1.24295,
		    "Cloud": 81.618,
		    "Age": 1.03659
		  },
		  {
		    "Year": 2001,
		    "Doy": 235,
		    "SCF": 0.932173,
		    "Cloud": 55.9915,
		    "Age": 1.18114
		  },
		  {
		    "Year": 2001,
		    "Doy": 236,
		    "SCF": 1.80239,
		    "Cloud": 64.3913,
		    "Age": 1.44605
		  },
		  {
		    "Year": 2001,
		    "Doy": 237,
		    "SCF": 2.22468,
		    "Cloud": 99.6992,
		    "Age": 2.43471
		  },
		  {
		    "Year": 2001,
		    "Doy": 238,
		    "SCF": 1.92345,
		    "Cloud": 97.4781,
		    "Age": 3.34253
		  },
		  {
		    "Year": 2001,
		    "Doy": 239,
		    "SCF": 1.80419,
		    "Cloud": 56.9119,
		    "Age": 2.52938
		  },
		  {
		    "Year": 2001,
		    "Doy": 240,
		    "SCF": 1.32959,
		    "Cloud": 87.4133,
		    "Age": 2.84633
		  },
		  {
		    "Year": 2001,
		    "Doy": 241,
		    "SCF": 1.32024,
		    "Cloud": 28.3234,
		    "Age": 1.28966
		  },
		  {
		    "Year": 2001,
		    "Doy": 242,
		    "SCF": 2.99639,
		    "Cloud": 99.207,
		    "Age": 2.2574
		  },
		  {
		    "Year": 2001,
		    "Doy": 243,
		    "SCF": 2.96482,
		    "Cloud": 100,
		    "Age": 3.25746
		  },
		  {
		    "Year": 2001,
		    "Doy": 244,
		    "SCF": 2.96482,
		    "Cloud": 54.7801,
		    "Age": 2.58288
		  },
		  {
		    "Year": 2001,
		    "Doy": 245,
		    "SCF": 4.27939,
		    "Cloud": 98.3563,
		    "Age": 3.48528
		  },
		  {
		    "Year": 2001,
		    "Doy": 246,
		    "SCF": 2.86504,
		    "Cloud": 79.7142,
		    "Age": 3.71466
		  },
		  {
		    "Year": 2001,
		    "Doy": 247,
		    "SCF": 1.77773,
		    "Cloud": 90.9417,
		    "Age": 4.36675
		  },
		  {
		    "Year": 2001,
		    "Doy": 248,
		    "SCF": 1.4862,
		    "Cloud": 74.9868,
		    "Age": 3.95427
		  },
		  {
		    "Year": 2001,
		    "Doy": 249,
		    "SCF": 1.41148,
		    "Cloud": 62.1412,
		    "Age": 3.35706
		  },
		  {
		    "Year": 2001,
		    "Doy": 250,
		    "SCF": 1.68481,
		    "Cloud": 21.7079,
		    "Age": 1.14154
		  },
		  {
		    "Year": 2001,
		    "Doy": 251,
		    "SCF": 4.10807,
		    "Cloud": 89.6279,
		    "Age": 1.97033
		  },
		  {
		    "Year": 2001,
		    "Doy": 252,
		    "SCF": 4.05275,
		    "Cloud": 98.7232,
		    "Age": 2.92982
		  },
		  {
		    "Year": 2001,
		    "Doy": 253,
		    "SCF": 3.33785,
		    "Cloud": 97.2563,
		    "Age": 3.82385
		  },
		  {
		    "Year": 2001,
		    "Doy": 254,
		    "SCF": 2.0154,
		    "Cloud": 78.4767,
		    "Age": 3.80199
		  },
		  {
		    "Year": 2001,
		    "Doy": 255,
		    "SCF": 1.83872,
		    "Cloud": 62.5552,
		    "Age": 3.21169
		  },
		  {
		    "Year": 2001,
		    "Doy": 256,
		    "SCF": 3.18296,
		    "Cloud": 98.5753,
		    "Age": 4.12943
		  },
		  {
		    "Year": 2001,
		    "Doy": 257,
		    "SCF": 3.20279,
		    "Cloud": 77.4085,
		    "Age": 3.8239
		  },
		  {
		    "Year": 2001,
		    "Doy": 258,
		    "SCF": 3.32299,
		    "Cloud": 92.401,
		    "Age": 4.48567
		  },
		  {
		    "Year": 2001,
		    "Doy": 259,
		    "SCF": 3.25359,
		    "Cloud": 96.1247,
		    "Age": 5.29911
		  },
		  {
		    "Year": 2001,
		    "Doy": 260,
		    "SCF": 2.08389,
		    "Cloud": 98.7697,
		    "Age": 6.23755
		  },
		  {
		    "Year": 2001,
		    "Doy": 261,
		    "SCF": 1.99196,
		    "Cloud": 93.1752,
		    "Age": 6.81163
		  },
		  {
		    "Year": 2001,
		    "Doy": 262,
		    "SCF": 1.95887,
		    "Cloud": 99.9606,
		    "Age": 7.81304
		  },
		  {
		    "Year": 2001,
		    "Doy": 263,
		    "SCF": 1.94269,
		    "Cloud": 88.4736,
		    "Age": 7.85146
		  },
		  {
		    "Year": 2001,
		    "Doy": 264,
		    "SCF": 1.55161,
		    "Cloud": 97.587,
		    "Age": 8.67895
		  },
		  {
		    "Year": 2001,
		    "Doy": 265,
		    "SCF": 1.15712,
		    "Cloud": 94.087,
		    "Age": 9.10799
		  },
		  {
		    "Year": 2001,
		    "Doy": 266,
		    "SCF": 0.866736,
		    "Cloud": 68.4741,
		    "Age": 7.27193
		  },
		  {
		    "Year": 2001,
		    "Doy": 267,
		    "SCF": 0.650065,
		    "Cloud": 91.9406,
		    "Age": 7.87612
		  },
		  {
		    "Year": 2001,
		    "Doy": 268,
		    "SCF": 0.633011,
		    "Cloud": 78.1717,
		    "Age": 7.64259
		  },
		  {
		    "Year": 2001,
		    "Doy": 269,
		    "SCF": 0.826901,
		    "Cloud": 47.8644,
		    "Age": 4.19334
		  },
		  {
		    "Year": 2001,
		    "Doy": 270,
		    "SCF": 1.27046,
		    "Cloud": 30.9832,
		    "Age": 1.64369
		  },
		  {
		    "Year": 2001,
		    "Doy": 271,
		    "SCF": 0.914488,
		    "Cloud": 25.7076,
		    "Age": 0.65693
		  },
		  {
		    "Year": 2001,
		    "Doy": 272,
		    "SCF": 1.31563,
		    "Cloud": 34.8585,
		    "Age": 0.574662
		  },
		  {
		    "Year": 2001,
		    "Doy": 273,
		    "SCF": 3.30449,
		    "Cloud": 99.3,
		    "Age": 1.56536
		  },
		  {
		    "Year": 2001,
		    "Doy": 274,
		    "SCF": 2.74431,
		    "Cloud": 99.8451,
		    "Age": 2.56253
		  },
		  {
		    "Year": 2001,
		    "Doy": 275,
		    "SCF": 2.60962,
		    "Cloud": 32.1339,
		    "Age": 1.17178
		  },
		  {
		    "Year": 2001,
		    "Doy": 276,
		    "SCF": 3.81296,
		    "Cloud": 52.8464,
		    "Age": 1.08228
		  },
		  {
		    "Year": 2001,
		    "Doy": 277,
		    "SCF": 3.17685,
		    "Cloud": 94.5242,
		    "Age": 1.96793
		  },
		  {
		    "Year": 2001,
		    "Doy": 278,
		    "SCF": 2.26448,
		    "Cloud": 37.1105,
		    "Age": 1.22325
		  },
		  {
		    "Year": 2001,
		    "Doy": 279,
		    "SCF": 4.07208,
		    "Cloud": 99.6569,
		    "Age": 2.21923
		  },
		  {
		    "Year": 2001,
		    "Doy": 280,
		    "SCF": 4.03313,
		    "Cloud": 99.8292,
		    "Age": 3.21544
		  },
		  {
		    "Year": 2001,
		    "Doy": 281,
		    "SCF": 3.91025,
		    "Cloud": 100,
		    "Age": 4.21544
		  },
		  {
		    "Year": 2001,
		    "Doy": 282,
		    "SCF": 3.91025,
		    "Cloud": 97.9691,
		    "Age": 5.11679
		  },
		  {
		    "Year": 2001,
		    "Doy": 283,
		    "SCF": 2.77716,
		    "Cloud": 89.6349,
		    "Age": 5.60234
		  },
		  {
		    "Year": 2001,
		    "Doy": 284,
		    "SCF": 2.36581,
		    "Cloud": 57.2161,
		    "Age": 4.11572
		  },
		  {
		    "Year": 2001,
		    "Doy": 285,
		    "SCF": 1.78064,
		    "Cloud": 41.7058,
		    "Age": 2.52621
		  },
		  {
		    "Year": 2001,
		    "Doy": 286,
		    "SCF": 1.69101,
		    "Cloud": 92.0065,
		    "Age": 3.36702
		  },
		  {
		    "Year": 2001,
		    "Doy": 287,
		    "SCF": 0.817551,
		    "Cloud": 9.97139,
		    "Age": 0.74362
		  },
		  {
		    "Year": 2001,
		    "Doy": 288,
		    "SCF": 1.61472,
		    "Cloud": 99.5912,
		    "Age": 1.73933
		  },
		  {
		    "Year": 2001,
		    "Doy": 289,
		    "SCF": 1.28504,
		    "Cloud": 99.8263,
		    "Age": 2.73565
		  },
		  {
		    "Year": 2001,
		    "Doy": 290,
		    "SCF": 1.13285,
		    "Cloud": 5.12877,
		    "Age": 0.273067
		  },
		  {
		    "Year": 2001,
		    "Doy": 291,
		    "SCF": 4.84713,
		    "Cloud": 79.7425,
		    "Age": 1.01076
		  },
		  {
		    "Year": 2001,
		    "Doy": 292,
		    "SCF": 7.46749,
		    "Cloud": 35.4325,
		    "Age": 0.729141
		  },
		  {
		    "Year": 2001,
		    "Doy": 293,
		    "SCF": 20.6067,
		    "Cloud": 97.9733,
		    "Age": 1.70007
		  },
		  {
		    "Year": 2001,
		    "Doy": 294,
		    "SCF": 20.7755,
		    "Cloud": 94.3357,
		    "Age": 2.58659
		  },
		  {
		    "Year": 2001,
		    "Doy": 295,
		    "SCF": 22.8936,
		    "Cloud": 89.748,
		    "Age": 3.26918
		  },
		  {
		    "Year": 2001,
		    "Doy": 296,
		    "SCF": 26.9216,
		    "Cloud": 83.5147,
		    "Age": 3.3984
		  },
		  {
		    "Year": 2001,
		    "Doy": 297,
		    "SCF": 27.6728,
		    "Cloud": 99.7477,
		    "Age": 4.38838
		  },
		  {
		    "Year": 2001,
		    "Doy": 298,
		    "SCF": 27.6704,
		    "Cloud": 98.8231,
		    "Age": 5.32411
		  },
		  {
		    "Year": 2001,
		    "Doy": 299,
		    "SCF": 27.6041,
		    "Cloud": 99.3421,
		    "Age": 6.28325
		  },
		  {
		    "Year": 2001,
		    "Doy": 300,
		    "SCF": 27.3398,
		    "Cloud": 59.2779,
		    "Age": 4.52731
		  },
		  {
		    "Year": 2001,
		    "Doy": 301,
		    "SCF": 35.4249,
		    "Cloud": 63.236,
		    "Age": 3.53065
		  },
		  {
		    "Year": 2001,
		    "Doy": 302,
		    "SCF": 45.7574,
		    "Cloud": 88.4171,
		    "Age": 4.1669
		  },
		  {
		    "Year": 2001,
		    "Doy": 303,
		    "SCF": 45.397,
		    "Cloud": 69.2903,
		    "Age": 3.71967
		  },
		  {
		    "Year": 2001,
		    "Doy": 304,
		    "SCF": 54.2126,
		    "Cloud": 88.5577,
		    "Age": 4.11676
		  },
		  {
		    "Year": 2001,
		    "Doy": 305,
		    "SCF": 54.0433,
		    "Cloud": 17.4562,
		    "Age": 0.917845
		  },
		  {
		    "Year": 2001,
		    "Doy": 306,
		    "SCF": 40.0784,
		    "Cloud": 66.7265,
		    "Age": 1.38595
		  },
		  {
		    "Year": 2001,
		    "Doy": 307,
		    "SCF": 34.8745,
		    "Cloud": 33.5155,
		    "Age": 1.13257
		  },
		  {
		    "Year": 2001,
		    "Doy": 308,
		    "SCF": 38.6311,
		    "Cloud": 48.1521,
		    "Age": 1.34775
		  },
		  {
		    "Year": 2001,
		    "Doy": 309,
		    "SCF": 38.6174,
		    "Cloud": 18.6452,
		    "Age": 0.93277
		  },
		  {
		    "Year": 2001,
		    "Doy": 310,
		    "SCF": 42.3489,
		    "Cloud": 27.3976,
		    "Age": 0.526132
		  },
		  {
		    "Year": 2001,
		    "Doy": 311,
		    "SCF": 44.0952,
		    "Cloud": 94.006,
		    "Age": 1.45039
		  },
		  {
		    "Year": 2001,
		    "Doy": 312,
		    "SCF": 43.9714,
		    "Cloud": 91.5103,
		    "Age": 2.20957
		  },
		  {
		    "Year": 2001,
		    "Doy": 313,
		    "SCF": 42.7875,
		    "Cloud": 63.7577,
		    "Age": 2.06301
		  },
		  {
		    "Year": 2001,
		    "Doy": 314,
		    "SCF": 38.4422,
		    "Cloud": 93.0636,
		    "Age": 2.89166
		  },
		  {
		    "Year": 2001,
		    "Doy": 315,
		    "SCF": 38.8757,
		    "Cloud": 36.8708,
		    "Age": 1.41647
		  },
		  {
		    "Year": 2001,
		    "Doy": 316,
		    "SCF": 38.6172,
		    "Cloud": 36.6777,
		    "Age": 1.20768
		  },
		  {
		    "Year": 2001,
		    "Doy": 317,
		    "SCF": 40.3673,
		    "Cloud": 85.5218,
		    "Age": 2.01517
		  },
		  {
		    "Year": 2001,
		    "Doy": 318,
		    "SCF": 40.2801,
		    "Cloud": 26.8676,
		    "Age": 1.22798
		  },
		  {
		    "Year": 2001,
		    "Doy": 319,
		    "SCF": 31.9621,
		    "Cloud": 46.8592,
		    "Age": 1.11348
		  },
		  {
		    "Year": 2001,
		    "Doy": 320,
		    "SCF": 32.936,
		    "Cloud": 86.8867,
		    "Age": 1.88602
		  },
		  {
		    "Year": 2001,
		    "Doy": 321,
		    "SCF": 32.6209,
		    "Cloud": 49.6681,
		    "Age": 1.69108
		  },
		  {
		    "Year": 2001,
		    "Doy": 322,
		    "SCF": 35.0949,
		    "Cloud": 70.118,
		    "Age": 2.09347
		  },
		  {
		    "Year": 2001,
		    "Doy": 323,
		    "SCF": 39.3193,
		    "Cloud": 73.0483,
		    "Age": 2.08505
		  },
		  {
		    "Year": 2001,
		    "Doy": 324,
		    "SCF": 40.4239,
		    "Cloud": 39.4288,
		    "Age": 1.4192
		  },
		  {
		    "Year": 2001,
		    "Doy": 325,
		    "SCF": 46.8745,
		    "Cloud": 100,
		    "Age": 2.41961
		  },
		  {
		    "Year": 2001,
		    "Doy": 326,
		    "SCF": 46.8745,
		    "Cloud": 54.9344,
		    "Age": 1.96595
		  },
		  {
		    "Year": 2001,
		    "Doy": 327,
		    "SCF": 55.4908,
		    "Cloud": 84.4648,
		    "Age": 2.61514
		  },
		  {
		    "Year": 2001,
		    "Doy": 328,
		    "SCF": 57.3911,
		    "Cloud": 99.8645,
		    "Age": 3.61467
		  },
		  {
		    "Year": 2001,
		    "Doy": 329,
		    "SCF": 57.3911,
		    "Cloud": 94.0264,
		    "Age": 4.30789
		  },
		  {
		    "Year": 2001,
		    "Doy": 330,
		    "SCF": 57.677,
		    "Cloud": 18.6741,
		    "Age": 1.22117
		  },
		  {
		    "Year": 2001,
		    "Doy": 331,
		    "SCF": 84.0567,
		    "Cloud": 96.7469,
		    "Age": 2.1073
		  },
		  {
		    "Year": 2001,
		    "Doy": 332,
		    "SCF": 84.6112,
		    "Cloud": 96.872,
		    "Age": 2.98095
		  },
		  {
		    "Year": 2001,
		    "Doy": 333,
		    "SCF": 85.1605,
		    "Cloud": 99.3334,
		    "Age": 3.94965
		  },
		  {
		    "Year": 2001,
		    "Doy": 334,
		    "SCF": 85.2551,
		    "Cloud": 100,
		    "Age": 4.94965
		  },
		  {
		    "Year": 2001,
		    "Doy": 335,
		    "SCF": 85.2551,
		    "Cloud": 99.9942,
		    "Age": 5.94965
		  },
		  {
		    "Year": 2001,
		    "Doy": 336,
		    "SCF": 85.2551,
		    "Cloud": 39.1147,
		    "Age": 2.92241
		  },
		  {
		    "Year": 2001,
		    "Doy": 337,
		    "SCF": 86.394,
		    "Cloud": 94.3285,
		    "Age": 3.62712
		  },
		  {
		    "Year": 2001,
		    "Doy": 338,
		    "SCF": 87.1895,
		    "Cloud": 94.5278,
		    "Age": 4.37445
		  },
		  {
		    "Year": 2001,
		    "Doy": 339,
		    "SCF": 87.9235,
		    "Cloud": 93.9808,
		    "Age": 5.07549
		  },
		  {
		    "Year": 2001,
		    "Doy": 340,
		    "SCF": 88.4917,
		    "Cloud": 32.6863,
		    "Age": 2.64484
		  },
		  {
		    "Year": 2001,
		    "Doy": 341,
		    "SCF": 84.4317,
		    "Cloud": 84.129,
		    "Age": 2.84114
		  },
		  {
		    "Year": 2001,
		    "Doy": 342,
		    "SCF": 84.2736,
		    "Cloud": 96.9401,
		    "Age": 3.75828
		  },
		  {
		    "Year": 2001,
		    "Doy": 343,
		    "SCF": 84.5745,
		    "Cloud": 87.0286,
		    "Age": 4.09535
		  },
		  {
		    "Year": 2001,
		    "Doy": 344,
		    "SCF": 85.3967,
		    "Cloud": 31.2754,
		    "Age": 1.77917
		  },
		  {
		    "Year": 2001,
		    "Doy": 345,
		    "SCF": 82.7853,
		    "Cloud": 35.4983,
		    "Age": 1.58164
		  },
		  {
		    "Year": 2001,
		    "Doy": 346,
		    "SCF": 84.4788,
		    "Cloud": 11.1305,
		    "Age": 0.535741
		  },
		  {
		    "Year": 2001,
		    "Doy": 347,
		    "SCF": 82.6021,
		    "Cloud": 86.1176,
		    "Age": 1.33857
		  },
		  {
		    "Year": 2001,
		    "Doy": 348,
		    "SCF": 82.9955,
		    "Cloud": 56.7172,
		    "Age": 1.51742
		  },
		  {
		    "Year": 2001,
		    "Doy": 349,
		    "SCF": 82.4008,
		    "Cloud": 54.7554,
		    "Age": 1.33723
		  },
		  {
		    "Year": 2001,
		    "Doy": 350,
		    "SCF": 82.6046,
		    "Cloud": 42.1579,
		    "Age": 1.04794
		  },
		  {
		    "Year": 2001,
		    "Doy": 351,
		    "SCF": 81.4192,
		    "Cloud": 46.4006,
		    "Age": 0.954591
		  },
		  {
		    "Year": 2001,
		    "Doy": 352,
		    "SCF": 78.3832,
		    "Cloud": 96.704,
		    "Age": 1.89577
		  },
		  {
		    "Year": 2001,
		    "Doy": 353,
		    "SCF": 78.2758,
		    "Cloud": 77.0473,
		    "Age": 2.34075
		  },
		  {
		    "Year": 2001,
		    "Doy": 354,
		    "SCF": 78.7968,
		    "Cloud": 97.6786,
		    "Age": 3.27149
		  },
		  {
		    "Year": 2001,
		    "Doy": 355,
		    "SCF": 78.612,
		    "Cloud": 41.6004,
		    "Age": 2.66365
		  },
		  {
		    "Year": 2001,
		    "Doy": 356,
		    "SCF": 79.3381,
		    "Cloud": 28.1373,
		    "Age": 1.32769
		  },
		  {
		    "Year": 2001,
		    "Doy": 357,
		    "SCF": 83.0266,
		    "Cloud": 86.5598,
		    "Age": 2.14126
		  },
		  {
		    "Year": 2001,
		    "Doy": 358,
		    "SCF": 84.1459,
		    "Cloud": 92.6705,
		    "Age": 2.92531
		  },
		  {
		    "Year": 2001,
		    "Doy": 359,
		    "SCF": 84.8308,
		    "Cloud": 44.9362,
		    "Age": 2.13492
		  },
		  {
		    "Year": 2001,
		    "Doy": 360,
		    "SCF": 81.4869,
		    "Cloud": 59.7079,
		    "Age": 1.71811
		  },
		  {
		    "Year": 2001,
		    "Doy": 361,
		    "SCF": 85.2272,
		    "Cloud": 29.7044,
		    "Age": 1.01368
		  },
		  {
		    "Year": 2001,
		    "Doy": 362,
		    "SCF": 83.6216,
		    "Cloud": 80.799,
		    "Age": 1.69536
		  },
		  {
		    "Year": 2001,
		    "Doy": 363,
		    "SCF": 85.1042,
		    "Cloud": 99.9869,
		    "Age": 2.69536
		  },
		  {
		    "Year": 2001,
		    "Doy": 364,
		    "SCF": 85.1042,
		    "Cloud": 35.2511,
		    "Age": 1.52577
		  },
		  {
		    "Year": 2001,
		    "Doy": 365,
		    "SCF": 84.3984,
		    "Cloud": 29.6506,
		    "Age": 1.11522
		  },
		  {
		    "Year": 2002,
		    "Doy": 1,
		    "SCF": 79.9245,
		    "Cloud": 86.4398,
		    "Age": 0.863015
		  },
		  {
		    "Year": 2002,
		    "Doy": 2,
		    "SCF": 79.7651,
		    "Cloud": 32.6386,
		    "Age": 0.598412
		  },
		  {
		    "Year": 2002,
		    "Doy": 3,
		    "SCF": 81.78,
		    "Cloud": 92.5562,
		    "Age": 1.52134
		  },
		  {
		    "Year": 2002,
		    "Doy": 4,
		    "SCF": 81.6137,
		    "Cloud": 74.5659,
		    "Age": 2.00849
		  },
		  {
		    "Year": 2002,
		    "Doy": 5,
		    "SCF": 80.7797,
		    "Cloud": 27.7772,
		    "Age": 0.822419
		  },
		  {
		    "Year": 2002,
		    "Doy": 6,
		    "SCF": 81.7291,
		    "Cloud": 27.4522,
		    "Age": 0.652774
		  },
		  {
		    "Year": 2002,
		    "Doy": 7,
		    "SCF": 82.467,
		    "Cloud": 99.9883,
		    "Age": 1.65276
		  },
		  {
		    "Year": 2002,
		    "Doy": 8,
		    "SCF": 82.467,
		    "Cloud": 53.1654,
		    "Age": 1.50385
		  },
		  {
		    "Year": 2002,
		    "Doy": 9,
		    "SCF": 83.1816,
		    "Cloud": 99.9272,
		    "Age": 2.50252
		  },
		  {
		    "Year": 2002,
		    "Doy": 10,
		    "SCF": 83.1816,
		    "Cloud": 97.0955,
		    "Age": 3.3584
		  },
		  {
		    "Year": 2002,
		    "Doy": 11,
		    "SCF": 82.8972,
		    "Cloud": 34.8855,
		    "Age": 1.65116
		  },
		  {
		    "Year": 2002,
		    "Doy": 12,
		    "SCF": 78.4059,
		    "Cloud": 84.8142,
		    "Age": 2.03544
		  },
		  {
		    "Year": 2002,
		    "Doy": 13,
		    "SCF": 79.0244,
		    "Cloud": 98.8399,
		    "Age": 3.00052
		  },
		  {
		    "Year": 2002,
		    "Doy": 14,
		    "SCF": 78.944,
		    "Cloud": 88.3317,
		    "Age": 3.51758
		  },
		  {
		    "Year": 2002,
		    "Doy": 15,
		    "SCF": 79.5381,
		    "Cloud": 96.2224,
		    "Age": 4.35694
		  },
		  {
		    "Year": 2002,
		    "Doy": 16,
		    "SCF": 80.1423,
		    "Cloud": 67.0373,
		    "Age": 3.70501
		  },
		  {
		    "Year": 2002,
		    "Doy": 17,
		    "SCF": 83.2333,
		    "Cloud": 95.8924,
		    "Age": 4.47242
		  },
		  {
		    "Year": 2002,
		    "Doy": 18,
		    "SCF": 83.6726,
		    "Cloud": 70.7025,
		    "Age": 3.80847
		  },
		  {
		    "Year": 2002,
		    "Doy": 19,
		    "SCF": 84.6291,
		    "Cloud": 99.146,
		    "Age": 4.78617
		  },
		  {
		    "Year": 2002,
		    "Doy": 20,
		    "SCF": 84.6933,
		    "Cloud": 98.1844,
		    "Age": 5.66382
		  },
		  {
		    "Year": 2002,
		    "Doy": 21,
		    "SCF": 84.827,
		    "Cloud": 54.2081,
		    "Age": 3.3896
		  },
		  {
		    "Year": 2002,
		    "Doy": 22,
		    "SCF": 86.9795,
		    "Cloud": 98.6169,
		    "Age": 4.34645
		  },
		  {
		    "Year": 2002,
		    "Doy": 23,
		    "SCF": 87.1451,
		    "Cloud": 40.2949,
		    "Age": 2.47816
		  },
		  {
		    "Year": 2002,
		    "Doy": 24,
		    "SCF": 87.187,
		    "Cloud": 88.294,
		    "Age": 3.10318
		  },
		  {
		    "Year": 2002,
		    "Doy": 25,
		    "SCF": 88.8466,
		    "Cloud": 20.8911,
		    "Age": 1.07325
		  },
		  {
		    "Year": 2002,
		    "Doy": 26,
		    "SCF": 85.9944,
		    "Cloud": 99.5766,
		    "Age": 2.0538
		  },
		  {
		    "Year": 2002,
		    "Doy": 27,
		    "SCF": 86.0553,
		    "Cloud": 33.1224,
		    "Age": 1.38629
		  },
		  {
		    "Year": 2002,
		    "Doy": 28,
		    "SCF": 82.1481,
		    "Cloud": 91.5798,
		    "Age": 2.15911
		  },
		  {
		    "Year": 2002,
		    "Doy": 29,
		    "SCF": 82.5236,
		    "Cloud": 16.1157,
		    "Age": 0.912146
		  },
		  {
		    "Year": 2002,
		    "Doy": 30,
		    "SCF": 83.0808,
		    "Cloud": 93.8694,
		    "Age": 1.7915
		  },
		  {
		    "Year": 2002,
		    "Doy": 31,
		    "SCF": 84.57,
		    "Cloud": 96.0978,
		    "Age": 2.70306
		  },
		  {
		    "Year": 2002,
		    "Doy": 32,
		    "SCF": 84.7424,
		    "Cloud": 98.8907,
		    "Age": 3.67265
		  },
		  {
		    "Year": 2002,
		    "Doy": 33,
		    "SCF": 84.9582,
		    "Cloud": 100,
		    "Age": 4.67265
		  },
		  {
		    "Year": 2002,
		    "Doy": 34,
		    "SCF": 84.9582,
		    "Cloud": 80.5564,
		    "Age": 4.48867
		  },
		  {
		    "Year": 2002,
		    "Doy": 35,
		    "SCF": 84.9258,
		    "Cloud": 99.9854,
		    "Age": 5.48775
		  },
		  {
		    "Year": 2002,
		    "Doy": 36,
		    "SCF": 84.9273,
		    "Cloud": 85.7438,
		    "Age": 5.48638
		  },
		  {
		    "Year": 2002,
		    "Doy": 37,
		    "SCF": 85.8634,
		    "Cloud": 45.8298,
		    "Age": 3.13694
		  },
		  {
		    "Year": 2002,
		    "Doy": 38,
		    "SCF": 88.1858,
		    "Cloud": 17.1903,
		    "Age": 0.827893
		  },
		  {
		    "Year": 2002,
		    "Doy": 39,
		    "SCF": 83.015,
		    "Cloud": 79.3637,
		    "Age": 1.5552
		  },
		  {
		    "Year": 2002,
		    "Doy": 40,
		    "SCF": 85.3182,
		    "Cloud": 98.6528,
		    "Age": 2.51674
		  },
		  {
		    "Year": 2002,
		    "Doy": 41,
		    "SCF": 85.4682,
		    "Cloud": 37.1033,
		    "Age": 1.54767
		  },
		  {
		    "Year": 2002,
		    "Doy": 42,
		    "SCF": 84.8808,
		    "Cloud": 89.5716,
		    "Age": 2.24858
		  },
		  {
		    "Year": 2002,
		    "Doy": 43,
		    "SCF": 85.6783,
		    "Cloud": 74.9749,
		    "Age": 2.29507
		  },
		  {
		    "Year": 2002,
		    "Doy": 44,
		    "SCF": 84.1674,
		    "Cloud": 22.4256,
		    "Age": 1.10193
		  },
		  {
		    "Year": 2002,
		    "Doy": 45,
		    "SCF": 82.3318,
		    "Cloud": 99.8632,
		    "Age": 2.0979
		  },
		  {
		    "Year": 2002,
		    "Doy": 46,
		    "SCF": 82.3262,
		    "Cloud": 44.4019,
		    "Age": 1.60822
		  },
		  {
		    "Year": 2002,
		    "Doy": 47,
		    "SCF": 80.8867,
		    "Cloud": 96.0075,
		    "Age": 2.40568
		  },
		  {
		    "Year": 2002,
		    "Doy": 48,
		    "SCF": 81.5203,
		    "Cloud": 62.5977,
		    "Age": 2.22717
		  },
		  {
		    "Year": 2002,
		    "Doy": 49,
		    "SCF": 80.0285,
		    "Cloud": 47.5797,
		    "Age": 1.75517
		  },
		  {
		    "Year": 2002,
		    "Doy": 50,
		    "SCF": 85.2169,
		    "Cloud": 18.5452,
		    "Age": 0.967242
		  },
		  {
		    "Year": 2002,
		    "Doy": 51,
		    "SCF": 82.1966,
		    "Cloud": 54.9758,
		    "Age": 1.28084
		  },
		  {
		    "Year": 2002,
		    "Doy": 52,
		    "SCF": 83.8569,
		    "Cloud": 50.1012,
		    "Age": 1.42315
		  },
		  {
		    "Year": 2002,
		    "Doy": 53,
		    "SCF": 81.5652,
		    "Cloud": 95.3569,
		    "Age": 2.3176
		  },
		  {
		    "Year": 2002,
		    "Doy": 54,
		    "SCF": 82.0538,
		    "Cloud": 17.5413,
		    "Age": 1.00207
		  },
		  {
		    "Year": 2002,
		    "Doy": 55,
		    "SCF": 84.1521,
		    "Cloud": 17.443,
		    "Age": 0.89259
		  },
		  {
		    "Year": 2002,
		    "Doy": 56,
		    "SCF": 82.7028,
		    "Cloud": 16.525,
		    "Age": 0.885665
		  },
		  {
		    "Year": 2002,
		    "Doy": 57,
		    "SCF": 80.16,
		    "Cloud": 97.426,
		    "Age": 1.80526
		  },
		  {
		    "Year": 2002,
		    "Doy": 58,
		    "SCF": 80.2386,
		    "Cloud": 99.7802,
		    "Age": 2.80104
		  },
		  {
		    "Year": 2002,
		    "Doy": 59,
		    "SCF": 80.2328,
		    "Cloud": 90.9865,
		    "Age": 3.51175
		  },
		  {
		    "Year": 2002,
		    "Doy": 60,
		    "SCF": 80.2775,
		    "Cloud": 40.3253,
		    "Age": 2.18134
		  },
		  {
		    "Year": 2002,
		    "Doy": 61,
		    "SCF": 80.8328,
		    "Cloud": 66.6769,
		    "Age": 2.13383
		  },
		  {
		    "Year": 2002,
		    "Doy": 62,
		    "SCF": 82.7278,
		    "Cloud": 49.4868,
		    "Age": 1.91225
		  },
		  {
		    "Year": 2002,
		    "Doy": 63,
		    "SCF": 86.2999,
		    "Cloud": 69.5384,
		    "Age": 2.33111
		  },
		  {
		    "Year": 2002,
		    "Doy": 64,
		    "SCF": 87.5991,
		    "Cloud": 63.5858,
		    "Age": 2.57893
		  },
		  {
		    "Year": 2002,
		    "Doy": 65,
		    "SCF": 89.4411,
		    "Cloud": 95.8722,
		    "Age": 3.48508
		  },
		  {
		    "Year": 2002,
		    "Doy": 66,
		    "SCF": 89.8094,
		    "Cloud": 19.7332,
		    "Age": 1.54955
		  },
		  {
		    "Year": 2002,
		    "Doy": 67,
		    "SCF": 85.4648,
		    "Cloud": 98.9216,
		    "Age": 2.53556
		  },
		  {
		    "Year": 2002,
		    "Doy": 68,
		    "SCF": 85.5317,
		    "Cloud": 57.1114,
		    "Age": 2.58291
		  },
		  {
		    "Year": 2002,
		    "Doy": 69,
		    "SCF": 85.6652,
		    "Cloud": 22.3493,
		    "Age": 1.7756
		  },
		  {
		    "Year": 2002,
		    "Doy": 70,
		    "SCF": 81.7982,
		    "Cloud": 67.455,
		    "Age": 2.2504
		  },
		  {
		    "Year": 2002,
		    "Doy": 71,
		    "SCF": 79.8244,
		    "Cloud": 92.5451,
		    "Age": 2.96396
		  },
		  {
		    "Year": 2002,
		    "Doy": 72,
		    "SCF": 79.9466,
		    "Cloud": 35.761,
		    "Age": 2.16937
		  },
		  {
		    "Year": 2002,
		    "Doy": 73,
		    "SCF": 88.8674,
		    "Cloud": 2.94649,
		    "Age": 0.506729
		  },
		  {
		    "Year": 2002,
		    "Doy": 74,
		    "SCF": 81.3847,
		    "Cloud": 10.775,
		    "Age": 0.570603
		  },
		  {
		    "Year": 2002,
		    "Doy": 75,
		    "SCF": 84.9868,
		    "Cloud": 99.5586,
		    "Age": 1.56542
		  },
		  {
		    "Year": 2002,
		    "Doy": 76,
		    "SCF": 84.9927,
		    "Cloud": 83.461,
		    "Age": 2.22413
		  },
		  {
		    "Year": 2002,
		    "Doy": 77,
		    "SCF": 87.0586,
		    "Cloud": 99.8995,
		    "Age": 3.22263
		  },
		  {
		    "Year": 2002,
		    "Doy": 78,
		    "SCF": 87.0508,
		    "Cloud": 98.9963,
		    "Age": 4.18116
		  },
		  {
		    "Year": 2002,
		    "Doy": 79,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 80,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 81,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 82,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 83,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 84,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 85,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 86,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 87,
		    "SCF": 87.0508,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 88,
		    "SCF": 87.112,
		    "Cloud": 9.80378,
		    "Age": 0.641281
		  },
		  {
		    "Year": 2002,
		    "Doy": 89,
		    "SCF": 90.0007,
		    "Cloud": 12.0565,
		    "Age": 0.26091
		  },
		  {
		    "Year": 2002,
		    "Doy": 90,
		    "SCF": 83.7387,
		    "Cloud": 26.7007,
		    "Age": 0.459869
		  },
		  {
		    "Year": 2002,
		    "Doy": 91,
		    "SCF": 85.0281,
		    "Cloud": 99.7057,
		    "Age": 1.45525
		  },
		  {
		    "Year": 2002,
		    "Doy": 92,
		    "SCF": 85.0266,
		    "Cloud": 100,
		    "Age": 2.45529
		  },
		  {
		    "Year": 2002,
		    "Doy": 93,
		    "SCF": 85.0266,
		    "Cloud": 98.4746,
		    "Age": 3.40184
		  },
		  {
		    "Year": 2002,
		    "Doy": 94,
		    "SCF": 85.0943,
		    "Cloud": 7.12298,
		    "Age": 0.29943
		  },
		  {
		    "Year": 2002,
		    "Doy": 95,
		    "SCF": 72.9851,
		    "Cloud": 99.9242,
		    "Age": 1.29828
		  },
		  {
		    "Year": 2002,
		    "Doy": 96,
		    "SCF": 72.9852,
		    "Cloud": 83.5211,
		    "Age": 1.96335
		  },
		  {
		    "Year": 2002,
		    "Doy": 97,
		    "SCF": 72.4923,
		    "Cloud": 75.8887,
		    "Age": 2.25331
		  },
		  {
		    "Year": 2002,
		    "Doy": 98,
		    "SCF": 73.36,
		    "Cloud": 99.6707,
		    "Age": 3.23913
		  },
		  {
		    "Year": 2002,
		    "Doy": 99,
		    "SCF": 73.3643,
		    "Cloud": 77.7143,
		    "Age": 3.46046
		  },
		  {
		    "Year": 2002,
		    "Doy": 100,
		    "SCF": 74.0242,
		    "Cloud": 72.9877,
		    "Age": 3.39647
		  },
		  {
		    "Year": 2002,
		    "Doy": 101,
		    "SCF": 72.5728,
		    "Cloud": 58.0977,
		    "Age": 3.12467
		  },
		  {
		    "Year": 2002,
		    "Doy": 102,
		    "SCF": 64.9862,
		    "Cloud": 64.8831,
		    "Age": 2.16372
		  },
		  {
		    "Year": 2002,
		    "Doy": 103,
		    "SCF": 64.0935,
		    "Cloud": 99.9519,
		    "Age": 3.16261
		  },
		  {
		    "Year": 2002,
		    "Doy": 104,
		    "SCF": 64.0914,
		    "Cloud": 100,
		    "Age": 4.16261
		  },
		  {
		    "Year": 2002,
		    "Doy": 105,
		    "SCF": 64.0914,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2002,
		    "Doy": 106,
		    "SCF": 64.0914,
		    "Cloud": 58.2216,
		    "Age": 3.03108
		  },
		  {
		    "Year": 2002,
		    "Doy": 107,
		    "SCF": 63.5924,
		    "Cloud": 94.6201,
		    "Age": 3.93493
		  },
		  {
		    "Year": 2002,
		    "Doy": 108,
		    "SCF": 63.1338,
		    "Cloud": 63.459,
		    "Age": 2.96651
		  },
		  {
		    "Year": 2002,
		    "Doy": 109,
		    "SCF": 61.9209,
		    "Cloud": 40.8692,
		    "Age": 1.84198
		  },
		  {
		    "Year": 2002,
		    "Doy": 110,
		    "SCF": 60.2065,
		    "Cloud": 41.2125,
		    "Age": 1.45959
		  },
		  {
		    "Year": 2002,
		    "Doy": 111,
		    "SCF": 58.8448,
		    "Cloud": 18.7882,
		    "Age": 0.28955
		  },
		  {
		    "Year": 2002,
		    "Doy": 112,
		    "SCF": 52.0628,
		    "Cloud": 99.8467,
		    "Age": 1.28859
		  },
		  {
		    "Year": 2002,
		    "Doy": 113,
		    "SCF": 52.0756,
		    "Cloud": 31.8825,
		    "Age": 0.838164
		  },
		  {
		    "Year": 2002,
		    "Doy": 114,
		    "SCF": 51.4685,
		    "Cloud": 23.0622,
		    "Age": 0.600044
		  },
		  {
		    "Year": 2002,
		    "Doy": 115,
		    "SCF": 45.0533,
		    "Cloud": 67.8725,
		    "Age": 1.19171
		  },
		  {
		    "Year": 2002,
		    "Doy": 116,
		    "SCF": 44.03,
		    "Cloud": 90.5365,
		    "Age": 2.01
		  },
		  {
		    "Year": 2002,
		    "Doy": 117,
		    "SCF": 43.8975,
		    "Cloud": 99.9942,
		    "Age": 3.01024
		  },
		  {
		    "Year": 2002,
		    "Doy": 118,
		    "SCF": 43.8975,
		    "Cloud": 49.7671,
		    "Age": 1.92496
		  },
		  {
		    "Year": 2002,
		    "Doy": 119,
		    "SCF": 44.5689,
		    "Cloud": 99.8541,
		    "Age": 2.91918
		  },
		  {
		    "Year": 2002,
		    "Doy": 120,
		    "SCF": 44.559,
		    "Cloud": 98.5849,
		    "Age": 3.85534
		  },
		  {
		    "Year": 2002,
		    "Doy": 121,
		    "SCF": 44.4263,
		    "Cloud": 99.679,
		    "Age": 4.83709
		  },
		  {
		    "Year": 2002,
		    "Doy": 122,
		    "SCF": 44.2515,
		    "Cloud": 71.4565,
		    "Age": 4.31474
		  },
		  {
		    "Year": 2002,
		    "Doy": 123,
		    "SCF": 43.3804,
		    "Cloud": 86.32,
		    "Age": 4.59287
		  },
		  {
		    "Year": 2002,
		    "Doy": 124,
		    "SCF": 42.3621,
		    "Cloud": 28.1507,
		    "Age": 1.47802
		  },
		  {
		    "Year": 2002,
		    "Doy": 125,
		    "SCF": 38.2038,
		    "Cloud": 15.8908,
		    "Age": 0.555864
		  },
		  {
		    "Year": 2002,
		    "Doy": 126,
		    "SCF": 29.7163,
		    "Cloud": 80.869,
		    "Age": 1.33667
		  },
		  {
		    "Year": 2002,
		    "Doy": 127,
		    "SCF": 27.8628,
		    "Cloud": 12.6893,
		    "Age": 0.319336
		  },
		  {
		    "Year": 2002,
		    "Doy": 128,
		    "SCF": 23.0558,
		    "Cloud": 73.9162,
		    "Age": 1.05696
		  },
		  {
		    "Year": 2002,
		    "Doy": 129,
		    "SCF": 22.3443,
		    "Cloud": 49.8518,
		    "Age": 1.22281
		  },
		  {
		    "Year": 2002,
		    "Doy": 130,
		    "SCF": 21.6633,
		    "Cloud": 35.5544,
		    "Age": 1.1838
		  },
		  {
		    "Year": 2002,
		    "Doy": 131,
		    "SCF": 19.9503,
		    "Cloud": 30.1534,
		    "Age": 0.893975
		  },
		  {
		    "Year": 2002,
		    "Doy": 132,
		    "SCF": 17.8278,
		    "Cloud": 98.1003,
		    "Age": 1.89391
		  },
		  {
		    "Year": 2002,
		    "Doy": 133,
		    "SCF": 17.8223,
		    "Cloud": 11.2023,
		    "Age": 0.462007
		  },
		  {
		    "Year": 2002,
		    "Doy": 134,
		    "SCF": 13.4827,
		    "Cloud": 37.5338,
		    "Age": 0.820855
		  },
		  {
		    "Year": 2002,
		    "Doy": 135,
		    "SCF": 13.441,
		    "Cloud": 87.3049,
		    "Age": 1.68848
		  },
		  {
		    "Year": 2002,
		    "Doy": 136,
		    "SCF": 13.2174,
		    "Cloud": 95.5451,
		    "Age": 2.61406
		  },
		  {
		    "Year": 2002,
		    "Doy": 137,
		    "SCF": 13.1726,
		    "Cloud": 10.0961,
		    "Age": 0.489013
		  },
		  {
		    "Year": 2002,
		    "Doy": 138,
		    "SCF": 11.4499,
		    "Cloud": 7.58544,
		    "Age": 0.303827
		  },
		  {
		    "Year": 2002,
		    "Doy": 139,
		    "SCF": 9.06399,
		    "Cloud": 51.7261,
		    "Age": 0.778292
		  },
		  {
		    "Year": 2002,
		    "Doy": 140,
		    "SCF": 7.48062,
		    "Cloud": 98.2309,
		    "Age": 1.74383
		  },
		  {
		    "Year": 2002,
		    "Doy": 141,
		    "SCF": 6.91684,
		    "Cloud": 94.512,
		    "Age": 2.59618
		  },
		  {
		    "Year": 2002,
		    "Doy": 142,
		    "SCF": 6.92978,
		    "Cloud": 92.5023,
		    "Age": 3.36198
		  },
		  {
		    "Year": 2002,
		    "Doy": 143,
		    "SCF": 6.90078,
		    "Cloud": 71.3512,
		    "Age": 3.26455
		  },
		  {
		    "Year": 2002,
		    "Doy": 144,
		    "SCF": 7.19679,
		    "Cloud": 96.0613,
		    "Age": 4.06961
		  },
		  {
		    "Year": 2002,
		    "Doy": 145,
		    "SCF": 7.02187,
		    "Cloud": 99.6569,
		    "Age": 5.06686
		  },
		  {
		    "Year": 2002,
		    "Doy": 146,
		    "SCF": 7.02013,
		    "Cloud": 71.5035,
		    "Age": 4.49846
		  },
		  {
		    "Year": 2002,
		    "Doy": 147,
		    "SCF": 7.10371,
		    "Cloud": 99.981,
		    "Age": 5.49612
		  },
		  {
		    "Year": 2002,
		    "Doy": 148,
		    "SCF": 7.09426,
		    "Cloud": 99.8103,
		    "Age": 6.49612
		  },
		  {
		    "Year": 2002,
		    "Doy": 149,
		    "SCF": 7.09426,
		    "Cloud": 95.5564,
		    "Age": 7.25055
		  },
		  {
		    "Year": 2002,
		    "Doy": 150,
		    "SCF": 6.61765,
		    "Cloud": 92.6506,
		    "Age": 7.653
		  },
		  {
		    "Year": 2002,
		    "Doy": 151,
		    "SCF": 6.30811,
		    "Cloud": 80.1296,
		    "Age": 7.17391
		  },
		  {
		    "Year": 2002,
		    "Doy": 152,
		    "SCF": 5.37202,
		    "Cloud": 36.4597,
		    "Age": 2.85285
		  },
		  {
		    "Year": 2002,
		    "Doy": 153,
		    "SCF": 4.20378,
		    "Cloud": 17.0534,
		    "Age": 0.803676
		  },
		  {
		    "Year": 2002,
		    "Doy": 154,
		    "SCF": 3.11357,
		    "Cloud": 17.132,
		    "Age": 0.806697
		  },
		  {
		    "Year": 2002,
		    "Doy": 155,
		    "SCF": 3.14713,
		    "Cloud": 49.0715,
		    "Age": 1.26481
		  },
		  {
		    "Year": 2002,
		    "Doy": 156,
		    "SCF": 2.86491,
		    "Cloud": 88.635,
		    "Age": 2.08179
		  },
		  {
		    "Year": 2002,
		    "Doy": 157,
		    "SCF": 2.63045,
		    "Cloud": 3.88798,
		    "Age": 0.218151
		  },
		  {
		    "Year": 2002,
		    "Doy": 158,
		    "SCF": 2.57097,
		    "Cloud": 17.492,
		    "Age": 0.353946
		  },
		  {
		    "Year": 2002,
		    "Doy": 159,
		    "SCF": 3.06362,
		    "Cloud": 21.1106,
		    "Age": 0.406528
		  },
		  {
		    "Year": 2002,
		    "Doy": 160,
		    "SCF": 3.49665,
		    "Cloud": 35.2014,
		    "Age": 0.63935
		  },
		  {
		    "Year": 2002,
		    "Doy": 161,
		    "SCF": 4.08215,
		    "Cloud": 75.0974,
		    "Age": 1.32314
		  },
		  {
		    "Year": 2002,
		    "Doy": 162,
		    "SCF": 4.30597,
		    "Cloud": 97.3556,
		    "Age": 2.30847
		  },
		  {
		    "Year": 2002,
		    "Doy": 163,
		    "SCF": 4.25263,
		    "Cloud": 65.6057,
		    "Age": 2.23136
		  },
		  {
		    "Year": 2002,
		    "Doy": 164,
		    "SCF": 3.77431,
		    "Cloud": 88.4891,
		    "Age": 2.92416
		  },
		  {
		    "Year": 2002,
		    "Doy": 165,
		    "SCF": 3.04535,
		    "Cloud": 54.4704,
		    "Age": 2.19328
		  },
		  {
		    "Year": 2002,
		    "Doy": 166,
		    "SCF": 3.95863,
		    "Cloud": 98.8784,
		    "Age": 3.18704
		  },
		  {
		    "Year": 2002,
		    "Doy": 167,
		    "SCF": 3.9338,
		    "Cloud": 39.9863,
		    "Age": 1.82115
		  },
		  {
		    "Year": 2002,
		    "Doy": 168,
		    "SCF": 10.2474,
		    "Cloud": 91.3776,
		    "Age": 2.61019
		  },
		  {
		    "Year": 2002,
		    "Doy": 169,
		    "SCF": 2.6076,
		    "Cloud": 94.776,
		    "Age": 3.48778
		  },
		  {
		    "Year": 2002,
		    "Doy": 170,
		    "SCF": 2.73352,
		    "Cloud": 85.1026,
		    "Age": 3.85628
		  },
		  {
		    "Year": 2002,
		    "Doy": 171,
		    "SCF": 2.52658,
		    "Cloud": 76.8314,
		    "Age": 3.83436
		  },
		  {
		    "Year": 2002,
		    "Doy": 172,
		    "SCF": 3.10825,
		    "Cloud": 63.1674,
		    "Age": 3.12792
		  },
		  {
		    "Year": 2002,
		    "Doy": 173,
		    "SCF": 3.75351,
		    "Cloud": 95.3066,
		    "Age": 3.92508
		  },
		  {
		    "Year": 2002,
		    "Doy": 174,
		    "SCF": 3.17344,
		    "Cloud": 95.2218,
		    "Age": 4.71625
		  },
		  {
		    "Year": 2002,
		    "Doy": 175,
		    "SCF": 3.01217,
		    "Cloud": 63.1399,
		    "Age": 3.84092
		  },
		  {
		    "Year": 2002,
		    "Doy": 176,
		    "SCF": 3.71963,
		    "Cloud": 96.6426,
		    "Age": 4.66497
		  },
		  {
		    "Year": 2002,
		    "Doy": 177,
		    "SCF": 3.67524,
		    "Cloud": 95.2224,
		    "Age": 5.42315
		  },
		  {
		    "Year": 2002,
		    "Doy": 178,
		    "SCF": 3.56084,
		    "Cloud": 76.1404,
		    "Age": 5.12237
		  },
		  {
		    "Year": 2002,
		    "Doy": 179,
		    "SCF": 2.92343,
		    "Cloud": 85.0142,
		    "Age": 5.26593
		  },
		  {
		    "Year": 2002,
		    "Doy": 180,
		    "SCF": 2.25718,
		    "Cloud": 79.8936,
		    "Age": 5.28896
		  },
		  {
		    "Year": 2002,
		    "Doy": 181,
		    "SCF": 2.73143,
		    "Cloud": 78.0576,
		    "Age": 5.09249
		  },
		  {
		    "Year": 2002,
		    "Doy": 182,
		    "SCF": 2.00584,
		    "Cloud": 85.7283,
		    "Age": 5.33092
		  },
		  {
		    "Year": 2002,
		    "Doy": 183,
		    "SCF": 1.5962,
		    "Cloud": 87.1718,
		    "Age": 5.71205
		  },
		  {
		    "Year": 2002,
		    "Doy": 184,
		    "SCF": 1.05651,
		    "Cloud": 86.1404,
		    "Age": 5.92904
		  },
		  {
		    "Year": 2002,
		    "Doy": 185,
		    "SCF": 0.967699,
		    "Cloud": 99.9795,
		    "Age": 6.92909
		  },
		  {
		    "Year": 2002,
		    "Doy": 186,
		    "SCF": 0.967699,
		    "Cloud": 67.87,
		    "Age": 5.70809
		  },
		  {
		    "Year": 2002,
		    "Doy": 187,
		    "SCF": 1.15979,
		    "Cloud": 42.4048,
		    "Age": 3.06546
		  },
		  {
		    "Year": 2002,
		    "Doy": 188,
		    "SCF": 1.04878,
		    "Cloud": 86.6569,
		    "Age": 3.7117
		  },
		  {
		    "Year": 2002,
		    "Doy": 189,
		    "SCF": 0.905648,
		    "Cloud": 99.816,
		    "Age": 4.7092
		  },
		  {
		    "Year": 2002,
		    "Doy": 190,
		    "SCF": 0.774125,
		    "Cloud": 99.686,
		    "Age": 5.70194
		  },
		  {
		    "Year": 2002,
		    "Doy": 191,
		    "SCF": 0.65709,
		    "Cloud": 98.1787,
		    "Age": 6.6987
		  },
		  {
		    "Year": 2002,
		    "Doy": 192,
		    "SCF": 0.578249,
		    "Cloud": 88.4864,
		    "Age": 6.88596
		  },
		  {
		    "Year": 2002,
		    "Doy": 193,
		    "SCF": 0.598624,
		    "Cloud": 67.8356,
		    "Age": 5.76361
		  },
		  {
		    "Year": 2002,
		    "Doy": 194,
		    "SCF": 0.479984,
		    "Cloud": 96.1372,
		    "Age": 6.41639
		  },
		  {
		    "Year": 2002,
		    "Doy": 195,
		    "SCF": 0.455321,
		    "Cloud": 86.1024,
		    "Age": 6.49811
		  },
		  {
		    "Year": 2002,
		    "Doy": 196,
		    "SCF": 0.467903,
		    "Cloud": 40.947,
		    "Age": 3.46479
		  },
		  {
		    "Year": 2002,
		    "Doy": 197,
		    "SCF": 0.655311,
		    "Cloud": 36.9956,
		    "Age": 2.1538
		  },
		  {
		    "Year": 2002,
		    "Doy": 198,
		    "SCF": 0.724132,
		    "Cloud": 33.94,
		    "Age": 1.77442
		  },
		  {
		    "Year": 2002,
		    "Doy": 199,
		    "SCF": 1.9247,
		    "Cloud": 93.6212,
		    "Age": 2.56475
		  },
		  {
		    "Year": 2002,
		    "Doy": 200,
		    "SCF": 1.69701,
		    "Cloud": 95.1883,
		    "Age": 3.30666
		  },
		  {
		    "Year": 2002,
		    "Doy": 201,
		    "SCF": 1.71328,
		    "Cloud": 78.5534,
		    "Age": 3.35989
		  },
		  {
		    "Year": 2002,
		    "Doy": 202,
		    "SCF": 1.7609,
		    "Cloud": 98.454,
		    "Age": 4.2992
		  },
		  {
		    "Year": 2002,
		    "Doy": 203,
		    "SCF": 1.66104,
		    "Cloud": 99.8553,
		    "Age": 5.29361
		  },
		  {
		    "Year": 2002,
		    "Doy": 204,
		    "SCF": 1.57742,
		    "Cloud": 97.51,
		    "Age": 6.15043
		  },
		  {
		    "Year": 2002,
		    "Doy": 205,
		    "SCF": 0.923557,
		    "Cloud": 98.9887,
		    "Age": 7.08762
		  },
		  {
		    "Year": 2002,
		    "Doy": 206,
		    "SCF": 0.72439,
		    "Cloud": 51.9451,
		    "Age": 4.25904
		  },
		  {
		    "Year": 2002,
		    "Doy": 207,
		    "SCF": 0.261972,
		    "Cloud": 62.5029,
		    "Age": 3.43559
		  },
		  {
		    "Year": 2002,
		    "Doy": 208,
		    "SCF": 0.23577,
		    "Cloud": 3.98772,
		    "Age": 0.252843
		  },
		  {
		    "Year": 2002,
		    "Doy": 209,
		    "SCF": 0.599418,
		    "Cloud": 62.841,
		    "Age": 0.844476
		  },
		  {
		    "Year": 2002,
		    "Doy": 210,
		    "SCF": 0.378634,
		    "Cloud": 47.8022,
		    "Age": 0.975924
		  },
		  {
		    "Year": 2002,
		    "Doy": 211,
		    "SCF": 0.536292,
		    "Cloud": 52.0174,
		    "Age": 1.0884
		  },
		  {
		    "Year": 2002,
		    "Doy": 212,
		    "SCF": 0.509538,
		    "Cloud": 61.406,
		    "Age": 1.36584
		  },
		  {
		    "Year": 2002,
		    "Doy": 213,
		    "SCF": 0.332661,
		    "Cloud": 33.617,
		    "Age": 0.803079
		  },
		  {
		    "Year": 2002,
		    "Doy": 214,
		    "SCF": 0.282838,
		    "Cloud": 93.7933,
		    "Age": 1.70239
		  },
		  {
		    "Year": 2002,
		    "Doy": 215,
		    "SCF": 0.293627,
		    "Cloud": 26.2557,
		    "Age": 0.779634
		  },
		  {
		    "Year": 2002,
		    "Doy": 216,
		    "SCF": 0.347138,
		    "Cloud": 7.91024,
		    "Age": 0.198202
		  },
		  {
		    "Year": 2002,
		    "Doy": 217,
		    "SCF": 0.665294,
		    "Cloud": 29.356,
		    "Age": 0.395717
		  },
		  {
		    "Year": 2002,
		    "Doy": 218,
		    "SCF": 1.03387,
		    "Cloud": 32.2824,
		    "Age": 0.494098
		  },
		  {
		    "Year": 2002,
		    "Doy": 219,
		    "SCF": 0.771616,
		    "Cloud": 33.2043,
		    "Age": 0.588113
		  },
		  {
		    "Year": 2002,
		    "Doy": 220,
		    "SCF": 0.828103,
		    "Cloud": 38.8865,
		    "Age": 0.715682
		  },
		  {
		    "Year": 2002,
		    "Doy": 221,
		    "SCF": 0.266808,
		    "Cloud": 53.6978,
		    "Age": 1.08783
		  },
		  {
		    "Year": 2002,
		    "Doy": 222,
		    "SCF": 0.252536,
		    "Cloud": 85.0344,
		    "Age": 1.88595
		  },
		  {
		    "Year": 2002,
		    "Doy": 223,
		    "SCF": 0.22481,
		    "Cloud": 99.7939,
		    "Age": 2.88507
		  },
		  {
		    "Year": 2002,
		    "Doy": 224,
		    "SCF": 0.192416,
		    "Cloud": 99.9912,
		    "Age": 3.88507
		  },
		  {
		    "Year": 2002,
		    "Doy": 225,
		    "SCF": 0.192416,
		    "Cloud": 19.3688,
		    "Age": 1.04622
		  },
		  {
		    "Year": 2002,
		    "Doy": 226,
		    "SCF": 0.191089,
		    "Cloud": 8.01561,
		    "Age": 0.234798
		  },
		  {
		    "Year": 2002,
		    "Doy": 227,
		    "SCF": 0.196505,
		    "Cloud": 10.9431,
		    "Age": 0.152025
		  },
		  {
		    "Year": 2002,
		    "Doy": 228,
		    "SCF": 0.211505,
		    "Cloud": 21.3595,
		    "Age": 0.259295
		  },
		  {
		    "Year": 2002,
		    "Doy": 229,
		    "SCF": 0.258544,
		    "Cloud": 21.1717,
		    "Age": 0.269045
		  },
		  {
		    "Year": 2002,
		    "Doy": 230,
		    "SCF": 0.20012,
		    "Cloud": 38.8255,
		    "Age": 0.514024
		  },
		  {
		    "Year": 2002,
		    "Doy": 231,
		    "SCF": 0.204704,
		    "Cloud": 43.971,
		    "Age": 0.713306
		  },
		  {
		    "Year": 2002,
		    "Doy": 232,
		    "SCF": 0.205522,
		    "Cloud": 88.2711,
		    "Age": 1.54793
		  },
		  {
		    "Year": 2002,
		    "Doy": 233,
		    "SCF": 0.187403,
		    "Cloud": 2.34163,
		    "Age": 0.0614056
		  },
		  {
		    "Year": 2002,
		    "Doy": 234,
		    "SCF": 0.185393,
		    "Cloud": 0.247054,
		    "Age": 0.00920972
		  },
		  {
		    "Year": 2002,
		    "Doy": 235,
		    "SCF": 0.198602,
		    "Cloud": 5.53484,
		    "Age": 0.0604652
		  },
		  {
		    "Year": 2002,
		    "Doy": 236,
		    "SCF": 0.320061,
		    "Cloud": 35.811,
		    "Age": 0.385522
		  },
		  {
		    "Year": 2002,
		    "Doy": 237,
		    "SCF": 0.259831,
		    "Cloud": 54.9635,
		    "Age": 0.791813
		  },
		  {
		    "Year": 2002,
		    "Doy": 238,
		    "SCF": 0.212819,
		    "Cloud": 7.57939,
		    "Age": 0.164805
		  },
		  {
		    "Year": 2002,
		    "Doy": 239,
		    "SCF": 0.229415,
		    "Cloud": 10.5503,
		    "Age": 0.131692
		  },
		  {
		    "Year": 2002,
		    "Doy": 240,
		    "SCF": 0.596232,
		    "Cloud": 51.6285,
		    "Age": 0.59204
		  },
		  {
		    "Year": 2002,
		    "Doy": 241,
		    "SCF": 0.596587,
		    "Cloud": 56.8507,
		    "Age": 0.947623
		  },
		  {
		    "Year": 2002,
		    "Doy": 242,
		    "SCF": 0.733398,
		    "Cloud": 78.5082,
		    "Age": 1.57256
		  },
		  {
		    "Year": 2002,
		    "Doy": 243,
		    "SCF": 0.647849,
		    "Cloud": 85.3423,
		    "Age": 2.19377
		  },
		  {
		    "Year": 2002,
		    "Doy": 244,
		    "SCF": 0.286247,
		    "Cloud": 12.9715,
		    "Age": 0.469186
		  },
		  {
		    "Year": 2002,
		    "Doy": 245,
		    "SCF": 0.630498,
		    "Cloud": 95.3139,
		    "Age": 1.39258
		  },
		  {
		    "Year": 2002,
		    "Doy": 246,
		    "SCF": 0.227245,
		    "Cloud": 9.12106,
		    "Age": 0.298849
		  },
		  {
		    "Year": 2002,
		    "Doy": 247,
		    "SCF": 0.951584,
		    "Cloud": 40.0976,
		    "Age": 0.491293
		  },
		  {
		    "Year": 2002,
		    "Doy": 248,
		    "SCF": 1.81544,
		    "Cloud": 88.0816,
		    "Age": 1.33721
		  },
		  {
		    "Year": 2002,
		    "Doy": 249,
		    "SCF": 1.57147,
		    "Cloud": 67.345,
		    "Age": 1.56491
		  },
		  {
		    "Year": 2002,
		    "Doy": 250,
		    "SCF": 1.39705,
		    "Cloud": 97.873,
		    "Age": 2.52286
		  },
		  {
		    "Year": 2002,
		    "Doy": 251,
		    "SCF": 1.2773,
		    "Cloud": 80.1397,
		    "Age": 2.82958
		  },
		  {
		    "Year": 2002,
		    "Doy": 252,
		    "SCF": 0.227637,
		    "Cloud": 12.0557,
		    "Age": 0.464804
		  },
		  {
		    "Year": 2002,
		    "Doy": 253,
		    "SCF": 0.200915,
		    "Cloud": 1.15348,
		    "Age": 0.0308324
		  },
		  {
		    "Year": 2002,
		    "Doy": 254,
		    "SCF": 0.198597,
		    "Cloud": 0.701498,
		    "Age": 0.0130216
		  },
		  {
		    "Year": 2002,
		    "Doy": 255,
		    "SCF": 0.227835,
		    "Cloud": 1.20728,
		    "Age": 0.0173492
		  },
		  {
		    "Year": 2002,
		    "Doy": 256,
		    "SCF": 0.438361,
		    "Cloud": 32.6758,
		    "Age": 0.337527
		  },
		  {
		    "Year": 2002,
		    "Doy": 257,
		    "SCF": 0.424612,
		    "Cloud": 22.9007,
		    "Age": 0.328234
		  },
		  {
		    "Year": 2002,
		    "Doy": 258,
		    "SCF": 0.40277,
		    "Cloud": 7.28258,
		    "Age": 0.120057
		  },
		  {
		    "Year": 2002,
		    "Doy": 259,
		    "SCF": 1.99422,
		    "Cloud": 92.8683,
		    "Age": 1.04028
		  },
		  {
		    "Year": 2002,
		    "Doy": 260,
		    "SCF": 1.98908,
		    "Cloud": 84.1794,
		    "Age": 1.74142
		  },
		  {
		    "Year": 2002,
		    "Doy": 261,
		    "SCF": 2.18656,
		    "Cloud": 31.9635,
		    "Age": 0.885389
		  },
		  {
		    "Year": 2002,
		    "Doy": 262,
		    "SCF": 5.00828,
		    "Cloud": 99.714,
		    "Age": 1.88017
		  },
		  {
		    "Year": 2002,
		    "Doy": 263,
		    "SCF": 4.91968,
		    "Cloud": 37.7793,
		    "Age": 1.12942
		  },
		  {
		    "Year": 2002,
		    "Doy": 264,
		    "SCF": 6.64997,
		    "Cloud": 77.3618,
		    "Age": 1.63819
		  },
		  {
		    "Year": 2002,
		    "Doy": 265,
		    "SCF": 5.85644,
		    "Cloud": 90.3865,
		    "Age": 2.39455
		  },
		  {
		    "Year": 2002,
		    "Doy": 266,
		    "SCF": 5.42909,
		    "Cloud": 66.5898,
		    "Age": 2.22084
		  },
		  {
		    "Year": 2002,
		    "Doy": 267,
		    "SCF": 5.77889,
		    "Cloud": 91.5645,
		    "Age": 2.99358
		  },
		  {
		    "Year": 2002,
		    "Doy": 268,
		    "SCF": 6.08294,
		    "Cloud": 95.796,
		    "Age": 3.78557
		  },
		  {
		    "Year": 2002,
		    "Doy": 269,
		    "SCF": 6.14178,
		    "Cloud": 61.4638,
		    "Age": 2.91858
		  },
		  {
		    "Year": 2002,
		    "Doy": 270,
		    "SCF": 8.57447,
		    "Cloud": 78.6861,
		    "Age": 3.16489
		  },
		  {
		    "Year": 2002,
		    "Doy": 271,
		    "SCF": 9.60426,
		    "Cloud": 87.8643,
		    "Age": 3.95598
		  },
		  {
		    "Year": 2002,
		    "Doy": 272,
		    "SCF": 10.0294,
		    "Cloud": 87.2846,
		    "Age": 4.4535
		  },
		  {
		    "Year": 2002,
		    "Doy": 273,
		    "SCF": 10.6827,
		    "Cloud": 95.8689,
		    "Age": 5.16097
		  },
		  {
		    "Year": 2002,
		    "Doy": 274,
		    "SCF": 10.8542,
		    "Cloud": 99.9679,
		    "Age": 6.15812
		  },
		  {
		    "Year": 2002,
		    "Doy": 275,
		    "SCF": 10.8558,
		    "Cloud": 86.7422,
		    "Age": 6.12739
		  },
		  {
		    "Year": 2002,
		    "Doy": 276,
		    "SCF": 14.8619,
		    "Cloud": 62.6289,
		    "Age": 4.0323
		  },
		  {
		    "Year": 2002,
		    "Doy": 277,
		    "SCF": 21.3866,
		    "Cloud": 98.2876,
		    "Age": 4.97642
		  },
		  {
		    "Year": 2002,
		    "Doy": 278,
		    "SCF": 21.1549,
		    "Cloud": 46.0041,
		    "Age": 3.19481
		  },
		  {
		    "Year": 2002,
		    "Doy": 279,
		    "SCF": 56.4076,
		    "Cloud": 99.8832,
		    "Age": 4.19221
		  },
		  {
		    "Year": 2002,
		    "Doy": 280,
		    "SCF": 56.4446,
		    "Cloud": 70.8561,
		    "Age": 3.01672
		  },
		  {
		    "Year": 2002,
		    "Doy": 281,
		    "SCF": 65.4947,
		    "Cloud": 99.8424,
		    "Age": 4.01036
		  },
		  {
		    "Year": 2002,
		    "Doy": 282,
		    "SCF": 65.5308,
		    "Cloud": 99.9504,
		    "Age": 5.00883
		  },
		  {
		    "Year": 2002,
		    "Doy": 283,
		    "SCF": 65.5519,
		    "Cloud": 91.3993,
		    "Age": 5.61388
		  },
		  {
		    "Year": 2002,
		    "Doy": 284,
		    "SCF": 69.7807,
		    "Cloud": 99.8584,
		    "Age": 6.6029
		  },
		  {
		    "Year": 2002,
		    "Doy": 285,
		    "SCF": 69.913,
		    "Cloud": 99.9329,
		    "Age": 7.59925
		  },
		  {
		    "Year": 2002,
		    "Doy": 286,
		    "SCF": 69.9296,
		    "Cloud": 100,
		    "Age": 8.59925
		  },
		  {
		    "Year": 2002,
		    "Doy": 287,
		    "SCF": 69.9296,
		    "Cloud": 99.8935,
		    "Age": 9.58911
		  },
		  {
		    "Year": 2002,
		    "Doy": 288,
		    "SCF": 69.9272,
		    "Cloud": 99.4892,
		    "Age": 10.5423
		  },
		  {
		    "Year": 2002,
		    "Doy": 289,
		    "SCF": 69.9093,
		    "Cloud": 96.1323,
		    "Age": 11.1036
		  },
		  {
		    "Year": 2002,
		    "Doy": 290,
		    "SCF": 69.9104,
		    "Cloud": 92.7551,
		    "Age": 11.1768
		  },
		  {
		    "Year": 2002,
		    "Doy": 291,
		    "SCF": 71.1511,
		    "Cloud": 86.755,
		    "Age": 10.5141
		  },
		  {
		    "Year": 2002,
		    "Doy": 292,
		    "SCF": 72.4188,
		    "Cloud": 14.9324,
		    "Age": 1.63773
		  },
		  {
		    "Year": 2002,
		    "Doy": 293,
		    "SCF": 65.0552,
		    "Cloud": 33.1586,
		    "Age": 1.50428
		  },
		  {
		    "Year": 2002,
		    "Doy": 294,
		    "SCF": 69.708,
		    "Cloud": 57.447,
		    "Age": 1.6537
		  },
		  {
		    "Year": 2002,
		    "Doy": 295,
		    "SCF": 74.111,
		    "Cloud": 98.1197,
		    "Age": 2.62658
		  },
		  {
		    "Year": 2002,
		    "Doy": 296,
		    "SCF": 74.1743,
		    "Cloud": 99.4442,
		    "Age": 3.61061
		  },
		  {
		    "Year": 2002,
		    "Doy": 297,
		    "SCF": 73.9958,
		    "Cloud": 90.1001,
		    "Age": 4.01866
		  },
		  {
		    "Year": 2002,
		    "Doy": 298,
		    "SCF": 74.1526,
		    "Cloud": 99.0881,
		    "Age": 4.9733
		  },
		  {
		    "Year": 2002,
		    "Doy": 299,
		    "SCF": 74.3536,
		    "Cloud": 75.1091,
		    "Age": 4.55824
		  },
		  {
		    "Year": 2002,
		    "Doy": 300,
		    "SCF": 73.482,
		    "Cloud": 72.6985,
		    "Age": 4.27586
		  },
		  {
		    "Year": 2002,
		    "Doy": 301,
		    "SCF": 74.5256,
		    "Cloud": 28.3295,
		    "Age": 2.16715
		  },
		  {
		    "Year": 2002,
		    "Doy": 302,
		    "SCF": 73.4406,
		    "Cloud": 31.3335,
		    "Age": 1.08395
		  },
		  {
		    "Year": 2002,
		    "Doy": 303,
		    "SCF": 74.2928,
		    "Cloud": 10.5563,
		    "Age": 0.606073
		  },
		  {
		    "Year": 2002,
		    "Doy": 304,
		    "SCF": 71.9509,
		    "Cloud": 16.3103,
		    "Age": 0.649332
		  },
		  {
		    "Year": 2002,
		    "Doy": 305,
		    "SCF": 71.2094,
		    "Cloud": 28.8226,
		    "Age": 0.762834
		  },
		  {
		    "Year": 2002,
		    "Doy": 306,
		    "SCF": 75.7091,
		    "Cloud": 3.27713,
		    "Age": 0.127713
		  },
		  {
		    "Year": 2002,
		    "Doy": 307,
		    "SCF": 75.4684,
		    "Cloud": 85.7674,
		    "Age": 0.969936
		  },
		  {
		    "Year": 2002,
		    "Doy": 308,
		    "SCF": 75.5519,
		    "Cloud": 18.4946,
		    "Age": 0.441835
		  },
		  {
		    "Year": 2002,
		    "Doy": 309,
		    "SCF": 77.6905,
		    "Cloud": 20.0452,
		    "Age": 0.450948
		  },
		  {
		    "Year": 2002,
		    "Doy": 310,
		    "SCF": 81.5558,
		    "Cloud": 99.7129,
		    "Age": 1.44703
		  },
		  {
		    "Year": 2002,
		    "Doy": 311,
		    "SCF": 81.5883,
		    "Cloud": 86.0872,
		    "Age": 2.12559
		  },
		  {
		    "Year": 2002,
		    "Doy": 312,
		    "SCF": 81.9072,
		    "Cloud": 97.114,
		    "Age": 3.0236
		  },
		  {
		    "Year": 2002,
		    "Doy": 313,
		    "SCF": 82.1443,
		    "Cloud": 98.5581,
		    "Age": 3.96526
		  },
		  {
		    "Year": 2002,
		    "Doy": 314,
		    "SCF": 82.3191,
		    "Cloud": 72.2996,
		    "Age": 3.49412
		  },
		  {
		    "Year": 2002,
		    "Doy": 315,
		    "SCF": 82.9341,
		    "Cloud": 36.9374,
		    "Age": 1.91163
		  },
		  {
		    "Year": 2002,
		    "Doy": 316,
		    "SCF": 83.7359,
		    "Cloud": 99.6982,
		    "Age": 2.90233
		  },
		  {
		    "Year": 2002,
		    "Doy": 317,
		    "SCF": 83.7234,
		    "Cloud": 92.7775,
		    "Age": 3.63488
		  },
		  {
		    "Year": 2002,
		    "Doy": 318,
		    "SCF": 84.5913,
		    "Cloud": 97.6871,
		    "Age": 4.53893
		  },
		  {
		    "Year": 2002,
		    "Doy": 319,
		    "SCF": 84.643,
		    "Cloud": 95.8962,
		    "Age": 5.293
		  },
		  {
		    "Year": 2002,
		    "Doy": 320,
		    "SCF": 85.3095,
		    "Cloud": 85.9081,
		    "Age": 5.44582
		  },
		  {
		    "Year": 2002,
		    "Doy": 321,
		    "SCF": 86.7975,
		    "Cloud": 84.9249,
		    "Age": 5.47971
		  },
		  {
		    "Year": 2002,
		    "Doy": 322,
		    "SCF": 87.1889,
		    "Cloud": 52.4997,
		    "Age": 3.55267
		  },
		  {
		    "Year": 2002,
		    "Doy": 323,
		    "SCF": 89.2012,
		    "Cloud": 15.97,
		    "Age": 0.91575
		  },
		  {
		    "Year": 2002,
		    "Doy": 324,
		    "SCF": 89.0847,
		    "Cloud": 50.573,
		    "Age": 1.02976
		  },
		  {
		    "Year": 2002,
		    "Doy": 325,
		    "SCF": 89.7963,
		    "Cloud": 99.6988,
		    "Age": 2.01714
		  },
		  {
		    "Year": 2002,
		    "Doy": 326,
		    "SCF": 89.8126,
		    "Cloud": 95.3907,
		    "Age": 2.90997
		  },
		  {
		    "Year": 2002,
		    "Doy": 327,
		    "SCF": 90.7367,
		    "Cloud": 99.7308,
		    "Age": 3.89835
		  },
		  {
		    "Year": 2002,
		    "Doy": 328,
		    "SCF": 90.8373,
		    "Cloud": 97.7007,
		    "Age": 4.78972
		  },
		  {
		    "Year": 2002,
		    "Doy": 329,
		    "SCF": 91.1497,
		    "Cloud": 97.6381,
		    "Age": 5.64662
		  },
		  {
		    "Year": 2002,
		    "Doy": 330,
		    "SCF": 91.5494,
		    "Cloud": 92.4064,
		    "Age": 6.16781
		  },
		  {
		    "Year": 2002,
		    "Doy": 331,
		    "SCF": 91.9888,
		    "Cloud": 11.3889,
		    "Age": 0.942924
		  },
		  {
		    "Year": 2002,
		    "Doy": 332,
		    "SCF": 87.1233,
		    "Cloud": 99.0562,
		    "Age": 1.9314
		  },
		  {
		    "Year": 2002,
		    "Doy": 333,
		    "SCF": 87.1196,
		    "Cloud": 95.4961,
		    "Age": 2.82656
		  },
		  {
		    "Year": 2002,
		    "Doy": 334,
		    "SCF": 87.754,
		    "Cloud": 89.6353,
		    "Age": 3.44385
		  },
		  {
		    "Year": 2002,
		    "Doy": 335,
		    "SCF": 89.3801,
		    "Cloud": 99.8211,
		    "Age": 4.43532
		  },
		  {
		    "Year": 2002,
		    "Doy": 336,
		    "SCF": 89.3988,
		    "Cloud": 99.9956,
		    "Age": 5.43527
		  },
		  {
		    "Year": 2002,
		    "Doy": 337,
		    "SCF": 89.3991,
		    "Cloud": 99.6364,
		    "Age": 6.41277
		  },
		  {
		    "Year": 2002,
		    "Doy": 338,
		    "SCF": 89.3771,
		    "Cloud": 93.382,
		    "Age": 6.91612
		  },
		  {
		    "Year": 2002,
		    "Doy": 339,
		    "SCF": 90.3503,
		    "Cloud": 11.1139,
		    "Age": 7.78393
		  },
		  {
		    "Year": 2002,
		    "Doy": 340,
		    "SCF": 90.547,
		    "Cloud": 86.5298,
		    "Age": 7.54336
		  },
		  {
		    "Year": 2002,
		    "Doy": 341,
		    "SCF": 91.8325,
		    "Cloud": 93.1155,
		    "Age": 8.04189
		  },
		  {
		    "Year": 2002,
		    "Doy": 342,
		    "SCF": 92.4131,
		    "Cloud": 41.1933,
		    "Age": 3.92297
		  },
		  {
		    "Year": 2002,
		    "Doy": 343,
		    "SCF": 93.0327,
		    "Cloud": 28.128,
		    "Age": 1.58771
		  },
		  {
		    "Year": 2002,
		    "Doy": 344,
		    "SCF": 95.1401,
		    "Cloud": 9.12185,
		    "Age": 0.726985
		  },
		  {
		    "Year": 2002,
		    "Doy": 345,
		    "SCF": 95.2423,
		    "Cloud": 0,
		    "Age": 1.72698
		  },
		  {
		    "Year": 2002,
		    "Doy": 346,
		    "SCF": 95.2423,
		    "Cloud": 12.796,
		    "Age": 0.824686
		  },
		  {
		    "Year": 2002,
		    "Doy": 347,
		    "SCF": 88.3286,
		    "Cloud": 36.4194,
		    "Age": 0.875114
		  },
		  {
		    "Year": 2002,
		    "Doy": 348,
		    "SCF": 88.5772,
		    "Cloud": 61.6191,
		    "Age": 1.43684
		  },
		  {
		    "Year": 2002,
		    "Doy": 349,
		    "SCF": 86.7569,
		    "Cloud": 78.2036,
		    "Age": 1.90665
		  },
		  {
		    "Year": 2002,
		    "Doy": 350,
		    "SCF": 90.6271,
		    "Cloud": 78.1176,
		    "Age": 2.45416
		  },
		  {
		    "Year": 2002,
		    "Doy": 351,
		    "SCF": 91.777,
		    "Cloud": 62.8141,
		    "Age": 2.30752
		  },
		  {
		    "Year": 2002,
		    "Doy": 352,
		    "SCF": 94.5752,
		    "Cloud": 13.4969,
		    "Age": 0.7186
		  },
		  {
		    "Year": 2002,
		    "Doy": 353,
		    "SCF": 87.1745,
		    "Cloud": 99.7486,
		    "Age": 1.71835
		  },
		  {
		    "Year": 2002,
		    "Doy": 354,
		    "SCF": 87.1745,
		    "Cloud": 36.7026,
		    "Age": 1.12505
		  },
		  {
		    "Year": 2002,
		    "Doy": 355,
		    "SCF": 85.4476,
		    "Cloud": 24.9237,
		    "Age": 0.832651
		  },
		  {
		    "Year": 2002,
		    "Doy": 356,
		    "SCF": 83.196,
		    "Cloud": 46.5453,
		    "Age": 1.25538
		  },
		  {
		    "Year": 2002,
		    "Doy": 357,
		    "SCF": 84.2721,
		    "Cloud": 99.9782,
		    "Age": 2.255
		  },
		  {
		    "Year": 2002,
		    "Doy": 358,
		    "SCF": 84.2736,
		    "Cloud": 80.28,
		    "Age": 3.07842
		  },
		  {
		    "Year": 2002,
		    "Doy": 359,
		    "SCF": 84.7566,
		    "Cloud": 86.0748,
		    "Age": 3.48707
		  },
		  {
		    "Year": 2002,
		    "Doy": 360,
		    "SCF": 84.7497,
		    "Cloud": 72.8627,
		    "Age": 3.37432
		  },
		  {
		    "Year": 2002,
		    "Doy": 361,
		    "SCF": 82.7678,
		    "Cloud": 80.21,
		    "Age": 3.54722
		  },
		  {
		    "Year": 2002,
		    "Doy": 362,
		    "SCF": 84.6,
		    "Cloud": 100,
		    "Age": 4.54722
		  },
		  {
		    "Year": 2002,
		    "Doy": 363,
		    "SCF": 84.6,
		    "Cloud": 70.2554,
		    "Age": 3.80466
		  },
		  {
		    "Year": 2002,
		    "Doy": 364,
		    "SCF": 89.1767,
		    "Cloud": 51.3288,
		    "Age": 2.40541
		  },
		  {
		    "Year": 2002,
		    "Doy": 365,
		    "SCF": 88.1905,
		    "Cloud": 73.4161,
		    "Age": 2.43715
		  },
		  {
		    "Year": 2003,
		    "Doy": 1,
		    "SCF": 90.342,
		    "Cloud": 88.0058,
		    "Age": 0.882266
		  },
		  {
		    "Year": 2003,
		    "Doy": 2,
		    "SCF": 91.2542,
		    "Cloud": 96.9804,
		    "Age": 1.82398
		  },
		  {
		    "Year": 2003,
		    "Doy": 3,
		    "SCF": 91.6885,
		    "Cloud": 22.8221,
		    "Age": 0.631474
		  },
		  {
		    "Year": 2003,
		    "Doy": 4,
		    "SCF": 88.7301,
		    "Cloud": 67.5958,
		    "Age": 1.22118
		  },
		  {
		    "Year": 2003,
		    "Doy": 5,
		    "SCF": 87.6808,
		    "Cloud": 64.4681,
		    "Age": 1.34473
		  },
		  {
		    "Year": 2003,
		    "Doy": 6,
		    "SCF": 89.1196,
		    "Cloud": 82.6994,
		    "Age": 2.0044
		  },
		  {
		    "Year": 2003,
		    "Doy": 7,
		    "SCF": 89.1186,
		    "Cloud": 37.3807,
		    "Age": 1.23827
		  },
		  {
		    "Year": 2003,
		    "Doy": 8,
		    "SCF": 88.4364,
		    "Cloud": 20.5826,
		    "Age": 0.737318
		  },
		  {
		    "Year": 2003,
		    "Doy": 9,
		    "SCF": 87.4794,
		    "Cloud": 49.6457,
		    "Age": 1.0041
		  },
		  {
		    "Year": 2003,
		    "Doy": 10,
		    "SCF": 82.8446,
		    "Cloud": 63.8818,
		    "Age": 1.2652
		  },
		  {
		    "Year": 2003,
		    "Doy": 11,
		    "SCF": 81.9762,
		    "Cloud": 99.8256,
		    "Age": 2.25946
		  },
		  {
		    "Year": 2003,
		    "Doy": 12,
		    "SCF": 82.0135,
		    "Cloud": 99.9898,
		    "Age": 3.25946
		  },
		  {
		    "Year": 2003,
		    "Doy": 13,
		    "SCF": 82.0135,
		    "Cloud": 98.6529,
		    "Age": 4.20024
		  },
		  {
		    "Year": 2003,
		    "Doy": 14,
		    "SCF": 82.2522,
		    "Cloud": 33.0204,
		    "Age": 1.78488
		  },
		  {
		    "Year": 2003,
		    "Doy": 15,
		    "SCF": 77.7723,
		    "Cloud": 0.00436796,
		    "Age": 2.78847
		  },
		  {
		    "Year": 2003,
		    "Doy": 16,
		    "SCF": 77.7723,
		    "Cloud": 0,
		    "Age": 3.78847
		  },
		  {
		    "Year": 2003,
		    "Doy": 17,
		    "SCF": 77.7723,
		    "Cloud": 97.0312,
		    "Age": 4.54062
		  },
		  {
		    "Year": 2003,
		    "Doy": 18,
		    "SCF": 77.8966,
		    "Cloud": 38.4133,
		    "Age": 2.293
		  },
		  {
		    "Year": 2003,
		    "Doy": 19,
		    "SCF": 78.7232,
		    "Cloud": 98.9221,
		    "Age": 3.24578
		  },
		  {
		    "Year": 2003,
		    "Doy": 20,
		    "SCF": 78.9033,
		    "Cloud": 98.0555,
		    "Age": 4.17333
		  },
		  {
		    "Year": 2003,
		    "Doy": 21,
		    "SCF": 78.9634,
		    "Cloud": 80.3598,
		    "Age": 4.10444
		  },
		  {
		    "Year": 2003,
		    "Doy": 22,
		    "SCF": 79.308,
		    "Cloud": 97.1961,
		    "Age": 4.95269
		  },
		  {
		    "Year": 2003,
		    "Doy": 23,
		    "SCF": 79.7761,
		    "Cloud": 33.7082,
		    "Age": 2.12869
		  },
		  {
		    "Year": 2003,
		    "Doy": 24,
		    "SCF": 80.6678,
		    "Cloud": 96.7144,
		    "Age": 3.04497
		  },
		  {
		    "Year": 2003,
		    "Doy": 25,
		    "SCF": 81.1507,
		    "Cloud": 100,
		    "Age": 4.04497
		  },
		  {
		    "Year": 2003,
		    "Doy": 26,
		    "SCF": 81.1507,
		    "Cloud": 55.2685,
		    "Age": 2.97055
		  },
		  {
		    "Year": 2003,
		    "Doy": 27,
		    "SCF": 81.5216,
		    "Cloud": 22.5073,
		    "Age": 1.11262
		  },
		  {
		    "Year": 2003,
		    "Doy": 28,
		    "SCF": 81.7315,
		    "Cloud": 58.7817,
		    "Age": 1.08286
		  },
		  {
		    "Year": 2003,
		    "Doy": 29,
		    "SCF": 83.3167,
		    "Cloud": 82.1839,
		    "Age": 1.75191
		  },
		  {
		    "Year": 2003,
		    "Doy": 30,
		    "SCF": 85.59,
		    "Cloud": 20.4877,
		    "Age": 0.638637
		  },
		  {
		    "Year": 2003,
		    "Doy": 31,
		    "SCF": 84.1288,
		    "Cloud": 30.5897,
		    "Age": 0.605536
		  },
		  {
		    "Year": 2003,
		    "Doy": 32,
		    "SCF": 84.1288,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 33,
		    "SCF": 91.4821,
		    "Cloud": 99.2402,
		    "Age": 1.58752
		  },
		  {
		    "Year": 2003,
		    "Doy": 34,
		    "SCF": 91.6897,
		    "Cloud": 99.9884,
		    "Age": 2.58709
		  },
		  {
		    "Year": 2003,
		    "Doy": 35,
		    "SCF": 91.6908,
		    "Cloud": 96.1606,
		    "Age": 3.40803
		  },
		  {
		    "Year": 2003,
		    "Doy": 36,
		    "SCF": 91.8269,
		    "Cloud": 69.6781,
		    "Age": 3.1102
		  },
		  {
		    "Year": 2003,
		    "Doy": 37,
		    "SCF": 93.9065,
		    "Cloud": 22.1268,
		    "Age": 0.907402
		  },
		  {
		    "Year": 2003,
		    "Doy": 38,
		    "SCF": 90.1186,
		    "Cloud": 99.9433,
		    "Age": 1.90683
		  },
		  {
		    "Year": 2003,
		    "Doy": 39,
		    "SCF": 90.1205,
		    "Cloud": 99.9956,
		    "Age": 2.9064
		  },
		  {
		    "Year": 2003,
		    "Doy": 40,
		    "SCF": 90.1238,
		    "Cloud": 99.7981,
		    "Age": 3.89958
		  },
		  {
		    "Year": 2003,
		    "Doy": 41,
		    "SCF": 90.1768,
		    "Cloud": 95.5138,
		    "Age": 4.70208
		  },
		  {
		    "Year": 2003,
		    "Doy": 42,
		    "SCF": 90.8139,
		    "Cloud": 94.1888,
		    "Age": 5.41044
		  },
		  {
		    "Year": 2003,
		    "Doy": 43,
		    "SCF": 91.3023,
		    "Cloud": 55.2148,
		    "Age": 3.75153
		  },
		  {
		    "Year": 2003,
		    "Doy": 44,
		    "SCF": 93.7477,
		    "Cloud": 30.2125,
		    "Age": 2.26996
		  },
		  {
		    "Year": 2003,
		    "Doy": 45,
		    "SCF": 91.2235,
		    "Cloud": 11.9422,
		    "Age": 0.260488
		  },
		  {
		    "Year": 2003,
		    "Doy": 46,
		    "SCF": 95.0477,
		    "Cloud": 25.15,
		    "Age": 0.410838
		  },
		  {
		    "Year": 2003,
		    "Doy": 47,
		    "SCF": 91.5779,
		    "Cloud": 51.9701,
		    "Age": 0.893995
		  },
		  {
		    "Year": 2003,
		    "Doy": 48,
		    "SCF": 94.6988,
		    "Cloud": 17.0126,
		    "Age": 0.466676
		  },
		  {
		    "Year": 2003,
		    "Doy": 49,
		    "SCF": 92.2469,
		    "Cloud": 1.52477,
		    "Age": 0.0651584
		  },
		  {
		    "Year": 2003,
		    "Doy": 50,
		    "SCF": 91.1904,
		    "Cloud": 0.691438,
		    "Age": 0.0167921
		  },
		  {
		    "Year": 2003,
		    "Doy": 51,
		    "SCF": 93.784,
		    "Cloud": 0.595454,
		    "Age": 0.0149009
		  },
		  {
		    "Year": 2003,
		    "Doy": 52,
		    "SCF": 87.9037,
		    "Cloud": 17.301,
		    "Age": 0.180983
		  },
		  {
		    "Year": 2003,
		    "Doy": 53,
		    "SCF": 93.9745,
		    "Cloud": 28.4098,
		    "Age": 0.291548
		  },
		  {
		    "Year": 2003,
		    "Doy": 54,
		    "SCF": 92.5905,
		    "Cloud": 16.3912,
		    "Age": 0.323511
		  },
		  {
		    "Year": 2003,
		    "Doy": 55,
		    "SCF": 93.9617,
		    "Cloud": 29.8691,
		    "Age": 0.54086
		  },
		  {
		    "Year": 2003,
		    "Doy": 56,
		    "SCF": 92.8593,
		    "Cloud": 9.76633,
		    "Age": 0.148869
		  },
		  {
		    "Year": 2003,
		    "Doy": 57,
		    "SCF": 92.3709,
		    "Cloud": 12.0522,
		    "Age": 0.148543
		  },
		  {
		    "Year": 2003,
		    "Doy": 58,
		    "SCF": 93.5541,
		    "Cloud": 5.46495,
		    "Age": 0.08644
		  },
		  {
		    "Year": 2003,
		    "Doy": 59,
		    "SCF": 91.3178,
		    "Cloud": 1.15303,
		    "Age": 0.0174697
		  },
		  {
		    "Year": 2003,
		    "Doy": 60,
		    "SCF": 94.9971,
		    "Cloud": 28.5,
		    "Age": 0.296026
		  },
		  {
		    "Year": 2003,
		    "Doy": 61,
		    "SCF": 92.0968,
		    "Cloud": 99.0064,
		    "Age": 1.28598
		  },
		  {
		    "Year": 2003,
		    "Doy": 62,
		    "SCF": 92.1607,
		    "Cloud": 95.4229,
		    "Age": 2.18368
		  },
		  {
		    "Year": 2003,
		    "Doy": 63,
		    "SCF": 92.316,
		    "Cloud": 97.7861,
		    "Age": 3.13617
		  },
		  {
		    "Year": 2003,
		    "Doy": 64,
		    "SCF": 92.3258,
		    "Cloud": 100,
		    "Age": 4.13617
		  },
		  {
		    "Year": 2003,
		    "Doy": 65,
		    "SCF": 92.3258,
		    "Cloud": 100,
		    "Age": 5.13617
		  },
		  {
		    "Year": 2003,
		    "Doy": 66,
		    "SCF": 92.3258,
		    "Cloud": 78.1138,
		    "Age": 4.79927
		  },
		  {
		    "Year": 2003,
		    "Doy": 67,
		    "SCF": 91.7861,
		    "Cloud": 100,
		    "Age": 5.79986
		  },
		  {
		    "Year": 2003,
		    "Doy": 68,
		    "SCF": 91.7861,
		    "Cloud": 76.2335,
		    "Age": 5.50631
		  },
		  {
		    "Year": 2003,
		    "Doy": 69,
		    "SCF": 93.2565,
		    "Cloud": 80.9755,
		    "Age": 5.39545
		  },
		  {
		    "Year": 2003,
		    "Doy": 70,
		    "SCF": 93.6214,
		    "Cloud": 70.3845,
		    "Age": 4.18994
		  },
		  {
		    "Year": 2003,
		    "Doy": 71,
		    "SCF": 96.3743,
		    "Cloud": 4.13699,
		    "Age": 0.373056
		  },
		  {
		    "Year": 2003,
		    "Doy": 72,
		    "SCF": 95.2132,
		    "Cloud": 3.01054,
		    "Age": 0.135641
		  },
		  {
		    "Year": 2003,
		    "Doy": 73,
		    "SCF": 93.4547,
		    "Cloud": 37.3497,
		    "Age": 0.388574
		  },
		  {
		    "Year": 2003,
		    "Doy": 74,
		    "SCF": 91.7184,
		    "Cloud": 100,
		    "Age": 1.38847
		  },
		  {
		    "Year": 2003,
		    "Doy": 75,
		    "SCF": 91.7184,
		    "Cloud": 96.7849,
		    "Age": 2.32405
		  },
		  {
		    "Year": 2003,
		    "Doy": 76,
		    "SCF": 91.7233,
		    "Cloud": 99.9956,
		    "Age": 3.32405
		  },
		  {
		    "Year": 2003,
		    "Doy": 77,
		    "SCF": 91.7233,
		    "Cloud": 30.2252,
		    "Age": 1.28441
		  },
		  {
		    "Year": 2003,
		    "Doy": 78,
		    "SCF": 96.7201,
		    "Cloud": 1.13721,
		    "Age": 0.0354814
		  },
		  {
		    "Year": 2003,
		    "Doy": 79,
		    "SCF": 93.8655,
		    "Cloud": 99.0058,
		    "Age": 1.02576
		  },
		  {
		    "Year": 2003,
		    "Doy": 80,
		    "SCF": 93.8603,
		    "Cloud": 72.1821,
		    "Age": 1.47402
		  },
		  {
		    "Year": 2003,
		    "Doy": 81,
		    "SCF": 94.269,
		    "Cloud": 99.9259,
		    "Age": 2.47184
		  },
		  {
		    "Year": 2003,
		    "Doy": 82,
		    "SCF": 94.2817,
		    "Cloud": 62.6851,
		    "Age": 2.23216
		  },
		  {
		    "Year": 2003,
		    "Doy": 83,
		    "SCF": 94.9363,
		    "Cloud": 2.70632,
		    "Age": 0.0906078
		  },
		  {
		    "Year": 2003,
		    "Doy": 84,
		    "SCF": 89.3174,
		    "Cloud": 2.80587,
		    "Age": 0.0516565
		  },
		  {
		    "Year": 2003,
		    "Doy": 85,
		    "SCF": 93.8712,
		    "Cloud": 22.7431,
		    "Age": 0.270586
		  },
		  {
		    "Year": 2003,
		    "Doy": 86,
		    "SCF": 90.3976,
		    "Cloud": 76.2479,
		    "Age": 0.98072
		  },
		  {
		    "Year": 2003,
		    "Doy": 87,
		    "SCF": 91.1776,
		    "Cloud": 18.484,
		    "Age": 0.427552
		  },
		  {
		    "Year": 2003,
		    "Doy": 88,
		    "SCF": 84.4015,
		    "Cloud": 99.9068,
		    "Age": 1.42672
		  },
		  {
		    "Year": 2003,
		    "Doy": 89,
		    "SCF": 84.4128,
		    "Cloud": 67.7109,
		    "Age": 1.74002
		  },
		  {
		    "Year": 2003,
		    "Doy": 90,
		    "SCF": 86.5178,
		    "Cloud": 22.2977,
		    "Age": 0.841568
		  },
		  {
		    "Year": 2003,
		    "Doy": 91,
		    "SCF": 81.7833,
		    "Cloud": 99.8428,
		    "Age": 1.84097
		  },
		  {
		    "Year": 2003,
		    "Doy": 92,
		    "SCF": 81.762,
		    "Cloud": 84.0723,
		    "Age": 2.32046
		  },
		  {
		    "Year": 2003,
		    "Doy": 93,
		    "SCF": 81.5925,
		    "Cloud": 20.5289,
		    "Age": 0.783838
		  },
		  {
		    "Year": 2003,
		    "Doy": 94,
		    "SCF": 86.8178,
		    "Cloud": 13.5713,
		    "Age": 0.418589
		  },
		  {
		    "Year": 2003,
		    "Doy": 95,
		    "SCF": 83.3988,
		    "Cloud": 42.0505,
		    "Age": 0.622991
		  },
		  {
		    "Year": 2003,
		    "Doy": 96,
		    "SCF": 84.0218,
		    "Cloud": 60.0224,
		    "Age": 0.947033
		  },
		  {
		    "Year": 2003,
		    "Doy": 97,
		    "SCF": 85.2294,
		    "Cloud": 18.188,
		    "Age": 0.25898
		  },
		  {
		    "Year": 2003,
		    "Doy": 98,
		    "SCF": 82.0246,
		    "Cloud": 1.61702,
		    "Age": 0.0361425
		  },
		  {
		    "Year": 2003,
		    "Doy": 99,
		    "SCF": 84.7047,
		    "Cloud": 4.84644,
		    "Age": 0.0665657
		  },
		  {
		    "Year": 2003,
		    "Doy": 100,
		    "SCF": 80.3168,
		    "Cloud": 19.0059,
		    "Age": 0.213282
		  },
		  {
		    "Year": 2003,
		    "Doy": 101,
		    "SCF": 87.8556,
		    "Cloud": 99.6404,
		    "Age": 1.20921
		  },
		  {
		    "Year": 2003,
		    "Doy": 102,
		    "SCF": 87.8516,
		    "Cloud": 100,
		    "Age": 2.20921
		  },
		  {
		    "Year": 2003,
		    "Doy": 103,
		    "SCF": 87.8516,
		    "Cloud": 17.9481,
		    "Age": 0.581012
		  },
		  {
		    "Year": 2003,
		    "Doy": 104,
		    "SCF": 79.5941,
		    "Cloud": 69.669,
		    "Age": 1.04947
		  },
		  {
		    "Year": 2003,
		    "Doy": 105,
		    "SCF": 78.1342,
		    "Cloud": 99.9913,
		    "Age": 2.04994
		  },
		  {
		    "Year": 2003,
		    "Doy": 106,
		    "SCF": 78.1345,
		    "Cloud": 1.70585,
		    "Age": 0.0657431
		  },
		  {
		    "Year": 2003,
		    "Doy": 107,
		    "SCF": 73.6132,
		    "Cloud": 5.4538,
		    "Age": 0.089567
		  },
		  {
		    "Year": 2003,
		    "Doy": 108,
		    "SCF": 75.4926,
		    "Cloud": 2.46309,
		    "Age": 0.0505735
		  },
		  {
		    "Year": 2003,
		    "Doy": 109,
		    "SCF": 68.5806,
		    "Cloud": 2.85306,
		    "Age": 0.049761
		  },
		  {
		    "Year": 2003,
		    "Doy": 110,
		    "SCF": 71.213,
		    "Cloud": 1.84259,
		    "Age": 0.0361376
		  },
		  {
		    "Year": 2003,
		    "Doy": 111,
		    "SCF": 66.9268,
		    "Cloud": 2.22488,
		    "Age": 0.033344
		  },
		  {
		    "Year": 2003,
		    "Doy": 112,
		    "SCF": 64.2527,
		    "Cloud": 4.28961,
		    "Age": 0.0622511
		  },
		  {
		    "Year": 2003,
		    "Doy": 113,
		    "SCF": 63.7323,
		    "Cloud": 9.46979,
		    "Age": 0.118274
		  },
		  {
		    "Year": 2003,
		    "Doy": 114,
		    "SCF": 57.8246,
		    "Cloud": 98.1769,
		    "Age": 1.10009
		  },
		  {
		    "Year": 2003,
		    "Doy": 115,
		    "SCF": 57.821,
		    "Cloud": 63.5327,
		    "Age": 1.36225
		  },
		  {
		    "Year": 2003,
		    "Doy": 116,
		    "SCF": 57.7941,
		    "Cloud": 100,
		    "Age": 2.36165
		  },
		  {
		    "Year": 2003,
		    "Doy": 117,
		    "SCF": 57.7941,
		    "Cloud": 99.9912,
		    "Age": 3.36165
		  },
		  {
		    "Year": 2003,
		    "Doy": 118,
		    "SCF": 57.7941,
		    "Cloud": 97.8539,
		    "Age": 4.29448
		  },
		  {
		    "Year": 2003,
		    "Doy": 119,
		    "SCF": 57.6153,
		    "Cloud": 99.8511,
		    "Age": 5.29253
		  },
		  {
		    "Year": 2003,
		    "Doy": 120,
		    "SCF": 57.5708,
		    "Cloud": 83.0042,
		    "Age": 5.20283
		  },
		  {
		    "Year": 2003,
		    "Doy": 121,
		    "SCF": 56.3614,
		    "Cloud": 99.9547,
		    "Age": 6.20339
		  },
		  {
		    "Year": 2003,
		    "Doy": 122,
		    "SCF": 56.3615,
		    "Cloud": 37.1921,
		    "Age": 2.77172
		  },
		  {
		    "Year": 2003,
		    "Doy": 123,
		    "SCF": 52.9097,
		    "Cloud": 99.9898,
		    "Age": 3.77105
		  },
		  {
		    "Year": 2003,
		    "Doy": 124,
		    "SCF": 52.8981,
		    "Cloud": 99.981,
		    "Age": 4.77038
		  },
		  {
		    "Year": 2003,
		    "Doy": 125,
		    "SCF": 52.8884,
		    "Cloud": 100,
		    "Age": 5.77038
		  },
		  {
		    "Year": 2003,
		    "Doy": 126,
		    "SCF": 52.8884,
		    "Cloud": 77.9703,
		    "Age": 5.14737
		  },
		  {
		    "Year": 2003,
		    "Doy": 127,
		    "SCF": 51.2991,
		    "Cloud": 81.8827,
		    "Age": 4.88086
		  },
		  {
		    "Year": 2003,
		    "Doy": 128,
		    "SCF": 50.3258,
		    "Cloud": 98.1878,
		    "Age": 5.87575
		  },
		  {
		    "Year": 2003,
		    "Doy": 129,
		    "SCF": 50.3328,
		    "Cloud": 46.4845,
		    "Age": 3.49092
		  },
		  {
		    "Year": 2003,
		    "Doy": 130,
		    "SCF": 46.8633,
		    "Cloud": 79.305,
		    "Age": 3.98349
		  },
		  {
		    "Year": 2003,
		    "Doy": 131,
		    "SCF": 46.5527,
		    "Cloud": 34.7861,
		    "Age": 2.17403
		  },
		  {
		    "Year": 2003,
		    "Doy": 132,
		    "SCF": 35.12,
		    "Cloud": 99.8263,
		    "Age": 3.17122
		  },
		  {
		    "Year": 2003,
		    "Doy": 133,
		    "SCF": 35.1165,
		    "Cloud": 91.3229,
		    "Age": 3.93378
		  },
		  {
		    "Year": 2003,
		    "Doy": 134,
		    "SCF": 33.3171,
		    "Cloud": 89.1599,
		    "Age": 4.54306
		  },
		  {
		    "Year": 2003,
		    "Doy": 135,
		    "SCF": 31.5577,
		    "Cloud": 99.6979,
		    "Age": 5.52543
		  },
		  {
		    "Year": 2003,
		    "Doy": 136,
		    "SCF": 31.5107,
		    "Cloud": 68.867,
		    "Age": 3.73331
		  },
		  {
		    "Year": 2003,
		    "Doy": 137,
		    "SCF": 25.5815,
		    "Cloud": 90.5756,
		    "Age": 4.29486
		  },
		  {
		    "Year": 2003,
		    "Doy": 138,
		    "SCF": 25.3379,
		    "Cloud": 99.1213,
		    "Age": 5.27257
		  },
		  {
		    "Year": 2003,
		    "Doy": 139,
		    "SCF": 25.3395,
		    "Cloud": 92.9891,
		    "Age": 5.85736
		  },
		  {
		    "Year": 2003,
		    "Doy": 140,
		    "SCF": 24.9441,
		    "Cloud": 97.0775,
		    "Age": 6.69359
		  },
		  {
		    "Year": 2003,
		    "Doy": 141,
		    "SCF": 24.6697,
		    "Cloud": 99.3167,
		    "Age": 7.63789
		  },
		  {
		    "Year": 2003,
		    "Doy": 142,
		    "SCF": 24.5274,
		    "Cloud": 66.0194,
		    "Age": 5.73763
		  },
		  {
		    "Year": 2003,
		    "Doy": 143,
		    "SCF": 20.3392,
		    "Cloud": 100,
		    "Age": 6.73516
		  },
		  {
		    "Year": 2003,
		    "Doy": 144,
		    "SCF": 20.3392,
		    "Cloud": 85.5877,
		    "Age": 6.75142
		  },
		  {
		    "Year": 2003,
		    "Doy": 145,
		    "SCF": 19.7612,
		    "Cloud": 99.7096,
		    "Age": 7.7297
		  },
		  {
		    "Year": 2003,
		    "Doy": 146,
		    "SCF": 19.5812,
		    "Cloud": 49.5907,
		    "Age": 4.65818
		  },
		  {
		    "Year": 2003,
		    "Doy": 147,
		    "SCF": 16.9875,
		    "Cloud": 79.6413,
		    "Age": 4.87729
		  },
		  {
		    "Year": 2003,
		    "Doy": 148,
		    "SCF": 15.9923,
		    "Cloud": 15.1138,
		    "Age": 1.15425
		  },
		  {
		    "Year": 2003,
		    "Doy": 149,
		    "SCF": 13.8912,
		    "Cloud": 97.953,
		    "Age": 2.1312
		  },
		  {
		    "Year": 2003,
		    "Doy": 150,
		    "SCF": 13.8669,
		    "Cloud": 29.1926,
		    "Age": 1.27445
		  },
		  {
		    "Year": 2003,
		    "Doy": 151,
		    "SCF": 12.4536,
		    "Cloud": 6.57722,
		    "Age": 0.372797
		  },
		  {
		    "Year": 2003,
		    "Doy": 152,
		    "SCF": 10.2546,
		    "Cloud": 7.56424,
		    "Age": 0.215848
		  },
		  {
		    "Year": 2003,
		    "Doy": 153,
		    "SCF": 8.36117,
		    "Cloud": 8.2677,
		    "Age": 0.174984
		  },
		  {
		    "Year": 2003,
		    "Doy": 154,
		    "SCF": 5.97345,
		    "Cloud": 84.4756,
		    "Age": 1.01784
		  },
		  {
		    "Year": 2003,
		    "Doy": 155,
		    "SCF": 5.94083,
		    "Cloud": 49.248,
		    "Age": 1.00126
		  },
		  {
		    "Year": 2003,
		    "Doy": 156,
		    "SCF": 4.30988,
		    "Cloud": 54.0009,
		    "Age": 1.20784
		  },
		  {
		    "Year": 2003,
		    "Doy": 157,
		    "SCF": 4.49086,
		    "Cloud": 54.4959,
		    "Age": 1.32972
		  },
		  {
		    "Year": 2003,
		    "Doy": 158,
		    "SCF": 4.85866,
		    "Cloud": 51.3825,
		    "Age": 1.3015
		  },
		  {
		    "Year": 2003,
		    "Doy": 159,
		    "SCF": 4.18745,
		    "Cloud": 90.6197,
		    "Age": 2.16063
		  },
		  {
		    "Year": 2003,
		    "Doy": 160,
		    "SCF": 3.45023,
		    "Cloud": 99.5081,
		    "Age": 3.14546
		  },
		  {
		    "Year": 2003,
		    "Doy": 161,
		    "SCF": 3.40894,
		    "Cloud": 80.641,
		    "Age": 3.40007
		  },
		  {
		    "Year": 2003,
		    "Doy": 162,
		    "SCF": 3.10656,
		    "Cloud": 92.905,
		    "Age": 4.10191
		  },
		  {
		    "Year": 2003,
		    "Doy": 163,
		    "SCF": 3.15688,
		    "Cloud": 91.729,
		    "Age": 4.76331
		  },
		  {
		    "Year": 2003,
		    "Doy": 164,
		    "SCF": 2.85045,
		    "Cloud": 63.1327,
		    "Age": 3.76438
		  },
		  {
		    "Year": 2003,
		    "Doy": 165,
		    "SCF": 2.56094,
		    "Cloud": 58.13,
		    "Age": 3.11151
		  },
		  {
		    "Year": 2003,
		    "Doy": 166,
		    "SCF": 2.57265,
		    "Cloud": 89.5606,
		    "Age": 3.84187
		  },
		  {
		    "Year": 2003,
		    "Doy": 167,
		    "SCF": 2.24615,
		    "Cloud": 48.5372,
		    "Age": 2.50805
		  },
		  {
		    "Year": 2003,
		    "Doy": 168,
		    "SCF": 1.66099,
		    "Cloud": 91.9935,
		    "Age": 3.21279
		  },
		  {
		    "Year": 2003,
		    "Doy": 169,
		    "SCF": 1.67878,
		    "Cloud": 83.7518,
		    "Age": 3.44693
		  },
		  {
		    "Year": 2003,
		    "Doy": 170,
		    "SCF": 1.84249,
		    "Cloud": 58.8826,
		    "Age": 2.73902
		  },
		  {
		    "Year": 2003,
		    "Doy": 171,
		    "SCF": 1.3817,
		    "Cloud": 55.0764,
		    "Age": 2.35722
		  },
		  {
		    "Year": 2003,
		    "Doy": 172,
		    "SCF": 1.77682,
		    "Cloud": 85.8664,
		    "Age": 2.88754
		  },
		  {
		    "Year": 2003,
		    "Doy": 173,
		    "SCF": 1.73593,
		    "Cloud": 69.4666,
		    "Age": 2.89315
		  },
		  {
		    "Year": 2003,
		    "Doy": 174,
		    "SCF": 0.836157,
		    "Cloud": 99.734,
		    "Age": 3.89355
		  },
		  {
		    "Year": 2003,
		    "Doy": 175,
		    "SCF": 0.836157,
		    "Cloud": 100,
		    "Age": 4.89355
		  },
		  {
		    "Year": 2003,
		    "Doy": 176,
		    "SCF": 0.836157,
		    "Cloud": 87.0767,
		    "Age": 5.2176
		  },
		  {
		    "Year": 2003,
		    "Doy": 177,
		    "SCF": 0.779423,
		    "Cloud": 68.2251,
		    "Age": 4.62141
		  },
		  {
		    "Year": 2003,
		    "Doy": 178,
		    "SCF": 0.707326,
		    "Cloud": 36.878,
		    "Age": 2.38827
		  },
		  {
		    "Year": 2003,
		    "Doy": 179,
		    "SCF": 0.989383,
		    "Cloud": 59.5251,
		    "Age": 2.04574
		  },
		  {
		    "Year": 2003,
		    "Doy": 180,
		    "SCF": 1.3747,
		    "Cloud": 91.6691,
		    "Age": 2.83643
		  },
		  {
		    "Year": 2003,
		    "Doy": 181,
		    "SCF": 1.36326,
		    "Cloud": 95.4278,
		    "Age": 3.71221
		  },
		  {
		    "Year": 2003,
		    "Doy": 182,
		    "SCF": 1.10017,
		    "Cloud": 99.385,
		    "Age": 4.6851
		  },
		  {
		    "Year": 2003,
		    "Doy": 183,
		    "SCF": 1.06381,
		    "Cloud": 99.9124,
		    "Age": 5.68467
		  },
		  {
		    "Year": 2003,
		    "Doy": 184,
		    "SCF": 1.06341,
		    "Cloud": 87.7352,
		    "Age": 5.90147
		  },
		  {
		    "Year": 2003,
		    "Doy": 185,
		    "SCF": 1.00129,
		    "Cloud": 59.4045,
		    "Age": 4.17297
		  },
		  {
		    "Year": 2003,
		    "Doy": 186,
		    "SCF": 1.05589,
		    "Cloud": 21.6745,
		    "Age": 1.28676
		  },
		  {
		    "Year": 2003,
		    "Doy": 187,
		    "SCF": 0.563995,
		    "Cloud": 20.8697,
		    "Age": 0.536431
		  },
		  {
		    "Year": 2003,
		    "Doy": 188,
		    "SCF": 1.50384,
		    "Cloud": 92.596,
		    "Age": 1.46107
		  },
		  {
		    "Year": 2003,
		    "Doy": 189,
		    "SCF": 1.50408,
		    "Cloud": 91.6938,
		    "Age": 2.28037
		  },
		  {
		    "Year": 2003,
		    "Doy": 190,
		    "SCF": 1.38032,
		    "Cloud": 52.7813,
		    "Age": 1.76498
		  },
		  {
		    "Year": 2003,
		    "Doy": 191,
		    "SCF": 0.282184,
		    "Cloud": 27.3962,
		    "Age": 0.657982
		  },
		  {
		    "Year": 2003,
		    "Doy": 192,
		    "SCF": 0.348581,
		    "Cloud": 97.045,
		    "Age": 1.59739
		  },
		  {
		    "Year": 2003,
		    "Doy": 193,
		    "SCF": 0.333353,
		    "Cloud": 69.8065,
		    "Age": 1.80927
		  },
		  {
		    "Year": 2003,
		    "Doy": 194,
		    "SCF": 0.192603,
		    "Cloud": 0.403479,
		    "Age": 0.0331116
		  },
		  {
		    "Year": 2003,
		    "Doy": 195,
		    "SCF": 0.185965,
		    "Cloud": 1.46818,
		    "Age": 0.0157347
		  },
		  {
		    "Year": 2003,
		    "Doy": 196,
		    "SCF": 0.257851,
		    "Cloud": 16.6433,
		    "Age": 0.175365
		  },
		  {
		    "Year": 2003,
		    "Doy": 197,
		    "SCF": 0.550422,
		    "Cloud": 44.8191,
		    "Age": 0.532038
		  },
		  {
		    "Year": 2003,
		    "Doy": 198,
		    "SCF": 1.05371,
		    "Cloud": 67.6672,
		    "Age": 1.02479
		  },
		  {
		    "Year": 2003,
		    "Doy": 199,
		    "SCF": 0.617459,
		    "Cloud": 48.6824,
		    "Age": 1.01147
		  },
		  {
		    "Year": 2003,
		    "Doy": 200,
		    "SCF": 0.633771,
		    "Cloud": 72.2805,
		    "Age": 1.4744
		  },
		  {
		    "Year": 2003,
		    "Doy": 201,
		    "SCF": 0.278438,
		    "Cloud": 15.5305,
		    "Age": 0.410586
		  },
		  {
		    "Year": 2003,
		    "Doy": 202,
		    "SCF": 0.462524,
		    "Cloud": 99.7122,
		    "Age": 1.41042
		  },
		  {
		    "Year": 2003,
		    "Doy": 203,
		    "SCF": 0.458258,
		    "Cloud": 57.5544,
		    "Age": 1.3915
		  },
		  {
		    "Year": 2003,
		    "Doy": 204,
		    "SCF": 0.502505,
		    "Cloud": 68.5752,
		    "Age": 1.68391
		  },
		  {
		    "Year": 2003,
		    "Doy": 205,
		    "SCF": 0.427194,
		    "Cloud": 68.058,
		    "Age": 1.98719
		  },
		  {
		    "Year": 2003,
		    "Doy": 206,
		    "SCF": 0.554419,
		    "Cloud": 99.9313,
		    "Age": 2.98699
		  },
		  {
		    "Year": 2003,
		    "Doy": 207,
		    "SCF": 0.513018,
		    "Cloud": 99.9532,
		    "Age": 3.98528
		  },
		  {
		    "Year": 2003,
		    "Doy": 208,
		    "SCF": 0.479322,
		    "Cloud": 68.3883,
		    "Age": 3.49526
		  },
		  {
		    "Year": 2003,
		    "Doy": 209,
		    "SCF": 0.621598,
		    "Cloud": 61.7478,
		    "Age": 2.98916
		  },
		  {
		    "Year": 2003,
		    "Doy": 210,
		    "SCF": 0.822759,
		    "Cloud": 21.7105,
		    "Age": 0.94603
		  },
		  {
		    "Year": 2003,
		    "Doy": 211,
		    "SCF": 0.243137,
		    "Cloud": 22.2456,
		    "Age": 0.273134
		  },
		  {
		    "Year": 2003,
		    "Doy": 212,
		    "SCF": 0.261255,
		    "Cloud": 34.448,
		    "Age": 0.520404
		  },
		  {
		    "Year": 2003,
		    "Doy": 213,
		    "SCF": 0.315609,
		    "Cloud": 96.8385,
		    "Age": 1.48121
		  },
		  {
		    "Year": 2003,
		    "Doy": 214,
		    "SCF": 0.2287,
		    "Cloud": 17.4518,
		    "Age": 0.417192
		  },
		  {
		    "Year": 2003,
		    "Doy": 215,
		    "SCF": 0.246384,
		    "Cloud": 36.8116,
		    "Age": 0.499883
		  },
		  {
		    "Year": 2003,
		    "Doy": 216,
		    "SCF": 0.34466,
		    "Cloud": 41.9327,
		    "Age": 0.67092
		  },
		  {
		    "Year": 2003,
		    "Doy": 217,
		    "SCF": 0.347902,
		    "Cloud": 27.1367,
		    "Age": 0.40007
		  },
		  {
		    "Year": 2003,
		    "Doy": 218,
		    "SCF": 0.228828,
		    "Cloud": 27.9419,
		    "Age": 0.428968
		  },
		  {
		    "Year": 2003,
		    "Doy": 219,
		    "SCF": 0.354059,
		    "Cloud": 28.1319,
		    "Age": 0.424053
		  },
		  {
		    "Year": 2003,
		    "Doy": 220,
		    "SCF": 0.186212,
		    "Cloud": 4.52145,
		    "Age": 0.0692334
		  },
		  {
		    "Year": 2003,
		    "Doy": 221,
		    "SCF": 0.181339,
		    "Cloud": 0.03945,
		    "Age": 0.000540612
		  },
		  {
		    "Year": 2003,
		    "Doy": 222,
		    "SCF": 0.200663,
		    "Cloud": 0.597709,
		    "Age": 0.00618168
		  },
		  {
		    "Year": 2003,
		    "Doy": 223,
		    "SCF": 1.53464,
		    "Cloud": 99.6652,
		    "Age": 1.00284
		  },
		  {
		    "Year": 2003,
		    "Doy": 224,
		    "SCF": 1.34631,
		    "Cloud": 29.1134,
		    "Age": 0.582868
		  },
		  {
		    "Year": 2003,
		    "Doy": 225,
		    "SCF": 4.05249,
		    "Cloud": 99.838,
		    "Age": 1.58002
		  },
		  {
		    "Year": 2003,
		    "Doy": 226,
		    "SCF": 3.89937,
		    "Cloud": 99.9898,
		    "Age": 2.57979
		  },
		  {
		    "Year": 2003,
		    "Doy": 227,
		    "SCF": 3.89559,
		    "Cloud": 92.8931,
		    "Age": 3.36091
		  },
		  {
		    "Year": 2003,
		    "Doy": 228,
		    "SCF": 3.07815,
		    "Cloud": 75.4557,
		    "Age": 3.32497
		  },
		  {
		    "Year": 2003,
		    "Doy": 229,
		    "SCF": 3.27678,
		    "Cloud": 46.447,
		    "Age": 2.14609
		  },
		  {
		    "Year": 2003,
		    "Doy": 230,
		    "SCF": 3.79657,
		    "Cloud": 85.4826,
		    "Age": 2.72143
		  },
		  {
		    "Year": 2003,
		    "Doy": 231,
		    "SCF": 4.37749,
		    "Cloud": 93.5204,
		    "Age": 3.50913
		  },
		  {
		    "Year": 2003,
		    "Doy": 232,
		    "SCF": 4.22925,
		    "Cloud": 67.4708,
		    "Age": 3.12586
		  },
		  {
		    "Year": 2003,
		    "Doy": 233,
		    "SCF": 7.90085,
		    "Cloud": 90.3682,
		    "Age": 3.80281
		  },
		  {
		    "Year": 2003,
		    "Doy": 234,
		    "SCF": 0.834175,
		    "Cloud": 98.248,
		    "Age": 4.73135
		  },
		  {
		    "Year": 2003,
		    "Doy": 235,
		    "SCF": 0.802867,
		    "Cloud": 76.0979,
		    "Age": 4.43782
		  },
		  {
		    "Year": 2003,
		    "Doy": 236,
		    "SCF": 0.579042,
		    "Cloud": 33.3971,
		    "Age": 1.94436
		  },
		  {
		    "Year": 2003,
		    "Doy": 237,
		    "SCF": 0.898552,
		    "Cloud": 91.9606,
		    "Age": 2.78281
		  },
		  {
		    "Year": 2003,
		    "Doy": 238,
		    "SCF": 0.868472,
		    "Cloud": 96.2466,
		    "Age": 3.62837
		  },
		  {
		    "Year": 2003,
		    "Doy": 239,
		    "SCF": 0.639678,
		    "Cloud": 46.831,
		    "Age": 2.21403
		  },
		  {
		    "Year": 2003,
		    "Doy": 240,
		    "SCF": 0.840741,
		    "Cloud": 32.0679,
		    "Age": 1.11988
		  },
		  {
		    "Year": 2003,
		    "Doy": 241,
		    "SCF": 1.55914,
		    "Cloud": 38.0583,
		    "Age": 0.846717
		  },
		  {
		    "Year": 2003,
		    "Doy": 242,
		    "SCF": 2.72824,
		    "Cloud": 73.9957,
		    "Age": 1.29139
		  },
		  {
		    "Year": 2003,
		    "Doy": 243,
		    "SCF": 3.25824,
		    "Cloud": 45.8958,
		    "Age": 1.04416
		  },
		  {
		    "Year": 2003,
		    "Doy": 244,
		    "SCF": 2.09976,
		    "Cloud": 17.4666,
		    "Age": 0.385135
		  },
		  {
		    "Year": 2003,
		    "Doy": 245,
		    "SCF": 0.54564,
		    "Cloud": 80.91,
		    "Age": 1.12532
		  },
		  {
		    "Year": 2003,
		    "Doy": 246,
		    "SCF": 0.507295,
		    "Cloud": 89.4346,
		    "Age": 1.88452
		  },
		  {
		    "Year": 2003,
		    "Doy": 247,
		    "SCF": 0.257955,
		    "Cloud": 54.7217,
		    "Age": 1.64524
		  },
		  {
		    "Year": 2003,
		    "Doy": 248,
		    "SCF": 0.221365,
		    "Cloud": 0.201586,
		    "Age": 0.0131908
		  },
		  {
		    "Year": 2003,
		    "Doy": 249,
		    "SCF": 0.832501,
		    "Cloud": 94.6016,
		    "Age": 0.957957
		  },
		  {
		    "Year": 2003,
		    "Doy": 250,
		    "SCF": 0.721539,
		    "Cloud": 99.9942,
		    "Age": 1.9582
		  },
		  {
		    "Year": 2003,
		    "Doy": 251,
		    "SCF": 0.717668,
		    "Cloud": 99.2638,
		    "Age": 2.93656
		  },
		  {
		    "Year": 2003,
		    "Doy": 252,
		    "SCF": 0.610402,
		    "Cloud": 95.401,
		    "Age": 3.76266
		  },
		  {
		    "Year": 2003,
		    "Doy": 253,
		    "SCF": 0.585593,
		    "Cloud": 21.3069,
		    "Age": 0.982674
		  },
		  {
		    "Year": 2003,
		    "Doy": 254,
		    "SCF": 1.05785,
		    "Cloud": 96.4643,
		    "Age": 1.94202
		  },
		  {
		    "Year": 2003,
		    "Doy": 255,
		    "SCF": 1.04751,
		    "Cloud": 96.1614,
		    "Age": 2.86485
		  },
		  {
		    "Year": 2003,
		    "Doy": 256,
		    "SCF": 0.884697,
		    "Cloud": 59.8931,
		    "Age": 2.47116
		  },
		  {
		    "Year": 2003,
		    "Doy": 257,
		    "SCF": 0.932998,
		    "Cloud": 97.9308,
		    "Age": 3.41031
		  },
		  {
		    "Year": 2003,
		    "Doy": 258,
		    "SCF": 0.764791,
		    "Cloud": 29.975,
		    "Age": 1.47986
		  },
		  {
		    "Year": 2003,
		    "Doy": 259,
		    "SCF": 0.83232,
		    "Cloud": 11.4165,
		    "Age": 0.576758
		  },
		  {
		    "Year": 2003,
		    "Doy": 260,
		    "SCF": 3.35898,
		    "Cloud": 96.1159,
		    "Age": 1.52283
		  },
		  {
		    "Year": 2003,
		    "Doy": 261,
		    "SCF": 2.42851,
		    "Cloud": 88.5658,
		    "Age": 2.23418
		  },
		  {
		    "Year": 2003,
		    "Doy": 262,
		    "SCF": 2.12552,
		    "Cloud": 88.2754,
		    "Age": 2.89844
		  },
		  {
		    "Year": 2003,
		    "Doy": 263,
		    "SCF": 1.96387,
		    "Cloud": 25.0175,
		    "Age": 0.869468
		  },
		  {
		    "Year": 2003,
		    "Doy": 264,
		    "SCF": 7.26799,
		    "Cloud": 36.355,
		    "Age": 0.71687
		  },
		  {
		    "Year": 2003,
		    "Doy": 265,
		    "SCF": 14.0411,
		    "Cloud": 97.8394,
		    "Age": 1.66096
		  },
		  {
		    "Year": 2003,
		    "Doy": 266,
		    "SCF": 13.8951,
		    "Cloud": 89.1337,
		    "Age": 2.24462
		  },
		  {
		    "Year": 2003,
		    "Doy": 267,
		    "SCF": 9.96305,
		    "Cloud": 44.323,
		    "Age": 1.44849
		  },
		  {
		    "Year": 2003,
		    "Doy": 268,
		    "SCF": 4.17583,
		    "Cloud": 86.5124,
		    "Age": 2.21584
		  },
		  {
		    "Year": 2003,
		    "Doy": 269,
		    "SCF": 3.56311,
		    "Cloud": 99.8801,
		    "Age": 3.21116
		  },
		  {
		    "Year": 2003,
		    "Doy": 270,
		    "SCF": 3.48219,
		    "Cloud": 5.27285,
		    "Age": 0.29364
		  },
		  {
		    "Year": 2003,
		    "Doy": 271,
		    "SCF": 5.15344,
		    "Cloud": 23.2451,
		    "Age": 0.423352
		  },
		  {
		    "Year": 2003,
		    "Doy": 272,
		    "SCF": 6.25326,
		    "Cloud": 48.4119,
		    "Age": 0.860074
		  },
		  {
		    "Year": 2003,
		    "Doy": 273,
		    "SCF": 6.79647,
		    "Cloud": 97.8625,
		    "Age": 1.76389
		  },
		  {
		    "Year": 2003,
		    "Doy": 274,
		    "SCF": 6.23882,
		    "Cloud": 85.392,
		    "Age": 2.44863
		  },
		  {
		    "Year": 2003,
		    "Doy": 275,
		    "SCF": 5.85927,
		    "Cloud": 9.34861,
		    "Age": 0.481019
		  },
		  {
		    "Year": 2003,
		    "Doy": 276,
		    "SCF": 8.97923,
		    "Cloud": 60.1756,
		    "Age": 0.956374
		  },
		  {
		    "Year": 2003,
		    "Doy": 277,
		    "SCF": 9.17694,
		    "Cloud": 20.1406,
		    "Age": 0.605313
		  },
		  {
		    "Year": 2003,
		    "Doy": 278,
		    "SCF": 12.9,
		    "Cloud": 45.3732,
		    "Age": 0.949314
		  },
		  {
		    "Year": 2003,
		    "Doy": 279,
		    "SCF": 16.4971,
		    "Cloud": 37.3992,
		    "Age": 0.927889
		  },
		  {
		    "Year": 2003,
		    "Doy": 280,
		    "SCF": 32.4173,
		    "Cloud": 99.9606,
		    "Age": 1.92666
		  },
		  {
		    "Year": 2003,
		    "Doy": 281,
		    "SCF": 32.4,
		    "Cloud": 99.9269,
		    "Age": 2.92496
		  },
		  {
		    "Year": 2003,
		    "Doy": 282,
		    "SCF": 32.3727,
		    "Cloud": 49.1497,
		    "Age": 2.14595
		  },
		  {
		    "Year": 2003,
		    "Doy": 283,
		    "SCF": 33.2196,
		    "Cloud": 81.5258,
		    "Age": 2.81955
		  },
		  {
		    "Year": 2003,
		    "Doy": 284,
		    "SCF": 30.6676,
		    "Cloud": 27.6755,
		    "Age": 1.2943
		  },
		  {
		    "Year": 2003,
		    "Doy": 285,
		    "SCF": 27.6369,
		    "Cloud": 12.3783,
		    "Age": 0.628956
		  },
		  {
		    "Year": 2003,
		    "Doy": 286,
		    "SCF": 25.7518,
		    "Cloud": 2.10182,
		    "Age": 0.0837803
		  },
		  {
		    "Year": 2003,
		    "Doy": 287,
		    "SCF": 25.6868,
		    "Cloud": 32.9361,
		    "Age": 0.383422
		  },
		  {
		    "Year": 2003,
		    "Doy": 288,
		    "SCF": 23.14,
		    "Cloud": 4.71848,
		    "Age": 0.0917832
		  },
		  {
		    "Year": 2003,
		    "Doy": 289,
		    "SCF": 22.4005,
		    "Cloud": 7.68702,
		    "Age": 0.123089
		  },
		  {
		    "Year": 2003,
		    "Doy": 290,
		    "SCF": 21.9835,
		    "Cloud": 9.99299,
		    "Age": 0.163288
		  },
		  {
		    "Year": 2003,
		    "Doy": 291,
		    "SCF": 33.5375,
		    "Cloud": 96.5918,
		    "Age": 1.11959
		  },
		  {
		    "Year": 2003,
		    "Doy": 292,
		    "SCF": 33.5617,
		    "Cloud": 30.945,
		    "Age": 0.678358
		  },
		  {
		    "Year": 2003,
		    "Doy": 293,
		    "SCF": 34.6485,
		    "Cloud": 34.1551,
		    "Age": 0.645903
		  },
		  {
		    "Year": 2003,
		    "Doy": 294,
		    "SCF": 46.0443,
		    "Cloud": 96.6648,
		    "Age": 1.59357
		  },
		  {
		    "Year": 2003,
		    "Doy": 295,
		    "SCF": 45.8837,
		    "Cloud": 71.6886,
		    "Age": 1.85644
		  },
		  {
		    "Year": 2003,
		    "Doy": 296,
		    "SCF": 44.595,
		    "Cloud": 86.9244,
		    "Age": 2.53659
		  },
		  {
		    "Year": 2003,
		    "Doy": 297,
		    "SCF": 43.7928,
		    "Cloud": 82.4633,
		    "Age": 3.0175
		  },
		  {
		    "Year": 2003,
		    "Doy": 298,
		    "SCF": 42.6072,
		    "Cloud": 81.7079,
		    "Age": 3.45652
		  },
		  {
		    "Year": 2003,
		    "Doy": 299,
		    "SCF": 42.1747,
		    "Cloud": 8.08898,
		    "Age": 0.498577
		  },
		  {
		    "Year": 2003,
		    "Doy": 300,
		    "SCF": 41.9645,
		    "Cloud": 45.5025,
		    "Age": 0.884783
		  },
		  {
		    "Year": 2003,
		    "Doy": 301,
		    "SCF": 51.7007,
		    "Cloud": 65.5827,
		    "Age": 1.22254
		  },
		  {
		    "Year": 2003,
		    "Doy": 302,
		    "SCF": 73.0847,
		    "Cloud": 94.1175,
		    "Age": 2.03557
		  },
		  {
		    "Year": 2003,
		    "Doy": 303,
		    "SCF": 73.8123,
		    "Cloud": 99.8411,
		    "Age": 3.03078
		  },
		  {
		    "Year": 2003,
		    "Doy": 304,
		    "SCF": 73.8284,
		    "Cloud": 99.9009,
		    "Age": 4.02693
		  },
		  {
		    "Year": 2003,
		    "Doy": 305,
		    "SCF": 73.8006,
		    "Cloud": 99.9242,
		    "Age": 5.02693
		  },
		  {
		    "Year": 2003,
		    "Doy": 306,
		    "SCF": 73.8006,
		    "Cloud": 41.385,
		    "Age": 2.51522
		  },
		  {
		    "Year": 2003,
		    "Doy": 307,
		    "SCF": 65.5931,
		    "Cloud": 61.4928,
		    "Age": 2.56505
		  },
		  {
		    "Year": 2003,
		    "Doy": 308,
		    "SCF": 67.0795,
		    "Cloud": 16.7279,
		    "Age": 0.70794
		  },
		  {
		    "Year": 2003,
		    "Doy": 309,
		    "SCF": 62.7645,
		    "Cloud": 94.4577,
		    "Age": 1.61586
		  },
		  {
		    "Year": 2003,
		    "Doy": 310,
		    "SCF": 62.832,
		    "Cloud": 61.0985,
		    "Age": 1.79381
		  },
		  {
		    "Year": 2003,
		    "Doy": 311,
		    "SCF": 61.9648,
		    "Cloud": 45.8317,
		    "Age": 1.24813
		  },
		  {
		    "Year": 2003,
		    "Doy": 312,
		    "SCF": 60.7064,
		    "Cloud": 6.64955,
		    "Age": 0.273307
		  },
		  {
		    "Year": 2003,
		    "Doy": 313,
		    "SCF": 58.0689,
		    "Cloud": 7.69758,
		    "Age": 0.270291
		  },
		  {
		    "Year": 2003,
		    "Doy": 314,
		    "SCF": 71.6126,
		    "Cloud": 96.2427,
		    "Age": 1.2293
		  },
		  {
		    "Year": 2003,
		    "Doy": 315,
		    "SCF": 71.9767,
		    "Cloud": 97.9234,
		    "Age": 2.18684
		  },
		  {
		    "Year": 2003,
		    "Doy": 316,
		    "SCF": 72.2787,
		    "Cloud": 95.5993,
		    "Age": 3.05589
		  },
		  {
		    "Year": 2003,
		    "Doy": 317,
		    "SCF": 72.5635,
		    "Cloud": 96.0731,
		    "Age": 3.92578
		  },
		  {
		    "Year": 2003,
		    "Doy": 318,
		    "SCF": 72.8264,
		    "Cloud": 76.477,
		    "Age": 3.81903
		  },
		  {
		    "Year": 2003,
		    "Doy": 319,
		    "SCF": 75.9321,
		    "Cloud": 95.0321,
		    "Age": 4.53779
		  },
		  {
		    "Year": 2003,
		    "Doy": 320,
		    "SCF": 75.7059,
		    "Cloud": 94.0394,
		    "Age": 5.25638
		  },
		  {
		    "Year": 2003,
		    "Doy": 321,
		    "SCF": 76.3924,
		    "Cloud": 30.2401,
		    "Age": 2.16293
		  },
		  {
		    "Year": 2003,
		    "Doy": 322,
		    "SCF": 73.4123,
		    "Cloud": 99.4345,
		    "Age": 3.12673
		  },
		  {
		    "Year": 2003,
		    "Doy": 323,
		    "SCF": 73.5732,
		    "Cloud": 81.8956,
		    "Age": 3.38157
		  },
		  {
		    "Year": 2003,
		    "Doy": 324,
		    "SCF": 74.407,
		    "Cloud": 15.3381,
		    "Age": 0.93412
		  },
		  {
		    "Year": 2003,
		    "Doy": 325,
		    "SCF": 80.2362,
		    "Cloud": 95.322,
		    "Age": 1.7674
		  },
		  {
		    "Year": 2003,
		    "Doy": 326,
		    "SCF": 80.9661,
		    "Cloud": 62.001,
		    "Age": 1.92725
		  },
		  {
		    "Year": 2003,
		    "Doy": 327,
		    "SCF": 82.0949,
		    "Cloud": 91.1403,
		    "Age": 2.68353
		  },
		  {
		    "Year": 2003,
		    "Doy": 328,
		    "SCF": 82.7793,
		    "Cloud": 42.0815,
		    "Age": 1.86
		  },
		  {
		    "Year": 2003,
		    "Doy": 329,
		    "SCF": 68.3352,
		    "Cloud": 99.6293,
		    "Age": 2.8532
		  },
		  {
		    "Year": 2003,
		    "Doy": 330,
		    "SCF": 68.3579,
		    "Cloud": 99.1476,
		    "Age": 3.82821
		  },
		  {
		    "Year": 2003,
		    "Doy": 331,
		    "SCF": 68.2134,
		    "Cloud": 97.3042,
		    "Age": 4.72039
		  },
		  {
		    "Year": 2003,
		    "Doy": 332,
		    "SCF": 68.4804,
		    "Cloud": 78.9106,
		    "Age": 4.45051
		  },
		  {
		    "Year": 2003,
		    "Doy": 333,
		    "SCF": 68.1907,
		    "Cloud": 94.4783,
		    "Age": 5.13422
		  },
		  {
		    "Year": 2003,
		    "Doy": 334,
		    "SCF": 68.331,
		    "Cloud": 93.5252,
		    "Age": 5.73165
		  },
		  {
		    "Year": 2003,
		    "Doy": 335,
		    "SCF": 68.8152,
		    "Cloud": 99.9971,
		    "Age": 6.73169
		  },
		  {
		    "Year": 2003,
		    "Doy": 336,
		    "SCF": 68.8152,
		    "Cloud": 86.8459,
		    "Age": 6.77196
		  },
		  {
		    "Year": 2003,
		    "Doy": 337,
		    "SCF": 69.2402,
		    "Cloud": 89.1348,
		    "Age": 7.09157
		  },
		  {
		    "Year": 2003,
		    "Doy": 338,
		    "SCF": 69.5539,
		    "Cloud": 72.8242,
		    "Age": 6.30798
		  },
		  {
		    "Year": 2003,
		    "Doy": 339,
		    "SCF": 67.9919,
		    "Cloud": 66.417,
		    "Age": 5.3745
		  },
		  {
		    "Year": 2003,
		    "Doy": 340,
		    "SCF": 70.1136,
		    "Cloud": 16.5217,
		    "Age": 0.948853
		  },
		  {
		    "Year": 2003,
		    "Doy": 341,
		    "SCF": 73.4473,
		    "Cloud": 84.7578,
		    "Age": 1.64376
		  },
		  {
		    "Year": 2003,
		    "Doy": 342,
		    "SCF": 74.6711,
		    "Cloud": 88.1861,
		    "Age": 2.33237
		  },
		  {
		    "Year": 2003,
		    "Doy": 343,
		    "SCF": 74.607,
		    "Cloud": 100,
		    "Age": 3.33257
		  },
		  {
		    "Year": 2003,
		    "Doy": 344,
		    "SCF": 74.607,
		    "Cloud": 85.3071,
		    "Age": 3.75404
		  },
		  {
		    "Year": 2003,
		    "Doy": 345,
		    "SCF": 75.4254,
		    "Cloud": 64.8324,
		    "Age": 3.2913
		  },
		  {
		    "Year": 2003,
		    "Doy": 346,
		    "SCF": 74.243,
		    "Cloud": 61.2037,
		    "Age": 3.09615
		  },
		  {
		    "Year": 2003,
		    "Doy": 347,
		    "SCF": 76.9315,
		    "Cloud": 85.6978,
		    "Age": 3.72566
		  },
		  {
		    "Year": 2003,
		    "Doy": 348,
		    "SCF": 76.8337,
		    "Cloud": 90.9673,
		    "Age": 4.35421
		  },
		  {
		    "Year": 2003,
		    "Doy": 349,
		    "SCF": 76.8048,
		    "Cloud": 59.2336,
		    "Age": 3.4186
		  },
		  {
		    "Year": 2003,
		    "Doy": 350,
		    "SCF": 77.351,
		    "Cloud": 75.0131,
		    "Age": 3.79072
		  },
		  {
		    "Year": 2003,
		    "Doy": 351,
		    "SCF": 77.351,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 352,
		    "SCF": 77.351,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 353,
		    "SCF": 77.351,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 354,
		    "SCF": 77.351,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 355,
		    "SCF": 77.351,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 356,
		    "SCF": 77.351,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 357,
		    "SCF": 77.351,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 358,
		    "SCF": 77.351,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2003,
		    "Doy": 359,
		    "SCF": 78.8644,
		    "Cloud": 66.7362,
		    "Age": 3.42132
		  },
		  {
		    "Year": 2003,
		    "Doy": 360,
		    "SCF": 82.697,
		    "Cloud": 99.9913,
		    "Age": 4.41875
		  },
		  {
		    "Year": 2003,
		    "Doy": 361,
		    "SCF": 82.697,
		    "Cloud": 73.4351,
		    "Age": 4.3989
		  },
		  {
		    "Year": 2003,
		    "Doy": 362,
		    "SCF": 84.5727,
		    "Cloud": 99.8237,
		    "Age": 5.39219
		  },
		  {
		    "Year": 2003,
		    "Doy": 363,
		    "SCF": 84.6164,
		    "Cloud": 37.7924,
		    "Age": 2.57159
		  },
		  {
		    "Year": 2003,
		    "Doy": 364,
		    "SCF": 85.4698,
		    "Cloud": 16.9643,
		    "Age": 0.891017
		  },
		  {
		    "Year": 2003,
		    "Doy": 365,
		    "SCF": 85.4364,
		    "Cloud": 29.3792,
		    "Age": 0.967623
		  },
		  {
		    "Year": 2004,
		    "Doy": 1,
		    "SCF": 86.6355,
		    "Cloud": 99.9971,
		    "Age": 1
		  },
		  {
		    "Year": 2004,
		    "Doy": 2,
		    "SCF": 86.6355,
		    "Cloud": 99.9811,
		    "Age": 1.99956
		  },
		  {
		    "Year": 2004,
		    "Doy": 3,
		    "SCF": 86.6408,
		    "Cloud": 100,
		    "Age": 2.99956
		  },
		  {
		    "Year": 2004,
		    "Doy": 4,
		    "SCF": 86.6408,
		    "Cloud": 63.5453,
		    "Age": 2.53782
		  },
		  {
		    "Year": 2004,
		    "Doy": 5,
		    "SCF": 88.7687,
		    "Cloud": 100,
		    "Age": 3.5378
		  },
		  {
		    "Year": 2004,
		    "Doy": 6,
		    "SCF": 88.7687,
		    "Cloud": 99.9869,
		    "Age": 4.5378
		  },
		  {
		    "Year": 2004,
		    "Doy": 7,
		    "SCF": 88.7687,
		    "Cloud": 66.6317,
		    "Age": 3.75212
		  },
		  {
		    "Year": 2004,
		    "Doy": 8,
		    "SCF": 87.7744,
		    "Cloud": 83.5263,
		    "Age": 4.06021
		  },
		  {
		    "Year": 2004,
		    "Doy": 9,
		    "SCF": 89.798,
		    "Cloud": 99.071,
		    "Age": 5.00281
		  },
		  {
		    "Year": 2004,
		    "Doy": 10,
		    "SCF": 90.0283,
		    "Cloud": 97.0949,
		    "Age": 5.84298
		  },
		  {
		    "Year": 2004,
		    "Doy": 11,
		    "SCF": 90.4643,
		    "Cloud": 99.802,
		    "Age": 6.83494
		  },
		  {
		    "Year": 2004,
		    "Doy": 12,
		    "SCF": 90.531,
		    "Cloud": 98.8001,
		    "Age": 7.75712
		  },
		  {
		    "Year": 2004,
		    "Doy": 13,
		    "SCF": 90.6618,
		    "Cloud": 89.3961,
		    "Age": 7.83075
		  },
		  {
		    "Year": 2004,
		    "Doy": 14,
		    "SCF": 92.5302,
		    "Cloud": 98.4448,
		    "Age": 8.69019
		  },
		  {
		    "Year": 2004,
		    "Doy": 15,
		    "SCF": 92.6858,
		    "Cloud": 19.4216,
		    "Age": 2.29813
		  },
		  {
		    "Year": 2004,
		    "Doy": 16,
		    "SCF": 92.4943,
		    "Cloud": 49.3732,
		    "Age": 1.73977
		  },
		  {
		    "Year": 2004,
		    "Doy": 17,
		    "SCF": 92.0382,
		    "Cloud": 16.8434,
		    "Age": 0.828041
		  },
		  {
		    "Year": 2004,
		    "Doy": 18,
		    "SCF": 85.6061,
		    "Cloud": 99.9956,
		    "Age": 1.82759
		  },
		  {
		    "Year": 2004,
		    "Doy": 19,
		    "SCF": 85.6064,
		    "Cloud": 64.9511,
		    "Age": 1.84397
		  },
		  {
		    "Year": 2004,
		    "Doy": 20,
		    "SCF": 84.0686,
		    "Cloud": 97.3928,
		    "Age": 2.78209
		  },
		  {
		    "Year": 2004,
		    "Doy": 21,
		    "SCF": 84.3087,
		    "Cloud": 52.0718,
		    "Age": 2.086
		  },
		  {
		    "Year": 2004,
		    "Doy": 22,
		    "SCF": 86.0818,
		    "Cloud": 97.2997,
		    "Age": 2.99032
		  },
		  {
		    "Year": 2004,
		    "Doy": 23,
		    "SCF": 86.6086,
		    "Cloud": 59.7041,
		    "Age": 2.60212
		  },
		  {
		    "Year": 2004,
		    "Doy": 24,
		    "SCF": 87.8242,
		    "Cloud": 98.9955,
		    "Age": 3.56633
		  },
		  {
		    "Year": 2004,
		    "Doy": 25,
		    "SCF": 87.9588,
		    "Cloud": 98.4059,
		    "Age": 4.51284
		  },
		  {
		    "Year": 2004,
		    "Doy": 26,
		    "SCF": 88.0623,
		    "Cloud": 71.1195,
		    "Age": 4.04381
		  },
		  {
		    "Year": 2004,
		    "Doy": 27,
		    "SCF": 87.8048,
		    "Cloud": 45.2468,
		    "Age": 2.17412
		  },
		  {
		    "Year": 2004,
		    "Doy": 28,
		    "SCF": 90.7808,
		    "Cloud": 95.0931,
		    "Age": 2.99441
		  },
		  {
		    "Year": 2004,
		    "Doy": 29,
		    "SCF": 91.0974,
		    "Cloud": 92.2305,
		    "Age": 3.59669
		  },
		  {
		    "Year": 2004,
		    "Doy": 30,
		    "SCF": 91.6206,
		    "Cloud": 100,
		    "Age": 4.59669
		  },
		  {
		    "Year": 2004,
		    "Doy": 31,
		    "SCF": 91.6206,
		    "Cloud": 57.792,
		    "Age": 3.44271
		  },
		  {
		    "Year": 2004,
		    "Doy": 32,
		    "SCF": 92.3736,
		    "Cloud": 28.1383,
		    "Age": 1.84124
		  },
		  {
		    "Year": 2004,
		    "Doy": 33,
		    "SCF": 86.1498,
		    "Cloud": 90.4394,
		    "Age": 2.53695
		  },
		  {
		    "Year": 2004,
		    "Doy": 34,
		    "SCF": 87.6972,
		    "Cloud": 96.7845,
		    "Age": 3.394
		  },
		  {
		    "Year": 2004,
		    "Doy": 35,
		    "SCF": 87.7806,
		    "Cloud": 34.0003,
		    "Age": 1.76733
		  },
		  {
		    "Year": 2004,
		    "Doy": 36,
		    "SCF": 86.2109,
		    "Cloud": 94.4618,
		    "Age": 2.4955
		  },
		  {
		    "Year": 2004,
		    "Doy": 37,
		    "SCF": 86.4946,
		    "Cloud": 88.2054,
		    "Age": 3.03331
		  },
		  {
		    "Year": 2004,
		    "Doy": 38,
		    "SCF": 88.2955,
		    "Cloud": 96.5752,
		    "Age": 3.87922
		  },
		  {
		    "Year": 2004,
		    "Doy": 39,
		    "SCF": 88.7045,
		    "Cloud": 89.4126,
		    "Age": 4.3912
		  },
		  {
		    "Year": 2004,
		    "Doy": 40,
		    "SCF": 90.779,
		    "Cloud": 26.3391,
		    "Age": 1.7131
		  },
		  {
		    "Year": 2004,
		    "Doy": 41,
		    "SCF": 84.4496,
		    "Cloud": 88.7059,
		    "Age": 2.42129
		  },
		  {
		    "Year": 2004,
		    "Doy": 42,
		    "SCF": 85.0204,
		    "Cloud": 76.4917,
		    "Age": 2.81401
		  },
		  {
		    "Year": 2004,
		    "Doy": 43,
		    "SCF": 84.2589,
		    "Cloud": 36.4098,
		    "Age": 1.51589
		  },
		  {
		    "Year": 2004,
		    "Doy": 44,
		    "SCF": 86.35,
		    "Cloud": 66.5944,
		    "Age": 1.74442
		  },
		  {
		    "Year": 2004,
		    "Doy": 45,
		    "SCF": 87.7747,
		    "Cloud": 57.8939,
		    "Age": 1.90973
		  },
		  {
		    "Year": 2004,
		    "Doy": 46,
		    "SCF": 88.9191,
		    "Cloud": 31.3406,
		    "Age": 0.757511
		  },
		  {
		    "Year": 2004,
		    "Doy": 47,
		    "SCF": 92.3557,
		    "Cloud": 7.45439,
		    "Age": 0.164814
		  },
		  {
		    "Year": 2004,
		    "Doy": 48,
		    "SCF": 89.3139,
		    "Cloud": 41.7189,
		    "Age": 0.465765
		  },
		  {
		    "Year": 2004,
		    "Doy": 49,
		    "SCF": 92.1678,
		    "Cloud": 46.2889,
		    "Age": 0.768803
		  },
		  {
		    "Year": 2004,
		    "Doy": 50,
		    "SCF": 93.014,
		    "Cloud": 100,
		    "Age": 1.76878
		  },
		  {
		    "Year": 2004,
		    "Doy": 51,
		    "SCF": 93.014,
		    "Cloud": 2.1586,
		    "Age": 0.0601438
		  },
		  {
		    "Year": 2004,
		    "Doy": 52,
		    "SCF": 88.4952,
		    "Cloud": 49.1841,
		    "Age": 0.519604
		  },
		  {
		    "Year": 2004,
		    "Doy": 53,
		    "SCF": 82.3896,
		    "Cloud": 97.1654,
		    "Age": 1.46154
		  },
		  {
		    "Year": 2004,
		    "Doy": 54,
		    "SCF": 82.6079,
		    "Cloud": 33.9877,
		    "Age": 0.953097
		  },
		  {
		    "Year": 2004,
		    "Doy": 55,
		    "SCF": 77.7777,
		    "Cloud": 43.6833,
		    "Age": 1.26704
		  },
		  {
		    "Year": 2004,
		    "Doy": 56,
		    "SCF": 82.8278,
		    "Cloud": 85.0839,
		    "Age": 1.9093
		  },
		  {
		    "Year": 2004,
		    "Doy": 57,
		    "SCF": 82.5378,
		    "Cloud": 58.9499,
		    "Age": 1.98
		  },
		  {
		    "Year": 2004,
		    "Doy": 58,
		    "SCF": 84.113,
		    "Cloud": 83.1546,
		    "Age": 2.52014
		  },
		  {
		    "Year": 2004,
		    "Doy": 59,
		    "SCF": 84.6632,
		    "Cloud": 74.21,
		    "Age": 2.52879
		  },
		  {
		    "Year": 2004,
		    "Doy": 60,
		    "SCF": 87.1872,
		    "Cloud": 35.5596,
		    "Age": 1.59157
		  },
		  {
		    "Year": 2004,
		    "Doy": 61,
		    "SCF": 88.4408,
		    "Cloud": 90.3989,
		    "Age": 2.11973
		  },
		  {
		    "Year": 2004,
		    "Doy": 62,
		    "SCF": 88.7049,
		    "Cloud": 22.9623,
		    "Age": 0.956307
		  },
		  {
		    "Year": 2004,
		    "Doy": 63,
		    "SCF": 95.1109,
		    "Cloud": 17.3136,
		    "Age": 0.636516
		  },
		  {
		    "Year": 2004,
		    "Doy": 64,
		    "SCF": 89.9713,
		    "Cloud": 14.1731,
		    "Age": 0.193896
		  },
		  {
		    "Year": 2004,
		    "Doy": 65,
		    "SCF": 92.323,
		    "Cloud": 35.4685,
		    "Age": 0.434273
		  },
		  {
		    "Year": 2004,
		    "Doy": 66,
		    "SCF": 91.4535,
		    "Cloud": 76.0953,
		    "Age": 1.1031
		  },
		  {
		    "Year": 2004,
		    "Doy": 67,
		    "SCF": 93.3971,
		    "Cloud": 2.50382,
		    "Age": 0.0458403
		  },
		  {
		    "Year": 2004,
		    "Doy": 68,
		    "SCF": 90.0488,
		    "Cloud": 72.0412,
		    "Age": 0.756873
		  },
		  {
		    "Year": 2004,
		    "Doy": 69,
		    "SCF": 90.4797,
		    "Cloud": 33.6266,
		    "Age": 0.627731
		  },
		  {
		    "Year": 2004,
		    "Doy": 70,
		    "SCF": 89.22,
		    "Cloud": 98.3265,
		    "Age": 1.58747
		  },
		  {
		    "Year": 2004,
		    "Doy": 71,
		    "SCF": 89.1945,
		    "Cloud": 92.6448,
		    "Age": 2.43489
		  },
		  {
		    "Year": 2004,
		    "Doy": 72,
		    "SCF": 89.1728,
		    "Cloud": 96.4841,
		    "Age": 3.33127
		  },
		  {
		    "Year": 2004,
		    "Doy": 73,
		    "SCF": 89.2577,
		    "Cloud": 100,
		    "Age": 4.33127
		  },
		  {
		    "Year": 2004,
		    "Doy": 74,
		    "SCF": 89.2577,
		    "Cloud": 97.2706,
		    "Age": 5.2052
		  },
		  {
		    "Year": 2004,
		    "Doy": 75,
		    "SCF": 89.6034,
		    "Cloud": 95.0101,
		    "Age": 5.91373
		  },
		  {
		    "Year": 2004,
		    "Doy": 76,
		    "SCF": 90.1846,
		    "Cloud": 37.6759,
		    "Age": 2.81683
		  },
		  {
		    "Year": 2004,
		    "Doy": 77,
		    "SCF": 88.0543,
		    "Cloud": 46.6634,
		    "Age": 1.8291
		  },
		  {
		    "Year": 2004,
		    "Doy": 78,
		    "SCF": 85.7141,
		    "Cloud": 41.0185,
		    "Age": 1.32097
		  },
		  {
		    "Year": 2004,
		    "Doy": 79,
		    "SCF": 83.2436,
		    "Cloud": 70.1169,
		    "Age": 1.88137
		  },
		  {
		    "Year": 2004,
		    "Doy": 80,
		    "SCF": 83.4618,
		    "Cloud": 97.1932,
		    "Age": 2.82328
		  },
		  {
		    "Year": 2004,
		    "Doy": 81,
		    "SCF": 83.5334,
		    "Cloud": 92.7422,
		    "Age": 3.58969
		  },
		  {
		    "Year": 2004,
		    "Doy": 82,
		    "SCF": 83.8075,
		    "Cloud": 97.371,
		    "Age": 4.48862
		  },
		  {
		    "Year": 2004,
		    "Doy": 83,
		    "SCF": 84.3249,
		    "Cloud": 94.8737,
		    "Age": 5.16672
		  },
		  {
		    "Year": 2004,
		    "Doy": 84,
		    "SCF": 84.5404,
		    "Cloud": 97.2407,
		    "Age": 5.99791
		  },
		  {
		    "Year": 2004,
		    "Doy": 85,
		    "SCF": 84.577,
		    "Cloud": 64.9419,
		    "Age": 4.43056
		  },
		  {
		    "Year": 2004,
		    "Doy": 86,
		    "SCF": 85.3501,
		    "Cloud": 61.5076,
		    "Age": 2.4981
		  },
		  {
		    "Year": 2004,
		    "Doy": 87,
		    "SCF": 84.1969,
		    "Cloud": 21.9561,
		    "Age": 0.741633
		  },
		  {
		    "Year": 2004,
		    "Doy": 88,
		    "SCF": 86.7664,
		    "Cloud": 72.0012,
		    "Age": 1.19224
		  },
		  {
		    "Year": 2004,
		    "Doy": 89,
		    "SCF": 86.756,
		    "Cloud": 5.07275,
		    "Age": 0.177183
		  },
		  {
		    "Year": 2004,
		    "Doy": 90,
		    "SCF": 87.786,
		    "Cloud": 10.7325,
		    "Age": 0.214083
		  },
		  {
		    "Year": 2004,
		    "Doy": 91,
		    "SCF": 85.7647,
		    "Cloud": 1.3815,
		    "Age": 0.0188611
		  },
		  {
		    "Year": 2004,
		    "Doy": 92,
		    "SCF": 84.7248,
		    "Cloud": 99.1303,
		    "Age": 1.01018
		  },
		  {
		    "Year": 2004,
		    "Doy": 93,
		    "SCF": 84.7118,
		    "Cloud": 8.5047,
		    "Age": 0.170748
		  },
		  {
		    "Year": 2004,
		    "Doy": 94,
		    "SCF": 77.8992,
		    "Cloud": 68.743,
		    "Age": 0.838301
		  },
		  {
		    "Year": 2004,
		    "Doy": 95,
		    "SCF": 77.403,
		    "Cloud": 94.5608,
		    "Age": 1.83887
		  },
		  {
		    "Year": 2004,
		    "Doy": 96,
		    "SCF": 77.403,
		    "Cloud": 89.2016,
		    "Age": 2.52394
		  },
		  {
		    "Year": 2004,
		    "Doy": 97,
		    "SCF": 77.4793,
		    "Cloud": 99.4428,
		    "Age": 3.50261
		  },
		  {
		    "Year": 2004,
		    "Doy": 98,
		    "SCF": 77.513,
		    "Cloud": 90.1136,
		    "Age": 4.09544
		  },
		  {
		    "Year": 2004,
		    "Doy": 99,
		    "SCF": 78.1892,
		    "Cloud": 4.91624,
		    "Age": 0.256582
		  },
		  {
		    "Year": 2004,
		    "Doy": 100,
		    "SCF": 74.287,
		    "Cloud": 94.6439,
		    "Age": 1.19735
		  },
		  {
		    "Year": 2004,
		    "Doy": 101,
		    "SCF": 74.0939,
		    "Cloud": 26.3818,
		    "Age": 0.554506
		  },
		  {
		    "Year": 2004,
		    "Doy": 102,
		    "SCF": 71.4563,
		    "Cloud": 73.2689,
		    "Age": 1.14784
		  },
		  {
		    "Year": 2004,
		    "Doy": 103,
		    "SCF": 70.8043,
		    "Cloud": 21.0808,
		    "Age": 0.554317
		  },
		  {
		    "Year": 2004,
		    "Doy": 104,
		    "SCF": 69.4252,
		    "Cloud": 44.5475,
		    "Age": 0.849193
		  },
		  {
		    "Year": 2004,
		    "Doy": 105,
		    "SCF": 60.6495,
		    "Cloud": 83.8732,
		    "Age": 1.66895
		  },
		  {
		    "Year": 2004,
		    "Doy": 106,
		    "SCF": 59.74,
		    "Cloud": 66.7167,
		    "Age": 1.91178
		  },
		  {
		    "Year": 2004,
		    "Doy": 107,
		    "SCF": 57.3404,
		    "Cloud": 84.3952,
		    "Age": 2.61491
		  },
		  {
		    "Year": 2004,
		    "Doy": 108,
		    "SCF": 53.894,
		    "Cloud": 97.0662,
		    "Age": 3.5544
		  },
		  {
		    "Year": 2004,
		    "Doy": 109,
		    "SCF": 53.4718,
		    "Cloud": 97.7461,
		    "Age": 4.47136
		  },
		  {
		    "Year": 2004,
		    "Doy": 110,
		    "SCF": 53.1717,
		    "Cloud": 98.629,
		    "Age": 5.42525
		  },
		  {
		    "Year": 2004,
		    "Doy": 111,
		    "SCF": 53.1799,
		    "Cloud": 99.6868,
		    "Age": 6.4099
		  },
		  {
		    "Year": 2004,
		    "Doy": 112,
		    "SCF": 53.0985,
		    "Cloud": 92.0305,
		    "Age": 6.73838
		  },
		  {
		    "Year": 2004,
		    "Doy": 113,
		    "SCF": 52.7901,
		    "Cloud": 99.8543,
		    "Age": 7.7287
		  },
		  {
		    "Year": 2004,
		    "Doy": 114,
		    "SCF": 52.7866,
		    "Cloud": 88.0566,
		    "Age": 7.70508
		  },
		  {
		    "Year": 2004,
		    "Doy": 115,
		    "SCF": 51.66,
		    "Cloud": 41.6361,
		    "Age": 4.16745
		  },
		  {
		    "Year": 2004,
		    "Doy": 116,
		    "SCF": 45.6949,
		    "Cloud": 99.8382,
		    "Age": 5.16595
		  },
		  {
		    "Year": 2004,
		    "Doy": 117,
		    "SCF": 45.6402,
		    "Cloud": 99.8994,
		    "Age": 6.15995
		  },
		  {
		    "Year": 2004,
		    "Doy": 118,
		    "SCF": 45.6402,
		    "Cloud": 99.9985,
		    "Age": 7.15995
		  },
		  {
		    "Year": 2004,
		    "Doy": 119,
		    "SCF": 45.6402,
		    "Cloud": 97.3701,
		    "Age": 8.03195
		  },
		  {
		    "Year": 2004,
		    "Doy": 120,
		    "SCF": 45.375,
		    "Cloud": 32.3876,
		    "Age": 3.81487
		  },
		  {
		    "Year": 2004,
		    "Doy": 121,
		    "SCF": 42.2085,
		    "Cloud": 78.8071,
		    "Age": 4.15408
		  },
		  {
		    "Year": 2004,
		    "Doy": 122,
		    "SCF": 39.0921,
		    "Cloud": 6.97769,
		    "Age": 0.482286
		  },
		  {
		    "Year": 2004,
		    "Doy": 123,
		    "SCF": 16.8143,
		    "Cloud": 60.4153,
		    "Age": 1.02783
		  },
		  {
		    "Year": 2004,
		    "Doy": 124,
		    "SCF": 15.0978,
		    "Cloud": 72.8338,
		    "Age": 1.67411
		  },
		  {
		    "Year": 2004,
		    "Doy": 125,
		    "SCF": 14.2304,
		    "Cloud": 99.9913,
		    "Age": 2.67282
		  },
		  {
		    "Year": 2004,
		    "Doy": 126,
		    "SCF": 14.2304,
		    "Cloud": 99.3693,
		    "Age": 3.66798
		  },
		  {
		    "Year": 2004,
		    "Doy": 127,
		    "SCF": 14.0974,
		    "Cloud": 98.4808,
		    "Age": 4.58718
		  },
		  {
		    "Year": 2004,
		    "Doy": 128,
		    "SCF": 13.9356,
		    "Cloud": 53.2002,
		    "Age": 3.04737
		  },
		  {
		    "Year": 2004,
		    "Doy": 129,
		    "SCF": 12.8288,
		    "Cloud": 87.6779,
		    "Age": 3.59298
		  },
		  {
		    "Year": 2004,
		    "Doy": 130,
		    "SCF": 12.0893,
		    "Cloud": 54.8799,
		    "Age": 2.48631
		  },
		  {
		    "Year": 2004,
		    "Doy": 131,
		    "SCF": 10.4967,
		    "Cloud": 35.4135,
		    "Age": 1.46269
		  },
		  {
		    "Year": 2004,
		    "Doy": 132,
		    "SCF": 10.3199,
		    "Cloud": 80.7933,
		    "Age": 1.96258
		  },
		  {
		    "Year": 2004,
		    "Doy": 133,
		    "SCF": 10.0657,
		    "Cloud": 99.9985,
		    "Age": 2.96272
		  },
		  {
		    "Year": 2004,
		    "Doy": 134,
		    "SCF": 10.0657,
		    "Cloud": 89.204,
		    "Age": 3.56143
		  },
		  {
		    "Year": 2004,
		    "Doy": 135,
		    "SCF": 9.95664,
		    "Cloud": 94.9516,
		    "Age": 4.30874
		  },
		  {
		    "Year": 2004,
		    "Doy": 136,
		    "SCF": 9.86458,
		    "Cloud": 60.5311,
		    "Age": 3.25526
		  },
		  {
		    "Year": 2004,
		    "Doy": 137,
		    "SCF": 9.95247,
		    "Cloud": 84.8726,
		    "Age": 3.76291
		  },
		  {
		    "Year": 2004,
		    "Doy": 138,
		    "SCF": 9.79206,
		    "Cloud": 91.0675,
		    "Age": 4.4417
		  },
		  {
		    "Year": 2004,
		    "Doy": 139,
		    "SCF": 9.71946,
		    "Cloud": 19.4956,
		    "Age": 1.57193
		  },
		  {
		    "Year": 2004,
		    "Doy": 140,
		    "SCF": 10.4172,
		    "Cloud": 48.806,
		    "Age": 1.68393
		  },
		  {
		    "Year": 2004,
		    "Doy": 141,
		    "SCF": 9.72203,
		    "Cloud": 48.7455,
		    "Age": 1.80501
		  },
		  {
		    "Year": 2004,
		    "Doy": 142,
		    "SCF": 9.62124,
		    "Cloud": 82.5904,
		    "Age": 2.46182
		  },
		  {
		    "Year": 2004,
		    "Doy": 143,
		    "SCF": 9.98316,
		    "Cloud": 58.527,
		    "Age": 2.19944
		  },
		  {
		    "Year": 2004,
		    "Doy": 144,
		    "SCF": 8.53883,
		    "Cloud": 3.73121,
		    "Age": 0.368992
		  },
		  {
		    "Year": 2004,
		    "Doy": 145,
		    "SCF": 7.15391,
		    "Cloud": 80.7991,
		    "Age": 1.1229
		  },
		  {
		    "Year": 2004,
		    "Doy": 146,
		    "SCF": 6.59919,
		    "Cloud": 88.4398,
		    "Age": 1.8992
		  },
		  {
		    "Year": 2004,
		    "Doy": 147,
		    "SCF": 6.51445,
		    "Cloud": 86.3622,
		    "Age": 2.55925
		  },
		  {
		    "Year": 2004,
		    "Doy": 148,
		    "SCF": 6.36232,
		    "Cloud": 11.9373,
		    "Age": 0.493918
		  },
		  {
		    "Year": 2004,
		    "Doy": 149,
		    "SCF": 5.65719,
		    "Cloud": 50.4055,
		    "Age": 0.79208
		  },
		  {
		    "Year": 2004,
		    "Doy": 150,
		    "SCF": 4.91438,
		    "Cloud": 15.2941,
		    "Age": 0.365497
		  },
		  {
		    "Year": 2004,
		    "Doy": 151,
		    "SCF": 3.96712,
		    "Cloud": 4.02451,
		    "Age": 0.116358
		  },
		  {
		    "Year": 2004,
		    "Doy": 152,
		    "SCF": 3.5253,
		    "Cloud": 9.57691,
		    "Age": 0.149331
		  },
		  {
		    "Year": 2004,
		    "Doy": 153,
		    "SCF": 3.20056,
		    "Cloud": 17.4033,
		    "Age": 0.256869
		  },
		  {
		    "Year": 2004,
		    "Doy": 154,
		    "SCF": 2.79518,
		    "Cloud": 20.4321,
		    "Age": 0.304665
		  },
		  {
		    "Year": 2004,
		    "Doy": 155,
		    "SCF": 2.66743,
		    "Cloud": 7.52961,
		    "Age": 0.150534
		  },
		  {
		    "Year": 2004,
		    "Doy": 156,
		    "SCF": 2.78172,
		    "Cloud": 99.3528,
		    "Age": 1.14434
		  },
		  {
		    "Year": 2004,
		    "Doy": 157,
		    "SCF": 2.78234,
		    "Cloud": 84.5706,
		    "Age": 1.82206
		  },
		  {
		    "Year": 2004,
		    "Doy": 158,
		    "SCF": 2.73514,
		    "Cloud": 72.6847,
		    "Age": 2.07752
		  },
		  {
		    "Year": 2004,
		    "Doy": 159,
		    "SCF": 2.72183,
		    "Cloud": 85.1795,
		    "Age": 2.62696
		  },
		  {
		    "Year": 2004,
		    "Doy": 160,
		    "SCF": 2.4131,
		    "Cloud": 90.1984,
		    "Age": 3.32338
		  },
		  {
		    "Year": 2004,
		    "Doy": 161,
		    "SCF": 2.37671,
		    "Cloud": 20.1274,
		    "Age": 0.916212
		  },
		  {
		    "Year": 2004,
		    "Doy": 162,
		    "SCF": 2.33836,
		    "Cloud": 76.3131,
		    "Age": 1.44894
		  },
		  {
		    "Year": 2004,
		    "Doy": 163,
		    "SCF": 2.53716,
		    "Cloud": 75.1586,
		    "Age": 1.87382
		  },
		  {
		    "Year": 2004,
		    "Doy": 164,
		    "SCF": 2.07845,
		    "Cloud": 31.7151,
		    "Age": 0.989897
		  },
		  {
		    "Year": 2004,
		    "Doy": 165,
		    "SCF": 1.97676,
		    "Cloud": 36.5908,
		    "Age": 0.844688
		  },
		  {
		    "Year": 2004,
		    "Doy": 166,
		    "SCF": 2.25472,
		    "Cloud": 65.6169,
		    "Age": 1.39397
		  },
		  {
		    "Year": 2004,
		    "Doy": 167,
		    "SCF": 2.52964,
		    "Cloud": 77.22,
		    "Age": 1.88245
		  },
		  {
		    "Year": 2004,
		    "Doy": 168,
		    "SCF": 2.70063,
		    "Cloud": 39.476,
		    "Age": 1.30323
		  },
		  {
		    "Year": 2004,
		    "Doy": 169,
		    "SCF": 4.14863,
		    "Cloud": 87.002,
		    "Age": 1.96484
		  },
		  {
		    "Year": 2004,
		    "Doy": 170,
		    "SCF": 4.45788,
		    "Cloud": 94.4322,
		    "Age": 2.85449
		  },
		  {
		    "Year": 2004,
		    "Doy": 171,
		    "SCF": 4.52996,
		    "Cloud": 90.9875,
		    "Age": 3.52103
		  },
		  {
		    "Year": 2004,
		    "Doy": 172,
		    "SCF": 3.77289,
		    "Cloud": 99.6151,
		    "Age": 4.51214
		  },
		  {
		    "Year": 2004,
		    "Doy": 173,
		    "SCF": 3.65226,
		    "Cloud": 83.5328,
		    "Age": 4.61265
		  },
		  {
		    "Year": 2004,
		    "Doy": 174,
		    "SCF": 2.85485,
		    "Cloud": 71.9708,
		    "Age": 4.04885
		  },
		  {
		    "Year": 2004,
		    "Doy": 175,
		    "SCF": 1.80766,
		    "Cloud": 58.7859,
		    "Age": 3.11552
		  },
		  {
		    "Year": 2004,
		    "Doy": 176,
		    "SCF": 1.96166,
		    "Cloud": 99.9446,
		    "Age": 4.11365
		  },
		  {
		    "Year": 2004,
		    "Doy": 177,
		    "SCF": 1.91679,
		    "Cloud": 99.2871,
		    "Age": 5.08943
		  },
		  {
		    "Year": 2004,
		    "Doy": 178,
		    "SCF": 1.75815,
		    "Cloud": 97.2766,
		    "Age": 5.89007
		  },
		  {
		    "Year": 2004,
		    "Doy": 179,
		    "SCF": 1.5643,
		    "Cloud": 88.4052,
		    "Age": 6.20029
		  },
		  {
		    "Year": 2004,
		    "Doy": 180,
		    "SCF": 1.58671,
		    "Cloud": 92.3345,
		    "Age": 6.74112
		  },
		  {
		    "Year": 2004,
		    "Doy": 181,
		    "SCF": 1.39565,
		    "Cloud": 81.541,
		    "Age": 6.38496
		  },
		  {
		    "Year": 2004,
		    "Doy": 182,
		    "SCF": 1.30042,
		    "Cloud": 36.0078,
		    "Age": 2.82191
		  },
		  {
		    "Year": 2004,
		    "Doy": 183,
		    "SCF": 2.03857,
		    "Cloud": 98.1595,
		    "Age": 3.73702
		  },
		  {
		    "Year": 2004,
		    "Doy": 184,
		    "SCF": 1.76689,
		    "Cloud": 98.7224,
		    "Age": 4.70292
		  },
		  {
		    "Year": 2004,
		    "Doy": 185,
		    "SCF": 1.32144,
		    "Cloud": 63.6757,
		    "Age": 3.96605
		  },
		  {
		    "Year": 2004,
		    "Doy": 186,
		    "SCF": 1.19636,
		    "Cloud": 60.0228,
		    "Age": 3.44635
		  },
		  {
		    "Year": 2004,
		    "Doy": 187,
		    "SCF": 1.37718,
		    "Cloud": 88.484,
		    "Age": 4.21893
		  },
		  {
		    "Year": 2004,
		    "Doy": 188,
		    "SCF": 0.713898,
		    "Cloud": 81.1288,
		    "Age": 4.51745
		  },
		  {
		    "Year": 2004,
		    "Doy": 189,
		    "SCF": 0.830391,
		    "Cloud": 48.3659,
		    "Age": 2.66539
		  },
		  {
		    "Year": 2004,
		    "Doy": 190,
		    "SCF": 1.09861,
		    "Cloud": 14.2803,
		    "Age": 0.451884
		  },
		  {
		    "Year": 2004,
		    "Doy": 191,
		    "SCF": 3.19987,
		    "Cloud": 98.1461,
		    "Age": 1.42921
		  },
		  {
		    "Year": 2004,
		    "Doy": 192,
		    "SCF": 3.13324,
		    "Cloud": 88.0014,
		    "Age": 2.16953
		  },
		  {
		    "Year": 2004,
		    "Doy": 193,
		    "SCF": 2.70342,
		    "Cloud": 82.1098,
		    "Age": 2.55721
		  },
		  {
		    "Year": 2004,
		    "Doy": 194,
		    "SCF": 3.20185,
		    "Cloud": 84.1312,
		    "Age": 3.0107
		  },
		  {
		    "Year": 2004,
		    "Doy": 195,
		    "SCF": 2.16134,
		    "Cloud": 73.4954,
		    "Age": 2.9671
		  },
		  {
		    "Year": 2004,
		    "Doy": 196,
		    "SCF": 2.20246,
		    "Cloud": 59.1926,
		    "Age": 2.35651
		  },
		  {
		    "Year": 2004,
		    "Doy": 197,
		    "SCF": 0.920734,
		    "Cloud": 69.4979,
		    "Age": 2.32256
		  },
		  {
		    "Year": 2004,
		    "Doy": 198,
		    "SCF": 0.595621,
		    "Cloud": 30.0159,
		    "Age": 1.21661
		  },
		  {
		    "Year": 2004,
		    "Doy": 199,
		    "SCF": 0.952912,
		    "Cloud": 72.6956,
		    "Age": 1.57882
		  },
		  {
		    "Year": 2004,
		    "Doy": 200,
		    "SCF": 1.6371,
		    "Cloud": 99.2417,
		    "Age": 2.55813
		  },
		  {
		    "Year": 2004,
		    "Doy": 201,
		    "SCF": 1.47463,
		    "Cloud": 27.8335,
		    "Age": 1.04547
		  },
		  {
		    "Year": 2004,
		    "Doy": 202,
		    "SCF": 0.241775,
		    "Cloud": 28.4843,
		    "Age": 0.714705
		  },
		  {
		    "Year": 2004,
		    "Doy": 203,
		    "SCF": 0.45499,
		    "Cloud": 44.5649,
		    "Age": 0.875449
		  },
		  {
		    "Year": 2004,
		    "Doy": 204,
		    "SCF": 0.835829,
		    "Cloud": 99.9461,
		    "Age": 1.87418
		  },
		  {
		    "Year": 2004,
		    "Doy": 205,
		    "SCF": 0.835508,
		    "Cloud": 99.984,
		    "Age": 2.87418
		  },
		  {
		    "Year": 2004,
		    "Doy": 206,
		    "SCF": 0.835508,
		    "Cloud": 62.841,
		    "Age": 2.43266
		  },
		  {
		    "Year": 2004,
		    "Doy": 207,
		    "SCF": 1.0627,
		    "Cloud": 56.8445,
		    "Age": 1.93618
		  },
		  {
		    "Year": 2004,
		    "Doy": 208,
		    "SCF": 1.47809,
		    "Cloud": 65.9498,
		    "Age": 1.99388
		  },
		  {
		    "Year": 2004,
		    "Doy": 209,
		    "SCF": 0.61842,
		    "Cloud": 65.154,
		    "Age": 2.06866
		  },
		  {
		    "Year": 2004,
		    "Doy": 210,
		    "SCF": 0.458073,
		    "Cloud": 5.30497,
		    "Age": 0.205027
		  },
		  {
		    "Year": 2004,
		    "Doy": 211,
		    "SCF": 0.122854,
		    "Cloud": 12.7216,
		    "Age": 0.165935
		  },
		  {
		    "Year": 2004,
		    "Doy": 212,
		    "SCF": 0.113895,
		    "Cloud": 1.76839,
		    "Age": 0.0267593
		  },
		  {
		    "Year": 2004,
		    "Doy": 213,
		    "SCF": 0.368776,
		    "Cloud": 56.1254,
		    "Age": 0.577696
		  },
		  {
		    "Year": 2004,
		    "Doy": 214,
		    "SCF": 0.419486,
		    "Cloud": 56.6077,
		    "Age": 0.910969
		  },
		  {
		    "Year": 2004,
		    "Doy": 215,
		    "SCF": 0.266182,
		    "Cloud": 36.6071,
		    "Age": 0.74344
		  },
		  {
		    "Year": 2004,
		    "Doy": 216,
		    "SCF": 0.497033,
		    "Cloud": 91.7966,
		    "Age": 1.57739
		  },
		  {
		    "Year": 2004,
		    "Doy": 217,
		    "SCF": 0.433783,
		    "Cloud": 100,
		    "Age": 2.57746
		  },
		  {
		    "Year": 2004,
		    "Doy": 218,
		    "SCF": 0.433783,
		    "Cloud": 71.6658,
		    "Age": 2.60146
		  },
		  {
		    "Year": 2004,
		    "Doy": 219,
		    "SCF": 0.424724,
		    "Cloud": 61.1865,
		    "Age": 2.35422
		  },
		  {
		    "Year": 2004,
		    "Doy": 220,
		    "SCF": 0.111229,
		    "Cloud": 50.8017,
		    "Age": 2.1812
		  },
		  {
		    "Year": 2004,
		    "Doy": 221,
		    "SCF": 0.10835,
		    "Cloud": 8.95721,
		    "Age": 0.336621
		  },
		  {
		    "Year": 2004,
		    "Doy": 222,
		    "SCF": 0.100118,
		    "Cloud": 10.9924,
		    "Age": 0.165375
		  },
		  {
		    "Year": 2004,
		    "Doy": 223,
		    "SCF": 0.0997899,
		    "Cloud": 1.38285,
		    "Age": 0.0171252
		  },
		  {
		    "Year": 2004,
		    "Doy": 224,
		    "SCF": 0.140174,
		    "Cloud": 30.1683,
		    "Age": 0.307575
		  },
		  {
		    "Year": 2004,
		    "Doy": 225,
		    "SCF": 0.116487,
		    "Cloud": 3.01138,
		    "Age": 0.0353808
		  },
		  {
		    "Year": 2004,
		    "Doy": 226,
		    "SCF": 0.160431,
		    "Cloud": 37.0473,
		    "Age": 0.384349
		  },
		  {
		    "Year": 2004,
		    "Doy": 227,
		    "SCF": 0.14383,
		    "Cloud": 4.01733,
		    "Age": 0.0629878
		  },
		  {
		    "Year": 2004,
		    "Doy": 228,
		    "SCF": 0.292602,
		    "Cloud": 3.2414,
		    "Age": 0.0358014
		  },
		  {
		    "Year": 2004,
		    "Doy": 229,
		    "SCF": 1.69115,
		    "Cloud": 74.1047,
		    "Age": 0.774948
		  },
		  {
		    "Year": 2004,
		    "Doy": 230,
		    "SCF": 2.06266,
		    "Cloud": 99.2666,
		    "Age": 1.76057
		  },
		  {
		    "Year": 2004,
		    "Doy": 231,
		    "SCF": 2.06995,
		    "Cloud": 68.7375,
		    "Age": 1.88781
		  },
		  {
		    "Year": 2004,
		    "Doy": 232,
		    "SCF": 2.48522,
		    "Cloud": 99.9854,
		    "Age": 2.88855
		  },
		  {
		    "Year": 2004,
		    "Doy": 233,
		    "SCF": 2.48522,
		    "Cloud": 90.3048,
		    "Age": 3.55136
		  },
		  {
		    "Year": 2004,
		    "Doy": 234,
		    "SCF": 1.48569,
		    "Cloud": 40.3866,
		    "Age": 1.93039
		  },
		  {
		    "Year": 2004,
		    "Doy": 235,
		    "SCF": 2.13364,
		    "Cloud": 81.1544,
		    "Age": 2.32844
		  },
		  {
		    "Year": 2004,
		    "Doy": 236,
		    "SCF": 0.76225,
		    "Cloud": 21.0567,
		    "Age": 0.751137
		  },
		  {
		    "Year": 2004,
		    "Doy": 237,
		    "SCF": 1.61893,
		    "Cloud": 69.3399,
		    "Age": 1.20274
		  },
		  {
		    "Year": 2004,
		    "Doy": 238,
		    "SCF": 2.27527,
		    "Cloud": 100,
		    "Age": 2.20313
		  },
		  {
		    "Year": 2004,
		    "Doy": 239,
		    "SCF": 2.27527,
		    "Cloud": 65.6735,
		    "Age": 2.07879
		  },
		  {
		    "Year": 2004,
		    "Doy": 240,
		    "SCF": 2.432,
		    "Cloud": 99.2225,
		    "Age": 3.06092
		  },
		  {
		    "Year": 2004,
		    "Doy": 241,
		    "SCF": 2.26025,
		    "Cloud": 97.8191,
		    "Age": 3.96146
		  },
		  {
		    "Year": 2004,
		    "Doy": 242,
		    "SCF": 1.2177,
		    "Cloud": 92.7201,
		    "Age": 4.68582
		  },
		  {
		    "Year": 2004,
		    "Doy": 243,
		    "SCF": 1.25368,
		    "Cloud": 99.5477,
		    "Age": 5.65821
		  },
		  {
		    "Year": 2004,
		    "Doy": 244,
		    "SCF": 0.888114,
		    "Cloud": 99.9241,
		    "Age": 6.65274
		  },
		  {
		    "Year": 2004,
		    "Doy": 245,
		    "SCF": 0.839237,
		    "Cloud": 94.631,
		    "Age": 7.26064
		  },
		  {
		    "Year": 2004,
		    "Doy": 246,
		    "SCF": 0.285764,
		    "Cloud": 29.2988,
		    "Age": 2.36036
		  },
		  {
		    "Year": 2004,
		    "Doy": 247,
		    "SCF": 0.487353,
		    "Cloud": 30.8151,
		    "Age": 1.17375
		  },
		  {
		    "Year": 2004,
		    "Doy": 248,
		    "SCF": 0.273471,
		    "Cloud": 99.0661,
		    "Age": 2.14715
		  },
		  {
		    "Year": 2004,
		    "Doy": 249,
		    "SCF": 0.24509,
		    "Cloud": 39.5112,
		    "Age": 1.22958
		  },
		  {
		    "Year": 2004,
		    "Doy": 250,
		    "SCF": 0.234346,
		    "Cloud": 5.79334,
		    "Age": 0.204241
		  },
		  {
		    "Year": 2004,
		    "Doy": 251,
		    "SCF": 0.320177,
		    "Cloud": 26.6554,
		    "Age": 0.425818
		  },
		  {
		    "Year": 2004,
		    "Doy": 252,
		    "SCF": 0.233181,
		    "Cloud": 41.7589,
		    "Age": 0.558127
		  },
		  {
		    "Year": 2004,
		    "Doy": 253,
		    "SCF": 0.270591,
		    "Cloud": 10.0786,
		    "Age": 0.147591
		  },
		  {
		    "Year": 2004,
		    "Doy": 254,
		    "SCF": 0.754183,
		    "Cloud": 12.5685,
		    "Age": 0.147461
		  },
		  {
		    "Year": 2004,
		    "Doy": 255,
		    "SCF": 3.96352,
		    "Cloud": 99.4391,
		    "Age": 1.14074
		  },
		  {
		    "Year": 2004,
		    "Doy": 256,
		    "SCF": 3.81794,
		    "Cloud": 87.0466,
		    "Age": 1.87112
		  },
		  {
		    "Year": 2004,
		    "Doy": 257,
		    "SCF": 2.93889,
		    "Cloud": 99.9956,
		    "Age": 2.87284
		  },
		  {
		    "Year": 2004,
		    "Doy": 258,
		    "SCF": 2.93889,
		    "Cloud": 79.9032,
		    "Age": 3.13177
		  },
		  {
		    "Year": 2004,
		    "Doy": 259,
		    "SCF": 2.43541,
		    "Cloud": 98.6779,
		    "Age": 4.07873
		  },
		  {
		    "Year": 2004,
		    "Doy": 260,
		    "SCF": 1.92279,
		    "Cloud": 0.945613,
		    "Age": 0.0573497
		  },
		  {
		    "Year": 2004,
		    "Doy": 261,
		    "SCF": 3.39908,
		    "Cloud": 99.8411,
		    "Age": 1.05569
		  },
		  {
		    "Year": 2004,
		    "Doy": 262,
		    "SCF": 3.32309,
		    "Cloud": 100,
		    "Age": 2.05569
		  },
		  {
		    "Year": 2004,
		    "Doy": 263,
		    "SCF": 3.32309,
		    "Cloud": 50.9091,
		    "Age": 1.56651
		  },
		  {
		    "Year": 2004,
		    "Doy": 264,
		    "SCF": 4.15412,
		    "Cloud": 99.8192,
		    "Age": 2.56393
		  },
		  {
		    "Year": 2004,
		    "Doy": 265,
		    "SCF": 3.99984,
		    "Cloud": 94.4777,
		    "Age": 3.3867
		  },
		  {
		    "Year": 2004,
		    "Doy": 266,
		    "SCF": 3.00191,
		    "Cloud": 54.59,
		    "Age": 2.36046
		  },
		  {
		    "Year": 2004,
		    "Doy": 267,
		    "SCF": 3.31091,
		    "Cloud": 60.8412,
		    "Age": 2.08776
		  },
		  {
		    "Year": 2004,
		    "Doy": 268,
		    "SCF": 3.65471,
		    "Cloud": 42.3516,
		    "Age": 1.47415
		  },
		  {
		    "Year": 2004,
		    "Doy": 269,
		    "SCF": 4.98274,
		    "Cloud": 51.1403,
		    "Age": 1.46687
		  },
		  {
		    "Year": 2004,
		    "Doy": 270,
		    "SCF": 4.01286,
		    "Cloud": 77.0675,
		    "Age": 2.01789
		  },
		  {
		    "Year": 2004,
		    "Doy": 271,
		    "SCF": 2.98352,
		    "Cloud": 30.6395,
		    "Age": 1.21374
		  },
		  {
		    "Year": 2004,
		    "Doy": 272,
		    "SCF": 2.40999,
		    "Cloud": 22.658,
		    "Age": 0.974155
		  },
		  {
		    "Year": 2004,
		    "Doy": 273,
		    "SCF": 2.2355,
		    "Cloud": 25.2889,
		    "Age": 0.416175
		  },
		  {
		    "Year": 2004,
		    "Doy": 274,
		    "SCF": 2.06222,
		    "Cloud": 0.914714,
		    "Age": 0.0472383
		  },
		  {
		    "Year": 2004,
		    "Doy": 275,
		    "SCF": 8.03549,
		    "Cloud": 79.7761,
		    "Age": 0.837649
		  },
		  {
		    "Year": 2004,
		    "Doy": 276,
		    "SCF": 11.2218,
		    "Cloud": 99.8673,
		    "Age": 1.83502
		  },
		  {
		    "Year": 2004,
		    "Doy": 277,
		    "SCF": 11.1711,
		    "Cloud": 97.5332,
		    "Age": 2.77261
		  },
		  {
		    "Year": 2004,
		    "Doy": 278,
		    "SCF": 9.24836,
		    "Cloud": 98.8423,
		    "Age": 3.72911
		  },
		  {
		    "Year": 2004,
		    "Doy": 279,
		    "SCF": 8.3098,
		    "Cloud": 61.2501,
		    "Age": 2.89776
		  },
		  {
		    "Year": 2004,
		    "Doy": 280,
		    "SCF": 7.77354,
		    "Cloud": 77.0009,
		    "Age": 3.03449
		  },
		  {
		    "Year": 2004,
		    "Doy": 281,
		    "SCF": 7.49147,
		    "Cloud": 96.7518,
		    "Age": 3.95849
		  },
		  {
		    "Year": 2004,
		    "Doy": 282,
		    "SCF": 7.06889,
		    "Cloud": 26.2856,
		    "Age": 1.21848
		  },
		  {
		    "Year": 2004,
		    "Doy": 283,
		    "SCF": 6.92867,
		    "Cloud": 19.1521,
		    "Age": 0.411368
		  },
		  {
		    "Year": 2004,
		    "Doy": 284,
		    "SCF": 7.15318,
		    "Cloud": 16.4767,
		    "Age": 0.349561
		  },
		  {
		    "Year": 2004,
		    "Doy": 285,
		    "SCF": 9.25635,
		    "Cloud": 22.1067,
		    "Age": 0.317735
		  },
		  {
		    "Year": 2004,
		    "Doy": 286,
		    "SCF": 27.2783,
		    "Cloud": 53.2261,
		    "Age": 0.726699
		  },
		  {
		    "Year": 2004,
		    "Doy": 287,
		    "SCF": 46.8587,
		    "Cloud": 95.5227,
		    "Age": 1.65136
		  },
		  {
		    "Year": 2004,
		    "Doy": 288,
		    "SCF": 47.8166,
		    "Cloud": 99.9985,
		    "Age": 2.65126
		  },
		  {
		    "Year": 2004,
		    "Doy": 289,
		    "SCF": 47.8166,
		    "Cloud": 99.984,
		    "Age": 3.65117
		  },
		  {
		    "Year": 2004,
		    "Doy": 290,
		    "SCF": 47.8179,
		    "Cloud": 99.9942,
		    "Age": 4.65117
		  },
		  {
		    "Year": 2004,
		    "Doy": 291,
		    "SCF": 47.8179,
		    "Cloud": 100,
		    "Age": 5.65117
		  },
		  {
		    "Year": 2004,
		    "Doy": 292,
		    "SCF": 47.8179,
		    "Cloud": 99.0542,
		    "Age": 6.58857
		  },
		  {
		    "Year": 2004,
		    "Doy": 293,
		    "SCF": 47.5366,
		    "Cloud": 89.176,
		    "Age": 6.80324
		  },
		  {
		    "Year": 2004,
		    "Doy": 294,
		    "SCF": 50.08,
		    "Cloud": 99.9709,
		    "Age": 7.80222
		  },
		  {
		    "Year": 2004,
		    "Doy": 295,
		    "SCF": 50.0863,
		    "Cloud": 94.4474,
		    "Age": 8.27233
		  },
		  {
		    "Year": 2004,
		    "Doy": 296,
		    "SCF": 48.1031,
		    "Cloud": 42.6016,
		    "Age": 3.95693
		  },
		  {
		    "Year": 2004,
		    "Doy": 297,
		    "SCF": 46.8396,
		    "Cloud": 96.01,
		    "Age": 4.66847
		  },
		  {
		    "Year": 2004,
		    "Doy": 298,
		    "SCF": 46.9522,
		    "Cloud": 57.8571,
		    "Age": 3.14479
		  },
		  {
		    "Year": 2004,
		    "Doy": 299,
		    "SCF": 50.2275,
		    "Cloud": 99.6035,
		    "Age": 4.12434
		  },
		  {
		    "Year": 2004,
		    "Doy": 300,
		    "SCF": 49.9034,
		    "Cloud": 95.4412,
		    "Age": 4.90512
		  },
		  {
		    "Year": 2004,
		    "Doy": 301,
		    "SCF": 49.9759,
		    "Cloud": 9.45619,
		    "Age": 0.625412
		  },
		  {
		    "Year": 2004,
		    "Doy": 302,
		    "SCF": 48.3105,
		    "Cloud": 99.6098,
		    "Age": 1.62043
		  },
		  {
		    "Year": 2004,
		    "Doy": 303,
		    "SCF": 48.3201,
		    "Cloud": 99.8573,
		    "Age": 2.61646
		  },
		  {
		    "Year": 2004,
		    "Doy": 304,
		    "SCF": 48.3454,
		    "Cloud": 99.7641,
		    "Age": 3.60577
		  },
		  {
		    "Year": 2004,
		    "Doy": 305,
		    "SCF": 48.3273,
		    "Cloud": 97.3526,
		    "Age": 4.49431
		  },
		  {
		    "Year": 2004,
		    "Doy": 306,
		    "SCF": 48.4511,
		    "Cloud": 46.2515,
		    "Age": 2.5474
		  },
		  {
		    "Year": 2004,
		    "Doy": 307,
		    "SCF": 47.6578,
		    "Cloud": 22.8144,
		    "Age": 0.889818
		  },
		  {
		    "Year": 2004,
		    "Doy": 308,
		    "SCF": 44.1907,
		    "Cloud": 99.7901,
		    "Age": 1.88802
		  },
		  {
		    "Year": 2004,
		    "Doy": 309,
		    "SCF": 44.2198,
		    "Cloud": 93.8077,
		    "Age": 2.70031
		  },
		  {
		    "Year": 2004,
		    "Doy": 310,
		    "SCF": 43.9164,
		    "Cloud": 74.4801,
		    "Age": 2.82347
		  },
		  {
		    "Year": 2004,
		    "Doy": 311,
		    "SCF": 44.3631,
		    "Cloud": 8.33601,
		    "Age": 0.413448
		  },
		  {
		    "Year": 2004,
		    "Doy": 312,
		    "SCF": 41.7586,
		    "Cloud": 62.03,
		    "Age": 0.977237
		  },
		  {
		    "Year": 2004,
		    "Doy": 313,
		    "SCF": 44.5994,
		    "Cloud": 32.3259,
		    "Age": 0.634365
		  },
		  {
		    "Year": 2004,
		    "Doy": 314,
		    "SCF": 38.3397,
		    "Cloud": 95.4215,
		    "Age": 1.57635
		  },
		  {
		    "Year": 2004,
		    "Doy": 315,
		    "SCF": 37.567,
		    "Cloud": 97.1383,
		    "Age": 2.49107
		  },
		  {
		    "Year": 2004,
		    "Doy": 316,
		    "SCF": 36.9627,
		    "Cloud": 99.9183,
		    "Age": 3.48811
		  },
		  {
		    "Year": 2004,
		    "Doy": 317,
		    "SCF": 36.9573,
		    "Cloud": 52.9223,
		    "Age": 2.39633
		  },
		  {
		    "Year": 2004,
		    "Doy": 318,
		    "SCF": 38.4734,
		    "Cloud": 17.4146,
		    "Age": 0.772869
		  },
		  {
		    "Year": 2004,
		    "Doy": 319,
		    "SCF": 39.537,
		    "Cloud": 93.7582,
		    "Age": 1.69532
		  },
		  {
		    "Year": 2004,
		    "Doy": 320,
		    "SCF": 40.1404,
		    "Cloud": 55.7733,
		    "Age": 1.8
		  },
		  {
		    "Year": 2004,
		    "Doy": 321,
		    "SCF": 34.8275,
		    "Cloud": 17.1336,
		    "Age": 0.952561
		  },
		  {
		    "Year": 2004,
		    "Doy": 322,
		    "SCF": 77.4725,
		    "Cloud": 99.4746,
		    "Age": 1.93289
		  },
		  {
		    "Year": 2004,
		    "Doy": 323,
		    "SCF": 77.4379,
		    "Cloud": 30.5879,
		    "Age": 1.26901
		  },
		  {
		    "Year": 2004,
		    "Doy": 324,
		    "SCF": 77.4312,
		    "Cloud": 20.0623,
		    "Age": 0.95637
		  },
		  {
		    "Year": 2004,
		    "Doy": 325,
		    "SCF": 78.4975,
		    "Cloud": 18.3567,
		    "Age": 0.855392
		  },
		  {
		    "Year": 2004,
		    "Doy": 326,
		    "SCF": 79.9084,
		    "Cloud": 14.2786,
		    "Age": 0.712346
		  },
		  {
		    "Year": 2004,
		    "Doy": 327,
		    "SCF": 81.6196,
		    "Cloud": 76.7203,
		    "Age": 1.3459
		  },
		  {
		    "Year": 2004,
		    "Doy": 328,
		    "SCF": 80.9522,
		    "Cloud": 14.0168,
		    "Age": 0.712385
		  },
		  {
		    "Year": 2004,
		    "Doy": 329,
		    "SCF": 84.4592,
		    "Cloud": 97.3961,
		    "Age": 1.66909
		  },
		  {
		    "Year": 2004,
		    "Doy": 330,
		    "SCF": 84.8847,
		    "Cloud": 97.6085,
		    "Age": 2.60211
		  },
		  {
		    "Year": 2004,
		    "Doy": 331,
		    "SCF": 85.2624,
		    "Cloud": 100,
		    "Age": 3.60211
		  },
		  {
		    "Year": 2004,
		    "Doy": 332,
		    "SCF": 85.2624,
		    "Cloud": 95.8963,
		    "Age": 4.41379
		  },
		  {
		    "Year": 2004,
		    "Doy": 333,
		    "SCF": 85.9018,
		    "Cloud": 48.7788,
		    "Age": 2.76034
		  },
		  {
		    "Year": 2004,
		    "Doy": 334,
		    "SCF": 82.6475,
		    "Cloud": 99.0398,
		    "Age": 3.71701
		  },
		  {
		    "Year": 2004,
		    "Doy": 335,
		    "SCF": 82.6984,
		    "Cloud": 99.9942,
		    "Age": 4.71701
		  },
		  {
		    "Year": 2004,
		    "Doy": 336,
		    "SCF": 82.6984,
		    "Cloud": 63.9626,
		    "Age": 3.68593
		  },
		  {
		    "Year": 2004,
		    "Doy": 337,
		    "SCF": 77.8843,
		    "Cloud": 46.5791,
		    "Age": 2.3646
		  },
		  {
		    "Year": 2004,
		    "Doy": 338,
		    "SCF": 75.659,
		    "Cloud": 98.1594,
		    "Age": 3.33792
		  },
		  {
		    "Year": 2004,
		    "Doy": 339,
		    "SCF": 75.7276,
		    "Cloud": 95.4357,
		    "Age": 4.1237
		  },
		  {
		    "Year": 2004,
		    "Doy": 340,
		    "SCF": 76.0568,
		    "Cloud": 88.4314,
		    "Age": 4.32515
		  },
		  {
		    "Year": 2004,
		    "Doy": 341,
		    "SCF": 75.7866,
		    "Cloud": 99.9593,
		    "Age": 5.32647
		  },
		  {
		    "Year": 2004,
		    "Doy": 342,
		    "SCF": 75.7866,
		    "Cloud": 34.83,
		    "Age": 2.26479
		  },
		  {
		    "Year": 2004,
		    "Doy": 343,
		    "SCF": 75.2761,
		    "Cloud": 77.4086,
		    "Age": 2.66873
		  },
		  {
		    "Year": 2004,
		    "Doy": 344,
		    "SCF": 75.6128,
		    "Cloud": 99.6365,
		    "Age": 3.65208
		  },
		  {
		    "Year": 2004,
		    "Doy": 345,
		    "SCF": 75.6939,
		    "Cloud": 39.913,
		    "Age": 1.73803
		  },
		  {
		    "Year": 2004,
		    "Doy": 346,
		    "SCF": 74.751,
		    "Cloud": 99.5827,
		    "Age": 2.7301
		  },
		  {
		    "Year": 2004,
		    "Doy": 347,
		    "SCF": 74.8325,
		    "Cloud": 85.4062,
		    "Age": 3.23404
		  },
		  {
		    "Year": 2004,
		    "Doy": 348,
		    "SCF": 75.7548,
		    "Cloud": 23.0522,
		    "Age": 1.23823
		  },
		  {
		    "Year": 2004,
		    "Doy": 349,
		    "SCF": 74.6161,
		    "Cloud": 99.9825,
		    "Age": 2.23874
		  },
		  {
		    "Year": 2004,
		    "Doy": 350,
		    "SCF": 74.6161,
		    "Cloud": 69.991,
		    "Age": 2.38288
		  },
		  {
		    "Year": 2004,
		    "Doy": 351,
		    "SCF": 73.0472,
		    "Cloud": 99.9855,
		    "Age": 3.3826
		  },
		  {
		    "Year": 2004,
		    "Doy": 352,
		    "SCF": 73.0472,
		    "Cloud": 81.0707,
		    "Age": 3.66173
		  },
		  {
		    "Year": 2004,
		    "Doy": 353,
		    "SCF": 73.3622,
		    "Cloud": 69.0394,
		    "Age": 3.51413
		  },
		  {
		    "Year": 2004,
		    "Doy": 354,
		    "SCF": 74.5814,
		    "Cloud": 98.5257,
		    "Age": 4.47103
		  },
		  {
		    "Year": 2004,
		    "Doy": 355,
		    "SCF": 74.7057,
		    "Cloud": 15.1969,
		    "Age": 1.39693
		  },
		  {
		    "Year": 2004,
		    "Doy": 356,
		    "SCF": 74.55,
		    "Cloud": 52.3163,
		    "Age": 1.46107
		  },
		  {
		    "Year": 2004,
		    "Doy": 357,
		    "SCF": 73.3853,
		    "Cloud": 83.2589,
		    "Age": 2.22989
		  },
		  {
		    "Year": 2004,
		    "Doy": 358,
		    "SCF": 74.4706,
		    "Cloud": 80.3845,
		    "Age": 2.64731
		  },
		  {
		    "Year": 2004,
		    "Doy": 359,
		    "SCF": 74.8185,
		    "Cloud": 84.9154,
		    "Age": 3.1507
		  },
		  {
		    "Year": 2004,
		    "Doy": 360,
		    "SCF": 75.4253,
		    "Cloud": 98.7644,
		    "Age": 4.09888
		  },
		  {
		    "Year": 2004,
		    "Doy": 361,
		    "SCF": 75.6567,
		    "Cloud": 28.3309,
		    "Age": 1.6232
		  },
		  {
		    "Year": 2004,
		    "Doy": 362,
		    "SCF": 76.3012,
		    "Cloud": 77.2727,
		    "Age": 2.27129
		  },
		  {
		    "Year": 2004,
		    "Doy": 363,
		    "SCF": 74.8069,
		    "Cloud": 99.9534,
		    "Age": 3.2707
		  },
		  {
		    "Year": 2004,
		    "Doy": 364,
		    "SCF": 74.8133,
		    "Cloud": 83.6429,
		    "Age": 3.63848
		  },
		  {
		    "Year": 2004,
		    "Doy": 365,
		    "SCF": 73.6373,
		    "Cloud": 73.6554,
		    "Age": 3.49622
		  },
		  {
		    "Year": 2005,
		    "Doy": 1,
		    "SCF": 75.3776,
		    "Cloud": 53.1989,
		    "Age": 0.531727
		  },
		  {
		    "Year": 2005,
		    "Doy": 2,
		    "SCF": 72.814,
		    "Cloud": 99.1435,
		    "Age": 1.5182
		  },
		  {
		    "Year": 2005,
		    "Doy": 3,
		    "SCF": 72.8089,
		    "Cloud": 32.1084,
		    "Age": 0.837361
		  },
		  {
		    "Year": 2005,
		    "Doy": 4,
		    "SCF": 72.6574,
		    "Cloud": 100,
		    "Age": 1.83693
		  },
		  {
		    "Year": 2005,
		    "Doy": 5,
		    "SCF": 72.6574,
		    "Cloud": 48.5922,
		    "Age": 1.41153
		  },
		  {
		    "Year": 2005,
		    "Doy": 6,
		    "SCF": 70.9651,
		    "Cloud": 32.7312,
		    "Age": 0.964166
		  },
		  {
		    "Year": 2005,
		    "Doy": 7,
		    "SCF": 70.2938,
		    "Cloud": 90.8257,
		    "Age": 1.71892
		  },
		  {
		    "Year": 2005,
		    "Doy": 8,
		    "SCF": 70.5605,
		    "Cloud": 99.9854,
		    "Age": 2.71902
		  },
		  {
		    "Year": 2005,
		    "Doy": 9,
		    "SCF": 70.5598,
		    "Cloud": 79.8542,
		    "Age": 2.96869
		  },
		  {
		    "Year": 2005,
		    "Doy": 10,
		    "SCF": 70.5421,
		    "Cloud": 53.539,
		    "Age": 2.2561
		  },
		  {
		    "Year": 2005,
		    "Doy": 11,
		    "SCF": 67.8811,
		    "Cloud": 62.7731,
		    "Age": 2.06545
		  },
		  {
		    "Year": 2005,
		    "Doy": 12,
		    "SCF": 67.6386,
		    "Cloud": 61.87,
		    "Age": 2.0799
		  },
		  {
		    "Year": 2005,
		    "Doy": 13,
		    "SCF": 68.0596,
		    "Cloud": 59.6976,
		    "Age": 1.89976
		  },
		  {
		    "Year": 2005,
		    "Doy": 14,
		    "SCF": 69.8728,
		    "Cloud": 18.902,
		    "Age": 0.866082
		  },
		  {
		    "Year": 2005,
		    "Doy": 15,
		    "SCF": 71.3302,
		    "Cloud": 100,
		    "Age": 1.86565
		  },
		  {
		    "Year": 2005,
		    "Doy": 16,
		    "SCF": 71.3302,
		    "Cloud": 71.0546,
		    "Age": 2.03522
		  },
		  {
		    "Year": 2005,
		    "Doy": 17,
		    "SCF": 71.1311,
		    "Cloud": 86.2462,
		    "Age": 2.70318
		  },
		  {
		    "Year": 2005,
		    "Doy": 18,
		    "SCF": 72.7613,
		    "Cloud": 99.0113,
		    "Age": 3.66333
		  },
		  {
		    "Year": 2005,
		    "Doy": 19,
		    "SCF": 72.9724,
		    "Cloud": 22.9677,
		    "Age": 1.1824
		  },
		  {
		    "Year": 2005,
		    "Doy": 20,
		    "SCF": 80.8346,
		    "Cloud": 99.1066,
		    "Age": 2.16498
		  },
		  {
		    "Year": 2005,
		    "Doy": 21,
		    "SCF": 81.0557,
		    "Cloud": 49.6908,
		    "Age": 1.61981
		  },
		  {
		    "Year": 2005,
		    "Doy": 22,
		    "SCF": 81.4634,
		    "Cloud": 20.3393,
		    "Age": 0.846677
		  },
		  {
		    "Year": 2005,
		    "Doy": 23,
		    "SCF": 76.9143,
		    "Cloud": 74.4703,
		    "Age": 1.4602
		  },
		  {
		    "Year": 2005,
		    "Doy": 24,
		    "SCF": 77.2776,
		    "Cloud": 14.2182,
		    "Age": 0.708638
		  },
		  {
		    "Year": 2005,
		    "Doy": 25,
		    "SCF": 74.6011,
		    "Cloud": 92.6722,
		    "Age": 1.62049
		  },
		  {
		    "Year": 2005,
		    "Doy": 26,
		    "SCF": 74.3128,
		    "Cloud": 99.4239,
		    "Age": 2.60512
		  },
		  {
		    "Year": 2005,
		    "Doy": 27,
		    "SCF": 74.375,
		    "Cloud": 76.1254,
		    "Age": 2.76045
		  },
		  {
		    "Year": 2005,
		    "Doy": 28,
		    "SCF": 74.7805,
		    "Cloud": 53.2457,
		    "Age": 2.11704
		  },
		  {
		    "Year": 2005,
		    "Doy": 29,
		    "SCF": 72.2927,
		    "Cloud": 100,
		    "Age": 3.11827
		  },
		  {
		    "Year": 2005,
		    "Doy": 30,
		    "SCF": 72.2927,
		    "Cloud": 97.8209,
		    "Age": 4.02518
		  },
		  {
		    "Year": 2005,
		    "Doy": 31,
		    "SCF": 72.4479,
		    "Cloud": 20.0166,
		    "Age": 0.778028
		  },
		  {
		    "Year": 2005,
		    "Doy": 32,
		    "SCF": 70.64,
		    "Cloud": 18.4945,
		    "Age": 0.554091
		  },
		  {
		    "Year": 2005,
		    "Doy": 33,
		    "SCF": 72.0188,
		    "Cloud": 44.6532,
		    "Age": 0.769788
		  },
		  {
		    "Year": 2005,
		    "Doy": 34,
		    "SCF": 70.2451,
		    "Cloud": 31.7128,
		    "Age": 0.737031
		  },
		  {
		    "Year": 2005,
		    "Doy": 35,
		    "SCF": 70.8658,
		    "Cloud": 63.5269,
		    "Age": 1.10377
		  },
		  {
		    "Year": 2005,
		    "Doy": 36,
		    "SCF": 72.0825,
		    "Cloud": 99.1703,
		    "Age": 2.09007
		  },
		  {
		    "Year": 2005,
		    "Doy": 37,
		    "SCF": 72.1508,
		    "Cloud": 100,
		    "Age": 3.09007
		  },
		  {
		    "Year": 2005,
		    "Doy": 38,
		    "SCF": 72.1508,
		    "Cloud": 80.1822,
		    "Age": 3.23324
		  },
		  {
		    "Year": 2005,
		    "Doy": 39,
		    "SCF": 72.0494,
		    "Cloud": 86.9799,
		    "Age": 3.90305
		  },
		  {
		    "Year": 2005,
		    "Doy": 40,
		    "SCF": 72.199,
		    "Cloud": 99.8719,
		    "Age": 4.89546
		  },
		  {
		    "Year": 2005,
		    "Doy": 41,
		    "SCF": 72.218,
		    "Cloud": 67.7952,
		    "Age": 4.01811
		  },
		  {
		    "Year": 2005,
		    "Doy": 42,
		    "SCF": 72.699,
		    "Cloud": 19.4324,
		    "Age": 1.09229
		  },
		  {
		    "Year": 2005,
		    "Doy": 43,
		    "SCF": 73.1103,
		    "Cloud": 100,
		    "Age": 2.09113
		  },
		  {
		    "Year": 2005,
		    "Doy": 44,
		    "SCF": 73.1103,
		    "Cloud": 68.086,
		    "Age": 1.75997
		  },
		  {
		    "Year": 2005,
		    "Doy": 45,
		    "SCF": 73.7479,
		    "Cloud": 80.0221,
		    "Age": 2.27428
		  },
		  {
		    "Year": 2005,
		    "Doy": 46,
		    "SCF": 74.399,
		    "Cloud": 38.9565,
		    "Age": 1.39396
		  },
		  {
		    "Year": 2005,
		    "Doy": 47,
		    "SCF": 72.7729,
		    "Cloud": 80.0131,
		    "Age": 1.97891
		  },
		  {
		    "Year": 2005,
		    "Doy": 48,
		    "SCF": 72.2107,
		    "Cloud": 47.047,
		    "Age": 1.56805
		  },
		  {
		    "Year": 2005,
		    "Doy": 49,
		    "SCF": 69.6897,
		    "Cloud": 77.6186,
		    "Age": 2.09471
		  },
		  {
		    "Year": 2005,
		    "Doy": 50,
		    "SCF": 70.5041,
		    "Cloud": 63.4758,
		    "Age": 2.05458
		  },
		  {
		    "Year": 2005,
		    "Doy": 51,
		    "SCF": 72.2482,
		    "Cloud": 35.2802,
		    "Age": 1.14601
		  },
		  {
		    "Year": 2005,
		    "Doy": 52,
		    "SCF": 73.2119,
		    "Cloud": 99.8953,
		    "Age": 2.14081
		  },
		  {
		    "Year": 2005,
		    "Doy": 53,
		    "SCF": 73.224,
		    "Cloud": 77.9253,
		    "Age": 2.44349
		  },
		  {
		    "Year": 2005,
		    "Doy": 54,
		    "SCF": 73.524,
		    "Cloud": 54.5634,
		    "Age": 1.95232
		  },
		  {
		    "Year": 2005,
		    "Doy": 55,
		    "SCF": 75.3609,
		    "Cloud": 17.244,
		    "Age": 0.567708
		  },
		  {
		    "Year": 2005,
		    "Doy": 56,
		    "SCF": 76.8975,
		    "Cloud": 14.4857,
		    "Age": 0.293322
		  },
		  {
		    "Year": 2005,
		    "Doy": 57,
		    "SCF": 74.4314,
		    "Cloud": 56.5444,
		    "Age": 0.721467
		  },
		  {
		    "Year": 2005,
		    "Doy": 58,
		    "SCF": 80.6001,
		    "Cloud": 89.2409,
		    "Age": 1.52434
		  },
		  {
		    "Year": 2005,
		    "Doy": 59,
		    "SCF": 80.7433,
		    "Cloud": 99.9985,
		    "Age": 2.52403
		  },
		  {
		    "Year": 2005,
		    "Doy": 60,
		    "SCF": 80.7433,
		    "Cloud": 87.5832,
		    "Age": 3.1044
		  },
		  {
		    "Year": 2005,
		    "Doy": 61,
		    "SCF": 80.7574,
		    "Cloud": 32.702,
		    "Age": 1.38112
		  },
		  {
		    "Year": 2005,
		    "Doy": 62,
		    "SCF": 82.8631,
		    "Cloud": 8.92416,
		    "Age": 0.401159
		  },
		  {
		    "Year": 2005,
		    "Doy": 63,
		    "SCF": 81.1261,
		    "Cloud": 99.9593,
		    "Age": 1.40087
		  },
		  {
		    "Year": 2005,
		    "Doy": 64,
		    "SCF": 81.1294,
		    "Cloud": 78.3061,
		    "Age": 1.89312
		  },
		  {
		    "Year": 2005,
		    "Doy": 65,
		    "SCF": 81.2149,
		    "Cloud": 76.7219,
		    "Age": 2.21744
		  },
		  {
		    "Year": 2005,
		    "Doy": 66,
		    "SCF": 80.36,
		    "Cloud": 65.8602,
		    "Age": 2.21036
		  },
		  {
		    "Year": 2005,
		    "Doy": 67,
		    "SCF": 83.2525,
		    "Cloud": 83.1187,
		    "Age": 2.61084
		  },
		  {
		    "Year": 2005,
		    "Doy": 68,
		    "SCF": 82.7697,
		    "Cloud": 55.2534,
		    "Age": 2.18917
		  },
		  {
		    "Year": 2005,
		    "Doy": 69,
		    "SCF": 86.8949,
		    "Cloud": 87.1767,
		    "Age": 2.64768
		  },
		  {
		    "Year": 2005,
		    "Doy": 70,
		    "SCF": 91.1048,
		    "Cloud": 99.9346,
		    "Age": 3.64606
		  },
		  {
		    "Year": 2005,
		    "Doy": 71,
		    "SCF": 91.1085,
		    "Cloud": 85.9457,
		    "Age": 4.15955
		  },
		  {
		    "Year": 2005,
		    "Doy": 72,
		    "SCF": 91.7792,
		    "Cloud": 99.9956,
		    "Age": 5.15967
		  },
		  {
		    "Year": 2005,
		    "Doy": 73,
		    "SCF": 91.7792,
		    "Cloud": 81.5743,
		    "Age": 5.02279
		  },
		  {
		    "Year": 2005,
		    "Doy": 74,
		    "SCF": 93.6344,
		    "Cloud": 6.61464,
		    "Age": 0.399741
		  },
		  {
		    "Year": 2005,
		    "Doy": 75,
		    "SCF": 87.5336,
		    "Cloud": 99.8852,
		    "Age": 1.39828
		  },
		  {
		    "Year": 2005,
		    "Doy": 76,
		    "SCF": 87.547,
		    "Cloud": 98.9668,
		    "Age": 2.35971
		  },
		  {
		    "Year": 2005,
		    "Doy": 77,
		    "SCF": 87.6488,
		    "Cloud": 42.4218,
		    "Age": 1.49429
		  },
		  {
		    "Year": 2005,
		    "Doy": 78,
		    "SCF": 86.6423,
		    "Cloud": 61.373,
		    "Age": 1.54283
		  },
		  {
		    "Year": 2005,
		    "Doy": 79,
		    "SCF": 85.952,
		    "Cloud": 83.271,
		    "Age": 2.13996
		  },
		  {
		    "Year": 2005,
		    "Doy": 80,
		    "SCF": 86.4411,
		    "Cloud": 12.9319,
		    "Age": 0.426828
		  },
		  {
		    "Year": 2005,
		    "Doy": 81,
		    "SCF": 90.1697,
		    "Cloud": 69.6292,
		    "Age": 1.06188
		  },
		  {
		    "Year": 2005,
		    "Doy": 82,
		    "SCF": 90.8497,
		    "Cloud": 75.969,
		    "Age": 1.53795
		  },
		  {
		    "Year": 2005,
		    "Doy": 83,
		    "SCF": 93.5227,
		    "Cloud": 14.6401,
		    "Age": 0.60907
		  },
		  {
		    "Year": 2005,
		    "Doy": 84,
		    "SCF": 86.4834,
		    "Cloud": 31.9007,
		    "Age": 0.758923
		  },
		  {
		    "Year": 2005,
		    "Doy": 85,
		    "SCF": 86.9711,
		    "Cloud": 26.2179,
		    "Age": 0.754162
		  },
		  {
		    "Year": 2005,
		    "Doy": 86,
		    "SCF": 83.6615,
		    "Cloud": 2.15432,
		    "Age": 0.0266891
		  },
		  {
		    "Year": 2005,
		    "Doy": 87,
		    "SCF": 79.1834,
		    "Cloud": 3.73424,
		    "Age": 0.0402071
		  },
		  {
		    "Year": 2005,
		    "Doy": 88,
		    "SCF": 71.9505,
		    "Cloud": 99.6685,
		    "Age": 1.0369
		  },
		  {
		    "Year": 2005,
		    "Doy": 89,
		    "SCF": 71.9668,
		    "Cloud": 12.5929,
		    "Age": 0.249531
		  },
		  {
		    "Year": 2005,
		    "Doy": 90,
		    "SCF": 77.4902,
		    "Cloud": 0.384022,
		    "Age": 0.00795683
		  },
		  {
		    "Year": 2005,
		    "Doy": 91,
		    "SCF": 73.5761,
		    "Cloud": 0.405653,
		    "Age": 0.0068045
		  },
		  {
		    "Year": 2005,
		    "Doy": 92,
		    "SCF": 71.5976,
		    "Cloud": 69.7782,
		    "Age": 0.70564
		  },
		  {
		    "Year": 2005,
		    "Doy": 93,
		    "SCF": 70.8281,
		    "Cloud": 1.21747,
		    "Age": 0.025804
		  },
		  {
		    "Year": 2005,
		    "Doy": 94,
		    "SCF": 64.5293,
		    "Cloud": 97.7644,
		    "Age": 1.00453
		  },
		  {
		    "Year": 2005,
		    "Doy": 95,
		    "SCF": 64.3387,
		    "Cloud": 66.5268,
		    "Age": 1.33521
		  },
		  {
		    "Year": 2005,
		    "Doy": 96,
		    "SCF": 65.2792,
		    "Cloud": 89.1575,
		    "Age": 2.13461
		  },
		  {
		    "Year": 2005,
		    "Doy": 97,
		    "SCF": 65.281,
		    "Cloud": 99.9782,
		    "Age": 3.13524
		  },
		  {
		    "Year": 2005,
		    "Doy": 98,
		    "SCF": 65.2674,
		    "Cloud": 94.419,
		    "Age": 3.95023
		  },
		  {
		    "Year": 2005,
		    "Doy": 99,
		    "SCF": 65.0513,
		    "Cloud": 55.7277,
		    "Age": 3.08666
		  },
		  {
		    "Year": 2005,
		    "Doy": 100,
		    "SCF": 63.5428,
		    "Cloud": 42.0504,
		    "Age": 2.32845
		  },
		  {
		    "Year": 2005,
		    "Doy": 101,
		    "SCF": 62.5088,
		    "Cloud": 34.8587,
		    "Age": 1.70747
		  },
		  {
		    "Year": 2005,
		    "Doy": 102,
		    "SCF": 58.6279,
		    "Cloud": 40.4725,
		    "Age": 1.68965
		  },
		  {
		    "Year": 2005,
		    "Doy": 103,
		    "SCF": 57.4213,
		    "Cloud": 53.4992,
		    "Age": 1.83121
		  },
		  {
		    "Year": 2005,
		    "Doy": 104,
		    "SCF": 58.5662,
		    "Cloud": 37.5774,
		    "Age": 1.29577
		  },
		  {
		    "Year": 2005,
		    "Doy": 105,
		    "SCF": 56.2154,
		    "Cloud": 60.6663,
		    "Age": 1.7675
		  },
		  {
		    "Year": 2005,
		    "Doy": 106,
		    "SCF": 57.2308,
		    "Cloud": 75.9533,
		    "Age": 2.44293
		  },
		  {
		    "Year": 2005,
		    "Doy": 107,
		    "SCF": 56.8249,
		    "Cloud": 99.9564,
		    "Age": 3.4409
		  },
		  {
		    "Year": 2005,
		    "Doy": 108,
		    "SCF": 56.829,
		    "Cloud": 95.1577,
		    "Age": 4.22599
		  },
		  {
		    "Year": 2005,
		    "Doy": 109,
		    "SCF": 55.1603,
		    "Cloud": 7.12382,
		    "Age": 0.323463
		  },
		  {
		    "Year": 2005,
		    "Doy": 110,
		    "SCF": 53.3518,
		    "Cloud": 3.35848,
		    "Age": 0.072602
		  },
		  {
		    "Year": 2005,
		    "Doy": 111,
		    "SCF": 53.9296,
		    "Cloud": 1.2018,
		    "Age": 0.032889
		  },
		  {
		    "Year": 2005,
		    "Doy": 112,
		    "SCF": 49.8948,
		    "Cloud": 37.0505,
		    "Age": 0.394484
		  },
		  {
		    "Year": 2005,
		    "Doy": 113,
		    "SCF": 50.9788,
		    "Cloud": 10.7278,
		    "Age": 0.195381
		  },
		  {
		    "Year": 2005,
		    "Doy": 114,
		    "SCF": 48.6996,
		    "Cloud": 1.9541,
		    "Age": 0.0418798
		  },
		  {
		    "Year": 2005,
		    "Doy": 115,
		    "SCF": 46.9822,
		    "Cloud": 20.7136,
		    "Age": 0.235821
		  },
		  {
		    "Year": 2005,
		    "Doy": 116,
		    "SCF": 43.936,
		    "Cloud": 89.6756,
		    "Age": 1.11317
		  },
		  {
		    "Year": 2005,
		    "Doy": 117,
		    "SCF": 43.8561,
		    "Cloud": 23.3101,
		    "Age": 0.526992
		  },
		  {
		    "Year": 2005,
		    "Doy": 118,
		    "SCF": 41.2223,
		    "Cloud": 18.3252,
		    "Age": 0.351156
		  },
		  {
		    "Year": 2005,
		    "Doy": 119,
		    "SCF": 35.5714,
		    "Cloud": 99.9927,
		    "Age": 1.35086
		  },
		  {
		    "Year": 2005,
		    "Doy": 120,
		    "SCF": 35.5714,
		    "Cloud": 77.4642,
		    "Age": 1.85702
		  },
		  {
		    "Year": 2005,
		    "Doy": 121,
		    "SCF": 34.9815,
		    "Cloud": 59.972,
		    "Age": 1.89156
		  },
		  {
		    "Year": 2005,
		    "Doy": 122,
		    "SCF": 34.1798,
		    "Cloud": 99.226,
		    "Age": 2.8678
		  },
		  {
		    "Year": 2005,
		    "Doy": 123,
		    "SCF": 34.169,
		    "Cloud": 79.4481,
		    "Age": 3.16029
		  },
		  {
		    "Year": 2005,
		    "Doy": 124,
		    "SCF": 33.1377,
		    "Cloud": 50.775,
		    "Age": 2.05071
		  },
		  {
		    "Year": 2005,
		    "Doy": 125,
		    "SCF": 32.1809,
		    "Cloud": 98.3526,
		    "Age": 3.0171
		  },
		  {
		    "Year": 2005,
		    "Doy": 126,
		    "SCF": 32.1107,
		    "Cloud": 65.8644,
		    "Age": 2.67293
		  },
		  {
		    "Year": 2005,
		    "Doy": 127,
		    "SCF": 32.2059,
		    "Cloud": 64.7232,
		    "Age": 2.58068
		  },
		  {
		    "Year": 2005,
		    "Doy": 128,
		    "SCF": 31.0946,
		    "Cloud": 86.1896,
		    "Age": 3.12072
		  },
		  {
		    "Year": 2005,
		    "Doy": 129,
		    "SCF": 30.5666,
		    "Cloud": 82.9651,
		    "Age": 3.52443
		  },
		  {
		    "Year": 2005,
		    "Doy": 130,
		    "SCF": 30.2873,
		    "Cloud": 66.5117,
		    "Age": 2.97288
		  },
		  {
		    "Year": 2005,
		    "Doy": 131,
		    "SCF": 28.8057,
		    "Cloud": 28.7673,
		    "Age": 1.30532
		  },
		  {
		    "Year": 2005,
		    "Doy": 132,
		    "SCF": 27.5463,
		    "Cloud": 13.2071,
		    "Age": 0.357797
		  },
		  {
		    "Year": 2005,
		    "Doy": 133,
		    "SCF": 26.357,
		    "Cloud": 43.014,
		    "Age": 0.680759
		  },
		  {
		    "Year": 2005,
		    "Doy": 134,
		    "SCF": 25.555,
		    "Cloud": 35.8789,
		    "Age": 0.684643
		  },
		  {
		    "Year": 2005,
		    "Doy": 135,
		    "SCF": 25.4182,
		    "Cloud": 75.5034,
		    "Age": 1.37893
		  },
		  {
		    "Year": 2005,
		    "Doy": 136,
		    "SCF": 26.5725,
		    "Cloud": 93.1842,
		    "Age": 2.20395
		  },
		  {
		    "Year": 2005,
		    "Doy": 137,
		    "SCF": 24.5949,
		    "Cloud": 68.0518,
		    "Age": 2.30058
		  },
		  {
		    "Year": 2005,
		    "Doy": 138,
		    "SCF": 23.9299,
		    "Cloud": 62.5406,
		    "Age": 2.07471
		  },
		  {
		    "Year": 2005,
		    "Doy": 139,
		    "SCF": 18.4535,
		    "Cloud": 59.0655,
		    "Age": 1.90365
		  },
		  {
		    "Year": 2005,
		    "Doy": 140,
		    "SCF": 14.7395,
		    "Cloud": 97.8723,
		    "Age": 2.90296
		  },
		  {
		    "Year": 2005,
		    "Doy": 141,
		    "SCF": 14.7395,
		    "Cloud": 99.6823,
		    "Age": 3.89334
		  },
		  {
		    "Year": 2005,
		    "Doy": 142,
		    "SCF": 14.7278,
		    "Cloud": 97.2399,
		    "Age": 4.81008
		  },
		  {
		    "Year": 2005,
		    "Doy": 143,
		    "SCF": 14.7228,
		    "Cloud": 64.7222,
		    "Age": 3.78507
		  },
		  {
		    "Year": 2005,
		    "Doy": 144,
		    "SCF": 13.5085,
		    "Cloud": 73.0762,
		    "Age": 3.71165
		  },
		  {
		    "Year": 2005,
		    "Doy": 145,
		    "SCF": 13.1378,
		    "Cloud": 94.2338,
		    "Age": 4.4707
		  },
		  {
		    "Year": 2005,
		    "Doy": 146,
		    "SCF": 12.9089,
		    "Cloud": 99.3713,
		    "Age": 5.44274
		  },
		  {
		    "Year": 2005,
		    "Doy": 147,
		    "SCF": 12.804,
		    "Cloud": 33.1967,
		    "Age": 2.68507
		  },
		  {
		    "Year": 2005,
		    "Doy": 148,
		    "SCF": 12.1833,
		    "Cloud": 98.9486,
		    "Age": 3.66855
		  },
		  {
		    "Year": 2005,
		    "Doy": 149,
		    "SCF": 12.0161,
		    "Cloud": 72.5072,
		    "Age": 3.84962
		  },
		  {
		    "Year": 2005,
		    "Doy": 150,
		    "SCF": 12.1055,
		    "Cloud": 94.7655,
		    "Age": 4.68703
		  },
		  {
		    "Year": 2005,
		    "Doy": 151,
		    "SCF": 12.1711,
		    "Cloud": 99.809,
		    "Age": 5.68037
		  },
		  {
		    "Year": 2005,
		    "Doy": 152,
		    "SCF": 12.1719,
		    "Cloud": 50.4856,
		    "Age": 2.79826
		  },
		  {
		    "Year": 2005,
		    "Doy": 153,
		    "SCF": 8.82795,
		    "Cloud": 94.6491,
		    "Age": 3.6728
		  },
		  {
		    "Year": 2005,
		    "Doy": 154,
		    "SCF": 8.36994,
		    "Cloud": 98.7146,
		    "Age": 4.6197
		  },
		  {
		    "Year": 2005,
		    "Doy": 155,
		    "SCF": 7.57516,
		    "Cloud": 99.0746,
		    "Age": 5.57153
		  },
		  {
		    "Year": 2005,
		    "Doy": 156,
		    "SCF": 7.53825,
		    "Cloud": 94.6427,
		    "Age": 6.24785
		  },
		  {
		    "Year": 2005,
		    "Doy": 157,
		    "SCF": 7.16629,
		    "Cloud": 94.9194,
		    "Age": 6.96018
		  },
		  {
		    "Year": 2005,
		    "Doy": 158,
		    "SCF": 6.76596,
		    "Cloud": 73.1516,
		    "Age": 5.89495
		  },
		  {
		    "Year": 2005,
		    "Doy": 159,
		    "SCF": 6.8582,
		    "Cloud": 94.5503,
		    "Age": 6.55448
		  },
		  {
		    "Year": 2005,
		    "Doy": 160,
		    "SCF": 6.77659,
		    "Cloud": 60.7404,
		    "Age": 5.00171
		  },
		  {
		    "Year": 2005,
		    "Doy": 161,
		    "SCF": 7.0105,
		    "Cloud": 60.8346,
		    "Age": 4.33774
		  },
		  {
		    "Year": 2005,
		    "Doy": 162,
		    "SCF": 7.66004,
		    "Cloud": 83.6477,
		    "Age": 4.49633
		  },
		  {
		    "Year": 2005,
		    "Doy": 163,
		    "SCF": 6.08054,
		    "Cloud": 99.8936,
		    "Age": 5.4981
		  },
		  {
		    "Year": 2005,
		    "Doy": 164,
		    "SCF": 6.07764,
		    "Cloud": 99.0712,
		    "Age": 6.46444
		  },
		  {
		    "Year": 2005,
		    "Doy": 165,
		    "SCF": 5.86206,
		    "Cloud": 99.0174,
		    "Age": 7.4144
		  },
		  {
		    "Year": 2005,
		    "Doy": 166,
		    "SCF": 5.42506,
		    "Cloud": 86.7989,
		    "Age": 7.58751
		  },
		  {
		    "Year": 2005,
		    "Doy": 167,
		    "SCF": 5.3424,
		    "Cloud": 92.7253,
		    "Age": 8.24895
		  },
		  {
		    "Year": 2005,
		    "Doy": 168,
		    "SCF": 5.33989,
		    "Cloud": 96.465,
		    "Age": 8.94546
		  },
		  {
		    "Year": 2005,
		    "Doy": 169,
		    "SCF": 5.18341,
		    "Cloud": 13.041,
		    "Age": 1.81957
		  },
		  {
		    "Year": 2005,
		    "Doy": 170,
		    "SCF": 4.41688,
		    "Cloud": 18.8925,
		    "Age": 0.890867
		  },
		  {
		    "Year": 2005,
		    "Doy": 171,
		    "SCF": 3.51997,
		    "Cloud": 98.5116,
		    "Age": 1.87336
		  },
		  {
		    "Year": 2005,
		    "Doy": 172,
		    "SCF": 3.48309,
		    "Cloud": 45.096,
		    "Age": 1.47271
		  },
		  {
		    "Year": 2005,
		    "Doy": 173,
		    "SCF": 3.0255,
		    "Cloud": 57.6092,
		    "Age": 1.63068
		  },
		  {
		    "Year": 2005,
		    "Doy": 174,
		    "SCF": 3.11717,
		    "Cloud": 85.3457,
		    "Age": 2.2937
		  },
		  {
		    "Year": 2005,
		    "Doy": 175,
		    "SCF": 2.65614,
		    "Cloud": 79.1202,
		    "Age": 2.71926
		  },
		  {
		    "Year": 2005,
		    "Doy": 176,
		    "SCF": 2.50796,
		    "Cloud": 62.058,
		    "Age": 2.57698
		  },
		  {
		    "Year": 2005,
		    "Doy": 177,
		    "SCF": 2.45768,
		    "Cloud": 28.8248,
		    "Age": 1.56338
		  },
		  {
		    "Year": 2005,
		    "Doy": 178,
		    "SCF": 2.32865,
		    "Cloud": 28.4185,
		    "Age": 1.46368
		  },
		  {
		    "Year": 2005,
		    "Doy": 179,
		    "SCF": 2.38926,
		    "Cloud": 97.4435,
		    "Age": 2.41353
		  },
		  {
		    "Year": 2005,
		    "Doy": 180,
		    "SCF": 2.1286,
		    "Cloud": 2.1149,
		    "Age": 0.25481
		  },
		  {
		    "Year": 2005,
		    "Doy": 181,
		    "SCF": 1.87609,
		    "Cloud": 16.5259,
		    "Age": 0.329831
		  },
		  {
		    "Year": 2005,
		    "Doy": 182,
		    "SCF": 1.8232,
		    "Cloud": 93.314,
		    "Age": 1.25626
		  },
		  {
		    "Year": 2005,
		    "Doy": 183,
		    "SCF": 1.8459,
		    "Cloud": 87.1451,
		    "Age": 1.97636
		  },
		  {
		    "Year": 2005,
		    "Doy": 184,
		    "SCF": 1.57644,
		    "Cloud": 68.2915,
		    "Age": 2.08406
		  },
		  {
		    "Year": 2005,
		    "Doy": 185,
		    "SCF": 1.46851,
		    "Cloud": 99.4968,
		    "Age": 3.07476
		  },
		  {
		    "Year": 2005,
		    "Doy": 186,
		    "SCF": 1.44861,
		    "Cloud": 24.4155,
		    "Age": 1.11176
		  },
		  {
		    "Year": 2005,
		    "Doy": 187,
		    "SCF": 0.886873,
		    "Cloud": 86.11,
		    "Age": 1.91292
		  },
		  {
		    "Year": 2005,
		    "Doy": 188,
		    "SCF": 0.747556,
		    "Cloud": 35.4168,
		    "Age": 1.22212
		  },
		  {
		    "Year": 2005,
		    "Doy": 189,
		    "SCF": 0.621832,
		    "Cloud": 9.02808,
		    "Age": 0.251946
		  },
		  {
		    "Year": 2005,
		    "Doy": 190,
		    "SCF": 1.57935,
		    "Cloud": 39.9711,
		    "Age": 0.596977
		  },
		  {
		    "Year": 2005,
		    "Doy": 191,
		    "SCF": 2.24918,
		    "Cloud": 96.9758,
		    "Age": 1.5494
		  },
		  {
		    "Year": 2005,
		    "Doy": 192,
		    "SCF": 0.429726,
		    "Cloud": 6.70207,
		    "Age": 0.209319
		  },
		  {
		    "Year": 2005,
		    "Doy": 193,
		    "SCF": 0.411997,
		    "Cloud": 11.2529,
		    "Age": 0.17418
		  },
		  {
		    "Year": 2005,
		    "Doy": 194,
		    "SCF": 0.531673,
		    "Cloud": 23.8746,
		    "Age": 0.344496
		  },
		  {
		    "Year": 2005,
		    "Doy": 195,
		    "SCF": 0.751728,
		    "Cloud": 32.1763,
		    "Age": 0.561634
		  },
		  {
		    "Year": 2005,
		    "Doy": 196,
		    "SCF": 1.3786,
		    "Cloud": 99.7724,
		    "Age": 1.55899
		  },
		  {
		    "Year": 2005,
		    "Doy": 197,
		    "SCF": 1.36274,
		    "Cloud": 96.435,
		    "Age": 2.43478
		  },
		  {
		    "Year": 2005,
		    "Doy": 198,
		    "SCF": 1.34539,
		    "Cloud": 63.3749,
		    "Age": 2.08226
		  },
		  {
		    "Year": 2005,
		    "Doy": 199,
		    "SCF": 2.39332,
		    "Cloud": 50.358,
		    "Age": 1.23421
		  },
		  {
		    "Year": 2005,
		    "Doy": 200,
		    "SCF": 4.20867,
		    "Cloud": 87.7608,
		    "Age": 1.91228
		  },
		  {
		    "Year": 2005,
		    "Doy": 201,
		    "SCF": 4.25607,
		    "Cloud": 96.7595,
		    "Age": 2.81929
		  },
		  {
		    "Year": 2005,
		    "Doy": 202,
		    "SCF": 4.22053,
		    "Cloud": 76.9585,
		    "Age": 2.97889
		  },
		  {
		    "Year": 2005,
		    "Doy": 203,
		    "SCF": 5.20101,
		    "Cloud": 87.1482,
		    "Age": 3.47294
		  },
		  {
		    "Year": 2005,
		    "Doy": 204,
		    "SCF": 2.76495,
		    "Cloud": 59.6749,
		    "Age": 2.58713
		  },
		  {
		    "Year": 2005,
		    "Doy": 205,
		    "SCF": 3.29745,
		    "Cloud": 78.8795,
		    "Age": 3.08198
		  },
		  {
		    "Year": 2005,
		    "Doy": 206,
		    "SCF": 4.16309,
		    "Cloud": 99.0765,
		    "Age": 4.03582
		  },
		  {
		    "Year": 2005,
		    "Doy": 207,
		    "SCF": 3.71039,
		    "Cloud": 69.6885,
		    "Age": 3.49344
		  },
		  {
		    "Year": 2005,
		    "Doy": 208,
		    "SCF": 3.68463,
		    "Cloud": 71.6055,
		    "Age": 3.2348
		  },
		  {
		    "Year": 2005,
		    "Doy": 209,
		    "SCF": 0.676181,
		    "Cloud": 93.2745,
		    "Age": 4.01793
		  },
		  {
		    "Year": 2005,
		    "Doy": 210,
		    "SCF": 0.389655,
		    "Cloud": 32.3458,
		    "Age": 1.78395
		  },
		  {
		    "Year": 2005,
		    "Doy": 211,
		    "SCF": 0.430398,
		    "Cloud": 25.5451,
		    "Age": 0.680361
		  },
		  {
		    "Year": 2005,
		    "Doy": 212,
		    "SCF": 0.840071,
		    "Cloud": 92.3553,
		    "Age": 1.56827
		  },
		  {
		    "Year": 2005,
		    "Doy": 213,
		    "SCF": 0.760468,
		    "Cloud": 87.1229,
		    "Age": 2.27603
		  },
		  {
		    "Year": 2005,
		    "Doy": 214,
		    "SCF": 0.731419,
		    "Cloud": 30.8909,
		    "Age": 1.10563
		  },
		  {
		    "Year": 2005,
		    "Doy": 215,
		    "SCF": 1.17025,
		    "Cloud": 98.4428,
		    "Age": 2.0805
		  },
		  {
		    "Year": 2005,
		    "Doy": 216,
		    "SCF": 1.15822,
		    "Cloud": 52.7872,
		    "Age": 1.58859
		  },
		  {
		    "Year": 2005,
		    "Doy": 217,
		    "SCF": 1.10257,
		    "Cloud": 55.1101,
		    "Age": 1.54012
		  },
		  {
		    "Year": 2005,
		    "Doy": 218,
		    "SCF": 0.722841,
		    "Cloud": 99.3406,
		    "Age": 2.51194
		  },
		  {
		    "Year": 2005,
		    "Doy": 219,
		    "SCF": 0.689828,
		    "Cloud": 99.4033,
		    "Age": 3.48085
		  },
		  {
		    "Year": 2005,
		    "Doy": 220,
		    "SCF": 0.61642,
		    "Cloud": 99.6761,
		    "Age": 4.46415
		  },
		  {
		    "Year": 2005,
		    "Doy": 221,
		    "SCF": 0.581015,
		    "Cloud": 90.6388,
		    "Age": 4.85181
		  },
		  {
		    "Year": 2005,
		    "Doy": 222,
		    "SCF": 0.544663,
		    "Cloud": 78.8335,
		    "Age": 4.5382
		  },
		  {
		    "Year": 2005,
		    "Doy": 223,
		    "SCF": 0.528288,
		    "Cloud": 94.7537,
		    "Age": 5.20051
		  },
		  {
		    "Year": 2005,
		    "Doy": 224,
		    "SCF": 0.401438,
		    "Cloud": 95.685,
		    "Age": 5.98977
		  },
		  {
		    "Year": 2005,
		    "Doy": 225,
		    "SCF": 0.406014,
		    "Cloud": 71.9217,
		    "Age": 5.12707
		  },
		  {
		    "Year": 2005,
		    "Doy": 226,
		    "SCF": 0.488368,
		    "Cloud": 57.2529,
		    "Age": 3.66228
		  },
		  {
		    "Year": 2005,
		    "Doy": 227,
		    "SCF": 0.361113,
		    "Cloud": 46.766,
		    "Age": 2.24376
		  },
		  {
		    "Year": 2005,
		    "Doy": 228,
		    "SCF": 0.453277,
		    "Cloud": 37.4103,
		    "Age": 1.13836
		  },
		  {
		    "Year": 2005,
		    "Doy": 229,
		    "SCF": 0.438409,
		    "Cloud": 56.8641,
		    "Age": 1.49229
		  },
		  {
		    "Year": 2005,
		    "Doy": 230,
		    "SCF": 0.428613,
		    "Cloud": 47.2382,
		    "Age": 1.36919
		  },
		  {
		    "Year": 2005,
		    "Doy": 231,
		    "SCF": 0.404381,
		    "Cloud": 65.9404,
		    "Age": 1.47212
		  },
		  {
		    "Year": 2005,
		    "Doy": 232,
		    "SCF": 0.481135,
		    "Cloud": 62.1337,
		    "Age": 1.63844
		  },
		  {
		    "Year": 2005,
		    "Doy": 233,
		    "SCF": 0.517855,
		    "Cloud": 32.0759,
		    "Age": 0.709016
		  },
		  {
		    "Year": 2005,
		    "Doy": 234,
		    "SCF": 1.01623,
		    "Cloud": 88.2821,
		    "Age": 1.52831
		  },
		  {
		    "Year": 2005,
		    "Doy": 235,
		    "SCF": 1.00127,
		    "Cloud": 89.5712,
		    "Age": 2.28491
		  },
		  {
		    "Year": 2005,
		    "Doy": 236,
		    "SCF": 0.842114,
		    "Cloud": 74.0008,
		    "Age": 2.37483
		  },
		  {
		    "Year": 2005,
		    "Doy": 237,
		    "SCF": 0.926652,
		    "Cloud": 90.5281,
		    "Age": 3.01122
		  },
		  {
		    "Year": 2005,
		    "Doy": 238,
		    "SCF": 0.746579,
		    "Cloud": 23.215,
		    "Age": 0.933267
		  },
		  {
		    "Year": 2005,
		    "Doy": 239,
		    "SCF": 1.3509,
		    "Cloud": 65.0642,
		    "Age": 1.29152
		  },
		  {
		    "Year": 2005,
		    "Doy": 240,
		    "SCF": 1.28855,
		    "Cloud": 48.8539,
		    "Age": 1.30041
		  },
		  {
		    "Year": 2005,
		    "Doy": 241,
		    "SCF": 1.65698,
		    "Cloud": 40.2169,
		    "Age": 1.03697
		  },
		  {
		    "Year": 2005,
		    "Doy": 242,
		    "SCF": 0.704642,
		    "Cloud": 59.8956,
		    "Age": 1.35939
		  },
		  {
		    "Year": 2005,
		    "Doy": 243,
		    "SCF": 0.513409,
		    "Cloud": 2.94143,
		    "Age": 0.160889
		  },
		  {
		    "Year": 2005,
		    "Doy": 244,
		    "SCF": 0.351812,
		    "Cloud": 13.2699,
		    "Age": 0.186864
		  },
		  {
		    "Year": 2005,
		    "Doy": 245,
		    "SCF": 0.413278,
		    "Cloud": 99.9008,
		    "Age": 1.18568
		  },
		  {
		    "Year": 2005,
		    "Doy": 246,
		    "SCF": 0.407212,
		    "Cloud": 12.2483,
		    "Age": 0.303699
		  },
		  {
		    "Year": 2005,
		    "Doy": 247,
		    "SCF": 1.06494,
		    "Cloud": 98.2658,
		    "Age": 1.27328
		  },
		  {
		    "Year": 2005,
		    "Doy": 248,
		    "SCF": 0.942028,
		    "Cloud": 85.8377,
		    "Age": 1.99016
		  },
		  {
		    "Year": 2005,
		    "Doy": 249,
		    "SCF": 0.837677,
		    "Cloud": 31.5011,
		    "Age": 0.986444
		  },
		  {
		    "Year": 2005,
		    "Doy": 250,
		    "SCF": 1.54296,
		    "Cloud": 93.2523,
		    "Age": 1.83169
		  },
		  {
		    "Year": 2005,
		    "Doy": 251,
		    "SCF": 1.23896,
		    "Cloud": 91.8688,
		    "Age": 2.58892
		  },
		  {
		    "Year": 2005,
		    "Doy": 252,
		    "SCF": 0.382833,
		    "Cloud": 14.5828,
		    "Age": 0.668714
		  },
		  {
		    "Year": 2005,
		    "Doy": 253,
		    "SCF": 0.333674,
		    "Cloud": 5.73112,
		    "Age": 0.123037
		  },
		  {
		    "Year": 2005,
		    "Doy": 254,
		    "SCF": 0.576279,
		    "Cloud": 70.8658,
		    "Age": 0.80335
		  },
		  {
		    "Year": 2005,
		    "Doy": 255,
		    "SCF": 0.481883,
		    "Cloud": 8.44509,
		    "Age": 0.212287
		  },
		  {
		    "Year": 2005,
		    "Doy": 256,
		    "SCF": 2.13012,
		    "Cloud": 99.6136,
		    "Age": 1.2082
		  },
		  {
		    "Year": 2005,
		    "Doy": 257,
		    "SCF": 2.10075,
		    "Cloud": 95.5916,
		    "Age": 2.10902
		  },
		  {
		    "Year": 2005,
		    "Doy": 258,
		    "SCF": 1.86932,
		    "Cloud": 51.7864,
		    "Age": 1.65665
		  },
		  {
		    "Year": 2005,
		    "Doy": 259,
		    "SCF": 0.553618,
		    "Cloud": 38.8073,
		    "Age": 1.12928
		  },
		  {
		    "Year": 2005,
		    "Doy": 260,
		    "SCF": 0.540558,
		    "Cloud": 5.41259,
		    "Age": 0.244106
		  },
		  {
		    "Year": 2005,
		    "Doy": 261,
		    "SCF": 1.68225,
		    "Cloud": 83.1233,
		    "Age": 1.06105
		  },
		  {
		    "Year": 2005,
		    "Doy": 262,
		    "SCF": 1.95515,
		    "Cloud": 37.8096,
		    "Age": 0.798734
		  },
		  {
		    "Year": 2005,
		    "Doy": 263,
		    "SCF": 2.65124,
		    "Cloud": 83.361,
		    "Age": 1.52564
		  },
		  {
		    "Year": 2005,
		    "Doy": 264,
		    "SCF": 1.75962,
		    "Cloud": 86.1833,
		    "Age": 2.22806
		  },
		  {
		    "Year": 2005,
		    "Doy": 265,
		    "SCF": 1.69284,
		    "Cloud": 90.2752,
		    "Age": 2.92848
		  },
		  {
		    "Year": 2005,
		    "Doy": 266,
		    "SCF": 0.826947,
		    "Cloud": 94.1056,
		    "Age": 3.67122
		  },
		  {
		    "Year": 2005,
		    "Doy": 267,
		    "SCF": 0.808053,
		    "Cloud": 13.1101,
		    "Age": 0.698702
		  },
		  {
		    "Year": 2005,
		    "Doy": 268,
		    "SCF": 1.71837,
		    "Cloud": 99.9664,
		    "Age": 1.69807
		  },
		  {
		    "Year": 2005,
		    "Doy": 269,
		    "SCF": 1.70548,
		    "Cloud": 51.2636,
		    "Age": 1.54653
		  },
		  {
		    "Year": 2005,
		    "Doy": 270,
		    "SCF": 2.69777,
		    "Cloud": 98.9292,
		    "Age": 2.52483
		  },
		  {
		    "Year": 2005,
		    "Doy": 271,
		    "SCF": 2.24307,
		    "Cloud": 39.3438,
		    "Age": 1.41513
		  },
		  {
		    "Year": 2005,
		    "Doy": 272,
		    "SCF": 2.06704,
		    "Cloud": 98.9546,
		    "Age": 2.38581
		  },
		  {
		    "Year": 2005,
		    "Doy": 273,
		    "SCF": 1.62299,
		    "Cloud": 58.9021,
		    "Age": 1.97231
		  },
		  {
		    "Year": 2005,
		    "Doy": 274,
		    "SCF": 0.864058,
		    "Cloud": 72.0153,
		    "Age": 1.89032
		  },
		  {
		    "Year": 2005,
		    "Doy": 275,
		    "SCF": 0.639824,
		    "Cloud": 32.1567,
		    "Age": 1.10737
		  },
		  {
		    "Year": 2005,
		    "Doy": 276,
		    "SCF": 0.948345,
		    "Cloud": 50.5471,
		    "Age": 0.934619
		  },
		  {
		    "Year": 2005,
		    "Doy": 277,
		    "SCF": 0.531072,
		    "Cloud": 9.40626,
		    "Age": 0.28541
		  },
		  {
		    "Year": 2005,
		    "Doy": 278,
		    "SCF": 0.77982,
		    "Cloud": 25.0241,
		    "Age": 0.41527
		  },
		  {
		    "Year": 2005,
		    "Doy": 279,
		    "SCF": 1.50685,
		    "Cloud": 73.0423,
		    "Age": 1.06239
		  },
		  {
		    "Year": 2005,
		    "Doy": 280,
		    "SCF": 1.08513,
		    "Cloud": 57.0095,
		    "Age": 1.21358
		  },
		  {
		    "Year": 2005,
		    "Doy": 281,
		    "SCF": 0.892725,
		    "Cloud": 99.9737,
		    "Age": 2.21402
		  },
		  {
		    "Year": 2005,
		    "Doy": 282,
		    "SCF": 0.89096,
		    "Cloud": 6.83546,
		    "Age": 0.285618
		  },
		  {
		    "Year": 2005,
		    "Doy": 283,
		    "SCF": 1.40822,
		    "Cloud": 69.6279,
		    "Age": 0.839764
		  },
		  {
		    "Year": 2005,
		    "Doy": 284,
		    "SCF": 0.936916,
		    "Cloud": 51.3284,
		    "Age": 1.04407
		  },
		  {
		    "Year": 2005,
		    "Doy": 285,
		    "SCF": 0.980784,
		    "Cloud": 89.6113,
		    "Age": 1.91692
		  },
		  {
		    "Year": 2005,
		    "Doy": 286,
		    "SCF": 1.18767,
		    "Cloud": 98.5104,
		    "Age": 2.8721
		  },
		  {
		    "Year": 2005,
		    "Doy": 287,
		    "SCF": 0.969402,
		    "Cloud": 16.7245,
		    "Age": 0.57427
		  },
		  {
		    "Year": 2005,
		    "Doy": 288,
		    "SCF": 0.442226,
		    "Cloud": 9.59597,
		    "Age": 0.246499
		  },
		  {
		    "Year": 2005,
		    "Doy": 289,
		    "SCF": 0.377448,
		    "Cloud": 0.721368,
		    "Age": 0.0605861
		  },
		  {
		    "Year": 2005,
		    "Doy": 290,
		    "SCF": 3.34581,
		    "Cloud": 5.92175,
		    "Age": 0.100642
		  },
		  {
		    "Year": 2005,
		    "Doy": 291,
		    "SCF": 1.55915,
		    "Cloud": 4.18682,
		    "Age": 0.109915
		  },
		  {
		    "Year": 2005,
		    "Doy": 292,
		    "SCF": 3.69774,
		    "Cloud": 10.4111,
		    "Age": 0.201139
		  },
		  {
		    "Year": 2005,
		    "Doy": 293,
		    "SCF": 49.5038,
		    "Cloud": 73.1118,
		    "Age": 0.92555
		  },
		  {
		    "Year": 2005,
		    "Doy": 294,
		    "SCF": 71.5999,
		    "Cloud": 79.5654,
		    "Age": 1.48608
		  },
		  {
		    "Year": 2005,
		    "Doy": 295,
		    "SCF": 80.2535,
		    "Cloud": 91.9503,
		    "Age": 2.24676
		  },
		  {
		    "Year": 2005,
		    "Doy": 296,
		    "SCF": 78.8661,
		    "Cloud": 86.7813,
		    "Age": 2.82522
		  },
		  {
		    "Year": 2005,
		    "Doy": 297,
		    "SCF": 79.868,
		    "Cloud": 4.42345,
		    "Age": 0.174798
		  },
		  {
		    "Year": 2005,
		    "Doy": 298,
		    "SCF": 63.685,
		    "Cloud": 99.9942,
		    "Age": 1.17467
		  },
		  {
		    "Year": 2005,
		    "Doy": 299,
		    "SCF": 63.685,
		    "Cloud": 32.2338,
		    "Age": 0.784507
		  },
		  {
		    "Year": 2005,
		    "Doy": 300,
		    "SCF": 24.6113,
		    "Cloud": 99.8515,
		    "Age": 1.78149
		  },
		  {
		    "Year": 2005,
		    "Doy": 301,
		    "SCF": 24.5551,
		    "Cloud": 98.7492,
		    "Age": 2.73338
		  },
		  {
		    "Year": 2005,
		    "Doy": 302,
		    "SCF": 24.3862,
		    "Cloud": 98.9821,
		    "Age": 3.69497
		  },
		  {
		    "Year": 2005,
		    "Doy": 303,
		    "SCF": 23.7369,
		    "Cloud": 97.5229,
		    "Age": 4.58442
		  },
		  {
		    "Year": 2005,
		    "Doy": 304,
		    "SCF": 23.0516,
		    "Cloud": 96.4523,
		    "Age": 5.40867
		  },
		  {
		    "Year": 2005,
		    "Doy": 305,
		    "SCF": 20.9036,
		    "Cloud": 98.1445,
		    "Age": 6.28889
		  },
		  {
		    "Year": 2005,
		    "Doy": 306,
		    "SCF": 19.945,
		    "Cloud": 20.2208,
		    "Age": 1.64382
		  },
		  {
		    "Year": 2005,
		    "Doy": 307,
		    "SCF": 20.3344,
		    "Cloud": 99.9214,
		    "Age": 2.64271
		  },
		  {
		    "Year": 2005,
		    "Doy": 308,
		    "SCF": 20.279,
		    "Cloud": 97.8814,
		    "Age": 3.57808
		  },
		  {
		    "Year": 2005,
		    "Doy": 309,
		    "SCF": 19.3376,
		    "Cloud": 95.5085,
		    "Age": 4.38974
		  },
		  {
		    "Year": 2005,
		    "Doy": 310,
		    "SCF": 18.7983,
		    "Cloud": 55.196,
		    "Age": 3.08676
		  },
		  {
		    "Year": 2005,
		    "Doy": 311,
		    "SCF": 22.7182,
		    "Cloud": 44.9005,
		    "Age": 2.18639
		  },
		  {
		    "Year": 2005,
		    "Doy": 312,
		    "SCF": 26.8196,
		    "Cloud": 92.9826,
		    "Age": 2.97898
		  },
		  {
		    "Year": 2005,
		    "Doy": 313,
		    "SCF": 25.1029,
		    "Cloud": 98.4198,
		    "Age": 3.93274
		  },
		  {
		    "Year": 2005,
		    "Doy": 314,
		    "SCF": 24.6385,
		    "Cloud": 91.642,
		    "Age": 4.50396
		  },
		  {
		    "Year": 2005,
		    "Doy": 315,
		    "SCF": 22.4826,
		    "Cloud": 91.7206,
		    "Age": 5.04733
		  },
		  {
		    "Year": 2005,
		    "Doy": 316,
		    "SCF": 22.3281,
		    "Cloud": 41.4767,
		    "Age": 2.6288
		  },
		  {
		    "Year": 2005,
		    "Doy": 317,
		    "SCF": 23.6468,
		    "Cloud": 82.064,
		    "Age": 2.83106
		  },
		  {
		    "Year": 2005,
		    "Doy": 318,
		    "SCF": 22.0434,
		    "Cloud": 99.7478,
		    "Age": 3.83094
		  },
		  {
		    "Year": 2005,
		    "Doy": 319,
		    "SCF": 22.0434,
		    "Cloud": 61.2523,
		    "Age": 2.97331
		  },
		  {
		    "Year": 2005,
		    "Doy": 320,
		    "SCF": 23.7536,
		    "Cloud": 27.1882,
		    "Age": 1.29279
		  },
		  {
		    "Year": 2005,
		    "Doy": 321,
		    "SCF": 22.7474,
		    "Cloud": 24.7529,
		    "Age": 0.703522
		  },
		  {
		    "Year": 2005,
		    "Doy": 322,
		    "SCF": 31.891,
		    "Cloud": 9.64022,
		    "Age": 0.354276
		  },
		  {
		    "Year": 2005,
		    "Doy": 323,
		    "SCF": 44.3146,
		    "Cloud": 81.6913,
		    "Age": 1.15086
		  },
		  {
		    "Year": 2005,
		    "Doy": 324,
		    "SCF": 51.1582,
		    "Cloud": 80.989,
		    "Age": 1.76348
		  },
		  {
		    "Year": 2005,
		    "Doy": 325,
		    "SCF": 61.0706,
		    "Cloud": 99.9884,
		    "Age": 2.7624
		  },
		  {
		    "Year": 2005,
		    "Doy": 326,
		    "SCF": 61.0735,
		    "Cloud": 73.4607,
		    "Age": 2.70496
		  },
		  {
		    "Year": 2005,
		    "Doy": 327,
		    "SCF": 74.0542,
		    "Cloud": 81.5526,
		    "Age": 2.95341
		  },
		  {
		    "Year": 2005,
		    "Doy": 328,
		    "SCF": 82.9794,
		    "Cloud": 98.7507,
		    "Age": 3.91936
		  },
		  {
		    "Year": 2005,
		    "Doy": 329,
		    "SCF": 83.6284,
		    "Cloud": 88.2855,
		    "Age": 4.40458
		  },
		  {
		    "Year": 2005,
		    "Doy": 330,
		    "SCF": 84.4484,
		    "Cloud": 86.4749,
		    "Age": 4.50159
		  },
		  {
		    "Year": 2005,
		    "Doy": 331,
		    "SCF": 84.7623,
		    "Cloud": 98.3994,
		    "Age": 5.414
		  },
		  {
		    "Year": 2005,
		    "Doy": 332,
		    "SCF": 84.6632,
		    "Cloud": 24.4813,
		    "Age": 1.58359
		  },
		  {
		    "Year": 2005,
		    "Doy": 333,
		    "SCF": 81.4792,
		    "Cloud": 52.3153,
		    "Age": 1.30017
		  },
		  {
		    "Year": 2005,
		    "Doy": 334,
		    "SCF": 75.8502,
		    "Cloud": 48.1757,
		    "Age": 1.18214
		  },
		  {
		    "Year": 2005,
		    "Doy": 335,
		    "SCF": 74.1397,
		    "Cloud": 83.8689,
		    "Age": 1.8671
		  },
		  {
		    "Year": 2005,
		    "Doy": 336,
		    "SCF": 75.6015,
		    "Cloud": 98.9439,
		    "Age": 2.83764
		  },
		  {
		    "Year": 2005,
		    "Doy": 337,
		    "SCF": 75.6395,
		    "Cloud": 94.7922,
		    "Age": 3.64191
		  },
		  {
		    "Year": 2005,
		    "Doy": 338,
		    "SCF": 76.4659,
		    "Cloud": 99.9956,
		    "Age": 4.64202
		  },
		  {
		    "Year": 2005,
		    "Doy": 339,
		    "SCF": 76.4659,
		    "Cloud": 92.399,
		    "Age": 5.18402
		  },
		  {
		    "Year": 2005,
		    "Doy": 340,
		    "SCF": 77.1353,
		    "Cloud": 96.1313,
		    "Age": 5.93416
		  },
		  {
		    "Year": 2005,
		    "Doy": 341,
		    "SCF": 77.4294,
		    "Cloud": 80.7116,
		    "Age": 5.65236
		  },
		  {
		    "Year": 2005,
		    "Doy": 342,
		    "SCF": 77.4223,
		    "Cloud": 90.6397,
		    "Age": 6.03707
		  },
		  {
		    "Year": 2005,
		    "Doy": 343,
		    "SCF": 78.1021,
		    "Cloud": 80.3101,
		    "Age": 5.6343
		  },
		  {
		    "Year": 2005,
		    "Doy": 344,
		    "SCF": 75.836,
		    "Cloud": 86.2733,
		    "Age": 5.70128
		  },
		  {
		    "Year": 2005,
		    "Doy": 345,
		    "SCF": 76.4328,
		    "Cloud": 93.2373,
		    "Age": 6.41757
		  },
		  {
		    "Year": 2005,
		    "Doy": 346,
		    "SCF": 77.1099,
		    "Cloud": 21.8436,
		    "Age": 1.48191
		  },
		  {
		    "Year": 2005,
		    "Doy": 347,
		    "SCF": 74.9543,
		    "Cloud": 100,
		    "Age": 2.47948
		  },
		  {
		    "Year": 2005,
		    "Doy": 348,
		    "SCF": 74.9543,
		    "Cloud": 72.2746,
		    "Age": 2.42516
		  },
		  {
		    "Year": 2005,
		    "Doy": 349,
		    "SCF": 76.1044,
		    "Cloud": 54.3233,
		    "Age": 1.97675
		  },
		  {
		    "Year": 2005,
		    "Doy": 350,
		    "SCF": 75.6064,
		    "Cloud": 56.3362,
		    "Age": 1.9862
		  },
		  {
		    "Year": 2005,
		    "Doy": 351,
		    "SCF": 76.264,
		    "Cloud": 55.4826,
		    "Age": 1.73601
		  },
		  {
		    "Year": 2005,
		    "Doy": 352,
		    "SCF": 77.6546,
		    "Cloud": 39.0779,
		    "Age": 1.0671
		  },
		  {
		    "Year": 2005,
		    "Doy": 353,
		    "SCF": 79.7387,
		    "Cloud": 79.2044,
		    "Age": 1.5374
		  },
		  {
		    "Year": 2005,
		    "Doy": 354,
		    "SCF": 79.887,
		    "Cloud": 31.1741,
		    "Age": 0.956941
		  },
		  {
		    "Year": 2005,
		    "Doy": 355,
		    "SCF": 76.7538,
		    "Cloud": 83.6767,
		    "Age": 1.76575
		  },
		  {
		    "Year": 2005,
		    "Doy": 356,
		    "SCF": 78.3238,
		    "Cloud": 65.6753,
		    "Age": 1.84804
		  },
		  {
		    "Year": 2005,
		    "Doy": 357,
		    "SCF": 77.9775,
		    "Cloud": 57.7143,
		    "Age": 2.11376
		  },
		  {
		    "Year": 2005,
		    "Doy": 358,
		    "SCF": 77.3324,
		    "Cloud": 54.9678,
		    "Age": 1.84922
		  },
		  {
		    "Year": 2005,
		    "Doy": 359,
		    "SCF": 78.3264,
		    "Cloud": 24.7112,
		    "Age": 1.12636
		  },
		  {
		    "Year": 2005,
		    "Doy": 360,
		    "SCF": 81.0214,
		    "Cloud": 66.7636,
		    "Age": 1.2961
		  },
		  {
		    "Year": 2005,
		    "Doy": 361,
		    "SCF": 82.2043,
		    "Cloud": 48.9606,
		    "Age": 1.22029
		  },
		  {
		    "Year": 2005,
		    "Doy": 362,
		    "SCF": 82.0125,
		    "Cloud": 89.341,
		    "Age": 1.94059
		  },
		  {
		    "Year": 2005,
		    "Doy": 363,
		    "SCF": 82.8122,
		    "Cloud": 97.4492,
		    "Age": 2.89016
		  },
		  {
		    "Year": 2005,
		    "Doy": 364,
		    "SCF": 83.1437,
		    "Cloud": 69.9577,
		    "Age": 2.73767
		  },
		  {
		    "Year": 2005,
		    "Doy": 365,
		    "SCF": 85.5528,
		    "Cloud": 98.7246,
		    "Age": 3.66434
		  },
		  {
		    "Year": 2006,
		    "Doy": 1,
		    "SCF": 85.867,
		    "Cloud": 82.4365,
		    "Age": 0.825049
		  },
		  {
		    "Year": 2006,
		    "Doy": 2,
		    "SCF": 87.6275,
		    "Cloud": 32.198,
		    "Age": 0.588799
		  },
		  {
		    "Year": 2006,
		    "Doy": 3,
		    "SCF": 88.7576,
		    "Cloud": 52.727,
		    "Age": 0.906001
		  },
		  {
		    "Year": 2006,
		    "Doy": 4,
		    "SCF": 86.4029,
		    "Cloud": 30.4977,
		    "Age": 0.696666
		  },
		  {
		    "Year": 2006,
		    "Doy": 5,
		    "SCF": 86.012,
		    "Cloud": 88.2612,
		    "Age": 1.53424
		  },
		  {
		    "Year": 2006,
		    "Doy": 6,
		    "SCF": 86.363,
		    "Cloud": 56.633,
		    "Age": 1.52703
		  },
		  {
		    "Year": 2006,
		    "Doy": 7,
		    "SCF": 88.3788,
		    "Cloud": 42.922,
		    "Age": 1.5853
		  },
		  {
		    "Year": 2006,
		    "Doy": 8,
		    "SCF": 89.357,
		    "Cloud": 34.7917,
		    "Age": 1.65585
		  },
		  {
		    "Year": 2006,
		    "Doy": 9,
		    "SCF": 85.3798,
		    "Cloud": 48.2961,
		    "Age": 2.02231
		  },
		  {
		    "Year": 2006,
		    "Doy": 10,
		    "SCF": 80.5208,
		    "Cloud": 75.888,
		    "Age": 2.47532
		  },
		  {
		    "Year": 2006,
		    "Doy": 11,
		    "SCF": 79.8956,
		    "Cloud": 84.3114,
		    "Age": 3.12211
		  },
		  {
		    "Year": 2006,
		    "Doy": 12,
		    "SCF": 79.5957,
		    "Cloud": 47.756,
		    "Age": 1.79153
		  },
		  {
		    "Year": 2006,
		    "Doy": 13,
		    "SCF": 85.5998,
		    "Cloud": 99.9971,
		    "Age": 2.79025
		  },
		  {
		    "Year": 2006,
		    "Doy": 14,
		    "SCF": 85.5998,
		    "Cloud": 99.9826,
		    "Age": 3.79008
		  },
		  {
		    "Year": 2006,
		    "Doy": 15,
		    "SCF": 85.602,
		    "Cloud": 88.4292,
		    "Age": 4.29426
		  },
		  {
		    "Year": 2006,
		    "Doy": 16,
		    "SCF": 86.6913,
		    "Cloud": 99.9709,
		    "Age": 5.29331
		  },
		  {
		    "Year": 2006,
		    "Doy": 17,
		    "SCF": 86.6952,
		    "Cloud": 97.5091,
		    "Age": 6.13964
		  },
		  {
		    "Year": 2006,
		    "Doy": 18,
		    "SCF": 87.1339,
		    "Cloud": 97.5048,
		    "Age": 6.98176
		  },
		  {
		    "Year": 2006,
		    "Doy": 19,
		    "SCF": 87.5185,
		    "Cloud": 100,
		    "Age": 7.98176
		  },
		  {
		    "Year": 2006,
		    "Doy": 20,
		    "SCF": 87.5185,
		    "Cloud": 99.9637,
		    "Age": 8.98176
		  },
		  {
		    "Year": 2006,
		    "Doy": 21,
		    "SCF": 87.5185,
		    "Cloud": 46.9939,
		    "Age": 4.82885
		  },
		  {
		    "Year": 2006,
		    "Doy": 22,
		    "SCF": 87.8939,
		    "Cloud": 99.9913,
		    "Age": 5.8299
		  },
		  {
		    "Year": 2006,
		    "Doy": 23,
		    "SCF": 87.8939,
		    "Cloud": 99.9985,
		    "Age": 6.8299
		  },
		  {
		    "Year": 2006,
		    "Doy": 24,
		    "SCF": 87.8939,
		    "Cloud": 94.35,
		    "Age": 7.33608
		  },
		  {
		    "Year": 2006,
		    "Doy": 25,
		    "SCF": 88.2498,
		    "Cloud": 15.6733,
		    "Age": 1.7292
		  },
		  {
		    "Year": 2006,
		    "Doy": 26,
		    "SCF": 89.6557,
		    "Cloud": 11.8103,
		    "Age": 0.940476
		  },
		  {
		    "Year": 2006,
		    "Doy": 27,
		    "SCF": 90.0691,
		    "Cloud": 7.76477,
		    "Age": 0.491459
		  },
		  {
		    "Year": 2006,
		    "Doy": 28,
		    "SCF": 86.2706,
		    "Cloud": 30.1511,
		    "Age": 0.72205
		  },
		  {
		    "Year": 2006,
		    "Doy": 29,
		    "SCF": 85.8951,
		    "Cloud": 94.8308,
		    "Age": 1.64536
		  },
		  {
		    "Year": 2006,
		    "Doy": 30,
		    "SCF": 86.5083,
		    "Cloud": 99.8313,
		    "Age": 2.64121
		  },
		  {
		    "Year": 2006,
		    "Doy": 31,
		    "SCF": 86.5156,
		    "Cloud": 13.016,
		    "Age": 0.661431
		  },
		  {
		    "Year": 2006,
		    "Doy": 32,
		    "SCF": 84.2204,
		    "Cloud": 19.398,
		    "Age": 0.595021
		  },
		  {
		    "Year": 2006,
		    "Doy": 33,
		    "SCF": 85.5732,
		    "Cloud": 90.137,
		    "Age": 1.47201
		  },
		  {
		    "Year": 2006,
		    "Doy": 34,
		    "SCF": 86.9214,
		    "Cloud": 72.8739,
		    "Age": 1.72264
		  },
		  {
		    "Year": 2006,
		    "Doy": 35,
		    "SCF": 88.6249,
		    "Cloud": 98.7985,
		    "Age": 2.68803
		  },
		  {
		    "Year": 2006,
		    "Doy": 36,
		    "SCF": 88.7676,
		    "Cloud": 99.9898,
		    "Age": 3.68803
		  },
		  {
		    "Year": 2006,
		    "Doy": 37,
		    "SCF": 88.7676,
		    "Cloud": 99.9986,
		    "Age": 4.68798
		  },
		  {
		    "Year": 2006,
		    "Doy": 38,
		    "SCF": 88.7675,
		    "Cloud": 86.1534,
		    "Age": 4.91456
		  },
		  {
		    "Year": 2006,
		    "Doy": 39,
		    "SCF": 89.2466,
		    "Cloud": 99.955,
		    "Age": 5.91114
		  },
		  {
		    "Year": 2006,
		    "Doy": 40,
		    "SCF": 89.2408,
		    "Cloud": 81.8095,
		    "Age": 5.63388
		  },
		  {
		    "Year": 2006,
		    "Doy": 41,
		    "SCF": 91.6642,
		    "Cloud": 5.76655,
		    "Age": 0.472613
		  },
		  {
		    "Year": 2006,
		    "Doy": 42,
		    "SCF": 89.3873,
		    "Cloud": 32.761,
		    "Age": 0.486335
		  },
		  {
		    "Year": 2006,
		    "Doy": 43,
		    "SCF": 95.0896,
		    "Cloud": 9.06451,
		    "Age": 0.204786
		  },
		  {
		    "Year": 2006,
		    "Doy": 44,
		    "SCF": 91.1622,
		    "Cloud": 12.3412,
		    "Age": 0.241307
		  },
		  {
		    "Year": 2006,
		    "Doy": 45,
		    "SCF": 92.7755,
		    "Cloud": 99.5441,
		    "Age": 1.23117
		  },
		  {
		    "Year": 2006,
		    "Doy": 46,
		    "SCF": 92.8399,
		    "Cloud": 99.5746,
		    "Age": 2.21999
		  },
		  {
		    "Year": 2006,
		    "Doy": 47,
		    "SCF": 92.9958,
		    "Cloud": 98.5322,
		    "Age": 3.16906
		  },
		  {
		    "Year": 2006,
		    "Doy": 48,
		    "SCF": 93.3899,
		    "Cloud": 98.088,
		    "Age": 4.08739
		  },
		  {
		    "Year": 2006,
		    "Doy": 49,
		    "SCF": 93.6872,
		    "Cloud": 89.4932,
		    "Age": 4.5533
		  },
		  {
		    "Year": 2006,
		    "Doy": 50,
		    "SCF": 95.3862,
		    "Cloud": 83.9414,
		    "Age": 4.58857
		  },
		  {
		    "Year": 2006,
		    "Doy": 51,
		    "SCF": 95.6994,
		    "Cloud": 9.70397,
		    "Age": 0.629727
		  },
		  {
		    "Year": 2006,
		    "Doy": 52,
		    "SCF": 93.2465,
		    "Cloud": 21.6214,
		    "Age": 0.32963
		  },
		  {
		    "Year": 2006,
		    "Doy": 53,
		    "SCF": 89.571,
		    "Cloud": 98.7061,
		    "Age": 1.31594
		  },
		  {
		    "Year": 2006,
		    "Doy": 54,
		    "SCF": 89.6716,
		    "Cloud": 41.6488,
		    "Age": 1.04468
		  },
		  {
		    "Year": 2006,
		    "Doy": 55,
		    "SCF": 89.138,
		    "Cloud": 34.7149,
		    "Age": 0.629498
		  },
		  {
		    "Year": 2006,
		    "Doy": 56,
		    "SCF": 88.431,
		    "Cloud": 46.1154,
		    "Age": 0.69815
		  },
		  {
		    "Year": 2006,
		    "Doy": 57,
		    "SCF": 84.1739,
		    "Cloud": 59.9919,
		    "Age": 1.0244
		  },
		  {
		    "Year": 2006,
		    "Doy": 58,
		    "SCF": 85.7537,
		    "Cloud": 99.7506,
		    "Age": 2.02078
		  },
		  {
		    "Year": 2006,
		    "Doy": 59,
		    "SCF": 85.792,
		    "Cloud": 99.9986,
		    "Age": 3.02078
		  },
		  {
		    "Year": 2006,
		    "Doy": 60,
		    "SCF": 85.792,
		    "Cloud": 96.9429,
		    "Age": 3.90694
		  },
		  {
		    "Year": 2006,
		    "Doy": 61,
		    "SCF": 86.0152,
		    "Cloud": 99.8477,
		    "Age": 4.89877
		  },
		  {
		    "Year": 2006,
		    "Doy": 62,
		    "SCF": 86.0388,
		    "Cloud": 97.8029,
		    "Age": 5.77353
		  },
		  {
		    "Year": 2006,
		    "Doy": 63,
		    "SCF": 86.2192,
		    "Cloud": 51.6112,
		    "Age": 3.46606
		  },
		  {
		    "Year": 2006,
		    "Doy": 64,
		    "SCF": 86.4565,
		    "Cloud": 44.9495,
		    "Age": 2.33265
		  },
		  {
		    "Year": 2006,
		    "Doy": 65,
		    "SCF": 88.9558,
		    "Cloud": 77.5312,
		    "Age": 2.65386
		  },
		  {
		    "Year": 2006,
		    "Doy": 66,
		    "SCF": 90.3208,
		    "Cloud": 5.33998,
		    "Age": 0.42559
		  },
		  {
		    "Year": 2006,
		    "Doy": 67,
		    "SCF": 85.4213,
		    "Cloud": 74.5452,
		    "Age": 1.13108
		  },
		  {
		    "Year": 2006,
		    "Doy": 68,
		    "SCF": 84.3205,
		    "Cloud": 94.6571,
		    "Age": 2.04511
		  },
		  {
		    "Year": 2006,
		    "Doy": 69,
		    "SCF": 84.7095,
		    "Cloud": 67.3165,
		    "Age": 2.19378
		  },
		  {
		    "Year": 2006,
		    "Doy": 70,
		    "SCF": 84.7132,
		    "Cloud": 42.5726,
		    "Age": 1.2734
		  },
		  {
		    "Year": 2006,
		    "Doy": 71,
		    "SCF": 85.2286,
		    "Cloud": 10.3467,
		    "Age": 0.362179
		  },
		  {
		    "Year": 2006,
		    "Doy": 72,
		    "SCF": 93.8696,
		    "Cloud": 1.28863,
		    "Age": 0.0650403
		  },
		  {
		    "Year": 2006,
		    "Doy": 73,
		    "SCF": 91.1363,
		    "Cloud": 15.0359,
		    "Age": 0.207761
		  },
		  {
		    "Year": 2006,
		    "Doy": 74,
		    "SCF": 85.89,
		    "Cloud": 48.5135,
		    "Age": 0.614054
		  },
		  {
		    "Year": 2006,
		    "Doy": 75,
		    "SCF": 90.1939,
		    "Cloud": 5.13415,
		    "Age": 0.15272
		  },
		  {
		    "Year": 2006,
		    "Doy": 76,
		    "SCF": 86.6288,
		    "Cloud": 11.497,
		    "Age": 0.172796
		  },
		  {
		    "Year": 2006,
		    "Doy": 77,
		    "SCF": 93.4694,
		    "Cloud": 99.9899,
		    "Age": 1.17281
		  },
		  {
		    "Year": 2006,
		    "Doy": 78,
		    "SCF": 93.4694,
		    "Cloud": 19.1682,
		    "Age": 0.41172
		  },
		  {
		    "Year": 2006,
		    "Doy": 79,
		    "SCF": 93.5671,
		    "Cloud": 27.5476,
		    "Age": 0.366987
		  },
		  {
		    "Year": 2006,
		    "Doy": 80,
		    "SCF": 90.1627,
		    "Cloud": 40.1757,
		    "Age": 0.549491
		  },
		  {
		    "Year": 2006,
		    "Doy": 81,
		    "SCF": 89.2044,
		    "Cloud": 38.8748,
		    "Age": 0.71406
		  },
		  {
		    "Year": 2006,
		    "Doy": 82,
		    "SCF": 91.3946,
		    "Cloud": 24.2241,
		    "Age": 0.548412
		  },
		  {
		    "Year": 2006,
		    "Doy": 83,
		    "SCF": 90.7573,
		    "Cloud": 12.1316,
		    "Age": 0.333623
		  },
		  {
		    "Year": 2006,
		    "Doy": 84,
		    "SCF": 96.3475,
		    "Cloud": 0.375455,
		    "Age": 0.0113216
		  },
		  {
		    "Year": 2006,
		    "Doy": 85,
		    "SCF": 92.6146,
		    "Cloud": 99.9898,
		    "Age": 1.01133
		  },
		  {
		    "Year": 2006,
		    "Doy": 86,
		    "SCF": 92.6146,
		    "Cloud": 92.7742,
		    "Age": 1.86535
		  },
		  {
		    "Year": 2006,
		    "Doy": 87,
		    "SCF": 92.8647,
		    "Cloud": 99.6766,
		    "Age": 2.85577
		  },
		  {
		    "Year": 2006,
		    "Doy": 88,
		    "SCF": 92.8775,
		    "Cloud": 91.0656,
		    "Age": 3.50858
		  },
		  {
		    "Year": 2006,
		    "Doy": 89,
		    "SCF": 93.5406,
		    "Cloud": 67.3416,
		    "Age": 3.01069
		  },
		  {
		    "Year": 2006,
		    "Doy": 90,
		    "SCF": 93.5194,
		    "Cloud": 99.3345,
		    "Age": 3.97909
		  },
		  {
		    "Year": 2006,
		    "Doy": 91,
		    "SCF": 93.5266,
		    "Cloud": 4.78876,
		    "Age": 0.242831
		  },
		  {
		    "Year": 2006,
		    "Doy": 92,
		    "SCF": 89.9008,
		    "Cloud": 98.7032,
		    "Age": 1.23002
		  },
		  {
		    "Year": 2006,
		    "Doy": 93,
		    "SCF": 90.0505,
		    "Cloud": 99.4525,
		    "Age": 2.21961
		  },
		  {
		    "Year": 2006,
		    "Doy": 94,
		    "SCF": 90.0547,
		    "Cloud": 99.4642,
		    "Age": 3.20311
		  },
		  {
		    "Year": 2006,
		    "Doy": 95,
		    "SCF": 90.1305,
		    "Cloud": 86.3877,
		    "Age": 3.60345
		  },
		  {
		    "Year": 2006,
		    "Doy": 96,
		    "SCF": 90.4546,
		    "Cloud": 75.507,
		    "Age": 3.36854
		  },
		  {
		    "Year": 2006,
		    "Doy": 97,
		    "SCF": 92.7442,
		    "Cloud": 99.3027,
		    "Age": 4.34436
		  },
		  {
		    "Year": 2006,
		    "Doy": 98,
		    "SCF": 92.7886,
		    "Cloud": 99.9492,
		    "Age": 5.34166
		  },
		  {
		    "Year": 2006,
		    "Doy": 99,
		    "SCF": 92.7983,
		    "Cloud": 98.1753,
		    "Age": 6.25413
		  },
		  {
		    "Year": 2006,
		    "Doy": 100,
		    "SCF": 92.9106,
		    "Cloud": 25.1075,
		    "Age": 1.73201
		  },
		  {
		    "Year": 2006,
		    "Doy": 101,
		    "SCF": 88.5013,
		    "Cloud": 83.0929,
		    "Age": 2.17092
		  },
		  {
		    "Year": 2006,
		    "Doy": 102,
		    "SCF": 89.9784,
		    "Cloud": 98.2406,
		    "Age": 3.11147
		  },
		  {
		    "Year": 2006,
		    "Doy": 103,
		    "SCF": 90.168,
		    "Cloud": 99.9826,
		    "Age": 4.11078
		  },
		  {
		    "Year": 2006,
		    "Doy": 104,
		    "SCF": 90.1711,
		    "Cloud": 64.3422,
		    "Age": 3.2207
		  },
		  {
		    "Year": 2006,
		    "Doy": 105,
		    "SCF": 90.3624,
		    "Cloud": 95.6168,
		    "Age": 3.97479
		  },
		  {
		    "Year": 2006,
		    "Doy": 106,
		    "SCF": 90.0379,
		    "Cloud": 98.3248,
		    "Age": 4.88413
		  },
		  {
		    "Year": 2006,
		    "Doy": 107,
		    "SCF": 89.5475,
		    "Cloud": 87.4564,
		    "Age": 5.11521
		  },
		  {
		    "Year": 2006,
		    "Doy": 108,
		    "SCF": 89.7013,
		    "Cloud": 76.2906,
		    "Age": 4.6869
		  },
		  {
		    "Year": 2006,
		    "Doy": 109,
		    "SCF": 91.9558,
		    "Cloud": 30.2503,
		    "Age": 2.11212
		  },
		  {
		    "Year": 2006,
		    "Doy": 110,
		    "SCF": 86.19,
		    "Cloud": 32.3121,
		    "Age": 0.757357
		  },
		  {
		    "Year": 2006,
		    "Doy": 111,
		    "SCF": 86.1988,
		    "Cloud": 52.6671,
		    "Age": 0.963833
		  },
		  {
		    "Year": 2006,
		    "Doy": 112,
		    "SCF": 86.5763,
		    "Cloud": 41.6888,
		    "Age": 0.863596
		  },
		  {
		    "Year": 2006,
		    "Doy": 113,
		    "SCF": 82.5964,
		    "Cloud": 99.9826,
		    "Age": 1.86363
		  },
		  {
		    "Year": 2006,
		    "Doy": 114,
		    "SCF": 82.5951,
		    "Cloud": 11.864,
		    "Age": 0.276047
		  },
		  {
		    "Year": 2006,
		    "Doy": 115,
		    "SCF": 72.9591,
		    "Cloud": 99.9826,
		    "Age": 1.27592
		  },
		  {
		    "Year": 2006,
		    "Doy": 116,
		    "SCF": 72.959,
		    "Cloud": 98.3743,
		    "Age": 2.24408
		  },
		  {
		    "Year": 2006,
		    "Doy": 117,
		    "SCF": 72.9353,
		    "Cloud": 44.3165,
		    "Age": 1.5497
		  },
		  {
		    "Year": 2006,
		    "Doy": 118,
		    "SCF": 70.0696,
		    "Cloud": 55.6706,
		    "Age": 1.42181
		  },
		  {
		    "Year": 2006,
		    "Doy": 119,
		    "SCF": 65.9481,
		    "Cloud": 99.8035,
		    "Age": 2.42124
		  },
		  {
		    "Year": 2006,
		    "Doy": 120,
		    "SCF": 65.9486,
		    "Cloud": 90.6104,
		    "Age": 3.17746
		  },
		  {
		    "Year": 2006,
		    "Doy": 121,
		    "SCF": 65.5625,
		    "Cloud": 100,
		    "Age": 4.17746
		  },
		  {
		    "Year": 2006,
		    "Doy": 122,
		    "SCF": 65.5625,
		    "Cloud": 99.6608,
		    "Age": 5.16077
		  },
		  {
		    "Year": 2006,
		    "Doy": 123,
		    "SCF": 65.5017,
		    "Cloud": 98.4218,
		    "Age": 6.10879
		  },
		  {
		    "Year": 2006,
		    "Doy": 124,
		    "SCF": 65.4721,
		    "Cloud": 61.9363,
		    "Age": 4.22515
		  },
		  {
		    "Year": 2006,
		    "Doy": 125,
		    "SCF": 65.3229,
		    "Cloud": 1.98662,
		    "Age": 0.114227
		  },
		  {
		    "Year": 2006,
		    "Doy": 126,
		    "SCF": 56.8642,
		    "Cloud": 13.4488,
		    "Age": 0.173431
		  },
		  {
		    "Year": 2006,
		    "Doy": 127,
		    "SCF": 54.5579,
		    "Cloud": 8.8851,
		    "Age": 0.12926
		  },
		  {
		    "Year": 2006,
		    "Doy": 128,
		    "SCF": 45.252,
		    "Cloud": 10.3735,
		    "Age": 0.147052
		  },
		  {
		    "Year": 2006,
		    "Doy": 129,
		    "SCF": 39.3128,
		    "Cloud": 16.3117,
		    "Age": 0.256222
		  },
		  {
		    "Year": 2006,
		    "Doy": 130,
		    "SCF": 36.2047,
		    "Cloud": 27.715,
		    "Age": 0.420392
		  },
		  {
		    "Year": 2006,
		    "Doy": 131,
		    "SCF": 31.7522,
		    "Cloud": 15.4496,
		    "Age": 0.317313
		  },
		  {
		    "Year": 2006,
		    "Doy": 132,
		    "SCF": 28.3506,
		    "Cloud": 45.4584,
		    "Age": 0.666133
		  },
		  {
		    "Year": 2006,
		    "Doy": 133,
		    "SCF": 24.8416,
		    "Cloud": 64.8216,
		    "Age": 1.17387
		  },
		  {
		    "Year": 2006,
		    "Doy": 134,
		    "SCF": 23.9809,
		    "Cloud": 53.9647,
		    "Age": 1.25176
		  },
		  {
		    "Year": 2006,
		    "Doy": 135,
		    "SCF": 20.3654,
		    "Cloud": 59.2584,
		    "Age": 1.36329
		  },
		  {
		    "Year": 2006,
		    "Doy": 136,
		    "SCF": 18.2926,
		    "Cloud": 92.218,
		    "Age": 2.19531
		  },
		  {
		    "Year": 2006,
		    "Doy": 137,
		    "SCF": 18.0865,
		    "Cloud": 99.6648,
		    "Age": 3.18533
		  },
		  {
		    "Year": 2006,
		    "Doy": 138,
		    "SCF": 17.9411,
		    "Cloud": 100,
		    "Age": 4.18552
		  },
		  {
		    "Year": 2006,
		    "Doy": 139,
		    "SCF": 17.9411,
		    "Cloud": 89.3322,
		    "Age": 4.64195
		  },
		  {
		    "Year": 2006,
		    "Doy": 140,
		    "SCF": 17.1493,
		    "Cloud": 99.4808,
		    "Age": 5.62053
		  },
		  {
		    "Year": 2006,
		    "Doy": 141,
		    "SCF": 16.771,
		    "Cloud": 99.3467,
		    "Age": 6.57861
		  },
		  {
		    "Year": 2006,
		    "Doy": 142,
		    "SCF": 16.7452,
		    "Cloud": 99.631,
		    "Age": 7.55522
		  },
		  {
		    "Year": 2006,
		    "Doy": 143,
		    "SCF": 16.7215,
		    "Cloud": 99.8089,
		    "Age": 8.55533
		  },
		  {
		    "Year": 2006,
		    "Doy": 144,
		    "SCF": 16.7215,
		    "Cloud": 30.9629,
		    "Age": 3.04524
		  },
		  {
		    "Year": 2006,
		    "Doy": 145,
		    "SCF": 17.5412,
		    "Cloud": 94.8928,
		    "Age": 3.72316
		  },
		  {
		    "Year": 2006,
		    "Doy": 146,
		    "SCF": 17.2037,
		    "Cloud": 81.5085,
		    "Age": 3.55701
		  },
		  {
		    "Year": 2006,
		    "Doy": 147,
		    "SCF": 12.6677,
		    "Cloud": 50.4719,
		    "Age": 2.43495
		  },
		  {
		    "Year": 2006,
		    "Doy": 148,
		    "SCF": 12.4451,
		    "Cloud": 75.5988,
		    "Age": 2.8199
		  },
		  {
		    "Year": 2006,
		    "Doy": 149,
		    "SCF": 12.1918,
		    "Cloud": 61.1169,
		    "Age": 2.50717
		  },
		  {
		    "Year": 2006,
		    "Doy": 150,
		    "SCF": 10.7531,
		    "Cloud": 84.9482,
		    "Age": 2.92072
		  },
		  {
		    "Year": 2006,
		    "Doy": 151,
		    "SCF": 10.1335,
		    "Cloud": 89.872,
		    "Age": 3.57392
		  },
		  {
		    "Year": 2006,
		    "Doy": 152,
		    "SCF": 10.0821,
		    "Cloud": 5.78348,
		    "Age": 0.39857
		  },
		  {
		    "Year": 2006,
		    "Doy": 153,
		    "SCF": 8.48117,
		    "Cloud": 97.1612,
		    "Age": 1.36373
		  },
		  {
		    "Year": 2006,
		    "Doy": 154,
		    "SCF": 8.36483,
		    "Cloud": 69.9975,
		    "Age": 1.73519
		  },
		  {
		    "Year": 2006,
		    "Doy": 155,
		    "SCF": 7.98046,
		    "Cloud": 96.7054,
		    "Age": 2.62175
		  },
		  {
		    "Year": 2006,
		    "Doy": 156,
		    "SCF": 7.86874,
		    "Cloud": 59.9165,
		    "Age": 2.17777
		  },
		  {
		    "Year": 2006,
		    "Doy": 157,
		    "SCF": 6.1272,
		    "Cloud": 41.4933,
		    "Age": 1.38994
		  },
		  {
		    "Year": 2006,
		    "Doy": 158,
		    "SCF": 5.51048,
		    "Cloud": 85.9357,
		    "Age": 2.07856
		  },
		  {
		    "Year": 2006,
		    "Doy": 159,
		    "SCF": 4.84956,
		    "Cloud": 60.2013,
		    "Age": 1.94387
		  },
		  {
		    "Year": 2006,
		    "Doy": 160,
		    "SCF": 4.84145,
		    "Cloud": 3.47013,
		    "Age": 0.158478
		  },
		  {
		    "Year": 2006,
		    "Doy": 161,
		    "SCF": 3.62026,
		    "Cloud": 2.96642,
		    "Age": 0.0767153
		  },
		  {
		    "Year": 2006,
		    "Doy": 162,
		    "SCF": 3.39374,
		    "Cloud": 3.06653,
		    "Age": 0.0783198
		  },
		  {
		    "Year": 2006,
		    "Doy": 163,
		    "SCF": 2.94009,
		    "Cloud": 2.52112,
		    "Age": 0.0608395
		  },
		  {
		    "Year": 2006,
		    "Doy": 164,
		    "SCF": 3.1024,
		    "Cloud": 56.3222,
		    "Age": 0.618479
		  },
		  {
		    "Year": 2006,
		    "Doy": 165,
		    "SCF": 2.67473,
		    "Cloud": 5.4395,
		    "Age": 0.125418
		  },
		  {
		    "Year": 2006,
		    "Doy": 166,
		    "SCF": 1.31481,
		    "Cloud": 76.7548,
		    "Age": 0.888323
		  },
		  {
		    "Year": 2006,
		    "Doy": 167,
		    "SCF": 1.17629,
		    "Cloud": 5.65319,
		    "Age": 0.151817
		  },
		  {
		    "Year": 2006,
		    "Doy": 168,
		    "SCF": 0.92734,
		    "Cloud": 47.5551,
		    "Age": 0.588984
		  },
		  {
		    "Year": 2006,
		    "Doy": 169,
		    "SCF": 1.5141,
		    "Cloud": 90.4502,
		    "Age": 1.47751
		  },
		  {
		    "Year": 2006,
		    "Doy": 170,
		    "SCF": 1.6588,
		    "Cloud": 98.2563,
		    "Age": 2.44167
		  },
		  {
		    "Year": 2006,
		    "Doy": 171,
		    "SCF": 1.62914,
		    "Cloud": 98.5668,
		    "Age": 3.40104
		  },
		  {
		    "Year": 2006,
		    "Doy": 172,
		    "SCF": 1.67722,
		    "Cloud": 99.9971,
		    "Age": 4.40054
		  },
		  {
		    "Year": 2006,
		    "Doy": 173,
		    "SCF": 1.67722,
		    "Cloud": 99.8528,
		    "Age": 5.39719
		  },
		  {
		    "Year": 2006,
		    "Doy": 174,
		    "SCF": 1.61656,
		    "Cloud": 48.9271,
		    "Age": 3.20507
		  },
		  {
		    "Year": 2006,
		    "Doy": 175,
		    "SCF": 1.06263,
		    "Cloud": 73.3094,
		    "Age": 3.16778
		  },
		  {
		    "Year": 2006,
		    "Doy": 176,
		    "SCF": 1.09536,
		    "Cloud": 67.1354,
		    "Age": 2.82614
		  },
		  {
		    "Year": 2006,
		    "Doy": 177,
		    "SCF": 0.628188,
		    "Cloud": 32.6787,
		    "Age": 1.32816
		  },
		  {
		    "Year": 2006,
		    "Doy": 178,
		    "SCF": 0.317611,
		    "Cloud": 99.9942,
		    "Age": 2.32806
		  },
		  {
		    "Year": 2006,
		    "Doy": 179,
		    "SCF": 0.317129,
		    "Cloud": 78.3785,
		    "Age": 2.76895
		  },
		  {
		    "Year": 2006,
		    "Doy": 180,
		    "SCF": 0.283543,
		    "Cloud": 6.50648,
		    "Age": 0.266708
		  },
		  {
		    "Year": 2006,
		    "Doy": 181,
		    "SCF": 0.281618,
		    "Cloud": 14.9111,
		    "Age": 0.23794
		  },
		  {
		    "Year": 2006,
		    "Doy": 182,
		    "SCF": 0.214374,
		    "Cloud": 46.0563,
		    "Age": 0.606976
		  },
		  {
		    "Year": 2006,
		    "Doy": 183,
		    "SCF": 0.230398,
		    "Cloud": 9.20803,
		    "Age": 0.179171
		  },
		  {
		    "Year": 2006,
		    "Doy": 184,
		    "SCF": 0.220754,
		    "Cloud": 56.0826,
		    "Age": 0.691709
		  },
		  {
		    "Year": 2006,
		    "Doy": 185,
		    "SCF": 0.206691,
		    "Cloud": 12.7897,
		    "Age": 0.218792
		  },
		  {
		    "Year": 2006,
		    "Doy": 186,
		    "SCF": 0.891175,
		    "Cloud": 54.0411,
		    "Age": 0.636668
		  },
		  {
		    "Year": 2006,
		    "Doy": 187,
		    "SCF": 0.80294,
		    "Cloud": 94.3428,
		    "Age": 1.54387
		  },
		  {
		    "Year": 2006,
		    "Doy": 188,
		    "SCF": 0.501517,
		    "Cloud": 71.7157,
		    "Age": 1.83941
		  },
		  {
		    "Year": 2006,
		    "Doy": 189,
		    "SCF": 0.665942,
		    "Cloud": 66.1451,
		    "Age": 1.81718
		  },
		  {
		    "Year": 2006,
		    "Doy": 190,
		    "SCF": 0.306788,
		    "Cloud": 98.7252,
		    "Age": 2.79548
		  },
		  {
		    "Year": 2006,
		    "Doy": 191,
		    "SCF": 0.243987,
		    "Cloud": 43.4835,
		    "Age": 1.6723
		  },
		  {
		    "Year": 2006,
		    "Doy": 192,
		    "SCF": 0.323216,
		    "Cloud": 99.9912,
		    "Age": 2.6722
		  },
		  {
		    "Year": 2006,
		    "Doy": 193,
		    "SCF": 0.323216,
		    "Cloud": 97.08,
		    "Age": 3.59019
		  },
		  {
		    "Year": 2006,
		    "Doy": 194,
		    "SCF": 0.199072,
		    "Cloud": 35.3569,
		    "Age": 1.7759
		  },
		  {
		    "Year": 2006,
		    "Doy": 195,
		    "SCF": 0.149252,
		    "Cloud": 87.9863,
		    "Age": 2.43957
		  },
		  {
		    "Year": 2006,
		    "Doy": 196,
		    "SCF": 0.124267,
		    "Cloud": 0.147346,
		    "Age": 0.020541
		  },
		  {
		    "Year": 2006,
		    "Doy": 197,
		    "SCF": 0.112547,
		    "Cloud": 8.686,
		    "Age": 0.098674
		  },
		  {
		    "Year": 2006,
		    "Doy": 198,
		    "SCF": 0.131319,
		    "Cloud": 88.95,
		    "Age": 0.979152
		  },
		  {
		    "Year": 2006,
		    "Doy": 199,
		    "SCF": 0.112954,
		    "Cloud": 3.94362,
		    "Age": 0.0725697
		  },
		  {
		    "Year": 2006,
		    "Doy": 200,
		    "SCF": 0.0945743,
		    "Cloud": 0.205818,
		    "Age": 0.00379523
		  },
		  {
		    "Year": 2006,
		    "Doy": 201,
		    "SCF": 0.410063,
		    "Cloud": 42.0713,
		    "Age": 0.425687
		  },
		  {
		    "Year": 2006,
		    "Doy": 202,
		    "SCF": 0.883127,
		    "Cloud": 32.8976,
		    "Age": 0.476455
		  },
		  {
		    "Year": 2006,
		    "Doy": 203,
		    "SCF": 0.515521,
		    "Cloud": 39.4416,
		    "Age": 0.585366
		  },
		  {
		    "Year": 2006,
		    "Doy": 204,
		    "SCF": 0.671703,
		    "Cloud": 52.0148,
		    "Age": 0.780499
		  },
		  {
		    "Year": 2006,
		    "Doy": 205,
		    "SCF": 0.807145,
		    "Cloud": 57.1314,
		    "Age": 0.971282
		  },
		  {
		    "Year": 2006,
		    "Doy": 206,
		    "SCF": 0.424858,
		    "Cloud": 43.0637,
		    "Age": 0.89897
		  },
		  {
		    "Year": 2006,
		    "Doy": 207,
		    "SCF": 0.102094,
		    "Cloud": 0.458294,
		    "Age": 0.00884478
		  },
		  {
		    "Year": 2006,
		    "Doy": 208,
		    "SCF": 1.46969,
		    "Cloud": 79.7119,
		    "Age": 0.798943
		  },
		  {
		    "Year": 2006,
		    "Doy": 209,
		    "SCF": 1.71346,
		    "Cloud": 68.1723,
		    "Age": 1.23749
		  },
		  {
		    "Year": 2006,
		    "Doy": 210,
		    "SCF": 2.17153,
		    "Cloud": 50.9506,
		    "Age": 1.14173
		  },
		  {
		    "Year": 2006,
		    "Doy": 211,
		    "SCF": 0.400905,
		    "Cloud": 99.7636,
		    "Age": 2.13276
		  },
		  {
		    "Year": 2006,
		    "Doy": 212,
		    "SCF": 0.390674,
		    "Cloud": 99.9153,
		    "Age": 3.13124
		  },
		  {
		    "Year": 2006,
		    "Doy": 213,
		    "SCF": 0.341487,
		    "Cloud": 30.3744,
		    "Age": 1.25308
		  },
		  {
		    "Year": 2006,
		    "Doy": 214,
		    "SCF": 1.07529,
		    "Cloud": 55.672,
		    "Age": 1.24265
		  },
		  {
		    "Year": 2006,
		    "Doy": 215,
		    "SCF": 0.108822,
		    "Cloud": 18.8918,
		    "Age": 0.450958
		  },
		  {
		    "Year": 2006,
		    "Doy": 216,
		    "SCF": 0.0950949,
		    "Cloud": 0.348798,
		    "Age": 0.005896
		  },
		  {
		    "Year": 2006,
		    "Doy": 217,
		    "SCF": 0.676359,
		    "Cloud": 52.2184,
		    "Age": 0.526445
		  },
		  {
		    "Year": 2006,
		    "Doy": 218,
		    "SCF": 0.176011,
		    "Cloud": 13.2074,
		    "Age": 0.213964
		  },
		  {
		    "Year": 2006,
		    "Doy": 219,
		    "SCF": 0.346115,
		    "Cloud": 79.6425,
		    "Age": 1.00776
		  },
		  {
		    "Year": 2006,
		    "Doy": 220,
		    "SCF": 0.351982,
		    "Cloud": 19.5005,
		    "Age": 0.414388
		  },
		  {
		    "Year": 2006,
		    "Doy": 221,
		    "SCF": 1.4812,
		    "Cloud": 97.5235,
		    "Age": 1.38421
		  },
		  {
		    "Year": 2006,
		    "Doy": 222,
		    "SCF": 1.41864,
		    "Cloud": 94.8725,
		    "Age": 2.26486
		  },
		  {
		    "Year": 2006,
		    "Doy": 223,
		    "SCF": 1.31178,
		    "Cloud": 67.6384,
		    "Age": 2.13922
		  },
		  {
		    "Year": 2006,
		    "Doy": 224,
		    "SCF": 1.93063,
		    "Cloud": 80.4959,
		    "Age": 2.57829
		  },
		  {
		    "Year": 2006,
		    "Doy": 225,
		    "SCF": 1.60478,
		    "Cloud": 81.06,
		    "Age": 2.94882
		  },
		  {
		    "Year": 2006,
		    "Doy": 226,
		    "SCF": 1.99243,
		    "Cloud": 99.72,
		    "Age": 3.94339
		  },
		  {
		    "Year": 2006,
		    "Doy": 227,
		    "SCF": 1.97681,
		    "Cloud": 99.3685,
		    "Age": 4.91613
		  },
		  {
		    "Year": 2006,
		    "Doy": 228,
		    "SCF": 1.42708,
		    "Cloud": 97.5354,
		    "Age": 5.76551
		  },
		  {
		    "Year": 2006,
		    "Doy": 229,
		    "SCF": 1.21387,
		    "Cloud": 70.0783,
		    "Age": 4.60902
		  },
		  {
		    "Year": 2006,
		    "Doy": 230,
		    "SCF": 0.748428,
		    "Cloud": 23.3419,
		    "Age": 1.52521
		  },
		  {
		    "Year": 2006,
		    "Doy": 231,
		    "SCF": 2.74076,
		    "Cloud": 97.297,
		    "Age": 2.4672
		  },
		  {
		    "Year": 2006,
		    "Doy": 232,
		    "SCF": 2.65605,
		    "Cloud": 79.484,
		    "Age": 2.96435
		  },
		  {
		    "Year": 2006,
		    "Doy": 233,
		    "SCF": 2.72118,
		    "Cloud": 46.7026,
		    "Age": 1.9595
		  },
		  {
		    "Year": 2006,
		    "Doy": 234,
		    "SCF": 3.69284,
		    "Cloud": 80.357,
		    "Age": 2.50297
		  },
		  {
		    "Year": 2006,
		    "Doy": 235,
		    "SCF": 3.46213,
		    "Cloud": 8.96105,
		    "Age": 3.50359
		  },
		  {
		    "Year": 2006,
		    "Doy": 236,
		    "SCF": 3.46213,
		    "Cloud": 99.984,
		    "Age": 4.50338
		  },
		  {
		    "Year": 2006,
		    "Doy": 237,
		    "SCF": 3.45229,
		    "Cloud": 97.1505,
		    "Age": 5.35545
		  },
		  {
		    "Year": 2006,
		    "Doy": 238,
		    "SCF": 1.79697,
		    "Cloud": 41.8599,
		    "Age": 2.74623
		  },
		  {
		    "Year": 2006,
		    "Doy": 239,
		    "SCF": 3.07602,
		    "Cloud": 83.4432,
		    "Age": 3.21225
		  },
		  {
		    "Year": 2006,
		    "Doy": 240,
		    "SCF": 3.11774,
		    "Cloud": 96.4637,
		    "Age": 4.09373
		  },
		  {
		    "Year": 2006,
		    "Doy": 241,
		    "SCF": 1.86417,
		    "Cloud": 95.7501,
		    "Age": 4.88995
		  },
		  {
		    "Year": 2006,
		    "Doy": 242,
		    "SCF": 0.689097,
		    "Cloud": 69.3182,
		    "Age": 4.44875
		  },
		  {
		    "Year": 2006,
		    "Doy": 243,
		    "SCF": 0.334306,
		    "Cloud": 31.2502,
		    "Age": 2.13058
		  },
		  {
		    "Year": 2006,
		    "Doy": 244,
		    "SCF": 0.708347,
		    "Cloud": 31.9408,
		    "Age": 1.28119
		  },
		  {
		    "Year": 2006,
		    "Doy": 245,
		    "SCF": 0.694195,
		    "Cloud": 68.2337,
		    "Age": 1.63625
		  },
		  {
		    "Year": 2006,
		    "Doy": 246,
		    "SCF": 0.390497,
		    "Cloud": 99.6603,
		    "Age": 2.63003
		  },
		  {
		    "Year": 2006,
		    "Doy": 247,
		    "SCF": 0.351358,
		    "Cloud": 27.1318,
		    "Age": 1.196
		  },
		  {
		    "Year": 2006,
		    "Doy": 248,
		    "SCF": 0.38288,
		    "Cloud": 6.07771,
		    "Age": 0.301946
		  },
		  {
		    "Year": 2006,
		    "Doy": 249,
		    "SCF": 3.28145,
		    "Cloud": 95.4446,
		    "Age": 1.25193
		  },
		  {
		    "Year": 2006,
		    "Doy": 250,
		    "SCF": 1.85574,
		    "Cloud": 93.5793,
		    "Age": 2.11974
		  },
		  {
		    "Year": 2006,
		    "Doy": 251,
		    "SCF": 0.953764,
		    "Cloud": 50.3178,
		    "Age": 1.69219
		  },
		  {
		    "Year": 2006,
		    "Doy": 252,
		    "SCF": 0.561676,
		    "Cloud": 45.1472,
		    "Age": 1.57252
		  },
		  {
		    "Year": 2006,
		    "Doy": 253,
		    "SCF": 1.12073,
		    "Cloud": 52.3995,
		    "Age": 1.83202
		  },
		  {
		    "Year": 2006,
		    "Doy": 254,
		    "SCF": 1.14651,
		    "Cloud": 61.1356,
		    "Age": 2.12662
		  },
		  {
		    "Year": 2006,
		    "Doy": 255,
		    "SCF": 0.441267,
		    "Cloud": 22.6966,
		    "Age": 1.32387
		  },
		  {
		    "Year": 2006,
		    "Doy": 256,
		    "SCF": 1.26275,
		    "Cloud": 78.7973,
		    "Age": 2.049
		  },
		  {
		    "Year": 2006,
		    "Doy": 257,
		    "SCF": 0.704206,
		    "Cloud": 53.1332,
		    "Age": 1.74225
		  },
		  {
		    "Year": 2006,
		    "Doy": 258,
		    "SCF": 1.06045,
		    "Cloud": 80.3157,
		    "Age": 2.42689
		  },
		  {
		    "Year": 2006,
		    "Doy": 259,
		    "SCF": 1.11471,
		    "Cloud": 79.5424,
		    "Age": 3.01811
		  },
		  {
		    "Year": 2006,
		    "Doy": 260,
		    "SCF": 1.1589,
		    "Cloud": 77.3759,
		    "Age": 2.70783
		  },
		  {
		    "Year": 2006,
		    "Doy": 261,
		    "SCF": 1.38356,
		    "Cloud": 85.358,
		    "Age": 3.01981
		  },
		  {
		    "Year": 2006,
		    "Doy": 262,
		    "SCF": 1.15779,
		    "Cloud": 99.3085,
		    "Age": 3.98576
		  },
		  {
		    "Year": 2006,
		    "Doy": 263,
		    "SCF": 0.666234,
		    "Cloud": 45.019,
		    "Age": 2.22039
		  },
		  {
		    "Year": 2006,
		    "Doy": 264,
		    "SCF": 0.392231,
		    "Cloud": 57.559,
		    "Age": 1.78706
		  },
		  {
		    "Year": 2006,
		    "Doy": 265,
		    "SCF": 0.333416,
		    "Cloud": 16.7299,
		    "Age": 0.35758
		  },
		  {
		    "Year": 2006,
		    "Doy": 266,
		    "SCF": 1.35961,
		    "Cloud": 99.3409,
		    "Age": 1.34962
		  },
		  {
		    "Year": 2006,
		    "Doy": 267,
		    "SCF": 1.29565,
		    "Cloud": 66.3945,
		    "Age": 1.58136
		  },
		  {
		    "Year": 2006,
		    "Doy": 268,
		    "SCF": 0.902883,
		    "Cloud": 98.4251,
		    "Age": 2.52217
		  },
		  {
		    "Year": 2006,
		    "Doy": 269,
		    "SCF": 0.832161,
		    "Cloud": 99.9869,
		    "Age": 3.5239
		  },
		  {
		    "Year": 2006,
		    "Doy": 270,
		    "SCF": 0.832161,
		    "Cloud": 99.9635,
		    "Age": 4.52307
		  },
		  {
		    "Year": 2006,
		    "Doy": 271,
		    "SCF": 0.830935,
		    "Cloud": 98.5291,
		    "Age": 5.43957
		  },
		  {
		    "Year": 2006,
		    "Doy": 272,
		    "SCF": 0.440225,
		    "Cloud": 30.7542,
		    "Age": 1.9493
		  },
		  {
		    "Year": 2006,
		    "Doy": 273,
		    "SCF": 1.26338,
		    "Cloud": 99.3611,
		    "Age": 2.94163
		  },
		  {
		    "Year": 2006,
		    "Doy": 274,
		    "SCF": 0.728606,
		    "Cloud": 8.92393,
		    "Age": 0.305765
		  },
		  {
		    "Year": 2006,
		    "Doy": 275,
		    "SCF": 8.33499,
		    "Cloud": 98.6257,
		    "Age": 1.28865
		  },
		  {
		    "Year": 2006,
		    "Doy": 276,
		    "SCF": 7.32256,
		    "Cloud": 98.3854,
		    "Age": 2.25313
		  },
		  {
		    "Year": 2006,
		    "Doy": 277,
		    "SCF": 7.22835,
		    "Cloud": 93.9692,
		    "Age": 3.04888
		  },
		  {
		    "Year": 2006,
		    "Doy": 278,
		    "SCF": 6.62687,
		    "Cloud": 61.777,
		    "Age": 2.56237
		  },
		  {
		    "Year": 2006,
		    "Doy": 279,
		    "SCF": 3.43132,
		    "Cloud": 99.4417,
		    "Age": 3.54866
		  },
		  {
		    "Year": 2006,
		    "Doy": 280,
		    "SCF": 3.03875,
		    "Cloud": 63.5339,
		    "Age": 2.74145
		  },
		  {
		    "Year": 2006,
		    "Doy": 281,
		    "SCF": 0.879081,
		    "Cloud": 11.4442,
		    "Age": 0.568125
		  },
		  {
		    "Year": 2006,
		    "Doy": 282,
		    "SCF": 1.45247,
		    "Cloud": 99.8732,
		    "Age": 1.5664
		  },
		  {
		    "Year": 2006,
		    "Doy": 283,
		    "SCF": 1.3787,
		    "Cloud": 8.33904,
		    "Age": 0.209358
		  },
		  {
		    "Year": 2006,
		    "Doy": 284,
		    "SCF": 3.88613,
		    "Cloud": 98.6258,
		    "Age": 1.19428
		  },
		  {
		    "Year": 2006,
		    "Doy": 285,
		    "SCF": 3.92066,
		    "Cloud": 93.9386,
		    "Age": 2.07226
		  },
		  {
		    "Year": 2006,
		    "Doy": 286,
		    "SCF": 3.41132,
		    "Cloud": 90.8333,
		    "Age": 2.78461
		  },
		  {
		    "Year": 2006,
		    "Doy": 287,
		    "SCF": 3.54548,
		    "Cloud": 25.2351,
		    "Age": 0.926891
		  },
		  {
		    "Year": 2006,
		    "Doy": 288,
		    "SCF": 3.53129,
		    "Cloud": 30.0585,
		    "Age": 1.04535
		  },
		  {
		    "Year": 2006,
		    "Doy": 289,
		    "SCF": 6.47286,
		    "Cloud": 39.5098,
		    "Age": 1.4183
		  },
		  {
		    "Year": 2006,
		    "Doy": 290,
		    "SCF": 17.0217,
		    "Cloud": 71.2669,
		    "Age": 2.04094
		  },
		  {
		    "Year": 2006,
		    "Doy": 291,
		    "SCF": 21.5816,
		    "Cloud": 97.9138,
		    "Age": 3.0015
		  },
		  {
		    "Year": 2006,
		    "Doy": 292,
		    "SCF": 20.2187,
		    "Cloud": 98.3021,
		    "Age": 3.94171
		  },
		  {
		    "Year": 2006,
		    "Doy": 293,
		    "SCF": 20.2352,
		    "Cloud": 99.4238,
		    "Age": 4.90135
		  },
		  {
		    "Year": 2006,
		    "Doy": 294,
		    "SCF": 19.8288,
		    "Cloud": 99.9258,
		    "Age": 5.901
		  },
		  {
		    "Year": 2006,
		    "Doy": 295,
		    "SCF": 19.8365,
		    "Cloud": 98.2277,
		    "Age": 6.80934
		  },
		  {
		    "Year": 2006,
		    "Doy": 296,
		    "SCF": 19.6723,
		    "Cloud": 82.5638,
		    "Age": 6.13442
		  },
		  {
		    "Year": 2006,
		    "Doy": 297,
		    "SCF": 18.9438,
		    "Cloud": 71.6092,
		    "Age": 5.04845
		  },
		  {
		    "Year": 2006,
		    "Doy": 298,
		    "SCF": 20.004,
		    "Cloud": 19.533,
		    "Age": 1.09589
		  },
		  {
		    "Year": 2006,
		    "Doy": 299,
		    "SCF": 72.8836,
		    "Cloud": 98.6765,
		    "Age": 2.07117
		  },
		  {
		    "Year": 2006,
		    "Doy": 300,
		    "SCF": 72.614,
		    "Cloud": 16.1534,
		    "Age": 0.78912
		  },
		  {
		    "Year": 2006,
		    "Doy": 301,
		    "SCF": 80.4189,
		    "Cloud": 55.869,
		    "Age": 0.787199
		  },
		  {
		    "Year": 2006,
		    "Doy": 302,
		    "SCF": 81.9529,
		    "Cloud": 91.9453,
		    "Age": 1.64491
		  },
		  {
		    "Year": 2006,
		    "Doy": 303,
		    "SCF": 84.0282,
		    "Cloud": 92.8244,
		    "Age": 2.47956
		  },
		  {
		    "Year": 2006,
		    "Doy": 304,
		    "SCF": 85.423,
		    "Cloud": 97.8274,
		    "Age": 3.39873
		  },
		  {
		    "Year": 2006,
		    "Doy": 305,
		    "SCF": 85.6407,
		    "Cloud": 8.03518,
		    "Age": 0.393488
		  },
		  {
		    "Year": 2006,
		    "Doy": 306,
		    "SCF": 83.669,
		    "Cloud": 11.5391,
		    "Age": 0.361512
		  },
		  {
		    "Year": 2006,
		    "Doy": 307,
		    "SCF": 80.2363,
		    "Cloud": 53.171,
		    "Age": 0.792328
		  },
		  {
		    "Year": 2006,
		    "Doy": 308,
		    "SCF": 76.7906,
		    "Cloud": 36.675,
		    "Age": 0.758914
		  },
		  {
		    "Year": 2006,
		    "Doy": 309,
		    "SCF": 71.6412,
		    "Cloud": 96.3474,
		    "Age": 1.69381
		  },
		  {
		    "Year": 2006,
		    "Doy": 310,
		    "SCF": 70.0458,
		    "Cloud": 29.3562,
		    "Age": 1.01818
		  },
		  {
		    "Year": 2006,
		    "Doy": 311,
		    "SCF": 64.862,
		    "Cloud": 15.7831,
		    "Age": 0.667512
		  },
		  {
		    "Year": 2006,
		    "Doy": 312,
		    "SCF": 63.3705,
		    "Cloud": 17.4096,
		    "Age": 0.58828
		  },
		  {
		    "Year": 2006,
		    "Doy": 313,
		    "SCF": 63.2686,
		    "Cloud": 69.0683,
		    "Age": 1.23044
		  },
		  {
		    "Year": 2006,
		    "Doy": 314,
		    "SCF": 64.3836,
		    "Cloud": 100,
		    "Age": 2.23182
		  },
		  {
		    "Year": 2006,
		    "Doy": 315,
		    "SCF": 64.3836,
		    "Cloud": 29.4789,
		    "Age": 1.25937
		  },
		  {
		    "Year": 2006,
		    "Doy": 316,
		    "SCF": 65.1577,
		    "Cloud": 18.2925,
		    "Age": 0.823074
		  },
		  {
		    "Year": 2006,
		    "Doy": 317,
		    "SCF": 76.0293,
		    "Cloud": 93.6413,
		    "Age": 1.74069
		  },
		  {
		    "Year": 2006,
		    "Doy": 318,
		    "SCF": 76.459,
		    "Cloud": 93.471,
		    "Age": 2.55798
		  },
		  {
		    "Year": 2006,
		    "Doy": 319,
		    "SCF": 75.9625,
		    "Cloud": 39.2621,
		    "Age": 1.47104
		  },
		  {
		    "Year": 2006,
		    "Doy": 320,
		    "SCF": 65.5368,
		    "Cloud": 99.1951,
		    "Age": 2.45475
		  },
		  {
		    "Year": 2006,
		    "Doy": 321,
		    "SCF": 65.324,
		    "Cloud": 56.4743,
		    "Age": 1.98926
		  },
		  {
		    "Year": 2006,
		    "Doy": 322,
		    "SCF": 61.1173,
		    "Cloud": 87.6636,
		    "Age": 2.72063
		  },
		  {
		    "Year": 2006,
		    "Doy": 323,
		    "SCF": 60.7328,
		    "Cloud": 71.7448,
		    "Age": 2.46199
		  },
		  {
		    "Year": 2006,
		    "Doy": 324,
		    "SCF": 60.6941,
		    "Cloud": 87.8197,
		    "Age": 3.05544
		  },
		  {
		    "Year": 2006,
		    "Doy": 325,
		    "SCF": 59.9023,
		    "Cloud": 98.1338,
		    "Age": 4.01133
		  },
		  {
		    "Year": 2006,
		    "Doy": 326,
		    "SCF": 59.9228,
		    "Cloud": 86.4092,
		    "Age": 4.35901
		  },
		  {
		    "Year": 2006,
		    "Doy": 327,
		    "SCF": 60.3975,
		    "Cloud": 91.8368,
		    "Age": 4.92532
		  },
		  {
		    "Year": 2006,
		    "Doy": 328,
		    "SCF": 59.6351,
		    "Cloud": 80.0775,
		    "Age": 4.83618
		  },
		  {
		    "Year": 2006,
		    "Doy": 329,
		    "SCF": 57.9832,
		    "Cloud": 99.9971,
		    "Age": 5.83935
		  },
		  {
		    "Year": 2006,
		    "Doy": 330,
		    "SCF": 57.9832,
		    "Cloud": 42.2657,
		    "Age": 2.85127
		  },
		  {
		    "Year": 2006,
		    "Doy": 331,
		    "SCF": 57.5511,
		    "Cloud": 96.1925,
		    "Age": 3.73834
		  },
		  {
		    "Year": 2006,
		    "Doy": 332,
		    "SCF": 57.3188,
		    "Cloud": 86.5157,
		    "Age": 4.13251
		  },
		  {
		    "Year": 2006,
		    "Doy": 333,
		    "SCF": 56.3644,
		    "Cloud": 61.2156,
		    "Age": 3.09799
		  },
		  {
		    "Year": 2006,
		    "Doy": 334,
		    "SCF": 56.0384,
		    "Cloud": 88.2565,
		    "Age": 3.68736
		  },
		  {
		    "Year": 2006,
		    "Doy": 335,
		    "SCF": 55.8917,
		    "Cloud": 95.5919,
		    "Age": 4.47303
		  },
		  {
		    "Year": 2006,
		    "Doy": 336,
		    "SCF": 56.6046,
		    "Cloud": 75.5257,
		    "Age": 4.13898
		  },
		  {
		    "Year": 2006,
		    "Doy": 337,
		    "SCF": 57.3499,
		    "Cloud": 99.9927,
		    "Age": 5.13694
		  },
		  {
		    "Year": 2006,
		    "Doy": 338,
		    "SCF": 57.3536,
		    "Cloud": 69.9423,
		    "Age": 4.27536
		  },
		  {
		    "Year": 2006,
		    "Doy": 339,
		    "SCF": 58.8327,
		    "Cloud": 93.1273,
		    "Age": 4.923
		  },
		  {
		    "Year": 2006,
		    "Doy": 340,
		    "SCF": 58.8474,
		    "Cloud": 47.808,
		    "Age": 3.09696
		  },
		  {
		    "Year": 2006,
		    "Doy": 341,
		    "SCF": 63.5153,
		    "Cloud": 97.3186,
		    "Age": 3.96861
		  },
		  {
		    "Year": 2006,
		    "Doy": 342,
		    "SCF": 62.805,
		    "Cloud": 71.4182,
		    "Age": 3.45218
		  },
		  {
		    "Year": 2006,
		    "Doy": 343,
		    "SCF": 64.7079,
		    "Cloud": 35.4147,
		    "Age": 1.75438
		  },
		  {
		    "Year": 2006,
		    "Doy": 344,
		    "SCF": 61.5053,
		    "Cloud": 99.9956,
		    "Age": 2.75592
		  },
		  {
		    "Year": 2006,
		    "Doy": 345,
		    "SCF": 61.5053,
		    "Cloud": 97.1359,
		    "Age": 3.68465
		  },
		  {
		    "Year": 2006,
		    "Doy": 346,
		    "SCF": 61.8281,
		    "Cloud": 39.4033,
		    "Age": 2.03934
		  },
		  {
		    "Year": 2006,
		    "Doy": 347,
		    "SCF": 61.2292,
		    "Cloud": 36.0164,
		    "Age": 1.42545
		  },
		  {
		    "Year": 2006,
		    "Doy": 348,
		    "SCF": 64.9494,
		    "Cloud": 99.9971,
		    "Age": 2.4258
		  },
		  {
		    "Year": 2006,
		    "Doy": 349,
		    "SCF": 64.9494,
		    "Cloud": 36.9374,
		    "Age": 1.54054
		  },
		  {
		    "Year": 2006,
		    "Doy": 350,
		    "SCF": 68.9183,
		    "Cloud": 62.9343,
		    "Age": 1.72913
		  },
		  {
		    "Year": 2006,
		    "Doy": 351,
		    "SCF": 67.8171,
		    "Cloud": 19.3086,
		    "Age": 0.833588
		  },
		  {
		    "Year": 2006,
		    "Doy": 352,
		    "SCF": 69.9946,
		    "Cloud": 81.6043,
		    "Age": 1.55174
		  },
		  {
		    "Year": 2006,
		    "Doy": 353,
		    "SCF": 70.8728,
		    "Cloud": 84.4219,
		    "Age": 2.55169
		  },
		  {
		    "Year": 2006,
		    "Doy": 354,
		    "SCF": 70.8728,
		    "Cloud": 96.9951,
		    "Age": 3.44962
		  },
		  {
		    "Year": 2006,
		    "Doy": 355,
		    "SCF": 71.2129,
		    "Cloud": 16.6402,
		    "Age": 1.05719
		  },
		  {
		    "Year": 2006,
		    "Doy": 356,
		    "SCF": 63.7722,
		    "Cloud": 57.9244,
		    "Age": 1.40339
		  },
		  {
		    "Year": 2006,
		    "Doy": 357,
		    "SCF": 65.4398,
		    "Cloud": 99.9578,
		    "Age": 2.39898
		  },
		  {
		    "Year": 2006,
		    "Doy": 358,
		    "SCF": 65.4495,
		    "Cloud": 27.4212,
		    "Age": 1.13457
		  },
		  {
		    "Year": 2006,
		    "Doy": 359,
		    "SCF": 69.3332,
		    "Cloud": 60.1314,
		    "Age": 1.34084
		  },
		  {
		    "Year": 2006,
		    "Doy": 360,
		    "SCF": 68.3538,
		    "Cloud": 87.799,
		    "Age": 2.34103
		  },
		  {
		    "Year": 2006,
		    "Doy": 361,
		    "SCF": 68.3538,
		    "Cloud": 43.7433,
		    "Age": 1.66706
		  },
		  {
		    "Year": 2006,
		    "Doy": 362,
		    "SCF": 69.1626,
		    "Cloud": 36.1453,
		    "Age": 1.2224
		  },
		  {
		    "Year": 2006,
		    "Doy": 363,
		    "SCF": 70.8792,
		    "Cloud": 30.0262,
		    "Age": 0.722049
		  },
		  {
		    "Year": 2006,
		    "Doy": 364,
		    "SCF": 72.8892,
		    "Cloud": 99.6888,
		    "Age": 1.71546
		  },
		  {
		    "Year": 2006,
		    "Doy": 365,
		    "SCF": 72.8812,
		    "Cloud": 83.7424,
		    "Age": 2.28046
		  },
		  {
		    "Year": 2007,
		    "Doy": 1,
		    "SCF": 74.7034,
		    "Cloud": 87.9573,
		    "Age": 0.878861
		  },
		  {
		    "Year": 2007,
		    "Doy": 2,
		    "SCF": 75.1289,
		    "Cloud": 99.1445,
		    "Age": 1.86313
		  },
		  {
		    "Year": 2007,
		    "Doy": 3,
		    "SCF": 75.2072,
		    "Cloud": 99.9927,
		    "Age": 2.86313
		  },
		  {
		    "Year": 2007,
		    "Doy": 4,
		    "SCF": 75.2072,
		    "Cloud": 97.7739,
		    "Age": 3.78396
		  },
		  {
		    "Year": 2007,
		    "Doy": 5,
		    "SCF": 75.1636,
		    "Cloud": 99.6697,
		    "Age": 4.77219
		  },
		  {
		    "Year": 2007,
		    "Doy": 6,
		    "SCF": 75.1563,
		    "Cloud": 92.7192,
		    "Age": 5.37069
		  },
		  {
		    "Year": 2007,
		    "Doy": 7,
		    "SCF": 75.5752,
		    "Cloud": 97.6531,
		    "Age": 6.20491
		  },
		  {
		    "Year": 2007,
		    "Doy": 8,
		    "SCF": 75.7876,
		    "Cloud": 99.9782,
		    "Age": 7.20368
		  },
		  {
		    "Year": 2007,
		    "Doy": 9,
		    "SCF": 75.7866,
		    "Cloud": 97.4421,
		    "Age": 8.02524
		  },
		  {
		    "Year": 2007,
		    "Doy": 10,
		    "SCF": 75.644,
		    "Cloud": 99.4049,
		    "Age": 8.9774
		  },
		  {
		    "Year": 2007,
		    "Doy": 11,
		    "SCF": 75.7233,
		    "Cloud": 97.6997,
		    "Age": 9.77534
		  },
		  {
		    "Year": 2007,
		    "Doy": 12,
		    "SCF": 75.643,
		    "Cloud": 63.1309,
		    "Age": 6.70746
		  },
		  {
		    "Year": 2007,
		    "Doy": 13,
		    "SCF": 75.1482,
		    "Cloud": 36.0791,
		    "Age": 3.12189
		  },
		  {
		    "Year": 2007,
		    "Doy": 14,
		    "SCF": 72.8182,
		    "Cloud": 97.8366,
		    "Age": 4.02868
		  },
		  {
		    "Year": 2007,
		    "Doy": 15,
		    "SCF": 72.8962,
		    "Cloud": 56.7448,
		    "Age": 3.35089
		  },
		  {
		    "Year": 2007,
		    "Doy": 16,
		    "SCF": 72.3299,
		    "Cloud": 43.5079,
		    "Age": 2.36854
		  },
		  {
		    "Year": 2007,
		    "Doy": 17,
		    "SCF": 78.2932,
		    "Cloud": 99.9767,
		    "Age": 3.36581
		  },
		  {
		    "Year": 2007,
		    "Doy": 18,
		    "SCF": 78.297,
		    "Cloud": 62.1222,
		    "Age": 2.76003
		  },
		  {
		    "Year": 2007,
		    "Doy": 19,
		    "SCF": 77.252,
		    "Cloud": 21.6939,
		    "Age": 1.30956
		  },
		  {
		    "Year": 2007,
		    "Doy": 20,
		    "SCF": 82.7392,
		    "Cloud": 93.68,
		    "Age": 2.13944
		  },
		  {
		    "Year": 2007,
		    "Doy": 21,
		    "SCF": 83.1093,
		    "Cloud": 99.968,
		    "Age": 3.1387
		  },
		  {
		    "Year": 2007,
		    "Doy": 22,
		    "SCF": 83.1141,
		    "Cloud": 27.2983,
		    "Age": 1.55595
		  },
		  {
		    "Year": 2007,
		    "Doy": 23,
		    "SCF": 83.1692,
		    "Cloud": 90.4885,
		    "Age": 2.42294
		  },
		  {
		    "Year": 2007,
		    "Doy": 24,
		    "SCF": 82.7225,
		    "Cloud": 71.4246,
		    "Age": 2.67908
		  },
		  {
		    "Year": 2007,
		    "Doy": 25,
		    "SCF": 82.3596,
		    "Cloud": 99.984,
		    "Age": 3.68064
		  },
		  {
		    "Year": 2007,
		    "Doy": 26,
		    "SCF": 82.3598,
		    "Cloud": 68.4508,
		    "Age": 3.39265
		  },
		  {
		    "Year": 2007,
		    "Doy": 27,
		    "SCF": 83.16,
		    "Cloud": 21.9195,
		    "Age": 1.57006
		  },
		  {
		    "Year": 2007,
		    "Doy": 28,
		    "SCF": 83.9511,
		    "Cloud": 99.8358,
		    "Age": 2.56647
		  },
		  {
		    "Year": 2007,
		    "Doy": 29,
		    "SCF": 83.9862,
		    "Cloud": 99.9942,
		    "Age": 3.56647
		  },
		  {
		    "Year": 2007,
		    "Doy": 30,
		    "SCF": 83.9862,
		    "Cloud": 70.5513,
		    "Age": 3.17102
		  },
		  {
		    "Year": 2007,
		    "Doy": 31,
		    "SCF": 84.8952,
		    "Cloud": 98.0298,
		    "Age": 4.08575
		  },
		  {
		    "Year": 2007,
		    "Doy": 32,
		    "SCF": 84.9662,
		    "Cloud": 67.4459,
		    "Age": 3.50819
		  },
		  {
		    "Year": 2007,
		    "Doy": 33,
		    "SCF": 86.3642,
		    "Cloud": 98.9436,
		    "Age": 4.46179
		  },
		  {
		    "Year": 2007,
		    "Doy": 34,
		    "SCF": 86.5032,
		    "Cloud": 22.4631,
		    "Age": 1.66381
		  },
		  {
		    "Year": 2007,
		    "Doy": 35,
		    "SCF": 83.7167,
		    "Cloud": 55.2916,
		    "Age": 1.70669
		  },
		  {
		    "Year": 2007,
		    "Doy": 36,
		    "SCF": 84.9966,
		    "Cloud": 79.7673,
		    "Age": 2.11834
		  },
		  {
		    "Year": 2007,
		    "Doy": 37,
		    "SCF": 86.7359,
		    "Cloud": 93.3941,
		    "Age": 2.95121
		  },
		  {
		    "Year": 2007,
		    "Doy": 38,
		    "SCF": 87.8249,
		    "Cloud": 96.4346,
		    "Age": 3.74142
		  },
		  {
		    "Year": 2007,
		    "Doy": 39,
		    "SCF": 88.0377,
		    "Cloud": 58.4611,
		    "Age": 2.76349
		  },
		  {
		    "Year": 2007,
		    "Doy": 40,
		    "SCF": 88.9734,
		    "Cloud": 78.2779,
		    "Age": 3.15759
		  },
		  {
		    "Year": 2007,
		    "Doy": 41,
		    "SCF": 90.331,
		    "Cloud": 9.71883,
		    "Age": 0.610274
		  },
		  {
		    "Year": 2007,
		    "Doy": 42,
		    "SCF": 87.1861,
		    "Cloud": 10.3719,
		    "Age": 0.433022
		  },
		  {
		    "Year": 2007,
		    "Doy": 43,
		    "SCF": 85.2325,
		    "Cloud": 98.5659,
		    "Age": 1.4122
		  },
		  {
		    "Year": 2007,
		    "Doy": 44,
		    "SCF": 85.3667,
		    "Cloud": 99.6981,
		    "Age": 2.40613
		  },
		  {
		    "Year": 2007,
		    "Doy": 45,
		    "SCF": 85.3664,
		    "Cloud": 99.9419,
		    "Age": 3.40464
		  },
		  {
		    "Year": 2007,
		    "Doy": 46,
		    "SCF": 85.3851,
		    "Cloud": 99.2859,
		    "Age": 4.37413
		  },
		  {
		    "Year": 2007,
		    "Doy": 47,
		    "SCF": 85.4688,
		    "Cloud": 100,
		    "Age": 5.37413
		  },
		  {
		    "Year": 2007,
		    "Doy": 48,
		    "SCF": 85.4688,
		    "Cloud": 99.9913,
		    "Age": 6.37413
		  },
		  {
		    "Year": 2007,
		    "Doy": 49,
		    "SCF": 85.4688,
		    "Cloud": 65.4063,
		    "Age": 4.92886
		  },
		  {
		    "Year": 2007,
		    "Doy": 50,
		    "SCF": 86.2095,
		    "Cloud": 74.0191,
		    "Age": 4.64079
		  },
		  {
		    "Year": 2007,
		    "Doy": 51,
		    "SCF": 86.3864,
		    "Cloud": 99.9986,
		    "Age": 5.64079
		  },
		  {
		    "Year": 2007,
		    "Doy": 52,
		    "SCF": 86.3864,
		    "Cloud": 88.6766,
		    "Age": 5.95853
		  },
		  {
		    "Year": 2007,
		    "Doy": 53,
		    "SCF": 86.9272,
		    "Cloud": 85.9521,
		    "Age": 6.18449
		  },
		  {
		    "Year": 2007,
		    "Doy": 54,
		    "SCF": 88.0838,
		    "Cloud": 99.9986,
		    "Age": 7.18449
		  },
		  {
		    "Year": 2007,
		    "Doy": 55,
		    "SCF": 88.0838,
		    "Cloud": 99.9956,
		    "Age": 8.18449
		  },
		  {
		    "Year": 2007,
		    "Doy": 56,
		    "SCF": 88.0838,
		    "Cloud": 100,
		    "Age": 9.18449
		  },
		  {
		    "Year": 2007,
		    "Doy": 57,
		    "SCF": 88.0838,
		    "Cloud": 98.4556,
		    "Age": 10.0278
		  },
		  {
		    "Year": 2007,
		    "Doy": 58,
		    "SCF": 88.2412,
		    "Cloud": 98.8039,
		    "Age": 10.8929
		  },
		  {
		    "Year": 2007,
		    "Doy": 59,
		    "SCF": 88.2031,
		    "Cloud": 99.0695,
		    "Age": 11.7645
		  },
		  {
		    "Year": 2007,
		    "Doy": 60,
		    "SCF": 88.444,
		    "Cloud": 99.8882,
		    "Age": 12.7465
		  },
		  {
		    "Year": 2007,
		    "Doy": 61,
		    "SCF": 88.4628,
		    "Cloud": 99.7997,
		    "Age": 13.7263
		  },
		  {
		    "Year": 2007,
		    "Doy": 62,
		    "SCF": 88.4589,
		    "Cloud": 98.2392,
		    "Age": 14.4782
		  },
		  {
		    "Year": 2007,
		    "Doy": 63,
		    "SCF": 88.5533,
		    "Cloud": 92.8437,
		    "Age": 14.4701
		  },
		  {
		    "Year": 2007,
		    "Doy": 64,
		    "SCF": 89.5696,
		    "Cloud": 99.8955,
		    "Age": 15.4619
		  },
		  {
		    "Year": 2007,
		    "Doy": 65,
		    "SCF": 89.5796,
		    "Cloud": 99.9942,
		    "Age": 16.4619
		  },
		  {
		    "Year": 2007,
		    "Doy": 66,
		    "SCF": 89.5796,
		    "Cloud": 71.542,
		    "Age": 12.8363
		  },
		  {
		    "Year": 2007,
		    "Doy": 67,
		    "SCF": 88.812,
		    "Cloud": 33.7582,
		    "Age": 5.1092
		  },
		  {
		    "Year": 2007,
		    "Doy": 68,
		    "SCF": 83.1021,
		    "Cloud": 98.0071,
		    "Age": 5.99983
		  },
		  {
		    "Year": 2007,
		    "Doy": 69,
		    "SCF": 83.268,
		    "Cloud": 95.9663,
		    "Age": 6.77645
		  },
		  {
		    "Year": 2007,
		    "Doy": 70,
		    "SCF": 83.296,
		    "Cloud": 93.4792,
		    "Age": 7.24545
		  },
		  {
		    "Year": 2007,
		    "Doy": 71,
		    "SCF": 83.5098,
		    "Cloud": 84.3506,
		    "Age": 7.2177
		  },
		  {
		    "Year": 2007,
		    "Doy": 72,
		    "SCF": 84.2049,
		    "Cloud": 52.6852,
		    "Age": 4.35281
		  },
		  {
		    "Year": 2007,
		    "Doy": 73,
		    "SCF": 82.8438,
		    "Cloud": 88.1075,
		    "Age": 4.95669
		  },
		  {
		    "Year": 2007,
		    "Doy": 74,
		    "SCF": 82.2653,
		    "Cloud": 98.5771,
		    "Age": 5.87717
		  },
		  {
		    "Year": 2007,
		    "Doy": 75,
		    "SCF": 82.2834,
		    "Cloud": 88.4564,
		    "Age": 6.0559
		  },
		  {
		    "Year": 2007,
		    "Doy": 76,
		    "SCF": 82.135,
		    "Cloud": 18.0251,
		    "Age": 2.40572
		  },
		  {
		    "Year": 2007,
		    "Doy": 77,
		    "SCF": 78.2667,
		    "Cloud": 50.9463,
		    "Age": 2.54465
		  },
		  {
		    "Year": 2007,
		    "Doy": 78,
		    "SCF": 78.3274,
		    "Cloud": 93.8366,
		    "Age": 3.46982
		  },
		  {
		    "Year": 2007,
		    "Doy": 79,
		    "SCF": 78.5993,
		    "Cloud": 45.2602,
		    "Age": 2.94455
		  },
		  {
		    "Year": 2007,
		    "Doy": 80,
		    "SCF": 87.3653,
		    "Cloud": 0.504815,
		    "Age": 0.120166
		  },
		  {
		    "Year": 2007,
		    "Doy": 81,
		    "SCF": 81.7811,
		    "Cloud": 90.7827,
		    "Age": 1.00288
		  },
		  {
		    "Year": 2007,
		    "Doy": 82,
		    "SCF": 82.8244,
		    "Cloud": 69.669,
		    "Age": 1.40677
		  },
		  {
		    "Year": 2007,
		    "Doy": 83,
		    "SCF": 83.6159,
		    "Cloud": 83.191,
		    "Age": 1.91201
		  },
		  {
		    "Year": 2007,
		    "Doy": 84,
		    "SCF": 83.6119,
		    "Cloud": 3.62507,
		    "Age": 0.150896
		  },
		  {
		    "Year": 2007,
		    "Doy": 85,
		    "SCF": 84.6924,
		    "Cloud": 0.129471,
		    "Age": 0.0100377
		  },
		  {
		    "Year": 2007,
		    "Doy": 86,
		    "SCF": 80.0331,
		    "Cloud": 0.333362,
		    "Age": 0.0115876
		  },
		  {
		    "Year": 2007,
		    "Doy": 87,
		    "SCF": 83.7641,
		    "Cloud": 0.128032,
		    "Age": 0.00392824
		  },
		  {
		    "Year": 2007,
		    "Doy": 88,
		    "SCF": 77.3088,
		    "Cloud": 4.98748,
		    "Age": 0.0517377
		  },
		  {
		    "Year": 2007,
		    "Doy": 89,
		    "SCF": 82.0422,
		    "Cloud": 6.87704,
		    "Age": 0.082926
		  },
		  {
		    "Year": 2007,
		    "Doy": 90,
		    "SCF": 76.9958,
		    "Cloud": 41.1723,
		    "Age": 0.420495
		  },
		  {
		    "Year": 2007,
		    "Doy": 91,
		    "SCF": 77.3956,
		    "Cloud": 26.8568,
		    "Age": 0.358285
		  },
		  {
		    "Year": 2007,
		    "Doy": 92,
		    "SCF": 74.1361,
		    "Cloud": 89.4201,
		    "Age": 1.21731
		  },
		  {
		    "Year": 2007,
		    "Doy": 93,
		    "SCF": 74.042,
		    "Cloud": 5.67914,
		    "Age": 0.139758
		  },
		  {
		    "Year": 2007,
		    "Doy": 94,
		    "SCF": 69.9435,
		    "Cloud": 97.8349,
		    "Age": 1.11645
		  },
		  {
		    "Year": 2007,
		    "Doy": 95,
		    "SCF": 69.913,
		    "Cloud": 18.3486,
		    "Age": 0.427382
		  },
		  {
		    "Year": 2007,
		    "Doy": 96,
		    "SCF": 72.1329,
		    "Cloud": 38.6581,
		    "Age": 0.708048
		  },
		  {
		    "Year": 2007,
		    "Doy": 97,
		    "SCF": 71.1286,
		    "Cloud": 53.7329,
		    "Age": 0.978817
		  },
		  {
		    "Year": 2007,
		    "Doy": 98,
		    "SCF": 71.883,
		    "Cloud": 99.9956,
		    "Age": 1.97922
		  },
		  {
		    "Year": 2007,
		    "Doy": 99,
		    "SCF": 71.883,
		    "Cloud": 99.6373,
		    "Age": 2.95692
		  },
		  {
		    "Year": 2007,
		    "Doy": 100,
		    "SCF": 71.8466,
		    "Cloud": 99.9971,
		    "Age": 3.95692
		  },
		  {
		    "Year": 2007,
		    "Doy": 101,
		    "SCF": 71.8466,
		    "Cloud": 10.0935,
		    "Age": 0.640523
		  },
		  {
		    "Year": 2007,
		    "Doy": 102,
		    "SCF": 66.3317,
		    "Cloud": 56.8757,
		    "Age": 1.1725
		  },
		  {
		    "Year": 2007,
		    "Doy": 103,
		    "SCF": 66.0605,
		    "Cloud": 78.4628,
		    "Age": 1.93016
		  },
		  {
		    "Year": 2007,
		    "Doy": 104,
		    "SCF": 64.6596,
		    "Cloud": 66.5007,
		    "Age": 2.34402
		  },
		  {
		    "Year": 2007,
		    "Doy": 105,
		    "SCF": 63.7399,
		    "Cloud": 2.2985,
		    "Age": 0.0755138
		  },
		  {
		    "Year": 2007,
		    "Doy": 106,
		    "SCF": 58.8209,
		    "Cloud": 80.2436,
		    "Age": 0.872607
		  },
		  {
		    "Year": 2007,
		    "Doy": 107,
		    "SCF": 58.5758,
		    "Cloud": 66.9021,
		    "Age": 1.27973
		  },
		  {
		    "Year": 2007,
		    "Doy": 108,
		    "SCF": 57.6322,
		    "Cloud": 84.937,
		    "Age": 1.97756
		  },
		  {
		    "Year": 2007,
		    "Doy": 109,
		    "SCF": 57.4955,
		    "Cloud": 76.3553,
		    "Age": 2.3906
		  },
		  {
		    "Year": 2007,
		    "Doy": 110,
		    "SCF": 57.9273,
		    "Cloud": 18.339,
		    "Age": 0.774269
		  },
		  {
		    "Year": 2007,
		    "Doy": 111,
		    "SCF": 55.3308,
		    "Cloud": 2.01283,
		    "Age": 0.0592042
		  },
		  {
		    "Year": 2007,
		    "Doy": 112,
		    "SCF": 56.839,
		    "Cloud": 98.2019,
		    "Age": 1.03931
		  },
		  {
		    "Year": 2007,
		    "Doy": 113,
		    "SCF": 56.2392,
		    "Cloud": 30.7572,
		    "Age": 0.632665
		  },
		  {
		    "Year": 2007,
		    "Doy": 114,
		    "SCF": 49.9749,
		    "Cloud": 99.9927,
		    "Age": 1.63216
		  },
		  {
		    "Year": 2007,
		    "Doy": 115,
		    "SCF": 49.9749,
		    "Cloud": 99.9956,
		    "Age": 2.63204
		  },
		  {
		    "Year": 2007,
		    "Doy": 116,
		    "SCF": 49.9753,
		    "Cloud": 63.344,
		    "Age": 2.39888
		  },
		  {
		    "Year": 2007,
		    "Doy": 117,
		    "SCF": 49.5886,
		    "Cloud": 6.79394,
		    "Age": 0.352346
		  },
		  {
		    "Year": 2007,
		    "Doy": 118,
		    "SCF": 41.6277,
		    "Cloud": 33.4816,
		    "Age": 0.39291
		  },
		  {
		    "Year": 2007,
		    "Doy": 119,
		    "SCF": 39.689,
		    "Cloud": 84.6219,
		    "Age": 1.20816
		  },
		  {
		    "Year": 2007,
		    "Doy": 120,
		    "SCF": 39.4458,
		    "Cloud": 7.44242,
		    "Age": 0.225429
		  },
		  {
		    "Year": 2007,
		    "Doy": 121,
		    "SCF": 37.8041,
		    "Cloud": 10.9385,
		    "Age": 0.255991
		  },
		  {
		    "Year": 2007,
		    "Doy": 122,
		    "SCF": 33.7648,
		    "Cloud": 8.91593,
		    "Age": 0.230439
		  },
		  {
		    "Year": 2007,
		    "Doy": 123,
		    "SCF": 30.7029,
		    "Cloud": 11.9102,
		    "Age": 0.294882
		  },
		  {
		    "Year": 2007,
		    "Doy": 124,
		    "SCF": 29.5698,
		    "Cloud": 12.8175,
		    "Age": 0.333406
		  },
		  {
		    "Year": 2007,
		    "Doy": 125,
		    "SCF": 27.942,
		    "Cloud": 12.1489,
		    "Age": 0.340679
		  },
		  {
		    "Year": 2007,
		    "Doy": 126,
		    "SCF": 26.3379,
		    "Cloud": 99.3237,
		    "Age": 1.33347
		  },
		  {
		    "Year": 2007,
		    "Doy": 127,
		    "SCF": 26.2055,
		    "Cloud": 98.8471,
		    "Age": 2.30954
		  },
		  {
		    "Year": 2007,
		    "Doy": 128,
		    "SCF": 26.0671,
		    "Cloud": 78.924,
		    "Age": 2.66341
		  },
		  {
		    "Year": 2007,
		    "Doy": 129,
		    "SCF": 25.0523,
		    "Cloud": 62.1854,
		    "Age": 2.32009
		  },
		  {
		    "Year": 2007,
		    "Doy": 130,
		    "SCF": 24.1327,
		    "Cloud": 60.5234,
		    "Age": 2.09381
		  },
		  {
		    "Year": 2007,
		    "Doy": 131,
		    "SCF": 24.0676,
		    "Cloud": 47.3738,
		    "Age": 1.73563
		  },
		  {
		    "Year": 2007,
		    "Doy": 132,
		    "SCF": 23.1802,
		    "Cloud": 75.3611,
		    "Age": 2.11203
		  },
		  {
		    "Year": 2007,
		    "Doy": 133,
		    "SCF": 23.0718,
		    "Cloud": 97.4865,
		    "Age": 3.05839
		  },
		  {
		    "Year": 2007,
		    "Doy": 134,
		    "SCF": 22.9098,
		    "Cloud": 99.4722,
		    "Age": 4.05084
		  },
		  {
		    "Year": 2007,
		    "Doy": 135,
		    "SCF": 22.9031,
		    "Cloud": 48.0719,
		    "Age": 2.45752
		  },
		  {
		    "Year": 2007,
		    "Doy": 136,
		    "SCF": 21.3849,
		    "Cloud": 55.2813,
		    "Age": 2.10272
		  },
		  {
		    "Year": 2007,
		    "Doy": 137,
		    "SCF": 19.8147,
		    "Cloud": 45.6159,
		    "Age": 1.54419
		  },
		  {
		    "Year": 2007,
		    "Doy": 138,
		    "SCF": 17.7899,
		    "Cloud": 99.79,
		    "Age": 2.54435
		  },
		  {
		    "Year": 2007,
		    "Doy": 139,
		    "SCF": 17.7899,
		    "Cloud": 77.4399,
		    "Age": 2.89205
		  },
		  {
		    "Year": 2007,
		    "Doy": 140,
		    "SCF": 17.6724,
		    "Cloud": 63.8333,
		    "Age": 2.66684
		  },
		  {
		    "Year": 2007,
		    "Doy": 141,
		    "SCF": 17.153,
		    "Cloud": 49.3164,
		    "Age": 1.60007
		  },
		  {
		    "Year": 2007,
		    "Doy": 142,
		    "SCF": 14.6421,
		    "Cloud": 89.0641,
		    "Age": 2.2951
		  },
		  {
		    "Year": 2007,
		    "Doy": 143,
		    "SCF": 14.2121,
		    "Cloud": 84.9352,
		    "Age": 2.84367
		  },
		  {
		    "Year": 2007,
		    "Doy": 144,
		    "SCF": 14.055,
		    "Cloud": 98.1528,
		    "Age": 3.77262
		  },
		  {
		    "Year": 2007,
		    "Doy": 145,
		    "SCF": 13.817,
		    "Cloud": 45.3296,
		    "Age": 2.10212
		  },
		  {
		    "Year": 2007,
		    "Doy": 146,
		    "SCF": 12.5023,
		    "Cloud": 20.0648,
		    "Age": 0.910363
		  },
		  {
		    "Year": 2007,
		    "Doy": 147,
		    "SCF": 11.6384,
		    "Cloud": 33.4402,
		    "Age": 0.956686
		  },
		  {
		    "Year": 2007,
		    "Doy": 148,
		    "SCF": 10.2099,
		    "Cloud": 99.0347,
		    "Age": 1.94332
		  },
		  {
		    "Year": 2007,
		    "Doy": 149,
		    "SCF": 9.76158,
		    "Cloud": 99.9927,
		    "Age": 2.94332
		  },
		  {
		    "Year": 2007,
		    "Doy": 150,
		    "SCF": 9.76158,
		    "Cloud": 98.1963,
		    "Age": 3.88414
		  },
		  {
		    "Year": 2007,
		    "Doy": 151,
		    "SCF": 8.41505,
		    "Cloud": 99.9446,
		    "Age": 4.88177
		  },
		  {
		    "Year": 2007,
		    "Doy": 152,
		    "SCF": 8.41483,
		    "Cloud": 99.3715,
		    "Age": 5.85517
		  },
		  {
		    "Year": 2007,
		    "Doy": 153,
		    "SCF": 8.32066,
		    "Cloud": 83.8286,
		    "Age": 5.86484
		  },
		  {
		    "Year": 2007,
		    "Doy": 154,
		    "SCF": 8.18531,
		    "Cloud": 6.52152,
		    "Age": 0.626967
		  },
		  {
		    "Year": 2007,
		    "Doy": 155,
		    "SCF": 6.80348,
		    "Cloud": 8.15654,
		    "Age": 0.440517
		  },
		  {
		    "Year": 2007,
		    "Doy": 156,
		    "SCF": 5.72598,
		    "Cloud": 49.5324,
		    "Age": 0.833472
		  },
		  {
		    "Year": 2007,
		    "Doy": 157,
		    "SCF": 5.20997,
		    "Cloud": 29.3179,
		    "Age": 0.774317
		  },
		  {
		    "Year": 2007,
		    "Doy": 158,
		    "SCF": 4.7103,
		    "Cloud": 25.7661,
		    "Age": 0.798754
		  },
		  {
		    "Year": 2007,
		    "Doy": 159,
		    "SCF": 4.3984,
		    "Cloud": 9.78381,
		    "Age": 0.282326
		  },
		  {
		    "Year": 2007,
		    "Doy": 160,
		    "SCF": 4.44203,
		    "Cloud": 51.4345,
		    "Age": 0.682915
		  },
		  {
		    "Year": 2007,
		    "Doy": 161,
		    "SCF": 4.04691,
		    "Cloud": 22.8554,
		    "Age": 0.450036
		  },
		  {
		    "Year": 2007,
		    "Doy": 162,
		    "SCF": 3.96316,
		    "Cloud": 4.15773,
		    "Age": 0.149591
		  },
		  {
		    "Year": 2007,
		    "Doy": 163,
		    "SCF": 4.49201,
		    "Cloud": 77.4405,
		    "Age": 0.92271
		  },
		  {
		    "Year": 2007,
		    "Doy": 164,
		    "SCF": 4.32174,
		    "Cloud": 52.1283,
		    "Age": 1.07837
		  },
		  {
		    "Year": 2007,
		    "Doy": 165,
		    "SCF": 4.68949,
		    "Cloud": 84.3528,
		    "Age": 1.8178
		  },
		  {
		    "Year": 2007,
		    "Doy": 166,
		    "SCF": 3.52996,
		    "Cloud": 4.49337,
		    "Age": 0.253011
		  },
		  {
		    "Year": 2007,
		    "Doy": 167,
		    "SCF": 3.11531,
		    "Cloud": 5.14949,
		    "Age": 0.231764
		  },
		  {
		    "Year": 2007,
		    "Doy": 168,
		    "SCF": 2.93561,
		    "Cloud": 99.8745,
		    "Age": 1.23049
		  },
		  {
		    "Year": 2007,
		    "Doy": 169,
		    "SCF": 2.83086,
		    "Cloud": 50.4196,
		    "Age": 1.18071
		  },
		  {
		    "Year": 2007,
		    "Doy": 170,
		    "SCF": 2.33351,
		    "Cloud": 13.8008,
		    "Age": 0.455842
		  },
		  {
		    "Year": 2007,
		    "Doy": 171,
		    "SCF": 2.07781,
		    "Cloud": 22.9811,
		    "Age": 0.402564
		  },
		  {
		    "Year": 2007,
		    "Doy": 172,
		    "SCF": 2.43813,
		    "Cloud": 79.8341,
		    "Age": 1.12249
		  },
		  {
		    "Year": 2007,
		    "Doy": 173,
		    "SCF": 2.63013,
		    "Cloud": 99.879,
		    "Age": 2.1222
		  },
		  {
		    "Year": 2007,
		    "Doy": 174,
		    "SCF": 2.63013,
		    "Cloud": 99.8746,
		    "Age": 3.11825
		  },
		  {
		    "Year": 2007,
		    "Doy": 175,
		    "SCF": 2.52167,
		    "Cloud": 89.7722,
		    "Age": 3.75357
		  },
		  {
		    "Year": 2007,
		    "Doy": 176,
		    "SCF": 2.58748,
		    "Cloud": 50.1539,
		    "Age": 2.5051
		  },
		  {
		    "Year": 2007,
		    "Doy": 177,
		    "SCF": 1.78411,
		    "Cloud": 88.5003,
		    "Age": 3.02458
		  },
		  {
		    "Year": 2007,
		    "Doy": 178,
		    "SCF": 1.61238,
		    "Cloud": 80.4325,
		    "Age": 3.25764
		  },
		  {
		    "Year": 2007,
		    "Doy": 179,
		    "SCF": 1.69802,
		    "Cloud": 62.2337,
		    "Age": 2.52666
		  },
		  {
		    "Year": 2007,
		    "Doy": 180,
		    "SCF": 1.83119,
		    "Cloud": 97.2405,
		    "Age": 3.4382
		  },
		  {
		    "Year": 2007,
		    "Doy": 181,
		    "SCF": 1.66072,
		    "Cloud": 98.0368,
		    "Age": 4.3665
		  },
		  {
		    "Year": 2007,
		    "Doy": 182,
		    "SCF": 1.56988,
		    "Cloud": 97.0138,
		    "Age": 5.24351
		  },
		  {
		    "Year": 2007,
		    "Doy": 183,
		    "SCF": 1.45849,
		    "Cloud": 99.0008,
		    "Age": 6.24167
		  },
		  {
		    "Year": 2007,
		    "Doy": 184,
		    "SCF": 1.45801,
		    "Cloud": 99.3757,
		    "Age": 7.21233
		  },
		  {
		    "Year": 2007,
		    "Doy": 185,
		    "SCF": 1.0013,
		    "Cloud": 98.6858,
		    "Age": 8.21111
		  },
		  {
		    "Year": 2007,
		    "Doy": 186,
		    "SCF": 0.982948,
		    "Cloud": 99.663,
		    "Age": 9.18367
		  },
		  {
		    "Year": 2007,
		    "Doy": 187,
		    "SCF": 0.949107,
		    "Cloud": 45.1762,
		    "Age": 4.65279
		  },
		  {
		    "Year": 2007,
		    "Doy": 188,
		    "SCF": 1.03965,
		    "Cloud": 66.1164,
		    "Age": 3.82124
		  },
		  {
		    "Year": 2007,
		    "Doy": 189,
		    "SCF": 1.31499,
		    "Cloud": 99.6223,
		    "Age": 4.81096
		  },
		  {
		    "Year": 2007,
		    "Doy": 190,
		    "SCF": 1.2897,
		    "Cloud": 99.8921,
		    "Age": 5.80666
		  },
		  {
		    "Year": 2007,
		    "Doy": 191,
		    "SCF": 1.19538,
		    "Cloud": 99.9504,
		    "Age": 6.80248
		  },
		  {
		    "Year": 2007,
		    "Doy": 192,
		    "SCF": 1.16976,
		    "Cloud": 88.7756,
		    "Age": 6.98033
		  },
		  {
		    "Year": 2007,
		    "Doy": 193,
		    "SCF": 0.894556,
		    "Cloud": 99.0026,
		    "Age": 7.91023
		  },
		  {
		    "Year": 2007,
		    "Doy": 194,
		    "SCF": 0.8323,
		    "Cloud": 93.1237,
		    "Age": 8.3807
		  },
		  {
		    "Year": 2007,
		    "Doy": 195,
		    "SCF": 0.689058,
		    "Cloud": 99.9125,
		    "Age": 9.36982
		  },
		  {
		    "Year": 2007,
		    "Doy": 196,
		    "SCF": 0.616459,
		    "Cloud": 78.7729,
		    "Age": 8.0225
		  },
		  {
		    "Year": 2007,
		    "Doy": 197,
		    "SCF": 0.578757,
		    "Cloud": 31.9914,
		    "Age": 3.54525
		  },
		  {
		    "Year": 2007,
		    "Doy": 198,
		    "SCF": 1.01705,
		    "Cloud": 98.7856,
		    "Age": 4.54769
		  },
		  {
		    "Year": 2007,
		    "Doy": 199,
		    "SCF": 1.01705,
		    "Cloud": 96.7568,
		    "Age": 5.44087
		  },
		  {
		    "Year": 2007,
		    "Doy": 200,
		    "SCF": 0.807358,
		    "Cloud": 65.3624,
		    "Age": 4.20188
		  },
		  {
		    "Year": 2007,
		    "Doy": 201,
		    "SCF": 0.807278,
		    "Cloud": 52.3828,
		    "Age": 2.94003
		  },
		  {
		    "Year": 2007,
		    "Doy": 202,
		    "SCF": 0.86452,
		    "Cloud": 52.0095,
		    "Age": 2.31874
		  },
		  {
		    "Year": 2007,
		    "Doy": 203,
		    "SCF": 1.16399,
		    "Cloud": 83.2962,
		    "Age": 2.88488
		  },
		  {
		    "Year": 2007,
		    "Doy": 204,
		    "SCF": 1.21742,
		    "Cloud": 99.9942,
		    "Age": 3.88497
		  },
		  {
		    "Year": 2007,
		    "Doy": 205,
		    "SCF": 1.21742,
		    "Cloud": 97.6422,
		    "Age": 4.76491
		  },
		  {
		    "Year": 2007,
		    "Doy": 206,
		    "SCF": 1.15487,
		    "Cloud": 62.214,
		    "Age": 3.83075
		  },
		  {
		    "Year": 2007,
		    "Doy": 207,
		    "SCF": 1.29428,
		    "Cloud": 76.7452,
		    "Age": 3.54393
		  },
		  {
		    "Year": 2007,
		    "Doy": 208,
		    "SCF": 1.37036,
		    "Cloud": 91.3693,
		    "Age": 4.24101
		  },
		  {
		    "Year": 2007,
		    "Doy": 209,
		    "SCF": 1.31237,
		    "Cloud": 83.9847,
		    "Age": 4.56162
		  },
		  {
		    "Year": 2007,
		    "Doy": 210,
		    "SCF": 1.10742,
		    "Cloud": 74.981,
		    "Age": 4.10797
		  },
		  {
		    "Year": 2007,
		    "Doy": 211,
		    "SCF": 1.12435,
		    "Cloud": 95.9439,
		    "Age": 4.94694
		  },
		  {
		    "Year": 2007,
		    "Doy": 212,
		    "SCF": 0.689796,
		    "Cloud": 63.0799,
		    "Age": 4.01595
		  },
		  {
		    "Year": 2007,
		    "Doy": 213,
		    "SCF": 0.744811,
		    "Cloud": 98.1666,
		    "Age": 4.9082
		  },
		  {
		    "Year": 2007,
		    "Doy": 214,
		    "SCF": 0.564038,
		    "Cloud": 49.9584,
		    "Age": 3.33701
		  },
		  {
		    "Year": 2007,
		    "Doy": 215,
		    "SCF": 0.434871,
		    "Cloud": 27.0159,
		    "Age": 1.49578
		  },
		  {
		    "Year": 2007,
		    "Doy": 216,
		    "SCF": 0.584065,
		    "Cloud": 99.0826,
		    "Age": 2.47524
		  },
		  {
		    "Year": 2007,
		    "Doy": 217,
		    "SCF": 0.507088,
		    "Cloud": 98.6247,
		    "Age": 3.46027
		  },
		  {
		    "Year": 2007,
		    "Doy": 218,
		    "SCF": 0.437475,
		    "Cloud": 77.3269,
		    "Age": 3.60889
		  },
		  {
		    "Year": 2007,
		    "Doy": 219,
		    "SCF": 0.399247,
		    "Cloud": 65.9883,
		    "Age": 3.45899
		  },
		  {
		    "Year": 2007,
		    "Doy": 220,
		    "SCF": 0.720692,
		    "Cloud": 59.9606,
		    "Age": 3.08482
		  },
		  {
		    "Year": 2007,
		    "Doy": 221,
		    "SCF": 1.02082,
		    "Cloud": 53.9859,
		    "Age": 2.12702
		  },
		  {
		    "Year": 2007,
		    "Doy": 222,
		    "SCF": 1.29103,
		    "Cloud": 85.3323,
		    "Age": 2.77219
		  },
		  {
		    "Year": 2007,
		    "Doy": 223,
		    "SCF": 1.39307,
		    "Cloud": 99.835,
		    "Age": 3.76966
		  },
		  {
		    "Year": 2007,
		    "Doy": 224,
		    "SCF": 1.39307,
		    "Cloud": 94.4722,
		    "Age": 4.52344
		  },
		  {
		    "Year": 2007,
		    "Doy": 225,
		    "SCF": 0.74186,
		    "Cloud": 39.5559,
		    "Age": 2.33384
		  },
		  {
		    "Year": 2007,
		    "Doy": 226,
		    "SCF": 1.03947,
		    "Cloud": 70.3503,
		    "Age": 2.42291
		  },
		  {
		    "Year": 2007,
		    "Doy": 227,
		    "SCF": 1.27897,
		    "Cloud": 99.3305,
		    "Age": 3.4092
		  },
		  {
		    "Year": 2007,
		    "Doy": 228,
		    "SCF": 0.7189,
		    "Cloud": 55.635,
		    "Age": 2.65119
		  },
		  {
		    "Year": 2007,
		    "Doy": 229,
		    "SCF": 0.854589,
		    "Cloud": 97.2868,
		    "Age": 3.52021
		  },
		  {
		    "Year": 2007,
		    "Doy": 230,
		    "SCF": 0.624555,
		    "Cloud": 86.7141,
		    "Age": 4.00984
		  },
		  {
		    "Year": 2007,
		    "Doy": 231,
		    "SCF": 0.650823,
		    "Cloud": 97.7103,
		    "Age": 4.9269
		  },
		  {
		    "Year": 2007,
		    "Doy": 232,
		    "SCF": 0.346176,
		    "Cloud": 99.9621,
		    "Age": 5.92551
		  },
		  {
		    "Year": 2007,
		    "Doy": 233,
		    "SCF": 0.323526,
		    "Cloud": 24.3553,
		    "Age": 1.70897
		  },
		  {
		    "Year": 2007,
		    "Doy": 234,
		    "SCF": 0.273802,
		    "Cloud": 7.86771,
		    "Age": 0.33735
		  },
		  {
		    "Year": 2007,
		    "Doy": 235,
		    "SCF": 0.347338,
		    "Cloud": 0.617068,
		    "Age": 0.0876295
		  },
		  {
		    "Year": 2007,
		    "Doy": 236,
		    "SCF": 0.433994,
		    "Cloud": 7.17216,
		    "Age": 0.144027
		  },
		  {
		    "Year": 2007,
		    "Doy": 237,
		    "SCF": 0.782278,
		    "Cloud": 10.7489,
		    "Age": 0.184951
		  },
		  {
		    "Year": 2007,
		    "Doy": 238,
		    "SCF": 1.28971,
		    "Cloud": 35.4001,
		    "Age": 0.507895
		  },
		  {
		    "Year": 2007,
		    "Doy": 239,
		    "SCF": 1.74754,
		    "Cloud": 93.145,
		    "Age": 1.41701
		  },
		  {
		    "Year": 2007,
		    "Doy": 240,
		    "SCF": 1.3307,
		    "Cloud": 44.7457,
		    "Age": 1.11982
		  },
		  {
		    "Year": 2007,
		    "Doy": 241,
		    "SCF": 1.80895,
		    "Cloud": 93.6508,
		    "Age": 2.00915
		  },
		  {
		    "Year": 2007,
		    "Doy": 242,
		    "SCF": 1.41002,
		    "Cloud": 32.0065,
		    "Age": 1.03549
		  },
		  {
		    "Year": 2007,
		    "Doy": 243,
		    "SCF": 2.24737,
		    "Cloud": 72.3686,
		    "Age": 1.54907
		  },
		  {
		    "Year": 2007,
		    "Doy": 244,
		    "SCF": 2.66805,
		    "Cloud": 98.16,
		    "Age": 2.50053
		  },
		  {
		    "Year": 2007,
		    "Doy": 245,
		    "SCF": 1.14081,
		    "Cloud": 30.3031,
		    "Age": 1.096
		  },
		  {
		    "Year": 2007,
		    "Doy": 246,
		    "SCF": 1.14213,
		    "Cloud": 60.5401,
		    "Age": 1.36179
		  },
		  {
		    "Year": 2007,
		    "Doy": 247,
		    "SCF": 0.869522,
		    "Cloud": 2.93907,
		    "Age": 0.114907
		  },
		  {
		    "Year": 2007,
		    "Doy": 248,
		    "SCF": 1.28644,
		    "Cloud": 63.8848,
		    "Age": 0.745318
		  },
		  {
		    "Year": 2007,
		    "Doy": 249,
		    "SCF": 1.52731,
		    "Cloud": 74.7727,
		    "Age": 1.28161
		  },
		  {
		    "Year": 2007,
		    "Doy": 250,
		    "SCF": 1.89148,
		    "Cloud": 78.4495,
		    "Age": 1.81423
		  },
		  {
		    "Year": 2007,
		    "Doy": 251,
		    "SCF": 2.02867,
		    "Cloud": 55.4995,
		    "Age": 1.64405
		  },
		  {
		    "Year": 2007,
		    "Doy": 252,
		    "SCF": 1.19272,
		    "Cloud": 45.3968,
		    "Age": 1.31822
		  },
		  {
		    "Year": 2007,
		    "Doy": 253,
		    "SCF": 1.27232,
		    "Cloud": 90.8036,
		    "Age": 2.09376
		  },
		  {
		    "Year": 2007,
		    "Doy": 254,
		    "SCF": 0.508502,
		    "Cloud": 3.94342,
		    "Age": 0.191512
		  },
		  {
		    "Year": 2007,
		    "Doy": 255,
		    "SCF": 1.21938,
		    "Cloud": 50.5465,
		    "Age": 0.602428
		  },
		  {
		    "Year": 2007,
		    "Doy": 256,
		    "SCF": 1.2911,
		    "Cloud": 17.7053,
		    "Age": 0.341427
		  },
		  {
		    "Year": 2007,
		    "Doy": 257,
		    "SCF": 3.30873,
		    "Cloud": 47.6316,
		    "Age": 0.684999
		  },
		  {
		    "Year": 2007,
		    "Doy": 258,
		    "SCF": 2.82828,
		    "Cloud": 13.3661,
		    "Age": 0.292529
		  },
		  {
		    "Year": 2007,
		    "Doy": 259,
		    "SCF": 3.1531,
		    "Cloud": 99.9956,
		    "Age": 1.29243
		  },
		  {
		    "Year": 2007,
		    "Doy": 260,
		    "SCF": 3.1531,
		    "Cloud": 18.8375,
		    "Age": 0.568683
		  },
		  {
		    "Year": 2007,
		    "Doy": 261,
		    "SCF": 3.99549,
		    "Cloud": 50.6076,
		    "Age": 0.859458
		  },
		  {
		    "Year": 2007,
		    "Doy": 262,
		    "SCF": 5.23497,
		    "Cloud": 99.349,
		    "Age": 1.84135
		  },
		  {
		    "Year": 2007,
		    "Doy": 263,
		    "SCF": 4.93788,
		    "Cloud": 99.9578,
		    "Age": 2.8396
		  },
		  {
		    "Year": 2007,
		    "Doy": 264,
		    "SCF": 4.91978,
		    "Cloud": 93.8377,
		    "Age": 3.60447
		  },
		  {
		    "Year": 2007,
		    "Doy": 265,
		    "SCF": 4.55968,
		    "Cloud": 83.0131,
		    "Age": 3.80236
		  },
		  {
		    "Year": 2007,
		    "Doy": 266,
		    "SCF": 3.27761,
		    "Cloud": 99.9942,
		    "Age": 4.80286
		  },
		  {
		    "Year": 2007,
		    "Doy": 267,
		    "SCF": 3.27761,
		    "Cloud": 99.4755,
		    "Age": 5.77391
		  },
		  {
		    "Year": 2007,
		    "Doy": 268,
		    "SCF": 3.17836,
		    "Cloud": 62.4444,
		    "Age": 4.36604
		  },
		  {
		    "Year": 2007,
		    "Doy": 269,
		    "SCF": 0.906719,
		    "Cloud": 28.1856,
		    "Age": 1.19485
		  },
		  {
		    "Year": 2007,
		    "Doy": 270,
		    "SCF": 0.853637,
		    "Cloud": 12.8078,
		    "Age": 0.51017
		  },
		  {
		    "Year": 2007,
		    "Doy": 271,
		    "SCF": 0.953915,
		    "Cloud": 3.66167,
		    "Age": 0.169939
		  },
		  {
		    "Year": 2007,
		    "Doy": 272,
		    "SCF": 3.44579,
		    "Cloud": 99.981,
		    "Age": 1.16982
		  },
		  {
		    "Year": 2007,
		    "Doy": 273,
		    "SCF": 3.44174,
		    "Cloud": 99.1833,
		    "Age": 2.15347
		  },
		  {
		    "Year": 2007,
		    "Doy": 274,
		    "SCF": 2.83944,
		    "Cloud": 87.5551,
		    "Age": 2.7737
		  },
		  {
		    "Year": 2007,
		    "Doy": 275,
		    "SCF": 1.04598,
		    "Cloud": 14.5362,
		    "Age": 0.659869
		  },
		  {
		    "Year": 2007,
		    "Doy": 276,
		    "SCF": 1.40859,
		    "Cloud": 13.5448,
		    "Age": 0.388079
		  },
		  {
		    "Year": 2007,
		    "Doy": 277,
		    "SCF": 1.52205,
		    "Cloud": 91.7899,
		    "Age": 1.24124
		  },
		  {
		    "Year": 2007,
		    "Doy": 278,
		    "SCF": 1.19785,
		    "Cloud": 12.7564,
		    "Age": 0.338517
		  },
		  {
		    "Year": 2007,
		    "Doy": 279,
		    "SCF": 3.99461,
		    "Cloud": 62.7528,
		    "Age": 0.834655
		  },
		  {
		    "Year": 2007,
		    "Doy": 280,
		    "SCF": 3.11647,
		    "Cloud": 51.7089,
		    "Age": 1.05585
		  },
		  {
		    "Year": 2007,
		    "Doy": 281,
		    "SCF": 2.58438,
		    "Cloud": 3.95582,
		    "Age": 0.184366
		  },
		  {
		    "Year": 2007,
		    "Doy": 282,
		    "SCF": 3.27429,
		    "Cloud": 21.8043,
		    "Age": 0.322566
		  },
		  {
		    "Year": 2007,
		    "Doy": 283,
		    "SCF": 3.51994,
		    "Cloud": 11.4187,
		    "Age": 0.220016
		  },
		  {
		    "Year": 2007,
		    "Doy": 284,
		    "SCF": 9.99593,
		    "Cloud": 95.2805,
		    "Age": 1.15859
		  },
		  {
		    "Year": 2007,
		    "Doy": 285,
		    "SCF": 8.56112,
		    "Cloud": 7.62903,
		    "Age": 0.206747
		  },
		  {
		    "Year": 2007,
		    "Doy": 286,
		    "SCF": 5.7616,
		    "Cloud": 92.6824,
		    "Age": 1.12797
		  },
		  {
		    "Year": 2007,
		    "Doy": 287,
		    "SCF": 5.9585,
		    "Cloud": 98.9287,
		    "Age": 2.10617
		  },
		  {
		    "Year": 2007,
		    "Doy": 288,
		    "SCF": 5.75111,
		    "Cloud": 33.6282,
		    "Age": 1.06228
		  },
		  {
		    "Year": 2007,
		    "Doy": 289,
		    "SCF": 8.26441,
		    "Cloud": 51.1821,
		    "Age": 1.11432
		  },
		  {
		    "Year": 2007,
		    "Doy": 290,
		    "SCF": 8.56489,
		    "Cloud": 40.1456,
		    "Age": 0.989555
		  },
		  {
		    "Year": 2007,
		    "Doy": 291,
		    "SCF": 8.20247,
		    "Cloud": 37.1435,
		    "Age": 0.91906
		  },
		  {
		    "Year": 2007,
		    "Doy": 292,
		    "SCF": 8.42579,
		    "Cloud": 14.6314,
		    "Age": 0.334455
		  },
		  {
		    "Year": 2007,
		    "Doy": 293,
		    "SCF": 4.66166,
		    "Cloud": 89.5237,
		    "Age": 1.20354
		  },
		  {
		    "Year": 2007,
		    "Doy": 294,
		    "SCF": 4.4628,
		    "Cloud": 93.2091,
		    "Age": 2.07483
		  },
		  {
		    "Year": 2007,
		    "Doy": 295,
		    "SCF": 4.00741,
		    "Cloud": 99.9782,
		    "Age": 3.07433
		  },
		  {
		    "Year": 2007,
		    "Doy": 296,
		    "SCF": 3.99927,
		    "Cloud": 49.3513,
		    "Age": 2.09929
		  },
		  {
		    "Year": 2007,
		    "Doy": 297,
		    "SCF": 3.77687,
		    "Cloud": 48.0664,
		    "Age": 1.53731
		  },
		  {
		    "Year": 2007,
		    "Doy": 298,
		    "SCF": 4.43664,
		    "Cloud": 79.0091,
		    "Age": 2.14049
		  },
		  {
		    "Year": 2007,
		    "Doy": 299,
		    "SCF": 4.19913,
		    "Cloud": 27.8238,
		    "Age": 1.32996
		  },
		  {
		    "Year": 2007,
		    "Doy": 300,
		    "SCF": 11.1626,
		    "Cloud": 99.7277,
		    "Age": 2.32599
		  },
		  {
		    "Year": 2007,
		    "Doy": 301,
		    "SCF": 11.1227,
		    "Cloud": 99.9898,
		    "Age": 3.32576
		  },
		  {
		    "Year": 2007,
		    "Doy": 302,
		    "SCF": 11.1195,
		    "Cloud": 39.1682,
		    "Age": 1.72958
		  },
		  {
		    "Year": 2007,
		    "Doy": 303,
		    "SCF": 14.7361,
		    "Cloud": 20.9443,
		    "Age": 0.618373
		  },
		  {
		    "Year": 2007,
		    "Doy": 304,
		    "SCF": 13.499,
		    "Cloud": 97.5124,
		    "Age": 1.55771
		  },
		  {
		    "Year": 2007,
		    "Doy": 305,
		    "SCF": 12.4662,
		    "Cloud": 7.93269,
		    "Age": 0.340085
		  },
		  {
		    "Year": 2007,
		    "Doy": 306,
		    "SCF": 12.7564,
		    "Cloud": 95.1381,
		    "Age": 1.29202
		  },
		  {
		    "Year": 2007,
		    "Doy": 307,
		    "SCF": 12.2594,
		    "Cloud": 14.0071,
		    "Age": 0.527524
		  },
		  {
		    "Year": 2007,
		    "Doy": 308,
		    "SCF": 22.7862,
		    "Cloud": 27.6868,
		    "Age": 0.547075
		  },
		  {
		    "Year": 2007,
		    "Doy": 309,
		    "SCF": 43.429,
		    "Cloud": 96.5136,
		    "Age": 1.50879
		  },
		  {
		    "Year": 2007,
		    "Doy": 310,
		    "SCF": 43.4376,
		    "Cloud": 22.8829,
		    "Age": 0.792976
		  },
		  {
		    "Year": 2007,
		    "Doy": 311,
		    "SCF": 46.3763,
		    "Cloud": 67.4004,
		    "Age": 1.32463
		  },
		  {
		    "Year": 2007,
		    "Doy": 312,
		    "SCF": 47.7671,
		    "Cloud": 92.443,
		    "Age": 2.13499
		  },
		  {
		    "Year": 2007,
		    "Doy": 313,
		    "SCF": 47.9802,
		    "Cloud": 52.6939,
		    "Age": 1.73007
		  },
		  {
		    "Year": 2007,
		    "Doy": 314,
		    "SCF": 46.8817,
		    "Cloud": 26.9639,
		    "Age": 0.97683
		  },
		  {
		    "Year": 2007,
		    "Doy": 315,
		    "SCF": 52.7228,
		    "Cloud": 86.8648,
		    "Age": 1.70728
		  },
		  {
		    "Year": 2007,
		    "Doy": 316,
		    "SCF": 51.3339,
		    "Cloud": 68.968,
		    "Age": 1.89361
		  },
		  {
		    "Year": 2007,
		    "Doy": 317,
		    "SCF": 53.1846,
		    "Cloud": 99.658,
		    "Age": 2.87547
		  },
		  {
		    "Year": 2007,
		    "Doy": 318,
		    "SCF": 53.2138,
		    "Cloud": 60.7723,
		    "Age": 2.27224
		  },
		  {
		    "Year": 2007,
		    "Doy": 319,
		    "SCF": 52.5575,
		    "Cloud": 100,
		    "Age": 3.27148
		  },
		  {
		    "Year": 2007,
		    "Doy": 320,
		    "SCF": 52.5575,
		    "Cloud": 99.9665,
		    "Age": 4.27116
		  },
		  {
		    "Year": 2007,
		    "Doy": 321,
		    "SCF": 52.5604,
		    "Cloud": 63.355,
		    "Age": 3.26771
		  },
		  {
		    "Year": 2007,
		    "Doy": 322,
		    "SCF": 55.0988,
		    "Cloud": 45.0671,
		    "Age": 1.96104
		  },
		  {
		    "Year": 2007,
		    "Doy": 323,
		    "SCF": 59.1481,
		    "Cloud": 29.3152,
		    "Age": 1.18083
		  },
		  {
		    "Year": 2007,
		    "Doy": 324,
		    "SCF": 75.8568,
		    "Cloud": 84.8343,
		    "Age": 1.90137
		  },
		  {
		    "Year": 2007,
		    "Doy": 325,
		    "SCF": 76.6997,
		    "Cloud": 99.7496,
		    "Age": 2.88204
		  },
		  {
		    "Year": 2007,
		    "Doy": 326,
		    "SCF": 76.6956,
		    "Cloud": 99.7306,
		    "Age": 3.87505
		  },
		  {
		    "Year": 2007,
		    "Doy": 327,
		    "SCF": 76.729,
		    "Cloud": 17.1296,
		    "Age": 0.98545
		  },
		  {
		    "Year": 2007,
		    "Doy": 328,
		    "SCF": 69.909,
		    "Cloud": 99.0576,
		    "Age": 1.96587
		  },
		  {
		    "Year": 2007,
		    "Doy": 329,
		    "SCF": 69.9642,
		    "Cloud": 70.8118,
		    "Age": 2.14793
		  },
		  {
		    "Year": 2007,
		    "Doy": 330,
		    "SCF": 67.7764,
		    "Cloud": 26.364,
		    "Age": 1.15655
		  },
		  {
		    "Year": 2007,
		    "Doy": 331,
		    "SCF": 74.8577,
		    "Cloud": 56.1287,
		    "Age": 1.44408
		  },
		  {
		    "Year": 2007,
		    "Doy": 332,
		    "SCF": 84.5819,
		    "Cloud": 99.6979,
		    "Age": 2.42558
		  },
		  {
		    "Year": 2007,
		    "Doy": 333,
		    "SCF": 84.6519,
		    "Cloud": 81.4534,
		    "Age": 2.72677
		  },
		  {
		    "Year": 2007,
		    "Doy": 334,
		    "SCF": 86.6593,
		    "Cloud": 100,
		    "Age": 3.73309
		  },
		  {
		    "Year": 2007,
		    "Doy": 335,
		    "SCF": 86.6593,
		    "Cloud": 99.9956,
		    "Age": 4.73309
		  },
		  {
		    "Year": 2007,
		    "Doy": 336,
		    "SCF": 86.6593,
		    "Cloud": 26.5342,
		    "Age": 1.61316
		  },
		  {
		    "Year": 2007,
		    "Doy": 337,
		    "SCF": 88.6111,
		    "Cloud": 95.3588,
		    "Age": 2.45682
		  },
		  {
		    "Year": 2007,
		    "Doy": 338,
		    "SCF": 88.9083,
		    "Cloud": 20.232,
		    "Age": 0.937242
		  },
		  {
		    "Year": 2007,
		    "Doy": 339,
		    "SCF": 77.9194,
		    "Cloud": 99.4501,
		    "Age": 1.93081
		  },
		  {
		    "Year": 2007,
		    "Doy": 340,
		    "SCF": 77.9976,
		    "Cloud": 76.1871,
		    "Age": 2.26384
		  },
		  {
		    "Year": 2007,
		    "Doy": 341,
		    "SCF": 78.1242,
		    "Cloud": 86.1151,
		    "Age": 2.80721
		  },
		  {
		    "Year": 2007,
		    "Doy": 342,
		    "SCF": 79.1237,
		    "Cloud": 81.6872,
		    "Age": 3.16161
		  },
		  {
		    "Year": 2007,
		    "Doy": 343,
		    "SCF": 79.6663,
		    "Cloud": 74.628,
		    "Age": 2.99722
		  },
		  {
		    "Year": 2007,
		    "Doy": 344,
		    "SCF": 83.6068,
		    "Cloud": 96.6701,
		    "Age": 3.88242
		  },
		  {
		    "Year": 2007,
		    "Doy": 345,
		    "SCF": 83.2702,
		    "Cloud": 24.2799,
		    "Age": 1.29105
		  },
		  {
		    "Year": 2007,
		    "Doy": 346,
		    "SCF": 85.5927,
		    "Cloud": 23.5463,
		    "Age": 0.714228
		  },
		  {
		    "Year": 2007,
		    "Doy": 347,
		    "SCF": 85.824,
		    "Cloud": 16.3102,
		    "Age": 0.537522
		  },
		  {
		    "Year": 2007,
		    "Doy": 348,
		    "SCF": 86.4017,
		    "Cloud": 18.4502,
		    "Age": 0.552911
		  },
		  {
		    "Year": 2007,
		    "Doy": 349,
		    "SCF": 87.0127,
		    "Cloud": 15.6377,
		    "Age": 0.522467
		  },
		  {
		    "Year": 2007,
		    "Doy": 350,
		    "SCF": 88.3021,
		    "Cloud": 20.1698,
		    "Age": 0.581282
		  },
		  {
		    "Year": 2007,
		    "Doy": 351,
		    "SCF": 89.8592,
		    "Cloud": 12.4836,
		    "Age": 0.391791
		  },
		  {
		    "Year": 2007,
		    "Doy": 352,
		    "SCF": 86.5361,
		    "Cloud": 13.6618,
		    "Age": 0.412167
		  },
		  {
		    "Year": 2007,
		    "Doy": 353,
		    "SCF": 84.4711,
		    "Cloud": 86.888,
		    "Age": 1.23668
		  },
		  {
		    "Year": 2007,
		    "Doy": 354,
		    "SCF": 85.0106,
		    "Cloud": 13.0335,
		    "Age": 0.659263
		  },
		  {
		    "Year": 2007,
		    "Doy": 355,
		    "SCF": 85.5462,
		    "Cloud": 18.2688,
		    "Age": 0.654975
		  },
		  {
		    "Year": 2007,
		    "Doy": 356,
		    "SCF": 85.1291,
		    "Cloud": 33.7437,
		    "Age": 1.05835
		  },
		  {
		    "Year": 2007,
		    "Doy": 357,
		    "SCF": 85.6761,
		    "Cloud": 20.4851,
		    "Age": 0.760731
		  },
		  {
		    "Year": 2007,
		    "Doy": 358,
		    "SCF": 83.1195,
		    "Cloud": 99.3253,
		    "Age": 1.76072
		  },
		  {
		    "Year": 2007,
		    "Doy": 359,
		    "SCF": 83.1195,
		    "Cloud": 92.0521,
		    "Age": 2.57163
		  },
		  {
		    "Year": 2007,
		    "Doy": 360,
		    "SCF": 83.8748,
		    "Cloud": 44.0464,
		    "Age": 1.59709
		  },
		  {
		    "Year": 2007,
		    "Doy": 361,
		    "SCF": 77.7786,
		    "Cloud": 98.4314,
		    "Age": 2.57448
		  },
		  {
		    "Year": 2007,
		    "Doy": 362,
		    "SCF": 77.9444,
		    "Cloud": 97.6981,
		    "Age": 3.49236
		  },
		  {
		    "Year": 2007,
		    "Doy": 363,
		    "SCF": 78.2369,
		    "Cloud": 93.6529,
		    "Age": 4.4084
		  },
		  {
		    "Year": 2007,
		    "Doy": 364,
		    "SCF": 78.3184,
		    "Cloud": 61.0518,
		    "Age": 3.27834
		  },
		  {
		    "Year": 2007,
		    "Doy": 365,
		    "SCF": 77.6995,
		    "Cloud": 21.2481,
		    "Age": 1.05852
		  },
		  {
		    "Year": 2008,
		    "Doy": 1,
		    "SCF": 81.3449,
		    "Cloud": 92.8077,
		    "Age": 0.928891
		  },
		  {
		    "Year": 2008,
		    "Doy": 2,
		    "SCF": 81.6337,
		    "Cloud": 96.8727,
		    "Age": 1.87251
		  },
		  {
		    "Year": 2008,
		    "Doy": 3,
		    "SCF": 81.7196,
		    "Cloud": 82.0854,
		    "Age": 2.3704
		  },
		  {
		    "Year": 2008,
		    "Doy": 4,
		    "SCF": 82.608,
		    "Cloud": 97.7333,
		    "Age": 3.29433
		  },
		  {
		    "Year": 2008,
		    "Doy": 5,
		    "SCF": 82.7205,
		    "Cloud": 98.5822,
		    "Age": 4.23214
		  },
		  {
		    "Year": 2008,
		    "Doy": 6,
		    "SCF": 82.8092,
		    "Cloud": 93.8213,
		    "Age": 4.91617
		  },
		  {
		    "Year": 2008,
		    "Doy": 7,
		    "SCF": 83.5285,
		    "Cloud": 93.3262,
		    "Age": 5.52816
		  },
		  {
		    "Year": 2008,
		    "Doy": 8,
		    "SCF": 84.0917,
		    "Cloud": 95.8692,
		    "Age": 6.30819
		  },
		  {
		    "Year": 2008,
		    "Doy": 9,
		    "SCF": 84.6957,
		    "Cloud": 99.5433,
		    "Age": 7.27244
		  },
		  {
		    "Year": 2008,
		    "Doy": 10,
		    "SCF": 84.7858,
		    "Cloud": 54.73,
		    "Age": 4.44501
		  },
		  {
		    "Year": 2008,
		    "Doy": 11,
		    "SCF": 86.3153,
		    "Cloud": 33.9654,
		    "Age": 2.35686
		  },
		  {
		    "Year": 2008,
		    "Doy": 12,
		    "SCF": 81.4443,
		    "Cloud": 99.7413,
		    "Age": 3.34559
		  },
		  {
		    "Year": 2008,
		    "Doy": 13,
		    "SCF": 81.442,
		    "Cloud": 99.9956,
		    "Age": 4.34556
		  },
		  {
		    "Year": 2008,
		    "Doy": 14,
		    "SCF": 81.4419,
		    "Cloud": 100,
		    "Age": 5.34556
		  },
		  {
		    "Year": 2008,
		    "Doy": 15,
		    "SCF": 81.4419,
		    "Cloud": 83.0947,
		    "Age": 5.11773
		  },
		  {
		    "Year": 2008,
		    "Doy": 16,
		    "SCF": 82.5969,
		    "Cloud": 91.4163,
		    "Age": 5.64696
		  },
		  {
		    "Year": 2008,
		    "Doy": 17,
		    "SCF": 82.5709,
		    "Cloud": 73.9036,
		    "Age": 5.06948
		  },
		  {
		    "Year": 2008,
		    "Doy": 18,
		    "SCF": 83.3446,
		    "Cloud": 96.8406,
		    "Age": 5.87204
		  },
		  {
		    "Year": 2008,
		    "Doy": 19,
		    "SCF": 83.6978,
		    "Cloud": 70.9256,
		    "Age": 5.36736
		  },
		  {
		    "Year": 2008,
		    "Doy": 20,
		    "SCF": 83.1777,
		    "Cloud": 48.649,
		    "Age": 3.62321
		  },
		  {
		    "Year": 2008,
		    "Doy": 21,
		    "SCF": 83.2446,
		    "Cloud": 42.3274,
		    "Age": 2.13899
		  },
		  {
		    "Year": 2008,
		    "Doy": 22,
		    "SCF": 84.3981,
		    "Cloud": 19.056,
		    "Age": 1.02351
		  },
		  {
		    "Year": 2008,
		    "Doy": 23,
		    "SCF": 81.0105,
		    "Cloud": 99.5824,
		    "Age": 2.00681
		  },
		  {
		    "Year": 2008,
		    "Doy": 24,
		    "SCF": 81.1116,
		    "Cloud": 65.8853,
		    "Age": 2.15669
		  },
		  {
		    "Year": 2008,
		    "Doy": 25,
		    "SCF": 79.446,
		    "Cloud": 52.7451,
		    "Age": 1.98244
		  },
		  {
		    "Year": 2008,
		    "Doy": 26,
		    "SCF": 78.6409,
		    "Cloud": 98.7382,
		    "Age": 2.95785
		  },
		  {
		    "Year": 2008,
		    "Doy": 27,
		    "SCF": 78.6783,
		    "Cloud": 37.0474,
		    "Age": 1.94144
		  },
		  {
		    "Year": 2008,
		    "Doy": 28,
		    "SCF": 83.0772,
		    "Cloud": 46.3737,
		    "Age": 1.83331
		  },
		  {
		    "Year": 2008,
		    "Doy": 29,
		    "SCF": 85.1174,
		    "Cloud": 75.8469,
		    "Age": 2.02611
		  },
		  {
		    "Year": 2008,
		    "Doy": 30,
		    "SCF": 85.6185,
		    "Cloud": 30.687,
		    "Age": 0.999025
		  },
		  {
		    "Year": 2008,
		    "Doy": 31,
		    "SCF": 86.3766,
		    "Cloud": 99.9956,
		    "Age": 1.99875
		  },
		  {
		    "Year": 2008,
		    "Doy": 32,
		    "SCF": 86.3766,
		    "Cloud": 99.8909,
		    "Age": 2.99875
		  },
		  {
		    "Year": 2008,
		    "Doy": 33,
		    "SCF": 86.3766,
		    "Cloud": 84.6106,
		    "Age": 3.40419
		  },
		  {
		    "Year": 2008,
		    "Doy": 34,
		    "SCF": 87.2297,
		    "Cloud": 99.9971,
		    "Age": 4.40409
		  },
		  {
		    "Year": 2008,
		    "Doy": 35,
		    "SCF": 87.2297,
		    "Cloud": 99.9026,
		    "Age": 5.40409
		  },
		  {
		    "Year": 2008,
		    "Doy": 36,
		    "SCF": 87.2297,
		    "Cloud": 97.7912,
		    "Age": 6.27621
		  },
		  {
		    "Year": 2008,
		    "Doy": 37,
		    "SCF": 87.6866,
		    "Cloud": 93.5655,
		    "Age": 6.7423
		  },
		  {
		    "Year": 2008,
		    "Doy": 38,
		    "SCF": 87.9908,
		    "Cloud": 99.9913,
		    "Age": 7.74452
		  },
		  {
		    "Year": 2008,
		    "Doy": 39,
		    "SCF": 87.9907,
		    "Cloud": 94.2944,
		    "Age": 8.21417
		  },
		  {
		    "Year": 2008,
		    "Doy": 40,
		    "SCF": 88.9774,
		    "Cloud": 11.211,
		    "Age": 1.17395
		  },
		  {
		    "Year": 2008,
		    "Doy": 41,
		    "SCF": 87.1276,
		    "Cloud": 64.9512,
		    "Age": 1.53249
		  },
		  {
		    "Year": 2008,
		    "Doy": 42,
		    "SCF": 88.2273,
		    "Cloud": 38.0828,
		    "Age": 0.893319
		  },
		  {
		    "Year": 2008,
		    "Doy": 43,
		    "SCF": 87.9065,
		    "Cloud": 30.4253,
		    "Age": 0.87612
		  },
		  {
		    "Year": 2008,
		    "Doy": 44,
		    "SCF": 91.4101,
		    "Cloud": 7.91418,
		    "Age": 0.250691
		  },
		  {
		    "Year": 2008,
		    "Doy": 45,
		    "SCF": 88.9631,
		    "Cloud": 5.4985,
		    "Age": 0.0981003
		  },
		  {
		    "Year": 2008,
		    "Doy": 46,
		    "SCF": 90.4,
		    "Cloud": 25.5831,
		    "Age": 0.291464
		  },
		  {
		    "Year": 2008,
		    "Doy": 47,
		    "SCF": 85.9276,
		    "Cloud": 99.8997,
		    "Age": 1.29028
		  },
		  {
		    "Year": 2008,
		    "Doy": 48,
		    "SCF": 85.9223,
		    "Cloud": 77.0075,
		    "Age": 1.76117
		  },
		  {
		    "Year": 2008,
		    "Doy": 49,
		    "SCF": 86.3604,
		    "Cloud": 97.5452,
		    "Age": 2.68695
		  },
		  {
		    "Year": 2008,
		    "Doy": 50,
		    "SCF": 86.4035,
		    "Cloud": 93.419,
		    "Age": 3.44166
		  },
		  {
		    "Year": 2008,
		    "Doy": 51,
		    "SCF": 86.6583,
		    "Cloud": 32.3158,
		    "Age": 1.48991
		  },
		  {
		    "Year": 2008,
		    "Doy": 52,
		    "SCF": 79.0842,
		    "Cloud": 99.9927,
		    "Age": 2.48965
		  },
		  {
		    "Year": 2008,
		    "Doy": 53,
		    "SCF": 79.0842,
		    "Cloud": 67.1635,
		    "Age": 2.28892
		  },
		  {
		    "Year": 2008,
		    "Doy": 54,
		    "SCF": 78.9324,
		    "Cloud": 74.5111,
		    "Age": 2.50587
		  },
		  {
		    "Year": 2008,
		    "Doy": 55,
		    "SCF": 81.1349,
		    "Cloud": 62.191,
		    "Age": 2.31868
		  },
		  {
		    "Year": 2008,
		    "Doy": 56,
		    "SCF": 80.193,
		    "Cloud": 65.8184,
		    "Age": 2.44205
		  },
		  {
		    "Year": 2008,
		    "Doy": 57,
		    "SCF": 81.0068,
		    "Cloud": 98.905,
		    "Age": 3.39566
		  },
		  {
		    "Year": 2008,
		    "Doy": 58,
		    "SCF": 81.0059,
		    "Cloud": 63.8187,
		    "Age": 3.03567
		  },
		  {
		    "Year": 2008,
		    "Doy": 59,
		    "SCF": 78.8002,
		    "Cloud": 34.3787,
		    "Age": 1.97651
		  },
		  {
		    "Year": 2008,
		    "Doy": 60,
		    "SCF": 82.6943,
		    "Cloud": 97.7991,
		    "Age": 2.89707
		  },
		  {
		    "Year": 2008,
		    "Doy": 61,
		    "SCF": 82.8721,
		    "Cloud": 99.1723,
		    "Age": 3.87723
		  },
		  {
		    "Year": 2008,
		    "Doy": 62,
		    "SCF": 82.9765,
		    "Cloud": 62.6633,
		    "Age": 3.7122
		  },
		  {
		    "Year": 2008,
		    "Doy": 63,
		    "SCF": 78.1865,
		    "Cloud": 53.0814,
		    "Age": 1.86775
		  },
		  {
		    "Year": 2008,
		    "Doy": 64,
		    "SCF": 76.3166,
		    "Cloud": 59.5665,
		    "Age": 1.72589
		  },
		  {
		    "Year": 2008,
		    "Doy": 65,
		    "SCF": 74.8447,
		    "Cloud": 100,
		    "Age": 2.72561
		  },
		  {
		    "Year": 2008,
		    "Doy": 66,
		    "SCF": 74.8447,
		    "Cloud": 28.358,
		    "Age": 1.28573
		  },
		  {
		    "Year": 2008,
		    "Doy": 67,
		    "SCF": 79.7443,
		    "Cloud": 99.9884,
		    "Age": 2.28553
		  },
		  {
		    "Year": 2008,
		    "Doy": 68,
		    "SCF": 79.7444,
		    "Cloud": 96.8308,
		    "Age": 3.21197
		  },
		  {
		    "Year": 2008,
		    "Doy": 69,
		    "SCF": 79.9234,
		    "Cloud": 72.2554,
		    "Age": 3.12165
		  },
		  {
		    "Year": 2008,
		    "Doy": 70,
		    "SCF": 79.8476,
		    "Cloud": 93.4693,
		    "Age": 3.89356
		  },
		  {
		    "Year": 2008,
		    "Doy": 71,
		    "SCF": 80.5654,
		    "Cloud": 98.4774,
		    "Age": 4.83628
		  },
		  {
		    "Year": 2008,
		    "Doy": 72,
		    "SCF": 80.6189,
		    "Cloud": 99.0097,
		    "Age": 5.76695
		  },
		  {
		    "Year": 2008,
		    "Doy": 73,
		    "SCF": 80.7,
		    "Cloud": 88.5087,
		    "Age": 5.85112
		  },
		  {
		    "Year": 2008,
		    "Doy": 74,
		    "SCF": 80.7224,
		    "Cloud": 88.6095,
		    "Age": 6.14635
		  },
		  {
		    "Year": 2008,
		    "Doy": 75,
		    "SCF": 80.794,
		    "Cloud": 24.0772,
		    "Age": 1.6441
		  },
		  {
		    "Year": 2008,
		    "Doy": 76,
		    "SCF": 84.9274,
		    "Cloud": 34.2098,
		    "Age": 1.14435
		  },
		  {
		    "Year": 2008,
		    "Doy": 77,
		    "SCF": 75.5205,
		    "Cloud": 15.1824,
		    "Age": 0.613129
		  },
		  {
		    "Year": 2008,
		    "Doy": 78,
		    "SCF": 80.2534,
		    "Cloud": 56.5795,
		    "Age": 1.02023
		  },
		  {
		    "Year": 2008,
		    "Doy": 79,
		    "SCF": 83.381,
		    "Cloud": 42.1308,
		    "Age": 1.03549
		  },
		  {
		    "Year": 2008,
		    "Doy": 80,
		    "SCF": 84.6454,
		    "Cloud": 96.8661,
		    "Age": 1.94167
		  },
		  {
		    "Year": 2008,
		    "Doy": 81,
		    "SCF": 85.0685,
		    "Cloud": 99.6001,
		    "Age": 2.92908
		  },
		  {
		    "Year": 2008,
		    "Doy": 82,
		    "SCF": 85.0797,
		    "Cloud": 15.5634,
		    "Age": 0.769123
		  },
		  {
		    "Year": 2008,
		    "Doy": 83,
		    "SCF": 91.763,
		    "Cloud": 14.3659,
		    "Age": 0.595855
		  },
		  {
		    "Year": 2008,
		    "Doy": 84,
		    "SCF": 82.902,
		    "Cloud": 96.2837,
		    "Age": 1.52171
		  },
		  {
		    "Year": 2008,
		    "Doy": 85,
		    "SCF": 83.2003,
		    "Cloud": 92.8838,
		    "Age": 2.19301
		  },
		  {
		    "Year": 2008,
		    "Doy": 86,
		    "SCF": 83.2399,
		    "Cloud": 78.6122,
		    "Age": 2.75306
		  },
		  {
		    "Year": 2008,
		    "Doy": 87,
		    "SCF": 84.3288,
		    "Cloud": 19.9619,
		    "Age": 1.47651
		  },
		  {
		    "Year": 2008,
		    "Doy": 88,
		    "SCF": 83.7199,
		    "Cloud": 99.2209,
		    "Age": 2.10044
		  },
		  {
		    "Year": 2008,
		    "Doy": 89,
		    "SCF": 83.0385,
		    "Cloud": 99.9549,
		    "Age": 3.10063
		  },
		  {
		    "Year": 2008,
		    "Doy": 90,
		    "SCF": 83.0385,
		    "Cloud": 99.984,
		    "Age": 0.843291
		  },
		  {
		    "Year": 2008,
		    "Doy": 91,
		    "SCF": 72.5036,
		    "Cloud": 77.6381,
		    "Age": 1.82836
		  },
		  {
		    "Year": 2008,
		    "Doy": 92,
		    "SCF": 72.476,
		    "Cloud": 98.0104,
		    "Age": 1.84504
		  },
		  {
		    "Year": 2008,
		    "Doy": 93,
		    "SCF": 71.9892,
		    "Cloud": 99.8531,
		    "Age": 2.8442
		  },
		  {
		    "Year": 2008,
		    "Doy": 94,
		    "SCF": 71.9892,
		    "Cloud": 89.2212,
		    "Age": 3.42837
		  },
		  {
		    "Year": 2008,
		    "Doy": 95,
		    "SCF": 71.588,
		    "Cloud": 97.368,
		    "Age": 1.26043
		  },
		  {
		    "Year": 2008,
		    "Doy": 96,
		    "SCF": 75.0078,
		    "Cloud": 35.2546,
		    "Age": 1.06702
		  },
		  {
		    "Year": 2008,
		    "Doy": 97,
		    "SCF": 69.0875,
		    "Cloud": 99.9956,
		    "Age": 2.02903
		  },
		  {
		    "Year": 2008,
		    "Doy": 98,
		    "SCF": 69.0947,
		    "Cloud": 99.8938,
		    "Age": 3.00455
		  },
		  {
		    "Year": 2008,
		    "Doy": 99,
		    "SCF": 69.1213,
		    "Cloud": 76.769,
		    "Age": 2.29405
		  },
		  {
		    "Year": 2008,
		    "Doy": 100,
		    "SCF": 73.3882,
		    "Cloud": 93.3913,
		    "Age": 2.45137
		  },
		  {
		    "Year": 2008,
		    "Doy": 101,
		    "SCF": 72.8558,
		    "Cloud": 69.1398,
		    "Age": 2.63352
		  },
		  {
		    "Year": 2008,
		    "Doy": 102,
		    "SCF": 72.9603,
		    "Cloud": 65.8673,
		    "Age": 0.138194
		  },
		  {
		    "Year": 2008,
		    "Doy": 103,
		    "SCF": 85.4266,
		    "Cloud": 98.933,
		    "Age": 0.793886
		  },
		  {
		    "Year": 2008,
		    "Doy": 104,
		    "SCF": 89.2026,
		    "Cloud": 99.8125,
		    "Age": 1.74161
		  },
		  {
		    "Year": 2008,
		    "Doy": 105,
		    "SCF": 89.7809,
		    "Cloud": 77.9459,
		    "Age": 2.73943
		  },
		  {
		    "Year": 2008,
		    "Doy": 106,
		    "SCF": 89.7867,
		    "Cloud": 90.7162,
		    "Age": 3.73943
		  },
		  {
		    "Year": 2008,
		    "Doy": 107,
		    "SCF": 89.7867,
		    "Cloud": 81.9716,
		    "Age": 4.6101
		  },
		  {
		    "Year": 2008,
		    "Doy": 108,
		    "SCF": 89.6624,
		    "Cloud": 3.82804,
		    "Age": 0.502311
		  },
		  {
		    "Year": 2008,
		    "Doy": 109,
		    "SCF": 91.7533,
		    "Cloud": 0.0654127,
		    "Age": 1.26501
		  },
		  {
		    "Year": 2008,
		    "Doy": 110,
		    "SCF": 94.1641,
		    "Cloud": 3.60647,
		    "Age": 0.750847
		  },
		  {
		    "Year": 2008,
		    "Doy": 111,
		    "SCF": 83.7422,
		    "Cloud": 0.393976,
		    "Age": 1.70394
		  },
		  {
		    "Year": 2008,
		    "Doy": 112,
		    "SCF": 83.5501,
		    "Cloud": 0.824344,
		    "Age": 1.44259
		  },
		  {
		    "Year": 2008,
		    "Doy": 113,
		    "SCF": 74.7693,
		    "Cloud": 4.60243,
		    "Age": 1.9824
		  },
		  {
		    "Year": 2008,
		    "Doy": 114,
		    "SCF": 66.2116,
		    "Cloud": 10.8287,
		    "Age": 2.9846
		  },
		  {
		    "Year": 2008,
		    "Doy": 115,
		    "SCF": 66.2123,
		    "Cloud": 1.02201,
		    "Age": 3.80142
		  },
		  {
		    "Year": 2008,
		    "Doy": 116,
		    "SCF": 64.8505,
		    "Cloud": 94.3182,
		    "Age": 4.78689
		  },
		  {
		    "Year": 2008,
		    "Doy": 117,
		    "SCF": 64.8505,
		    "Cloud": 77.1709,
		    "Age": 5.77209
		  },
		  {
		    "Year": 2008,
		    "Doy": 118,
		    "SCF": 64.8316,
		    "Cloud": 90.3062,
		    "Age": 4.23402
		  },
		  {
		    "Year": 2008,
		    "Doy": 119,
		    "SCF": 64.9768,
		    "Cloud": 99.6402,
		    "Age": 5.23285
		  },
		  {
		    "Year": 2008,
		    "Doy": 120,
		    "SCF": 64.9779,
		    "Cloud": 91.9383,
		    "Age": 5.80204
		  },
		  {
		    "Year": 2008,
		    "Doy": 121,
		    "SCF": 64.7556,
		    "Cloud": 98.4115,
		    "Age": 6.70218
		  },
		  {
		    "Year": 2008,
		    "Doy": 122,
		    "SCF": 64.7156,
		    "Cloud": 99.6269,
		    "Age": 7.68179
		  },
		  {
		    "Year": 2008,
		    "Doy": 123,
		    "SCF": 64.4598,
		    "Cloud": 97.4832,
		    "Age": 8.47153
		  },
		  {
		    "Year": 2008,
		    "Doy": 124,
		    "SCF": 63.0328,
		    "Cloud": 39.0896,
		    "Age": 3.88259
		  },
		  {
		    "Year": 2008,
		    "Doy": 125,
		    "SCF": 60.4503,
		    "Cloud": 71.088,
		    "Age": 3.46917
		  },
		  {
		    "Year": 2008,
		    "Doy": 126,
		    "SCF": 58.0529,
		    "Cloud": 97.6558,
		    "Age": 4.35646
		  },
		  {
		    "Year": 2008,
		    "Doy": 127,
		    "SCF": 57.9987,
		    "Cloud": 72.9364,
		    "Age": 3.94061
		  },
		  {
		    "Year": 2008,
		    "Doy": 128,
		    "SCF": 55.1766,
		    "Cloud": 7.61605,
		    "Age": 0.420647
		  },
		  {
		    "Year": 2008,
		    "Doy": 129,
		    "SCF": 54.688,
		    "Cloud": 6.46435,
		    "Age": 0.275401
		  },
		  {
		    "Year": 2008,
		    "Doy": 130,
		    "SCF": 51.0256,
		    "Cloud": 11.3802,
		    "Age": 0.270421
		  },
		  {
		    "Year": 2008,
		    "Doy": 131,
		    "SCF": 51.5664,
		    "Cloud": 10.6641,
		    "Age": 0.287214
		  },
		  {
		    "Year": 2008,
		    "Doy": 132,
		    "SCF": 50.6995,
		    "Cloud": 97.919,
		    "Age": 1.26599
		  },
		  {
		    "Year": 2008,
		    "Doy": 133,
		    "SCF": 50.5902,
		    "Cloud": 12.2925,
		    "Age": 0.305979
		  },
		  {
		    "Year": 2008,
		    "Doy": 134,
		    "SCF": 47.1706,
		    "Cloud": 6.17232,
		    "Age": 0.12011
		  },
		  {
		    "Year": 2008,
		    "Doy": 135,
		    "SCF": 37.226,
		    "Cloud": 96.0502,
		    "Age": 1.07932
		  },
		  {
		    "Year": 2008,
		    "Doy": 136,
		    "SCF": 36.833,
		    "Cloud": 99.6974,
		    "Age": 2.07296
		  },
		  {
		    "Year": 2008,
		    "Doy": 137,
		    "SCF": 36.8312,
		    "Cloud": 90.2902,
		    "Age": 2.77691
		  },
		  {
		    "Year": 2008,
		    "Doy": 138,
		    "SCF": 36.4671,
		    "Cloud": 92.2165,
		    "Age": 3.48088
		  },
		  {
		    "Year": 2008,
		    "Doy": 139,
		    "SCF": 35.1167,
		    "Cloud": 64.9734,
		    "Age": 2.97059
		  },
		  {
		    "Year": 2008,
		    "Doy": 140,
		    "SCF": 31.7561,
		    "Cloud": 79.7699,
		    "Age": 3.19452
		  },
		  {
		    "Year": 2008,
		    "Doy": 141,
		    "SCF": 29.9107,
		    "Cloud": 64.9393,
		    "Age": 2.80623
		  },
		  {
		    "Year": 2008,
		    "Doy": 142,
		    "SCF": 24.4919,
		    "Cloud": 84.2681,
		    "Age": 3.35138
		  },
		  {
		    "Year": 2008,
		    "Doy": 143,
		    "SCF": 23.2411,
		    "Cloud": 90.6874,
		    "Age": 3.91288
		  },
		  {
		    "Year": 2008,
		    "Doy": 144,
		    "SCF": 22.2766,
		    "Cloud": 87.1713,
		    "Age": 4.37192
		  },
		  {
		    "Year": 2008,
		    "Doy": 145,
		    "SCF": 21.9782,
		    "Cloud": 95.3092,
		    "Age": 5.222
		  },
		  {
		    "Year": 2008,
		    "Doy": 146,
		    "SCF": 21.6939,
		    "Cloud": 56.2279,
		    "Age": 3.84428
		  },
		  {
		    "Year": 2008,
		    "Doy": 147,
		    "SCF": 17.5786,
		    "Cloud": 76.7974,
		    "Age": 3.89211
		  },
		  {
		    "Year": 2008,
		    "Doy": 148,
		    "SCF": 16.6132,
		    "Cloud": 51.3231,
		    "Age": 2.82565
		  },
		  {
		    "Year": 2008,
		    "Doy": 149,
		    "SCF": 13.2881,
		    "Cloud": 43.8135,
		    "Age": 1.7875
		  },
		  {
		    "Year": 2008,
		    "Doy": 150,
		    "SCF": 9.92003,
		    "Cloud": 80.0058,
		    "Age": 2.14096
		  },
		  {
		    "Year": 2008,
		    "Doy": 151,
		    "SCF": 8.27856,
		    "Cloud": 39.7466,
		    "Age": 1.65704
		  },
		  {
		    "Year": 2008,
		    "Doy": 152,
		    "SCF": 7.87219,
		    "Cloud": 21.2388,
		    "Age": 1.00853
		  },
		  {
		    "Year": 2008,
		    "Doy": 153,
		    "SCF": 6.81374,
		    "Cloud": 32.8266,
		    "Age": 1.10489
		  },
		  {
		    "Year": 2008,
		    "Doy": 154,
		    "SCF": 6.34428,
		    "Cloud": 12.4517,
		    "Age": 0.505668
		  },
		  {
		    "Year": 2008,
		    "Doy": 155,
		    "SCF": 5.85933,
		    "Cloud": 45.1205,
		    "Age": 0.872861
		  },
		  {
		    "Year": 2008,
		    "Doy": 156,
		    "SCF": 5.04771,
		    "Cloud": 19.8427,
		    "Age": 0.485436
		  },
		  {
		    "Year": 2008,
		    "Doy": 157,
		    "SCF": 3.89783,
		    "Cloud": 4.48273,
		    "Age": 0.145828
		  },
		  {
		    "Year": 2008,
		    "Doy": 158,
		    "SCF": 3.55064,
		    "Cloud": 3.47513,
		    "Age": 0.0845668
		  },
		  {
		    "Year": 2008,
		    "Doy": 159,
		    "SCF": 3.88875,
		    "Cloud": 16.6708,
		    "Age": 0.229646
		  },
		  {
		    "Year": 2008,
		    "Doy": 160,
		    "SCF": 4.17667,
		    "Cloud": 58.3788,
		    "Age": 0.804972
		  },
		  {
		    "Year": 2008,
		    "Doy": 161,
		    "SCF": 4.2348,
		    "Cloud": 46.554,
		    "Age": 1.0432
		  },
		  {
		    "Year": 2008,
		    "Doy": 162,
		    "SCF": 4.52993,
		    "Cloud": 55.9213,
		    "Age": 1.39002
		  },
		  {
		    "Year": 2008,
		    "Doy": 163,
		    "SCF": 5.5059,
		    "Cloud": 76.0987,
		    "Age": 1.89044
		  },
		  {
		    "Year": 2008,
		    "Doy": 164,
		    "SCF": 5.08018,
		    "Cloud": 99.6851,
		    "Age": 2.88397
		  },
		  {
		    "Year": 2008,
		    "Doy": 165,
		    "SCF": 5.11487,
		    "Cloud": 99.3484,
		    "Age": 3.85129
		  },
		  {
		    "Year": 2008,
		    "Doy": 166,
		    "SCF": 4.99287,
		    "Cloud": 71.576,
		    "Age": 3.58205
		  },
		  {
		    "Year": 2008,
		    "Doy": 167,
		    "SCF": 4.7576,
		    "Cloud": 82.8391,
		    "Age": 3.80578
		  },
		  {
		    "Year": 2008,
		    "Doy": 168,
		    "SCF": 4.55511,
		    "Cloud": 68.9666,
		    "Age": 3.46202
		  },
		  {
		    "Year": 2008,
		    "Doy": 169,
		    "SCF": 3.82418,
		    "Cloud": 60.254,
		    "Age": 2.85056
		  },
		  {
		    "Year": 2008,
		    "Doy": 170,
		    "SCF": 3.93839,
		    "Cloud": 76.8051,
		    "Age": 3.10859
		  },
		  {
		    "Year": 2008,
		    "Doy": 171,
		    "SCF": 3.78723,
		    "Cloud": 99.9562,
		    "Age": 4.1094
		  },
		  {
		    "Year": 2008,
		    "Doy": 172,
		    "SCF": 3.78723,
		    "Cloud": 81.7805,
		    "Age": 4.31218
		  },
		  {
		    "Year": 2008,
		    "Doy": 173,
		    "SCF": 3.85552,
		    "Cloud": 67.4827,
		    "Age": 3.89178
		  },
		  {
		    "Year": 2008,
		    "Doy": 174,
		    "SCF": 3.65405,
		    "Cloud": 99.9344,
		    "Age": 4.8897
		  },
		  {
		    "Year": 2008,
		    "Doy": 175,
		    "SCF": 3.6149,
		    "Cloud": 58.4282,
		    "Age": 3.83024
		  },
		  {
		    "Year": 2008,
		    "Doy": 176,
		    "SCF": 3.08458,
		    "Cloud": 70.4882,
		    "Age": 3.70461
		  },
		  {
		    "Year": 2008,
		    "Doy": 177,
		    "SCF": 3.10133,
		    "Cloud": 26.0163,
		    "Age": 1.30647
		  },
		  {
		    "Year": 2008,
		    "Doy": 178,
		    "SCF": 2.27348,
		    "Cloud": 40.7646,
		    "Age": 1.09889
		  },
		  {
		    "Year": 2008,
		    "Doy": 179,
		    "SCF": 2.88013,
		    "Cloud": 98.4495,
		    "Age": 2.08063
		  },
		  {
		    "Year": 2008,
		    "Doy": 180,
		    "SCF": 2.85857,
		    "Cloud": 78.1167,
		    "Age": 2.45697
		  },
		  {
		    "Year": 2008,
		    "Doy": 181,
		    "SCF": 1.91688,
		    "Cloud": 83.6701,
		    "Age": 3.00788
		  },
		  {
		    "Year": 2008,
		    "Doy": 182,
		    "SCF": 1.95689,
		    "Cloud": 38.1866,
		    "Age": 1.75362
		  },
		  {
		    "Year": 2008,
		    "Doy": 183,
		    "SCF": 1.59436,
		    "Cloud": 54.0409,
		    "Age": 1.57234
		  },
		  {
		    "Year": 2008,
		    "Doy": 184,
		    "SCF": 1.31216,
		    "Cloud": 9.59296,
		    "Age": 0.44897
		  },
		  {
		    "Year": 2008,
		    "Doy": 185,
		    "SCF": 1.24693,
		    "Cloud": 3.89292,
		    "Age": 0.213476
		  },
		  {
		    "Year": 2008,
		    "Doy": 186,
		    "SCF": 0.86563,
		    "Cloud": 16.0952,
		    "Age": 0.273015
		  },
		  {
		    "Year": 2008,
		    "Doy": 187,
		    "SCF": 1.10398,
		    "Cloud": 84.2918,
		    "Age": 1.10151
		  },
		  {
		    "Year": 2008,
		    "Doy": 188,
		    "SCF": 1.05336,
		    "Cloud": 92.9782,
		    "Age": 1.97776
		  },
		  {
		    "Year": 2008,
		    "Doy": 189,
		    "SCF": 0.999124,
		    "Cloud": 99.9942,
		    "Age": 2.97785
		  },
		  {
		    "Year": 2008,
		    "Doy": 190,
		    "SCF": 0.999124,
		    "Cloud": 76.3608,
		    "Age": 3.06984
		  },
		  {
		    "Year": 2008,
		    "Doy": 191,
		    "SCF": 1.0195,
		    "Cloud": 41.7187,
		    "Age": 1.73606
		  },
		  {
		    "Year": 2008,
		    "Doy": 192,
		    "SCF": 0.975117,
		    "Cloud": 7.34393,
		    "Age": 0.217095
		  },
		  {
		    "Year": 2008,
		    "Doy": 193,
		    "SCF": 5.43201,
		    "Cloud": 95.0442,
		    "Age": 1.15761
		  },
		  {
		    "Year": 2008,
		    "Doy": 194,
		    "SCF": 5.21354,
		    "Cloud": 76.5822,
		    "Age": 1.69998
		  },
		  {
		    "Year": 2008,
		    "Doy": 195,
		    "SCF": 4.27406,
		    "Cloud": 67.4872,
		    "Age": 1.87169
		  },
		  {
		    "Year": 2008,
		    "Doy": 196,
		    "SCF": 2.38948,
		    "Cloud": 99.7565,
		    "Age": 2.86711
		  },
		  {
		    "Year": 2008,
		    "Doy": 197,
		    "SCF": 2.3126,
		    "Cloud": 98.5986,
		    "Age": 3.82032
		  },
		  {
		    "Year": 2008,
		    "Doy": 198,
		    "SCF": 2.10174,
		    "Cloud": 96.9857,
		    "Age": 4.66376
		  },
		  {
		    "Year": 2008,
		    "Doy": 199,
		    "SCF": 1.87877,
		    "Cloud": 74.2588,
		    "Age": 4.25314
		  },
		  {
		    "Year": 2008,
		    "Doy": 200,
		    "SCF": 2.02542,
		    "Cloud": 61.834,
		    "Age": 3.34914
		  },
		  {
		    "Year": 2008,
		    "Doy": 201,
		    "SCF": 2.16517,
		    "Cloud": 99.0397,
		    "Age": 4.34514
		  },
		  {
		    "Year": 2008,
		    "Doy": 202,
		    "SCF": 2.16517,
		    "Cloud": 99.4346,
		    "Age": 5.33291
		  },
		  {
		    "Year": 2008,
		    "Doy": 203,
		    "SCF": 2.07719,
		    "Cloud": 66.298,
		    "Age": 4.25767
		  },
		  {
		    "Year": 2008,
		    "Doy": 204,
		    "SCF": 0.543683,
		    "Cloud": 78.2673,
		    "Age": 4.40249
		  },
		  {
		    "Year": 2008,
		    "Doy": 205,
		    "SCF": 0.13918,
		    "Cloud": 24.4535,
		    "Age": 1.27028
		  },
		  {
		    "Year": 2008,
		    "Doy": 206,
		    "SCF": 0.134322,
		    "Cloud": 4.23285,
		    "Age": 0.102569
		  },
		  {
		    "Year": 2008,
		    "Doy": 207,
		    "SCF": 0.124407,
		    "Cloud": 6.49976,
		    "Age": 0.0791935
		  },
		  {
		    "Year": 2008,
		    "Doy": 208,
		    "SCF": 0.119668,
		    "Cloud": 4.96126,
		    "Age": 0.0603231
		  },
		  {
		    "Year": 2008,
		    "Doy": 209,
		    "SCF": 0.109347,
		    "Cloud": 0.0510762,
		    "Age": 0.00185334
		  },
		  {
		    "Year": 2008,
		    "Doy": 210,
		    "SCF": 0.0968015,
		    "Cloud": 0.075877,
		    "Age": 0.000642036
		  },
		  {
		    "Year": 2008,
		    "Doy": 211,
		    "SCF": 0.194346,
		    "Cloud": 5.1358,
		    "Age": 0.0530646
		  },
		  {
		    "Year": 2008,
		    "Doy": 212,
		    "SCF": 1.09475,
		    "Cloud": 48.1618,
		    "Age": 0.510113
		  },
		  {
		    "Year": 2008,
		    "Doy": 213,
		    "SCF": 0.624592,
		    "Cloud": 20.2591,
		    "Age": 0.323929
		  },
		  {
		    "Year": 2008,
		    "Doy": 214,
		    "SCF": 1.44785,
		    "Cloud": 24.8409,
		    "Age": 0.381823
		  },
		  {
		    "Year": 2008,
		    "Doy": 215,
		    "SCF": 3.91903,
		    "Cloud": 99.7174,
		    "Age": 1.3805
		  },
		  {
		    "Year": 2008,
		    "Doy": 216,
		    "SCF": 3.86256,
		    "Cloud": 92.5152,
		    "Age": 2.21354
		  },
		  {
		    "Year": 2008,
		    "Doy": 217,
		    "SCF": 3.59426,
		    "Cloud": 98.7208,
		    "Age": 3.17391
		  },
		  {
		    "Year": 2008,
		    "Doy": 218,
		    "SCF": 3.177,
		    "Cloud": 83.9256,
		    "Age": 3.55935
		  },
		  {
		    "Year": 2008,
		    "Doy": 219,
		    "SCF": 3.42872,
		    "Cloud": 80.4837,
		    "Age": 3.63253
		  },
		  {
		    "Year": 2008,
		    "Doy": 220,
		    "SCF": 4.12604,
		    "Cloud": 99.9913,
		    "Age": 4.63396
		  },
		  {
		    "Year": 2008,
		    "Doy": 221,
		    "SCF": 4.12604,
		    "Cloud": 90.0982,
		    "Age": 4.99546
		  },
		  {
		    "Year": 2008,
		    "Doy": 222,
		    "SCF": 4.03597,
		    "Cloud": 96.9219,
		    "Age": 5.82976
		  },
		  {
		    "Year": 2008,
		    "Doy": 223,
		    "SCF": 3.76371,
		    "Cloud": 99.9985,
		    "Age": 6.83019
		  },
		  {
		    "Year": 2008,
		    "Doy": 224,
		    "SCF": 3.76371,
		    "Cloud": 89.4859,
		    "Age": 7.0014
		  },
		  {
		    "Year": 2008,
		    "Doy": 225,
		    "SCF": 3.44597,
		    "Cloud": 67.2954,
		    "Age": 5.64519
		  },
		  {
		    "Year": 2008,
		    "Doy": 226,
		    "SCF": 2.85032,
		    "Cloud": 87.5821,
		    "Age": 5.86052
		  },
		  {
		    "Year": 2008,
		    "Doy": 227,
		    "SCF": 2.20789,
		    "Cloud": 56.9955,
		    "Age": 4.63079
		  },
		  {
		    "Year": 2008,
		    "Doy": 228,
		    "SCF": 2.74511,
		    "Cloud": 81.3427,
		    "Age": 4.63516
		  },
		  {
		    "Year": 2008,
		    "Doy": 229,
		    "SCF": 1.84138,
		    "Cloud": 78.1138,
		    "Age": 4.60008
		  },
		  {
		    "Year": 2008,
		    "Doy": 230,
		    "SCF": 2.09236,
		    "Cloud": 91.9435,
		    "Age": 5.06314
		  },
		  {
		    "Year": 2008,
		    "Doy": 231,
		    "SCF": 1.80378,
		    "Cloud": 91.7014,
		    "Age": 5.21862
		  },
		  {
		    "Year": 2008,
		    "Doy": 232,
		    "SCF": 1.53531,
		    "Cloud": 28.1084,
		    "Age": 1.7114
		  },
		  {
		    "Year": 2008,
		    "Doy": 233,
		    "SCF": 1.82336,
		    "Cloud": 99.4352,
		    "Age": 2.70338
		  },
		  {
		    "Year": 2008,
		    "Doy": 234,
		    "SCF": 1.61633,
		    "Cloud": 30.445,
		    "Age": 1.16549
		  },
		  {
		    "Year": 2008,
		    "Doy": 235,
		    "SCF": 1.97804,
		    "Cloud": 71.2987,
		    "Age": 1.56876
		  },
		  {
		    "Year": 2008,
		    "Doy": 236,
		    "SCF": 1.37637,
		    "Cloud": 29.5908,
		    "Age": 0.929639
		  },
		  {
		    "Year": 2008,
		    "Doy": 237,
		    "SCF": 0.751448,
		    "Cloud": 57.0376,
		    "Age": 1.03001
		  },
		  {
		    "Year": 2008,
		    "Doy": 238,
		    "SCF": 1.03073,
		    "Cloud": 96.8743,
		    "Age": 1.97985
		  },
		  {
		    "Year": 2008,
		    "Doy": 239,
		    "SCF": 1.04633,
		    "Cloud": 53.9211,
		    "Age": 1.59595
		  },
		  {
		    "Year": 2008,
		    "Doy": 240,
		    "SCF": 0.785267,
		    "Cloud": 99.8469,
		    "Age": 2.59078
		  },
		  {
		    "Year": 2008,
		    "Doy": 241,
		    "SCF": 0.779916,
		    "Cloud": 35.2286,
		    "Age": 1.33556
		  },
		  {
		    "Year": 2008,
		    "Doy": 242,
		    "SCF": 1.06605,
		    "Cloud": 22.7665,
		    "Age": 0.615342
		  },
		  {
		    "Year": 2008,
		    "Doy": 243,
		    "SCF": 1.09967,
		    "Cloud": 47.0248,
		    "Age": 0.849613
		  },
		  {
		    "Year": 2008,
		    "Doy": 244,
		    "SCF": 2.18343,
		    "Cloud": 98.3635,
		    "Age": 1.81856
		  },
		  {
		    "Year": 2008,
		    "Doy": 245,
		    "SCF": 2.0966,
		    "Cloud": 92.9261,
		    "Age": 2.64404
		  },
		  {
		    "Year": 2008,
		    "Doy": 246,
		    "SCF": 2.21215,
		    "Cloud": 75.2819,
		    "Age": 2.64122
		  },
		  {
		    "Year": 2008,
		    "Doy": 247,
		    "SCF": 2.50551,
		    "Cloud": 65.2267,
		    "Age": 2.39863
		  },
		  {
		    "Year": 2008,
		    "Doy": 248,
		    "SCF": 2.68633,
		    "Cloud": 99.9912,
		    "Age": 3.39718
		  },
		  {
		    "Year": 2008,
		    "Doy": 249,
		    "SCF": 2.68516,
		    "Cloud": 91.7091,
		    "Age": 3.96379
		  },
		  {
		    "Year": 2008,
		    "Doy": 250,
		    "SCF": 2.42773,
		    "Cloud": 91.0407,
		    "Age": 4.50805
		  },
		  {
		    "Year": 2008,
		    "Doy": 251,
		    "SCF": 2.17327,
		    "Cloud": 67.0756,
		    "Age": 3.80133
		  },
		  {
		    "Year": 2008,
		    "Doy": 252,
		    "SCF": 1.8003,
		    "Cloud": 99.841,
		    "Age": 4.79414
		  },
		  {
		    "Year": 2008,
		    "Doy": 253,
		    "SCF": 1.74643,
		    "Cloud": 99.7461,
		    "Age": 5.78008
		  },
		  {
		    "Year": 2008,
		    "Doy": 254,
		    "SCF": 1.7057,
		    "Cloud": 98.6635,
		    "Age": 6.67154
		  },
		  {
		    "Year": 2008,
		    "Doy": 255,
		    "SCF": 0.539526,
		    "Cloud": 99.9898,
		    "Age": 7.67091
		  },
		  {
		    "Year": 2008,
		    "Doy": 256,
		    "SCF": 0.538533,
		    "Cloud": 99.3113,
		    "Age": 8.60555
		  },
		  {
		    "Year": 2008,
		    "Doy": 257,
		    "SCF": 0.521813,
		    "Cloud": 19.4272,
		    "Age": 1.93393
		  },
		  {
		    "Year": 2008,
		    "Doy": 258,
		    "SCF": 1.58909,
		    "Cloud": 69.3951,
		    "Age": 2.59028
		  },
		  {
		    "Year": 2008,
		    "Doy": 259,
		    "SCF": 1.28992,
		    "Cloud": 98.8811,
		    "Age": 3.57364
		  },
		  {
		    "Year": 2008,
		    "Doy": 260,
		    "SCF": 1.2884,
		    "Cloud": 98.4508,
		    "Age": 4.53664
		  },
		  {
		    "Year": 2008,
		    "Doy": 261,
		    "SCF": 1.15241,
		    "Cloud": 67.3582,
		    "Age": 4.36234
		  },
		  {
		    "Year": 2008,
		    "Doy": 262,
		    "SCF": 1.58943,
		    "Cloud": 78.1983,
		    "Age": 3.40857
		  },
		  {
		    "Year": 2008,
		    "Doy": 263,
		    "SCF": 1.51639,
		    "Cloud": 98.7538,
		    "Age": 4.35799
		  },
		  {
		    "Year": 2008,
		    "Doy": 264,
		    "SCF": 0.7454,
		    "Cloud": 68.6839,
		    "Age": 3.39478
		  },
		  {
		    "Year": 2008,
		    "Doy": 265,
		    "SCF": 0.790774,
		    "Cloud": 44.8284,
		    "Age": 1.72231
		  },
		  {
		    "Year": 2008,
		    "Doy": 266,
		    "SCF": 0.833132,
		    "Cloud": 97.1659,
		    "Age": 2.65852
		  },
		  {
		    "Year": 2008,
		    "Doy": 267,
		    "SCF": 0.633785,
		    "Cloud": 28.5568,
		    "Age": 1.21188
		  },
		  {
		    "Year": 2008,
		    "Doy": 268,
		    "SCF": 0.418252,
		    "Cloud": 3.48725,
		    "Age": 0.204831
		  },
		  {
		    "Year": 2008,
		    "Doy": 269,
		    "SCF": 0.590326,
		    "Cloud": 7.5709,
		    "Age": 0.269781
		  },
		  {
		    "Year": 2008,
		    "Doy": 270,
		    "SCF": 7.77314,
		    "Cloud": 48.5114,
		    "Age": 0.736696
		  },
		  {
		    "Year": 2008,
		    "Doy": 271,
		    "SCF": 9.20831,
		    "Cloud": 95.9766,
		    "Age": 1.62384
		  },
		  {
		    "Year": 2008,
		    "Doy": 272,
		    "SCF": 9.08068,
		    "Cloud": 46.8974,
		    "Age": 1.27939
		  },
		  {
		    "Year": 2008,
		    "Doy": 273,
		    "SCF": 10.0589,
		    "Cloud": 11.4185,
		    "Age": 0.428099
		  },
		  {
		    "Year": 2008,
		    "Doy": 274,
		    "SCF": 46.8881,
		    "Cloud": 99.9752,
		    "Age": 1.42747
		  },
		  {
		    "Year": 2008,
		    "Doy": 275,
		    "SCF": 46.8961,
		    "Cloud": 93.4912,
		    "Age": 2.28301
		  },
		  {
		    "Year": 2008,
		    "Doy": 276,
		    "SCF": 47.9135,
		    "Cloud": 99.1634,
		    "Age": 3.25993
		  },
		  {
		    "Year": 2008,
		    "Doy": 277,
		    "SCF": 47.5992,
		    "Cloud": 99.1779,
		    "Age": 4.22686
		  },
		  {
		    "Year": 2008,
		    "Doy": 278,
		    "SCF": 47.8254,
		    "Cloud": 99.1604,
		    "Age": 5.17856
		  },
		  {
		    "Year": 2008,
		    "Doy": 279,
		    "SCF": 47.6561,
		    "Cloud": 88.1086,
		    "Age": 5.43554
		  },
		  {
		    "Year": 2008,
		    "Doy": 280,
		    "SCF": 46.6507,
		    "Cloud": 12.9667,
		    "Age": 0.867271
		  },
		  {
		    "Year": 2008,
		    "Doy": 281,
		    "SCF": 15.9019,
		    "Cloud": 97.4631,
		    "Age": 1.8109
		  },
		  {
		    "Year": 2008,
		    "Doy": 282,
		    "SCF": 15.0161,
		    "Cloud": 99.7846,
		    "Age": 2.80656
		  },
		  {
		    "Year": 2008,
		    "Doy": 283,
		    "SCF": 14.8453,
		    "Cloud": 8.26614,
		    "Age": 0.560566
		  },
		  {
		    "Year": 2008,
		    "Doy": 284,
		    "SCF": 10.4872,
		    "Cloud": 99.9883,
		    "Age": 1.56119
		  },
		  {
		    "Year": 2008,
		    "Doy": 285,
		    "SCF": 10.4872,
		    "Cloud": 37.0588,
		    "Age": 1.25345
		  },
		  {
		    "Year": 2008,
		    "Doy": 286,
		    "SCF": 10.7885,
		    "Cloud": 80.5986,
		    "Age": 1.90566
		  },
		  {
		    "Year": 2008,
		    "Doy": 287,
		    "SCF": 9.67192,
		    "Cloud": 52.3522,
		    "Age": 1.74624
		  },
		  {
		    "Year": 2008,
		    "Doy": 288,
		    "SCF": 9.5467,
		    "Cloud": 15.6121,
		    "Age": 0.94373
		  },
		  {
		    "Year": 2008,
		    "Doy": 289,
		    "SCF": 13.1504,
		    "Cloud": 69.8773,
		    "Age": 1.59957
		  },
		  {
		    "Year": 2008,
		    "Doy": 290,
		    "SCF": 11.6084,
		    "Cloud": 68.7724,
		    "Age": 1.81977
		  },
		  {
		    "Year": 2008,
		    "Doy": 291,
		    "SCF": 9.29084,
		    "Cloud": 5.12701,
		    "Age": 0.410569
		  },
		  {
		    "Year": 2008,
		    "Doy": 292,
		    "SCF": 11.5029,
		    "Cloud": 99.2879,
		    "Age": 1.40212
		  },
		  {
		    "Year": 2008,
		    "Doy": 293,
		    "SCF": 11.3729,
		    "Cloud": 10.6928,
		    "Age": 0.524481
		  },
		  {
		    "Year": 2008,
		    "Doy": 294,
		    "SCF": 15.1371,
		    "Cloud": 99.7506,
		    "Age": 1.51807
		  },
		  {
		    "Year": 2008,
		    "Doy": 295,
		    "SCF": 15.1358,
		    "Cloud": 25.966,
		    "Age": 0.901904
		  },
		  {
		    "Year": 2008,
		    "Doy": 296,
		    "SCF": 17.9484,
		    "Cloud": 28.0927,
		    "Age": 0.853028
		  },
		  {
		    "Year": 2008,
		    "Doy": 297,
		    "SCF": 16.6626,
		    "Cloud": 99.9927,
		    "Age": 1.85296
		  },
		  {
		    "Year": 2008,
		    "Doy": 298,
		    "SCF": 16.6587,
		    "Cloud": 31.2668,
		    "Age": 1.10908
		  },
		  {
		    "Year": 2008,
		    "Doy": 299,
		    "SCF": 25.6699,
		    "Cloud": 97.6978,
		    "Age": 2.07443
		  },
		  {
		    "Year": 2008,
		    "Doy": 300,
		    "SCF": 24.7131,
		    "Cloud": 27.0033,
		    "Age": 1.13701
		  },
		  {
		    "Year": 2008,
		    "Doy": 301,
		    "SCF": 47.3267,
		    "Cloud": 43.7844,
		    "Age": 1.22113
		  },
		  {
		    "Year": 2008,
		    "Doy": 302,
		    "SCF": 76.6719,
		    "Cloud": 81.1828,
		    "Age": 1.82986
		  },
		  {
		    "Year": 2008,
		    "Doy": 303,
		    "SCF": 84.1705,
		    "Cloud": 95.5844,
		    "Age": 2.59644
		  },
		  {
		    "Year": 2008,
		    "Doy": 304,
		    "SCF": 84.4611,
		    "Cloud": 98.1693,
		    "Age": 3.52772
		  },
		  {
		    "Year": 2008,
		    "Doy": 305,
		    "SCF": 84.7718,
		    "Cloud": 6.62511,
		    "Age": 0.447213
		  },
		  {
		    "Year": 2008,
		    "Doy": 306,
		    "SCF": 78.3875,
		    "Cloud": 12.3496,
		    "Age": 0.349646
		  },
		  {
		    "Year": 2008,
		    "Doy": 307,
		    "SCF": 69.1212,
		    "Cloud": 62.8136,
		    "Age": 0.894769
		  },
		  {
		    "Year": 2008,
		    "Doy": 308,
		    "SCF": 62.3445,
		    "Cloud": 90.1009,
		    "Age": 1.76053
		  },
		  {
		    "Year": 2008,
		    "Doy": 309,
		    "SCF": 61.6058,
		    "Cloud": 10.4936,
		    "Age": 0.31178
		  },
		  {
		    "Year": 2008,
		    "Doy": 310,
		    "SCF": 58.946,
		    "Cloud": 11.6356,
		    "Age": 0.311068
		  },
		  {
		    "Year": 2008,
		    "Doy": 311,
		    "SCF": 69.3035,
		    "Cloud": 59.547,
		    "Age": 0.777241
		  },
		  {
		    "Year": 2008,
		    "Doy": 312,
		    "SCF": 71.1603,
		    "Cloud": 99.9971,
		    "Age": 1.7772
		  },
		  {
		    "Year": 2008,
		    "Doy": 313,
		    "SCF": 71.1603,
		    "Cloud": 98.1996,
		    "Age": 2.72774
		  },
		  {
		    "Year": 2008,
		    "Doy": 314,
		    "SCF": 71.3774,
		    "Cloud": 98.006,
		    "Age": 3.65304
		  },
		  {
		    "Year": 2008,
		    "Doy": 315,
		    "SCF": 71.8197,
		    "Cloud": 93.7807,
		    "Age": 4.36086
		  },
		  {
		    "Year": 2008,
		    "Doy": 316,
		    "SCF": 72.3217,
		    "Cloud": 53.694,
		    "Age": 2.91328
		  },
		  {
		    "Year": 2008,
		    "Doy": 317,
		    "SCF": 73.9296,
		    "Cloud": 10.3705,
		    "Age": 0.651256
		  },
		  {
		    "Year": 2008,
		    "Doy": 318,
		    "SCF": 71.0174,
		    "Cloud": 63.3419,
		    "Age": 1.15163
		  },
		  {
		    "Year": 2008,
		    "Doy": 319,
		    "SCF": 68.1875,
		    "Cloud": 84.143,
		    "Age": 1.84094
		  },
		  {
		    "Year": 2008,
		    "Doy": 320,
		    "SCF": 69.2707,
		    "Cloud": 31.8905,
		    "Age": 1.00301
		  },
		  {
		    "Year": 2008,
		    "Doy": 321,
		    "SCF": 66.5013,
		    "Cloud": 82.7139,
		    "Age": 1.59494
		  },
		  {
		    "Year": 2008,
		    "Doy": 322,
		    "SCF": 65.6283,
		    "Cloud": 96.6896,
		    "Age": 2.52644
		  },
		  {
		    "Year": 2008,
		    "Doy": 323,
		    "SCF": 64.5958,
		    "Cloud": 24.8306,
		    "Age": 1.08178
		  },
		  {
		    "Year": 2008,
		    "Doy": 324,
		    "SCF": 64.9407,
		    "Cloud": 74.3672,
		    "Age": 1.73104
		  },
		  {
		    "Year": 2008,
		    "Doy": 325,
		    "SCF": 63.2952,
		    "Cloud": 71.3004,
		    "Age": 2.18772
		  },
		  {
		    "Year": 2008,
		    "Doy": 326,
		    "SCF": 64.1776,
		    "Cloud": 40.7093,
		    "Age": 1.49591
		  },
		  {
		    "Year": 2008,
		    "Doy": 327,
		    "SCF": 63.8709,
		    "Cloud": 50.126,
		    "Age": 1.43829
		  },
		  {
		    "Year": 2008,
		    "Doy": 328,
		    "SCF": 64.8411,
		    "Cloud": 73.56,
		    "Age": 1.83925
		  },
		  {
		    "Year": 2008,
		    "Doy": 329,
		    "SCF": 65.9965,
		    "Cloud": 90.0605,
		    "Age": 2.5506
		  },
		  {
		    "Year": 2008,
		    "Doy": 330,
		    "SCF": 66.0055,
		    "Cloud": 16.6987,
		    "Age": 0.685117
		  },
		  {
		    "Year": 2008,
		    "Doy": 331,
		    "SCF": 64.7829,
		    "Cloud": 73.6672,
		    "Age": 1.27775
		  },
		  {
		    "Year": 2008,
		    "Doy": 332,
		    "SCF": 63.6478,
		    "Cloud": 68.2977,
		    "Age": 1.633
		  },
		  {
		    "Year": 2008,
		    "Doy": 333,
		    "SCF": 65.9896,
		    "Cloud": 26.7392,
		    "Age": 0.857964
		  },
		  {
		    "Year": 2008,
		    "Doy": 334,
		    "SCF": 85.3929,
		    "Cloud": 99.8284,
		    "Age": 1.84612
		  },
		  {
		    "Year": 2008,
		    "Doy": 335,
		    "SCF": 85.4062,
		    "Cloud": 37.5796,
		    "Age": 1.32684
		  },
		  {
		    "Year": 2008,
		    "Doy": 336,
		    "SCF": 84.5866,
		    "Cloud": 97.4874,
		    "Age": 2.288
		  },
		  {
		    "Year": 2008,
		    "Doy": 337,
		    "SCF": 84.8111,
		    "Cloud": 99.727,
		    "Age": 3.26713
		  },
		  {
		    "Year": 2008,
		    "Doy": 338,
		    "SCF": 84.84,
		    "Cloud": 81.2525,
		    "Age": 3.54456
		  },
		  {
		    "Year": 2008,
		    "Doy": 339,
		    "SCF": 86.3602,
		    "Cloud": 84.938,
		    "Age": 3.87608
		  },
		  {
		    "Year": 2008,
		    "Doy": 340,
		    "SCF": 86.5635,
		    "Cloud": 97.073,
		    "Age": 4.74907
		  },
		  {
		    "Year": 2008,
		    "Doy": 341,
		    "SCF": 86.9736,
		    "Cloud": 78.6886,
		    "Age": 4.4192
		  },
		  {
		    "Year": 2008,
		    "Doy": 342,
		    "SCF": 88.4506,
		    "Cloud": 37.3426,
		    "Age": 2.25771
		  },
		  {
		    "Year": 2008,
		    "Doy": 343,
		    "SCF": 86.6686,
		    "Cloud": 55.7356,
		    "Age": 2.11772
		  },
		  {
		    "Year": 2008,
		    "Doy": 344,
		    "SCF": 89.6118,
		    "Cloud": 23.1226,
		    "Age": 1.09893
		  },
		  {
		    "Year": 2008,
		    "Doy": 345,
		    "SCF": 91.1737,
		    "Cloud": 18.5892,
		    "Age": 0.678382
		  },
		  {
		    "Year": 2008,
		    "Doy": 346,
		    "SCF": 80.6738,
		    "Cloud": 77.2826,
		    "Age": 1.34144
		  },
		  {
		    "Year": 2008,
		    "Doy": 347,
		    "SCF": 83.5563,
		    "Cloud": 85.7906,
		    "Age": 2.04947
		  },
		  {
		    "Year": 2008,
		    "Doy": 348,
		    "SCF": 82.179,
		    "Cloud": 99.7832,
		    "Age": 3.0447
		  },
		  {
		    "Year": 2008,
		    "Doy": 349,
		    "SCF": 82.2308,
		    "Cloud": 100,
		    "Age": 4.0447
		  },
		  {
		    "Year": 2008,
		    "Doy": 350,
		    "SCF": 82.2308,
		    "Cloud": 94.4871,
		    "Age": 4.84491
		  },
		  {
		    "Year": 2008,
		    "Doy": 351,
		    "SCF": 81.8445,
		    "Cloud": 99.9913,
		    "Age": 5.84576
		  },
		  {
		    "Year": 2008,
		    "Doy": 352,
		    "SCF": 81.8445,
		    "Cloud": 77.1486,
		    "Age": 5.83461
		  },
		  {
		    "Year": 2008,
		    "Doy": 353,
		    "SCF": 82.0724,
		    "Cloud": 97.3515,
		    "Age": 6.68107
		  },
		  {
		    "Year": 2008,
		    "Doy": 354,
		    "SCF": 82.5099,
		    "Cloud": 23.1696,
		    "Age": 1.98097
		  },
		  {
		    "Year": 2008,
		    "Doy": 355,
		    "SCF": 82.5099,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2008,
		    "Doy": 356,
		    "SCF": 82.5099,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2008,
		    "Doy": 357,
		    "SCF": 82.5099,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2008,
		    "Doy": 358,
		    "SCF": 82.5099,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2008,
		    "Doy": 359,
		    "SCF": 82.5099,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2008,
		    "Doy": 360,
		    "SCF": 83.8421,
		    "Cloud": 85.2852,
		    "Age": 2.5237
		  },
		  {
		    "Year": 2008,
		    "Doy": 361,
		    "SCF": 84.8064,
		    "Cloud": 51.1347,
		    "Age": 2.31234
		  },
		  {
		    "Year": 2008,
		    "Doy": 362,
		    "SCF": 85.2849,
		    "Cloud": 12.6845,
		    "Age": 0.582176
		  },
		  {
		    "Year": 2008,
		    "Doy": 363,
		    "SCF": 86.131,
		    "Cloud": 82.9198,
		    "Age": 1.37015
		  },
		  {
		    "Year": 2008,
		    "Doy": 364,
		    "SCF": 86.1716,
		    "Cloud": 19.2132,
		    "Age": 0.686387
		  },
		  {
		    "Year": 2008,
		    "Doy": 365,
		    "SCF": 85.5077,
		    "Cloud": 23.042,
		    "Age": 0.716485
		  },
		  {
		    "Year": 2009,
		    "Doy": 1,
		    "SCF": 82.9853,
		    "Cloud": 25.1937,
		    "Age": 0.252591
		  },
		  {
		    "Year": 2009,
		    "Doy": 2,
		    "SCF": 84.0751,
		    "Cloud": 21.5949,
		    "Age": 0.339227
		  },
		  {
		    "Year": 2009,
		    "Doy": 3,
		    "SCF": 82.1927,
		    "Cloud": 56.0218,
		    "Age": 0.768161
		  },
		  {
		    "Year": 2009,
		    "Doy": 4,
		    "SCF": 82.3493,
		    "Cloud": 45.5362,
		    "Age": 0.859769
		  },
		  {
		    "Year": 2009,
		    "Doy": 5,
		    "SCF": 83.4221,
		    "Cloud": 17.1557,
		    "Age": 0.427315
		  },
		  {
		    "Year": 2009,
		    "Doy": 6,
		    "SCF": 81.0978,
		    "Cloud": 61.3917,
		    "Age": 0.937378
		  },
		  {
		    "Year": 2009,
		    "Doy": 7,
		    "SCF": 81.1685,
		    "Cloud": 19.6177,
		    "Age": 0.572983
		  },
		  {
		    "Year": 2009,
		    "Doy": 8,
		    "SCF": 77.0355,
		    "Cloud": 94.8818,
		    "Age": 1.46519
		  },
		  {
		    "Year": 2009,
		    "Doy": 9,
		    "SCF": 77.7385,
		    "Cloud": 73.1957,
		    "Age": 1.8394
		  },
		  {
		    "Year": 2009,
		    "Doy": 10,
		    "SCF": 76.1981,
		    "Cloud": 24.9422,
		    "Age": 0.75807
		  },
		  {
		    "Year": 2009,
		    "Doy": 11,
		    "SCF": 72.7334,
		    "Cloud": 99.0038,
		    "Age": 1.74873
		  },
		  {
		    "Year": 2009,
		    "Doy": 12,
		    "SCF": 72.9055,
		    "Cloud": 69.5071,
		    "Age": 1.88997
		  },
		  {
		    "Year": 2009,
		    "Doy": 13,
		    "SCF": 74.527,
		    "Cloud": 50.8622,
		    "Age": 1.5979
		  },
		  {
		    "Year": 2009,
		    "Doy": 14,
		    "SCF": 75.431,
		    "Cloud": 18.4576,
		    "Age": 0.622274
		  },
		  {
		    "Year": 2009,
		    "Doy": 15,
		    "SCF": 80.5184,
		    "Cloud": 57.563,
		    "Age": 1.08069
		  },
		  {
		    "Year": 2009,
		    "Doy": 16,
		    "SCF": 87.5339,
		    "Cloud": 91.2151,
		    "Age": 1.83109
		  },
		  {
		    "Year": 2009,
		    "Doy": 17,
		    "SCF": 89.2795,
		    "Cloud": 99.8477,
		    "Age": 2.82925
		  },
		  {
		    "Year": 2009,
		    "Doy": 18,
		    "SCF": 89.3138,
		    "Cloud": 99.9304,
		    "Age": 3.82643
		  },
		  {
		    "Year": 2009,
		    "Doy": 19,
		    "SCF": 89.3342,
		    "Cloud": 95.9955,
		    "Age": 4.64053
		  },
		  {
		    "Year": 2009,
		    "Doy": 20,
		    "SCF": 90.0028,
		    "Cloud": 93.9268,
		    "Age": 5.26972
		  },
		  {
		    "Year": 2009,
		    "Doy": 21,
		    "SCF": 90.3832,
		    "Cloud": 99.035,
		    "Age": 6.21121
		  },
		  {
		    "Year": 2009,
		    "Doy": 22,
		    "SCF": 90.64,
		    "Cloud": 98.8377,
		    "Age": 7.13093
		  },
		  {
		    "Year": 2009,
		    "Doy": 23,
		    "SCF": 90.8572,
		    "Cloud": 99.5806,
		    "Age": 8.09453
		  },
		  {
		    "Year": 2009,
		    "Doy": 24,
		    "SCF": 91.0115,
		    "Cloud": 99.9231,
		    "Age": 9.09453
		  },
		  {
		    "Year": 2009,
		    "Doy": 25,
		    "SCF": 91.0115,
		    "Cloud": 93.5527,
		    "Age": 9.45108
		  },
		  {
		    "Year": 2009,
		    "Doy": 26,
		    "SCF": 91.7078,
		    "Cloud": 90.858,
		    "Age": 9.62419
		  },
		  {
		    "Year": 2009,
		    "Doy": 27,
		    "SCF": 92.0802,
		    "Cloud": 60.3007,
		    "Age": 6.94
		  },
		  {
		    "Year": 2009,
		    "Doy": 28,
		    "SCF": 91.2541,
		    "Cloud": 64.2607,
		    "Age": 4.83164
		  },
		  {
		    "Year": 2009,
		    "Doy": 29,
		    "SCF": 94.8388,
		    "Cloud": 93.3793,
		    "Age": 5.43712
		  },
		  {
		    "Year": 2009,
		    "Doy": 30,
		    "SCF": 95.4623,
		    "Cloud": 30.6683,
		    "Age": 2.42072
		  },
		  {
		    "Year": 2009,
		    "Doy": 31,
		    "SCF": 95.3905,
		    "Cloud": 25.5381,
		    "Age": 1.92839
		  },
		  {
		    "Year": 2009,
		    "Doy": 32,
		    "SCF": 95.8417,
		    "Cloud": 56.5315,
		    "Age": 2.23611
		  },
		  {
		    "Year": 2009,
		    "Doy": 33,
		    "SCF": 96.1715,
		    "Cloud": 16.8116,
		    "Age": 0.722038
		  },
		  {
		    "Year": 2009,
		    "Doy": 34,
		    "SCF": 94.8653,
		    "Cloud": 23.7779,
		    "Age": 0.614085
		  },
		  {
		    "Year": 2009,
		    "Doy": 35,
		    "SCF": 89.5676,
		    "Cloud": 92.278,
		    "Age": 1.49888
		  },
		  {
		    "Year": 2009,
		    "Doy": 36,
		    "SCF": 90.355,
		    "Cloud": 80.9959,
		    "Age": 2.06968
		  },
		  {
		    "Year": 2009,
		    "Doy": 37,
		    "SCF": 90.9855,
		    "Cloud": 96.5964,
		    "Age": 2.99475
		  },
		  {
		    "Year": 2009,
		    "Doy": 38,
		    "SCF": 91.5759,
		    "Cloud": 98.736,
		    "Age": 3.94032
		  },
		  {
		    "Year": 2009,
		    "Doy": 39,
		    "SCF": 91.8564,
		    "Cloud": 89.9717,
		    "Age": 4.47883
		  },
		  {
		    "Year": 2009,
		    "Doy": 40,
		    "SCF": 91.96,
		    "Cloud": 37.2197,
		    "Age": 1.97215
		  },
		  {
		    "Year": 2009,
		    "Doy": 41,
		    "SCF": 95.2859,
		    "Cloud": 20.3792,
		    "Age": 0.669146
		  },
		  {
		    "Year": 2009,
		    "Doy": 42,
		    "SCF": 96.2786,
		    "Cloud": 7.15652,
		    "Age": 0.199316
		  },
		  {
		    "Year": 2009,
		    "Doy": 43,
		    "SCF": 96.0954,
		    "Cloud": 9.07839,
		    "Age": 0.247304
		  },
		  {
		    "Year": 2009,
		    "Doy": 44,
		    "SCF": 95.2529,
		    "Cloud": 34.9361,
		    "Age": 0.48841
		  },
		  {
		    "Year": 2009,
		    "Doy": 45,
		    "SCF": 93.9905,
		    "Cloud": 26.4941,
		    "Age": 0.50524
		  },
		  {
		    "Year": 2009,
		    "Doy": 46,
		    "SCF": 89.3971,
		    "Cloud": 98.8027,
		    "Age": 1.48609
		  },
		  {
		    "Year": 2009,
		    "Doy": 47,
		    "SCF": 89.4837,
		    "Cloud": 99.6144,
		    "Age": 2.4688
		  },
		  {
		    "Year": 2009,
		    "Doy": 48,
		    "SCF": 89.5547,
		    "Cloud": 97.6344,
		    "Age": 3.39705
		  },
		  {
		    "Year": 2009,
		    "Doy": 49,
		    "SCF": 89.5886,
		    "Cloud": 86.2355,
		    "Age": 3.75621
		  },
		  {
		    "Year": 2009,
		    "Doy": 50,
		    "SCF": 89.5758,
		    "Cloud": 97.0503,
		    "Age": 4.6352
		  },
		  {
		    "Year": 2009,
		    "Doy": 51,
		    "SCF": 89.824,
		    "Cloud": 93.3787,
		    "Age": 5.23857
		  },
		  {
		    "Year": 2009,
		    "Doy": 52,
		    "SCF": 90.5824,
		    "Cloud": 99.8855,
		    "Age": 6.23453
		  },
		  {
		    "Year": 2009,
		    "Doy": 53,
		    "SCF": 90.5968,
		    "Cloud": 92.106,
		    "Age": 6.67121
		  },
		  {
		    "Year": 2009,
		    "Doy": 54,
		    "SCF": 90.652,
		    "Cloud": 23.1472,
		    "Age": 1.96085
		  },
		  {
		    "Year": 2009,
		    "Doy": 55,
		    "SCF": 93.3544,
		    "Cloud": 23.8868,
		    "Age": 0.971328
		  },
		  {
		    "Year": 2009,
		    "Doy": 56,
		    "SCF": 90.7769,
		    "Cloud": 98.5534,
		    "Age": 1.9178
		  },
		  {
		    "Year": 2009,
		    "Doy": 57,
		    "SCF": 90.9338,
		    "Cloud": 21.373,
		    "Age": 0.783792
		  },
		  {
		    "Year": 2009,
		    "Doy": 58,
		    "SCF": 85.6636,
		    "Cloud": 48.1772,
		    "Age": 0.847106
		  },
		  {
		    "Year": 2009,
		    "Doy": 59,
		    "SCF": 85.5366,
		    "Cloud": 37.1668,
		    "Age": 0.960776
		  },
		  {
		    "Year": 2009,
		    "Doy": 60,
		    "SCF": 91.0967,
		    "Cloud": 99.9913,
		    "Age": 1.96078
		  },
		  {
		    "Year": 2009,
		    "Doy": 61,
		    "SCF": 91.0967,
		    "Cloud": 97.2546,
		    "Age": 2.89437
		  },
		  {
		    "Year": 2009,
		    "Doy": 62,
		    "SCF": 91.5399,
		    "Cloud": 42.7401,
		    "Age": 1.88102
		  },
		  {
		    "Year": 2009,
		    "Doy": 63,
		    "SCF": 91.6169,
		    "Cloud": 99.9783,
		    "Age": 2.88012
		  },
		  {
		    "Year": 2009,
		    "Doy": 64,
		    "SCF": 91.6238,
		    "Cloud": 98.7809,
		    "Age": 3.81898
		  },
		  {
		    "Year": 2009,
		    "Doy": 65,
		    "SCF": 91.7206,
		    "Cloud": 100,
		    "Age": 4.81898
		  },
		  {
		    "Year": 2009,
		    "Doy": 66,
		    "SCF": 91.7206,
		    "Cloud": 99.5579,
		    "Age": 5.78738
		  },
		  {
		    "Year": 2009,
		    "Doy": 67,
		    "SCF": 91.7498,
		    "Cloud": 98.7867,
		    "Age": 6.69285
		  },
		  {
		    "Year": 2009,
		    "Doy": 68,
		    "SCF": 91.8522,
		    "Cloud": 94.9324,
		    "Age": 7.3547
		  },
		  {
		    "Year": 2009,
		    "Doy": 69,
		    "SCF": 92.0597,
		    "Cloud": 92.8161,
		    "Age": 7.71689
		  },
		  {
		    "Year": 2009,
		    "Doy": 70,
		    "SCF": 92.1304,
		    "Cloud": 28.5166,
		    "Age": 2.88407
		  },
		  {
		    "Year": 2009,
		    "Doy": 71,
		    "SCF": 91.8047,
		    "Cloud": 99.9942,
		    "Age": 3.88419
		  },
		  {
		    "Year": 2009,
		    "Doy": 72,
		    "SCF": 91.8047,
		    "Cloud": 79.4724,
		    "Age": 4.2283
		  },
		  {
		    "Year": 2009,
		    "Doy": 73,
		    "SCF": 93.8773,
		    "Cloud": 33.9262,
		    "Age": 2.14142
		  },
		  {
		    "Year": 2009,
		    "Doy": 74,
		    "SCF": 95.2355,
		    "Cloud": 33.5218,
		    "Age": 1.36859
		  },
		  {
		    "Year": 2009,
		    "Doy": 75,
		    "SCF": 95.8004,
		    "Cloud": 87.4357,
		    "Age": 2.06557
		  },
		  {
		    "Year": 2009,
		    "Doy": 76,
		    "SCF": 96.6802,
		    "Cloud": 15.1071,
		    "Age": 0.398617
		  },
		  {
		    "Year": 2009,
		    "Doy": 77,
		    "SCF": 92.212,
		    "Cloud": 41.0353,
		    "Age": 0.723537
		  },
		  {
		    "Year": 2009,
		    "Doy": 78,
		    "SCF": 97.792,
		    "Cloud": 0.057987,
		    "Age": 0.00379815
		  },
		  {
		    "Year": 2009,
		    "Doy": 79,
		    "SCF": 94.3354,
		    "Cloud": 42.1964,
		    "Age": 0.424458
		  },
		  {
		    "Year": 2009,
		    "Doy": 80,
		    "SCF": 92.6279,
		    "Cloud": 88.1682,
		    "Age": 1.22053
		  },
		  {
		    "Year": 2009,
		    "Doy": 81,
		    "SCF": 92.4999,
		    "Cloud": 93.2787,
		    "Age": 2.06994
		  },
		  {
		    "Year": 2009,
		    "Doy": 82,
		    "SCF": 92.8126,
		    "Cloud": 4.53643,
		    "Age": 0.1034
		  },
		  {
		    "Year": 2009,
		    "Doy": 83,
		    "SCF": 95.4129,
		    "Cloud": 11.0428,
		    "Age": 0.138003
		  },
		  {
		    "Year": 2009,
		    "Doy": 84,
		    "SCF": 90.437,
		    "Cloud": 67.6538,
		    "Age": 0.73745
		  },
		  {
		    "Year": 2009,
		    "Doy": 85,
		    "SCF": 91.9167,
		    "Cloud": 54.7626,
		    "Age": 0.962688
		  },
		  {
		    "Year": 2009,
		    "Doy": 86,
		    "SCF": 90.6805,
		    "Cloud": 99.3564,
		    "Age": 1.95083
		  },
		  {
		    "Year": 2009,
		    "Doy": 87,
		    "SCF": 90.7551,
		    "Cloud": 95.2859,
		    "Age": 2.8014
		  },
		  {
		    "Year": 2009,
		    "Doy": 88,
		    "SCF": 90.987,
		    "Cloud": 13.857,
		    "Age": 0.541858
		  },
		  {
		    "Year": 2009,
		    "Doy": 89,
		    "SCF": 93.5474,
		    "Cloud": 99.8927,
		    "Age": 1.54089
		  },
		  {
		    "Year": 2009,
		    "Doy": 90,
		    "SCF": 93.5554,
		    "Cloud": 88.4117,
		    "Age": 2.29545
		  },
		  {
		    "Year": 2009,
		    "Doy": 91,
		    "SCF": 93.6142,
		    "Cloud": 7.17019,
		    "Age": 0.326718
		  },
		  {
		    "Year": 2009,
		    "Doy": 92,
		    "SCF": 93.5301,
		    "Cloud": 96.8596,
		    "Age": 1.29485
		  },
		  {
		    "Year": 2009,
		    "Doy": 93,
		    "SCF": 93.3102,
		    "Cloud": 52.2854,
		    "Age": 1.26081
		  },
		  {
		    "Year": 2009,
		    "Doy": 94,
		    "SCF": 95.4028,
		    "Cloud": 7.89527,
		    "Age": 0.125407
		  },
		  {
		    "Year": 2009,
		    "Doy": 95,
		    "SCF": 90.7365,
		    "Cloud": 51.3676,
		    "Age": 0.552836
		  },
		  {
		    "Year": 2009,
		    "Doy": 96,
		    "SCF": 91.0386,
		    "Cloud": 49.3837,
		    "Age": 0.777225
		  },
		  {
		    "Year": 2009,
		    "Doy": 97,
		    "SCF": 89.8051,
		    "Cloud": 99.9927,
		    "Age": 1.77747
		  },
		  {
		    "Year": 2009,
		    "Doy": 98,
		    "SCF": 89.8054,
		    "Cloud": 98.9079,
		    "Age": 2.74107
		  },
		  {
		    "Year": 2009,
		    "Doy": 99,
		    "SCF": 89.8116,
		    "Cloud": 89.2725,
		    "Age": 3.34656
		  },
		  {
		    "Year": 2009,
		    "Doy": 100,
		    "SCF": 90.4136,
		    "Cloud": 100,
		    "Age": 4.34685
		  },
		  {
		    "Year": 2009,
		    "Doy": 101,
		    "SCF": 90.4136,
		    "Cloud": 13.6575,
		    "Age": 0.776647
		  },
		  {
		    "Year": 2009,
		    "Doy": 102,
		    "SCF": 74.3763,
		    "Cloud": 99.837,
		    "Age": 1.77584
		  },
		  {
		    "Year": 2009,
		    "Doy": 103,
		    "SCF": 74.3409,
		    "Cloud": 47.6801,
		    "Age": 1.07354
		  },
		  {
		    "Year": 2009,
		    "Doy": 104,
		    "SCF": 71.8884,
		    "Cloud": 89.7325,
		    "Age": 1.9341
		  },
		  {
		    "Year": 2009,
		    "Doy": 105,
		    "SCF": 71.6021,
		    "Cloud": 88.2093,
		    "Age": 2.6761
		  },
		  {
		    "Year": 2009,
		    "Doy": 106,
		    "SCF": 71.2634,
		    "Cloud": 99.3507,
		    "Age": 3.65002
		  },
		  {
		    "Year": 2009,
		    "Doy": 107,
		    "SCF": 71.2714,
		    "Cloud": 8.31307,
		    "Age": 0.447785
		  },
		  {
		    "Year": 2009,
		    "Doy": 108,
		    "SCF": 67.7141,
		    "Cloud": 81.2142,
		    "Age": 1.25566
		  },
		  {
		    "Year": 2009,
		    "Doy": 109,
		    "SCF": 67.6376,
		    "Cloud": 52.0193,
		    "Age": 1.24279
		  },
		  {
		    "Year": 2009,
		    "Doy": 110,
		    "SCF": 65.9773,
		    "Cloud": 89.2971,
		    "Age": 1.9674
		  },
		  {
		    "Year": 2009,
		    "Doy": 111,
		    "SCF": 65.254,
		    "Cloud": 49.8493,
		    "Age": 1.67205
		  },
		  {
		    "Year": 2009,
		    "Doy": 112,
		    "SCF": 64.562,
		    "Cloud": 37.6289,
		    "Age": 0.930556
		  },
		  {
		    "Year": 2009,
		    "Doy": 113,
		    "SCF": 62.9316,
		    "Cloud": 2.5442,
		    "Age": 0.0414033
		  },
		  {
		    "Year": 2009,
		    "Doy": 114,
		    "SCF": 57.4134,
		    "Cloud": 81.5538,
		    "Age": 0.847376
		  },
		  {
		    "Year": 2009,
		    "Doy": 115,
		    "SCF": 56.4907,
		    "Cloud": 11.8176,
		    "Age": 0.244625
		  },
		  {
		    "Year": 2009,
		    "Doy": 116,
		    "SCF": 41.6037,
		    "Cloud": 92.7792,
		    "Age": 1.15397
		  },
		  {
		    "Year": 2009,
		    "Doy": 117,
		    "SCF": 40.7782,
		    "Cloud": 96.421,
		    "Age": 2.09141
		  },
		  {
		    "Year": 2009,
		    "Doy": 118,
		    "SCF": 40.007,
		    "Cloud": 85.6493,
		    "Age": 2.63867
		  },
		  {
		    "Year": 2009,
		    "Doy": 119,
		    "SCF": 39.0626,
		    "Cloud": 99.9927,
		    "Age": 3.64052
		  },
		  {
		    "Year": 2009,
		    "Doy": 120,
		    "SCF": 39.0626,
		    "Cloud": 63.4477,
		    "Age": 2.95247
		  },
		  {
		    "Year": 2009,
		    "Doy": 121,
		    "SCF": 38.1267,
		    "Cloud": 19.5091,
		    "Age": 1.00061
		  },
		  {
		    "Year": 2009,
		    "Doy": 122,
		    "SCF": 32.0533,
		    "Cloud": 89.5188,
		    "Age": 1.88083
		  },
		  {
		    "Year": 2009,
		    "Doy": 123,
		    "SCF": 31.0813,
		    "Cloud": 87.6499,
		    "Age": 2.38929
		  },
		  {
		    "Year": 2009,
		    "Doy": 124,
		    "SCF": 30.6971,
		    "Cloud": 26.9881,
		    "Age": 1.00876
		  },
		  {
		    "Year": 2009,
		    "Doy": 125,
		    "SCF": 26.9051,
		    "Cloud": 41.7965,
		    "Age": 0.978852
		  },
		  {
		    "Year": 2009,
		    "Doy": 126,
		    "SCF": 25.4366,
		    "Cloud": 52.4086,
		    "Age": 1.19333
		  },
		  {
		    "Year": 2009,
		    "Doy": 127,
		    "SCF": 23.9619,
		    "Cloud": 79.6094,
		    "Age": 1.8597
		  },
		  {
		    "Year": 2009,
		    "Doy": 128,
		    "SCF": 22.6945,
		    "Cloud": 98.8658,
		    "Age": 2.85625
		  },
		  {
		    "Year": 2009,
		    "Doy": 129,
		    "SCF": 22.6879,
		    "Cloud": 61.4226,
		    "Age": 2.47917
		  },
		  {
		    "Year": 2009,
		    "Doy": 130,
		    "SCF": 21.3589,
		    "Cloud": 71.715,
		    "Age": 2.76559
		  },
		  {
		    "Year": 2009,
		    "Doy": 131,
		    "SCF": 20.6755,
		    "Cloud": 38.0354,
		    "Age": 1.32069
		  },
		  {
		    "Year": 2009,
		    "Doy": 132,
		    "SCF": 18.1553,
		    "Cloud": 60.5042,
		    "Age": 1.57805
		  },
		  {
		    "Year": 2009,
		    "Doy": 133,
		    "SCF": 17.4237,
		    "Cloud": 29.292,
		    "Age": 0.845912
		  },
		  {
		    "Year": 2009,
		    "Doy": 134,
		    "SCF": 16.4438,
		    "Cloud": 82.3596,
		    "Age": 1.55694
		  },
		  {
		    "Year": 2009,
		    "Doy": 135,
		    "SCF": 15.7262,
		    "Cloud": 6.70548,
		    "Age": 0.364883
		  },
		  {
		    "Year": 2009,
		    "Doy": 136,
		    "SCF": 14.507,
		    "Cloud": 95.8302,
		    "Age": 1.32093
		  },
		  {
		    "Year": 2009,
		    "Doy": 137,
		    "SCF": 14.4864,
		    "Cloud": 71.4005,
		    "Age": 1.75426
		  },
		  {
		    "Year": 2009,
		    "Doy": 138,
		    "SCF": 15.0999,
		    "Cloud": 99.9082,
		    "Age": 2.75264
		  },
		  {
		    "Year": 2009,
		    "Doy": 139,
		    "SCF": 15.1004,
		    "Cloud": 94.6905,
		    "Age": 3.57895
		  },
		  {
		    "Year": 2009,
		    "Doy": 140,
		    "SCF": 15.072,
		    "Cloud": 87.8018,
		    "Age": 4.05904
		  },
		  {
		    "Year": 2009,
		    "Doy": 141,
		    "SCF": 14.3262,
		    "Cloud": 57.095,
		    "Age": 2.93167
		  },
		  {
		    "Year": 2009,
		    "Doy": 142,
		    "SCF": 12.8463,
		    "Cloud": 95.0453,
		    "Age": 3.74008
		  },
		  {
		    "Year": 2009,
		    "Doy": 143,
		    "SCF": 12.4455,
		    "Cloud": 46.3442,
		    "Age": 2.29853
		  },
		  {
		    "Year": 2009,
		    "Doy": 144,
		    "SCF": 10.6858,
		    "Cloud": 76.3135,
		    "Age": 2.79791
		  },
		  {
		    "Year": 2009,
		    "Doy": 145,
		    "SCF": 10.1184,
		    "Cloud": 11.7953,
		    "Age": 0.439951
		  },
		  {
		    "Year": 2009,
		    "Doy": 146,
		    "SCF": 9.06457,
		    "Cloud": 99.7812,
		    "Age": 1.43982
		  },
		  {
		    "Year": 2009,
		    "Doy": 147,
		    "SCF": 9.06457,
		    "Cloud": 57.6475,
		    "Age": 1.46518
		  },
		  {
		    "Year": 2009,
		    "Doy": 148,
		    "SCF": 7.78968,
		    "Cloud": 70.691,
		    "Age": 1.81678
		  },
		  {
		    "Year": 2009,
		    "Doy": 149,
		    "SCF": 7.00574,
		    "Cloud": 42.8959,
		    "Age": 1.37798
		  },
		  {
		    "Year": 2009,
		    "Doy": 150,
		    "SCF": 6.89072,
		    "Cloud": 5.22632,
		    "Age": 0.232064
		  },
		  {
		    "Year": 2009,
		    "Doy": 151,
		    "SCF": 6.5908,
		    "Cloud": 4.17925,
		    "Age": 0.152052
		  },
		  {
		    "Year": 2009,
		    "Doy": 152,
		    "SCF": 6.81376,
		    "Cloud": 37.9968,
		    "Age": 0.532652
		  },
		  {
		    "Year": 2009,
		    "Doy": 153,
		    "SCF": 7.0051,
		    "Cloud": 40.5577,
		    "Age": 0.705883
		  },
		  {
		    "Year": 2009,
		    "Doy": 154,
		    "SCF": 7.74925,
		    "Cloud": 57.5867,
		    "Age": 1.0329
		  },
		  {
		    "Year": 2009,
		    "Doy": 155,
		    "SCF": 7.98154,
		    "Cloud": 80.7505,
		    "Age": 1.67957
		  },
		  {
		    "Year": 2009,
		    "Doy": 156,
		    "SCF": 7.07203,
		    "Cloud": 63.4477,
		    "Age": 1.7494
		  },
		  {
		    "Year": 2009,
		    "Doy": 157,
		    "SCF": 6.75712,
		    "Cloud": 59.657,
		    "Age": 1.75158
		  },
		  {
		    "Year": 2009,
		    "Doy": 158,
		    "SCF": 6.92953,
		    "Cloud": 69.8453,
		    "Age": 2.01622
		  },
		  {
		    "Year": 2009,
		    "Doy": 159,
		    "SCF": 6.5498,
		    "Cloud": 88.6851,
		    "Age": 2.72035
		  },
		  {
		    "Year": 2009,
		    "Doy": 160,
		    "SCF": 5.24457,
		    "Cloud": 68.0371,
		    "Age": 2.59721
		  },
		  {
		    "Year": 2009,
		    "Doy": 161,
		    "SCF": 5.14895,
		    "Cloud": 96.9688,
		    "Age": 3.47156
		  },
		  {
		    "Year": 2009,
		    "Doy": 162,
		    "SCF": 5.08299,
		    "Cloud": 91.9082,
		    "Age": 4.17539
		  },
		  {
		    "Year": 2009,
		    "Doy": 163,
		    "SCF": 5.08299,
		    "Cloud": 99.4282,
		    "Age": 5.09561
		  },
		  {
		    "Year": 2009,
		    "Doy": 164,
		    "SCF": 4.94453,
		    "Cloud": 35.4124,
		    "Age": 2.34512
		  },
		  {
		    "Year": 2009,
		    "Doy": 165,
		    "SCF": 4.59322,
		    "Cloud": 32.0996,
		    "Age": 1.30051
		  },
		  {
		    "Year": 2009,
		    "Doy": 166,
		    "SCF": 4.88607,
		    "Cloud": 70.3964,
		    "Age": 1.73896
		  },
		  {
		    "Year": 2009,
		    "Doy": 167,
		    "SCF": 4.16476,
		    "Cloud": 61.3321,
		    "Age": 1.82822
		  },
		  {
		    "Year": 2009,
		    "Doy": 168,
		    "SCF": 4.01199,
		    "Cloud": 10.6362,
		    "Age": 0.457527
		  },
		  {
		    "Year": 2009,
		    "Doy": 169,
		    "SCF": 3.73635,
		    "Cloud": 99.631,
		    "Age": 1.45648
		  },
		  {
		    "Year": 2009,
		    "Doy": 170,
		    "SCF": 3.70435,
		    "Cloud": 77.7228,
		    "Age": 1.95607
		  },
		  {
		    "Year": 2009,
		    "Doy": 171,
		    "SCF": 3.44372,
		    "Cloud": 64.8273,
		    "Age": 2.086
		  },
		  {
		    "Year": 2009,
		    "Doy": 172,
		    "SCF": 2.77807,
		    "Cloud": 40.1213,
		    "Age": 1.31208
		  },
		  {
		    "Year": 2009,
		    "Doy": 173,
		    "SCF": 2.01493,
		    "Cloud": 58.1127,
		    "Age": 1.47544
		  },
		  {
		    "Year": 2009,
		    "Doy": 174,
		    "SCF": 1.7391,
		    "Cloud": 49.7344,
		    "Age": 1.5442
		  },
		  {
		    "Year": 2009,
		    "Doy": 175,
		    "SCF": 1.65578,
		    "Cloud": 10.1889,
		    "Age": 0.401036
		  },
		  {
		    "Year": 2009,
		    "Doy": 176,
		    "SCF": 1.56791,
		    "Cloud": 39.102,
		    "Age": 0.611125
		  },
		  {
		    "Year": 2009,
		    "Doy": 177,
		    "SCF": 1.51731,
		    "Cloud": 4.13542,
		    "Age": 0.128221
		  },
		  {
		    "Year": 2009,
		    "Doy": 178,
		    "SCF": 0.977648,
		    "Cloud": 12.2388,
		    "Age": 0.175053
		  },
		  {
		    "Year": 2009,
		    "Doy": 179,
		    "SCF": 0.800934,
		    "Cloud": 32.9316,
		    "Age": 0.415672
		  },
		  {
		    "Year": 2009,
		    "Doy": 180,
		    "SCF": 0.920957,
		    "Cloud": 80.5427,
		    "Age": 1.15229
		  },
		  {
		    "Year": 2009,
		    "Doy": 181,
		    "SCF": 0.732181,
		    "Cloud": 90.6296,
		    "Age": 1.95931
		  },
		  {
		    "Year": 2009,
		    "Doy": 182,
		    "SCF": 0.571697,
		    "Cloud": 40.0359,
		    "Age": 1.18831
		  },
		  {
		    "Year": 2009,
		    "Doy": 183,
		    "SCF": 0.476379,
		    "Cloud": 19.7449,
		    "Age": 0.477663
		  },
		  {
		    "Year": 2009,
		    "Doy": 184,
		    "SCF": 0.355948,
		    "Cloud": 8.37284,
		    "Age": 0.178251
		  },
		  {
		    "Year": 2009,
		    "Doy": 185,
		    "SCF": 0.490329,
		    "Cloud": 10.9478,
		    "Age": 0.135052
		  },
		  {
		    "Year": 2009,
		    "Doy": 186,
		    "SCF": 2.08865,
		    "Cloud": 65.6518,
		    "Age": 0.740023
		  },
		  {
		    "Year": 2009,
		    "Doy": 187,
		    "SCF": 2.73531,
		    "Cloud": 96.2691,
		    "Age": 1.69547
		  },
		  {
		    "Year": 2009,
		    "Doy": 188,
		    "SCF": 2.6313,
		    "Cloud": 85.1119,
		    "Age": 2.34303
		  },
		  {
		    "Year": 2009,
		    "Doy": 189,
		    "SCF": 2.43109,
		    "Cloud": 96.3053,
		    "Age": 3.23744
		  },
		  {
		    "Year": 2009,
		    "Doy": 190,
		    "SCF": 2.20319,
		    "Cloud": 99.8731,
		    "Age": 4.23853
		  },
		  {
		    "Year": 2009,
		    "Doy": 191,
		    "SCF": 2.20319,
		    "Cloud": 98.8696,
		    "Age": 5.19267
		  },
		  {
		    "Year": 2009,
		    "Doy": 192,
		    "SCF": 2.17119,
		    "Cloud": 95.7761,
		    "Age": 5.93807
		  },
		  {
		    "Year": 2009,
		    "Doy": 193,
		    "SCF": 2.11703,
		    "Cloud": 89.0762,
		    "Age": 6.22052
		  },
		  {
		    "Year": 2009,
		    "Doy": 194,
		    "SCF": 2.17128,
		    "Cloud": 79.1535,
		    "Age": 5.56286
		  },
		  {
		    "Year": 2009,
		    "Doy": 195,
		    "SCF": 2.95538,
		    "Cloud": 57.1947,
		    "Age": 3.68775
		  },
		  {
		    "Year": 2009,
		    "Doy": 196,
		    "SCF": 1.98339,
		    "Cloud": 73.3903,
		    "Age": 3.44887
		  },
		  {
		    "Year": 2009,
		    "Doy": 197,
		    "SCF": 1.95239,
		    "Cloud": 59.3251,
		    "Age": 2.74079
		  },
		  {
		    "Year": 2009,
		    "Doy": 198,
		    "SCF": 2.41536,
		    "Cloud": 63.9864,
		    "Age": 2.49044
		  },
		  {
		    "Year": 2009,
		    "Doy": 199,
		    "SCF": 2.8336,
		    "Cloud": 93.8038,
		    "Age": 3.29273
		  },
		  {
		    "Year": 2009,
		    "Doy": 200,
		    "SCF": 3.07292,
		    "Cloud": 99.9038,
		    "Age": 4.28775
		  },
		  {
		    "Year": 2009,
		    "Doy": 201,
		    "SCF": 3.02681,
		    "Cloud": 99.7493,
		    "Age": 5.27485
		  },
		  {
		    "Year": 2009,
		    "Doy": 202,
		    "SCF": 2.86185,
		    "Cloud": 99.8484,
		    "Age": 6.27013
		  },
		  {
		    "Year": 2009,
		    "Doy": 203,
		    "SCF": 2.74862,
		    "Cloud": 84.5984,
		    "Age": 6.17858
		  },
		  {
		    "Year": 2009,
		    "Doy": 204,
		    "SCF": 2.98126,
		    "Cloud": 99.5684,
		    "Age": 7.17788
		  },
		  {
		    "Year": 2009,
		    "Doy": 205,
		    "SCF": 2.96578,
		    "Cloud": 73.221,
		    "Age": 6.15227
		  },
		  {
		    "Year": 2009,
		    "Doy": 206,
		    "SCF": 3.59945,
		    "Cloud": 86.278,
		    "Age": 6.03272
		  },
		  {
		    "Year": 2009,
		    "Doy": 207,
		    "SCF": 2.81588,
		    "Cloud": 68.1753,
		    "Age": 4.90056
		  },
		  {
		    "Year": 2009,
		    "Doy": 208,
		    "SCF": 3.893,
		    "Cloud": 92.0038,
		    "Age": 5.42585
		  },
		  {
		    "Year": 2009,
		    "Doy": 209,
		    "SCF": 1.41805,
		    "Cloud": 87.0005,
		    "Age": 5.61768
		  },
		  {
		    "Year": 2009,
		    "Doy": 210,
		    "SCF": 1.44733,
		    "Cloud": 98.8879,
		    "Age": 6.53535
		  },
		  {
		    "Year": 2009,
		    "Doy": 211,
		    "SCF": 0.992829,
		    "Cloud": 99.7289,
		    "Age": 7.53545
		  },
		  {
		    "Year": 2009,
		    "Doy": 212,
		    "SCF": 0.992829,
		    "Cloud": 88.9007,
		    "Age": 7.76826
		  },
		  {
		    "Year": 2009,
		    "Doy": 213,
		    "SCF": 0.748006,
		    "Cloud": 25.9868,
		    "Age": 2.70604
		  },
		  {
		    "Year": 2009,
		    "Doy": 214,
		    "SCF": 1.07386,
		    "Cloud": 95.2282,
		    "Age": 3.62699
		  },
		  {
		    "Year": 2009,
		    "Doy": 215,
		    "SCF": 1.0457,
		    "Cloud": 99.815,
		    "Age": 4.62662
		  },
		  {
		    "Year": 2009,
		    "Doy": 216,
		    "SCF": 1.0457,
		    "Cloud": 90.1456,
		    "Age": 5.20939
		  },
		  {
		    "Year": 2009,
		    "Doy": 217,
		    "SCF": 0.975986,
		    "Cloud": 63.6652,
		    "Age": 4.62554
		  },
		  {
		    "Year": 2009,
		    "Doy": 218,
		    "SCF": 0.942414,
		    "Cloud": 93.5334,
		    "Age": 5.03677
		  },
		  {
		    "Year": 2009,
		    "Doy": 219,
		    "SCF": 0.938486,
		    "Cloud": 44.5816,
		    "Age": 2.6418
		  },
		  {
		    "Year": 2009,
		    "Doy": 220,
		    "SCF": 1.52425,
		    "Cloud": 50.8879,
		    "Age": 2.22624
		  },
		  {
		    "Year": 2009,
		    "Doy": 221,
		    "SCF": 2.41785,
		    "Cloud": 69.7574,
		    "Age": 2.11988
		  },
		  {
		    "Year": 2009,
		    "Doy": 222,
		    "SCF": 2.90473,
		    "Cloud": 81.2876,
		    "Age": 2.47148
		  },
		  {
		    "Year": 2009,
		    "Doy": 223,
		    "SCF": 2.70808,
		    "Cloud": 64.2024,
		    "Age": 2.30145
		  },
		  {
		    "Year": 2009,
		    "Doy": 224,
		    "SCF": 2.66477,
		    "Cloud": 71.9473,
		    "Age": 2.51262
		  },
		  {
		    "Year": 2009,
		    "Doy": 225,
		    "SCF": 3.18884,
		    "Cloud": 48.9445,
		    "Age": 1.88487
		  },
		  {
		    "Year": 2009,
		    "Doy": 226,
		    "SCF": 0.548814,
		    "Cloud": 13.2451,
		    "Age": 0.528623
		  },
		  {
		    "Year": 2009,
		    "Doy": 227,
		    "SCF": 2.00662,
		    "Cloud": 99.9956,
		    "Age": 1.52813
		  },
		  {
		    "Year": 2009,
		    "Doy": 228,
		    "SCF": 2.00662,
		    "Cloud": 90.7506,
		    "Age": 2.30979
		  },
		  {
		    "Year": 2009,
		    "Doy": 229,
		    "SCF": 1.64016,
		    "Cloud": 85.6356,
		    "Age": 2.85437
		  },
		  {
		    "Year": 2009,
		    "Doy": 230,
		    "SCF": 0.705217,
		    "Cloud": 29.49,
		    "Age": 1.25718
		  },
		  {
		    "Year": 2009,
		    "Doy": 231,
		    "SCF": 1.3927,
		    "Cloud": 72.6464,
		    "Age": 1.68086
		  },
		  {
		    "Year": 2009,
		    "Doy": 232,
		    "SCF": 1.62566,
		    "Cloud": 98.8274,
		    "Age": 2.64491
		  },
		  {
		    "Year": 2009,
		    "Doy": 233,
		    "SCF": 1.59233,
		    "Cloud": 62.5233,
		    "Age": 2.37445
		  },
		  {
		    "Year": 2009,
		    "Doy": 234,
		    "SCF": 1.35131,
		    "Cloud": 29.3248,
		    "Age": 1.19947
		  },
		  {
		    "Year": 2009,
		    "Doy": 235,
		    "SCF": 2.15372,
		    "Cloud": 34.7829,
		    "Age": 1.03249
		  },
		  {
		    "Year": 2009,
		    "Doy": 236,
		    "SCF": 4.64838,
		    "Cloud": 97.0873,
		    "Age": 1.99888
		  },
		  {
		    "Year": 2009,
		    "Doy": 237,
		    "SCF": 4.33672,
		    "Cloud": 85.4828,
		    "Age": 2.67426
		  },
		  {
		    "Year": 2009,
		    "Doy": 238,
		    "SCF": 3.87499,
		    "Cloud": 64.8583,
		    "Age": 2.07477
		  },
		  {
		    "Year": 2009,
		    "Doy": 239,
		    "SCF": 7.08976,
		    "Cloud": 99.984,
		    "Age": 3.07467
		  },
		  {
		    "Year": 2009,
		    "Doy": 240,
		    "SCF": 7.08659,
		    "Cloud": 99.3763,
		    "Age": 4.0471
		  },
		  {
		    "Year": 2009,
		    "Doy": 241,
		    "SCF": 6.59782,
		    "Cloud": 64.1773,
		    "Age": 3.12483
		  },
		  {
		    "Year": 2009,
		    "Doy": 242,
		    "SCF": 5.78191,
		    "Cloud": 73.3511,
		    "Age": 3.27753
		  },
		  {
		    "Year": 2009,
		    "Doy": 243,
		    "SCF": 6.28612,
		    "Cloud": 99.86,
		    "Age": 4.27174
		  },
		  {
		    "Year": 2009,
		    "Doy": 244,
		    "SCF": 6.15774,
		    "Cloud": 98.6991,
		    "Age": 5.23135
		  },
		  {
		    "Year": 2009,
		    "Doy": 245,
		    "SCF": 6.20272,
		    "Cloud": 96.1644,
		    "Age": 6.01302
		  },
		  {
		    "Year": 2009,
		    "Doy": 246,
		    "SCF": 5.37898,
		    "Cloud": 99.9096,
		    "Age": 7.00792
		  },
		  {
		    "Year": 2009,
		    "Doy": 247,
		    "SCF": 5.37686,
		    "Cloud": 91.8669,
		    "Age": 7.34955
		  },
		  {
		    "Year": 2009,
		    "Doy": 248,
		    "SCF": 1.07347,
		    "Cloud": 99.4311,
		    "Age": 8.29211
		  },
		  {
		    "Year": 2009,
		    "Doy": 249,
		    "SCF": 1.02807,
		    "Cloud": 27.5272,
		    "Age": 2.86506
		  },
		  {
		    "Year": 2009,
		    "Doy": 250,
		    "SCF": 1.15563,
		    "Cloud": 98.9048,
		    "Age": 3.76573
		  },
		  {
		    "Year": 2009,
		    "Doy": 251,
		    "SCF": 0.485045,
		    "Cloud": 100,
		    "Age": 4.76573
		  },
		  {
		    "Year": 2009,
		    "Doy": 252,
		    "SCF": 0.485045,
		    "Cloud": 12.9734,
		    "Age": 1.30907
		  },
		  {
		    "Year": 2009,
		    "Doy": 253,
		    "SCF": 0.674811,
		    "Cloud": 41.3912,
		    "Age": 1.57142
		  },
		  {
		    "Year": 2009,
		    "Doy": 254,
		    "SCF": 1.03779,
		    "Cloud": 71.5002,
		    "Age": 2.27761
		  },
		  {
		    "Year": 2009,
		    "Doy": 255,
		    "SCF": 1.1496,
		    "Cloud": 59.8887,
		    "Age": 2.11621
		  },
		  {
		    "Year": 2009,
		    "Doy": 256,
		    "SCF": 0.358261,
		    "Cloud": 37.0895,
		    "Age": 0.915457
		  },
		  {
		    "Year": 2009,
		    "Doy": 257,
		    "SCF": 0.265287,
		    "Cloud": 7.12838,
		    "Age": 0.196964
		  },
		  {
		    "Year": 2009,
		    "Doy": 258,
		    "SCF": 0.29623,
		    "Cloud": 0.81111,
		    "Age": 0.0873548
		  },
		  {
		    "Year": 2009,
		    "Doy": 259,
		    "SCF": 1.23456,
		    "Cloud": 36.3937,
		    "Age": 0.449525
		  },
		  {
		    "Year": 2009,
		    "Doy": 260,
		    "SCF": 2.09464,
		    "Cloud": 73.5774,
		    "Age": 1.07325
		  },
		  {
		    "Year": 2009,
		    "Doy": 261,
		    "SCF": 0.384686,
		    "Cloud": 87.0619,
		    "Age": 1.84518
		  },
		  {
		    "Year": 2009,
		    "Doy": 262,
		    "SCF": 0.311955,
		    "Cloud": 0.713098,
		    "Age": 0.0861989
		  },
		  {
		    "Year": 2009,
		    "Doy": 263,
		    "SCF": 6.20106,
		    "Cloud": 96.3931,
		    "Age": 1.04734
		  },
		  {
		    "Year": 2009,
		    "Doy": 264,
		    "SCF": 7.0465,
		    "Cloud": 55.7099,
		    "Age": 1.15755
		  },
		  {
		    "Year": 2009,
		    "Doy": 265,
		    "SCF": 7.19394,
		    "Cloud": 51.9983,
		    "Age": 1.17872
		  },
		  {
		    "Year": 2009,
		    "Doy": 266,
		    "SCF": 7.62926,
		    "Cloud": 45.4949,
		    "Age": 1.14009
		  },
		  {
		    "Year": 2009,
		    "Doy": 267,
		    "SCF": 7.72836,
		    "Cloud": 19.559,
		    "Age": 0.61611
		  },
		  {
		    "Year": 2009,
		    "Doy": 268,
		    "SCF": 9.21028,
		    "Cloud": 48.331,
		    "Age": 1.0407
		  },
		  {
		    "Year": 2009,
		    "Doy": 269,
		    "SCF": 9.75904,
		    "Cloud": 59.3334,
		    "Age": 1.48025
		  },
		  {
		    "Year": 2009,
		    "Doy": 270,
		    "SCF": 10.2579,
		    "Cloud": 62.4544,
		    "Age": 1.79352
		  },
		  {
		    "Year": 2009,
		    "Doy": 271,
		    "SCF": 9.89241,
		    "Cloud": 46.2232,
		    "Age": 1.71922
		  },
		  {
		    "Year": 2009,
		    "Doy": 272,
		    "SCF": 10.5723,
		    "Cloud": 26.6581,
		    "Age": 1.14816
		  },
		  {
		    "Year": 2009,
		    "Doy": 273,
		    "SCF": 12.5277,
		    "Cloud": 80.7413,
		    "Age": 1.86285
		  },
		  {
		    "Year": 2009,
		    "Doy": 274,
		    "SCF": 12.5326,
		    "Cloud": 27.7584,
		    "Age": 1.21145
		  },
		  {
		    "Year": 2009,
		    "Doy": 275,
		    "SCF": 13.1648,
		    "Cloud": 12.7025,
		    "Age": 0.780326
		  },
		  {
		    "Year": 2009,
		    "Doy": 276,
		    "SCF": 53.0551,
		    "Cloud": 99.9942,
		    "Age": 1.77899
		  },
		  {
		    "Year": 2009,
		    "Doy": 277,
		    "SCF": 53.0566,
		    "Cloud": 88.5313,
		    "Age": 2.53746
		  },
		  {
		    "Year": 2009,
		    "Doy": 278,
		    "SCF": 52.3912,
		    "Cloud": 22.4091,
		    "Age": 1.25502
		  },
		  {
		    "Year": 2009,
		    "Doy": 279,
		    "SCF": 51.1526,
		    "Cloud": 99.9898,
		    "Age": 2.25544
		  },
		  {
		    "Year": 2009,
		    "Doy": 280,
		    "SCF": 51.1526,
		    "Cloud": 32.9921,
		    "Age": 3.25538
		  },
		  {
		    "Year": 2009,
		    "Doy": 281,
		    "SCF": 51.1526,
		    "Cloud": 92.8478,
		    "Age": 4.25532
		  },
		  {
		    "Year": 2009,
		    "Doy": 282,
		    "SCF": 51.1516,
		    "Cloud": 4.39049,
		    "Age": 0.367279
		  },
		  {
		    "Year": 2009,
		    "Doy": 283,
		    "SCF": 53.5627,
		    "Cloud": 66.001,
		    "Age": 1.00255
		  },
		  {
		    "Year": 2009,
		    "Doy": 284,
		    "SCF": 55.1418,
		    "Cloud": 99.3866,
		    "Age": 1.98757
		  },
		  {
		    "Year": 2009,
		    "Doy": 285,
		    "SCF": 55.0895,
		    "Cloud": 46.7752,
		    "Age": 1.50409
		  },
		  {
		    "Year": 2009,
		    "Doy": 286,
		    "SCF": 54.1906,
		    "Cloud": 1.80358,
		    "Age": 0.11565
		  },
		  {
		    "Year": 2009,
		    "Doy": 287,
		    "SCF": 51.4514,
		    "Cloud": 3.20845,
		    "Age": 0.116321
		  },
		  {
		    "Year": 2009,
		    "Doy": 288,
		    "SCF": 50.4461,
		    "Cloud": 30.5992,
		    "Age": 0.41751
		  },
		  {
		    "Year": 2009,
		    "Doy": 289,
		    "SCF": 48.6066,
		    "Cloud": 28.3032,
		    "Age": 0.476186
		  },
		  {
		    "Year": 2009,
		    "Doy": 290,
		    "SCF": 45.5584,
		    "Cloud": 3.94775,
		    "Age": 0.11212
		  },
		  {
		    "Year": 2009,
		    "Doy": 291,
		    "SCF": 46.9354,
		    "Cloud": 20.0991,
		    "Age": 0.256647
		  },
		  {
		    "Year": 2009,
		    "Doy": 292,
		    "SCF": 47.7204,
		    "Cloud": 41.0429,
		    "Age": 0.562872
		  },
		  {
		    "Year": 2009,
		    "Doy": 293,
		    "SCF": 54.1677,
		    "Cloud": 77.3976,
		    "Age": 1.22296
		  },
		  {
		    "Year": 2009,
		    "Doy": 294,
		    "SCF": 56.4801,
		    "Cloud": 99.78,
		    "Age": 2.21846
		  },
		  {
		    "Year": 2009,
		    "Doy": 295,
		    "SCF": 56.5232,
		    "Cloud": 98.9728,
		    "Age": 3.18099
		  },
		  {
		    "Year": 2009,
		    "Doy": 296,
		    "SCF": 56.5862,
		    "Cloud": 99.984,
		    "Age": 4.18022
		  },
		  {
		    "Year": 2009,
		    "Doy": 297,
		    "SCF": 56.593,
		    "Cloud": 98.2924,
		    "Age": 5.09529
		  },
		  {
		    "Year": 2009,
		    "Doy": 298,
		    "SCF": 56.7021,
		    "Cloud": 92.419,
		    "Age": 5.61846
		  },
		  {
		    "Year": 2009,
		    "Doy": 299,
		    "SCF": 55.9466,
		    "Cloud": 63.4721,
		    "Age": 4.2171
		  },
		  {
		    "Year": 2009,
		    "Doy": 300,
		    "SCF": 53.7574,
		    "Cloud": 19.1,
		    "Age": 0.897209
		  },
		  {
		    "Year": 2009,
		    "Doy": 301,
		    "SCF": 54.1432,
		    "Cloud": 40.4401,
		    "Age": 0.864325
		  },
		  {
		    "Year": 2009,
		    "Doy": 302,
		    "SCF": 54.326,
		    "Cloud": 21.5015,
		    "Age": 0.659905
		  },
		  {
		    "Year": 2009,
		    "Doy": 303,
		    "SCF": 61.1362,
		    "Cloud": 25.3848,
		    "Age": 0.450606
		  },
		  {
		    "Year": 2009,
		    "Doy": 304,
		    "SCF": 67.6639,
		    "Cloud": 45.5192,
		    "Age": 0.878549
		  },
		  {
		    "Year": 2009,
		    "Doy": 305,
		    "SCF": 71.95,
		    "Cloud": 100,
		    "Age": 1.87851
		  },
		  {
		    "Year": 2009,
		    "Doy": 306,
		    "SCF": 71.95,
		    "Cloud": 99.9913,
		    "Age": 2.87831
		  },
		  {
		    "Year": 2009,
		    "Doy": 307,
		    "SCF": 71.9524,
		    "Cloud": 99.7143,
		    "Age": 3.86493
		  },
		  {
		    "Year": 2009,
		    "Doy": 308,
		    "SCF": 71.8689,
		    "Cloud": 99.691,
		    "Age": 4.85203
		  },
		  {
		    "Year": 2009,
		    "Doy": 309,
		    "SCF": 71.9158,
		    "Cloud": 98.9491,
		    "Age": 5.8013
		  },
		  {
		    "Year": 2009,
		    "Doy": 310,
		    "SCF": 72.1068,
		    "Cloud": 98.8281,
		    "Age": 6.69579
		  },
		  {
		    "Year": 2009,
		    "Doy": 311,
		    "SCF": 72.1074,
		    "Cloud": 98.0539,
		    "Age": 7.5504
		  },
		  {
		    "Year": 2009,
		    "Doy": 312,
		    "SCF": 72.1723,
		    "Cloud": 96.8935,
		    "Age": 8.30069
		  },
		  {
		    "Year": 2009,
		    "Doy": 313,
		    "SCF": 72.3632,
		    "Cloud": 74.4107,
		    "Age": 7.12147
		  },
		  {
		    "Year": 2009,
		    "Doy": 314,
		    "SCF": 71.8813,
		    "Cloud": 30.5077,
		    "Age": 2.91886
		  },
		  {
		    "Year": 2009,
		    "Doy": 315,
		    "SCF": 69.9241,
		    "Cloud": 90.6794,
		    "Age": 3.79813
		  },
		  {
		    "Year": 2009,
		    "Doy": 316,
		    "SCF": 70.0214,
		    "Cloud": 78.5506,
		    "Age": 4.40468
		  },
		  {
		    "Year": 2009,
		    "Doy": 317,
		    "SCF": 68.5969,
		    "Cloud": 91.2318,
		    "Age": 4.91125
		  },
		  {
		    "Year": 2009,
		    "Doy": 318,
		    "SCF": 68.6187,
		    "Cloud": 95.3482,
		    "Age": 5.72649
		  },
		  {
		    "Year": 2009,
		    "Doy": 319,
		    "SCF": 68.5051,
		    "Cloud": 99.6765,
		    "Age": 6.71288
		  },
		  {
		    "Year": 2009,
		    "Doy": 320,
		    "SCF": 68.3961,
		    "Cloud": 99.9359,
		    "Age": 7.71113
		  },
		  {
		    "Year": 2009,
		    "Doy": 321,
		    "SCF": 68.3928,
		    "Cloud": 90.6392,
		    "Age": 7.9213
		  },
		  {
		    "Year": 2009,
		    "Doy": 322,
		    "SCF": 67.2277,
		    "Cloud": 54.1061,
		    "Age": 4.8598
		  },
		  {
		    "Year": 2009,
		    "Doy": 323,
		    "SCF": 65.9304,
		    "Cloud": 93.0527,
		    "Age": 5.44871
		  },
		  {
		    "Year": 2009,
		    "Doy": 324,
		    "SCF": 66.3526,
		    "Cloud": 89.8558,
		    "Age": 5.98659
		  },
		  {
		    "Year": 2009,
		    "Doy": 325,
		    "SCF": 67.6384,
		    "Cloud": 30.0838,
		    "Age": 2.64329
		  },
		  {
		    "Year": 2009,
		    "Doy": 326,
		    "SCF": 71.2464,
		    "Cloud": 98.6442,
		    "Age": 3.62525
		  },
		  {
		    "Year": 2009,
		    "Doy": 327,
		    "SCF": 71.3402,
		    "Cloud": 88.8981,
		    "Age": 4.33664
		  },
		  {
		    "Year": 2009,
		    "Doy": 328,
		    "SCF": 72.8478,
		    "Cloud": 31.7063,
		    "Age": 1.58428
		  },
		  {
		    "Year": 2009,
		    "Doy": 329,
		    "SCF": 77.6903,
		    "Cloud": 88.3305,
		    "Age": 2.23342
		  },
		  {
		    "Year": 2009,
		    "Doy": 330,
		    "SCF": 77.5672,
		    "Cloud": 79.5292,
		    "Age": 2.58722
		  },
		  {
		    "Year": 2009,
		    "Doy": 331,
		    "SCF": 77.587,
		    "Cloud": 90.7131,
		    "Age": 3.1503
		  },
		  {
		    "Year": 2009,
		    "Doy": 332,
		    "SCF": 80.8813,
		    "Cloud": 72.3904,
		    "Age": 3.04719
		  },
		  {
		    "Year": 2009,
		    "Doy": 333,
		    "SCF": 83.8864,
		    "Cloud": 78.5655,
		    "Age": 3.34053
		  },
		  {
		    "Year": 2009,
		    "Doy": 334,
		    "SCF": 85.7391,
		    "Cloud": 89.9723,
		    "Age": 3.83613
		  },
		  {
		    "Year": 2009,
		    "Doy": 335,
		    "SCF": 86.7556,
		    "Cloud": 22.3504,
		    "Age": 1.15824
		  },
		  {
		    "Year": 2009,
		    "Doy": 336,
		    "SCF": 80.51,
		    "Cloud": 95.2662,
		    "Age": 2.02485
		  },
		  {
		    "Year": 2009,
		    "Doy": 337,
		    "SCF": 80.4843,
		    "Cloud": 92.8156,
		    "Age": 2.80462
		  },
		  {
		    "Year": 2009,
		    "Doy": 338,
		    "SCF": 80.5441,
		    "Cloud": 97.0988,
		    "Age": 3.67752
		  },
		  {
		    "Year": 2009,
		    "Doy": 339,
		    "SCF": 80.7314,
		    "Cloud": 99.9127,
		    "Age": 4.67417
		  },
		  {
		    "Year": 2009,
		    "Doy": 340,
		    "SCF": 80.7487,
		    "Cloud": 99.4352,
		    "Age": 5.6399
		  },
		  {
		    "Year": 2009,
		    "Doy": 341,
		    "SCF": 80.8098,
		    "Cloud": 83.4406,
		    "Age": 5.57505
		  },
		  {
		    "Year": 2009,
		    "Doy": 342,
		    "SCF": 81.3206,
		    "Cloud": 96.9093,
		    "Age": 6.39068
		  },
		  {
		    "Year": 2009,
		    "Doy": 343,
		    "SCF": 81.5593,
		    "Cloud": 96.151,
		    "Age": 7.13729
		  },
		  {
		    "Year": 2009,
		    "Doy": 344,
		    "SCF": 81.9713,
		    "Cloud": 93.2657,
		    "Age": 7.68222
		  },
		  {
		    "Year": 2009,
		    "Doy": 345,
		    "SCF": 82.6242,
		    "Cloud": 58.8381,
		    "Age": 4.94173
		  },
		  {
		    "Year": 2009,
		    "Doy": 346,
		    "SCF": 82.6724,
		    "Cloud": 95.6149,
		    "Age": 5.76173
		  },
		  {
		    "Year": 2009,
		    "Doy": 347,
		    "SCF": 82.9965,
		    "Cloud": 98.6751,
		    "Age": 6.69031
		  },
		  {
		    "Year": 2009,
		    "Doy": 348,
		    "SCF": 83.1934,
		    "Cloud": 74.2076,
		    "Age": 6.1134
		  },
		  {
		    "Year": 2009,
		    "Doy": 349,
		    "SCF": 83.8083,
		    "Cloud": 88.468,
		    "Age": 6.10261
		  },
		  {
		    "Year": 2009,
		    "Doy": 350,
		    "SCF": 83.8036,
		    "Cloud": 76.8532,
		    "Age": 5.9028
		  },
		  {
		    "Year": 2009,
		    "Doy": 351,
		    "SCF": 86.1028,
		    "Cloud": 49.9177,
		    "Age": 3.1979
		  },
		  {
		    "Year": 2009,
		    "Doy": 352,
		    "SCF": 87.1528,
		    "Cloud": 14.7119,
		    "Age": 1.19475
		  },
		  {
		    "Year": 2009,
		    "Doy": 353,
		    "SCF": 85.4425,
		    "Cloud": 99.9898,
		    "Age": 2.19424
		  },
		  {
		    "Year": 2009,
		    "Doy": 354,
		    "SCF": 85.4425,
		    "Cloud": 74.7529,
		    "Age": 2.75546
		  },
		  {
		    "Year": 2009,
		    "Doy": 355,
		    "SCF": 86.9683,
		    "Cloud": 32.7361,
		    "Age": 1.6768
		  },
		  {
		    "Year": 2009,
		    "Doy": 356,
		    "SCF": 85.0182,
		    "Cloud": 96.1885,
		    "Age": 2.5788
		  },
		  {
		    "Year": 2009,
		    "Doy": 357,
		    "SCF": 85.0894,
		    "Cloud": 91.1932,
		    "Age": 3.18861
		  },
		  {
		    "Year": 2009,
		    "Doy": 358,
		    "SCF": 86.4717,
		    "Cloud": 83.8232,
		    "Age": 3.54509
		  },
		  {
		    "Year": 2009,
		    "Doy": 359,
		    "SCF": 87.9134,
		    "Cloud": 92.6992,
		    "Age": 4.50063
		  },
		  {
		    "Year": 2009,
		    "Doy": 360,
		    "SCF": 88.2751,
		    "Cloud": 97.8505,
		    "Age": 5.38774
		  },
		  {
		    "Year": 2009,
		    "Doy": 361,
		    "SCF": 88.6201,
		    "Cloud": 74.9985,
		    "Age": 5.20937
		  },
		  {
		    "Year": 2009,
		    "Doy": 362,
		    "SCF": 90.0137,
		    "Cloud": 43.873,
		    "Age": 2.8766
		  },
		  {
		    "Year": 2009,
		    "Doy": 363,
		    "SCF": 92.0657,
		    "Cloud": 23.0055,
		    "Age": 1.61474
		  },
		  {
		    "Year": 2009,
		    "Doy": 364,
		    "SCF": 92.1135,
		    "Cloud": 14.5695,
		    "Age": 0.99607
		  },
		  {
		    "Year": 2009,
		    "Doy": 365,
		    "SCF": 88.4402,
		    "Cloud": 38.284,
		    "Age": 1.05662
		  },
		  {
		    "Year": 2010,
		    "Doy": 1,
		    "SCF": 85.5945,
		    "Cloud": 55.6177,
		    "Age": 0.556395
		  },
		  {
		    "Year": 2010,
		    "Doy": 2,
		    "SCF": 88.365,
		    "Cloud": 29.7938,
		    "Age": 0.472985
		  },
		  {
		    "Year": 2010,
		    "Doy": 3,
		    "SCF": 86.7122,
		    "Cloud": 51.4356,
		    "Age": 0.726425
		  },
		  {
		    "Year": 2010,
		    "Doy": 4,
		    "SCF": 85.8999,
		    "Cloud": 61.0996,
		    "Age": 1.09584
		  },
		  {
		    "Year": 2010,
		    "Doy": 5,
		    "SCF": 88.1666,
		    "Cloud": 74.0432,
		    "Age": 1.58595
		  },
		  {
		    "Year": 2010,
		    "Doy": 6,
		    "SCF": 90.0489,
		    "Cloud": 18.6908,
		    "Age": 0.506103
		  },
		  {
		    "Year": 2010,
		    "Doy": 7,
		    "SCF": 89.7608,
		    "Cloud": 30.3951,
		    "Age": 0.678917
		  },
		  {
		    "Year": 2010,
		    "Doy": 8,
		    "SCF": 90.7515,
		    "Cloud": 10.5195,
		    "Age": 0.345274
		  },
		  {
		    "Year": 2010,
		    "Doy": 9,
		    "SCF": 89.5633,
		    "Cloud": 18.5206,
		    "Age": 0.463197
		  },
		  {
		    "Year": 2010,
		    "Doy": 10,
		    "SCF": 90.8032,
		    "Cloud": 9.19066,
		    "Age": 0.312357
		  },
		  {
		    "Year": 2010,
		    "Doy": 11,
		    "SCF": 88.4252,
		    "Cloud": 13.4915,
		    "Age": 0.381183
		  },
		  {
		    "Year": 2010,
		    "Doy": 12,
		    "SCF": 91.0109,
		    "Cloud": 5.99523,
		    "Age": 0.21293
		  },
		  {
		    "Year": 2010,
		    "Doy": 13,
		    "SCF": 90.6747,
		    "Cloud": 30.008,
		    "Age": 0.445092
		  },
		  {
		    "Year": 2010,
		    "Doy": 14,
		    "SCF": 91.0267,
		    "Cloud": 37.6042,
		    "Age": 0.584217
		  },
		  {
		    "Year": 2010,
		    "Doy": 15,
		    "SCF": 92.1192,
		    "Cloud": 55.691,
		    "Age": 1.01952
		  },
		  {
		    "Year": 2010,
		    "Doy": 16,
		    "SCF": 91.8179,
		    "Cloud": 99.5337,
		    "Age": 2.01329
		  },
		  {
		    "Year": 2010,
		    "Doy": 17,
		    "SCF": 91.902,
		    "Cloud": 99.8722,
		    "Age": 3.01039
		  },
		  {
		    "Year": 2010,
		    "Doy": 18,
		    "SCF": 91.9351,
		    "Cloud": 97.9984,
		    "Age": 3.94772
		  },
		  {
		    "Year": 2010,
		    "Doy": 19,
		    "SCF": 92.1447,
		    "Cloud": 28.2311,
		    "Age": 1.48783
		  },
		  {
		    "Year": 2010,
		    "Doy": 20,
		    "SCF": 91.43,
		    "Cloud": 98.7026,
		    "Age": 2.45688
		  },
		  {
		    "Year": 2010,
		    "Doy": 21,
		    "SCF": 91.6394,
		    "Cloud": 99.8286,
		    "Age": 3.45081
		  },
		  {
		    "Year": 2010,
		    "Doy": 22,
		    "SCF": 91.6645,
		    "Cloud": 98.3017,
		    "Age": 4.36304
		  },
		  {
		    "Year": 2010,
		    "Doy": 23,
		    "SCF": 91.8397,
		    "Cloud": 100,
		    "Age": 5.36304
		  },
		  {
		    "Year": 2010,
		    "Doy": 24,
		    "SCF": 91.8397,
		    "Cloud": 98.7913,
		    "Age": 6.29462
		  },
		  {
		    "Year": 2010,
		    "Doy": 25,
		    "SCF": 92.0912,
		    "Cloud": 35.7726,
		    "Age": 2.8818
		  },
		  {
		    "Year": 2010,
		    "Doy": 26,
		    "SCF": 88.0062,
		    "Cloud": 100,
		    "Age": 3.88197
		  },
		  {
		    "Year": 2010,
		    "Doy": 27,
		    "SCF": 88.0062,
		    "Cloud": 43.4097,
		    "Age": 2.80511
		  },
		  {
		    "Year": 2010,
		    "Doy": 28,
		    "SCF": 89.2763,
		    "Cloud": 77.7471,
		    "Age": 2.57831
		  },
		  {
		    "Year": 2010,
		    "Doy": 29,
		    "SCF": 88.2013,
		    "Cloud": 96.0254,
		    "Age": 3.43242
		  },
		  {
		    "Year": 2010,
		    "Doy": 30,
		    "SCF": 88.1967,
		    "Cloud": 97.3658,
		    "Age": 4.36075
		  },
		  {
		    "Year": 2010,
		    "Doy": 31,
		    "SCF": 88.5549,
		    "Cloud": 38.17,
		    "Age": 2.43672
		  },
		  {
		    "Year": 2010,
		    "Doy": 32,
		    "SCF": 92.2395,
		    "Cloud": 27.9686,
		    "Age": 1.78382
		  },
		  {
		    "Year": 2010,
		    "Doy": 33,
		    "SCF": 91.9262,
		    "Cloud": 96.3246,
		    "Age": 2.70197
		  },
		  {
		    "Year": 2010,
		    "Doy": 34,
		    "SCF": 92.47,
		    "Cloud": 99.5774,
		    "Age": 3.66467
		  },
		  {
		    "Year": 2010,
		    "Doy": 35,
		    "SCF": 92.5438,
		    "Cloud": 76.4228,
		    "Age": 3.83771
		  },
		  {
		    "Year": 2010,
		    "Doy": 36,
		    "SCF": 94.4244,
		    "Cloud": 100,
		    "Age": 4.83759
		  },
		  {
		    "Year": 2010,
		    "Doy": 37,
		    "SCF": 94.4253,
		    "Cloud": 92.5402,
		    "Age": 5.35191
		  },
		  {
		    "Year": 2010,
		    "Doy": 38,
		    "SCF": 95.9003,
		    "Cloud": 7.87372,
		    "Age": 0.848654
		  },
		  {
		    "Year": 2010,
		    "Doy": 39,
		    "SCF": 89.2961,
		    "Cloud": 58.4886,
		    "Age": 1.19301
		  },
		  {
		    "Year": 2010,
		    "Doy": 40,
		    "SCF": 85.1057,
		    "Cloud": 71.4143,
		    "Age": 1.50904
		  },
		  {
		    "Year": 2010,
		    "Doy": 41,
		    "SCF": 85.6606,
		    "Cloud": 84.5127,
		    "Age": 2.17452
		  },
		  {
		    "Year": 2010,
		    "Doy": 42,
		    "SCF": 87.0675,
		    "Cloud": 59.0128,
		    "Age": 1.7896
		  },
		  {
		    "Year": 2010,
		    "Doy": 43,
		    "SCF": 90.3222,
		    "Cloud": 38.5679,
		    "Age": 1.20417
		  },
		  {
		    "Year": 2010,
		    "Doy": 44,
		    "SCF": 94.809,
		    "Cloud": 1.79051,
		    "Age": 0.0569391
		  },
		  {
		    "Year": 2010,
		    "Doy": 45,
		    "SCF": 82.8481,
		    "Cloud": 98.1877,
		    "Age": 1.03776
		  },
		  {
		    "Year": 2010,
		    "Doy": 46,
		    "SCF": 82.6674,
		    "Cloud": 98.1107,
		    "Age": 2.00112
		  },
		  {
		    "Year": 2010,
		    "Doy": 47,
		    "SCF": 82.9478,
		    "Cloud": 97.7317,
		    "Age": 2.93388
		  },
		  {
		    "Year": 2010,
		    "Doy": 48,
		    "SCF": 83.0685,
		    "Cloud": 94.4803,
		    "Age": 3.71583
		  },
		  {
		    "Year": 2010,
		    "Doy": 49,
		    "SCF": 83.4023,
		    "Cloud": 96.5381,
		    "Age": 4.59276
		  },
		  {
		    "Year": 2010,
		    "Doy": 50,
		    "SCF": 83.5285,
		    "Cloud": 95.5215,
		    "Age": 5.34447
		  },
		  {
		    "Year": 2010,
		    "Doy": 51,
		    "SCF": 83.8046,
		    "Cloud": 99.438,
		    "Age": 6.30842
		  },
		  {
		    "Year": 2010,
		    "Doy": 52,
		    "SCF": 83.8684,
		    "Cloud": 57.5795,
		    "Age": 4.21803
		  },
		  {
		    "Year": 2010,
		    "Doy": 53,
		    "SCF": 86.528,
		    "Cloud": 64.3873,
		    "Age": 3.79238
		  },
		  {
		    "Year": 2010,
		    "Doy": 54,
		    "SCF": 87.5673,
		    "Cloud": 96.1794,
		    "Age": 4.54507
		  },
		  {
		    "Year": 2010,
		    "Doy": 55,
		    "SCF": 88.0047,
		    "Cloud": 46.1162,
		    "Age": 3.12076
		  },
		  {
		    "Year": 2010,
		    "Doy": 56,
		    "SCF": 88.5717,
		    "Cloud": 99.6094,
		    "Age": 4.09635
		  },
		  {
		    "Year": 2010,
		    "Doy": 57,
		    "SCF": 88.6291,
		    "Cloud": 99.9884,
		    "Age": 5.09615
		  },
		  {
		    "Year": 2010,
		    "Doy": 58,
		    "SCF": 88.632,
		    "Cloud": 88.2854,
		    "Age": 5.33355
		  },
		  {
		    "Year": 2010,
		    "Doy": 59,
		    "SCF": 89.255,
		    "Cloud": 90.0788,
		    "Age": 5.83161
		  },
		  {
		    "Year": 2010,
		    "Doy": 60,
		    "SCF": 89.934,
		    "Cloud": 46.4458,
		    "Age": 3.57539
		  },
		  {
		    "Year": 2010,
		    "Doy": 61,
		    "SCF": 90.756,
		    "Cloud": 10.0562,
		    "Age": 0.251746
		  },
		  {
		    "Year": 2010,
		    "Doy": 62,
		    "SCF": 88.8889,
		    "Cloud": 11.6739,
		    "Age": 0.217214
		  },
		  {
		    "Year": 2010,
		    "Doy": 63,
		    "SCF": 92.5538,
		    "Cloud": 42.3144,
		    "Age": 0.553171
		  },
		  {
		    "Year": 2010,
		    "Doy": 64,
		    "SCF": 92.4641,
		    "Cloud": 97.4834,
		    "Age": 1.50923
		  },
		  {
		    "Year": 2010,
		    "Doy": 65,
		    "SCF": 92.9302,
		    "Cloud": 12.3753,
		    "Age": 0.386899
		  },
		  {
		    "Year": 2010,
		    "Doy": 66,
		    "SCF": 91.4491,
		    "Cloud": 80.0299,
		    "Age": 1.17581
		  },
		  {
		    "Year": 2010,
		    "Doy": 67,
		    "SCF": 93.1236,
		    "Cloud": 36.6351,
		    "Age": 1.02354
		  },
		  {
		    "Year": 2010,
		    "Doy": 68,
		    "SCF": 92.5866,
		    "Cloud": 53.2463,
		    "Age": 1.24623
		  },
		  {
		    "Year": 2010,
		    "Doy": 69,
		    "SCF": 91.7771,
		    "Cloud": 26.4148,
		    "Age": 0.9367
		  },
		  {
		    "Year": 2010,
		    "Doy": 70,
		    "SCF": 90.9085,
		    "Cloud": 96.9025,
		    "Age": 1.84198
		  },
		  {
		    "Year": 2010,
		    "Doy": 71,
		    "SCF": 91.1516,
		    "Cloud": 56.8694,
		    "Age": 1.48784
		  },
		  {
		    "Year": 2010,
		    "Doy": 72,
		    "SCF": 92.2328,
		    "Cloud": 46.0843,
		    "Age": 1.31663
		  },
		  {
		    "Year": 2010,
		    "Doy": 73,
		    "SCF": 91.6428,
		    "Cloud": 41.1818,
		    "Age": 1.24729
		  },
		  {
		    "Year": 2010,
		    "Doy": 74,
		    "SCF": 95.027,
		    "Cloud": 14.95,
		    "Age": 0.582722
		  },
		  {
		    "Year": 2010,
		    "Doy": 75,
		    "SCF": 89.4954,
		    "Cloud": 96.1854,
		    "Age": 1.52936
		  },
		  {
		    "Year": 2010,
		    "Doy": 76,
		    "SCF": 89.526,
		    "Cloud": 94.3639,
		    "Age": 2.39883
		  },
		  {
		    "Year": 2010,
		    "Doy": 77,
		    "SCF": 89.7589,
		    "Cloud": 98.3965,
		    "Age": 3.34985
		  },
		  {
		    "Year": 2010,
		    "Doy": 78,
		    "SCF": 89.826,
		    "Cloud": 94.6792,
		    "Age": 4.12832
		  },
		  {
		    "Year": 2010,
		    "Doy": 79,
		    "SCF": 90.1596,
		    "Cloud": 90.1479,
		    "Age": 4.65095
		  },
		  {
		    "Year": 2010,
		    "Doy": 80,
		    "SCF": 90.1596,
		    "Cloud": 95.9803,
		    "Age": 5.55198
		  },
		  {
		    "Year": 2010,
		    "Doy": 81,
		    "SCF": 90.3105,
		    "Cloud": 59.5455,
		    "Age": 3.97398
		  },
		  {
		    "Year": 2010,
		    "Doy": 82,
		    "SCF": 89.209,
		    "Cloud": 99.9375,
		    "Age": 4.97283
		  },
		  {
		    "Year": 2010,
		    "Doy": 83,
		    "SCF": 89.2188,
		    "Cloud": 94.2983,
		    "Age": 5.61228
		  },
		  {
		    "Year": 2010,
		    "Doy": 84,
		    "SCF": 89.7897,
		    "Cloud": 99.385,
		    "Age": 6.57208
		  },
		  {
		    "Year": 2010,
		    "Doy": 85,
		    "SCF": 89.7039,
		    "Cloud": 99.9753,
		    "Age": 7.5658
		  },
		  {
		    "Year": 2010,
		    "Doy": 86,
		    "SCF": 89.709,
		    "Cloud": 98.3613,
		    "Age": 8.37332
		  },
		  {
		    "Year": 2010,
		    "Doy": 87,
		    "SCF": 89.6887,
		    "Cloud": 96.9217,
		    "Age": 9.18035
		  },
		  {
		    "Year": 2010,
		    "Doy": 88,
		    "SCF": 89.8497,
		    "Cloud": 99.6103,
		    "Age": 10.1483
		  },
		  {
		    "Year": 2010,
		    "Doy": 89,
		    "SCF": 89.9109,
		    "Cloud": 99.2948,
		    "Age": 11.0433
		  },
		  {
		    "Year": 2010,
		    "Doy": 90,
		    "SCF": 89.8312,
		    "Cloud": 96.1598,
		    "Age": 11.5295
		  },
		  {
		    "Year": 2010,
		    "Doy": 91,
		    "SCF": 89.5915,
		    "Cloud": 99.4326,
		    "Age": 12.4662
		  },
		  {
		    "Year": 2010,
		    "Doy": 92,
		    "SCF": 89.612,
		    "Cloud": 98.7736,
		    "Age": 13.2915
		  },
		  {
		    "Year": 2010,
		    "Doy": 93,
		    "SCF": 89.7241,
		    "Cloud": 99.8894,
		    "Age": 14.2812
		  },
		  {
		    "Year": 2010,
		    "Doy": 94,
		    "SCF": 89.7196,
		    "Cloud": 91.2786,
		    "Age": 14.0576
		  },
		  {
		    "Year": 2010,
		    "Doy": 95,
		    "SCF": 89.8803,
		    "Cloud": 83.5133,
		    "Age": 12.0283
		  },
		  {
		    "Year": 2010,
		    "Doy": 96,
		    "SCF": 89.4632,
		    "Cloud": 100,
		    "Age": 13.0322
		  },
		  {
		    "Year": 2010,
		    "Doy": 97,
		    "SCF": 89.4632,
		    "Cloud": 99.8413,
		    "Age": 14.0282
		  },
		  {
		    "Year": 2010,
		    "Doy": 98,
		    "SCF": 89.4885,
		    "Cloud": 99.6754,
		    "Age": 14.967
		  },
		  {
		    "Year": 2010,
		    "Doy": 99,
		    "SCF": 89.4276,
		    "Cloud": 35.8573,
		    "Age": 5.889
		  },
		  {
		    "Year": 2010,
		    "Doy": 100,
		    "SCF": 90.0498,
		    "Cloud": 0.342082,
		    "Age": 0.026202
		  },
		  {
		    "Year": 2010,
		    "Doy": 101,
		    "SCF": 87.2175,
		    "Cloud": 55.7252,
		    "Age": 0.565984
		  },
		  {
		    "Year": 2010,
		    "Doy": 102,
		    "SCF": 87.9525,
		    "Cloud": 0.653443,
		    "Age": 0.0090667
		  },
		  {
		    "Year": 2010,
		    "Doy": 103,
		    "SCF": 80.2024,
		    "Cloud": 0.926384,
		    "Age": 0.0114487
		  },
		  {
		    "Year": 2010,
		    "Doy": 104,
		    "SCF": 81.6926,
		    "Cloud": 33.5014,
		    "Age": 0.340726
		  },
		  {
		    "Year": 2010,
		    "Doy": 105,
		    "SCF": 76.5853,
		    "Cloud": 53.3146,
		    "Age": 0.736188
		  },
		  {
		    "Year": 2010,
		    "Doy": 106,
		    "SCF": 75.2073,
		    "Cloud": 36.715,
		    "Age": 0.672129
		  },
		  {
		    "Year": 2010,
		    "Doy": 107,
		    "SCF": 70.8515,
		    "Cloud": 82.3797,
		    "Age": 1.41595
		  },
		  {
		    "Year": 2010,
		    "Doy": 108,
		    "SCF": 70.148,
		    "Cloud": 80.4842,
		    "Age": 2.01162
		  },
		  {
		    "Year": 2010,
		    "Doy": 109,
		    "SCF": 69.7858,
		    "Cloud": 41.4877,
		    "Age": 1.2721
		  },
		  {
		    "Year": 2010,
		    "Doy": 110,
		    "SCF": 67.069,
		    "Cloud": 86.698,
		    "Age": 2.03576
		  },
		  {
		    "Year": 2010,
		    "Doy": 111,
		    "SCF": 66.4394,
		    "Cloud": 77.6725,
		    "Age": 2.41433
		  },
		  {
		    "Year": 2010,
		    "Doy": 112,
		    "SCF": 65.0684,
		    "Cloud": 17.9968,
		    "Age": 0.717468
		  },
		  {
		    "Year": 2010,
		    "Doy": 113,
		    "SCF": 67.6251,
		    "Cloud": 98.1086,
		    "Age": 1.68848
		  },
		  {
		    "Year": 2010,
		    "Doy": 114,
		    "SCF": 67.5075,
		    "Cloud": 43.5653,
		    "Age": 1.23446
		  },
		  {
		    "Year": 2010,
		    "Doy": 115,
		    "SCF": 64.919,
		    "Cloud": 79.2016,
		    "Age": 1.91194
		  },
		  {
		    "Year": 2010,
		    "Doy": 116,
		    "SCF": 63.9537,
		    "Cloud": 99.9883,
		    "Age": 2.91227
		  },
		  {
		    "Year": 2010,
		    "Doy": 117,
		    "SCF": 63.9537,
		    "Cloud": 92.848,
		    "Age": 3.62746
		  },
		  {
		    "Year": 2010,
		    "Doy": 118,
		    "SCF": 63.7134,
		    "Cloud": 100,
		    "Age": 4.62818
		  },
		  {
		    "Year": 2010,
		    "Doy": 119,
		    "SCF": 63.7134,
		    "Cloud": 69.9896,
		    "Age": 3.98042
		  },
		  {
		    "Year": 2010,
		    "Doy": 120,
		    "SCF": 63.1142,
		    "Cloud": 92.4779,
		    "Age": 4.78958
		  },
		  {
		    "Year": 2010,
		    "Doy": 121,
		    "SCF": 62.5855,
		    "Cloud": 90.8673,
		    "Age": 5.0815
		  },
		  {
		    "Year": 2010,
		    "Doy": 122,
		    "SCF": 62.8342,
		    "Cloud": 26.5988,
		    "Age": 1.46299
		  },
		  {
		    "Year": 2010,
		    "Doy": 123,
		    "SCF": 61.7653,
		    "Cloud": 38.5663,
		    "Age": 1.20784
		  },
		  {
		    "Year": 2010,
		    "Doy": 124,
		    "SCF": 61.0323,
		    "Cloud": 50.6986,
		    "Age": 1.19812
		  },
		  {
		    "Year": 2010,
		    "Doy": 125,
		    "SCF": 61.8897,
		    "Cloud": 19.1417,
		    "Age": 0.340956
		  },
		  {
		    "Year": 2010,
		    "Doy": 126,
		    "SCF": 61.2224,
		    "Cloud": 90.6521,
		    "Age": 1.22494
		  },
		  {
		    "Year": 2010,
		    "Doy": 127,
		    "SCF": 60.8112,
		    "Cloud": 34.9028,
		    "Age": 0.806259
		  },
		  {
		    "Year": 2010,
		    "Doy": 128,
		    "SCF": 57.6018,
		    "Cloud": 4.5956,
		    "Age": 0.0812586
		  },
		  {
		    "Year": 2010,
		    "Doy": 129,
		    "SCF": 55.3671,
		    "Cloud": 83.1618,
		    "Age": 0.896717
		  },
		  {
		    "Year": 2010,
		    "Doy": 130,
		    "SCF": 55.3146,
		    "Cloud": 84.2512,
		    "Age": 1.61911
		  },
		  {
		    "Year": 2010,
		    "Doy": 131,
		    "SCF": 55.2817,
		    "Cloud": 54.791,
		    "Age": 1.38067
		  },
		  {
		    "Year": 2010,
		    "Doy": 132,
		    "SCF": 54.8738,
		    "Cloud": 15.7346,
		    "Age": 0.412116
		  },
		  {
		    "Year": 2010,
		    "Doy": 133,
		    "SCF": 32.9219,
		    "Cloud": 100,
		    "Age": 1.4122
		  },
		  {
		    "Year": 2010,
		    "Doy": 134,
		    "SCF": 32.9219,
		    "Cloud": 86.095,
		    "Age": 2.09757
		  },
		  {
		    "Year": 2010,
		    "Doy": 135,
		    "SCF": 30.2582,
		    "Cloud": 99.9416,
		    "Age": 3.09763
		  },
		  {
		    "Year": 2010,
		    "Doy": 136,
		    "SCF": 30.2582,
		    "Cloud": 97.8389,
		    "Age": 4.01694
		  },
		  {
		    "Year": 2010,
		    "Doy": 137,
		    "SCF": 28.771,
		    "Cloud": 99.8773,
		    "Age": 5.0114
		  },
		  {
		    "Year": 2010,
		    "Doy": 138,
		    "SCF": 28.7709,
		    "Cloud": 86.0053,
		    "Age": 5.09129
		  },
		  {
		    "Year": 2010,
		    "Doy": 139,
		    "SCF": 28.151,
		    "Cloud": 60.3773,
		    "Age": 3.69459
		  },
		  {
		    "Year": 2010,
		    "Doy": 140,
		    "SCF": 26.2353,
		    "Cloud": 54.5777,
		    "Age": 2.35613
		  },
		  {
		    "Year": 2010,
		    "Doy": 141,
		    "SCF": 22.3959,
		    "Cloud": 25.5041,
		    "Age": 1.23898
		  },
		  {
		    "Year": 2010,
		    "Doy": 142,
		    "SCF": 17.5297,
		    "Cloud": 97.8854,
		    "Age": 2.20958
		  },
		  {
		    "Year": 2010,
		    "Doy": 143,
		    "SCF": 17.2868,
		    "Cloud": 60.8107,
		    "Age": 2.01987
		  },
		  {
		    "Year": 2010,
		    "Doy": 144,
		    "SCF": 14.582,
		    "Cloud": 93.8784,
		    "Age": 2.85951
		  },
		  {
		    "Year": 2010,
		    "Doy": 145,
		    "SCF": 14.0589,
		    "Cloud": 94.2547,
		    "Age": 3.65569
		  },
		  {
		    "Year": 2010,
		    "Doy": 146,
		    "SCF": 13.3746,
		    "Cloud": 94.3076,
		    "Age": 4.40894
		  },
		  {
		    "Year": 2010,
		    "Doy": 147,
		    "SCF": 13.3053,
		    "Cloud": 76.6279,
		    "Age": 4.22007
		  },
		  {
		    "Year": 2010,
		    "Doy": 148,
		    "SCF": 12.9124,
		    "Cloud": 86.1231,
		    "Age": 4.55146
		  },
		  {
		    "Year": 2010,
		    "Doy": 149,
		    "SCF": 12.1913,
		    "Cloud": 70.1573,
		    "Age": 4.12293
		  },
		  {
		    "Year": 2010,
		    "Doy": 150,
		    "SCF": 10.3346,
		    "Cloud": 56.1024,
		    "Age": 3.12697
		  },
		  {
		    "Year": 2010,
		    "Doy": 151,
		    "SCF": 9.72119,
		    "Cloud": 28.7053,
		    "Age": 1.42521
		  },
		  {
		    "Year": 2010,
		    "Doy": 152,
		    "SCF": 8.43625,
		    "Cloud": 75.913,
		    "Age": 1.97207
		  },
		  {
		    "Year": 2010,
		    "Doy": 153,
		    "SCF": 7.44046,
		    "Cloud": 82.2005,
		    "Age": 2.56419
		  },
		  {
		    "Year": 2010,
		    "Doy": 154,
		    "SCF": 7.39413,
		    "Cloud": 29.0188,
		    "Age": 1.24609
		  },
		  {
		    "Year": 2010,
		    "Doy": 155,
		    "SCF": 7.23008,
		    "Cloud": 6.39516,
		    "Age": 0.339274
		  },
		  {
		    "Year": 2010,
		    "Doy": 156,
		    "SCF": 6.08963,
		    "Cloud": 14.699,
		    "Age": 0.3213
		  },
		  {
		    "Year": 2010,
		    "Doy": 157,
		    "SCF": 5.86482,
		    "Cloud": 9.54072,
		    "Age": 0.265874
		  },
		  {
		    "Year": 2010,
		    "Doy": 158,
		    "SCF": 5.11098,
		    "Cloud": 80.8551,
		    "Age": 1.06051
		  },
		  {
		    "Year": 2010,
		    "Doy": 159,
		    "SCF": 4.98824,
		    "Cloud": 96.9122,
		    "Age": 2.0228
		  },
		  {
		    "Year": 2010,
		    "Doy": 160,
		    "SCF": 4.34407,
		    "Cloud": 96.4156,
		    "Age": 2.92805
		  },
		  {
		    "Year": 2010,
		    "Doy": 161,
		    "SCF": 4.05656,
		    "Cloud": 88.9588,
		    "Age": 3.48013
		  },
		  {
		    "Year": 2010,
		    "Doy": 162,
		    "SCF": 4.1627,
		    "Cloud": 98.4772,
		    "Age": 4.41798
		  },
		  {
		    "Year": 2010,
		    "Doy": 163,
		    "SCF": 4.05234,
		    "Cloud": 99.9372,
		    "Age": 5.41438
		  },
		  {
		    "Year": 2010,
		    "Doy": 164,
		    "SCF": 4.00349,
		    "Cloud": 94.0121,
		    "Age": 5.99882
		  },
		  {
		    "Year": 2010,
		    "Doy": 165,
		    "SCF": 3.82406,
		    "Cloud": 80.5922,
		    "Age": 5.71853
		  },
		  {
		    "Year": 2010,
		    "Doy": 166,
		    "SCF": 3.20075,
		    "Cloud": 4.9149,
		    "Age": 0.414157
		  },
		  {
		    "Year": 2010,
		    "Doy": 167,
		    "SCF": 2.55323,
		    "Cloud": 16.1413,
		    "Age": 0.475485
		  },
		  {
		    "Year": 2010,
		    "Doy": 168,
		    "SCF": 2.51504,
		    "Cloud": 33.4303,
		    "Age": 0.664762
		  },
		  {
		    "Year": 2010,
		    "Doy": 169,
		    "SCF": 2.57814,
		    "Cloud": 90.1272,
		    "Age": 1.55595
		  },
		  {
		    "Year": 2010,
		    "Doy": 170,
		    "SCF": 2.27579,
		    "Cloud": 80.3714,
		    "Age": 2.11862
		  },
		  {
		    "Year": 2010,
		    "Doy": 171,
		    "SCF": 1.58134,
		    "Cloud": 18.8511,
		    "Age": 0.700384
		  },
		  {
		    "Year": 2010,
		    "Doy": 172,
		    "SCF": 1.18181,
		    "Cloud": 22.6954,
		    "Age": 0.56805
		  },
		  {
		    "Year": 2010,
		    "Doy": 173,
		    "SCF": 1.37499,
		    "Cloud": 71.4964,
		    "Age": 1.22369
		  },
		  {
		    "Year": 2010,
		    "Doy": 174,
		    "SCF": 1.07844,
		    "Cloud": 13.9726,
		    "Age": 0.307948
		  },
		  {
		    "Year": 2010,
		    "Doy": 175,
		    "SCF": 1.41175,
		    "Cloud": 94.7011,
		    "Age": 1.21721
		  },
		  {
		    "Year": 2010,
		    "Doy": 176,
		    "SCF": 0.937181,
		    "Cloud": 73.9144,
		    "Age": 1.64784
		  },
		  {
		    "Year": 2010,
		    "Doy": 177,
		    "SCF": 0.70115,
		    "Cloud": 55.4989,
		    "Age": 1.51627
		  },
		  {
		    "Year": 2010,
		    "Doy": 178,
		    "SCF": 0.645885,
		    "Cloud": 25.16,
		    "Age": 0.593094
		  },
		  {
		    "Year": 2010,
		    "Doy": 179,
		    "SCF": 0.61032,
		    "Cloud": 30.4634,
		    "Age": 0.684553
		  },
		  {
		    "Year": 2010,
		    "Doy": 180,
		    "SCF": 1.05518,
		    "Cloud": 81.1951,
		    "Age": 1.45257
		  },
		  {
		    "Year": 2010,
		    "Doy": 181,
		    "SCF": 0.575754,
		    "Cloud": 99.4827,
		    "Age": 2.43957
		  },
		  {
		    "Year": 2010,
		    "Doy": 182,
		    "SCF": 0.382823,
		    "Cloud": 7.47235,
		    "Age": 0.262876
		  },
		  {
		    "Year": 2010,
		    "Doy": 183,
		    "SCF": 0.345386,
		    "Cloud": 26.5923,
		    "Age": 0.392768
		  },
		  {
		    "Year": 2010,
		    "Doy": 184,
		    "SCF": 0.373931,
		    "Cloud": 82.3438,
		    "Age": 1.16901
		  },
		  {
		    "Year": 2010,
		    "Doy": 185,
		    "SCF": 0.383063,
		    "Cloud": 9.96888,
		    "Age": 0.260669
		  },
		  {
		    "Year": 2010,
		    "Doy": 186,
		    "SCF": 0.585148,
		    "Cloud": 74.8302,
		    "Age": 0.963878
		  },
		  {
		    "Year": 2010,
		    "Doy": 187,
		    "SCF": 0.475959,
		    "Cloud": 47.9935,
		    "Age": 1.04577
		  },
		  {
		    "Year": 2010,
		    "Doy": 188,
		    "SCF": 0.451719,
		    "Cloud": 88.2695,
		    "Age": 1.86467
		  },
		  {
		    "Year": 2010,
		    "Doy": 189,
		    "SCF": 0.447465,
		    "Cloud": 78.473,
		    "Age": 2.23624
		  },
		  {
		    "Year": 2010,
		    "Doy": 190,
		    "SCF": 0.253248,
		    "Cloud": 21.247,
		    "Age": 0.60131
		  },
		  {
		    "Year": 2010,
		    "Doy": 191,
		    "SCF": 0.318499,
		    "Cloud": 53.2679,
		    "Age": 0.75874
		  },
		  {
		    "Year": 2010,
		    "Doy": 192,
		    "SCF": 0.254301,
		    "Cloud": 99.2837,
		    "Age": 1.7589
		  },
		  {
		    "Year": 2010,
		    "Doy": 193,
		    "SCF": 0.254301,
		    "Cloud": 33.5355,
		    "Age": 0.952829
		  },
		  {
		    "Year": 2010,
		    "Doy": 194,
		    "SCF": 0.608726,
		    "Cloud": 99.8261,
		    "Age": 1.95013
		  },
		  {
		    "Year": 2010,
		    "Doy": 195,
		    "SCF": 0.507681,
		    "Cloud": 15.8669,
		    "Age": 0.421959
		  },
		  {
		    "Year": 2010,
		    "Doy": 196,
		    "SCF": 0.793529,
		    "Cloud": 99.6273,
		    "Age": 1.4123
		  },
		  {
		    "Year": 2010,
		    "Doy": 197,
		    "SCF": 0.439351,
		    "Cloud": 86.5241,
		    "Age": 2.12581
		  },
		  {
		    "Year": 2010,
		    "Doy": 198,
		    "SCF": 0.319072,
		    "Cloud": 36.855,
		    "Age": 1.19578
		  },
		  {
		    "Year": 2010,
		    "Doy": 199,
		    "SCF": 0.679612,
		    "Cloud": 73.9235,
		    "Age": 1.70163
		  },
		  {
		    "Year": 2010,
		    "Doy": 200,
		    "SCF": 0.832946,
		    "Cloud": 99.8787,
		    "Age": 2.69843
		  },
		  {
		    "Year": 2010,
		    "Doy": 201,
		    "SCF": 0.833779,
		    "Cloud": 99.8889,
		    "Age": 3.69545
		  },
		  {
		    "Year": 2010,
		    "Doy": 202,
		    "SCF": 0.795586,
		    "Cloud": 96.9919,
		    "Age": 4.60127
		  },
		  {
		    "Year": 2010,
		    "Doy": 203,
		    "SCF": 0.276624,
		    "Cloud": 44.2235,
		    "Age": 2.28232
		  },
		  {
		    "Year": 2010,
		    "Doy": 204,
		    "SCF": 0.189549,
		    "Cloud": 1.26727,
		    "Age": 0.0415698
		  },
		  {
		    "Year": 2010,
		    "Doy": 205,
		    "SCF": 0.311075,
		    "Cloud": 57.4904,
		    "Age": 0.592621
		  },
		  {
		    "Year": 2010,
		    "Doy": 206,
		    "SCF": 0.543673,
		    "Cloud": 78.7291,
		    "Age": 1.29789
		  },
		  {
		    "Year": 2010,
		    "Doy": 207,
		    "SCF": 0.201353,
		    "Cloud": 99.9971,
		    "Age": 2.29736
		  },
		  {
		    "Year": 2010,
		    "Doy": 208,
		    "SCF": 0.201353,
		    "Cloud": 12.0692,
		    "Age": 0.356172
		  },
		  {
		    "Year": 2010,
		    "Doy": 209,
		    "SCF": 0.364141,
		    "Cloud": 44.5374,
		    "Age": 0.675198
		  },
		  {
		    "Year": 2010,
		    "Doy": 210,
		    "SCF": 0.797392,
		    "Cloud": 100,
		    "Age": 1.67518
		  },
		  {
		    "Year": 2010,
		    "Doy": 211,
		    "SCF": 0.797392,
		    "Cloud": 96.8045,
		    "Age": 2.6069
		  },
		  {
		    "Year": 2010,
		    "Doy": 212,
		    "SCF": 0.805605,
		    "Cloud": 84.4525,
		    "Age": 3.05269
		  },
		  {
		    "Year": 2010,
		    "Doy": 213,
		    "SCF": 0.998642,
		    "Cloud": 84.7295,
		    "Age": 3.48965
		  },
		  {
		    "Year": 2010,
		    "Doy": 214,
		    "SCF": 0.69013,
		    "Cloud": 78.5834,
		    "Age": 3.46012
		  },
		  {
		    "Year": 2010,
		    "Doy": 215,
		    "SCF": 0.768223,
		    "Cloud": 86.1886,
		    "Age": 3.84824
		  },
		  {
		    "Year": 2010,
		    "Doy": 216,
		    "SCF": 0.674329,
		    "Cloud": 44.4764,
		    "Age": 2.18228
		  },
		  {
		    "Year": 2010,
		    "Doy": 217,
		    "SCF": 0.444552,
		    "Cloud": 99.8173,
		    "Age": 3.17369
		  },
		  {
		    "Year": 2010,
		    "Doy": 218,
		    "SCF": 0.406418,
		    "Cloud": 98.5986,
		    "Age": 4.08907
		  },
		  {
		    "Year": 2010,
		    "Doy": 219,
		    "SCF": 0.375073,
		    "Cloud": 70.6804,
		    "Age": 3.91472
		  },
		  {
		    "Year": 2010,
		    "Doy": 220,
		    "SCF": 0.279592,
		    "Cloud": 17.9122,
		    "Age": 1.12876
		  },
		  {
		    "Year": 2010,
		    "Doy": 221,
		    "SCF": 1.14114,
		    "Cloud": 75.3884,
		    "Age": 1.45276
		  },
		  {
		    "Year": 2010,
		    "Doy": 222,
		    "SCF": 1.10413,
		    "Cloud": 76.5431,
		    "Age": 1.93077
		  },
		  {
		    "Year": 2010,
		    "Doy": 223,
		    "SCF": 1.17491,
		    "Cloud": 89.8889,
		    "Age": 2.70398
		  },
		  {
		    "Year": 2010,
		    "Doy": 224,
		    "SCF": 0.561109,
		    "Cloud": 47.8121,
		    "Age": 1.85685
		  },
		  {
		    "Year": 2010,
		    "Doy": 225,
		    "SCF": 0.881862,
		    "Cloud": 99.8218,
		    "Age": 2.85588
		  },
		  {
		    "Year": 2010,
		    "Doy": 226,
		    "SCF": 0.876385,
		    "Cloud": 28.3415,
		    "Age": 1.21065
		  },
		  {
		    "Year": 2010,
		    "Doy": 227,
		    "SCF": 1.21492,
		    "Cloud": 56.2572,
		    "Age": 1.27964
		  },
		  {
		    "Year": 2010,
		    "Doy": 228,
		    "SCF": 1.73406,
		    "Cloud": 92.8955,
		    "Age": 2.12489
		  },
		  {
		    "Year": 2010,
		    "Doy": 229,
		    "SCF": 1.84336,
		    "Cloud": 99.9606,
		    "Age": 3.12491
		  },
		  {
		    "Year": 2010,
		    "Doy": 230,
		    "SCF": 1.84336,
		    "Cloud": 99.8335,
		    "Age": 4.11868
		  },
		  {
		    "Year": 2010,
		    "Doy": 231,
		    "SCF": 1.85558,
		    "Cloud": 99.6451,
		    "Age": 5.10571
		  },
		  {
		    "Year": 2010,
		    "Doy": 232,
		    "SCF": 1.85626,
		    "Cloud": 74.7897,
		    "Age": 4.6967
		  },
		  {
		    "Year": 2010,
		    "Doy": 233,
		    "SCF": 2.01768,
		    "Cloud": 45.7837,
		    "Age": 2.58126
		  },
		  {
		    "Year": 2010,
		    "Doy": 234,
		    "SCF": 3.62979,
		    "Cloud": 72.0325,
		    "Age": 2.58038
		  },
		  {
		    "Year": 2010,
		    "Doy": 235,
		    "SCF": 4.66877,
		    "Cloud": 77.6913,
		    "Age": 2.88414
		  },
		  {
		    "Year": 2010,
		    "Doy": 236,
		    "SCF": 5.61257,
		    "Cloud": 99.108,
		    "Age": 3.84804
		  },
		  {
		    "Year": 2010,
		    "Doy": 237,
		    "SCF": 5.19061,
		    "Cloud": 83.0705,
		    "Age": 4.11747
		  },
		  {
		    "Year": 2010,
		    "Doy": 238,
		    "SCF": 5.96747,
		    "Cloud": 99.8831,
		    "Age": 5.10776
		  },
		  {
		    "Year": 2010,
		    "Doy": 239,
		    "SCF": 5.90377,
		    "Cloud": 52.9021,
		    "Age": 3.0993
		  },
		  {
		    "Year": 2010,
		    "Doy": 240,
		    "SCF": 2.73776,
		    "Cloud": 90.0085,
		    "Age": 3.6068
		  },
		  {
		    "Year": 2010,
		    "Doy": 241,
		    "SCF": 2.99383,
		    "Cloud": 91.5285,
		    "Age": 4.24637
		  },
		  {
		    "Year": 2010,
		    "Doy": 242,
		    "SCF": 1.30538,
		    "Cloud": 23.2794,
		    "Age": 1.32057
		  },
		  {
		    "Year": 2010,
		    "Doy": 243,
		    "SCF": 0.700681,
		    "Cloud": 98.0524,
		    "Age": 2.27155
		  },
		  {
		    "Year": 2010,
		    "Doy": 244,
		    "SCF": 0.568941,
		    "Cloud": 80.1591,
		    "Age": 2.73467
		  },
		  {
		    "Year": 2010,
		    "Doy": 245,
		    "SCF": 0.271471,
		    "Cloud": 7.42609,
		    "Age": 0.287437
		  },
		  {
		    "Year": 2010,
		    "Doy": 246,
		    "SCF": 0.321385,
		    "Cloud": 64.7093,
		    "Age": 0.802235
		  },
		  {
		    "Year": 2010,
		    "Doy": 247,
		    "SCF": 0.247713,
		    "Cloud": 2.77461,
		    "Age": 0.0505245
		  },
		  {
		    "Year": 2010,
		    "Doy": 248,
		    "SCF": 0.359028,
		    "Cloud": 50.5659,
		    "Age": 0.545968
		  },
		  {
		    "Year": 2010,
		    "Doy": 249,
		    "SCF": 0.619793,
		    "Cloud": 28.5184,
		    "Age": 0.500431
		  },
		  {
		    "Year": 2010,
		    "Doy": 250,
		    "SCF": 1.7862,
		    "Cloud": 87.364,
		    "Age": 1.21234
		  },
		  {
		    "Year": 2010,
		    "Doy": 251,
		    "SCF": 1.78403,
		    "Cloud": 96.131,
		    "Age": 2.12885
		  },
		  {
		    "Year": 2010,
		    "Doy": 252,
		    "SCF": 1.82577,
		    "Cloud": 99.483,
		    "Age": 3.11452
		  },
		  {
		    "Year": 2010,
		    "Doy": 253,
		    "SCF": 1.82251,
		    "Cloud": 88.1943,
		    "Age": 3.61633
		  },
		  {
		    "Year": 2010,
		    "Doy": 254,
		    "SCF": 1.83939,
		    "Cloud": 99.9985,
		    "Age": 4.61789
		  },
		  {
		    "Year": 2010,
		    "Doy": 255,
		    "SCF": 1.83939,
		    "Cloud": 46.2689,
		    "Age": 2.72177
		  },
		  {
		    "Year": 2010,
		    "Doy": 256,
		    "SCF": 1.05927,
		    "Cloud": 31.0861,
		    "Age": 1.52973
		  },
		  {
		    "Year": 2010,
		    "Doy": 257,
		    "SCF": 1.9585,
		    "Cloud": 35.9483,
		    "Age": 1.01176
		  },
		  {
		    "Year": 2010,
		    "Doy": 258,
		    "SCF": 3.26983,
		    "Cloud": 47.4915,
		    "Age": 0.968432
		  },
		  {
		    "Year": 2010,
		    "Doy": 259,
		    "SCF": 3.64803,
		    "Cloud": 90.666,
		    "Age": 1.80492
		  },
		  {
		    "Year": 2010,
		    "Doy": 260,
		    "SCF": 3.38352,
		    "Cloud": 62.39,
		    "Age": 1.77961
		  },
		  {
		    "Year": 2010,
		    "Doy": 261,
		    "SCF": 3.51864,
		    "Cloud": 81.2886,
		    "Age": 2.38107
		  },
		  {
		    "Year": 2010,
		    "Doy": 262,
		    "SCF": 3.68749,
		    "Cloud": 56.2848,
		    "Age": 2.05487
		  },
		  {
		    "Year": 2010,
		    "Doy": 263,
		    "SCF": 4.6536,
		    "Cloud": 79.5041,
		    "Age": 2.43667
		  },
		  {
		    "Year": 2010,
		    "Doy": 264,
		    "SCF": 2.29157,
		    "Cloud": 7.12345,
		    "Age": 0.41572
		  },
		  {
		    "Year": 2010,
		    "Doy": 265,
		    "SCF": 14.1686,
		    "Cloud": 89.897,
		    "Age": 1.26139
		  },
		  {
		    "Year": 2010,
		    "Doy": 266,
		    "SCF": 15.8954,
		    "Cloud": 99.1283,
		    "Age": 2.24478
		  },
		  {
		    "Year": 2010,
		    "Doy": 267,
		    "SCF": 15.5164,
		    "Cloud": 99.9138,
		    "Age": 3.24352
		  },
		  {
		    "Year": 2010,
		    "Doy": 268,
		    "SCF": 15.4453,
		    "Cloud": 85.8804,
		    "Age": 3.58917
		  },
		  {
		    "Year": 2010,
		    "Doy": 269,
		    "SCF": 13.96,
		    "Cloud": 15.24,
		    "Age": 0.787859
		  },
		  {
		    "Year": 2010,
		    "Doy": 270,
		    "SCF": 8.30241,
		    "Cloud": 5.70138,
		    "Age": 0.207627
		  },
		  {
		    "Year": 2010,
		    "Doy": 271,
		    "SCF": 6.73283,
		    "Cloud": 2.86846,
		    "Age": 0.118891
		  },
		  {
		    "Year": 2010,
		    "Doy": 272,
		    "SCF": 4.28298,
		    "Cloud": 3.8484,
		    "Age": 0.103369
		  },
		  {
		    "Year": 2010,
		    "Doy": 273,
		    "SCF": 3.32422,
		    "Cloud": 2.71534,
		    "Age": 0.0824833
		  },
		  {
		    "Year": 2010,
		    "Doy": 274,
		    "SCF": 3.21714,
		    "Cloud": 99.8217,
		    "Age": 1.08066
		  },
		  {
		    "Year": 2010,
		    "Doy": 275,
		    "SCF": 3.24098,
		    "Cloud": 99.9299,
		    "Age": 2.07917
		  },
		  {
		    "Year": 2010,
		    "Doy": 276,
		    "SCF": 3.22304,
		    "Cloud": 99.7311,
		    "Age": 3.07043
		  },
		  {
		    "Year": 2010,
		    "Doy": 277,
		    "SCF": 3.00799,
		    "Cloud": 99.9503,
		    "Age": 4.06839
		  },
		  {
		    "Year": 2010,
		    "Doy": 278,
		    "SCF": 2.97136,
		    "Cloud": 96.5018,
		    "Age": 4.89034
		  },
		  {
		    "Year": 2010,
		    "Doy": 279,
		    "SCF": 0.562321,
		    "Cloud": 99.9752,
		    "Age": 5.88858
		  },
		  {
		    "Year": 2010,
		    "Doy": 280,
		    "SCF": 0.541016,
		    "Cloud": 14.5143,
		    "Age": 1.01214
		  },
		  {
		    "Year": 2010,
		    "Doy": 281,
		    "SCF": 1.39174,
		    "Cloud": 29.7005,
		    "Age": 0.388736
		  },
		  {
		    "Year": 2010,
		    "Doy": 282,
		    "SCF": 1.39201,
		    "Cloud": 45.9566,
		    "Age": 0.801427
		  },
		  {
		    "Year": 2010,
		    "Doy": 283,
		    "SCF": 1.43451,
		    "Cloud": 87.2439,
		    "Age": 1.49396
		  },
		  {
		    "Year": 2010,
		    "Doy": 284,
		    "SCF": 1.24297,
		    "Cloud": 21.8478,
		    "Age": 0.719477
		  },
		  {
		    "Year": 2010,
		    "Doy": 285,
		    "SCF": 2.29147,
		    "Cloud": 21.3697,
		    "Age": 0.423952
		  },
		  {
		    "Year": 2010,
		    "Doy": 286,
		    "SCF": 8.48602,
		    "Cloud": 88.6487,
		    "Age": 1.23668
		  },
		  {
		    "Year": 2010,
		    "Doy": 287,
		    "SCF": 2.42956,
		    "Cloud": 30.9514,
		    "Age": 0.664471
		  },
		  {
		    "Year": 2010,
		    "Doy": 288,
		    "SCF": 2.42819,
		    "Cloud": 5.27353,
		    "Age": 0.16355
		  },
		  {
		    "Year": 2010,
		    "Doy": 289,
		    "SCF": 3.1935,
		    "Cloud": 9.51504,
		    "Age": 0.166382
		  },
		  {
		    "Year": 2010,
		    "Doy": 290,
		    "SCF": 11.9092,
		    "Cloud": 39.3477,
		    "Age": 0.501277
		  },
		  {
		    "Year": 2010,
		    "Doy": 291,
		    "SCF": 16.6906,
		    "Cloud": 80.3394,
		    "Age": 1.17914
		  },
		  {
		    "Year": 2010,
		    "Doy": 292,
		    "SCF": 15.0687,
		    "Cloud": 73.4967,
		    "Age": 1.64058
		  },
		  {
		    "Year": 2010,
		    "Doy": 293,
		    "SCF": 15.0931,
		    "Cloud": 10.9044,
		    "Age": 0.362168
		  },
		  {
		    "Year": 2010,
		    "Doy": 294,
		    "SCF": 19.6548,
		    "Cloud": 36.3104,
		    "Age": 0.664733
		  },
		  {
		    "Year": 2010,
		    "Doy": 295,
		    "SCF": 26.444,
		    "Cloud": 87.908,
		    "Age": 1.46555
		  },
		  {
		    "Year": 2010,
		    "Doy": 296,
		    "SCF": 25.2112,
		    "Cloud": 8.24397,
		    "Age": 0.262527
		  },
		  {
		    "Year": 2010,
		    "Doy": 297,
		    "SCF": 23.0998,
		    "Cloud": 7.57155,
		    "Age": 0.201387
		  },
		  {
		    "Year": 2010,
		    "Doy": 298,
		    "SCF": 25.4985,
		    "Cloud": 28.697,
		    "Age": 0.386802
		  },
		  {
		    "Year": 2010,
		    "Doy": 299,
		    "SCF": 25.4985,
		    "Cloud": 99.8482,
		    "Age": 0.674633
		  },
		  {
		    "Year": 2010,
		    "Doy": 300,
		    "SCF": 28.8063,
		    "Cloud": 97.5224,
		    "Age": 1.6347
		  },
		  {
		    "Year": 2010,
		    "Doy": 301,
		    "SCF": 28.1681,
		    "Cloud": 97.7896,
		    "Age": 2.57374
		  },
		  {
		    "Year": 2010,
		    "Doy": 302,
		    "SCF": 27.4521,
		    "Cloud": 100,
		    "Age": 3.57374
		  },
		  {
		    "Year": 2010,
		    "Doy": 303,
		    "SCF": 27.4521,
		    "Cloud": 99.8803,
		    "Age": 4.56852
		  },
		  {
		    "Year": 2010,
		    "Doy": 304,
		    "SCF": 27.3842,
		    "Cloud": 54.4544,
		    "Age": 3.12611
		  },
		  {
		    "Year": 2010,
		    "Doy": 305,
		    "SCF": 24.8125,
		    "Cloud": 24.6999,
		    "Age": 1.16619
		  },
		  {
		    "Year": 2010,
		    "Doy": 306,
		    "SCF": 34.1053,
		    "Cloud": 98.8944,
		    "Age": 2.11732
		  },
		  {
		    "Year": 2010,
		    "Doy": 307,
		    "SCF": 34.2737,
		    "Cloud": 78.2252,
		    "Age": 2.28524
		  },
		  {
		    "Year": 2010,
		    "Doy": 308,
		    "SCF": 30.1243,
		    "Cloud": 16.5596,
		    "Age": 0.792334
		  },
		  {
		    "Year": 2010,
		    "Doy": 309,
		    "SCF": 30.715,
		    "Cloud": 26.6401,
		    "Age": 0.830763
		  },
		  {
		    "Year": 2010,
		    "Doy": 310,
		    "SCF": 29.6768,
		    "Cloud": 21.1122,
		    "Age": 0.716512
		  },
		  {
		    "Year": 2010,
		    "Doy": 311,
		    "SCF": 34.527,
		    "Cloud": 25.3734,
		    "Age": 0.828172
		  },
		  {
		    "Year": 2010,
		    "Doy": 312,
		    "SCF": 38.175,
		    "Cloud": 45.4257,
		    "Age": 1.26292
		  },
		  {
		    "Year": 2010,
		    "Doy": 313,
		    "SCF": 61.4741,
		    "Cloud": 55.7024,
		    "Age": 1.11097
		  },
		  {
		    "Year": 2010,
		    "Doy": 314,
		    "SCF": 68.3444,
		    "Cloud": 81.5268,
		    "Age": 1.71426
		  },
		  {
		    "Year": 2010,
		    "Doy": 315,
		    "SCF": 69.1501,
		    "Cloud": 22.6603,
		    "Age": 0.869071
		  },
		  {
		    "Year": 2010,
		    "Doy": 316,
		    "SCF": 84.1591,
		    "Cloud": 89.7447,
		    "Age": 1.66737
		  },
		  {
		    "Year": 2010,
		    "Doy": 317,
		    "SCF": 85.2925,
		    "Cloud": 95.4791,
		    "Age": 2.5432
		  },
		  {
		    "Year": 2010,
		    "Doy": 318,
		    "SCF": 85.7935,
		    "Cloud": 66.109,
		    "Age": 2.46974
		  },
		  {
		    "Year": 2010,
		    "Doy": 319,
		    "SCF": 86.1003,
		    "Cloud": 54.0178,
		    "Age": 1.80664
		  },
		  {
		    "Year": 2010,
		    "Doy": 320,
		    "SCF": 85.374,
		    "Cloud": 64.7777,
		    "Age": 1.88232
		  },
		  {
		    "Year": 2010,
		    "Doy": 321,
		    "SCF": 85.0098,
		    "Cloud": 50.5252,
		    "Age": 1.4345
		  },
		  {
		    "Year": 2010,
		    "Doy": 322,
		    "SCF": 84.5833,
		    "Cloud": 84.8329,
		    "Age": 2.11467
		  },
		  {
		    "Year": 2010,
		    "Doy": 323,
		    "SCF": 86.1358,
		    "Cloud": 30.2876,
		    "Age": 1.2332
		  },
		  {
		    "Year": 2010,
		    "Doy": 324,
		    "SCF": 76.0455,
		    "Cloud": 89.0327,
		    "Age": 2.08801
		  },
		  {
		    "Year": 2010,
		    "Doy": 325,
		    "SCF": 76.6134,
		    "Cloud": 100,
		    "Age": 3.08801
		  },
		  {
		    "Year": 2010,
		    "Doy": 326,
		    "SCF": 76.6134,
		    "Cloud": 87.6688,
		    "Age": 3.65102
		  },
		  {
		    "Year": 2010,
		    "Doy": 327,
		    "SCF": 77.2308,
		    "Cloud": 94.9984,
		    "Age": 4.40711
		  },
		  {
		    "Year": 2010,
		    "Doy": 328,
		    "SCF": 77.2332,
		    "Cloud": 69.7028,
		    "Age": 3.91802
		  },
		  {
		    "Year": 2010,
		    "Doy": 329,
		    "SCF": 77.0619,
		    "Cloud": 31.3063,
		    "Age": 1.54182
		  },
		  {
		    "Year": 2010,
		    "Doy": 330,
		    "SCF": 77.9088,
		    "Cloud": 45.5352,
		    "Age": 1.3513
		  },
		  {
		    "Year": 2010,
		    "Doy": 331,
		    "SCF": 77.0255,
		    "Cloud": 88.8891,
		    "Age": 2.13817
		  },
		  {
		    "Year": 2010,
		    "Doy": 332,
		    "SCF": 78.0036,
		    "Cloud": 72.8129,
		    "Age": 2.37535
		  },
		  {
		    "Year": 2010,
		    "Doy": 333,
		    "SCF": 80.2618,
		    "Cloud": 44.6898,
		    "Age": 1.54555
		  },
		  {
		    "Year": 2010,
		    "Doy": 334,
		    "SCF": 83.8372,
		    "Cloud": 16.1512,
		    "Age": 0.717099
		  },
		  {
		    "Year": 2010,
		    "Doy": 335,
		    "SCF": 85.16,
		    "Cloud": 12.4787,
		    "Age": 0.4399
		  },
		  {
		    "Year": 2010,
		    "Doy": 336,
		    "SCF": 84.6798,
		    "Cloud": 15.6911,
		    "Age": 0.463486
		  },
		  {
		    "Year": 2010,
		    "Doy": 337,
		    "SCF": 86.9028,
		    "Cloud": 59.3983,
		    "Age": 0.829461
		  },
		  {
		    "Year": 2010,
		    "Doy": 338,
		    "SCF": 84.7999,
		    "Cloud": 22.3928,
		    "Age": 0.502721
		  },
		  {
		    "Year": 2010,
		    "Doy": 339,
		    "SCF": 82.738,
		    "Cloud": 49.2084,
		    "Age": 0.860806
		  },
		  {
		    "Year": 2010,
		    "Doy": 340,
		    "SCF": 83.7012,
		    "Cloud": 23.2368,
		    "Age": 0.679796
		  },
		  {
		    "Year": 2010,
		    "Doy": 341,
		    "SCF": 85.3521,
		    "Cloud": 16.8967,
		    "Age": 0.594424
		  },
		  {
		    "Year": 2010,
		    "Doy": 342,
		    "SCF": 81.0539,
		    "Cloud": 78.4155,
		    "Age": 1.1737
		  },
		  {
		    "Year": 2010,
		    "Doy": 343,
		    "SCF": 82.5236,
		    "Cloud": 41.6812,
		    "Age": 1.02898
		  },
		  {
		    "Year": 2010,
		    "Doy": 344,
		    "SCF": 80.8826,
		    "Cloud": 77.8623,
		    "Age": 1.57746
		  },
		  {
		    "Year": 2010,
		    "Doy": 345,
		    "SCF": 81.9023,
		    "Cloud": 94.1421,
		    "Age": 2.40963
		  },
		  {
		    "Year": 2010,
		    "Doy": 346,
		    "SCF": 82.2819,
		    "Cloud": 18.7668,
		    "Age": 0.701959
		  },
		  {
		    "Year": 2010,
		    "Doy": 347,
		    "SCF": 79.9791,
		    "Cloud": 83.9303,
		    "Age": 1.45607
		  },
		  {
		    "Year": 2010,
		    "Doy": 348,
		    "SCF": 80.8434,
		    "Cloud": 53.9591,
		    "Age": 1.40113
		  },
		  {
		    "Year": 2010,
		    "Doy": 349,
		    "SCF": 78.7319,
		    "Cloud": 86.0321,
		    "Age": 2.11334
		  },
		  {
		    "Year": 2010,
		    "Doy": 350,
		    "SCF": 78.5774,
		    "Cloud": 96.0251,
		    "Age": 3.01049
		  },
		  {
		    "Year": 2010,
		    "Doy": 351,
		    "SCF": 78.6649,
		    "Cloud": 55.8977,
		    "Age": 2.27514
		  },
		  {
		    "Year": 2010,
		    "Doy": 352,
		    "SCF": 81.5402,
		    "Cloud": 98.1883,
		    "Age": 3.18808
		  },
		  {
		    "Year": 2010,
		    "Doy": 353,
		    "SCF": 81.7633,
		    "Cloud": 93.3912,
		    "Age": 3.83769
		  },
		  {
		    "Year": 2010,
		    "Doy": 354,
		    "SCF": 82.9009,
		    "Cloud": 81.2384,
		    "Age": 4.00411
		  },
		  {
		    "Year": 2010,
		    "Doy": 355,
		    "SCF": 85.3646,
		    "Cloud": 22.8295,
		    "Age": 1.87799
		  },
		  {
		    "Year": 2010,
		    "Doy": 356,
		    "SCF": 84.1448,
		    "Cloud": 77.141,
		    "Age": 2.24395
		  },
		  {
		    "Year": 2010,
		    "Doy": 357,
		    "SCF": 85.4959,
		    "Cloud": 79.6317,
		    "Age": 2.84318
		  },
		  {
		    "Year": 2010,
		    "Doy": 358,
		    "SCF": 86.934,
		    "Cloud": 44.9232,
		    "Age": 1.72012
		  },
		  {
		    "Year": 2010,
		    "Doy": 359,
		    "SCF": 86.8187,
		    "Cloud": 1.27792,
		    "Age": 2.10842
		  },
		  {
		    "Year": 2010,
		    "Doy": 360,
		    "SCF": 81.6158,
		    "Cloud": 45.821,
		    "Age": 1.53058
		  },
		  {
		    "Year": 2010,
		    "Doy": 361,
		    "SCF": 79.8884,
		    "Cloud": 99.9346,
		    "Age": 2.52954
		  },
		  {
		    "Year": 2010,
		    "Doy": 362,
		    "SCF": 79.9,
		    "Cloud": 63.6794,
		    "Age": 2.89772
		  },
		  {
		    "Year": 2010,
		    "Doy": 363,
		    "SCF": 78.4683,
		    "Cloud": 79.5172,
		    "Age": 3.0566
		  },
		  {
		    "Year": 2010,
		    "Doy": 364,
		    "SCF": 77.8407,
		    "Cloud": 90.9152,
		    "Age": 3.66849
		  },
		  {
		    "Year": 2010,
		    "Doy": 365,
		    "SCF": 77.687,
		    "Cloud": 93.4328,
		    "Age": 4.42269
		  },
		  {
		    "Year": 2011,
		    "Doy": 1,
		    "SCF": 77.1892,
		    "Cloud": 34.0272,
		    "Age": 0.340795
		  },
		  {
		    "Year": 2011,
		    "Doy": 2,
		    "SCF": 81.1002,
		    "Cloud": 21.2068,
		    "Age": 0.35518
		  },
		  {
		    "Year": 2011,
		    "Doy": 3,
		    "SCF": 84.0856,
		    "Cloud": 80.5916,
		    "Age": 1.13651
		  },
		  {
		    "Year": 2011,
		    "Doy": 4,
		    "SCF": 85.5764,
		    "Cloud": 84.2388,
		    "Age": 1.79695
		  },
		  {
		    "Year": 2011,
		    "Doy": 5,
		    "SCF": 87.775,
		    "Cloud": 100,
		    "Age": 2.79695
		  },
		  {
		    "Year": 2011,
		    "Doy": 6,
		    "SCF": 87.775,
		    "Cloud": 94.9709,
		    "Age": 3.59631
		  },
		  {
		    "Year": 2011,
		    "Doy": 7,
		    "SCF": 88.4323,
		    "Cloud": 31.2571,
		    "Age": 1.48524
		  },
		  {
		    "Year": 2011,
		    "Doy": 8,
		    "SCF": 85.0547,
		    "Cloud": 93.4298,
		    "Age": 2.30863
		  },
		  {
		    "Year": 2011,
		    "Doy": 9,
		    "SCF": 85.1521,
		    "Cloud": 87.0411,
		    "Age": 2.87101
		  },
		  {
		    "Year": 2011,
		    "Doy": 10,
		    "SCF": 86.4052,
		    "Cloud": 94.9633,
		    "Age": 3.71814
		  },
		  {
		    "Year": 2011,
		    "Doy": 11,
		    "SCF": 86.8084,
		    "Cloud": 99.9986,
		    "Age": 4.71814
		  },
		  {
		    "Year": 2011,
		    "Doy": 12,
		    "SCF": 86.8084,
		    "Cloud": 55.1094,
		    "Age": 3.32309
		  },
		  {
		    "Year": 2011,
		    "Doy": 13,
		    "SCF": 87.2337,
		    "Cloud": 98.5753,
		    "Age": 4.26267
		  },
		  {
		    "Year": 2011,
		    "Doy": 14,
		    "SCF": 87.4208,
		    "Cloud": 78.7539,
		    "Age": 4.21614
		  },
		  {
		    "Year": 2011,
		    "Doy": 15,
		    "SCF": 88.2323,
		    "Cloud": 99.65,
		    "Age": 5.208
		  },
		  {
		    "Year": 2011,
		    "Doy": 16,
		    "SCF": 88.3408,
		    "Cloud": 86.4376,
		    "Age": 5.38273
		  },
		  {
		    "Year": 2011,
		    "Doy": 17,
		    "SCF": 89.8462,
		    "Cloud": 37.7157,
		    "Age": 2.83948
		  },
		  {
		    "Year": 2011,
		    "Doy": 18,
		    "SCF": 88.6996,
		    "Cloud": 40.1365,
		    "Age": 1.88351
		  },
		  {
		    "Year": 2011,
		    "Doy": 19,
		    "SCF": 88.9867,
		    "Cloud": 43.6312,
		    "Age": 1.23656
		  },
		  {
		    "Year": 2011,
		    "Doy": 20,
		    "SCF": 89.5076,
		    "Cloud": 30.7784,
		    "Age": 0.87948
		  },
		  {
		    "Year": 2011,
		    "Doy": 21,
		    "SCF": 86.3976,
		    "Cloud": 99.1649,
		    "Age": 1.85196
		  },
		  {
		    "Year": 2011,
		    "Doy": 22,
		    "SCF": 86.5595,
		    "Cloud": 67.2848,
		    "Age": 1.83475
		  },
		  {
		    "Year": 2011,
		    "Doy": 23,
		    "SCF": 86.6828,
		    "Cloud": 37.056,
		    "Age": 1.15257
		  },
		  {
		    "Year": 2011,
		    "Doy": 24,
		    "SCF": 85.836,
		    "Cloud": 67.2901,
		    "Age": 1.43457
		  },
		  {
		    "Year": 2011,
		    "Doy": 25,
		    "SCF": 86.0991,
		    "Cloud": 17.378,
		    "Age": 0.487373
		  },
		  {
		    "Year": 2011,
		    "Doy": 26,
		    "SCF": 87.1817,
		    "Cloud": 8.52334,
		    "Age": 0.27121
		  },
		  {
		    "Year": 2011,
		    "Doy": 27,
		    "SCF": 87.9007,
		    "Cloud": 25.6872,
		    "Age": 0.404165
		  },
		  {
		    "Year": 2011,
		    "Doy": 28,
		    "SCF": 84.6069,
		    "Cloud": 98.6767,
		    "Age": 1.38994
		  },
		  {
		    "Year": 2011,
		    "Doy": 29,
		    "SCF": 84.4831,
		    "Cloud": 33.3808,
		    "Age": 0.895776
		  },
		  {
		    "Year": 2011,
		    "Doy": 30,
		    "SCF": 81.6606,
		    "Cloud": 88.2482,
		    "Age": 1.73113
		  },
		  {
		    "Year": 2011,
		    "Doy": 31,
		    "SCF": 82.2251,
		    "Cloud": 86.4467,
		    "Age": 2.24836
		  },
		  {
		    "Year": 2011,
		    "Doy": 32,
		    "SCF": 82.4735,
		    "Cloud": 76.4482,
		    "Age": 2.50143
		  },
		  {
		    "Year": 2011,
		    "Doy": 33,
		    "SCF": 81.7436,
		    "Cloud": 41.2936,
		    "Age": 1.38758
		  },
		  {
		    "Year": 2011,
		    "Doy": 34,
		    "SCF": 80.6976,
		    "Cloud": 73.172,
		    "Age": 1.79524
		  },
		  {
		    "Year": 2011,
		    "Doy": 35,
		    "SCF": 79.9813,
		    "Cloud": 61.2437,
		    "Age": 1.68349
		  },
		  {
		    "Year": 2011,
		    "Doy": 36,
		    "SCF": 84.0626,
		    "Cloud": 23.0228,
		    "Age": 0.877343
		  },
		  {
		    "Year": 2011,
		    "Doy": 37,
		    "SCF": 79.5103,
		    "Cloud": 46.6767,
		    "Age": 1.27622
		  },
		  {
		    "Year": 2011,
		    "Doy": 38,
		    "SCF": 78.8902,
		    "Cloud": 99.9695,
		    "Age": 2.27622
		  },
		  {
		    "Year": 2011,
		    "Doy": 39,
		    "SCF": 78.8902,
		    "Cloud": 73.3558,
		    "Age": 2.54704
		  },
		  {
		    "Year": 2011,
		    "Doy": 40,
		    "SCF": 79.671,
		    "Cloud": 38.2368,
		    "Age": 1.85053
		  },
		  {
		    "Year": 2011,
		    "Doy": 41,
		    "SCF": 85.9279,
		    "Cloud": 99.4903,
		    "Age": 2.83021
		  },
		  {
		    "Year": 2011,
		    "Doy": 42,
		    "SCF": 85.9478,
		    "Cloud": 86.4483,
		    "Age": 3.30133
		  },
		  {
		    "Year": 2011,
		    "Doy": 43,
		    "SCF": 87.4336,
		    "Cloud": 28.7241,
		    "Age": 1.64799
		  },
		  {
		    "Year": 2011,
		    "Doy": 44,
		    "SCF": 81.8796,
		    "Cloud": 24.967,
		    "Age": 1.31659
		  },
		  {
		    "Year": 2011,
		    "Doy": 45,
		    "SCF": 88.6212,
		    "Cloud": 96.5163,
		    "Age": 2.26011
		  },
		  {
		    "Year": 2011,
		    "Doy": 46,
		    "SCF": 89.0822,
		    "Cloud": 92.9309,
		    "Age": 3.04095
		  },
		  {
		    "Year": 2011,
		    "Doy": 47,
		    "SCF": 90.3502,
		    "Cloud": 99.4061,
		    "Age": 4.01898
		  },
		  {
		    "Year": 2011,
		    "Doy": 48,
		    "SCF": 90.4373,
		    "Cloud": 96.3609,
		    "Age": 4.81401
		  },
		  {
		    "Year": 2011,
		    "Doy": 49,
		    "SCF": 90.9181,
		    "Cloud": 84.3617,
		    "Age": 4.91817
		  },
		  {
		    "Year": 2011,
		    "Doy": 50,
		    "SCF": 91.6638,
		    "Cloud": 45.0953,
		    "Age": 2.94822
		  },
		  {
		    "Year": 2011,
		    "Doy": 51,
		    "SCF": 92.1307,
		    "Cloud": 17.0687,
		    "Age": 1.18849
		  },
		  {
		    "Year": 2011,
		    "Doy": 52,
		    "SCF": 91.0411,
		    "Cloud": 67.8347,
		    "Age": 1.29925
		  },
		  {
		    "Year": 2011,
		    "Doy": 53,
		    "SCF": 89.4442,
		    "Cloud": 94.3017,
		    "Age": 2.18394
		  },
		  {
		    "Year": 2011,
		    "Doy": 54,
		    "SCF": 90.2446,
		    "Cloud": 56.11,
		    "Age": 1.91641
		  },
		  {
		    "Year": 2011,
		    "Doy": 55,
		    "SCF": 94.6682,
		    "Cloud": 99.8969,
		    "Age": 2.91445
		  },
		  {
		    "Year": 2011,
		    "Doy": 56,
		    "SCF": 94.6775,
		    "Cloud": 75.3496,
		    "Age": 3.02525
		  },
		  {
		    "Year": 2011,
		    "Doy": 57,
		    "SCF": 96.7401,
		    "Cloud": 100,
		    "Age": 4.02525
		  },
		  {
		    "Year": 2011,
		    "Doy": 58,
		    "SCF": 96.7401,
		    "Cloud": 97.3033,
		    "Age": 4.87474
		  },
		  {
		    "Year": 2011,
		    "Doy": 59,
		    "SCF": 97.1053,
		    "Cloud": 9.87032,
		    "Age": 0.658888
		  },
		  {
		    "Year": 2011,
		    "Doy": 60,
		    "SCF": 94.5067,
		    "Cloud": 81.7449,
		    "Age": 1.1864
		  },
		  {
		    "Year": 2011,
		    "Doy": 61,
		    "SCF": 95.9598,
		    "Cloud": 19.2629,
		    "Age": 0.508749
		  },
		  {
		    "Year": 2011,
		    "Doy": 62,
		    "SCF": 92.9006,
		    "Cloud": 11.0742,
		    "Age": 0.232142
		  },
		  {
		    "Year": 2011,
		    "Doy": 63,
		    "SCF": 89.6971,
		    "Cloud": 55.0746,
		    "Age": 0.740427
		  },
		  {
		    "Year": 2011,
		    "Doy": 64,
		    "SCF": 89.14,
		    "Cloud": 16.8523,
		    "Age": 0.310094
		  },
		  {
		    "Year": 2011,
		    "Doy": 65,
		    "SCF": 84.9878,
		    "Cloud": 82.0946,
		    "Age": 1.12155
		  },
		  {
		    "Year": 2011,
		    "Doy": 66,
		    "SCF": 84.8566,
		    "Cloud": 93.0397,
		    "Age": 1.94187
		  },
		  {
		    "Year": 2011,
		    "Doy": 67,
		    "SCF": 84.8283,
		    "Cloud": 65.6443,
		    "Age": 1.98554
		  },
		  {
		    "Year": 2011,
		    "Doy": 68,
		    "SCF": 84.8591,
		    "Cloud": 76.48,
		    "Age": 2.14608
		  },
		  {
		    "Year": 2011,
		    "Doy": 69,
		    "SCF": 84.7022,
		    "Cloud": 99.8043,
		    "Age": 3.14401
		  },
		  {
		    "Year": 2011,
		    "Doy": 70,
		    "SCF": 84.7072,
		    "Cloud": 93.8801,
		    "Age": 3.89816
		  },
		  {
		    "Year": 2011,
		    "Doy": 71,
		    "SCF": 85.1008,
		    "Cloud": 28.5774,
		    "Age": 1.57549
		  },
		  {
		    "Year": 2011,
		    "Doy": 72,
		    "SCF": 89.5775,
		    "Cloud": 98.2185,
		    "Age": 2.55137
		  },
		  {
		    "Year": 2011,
		    "Doy": 73,
		    "SCF": 89.8151,
		    "Cloud": 21.1732,
		    "Age": 1.18555
		  },
		  {
		    "Year": 2011,
		    "Doy": 74,
		    "SCF": 93.831,
		    "Cloud": 97.1691,
		    "Age": 2.08804
		  },
		  {
		    "Year": 2011,
		    "Doy": 75,
		    "SCF": 94.1732,
		    "Cloud": 0.581269,
		    "Age": 0.0653746
		  },
		  {
		    "Year": 2011,
		    "Doy": 76,
		    "SCF": 85.5667,
		    "Cloud": 92.1645,
		    "Age": 0.986504
		  },
		  {
		    "Year": 2011,
		    "Doy": 77,
		    "SCF": 86.4421,
		    "Cloud": 84.6436,
		    "Age": 1.69522
		  },
		  {
		    "Year": 2011,
		    "Doy": 78,
		    "SCF": 86.9741,
		    "Cloud": 13.2529,
		    "Age": 0.424479
		  },
		  {
		    "Year": 2011,
		    "Doy": 79,
		    "SCF": 91.1762,
		    "Cloud": 67.9279,
		    "Age": 1.06357
		  },
		  {
		    "Year": 2011,
		    "Doy": 80,
		    "SCF": 92.749,
		    "Cloud": 35.7407,
		    "Age": 0.940101
		  },
		  {
		    "Year": 2011,
		    "Doy": 81,
		    "SCF": 88.893,
		    "Cloud": 19.5105,
		    "Age": 0.647445
		  },
		  {
		    "Year": 2011,
		    "Doy": 82,
		    "SCF": 89.0017,
		    "Cloud": 51.3372,
		    "Age": 1.10265
		  },
		  {
		    "Year": 2011,
		    "Doy": 83,
		    "SCF": 84.9215,
		    "Cloud": 40.4202,
		    "Age": 1.25017
		  },
		  {
		    "Year": 2011,
		    "Doy": 84,
		    "SCF": 88.1827,
		    "Cloud": 53.6672,
		    "Age": 1.23011
		  },
		  {
		    "Year": 2011,
		    "Doy": 85,
		    "SCF": 86.781,
		    "Cloud": 5.6038,
		    "Age": 0.297661
		  },
		  {
		    "Year": 2011,
		    "Doy": 86,
		    "SCF": 85.7233,
		    "Cloud": 97.3426,
		    "Age": 1.26766
		  },
		  {
		    "Year": 2011,
		    "Doy": 87,
		    "SCF": 85.7755,
		    "Cloud": 75.8583,
		    "Age": 1.79277
		  },
		  {
		    "Year": 2011,
		    "Doy": 88,
		    "SCF": 87.1785,
		    "Cloud": 63.3576,
		    "Age": 1.84012
		  },
		  {
		    "Year": 2011,
		    "Doy": 89,
		    "SCF": 89.9181,
		    "Cloud": 9.65104,
		    "Age": 0.278107
		  },
		  {
		    "Year": 2011,
		    "Doy": 90,
		    "SCF": 83.0415,
		    "Cloud": 99.9884,
		    "Age": 1.27849
		  },
		  {
		    "Year": 2011,
		    "Doy": 91,
		    "SCF": 83.0423,
		    "Cloud": 79.9924,
		    "Age": 1.87048
		  },
		  {
		    "Year": 2011,
		    "Doy": 92,
		    "SCF": 81.2505,
		    "Cloud": 90.7441,
		    "Age": 2.61125
		  },
		  {
		    "Year": 2011,
		    "Doy": 93,
		    "SCF": 81.3514,
		    "Cloud": 43.8967,
		    "Age": 1.66114
		  },
		  {
		    "Year": 2011,
		    "Doy": 94,
		    "SCF": 78.3316,
		    "Cloud": 30.6165,
		    "Age": 0.795304
		  },
		  {
		    "Year": 2011,
		    "Doy": 95,
		    "SCF": 76.6555,
		    "Cloud": 99.9942,
		    "Age": 1.79636
		  },
		  {
		    "Year": 2011,
		    "Doy": 96,
		    "SCF": 76.6555,
		    "Cloud": 24.6434,
		    "Age": 0.819664
		  },
		  {
		    "Year": 2011,
		    "Doy": 97,
		    "SCF": 69.0146,
		    "Cloud": 28.9517,
		    "Age": 0.748877
		  },
		  {
		    "Year": 2011,
		    "Doy": 98,
		    "SCF": 67.5433,
		    "Cloud": 26.8692,
		    "Age": 0.831771
		  },
		  {
		    "Year": 2011,
		    "Doy": 99,
		    "SCF": 61.7036,
		    "Cloud": 23.8342,
		    "Age": 0.779312
		  },
		  {
		    "Year": 2011,
		    "Doy": 100,
		    "SCF": 55.1969,
		    "Cloud": 93.3773,
		    "Age": 1.70834
		  },
		  {
		    "Year": 2011,
		    "Doy": 101,
		    "SCF": 54.3004,
		    "Cloud": 27.0557,
		    "Age": 1.15648
		  },
		  {
		    "Year": 2011,
		    "Doy": 102,
		    "SCF": 56.2335,
		    "Cloud": 99.9752,
		    "Age": 2.15732
		  },
		  {
		    "Year": 2011,
		    "Doy": 103,
		    "SCF": 56.2346,
		    "Cloud": 1.95633,
		    "Age": 0.075165
		  },
		  {
		    "Year": 2011,
		    "Doy": 104,
		    "SCF": 50.7173,
		    "Cloud": 22.0242,
		    "Age": 0.269335
		  },
		  {
		    "Year": 2011,
		    "Doy": 105,
		    "SCF": 38.2102,
		    "Cloud": 92.8046,
		    "Age": 1.19227
		  },
		  {
		    "Year": 2011,
		    "Doy": 106,
		    "SCF": 36.4708,
		    "Cloud": 76.6881,
		    "Age": 1.72459
		  },
		  {
		    "Year": 2011,
		    "Doy": 107,
		    "SCF": 35.4076,
		    "Cloud": 92.8308,
		    "Age": 2.51321
		  },
		  {
		    "Year": 2011,
		    "Doy": 108,
		    "SCF": 34.8116,
		    "Cloud": 13.1151,
		    "Age": 0.541155
		  },
		  {
		    "Year": 2011,
		    "Doy": 109,
		    "SCF": 26.9969,
		    "Cloud": 91.2531,
		    "Age": 1.42566
		  },
		  {
		    "Year": 2011,
		    "Doy": 110,
		    "SCF": 26.1902,
		    "Cloud": 30.7507,
		    "Age": 0.905789
		  },
		  {
		    "Year": 2011,
		    "Doy": 111,
		    "SCF": 19.7595,
		    "Cloud": 51.6989,
		    "Age": 1.17896
		  },
		  {
		    "Year": 2011,
		    "Doy": 112,
		    "SCF": 17.5655,
		    "Cloud": 50.7843,
		    "Age": 1.22806
		  },
		  {
		    "Year": 2011,
		    "Doy": 113,
		    "SCF": 15.7615,
		    "Cloud": 44.7892,
		    "Age": 1.33991
		  },
		  {
		    "Year": 2011,
		    "Doy": 114,
		    "SCF": 15.158,
		    "Cloud": 12.773,
		    "Age": 0.520661
		  },
		  {
		    "Year": 2011,
		    "Doy": 115,
		    "SCF": 14.149,
		    "Cloud": 42.126,
		    "Age": 0.88063
		  },
		  {
		    "Year": 2011,
		    "Doy": 116,
		    "SCF": 13.6052,
		    "Cloud": 34.6398,
		    "Age": 0.673235
		  },
		  {
		    "Year": 2011,
		    "Doy": 117,
		    "SCF": 12.4448,
		    "Cloud": 44.755,
		    "Age": 0.849772
		  },
		  {
		    "Year": 2011,
		    "Doy": 118,
		    "SCF": 11.6334,
		    "Cloud": 43.7314,
		    "Age": 0.963263
		  },
		  {
		    "Year": 2011,
		    "Doy": 119,
		    "SCF": 11.3226,
		    "Cloud": 25.3172,
		    "Age": 0.672739
		  },
		  {
		    "Year": 2011,
		    "Doy": 120,
		    "SCF": 10.9619,
		    "Cloud": 14.9697,
		    "Age": 0.417318
		  },
		  {
		    "Year": 2011,
		    "Doy": 121,
		    "SCF": 11.1257,
		    "Cloud": 58.4405,
		    "Age": 0.887557
		  },
		  {
		    "Year": 2011,
		    "Doy": 122,
		    "SCF": 10.539,
		    "Cloud": 81.2925,
		    "Age": 1.56744
		  },
		  {
		    "Year": 2011,
		    "Doy": 123,
		    "SCF": 10.7133,
		    "Cloud": 85.1981,
		    "Age": 2.23473
		  },
		  {
		    "Year": 2011,
		    "Doy": 124,
		    "SCF": 10.4824,
		    "Cloud": 88.9258,
		    "Age": 2.92506
		  },
		  {
		    "Year": 2011,
		    "Doy": 125,
		    "SCF": 10.2191,
		    "Cloud": 44.3893,
		    "Age": 1.88446
		  },
		  {
		    "Year": 2011,
		    "Doy": 126,
		    "SCF": 10.04,
		    "Cloud": 82.1886,
		    "Age": 2.3498
		  },
		  {
		    "Year": 2011,
		    "Doy": 127,
		    "SCF": 8.89411,
		    "Cloud": 46.0092,
		    "Age": 1.74267
		  },
		  {
		    "Year": 2011,
		    "Doy": 128,
		    "SCF": 8.53793,
		    "Cloud": 72.3437,
		    "Age": 2.27592
		  },
		  {
		    "Year": 2011,
		    "Doy": 129,
		    "SCF": 8.45454,
		    "Cloud": 7.32974,
		    "Age": 0.454392
		  },
		  {
		    "Year": 2011,
		    "Doy": 130,
		    "SCF": 8.38999,
		    "Cloud": 35.9994,
		    "Age": 0.740947
		  },
		  {
		    "Year": 2011,
		    "Doy": 131,
		    "SCF": 8.43038,
		    "Cloud": 48.2961,
		    "Age": 1.02412
		  },
		  {
		    "Year": 2011,
		    "Doy": 132,
		    "SCF": 8.98429,
		    "Cloud": 54.6558,
		    "Age": 1.27373
		  },
		  {
		    "Year": 2011,
		    "Doy": 133,
		    "SCF": 9.33645,
		    "Cloud": 68.5776,
		    "Age": 1.66708
		  },
		  {
		    "Year": 2011,
		    "Doy": 134,
		    "SCF": 8.68453,
		    "Cloud": 57.4811,
		    "Age": 1.75172
		  },
		  {
		    "Year": 2011,
		    "Doy": 135,
		    "SCF": 10.0567,
		    "Cloud": 83.7644,
		    "Age": 2.34336
		  },
		  {
		    "Year": 2011,
		    "Doy": 136,
		    "SCF": 8.22657,
		    "Cloud": 82.3603,
		    "Age": 2.82773
		  },
		  {
		    "Year": 2011,
		    "Doy": 137,
		    "SCF": 7.51669,
		    "Cloud": 61.3098,
		    "Age": 2.48481
		  },
		  {
		    "Year": 2011,
		    "Doy": 138,
		    "SCF": 6.92694,
		    "Cloud": 99.452,
		    "Age": 3.46891
		  },
		  {
		    "Year": 2011,
		    "Doy": 139,
		    "SCF": 6.6063,
		    "Cloud": 53.9525,
		    "Age": 2.5976
		  },
		  {
		    "Year": 2011,
		    "Doy": 140,
		    "SCF": 6.31616,
		    "Cloud": 82.6908,
		    "Age": 3.14732
		  },
		  {
		    "Year": 2011,
		    "Doy": 141,
		    "SCF": 5.72538,
		    "Cloud": 90.8432,
		    "Age": 3.76219
		  },
		  {
		    "Year": 2011,
		    "Doy": 142,
		    "SCF": 5.66131,
		    "Cloud": 99.5495,
		    "Age": 4.75613
		  },
		  {
		    "Year": 2011,
		    "Doy": 143,
		    "SCF": 5.55478,
		    "Cloud": 49.2222,
		    "Age": 3.16362
		  },
		  {
		    "Year": 2011,
		    "Doy": 144,
		    "SCF": 5.98119,
		    "Cloud": 79.8324,
		    "Age": 3.44226
		  },
		  {
		    "Year": 2011,
		    "Doy": 145,
		    "SCF": 5.44531,
		    "Cloud": 67.9609,
		    "Age": 3.34034
		  },
		  {
		    "Year": 2011,
		    "Doy": 146,
		    "SCF": 5.16696,
		    "Cloud": 99.9956,
		    "Age": 4.34185
		  },
		  {
		    "Year": 2011,
		    "Doy": 147,
		    "SCF": 5.16696,
		    "Cloud": 99.9329,
		    "Age": 5.34185
		  },
		  {
		    "Year": 2011,
		    "Doy": 148,
		    "SCF": 5.16696,
		    "Cloud": 99.965,
		    "Age": 6.34128
		  },
		  {
		    "Year": 2011,
		    "Doy": 149,
		    "SCF": 5.15152,
		    "Cloud": 66.0151,
		    "Age": 5.14034
		  },
		  {
		    "Year": 2011,
		    "Doy": 150,
		    "SCF": 4.1623,
		    "Cloud": 35.8323,
		    "Age": 2.9729
		  },
		  {
		    "Year": 2011,
		    "Doy": 151,
		    "SCF": 3.82001,
		    "Cloud": 99.876,
		    "Age": 3.96889
		  },
		  {
		    "Year": 2011,
		    "Doy": 152,
		    "SCF": 3.81631,
		    "Cloud": 86.9142,
		    "Age": 4.49918
		  },
		  {
		    "Year": 2011,
		    "Doy": 153,
		    "SCF": 3.68246,
		    "Cloud": 35.4901,
		    "Age": 2.87668
		  },
		  {
		    "Year": 2011,
		    "Doy": 154,
		    "SCF": 3.3657,
		    "Cloud": 15.6591,
		    "Age": 1.99943
		  },
		  {
		    "Year": 2011,
		    "Doy": 155,
		    "SCF": 3.30102,
		    "Cloud": 6.04583,
		    "Age": 0.846358
		  },
		  {
		    "Year": 2011,
		    "Doy": 156,
		    "SCF": 2.07573,
		    "Cloud": 62.1696,
		    "Age": 1.42835
		  },
		  {
		    "Year": 2011,
		    "Doy": 157,
		    "SCF": 1.7203,
		    "Cloud": 95.9133,
		    "Age": 2.42485
		  },
		  {
		    "Year": 2011,
		    "Doy": 158,
		    "SCF": 1.64284,
		    "Cloud": 99.509,
		    "Age": 3.42104
		  },
		  {
		    "Year": 2011,
		    "Doy": 159,
		    "SCF": 1.60314,
		    "Cloud": 83.5956,
		    "Age": 3.82051
		  },
		  {
		    "Year": 2011,
		    "Doy": 160,
		    "SCF": 1.69835,
		    "Cloud": 98.9583,
		    "Age": 4.81878
		  },
		  {
		    "Year": 2011,
		    "Doy": 161,
		    "SCF": 1.67604,
		    "Cloud": 98.6698,
		    "Age": 5.80684
		  },
		  {
		    "Year": 2011,
		    "Doy": 162,
		    "SCF": 1.63344,
		    "Cloud": 98.342,
		    "Age": 6.80599
		  },
		  {
		    "Year": 2011,
		    "Doy": 163,
		    "SCF": 1.63627,
		    "Cloud": 38.7858,
		    "Age": 3.51623
		  },
		  {
		    "Year": 2011,
		    "Doy": 164,
		    "SCF": 1.47451,
		    "Cloud": 15.1216,
		    "Age": 0.888127
		  },
		  {
		    "Year": 2011,
		    "Doy": 165,
		    "SCF": 2.91611,
		    "Cloud": 52.882,
		    "Age": 1.2571
		  },
		  {
		    "Year": 2011,
		    "Doy": 166,
		    "SCF": 4.44616,
		    "Cloud": 88.7532,
		    "Age": 2.08324
		  },
		  {
		    "Year": 2011,
		    "Doy": 167,
		    "SCF": 4.94535,
		    "Cloud": 96.5642,
		    "Age": 3.01356
		  },
		  {
		    "Year": 2011,
		    "Doy": 168,
		    "SCF": 5.2479,
		    "Cloud": 99.8631,
		    "Age": 4.01365
		  },
		  {
		    "Year": 2011,
		    "Doy": 169,
		    "SCF": 5.2479,
		    "Cloud": 88.5999,
		    "Age": 4.49654
		  },
		  {
		    "Year": 2011,
		    "Doy": 170,
		    "SCF": 3.65649,
		    "Cloud": 95.3028,
		    "Age": 5.23824
		  },
		  {
		    "Year": 2011,
		    "Doy": 171,
		    "SCF": 3.4621,
		    "Cloud": 67.117,
		    "Age": 4.30564
		  },
		  {
		    "Year": 2011,
		    "Doy": 172,
		    "SCF": 1.54,
		    "Cloud": 33.812,
		    "Age": 1.84798
		  },
		  {
		    "Year": 2011,
		    "Doy": 173,
		    "SCF": 2.3616,
		    "Cloud": 72.4058,
		    "Age": 2.04332
		  },
		  {
		    "Year": 2011,
		    "Doy": 174,
		    "SCF": 3.02958,
		    "Cloud": 88.8314,
		    "Age": 2.74669
		  },
		  {
		    "Year": 2011,
		    "Doy": 175,
		    "SCF": 1.3899,
		    "Cloud": 94.7818,
		    "Age": 3.58634
		  },
		  {
		    "Year": 2011,
		    "Doy": 176,
		    "SCF": 1.01843,
		    "Cloud": 85.7784,
		    "Age": 3.95222
		  },
		  {
		    "Year": 2011,
		    "Doy": 177,
		    "SCF": 1.0824,
		    "Cloud": 40.6156,
		    "Age": 2.24192
		  },
		  {
		    "Year": 2011,
		    "Doy": 178,
		    "SCF": 1.19442,
		    "Cloud": 99.9912,
		    "Age": 3.24473
		  },
		  {
		    "Year": 2011,
		    "Doy": 179,
		    "SCF": 1.19442,
		    "Cloud": 96.9227,
		    "Age": 4.17819
		  },
		  {
		    "Year": 2011,
		    "Doy": 180,
		    "SCF": 0.856593,
		    "Cloud": 58.7215,
		    "Age": 3.00273
		  },
		  {
		    "Year": 2011,
		    "Doy": 181,
		    "SCF": 1.56167,
		    "Cloud": 95.613,
		    "Age": 3.95235
		  },
		  {
		    "Year": 2011,
		    "Doy": 182,
		    "SCF": 1.58652,
		    "Cloud": 98.3396,
		    "Age": 4.9527
		  },
		  {
		    "Year": 2011,
		    "Doy": 183,
		    "SCF": 1.58652,
		    "Cloud": 99.644,
		    "Age": 5.93175
		  },
		  {
		    "Year": 2011,
		    "Doy": 184,
		    "SCF": 1.58356,
		    "Cloud": 99.2646,
		    "Age": 6.93005
		  },
		  {
		    "Year": 2011,
		    "Doy": 185,
		    "SCF": 1.58356,
		    "Cloud": 96.5464,
		    "Age": 7.64742
		  },
		  {
		    "Year": 2011,
		    "Doy": 186,
		    "SCF": 1.4507,
		    "Cloud": 86.5674,
		    "Age": 7.33763
		  },
		  {
		    "Year": 2011,
		    "Doy": 187,
		    "SCF": 1.49953,
		    "Cloud": 86.3582,
		    "Age": 7.2834
		  },
		  {
		    "Year": 2011,
		    "Doy": 188,
		    "SCF": 1.66878,
		    "Cloud": 95.7274,
		    "Age": 7.93911
		  },
		  {
		    "Year": 2011,
		    "Doy": 189,
		    "SCF": 1.54975,
		    "Cloud": 67.3963,
		    "Age": 6.18574
		  },
		  {
		    "Year": 2011,
		    "Doy": 190,
		    "SCF": 1.78797,
		    "Cloud": 75.0026,
		    "Age": 5.51565
		  },
		  {
		    "Year": 2011,
		    "Doy": 191,
		    "SCF": 2.18179,
		    "Cloud": 92.8858,
		    "Age": 6.08817
		  },
		  {
		    "Year": 2011,
		    "Doy": 192,
		    "SCF": 2.21782,
		    "Cloud": 53.7079,
		    "Age": 3.88112
		  },
		  {
		    "Year": 2011,
		    "Doy": 193,
		    "SCF": 0.478996,
		    "Cloud": 94.9048,
		    "Age": 4.71276
		  },
		  {
		    "Year": 2011,
		    "Doy": 194,
		    "SCF": 0.322438,
		    "Cloud": 60.9459,
		    "Age": 3.76986
		  },
		  {
		    "Year": 2011,
		    "Doy": 195,
		    "SCF": 0.346588,
		    "Cloud": 16.4954,
		    "Age": 0.819519
		  },
		  {
		    "Year": 2011,
		    "Doy": 196,
		    "SCF": 1.17972,
		    "Cloud": 96.32,
		    "Age": 1.77478
		  },
		  {
		    "Year": 2011,
		    "Doy": 197,
		    "SCF": 1.17397,
		    "Cloud": 38.6663,
		    "Age": 1.21591
		  },
		  {
		    "Year": 2011,
		    "Doy": 198,
		    "SCF": 2.42367,
		    "Cloud": 99.9971,
		    "Age": 2.21443
		  },
		  {
		    "Year": 2011,
		    "Doy": 199,
		    "SCF": 2.42367,
		    "Cloud": 98.4595,
		    "Age": 3.16829
		  },
		  {
		    "Year": 2011,
		    "Doy": 200,
		    "SCF": 2.37526,
		    "Cloud": 95.2804,
		    "Age": 4.03966
		  },
		  {
		    "Year": 2011,
		    "Doy": 201,
		    "SCF": 2.06449,
		    "Cloud": 77.8043,
		    "Age": 4.00222
		  },
		  {
		    "Year": 2011,
		    "Doy": 202,
		    "SCF": 2.48594,
		    "Cloud": 49.2441,
		    "Age": 2.77595
		  },
		  {
		    "Year": 2011,
		    "Doy": 203,
		    "SCF": 3.67204,
		    "Cloud": 98.6516,
		    "Age": 3.73265
		  },
		  {
		    "Year": 2011,
		    "Doy": 204,
		    "SCF": 2.43495,
		    "Cloud": 99.5394,
		    "Age": 4.71813
		  },
		  {
		    "Year": 2011,
		    "Doy": 205,
		    "SCF": 2.40843,
		    "Cloud": 91.9285,
		    "Age": 5.36998
		  },
		  {
		    "Year": 2011,
		    "Doy": 206,
		    "SCF": 2.02369,
		    "Cloud": 98.2812,
		    "Age": 6.28749
		  },
		  {
		    "Year": 2011,
		    "Doy": 207,
		    "SCF": 1.9575,
		    "Cloud": 96.8083,
		    "Age": 7.13585
		  },
		  {
		    "Year": 2011,
		    "Doy": 208,
		    "SCF": 1.95605,
		    "Cloud": 77.6428,
		    "Age": 6.58202
		  },
		  {
		    "Year": 2011,
		    "Doy": 209,
		    "SCF": 2.07616,
		    "Cloud": 61.7022,
		    "Age": 5.43304
		  },
		  {
		    "Year": 2011,
		    "Doy": 210,
		    "SCF": 2.24254,
		    "Cloud": 34.3734,
		    "Age": 2.5106
		  },
		  {
		    "Year": 2011,
		    "Doy": 211,
		    "SCF": 0.693528,
		    "Cloud": 24.432,
		    "Age": 1.08528
		  },
		  {
		    "Year": 2011,
		    "Doy": 212,
		    "SCF": 1.30453,
		    "Cloud": 18.8733,
		    "Age": 0.39086
		  },
		  {
		    "Year": 2011,
		    "Doy": 213,
		    "SCF": 3.24033,
		    "Cloud": 78.8048,
		    "Age": 1.14899
		  },
		  {
		    "Year": 2011,
		    "Doy": 214,
		    "SCF": 2.24416,
		    "Cloud": 46.4026,
		    "Age": 1.03857
		  },
		  {
		    "Year": 2011,
		    "Doy": 215,
		    "SCF": 2.61701,
		    "Cloud": 61.4133,
		    "Age": 1.32186
		  },
		  {
		    "Year": 2011,
		    "Doy": 216,
		    "SCF": 3.03875,
		    "Cloud": 97.1107,
		    "Age": 2.27245
		  },
		  {
		    "Year": 2011,
		    "Doy": 217,
		    "SCF": 2.38435,
		    "Cloud": 99.9621,
		    "Age": 3.27149
		  },
		  {
		    "Year": 2011,
		    "Doy": 218,
		    "SCF": 2.35378,
		    "Cloud": 55.2345,
		    "Age": 2.44975
		  },
		  {
		    "Year": 2011,
		    "Doy": 219,
		    "SCF": 3.70317,
		    "Cloud": 99.4595,
		    "Age": 3.43191
		  },
		  {
		    "Year": 2011,
		    "Doy": 220,
		    "SCF": 3.22697,
		    "Cloud": 56.9753,
		    "Age": 2.57261
		  },
		  {
		    "Year": 2011,
		    "Doy": 221,
		    "SCF": 2.0178,
		    "Cloud": 75.7207,
		    "Age": 2.8617
		  },
		  {
		    "Year": 2011,
		    "Doy": 222,
		    "SCF": 0.867032,
		    "Cloud": 84.0316,
		    "Age": 3.00109
		  },
		  {
		    "Year": 2011,
		    "Doy": 223,
		    "SCF": 0.560586,
		    "Cloud": 50.8459,
		    "Age": 2.11957
		  },
		  {
		    "Year": 2011,
		    "Doy": 224,
		    "SCF": 0.826032,
		    "Cloud": 26.1076,
		    "Age": 0.993596
		  },
		  {
		    "Year": 2011,
		    "Doy": 225,
		    "SCF": 1.93066,
		    "Cloud": 76.2948,
		    "Age": 1.5761
		  },
		  {
		    "Year": 2011,
		    "Doy": 226,
		    "SCF": 2.38507,
		    "Cloud": 99.8614,
		    "Age": 2.57432
		  },
		  {
		    "Year": 2011,
		    "Doy": 227,
		    "SCF": 2.38211,
		    "Cloud": 100,
		    "Age": 3.57432
		  },
		  {
		    "Year": 2011,
		    "Doy": 228,
		    "SCF": 2.38211,
		    "Cloud": 93.1506,
		    "Age": 4.29098
		  },
		  {
		    "Year": 2011,
		    "Doy": 229,
		    "SCF": 2.39959,
		    "Cloud": 87.766,
		    "Age": 4.61364
		  },
		  {
		    "Year": 2011,
		    "Doy": 230,
		    "SCF": 1.15587,
		    "Cloud": 43.1441,
		    "Age": 2.50022
		  },
		  {
		    "Year": 2011,
		    "Doy": 231,
		    "SCF": 0.606828,
		    "Cloud": 100,
		    "Age": 3.498
		  },
		  {
		    "Year": 2011,
		    "Doy": 232,
		    "SCF": 0.606828,
		    "Cloud": 63.2804,
		    "Age": 2.94589
		  },
		  {
		    "Year": 2011,
		    "Doy": 233,
		    "SCF": 0.6407,
		    "Cloud": 100,
		    "Age": 3.94868
		  },
		  {
		    "Year": 2011,
		    "Doy": 234,
		    "SCF": 0.6407,
		    "Cloud": 38.7461,
		    "Age": 2.09896
		  },
		  {
		    "Year": 2011,
		    "Doy": 235,
		    "SCF": 0.949687,
		    "Cloud": 19.4076,
		    "Age": 0.805603
		  },
		  {
		    "Year": 2011,
		    "Doy": 236,
		    "SCF": 4.48103,
		    "Cloud": 99.9971,
		    "Age": 1.80525
		  },
		  {
		    "Year": 2011,
		    "Doy": 237,
		    "SCF": 4.47867,
		    "Cloud": 98.9621,
		    "Age": 2.7807
		  },
		  {
		    "Year": 2011,
		    "Doy": 238,
		    "SCF": 4.49521,
		    "Cloud": 85.4323,
		    "Age": 3.22345
		  },
		  {
		    "Year": 2011,
		    "Doy": 239,
		    "SCF": 4.9586,
		    "Cloud": 99.9942,
		    "Age": 4.22364
		  },
		  {
		    "Year": 2011,
		    "Doy": 240,
		    "SCF": 4.9586,
		    "Cloud": 78.11,
		    "Age": 4.20173
		  },
		  {
		    "Year": 2011,
		    "Doy": 241,
		    "SCF": 4.55441,
		    "Cloud": 97.6475,
		    "Age": 5.09919
		  },
		  {
		    "Year": 2011,
		    "Doy": 242,
		    "SCF": 3.30514,
		    "Cloud": 57.9179,
		    "Age": 3.76109
		  },
		  {
		    "Year": 2011,
		    "Doy": 243,
		    "SCF": 3.2356,
		    "Cloud": 84.1267,
		    "Age": 3.96007
		  },
		  {
		    "Year": 2011,
		    "Doy": 244,
		    "SCF": 2.78845,
		    "Cloud": 45.7855,
		    "Age": 2.20859
		  },
		  {
		    "Year": 2011,
		    "Doy": 245,
		    "SCF": 1.47579,
		    "Cloud": 80.1179,
		    "Age": 2.6073
		  },
		  {
		    "Year": 2011,
		    "Doy": 246,
		    "SCF": 1.59352,
		    "Cloud": 99.5318,
		    "Age": 3.59629
		  },
		  {
		    "Year": 2011,
		    "Doy": 247,
		    "SCF": 1.2102,
		    "Cloud": 99.9985,
		    "Age": 4.59629
		  },
		  {
		    "Year": 2011,
		    "Doy": 248,
		    "SCF": 1.2102,
		    "Cloud": 100,
		    "Age": 5.59629
		  },
		  {
		    "Year": 2011,
		    "Doy": 249,
		    "SCF": 1.2102,
		    "Cloud": 62.7985,
		    "Age": 4.18285
		  },
		  {
		    "Year": 2011,
		    "Doy": 250,
		    "SCF": 1.13342,
		    "Cloud": 72.4953,
		    "Age": 3.74891
		  },
		  {
		    "Year": 2011,
		    "Doy": 251,
		    "SCF": 0.497629,
		    "Cloud": 21.0406,
		    "Age": 1.15372
		  },
		  {
		    "Year": 2011,
		    "Doy": 252,
		    "SCF": 0.421491,
		    "Cloud": 18.3094,
		    "Age": 0.565647
		  },
		  {
		    "Year": 2011,
		    "Doy": 253,
		    "SCF": 1.15541,
		    "Cloud": 32.911,
		    "Age": 0.56458
		  },
		  {
		    "Year": 2011,
		    "Doy": 254,
		    "SCF": 3.46186,
		    "Cloud": 75.6821,
		    "Age": 1.24376
		  },
		  {
		    "Year": 2011,
		    "Doy": 255,
		    "SCF": 3.4812,
		    "Cloud": 95.8707,
		    "Age": 2.16051
		  },
		  {
		    "Year": 2011,
		    "Doy": 256,
		    "SCF": 3.25202,
		    "Cloud": 94.4818,
		    "Age": 2.96568
		  },
		  {
		    "Year": 2011,
		    "Doy": 257,
		    "SCF": 0.642472,
		    "Cloud": 24.1147,
		    "Age": 1.0414
		  },
		  {
		    "Year": 2011,
		    "Doy": 258,
		    "SCF": 1.55378,
		    "Cloud": 48.136,
		    "Age": 0.949135
		  },
		  {
		    "Year": 2011,
		    "Doy": 259,
		    "SCF": 0.172097,
		    "Cloud": 0.0831389,
		    "Age": 0.0173425
		  },
		  {
		    "Year": 2011,
		    "Doy": 260,
		    "SCF": 2.94148,
		    "Cloud": 72.4421,
		    "Age": 0.739675
		  },
		  {
		    "Year": 2011,
		    "Doy": 261,
		    "SCF": 2.39893,
		    "Cloud": 99.9927,
		    "Age": 1.74028
		  },
		  {
		    "Year": 2011,
		    "Doy": 262,
		    "SCF": 2.39893,
		    "Cloud": 85.6413,
		    "Age": 2.30844
		  },
		  {
		    "Year": 2011,
		    "Doy": 263,
		    "SCF": 2.07985,
		    "Cloud": 65.0634,
		    "Age": 2.15162
		  },
		  {
		    "Year": 2011,
		    "Doy": 264,
		    "SCF": 2.36864,
		    "Cloud": 23.687,
		    "Age": 0.699267
		  },
		  {
		    "Year": 2011,
		    "Doy": 265,
		    "SCF": 3.06012,
		    "Cloud": 79.8156,
		    "Age": 1.31705
		  },
		  {
		    "Year": 2011,
		    "Doy": 266,
		    "SCF": 1.01248,
		    "Cloud": 36.6096,
		    "Age": 0.911295
		  },
		  {
		    "Year": 2011,
		    "Doy": 267,
		    "SCF": 0.832981,
		    "Cloud": 97.4476,
		    "Age": 1.87027
		  },
		  {
		    "Year": 2011,
		    "Doy": 268,
		    "SCF": 0.634151,
		    "Cloud": 95.8698,
		    "Age": 2.769
		  },
		  {
		    "Year": 2011,
		    "Doy": 269,
		    "SCF": 0.445053,
		    "Cloud": 99.9825,
		    "Age": 3.76848
		  },
		  {
		    "Year": 2011,
		    "Doy": 270,
		    "SCF": 0.437215,
		    "Cloud": 88.5917,
		    "Age": 4.29902
		  },
		  {
		    "Year": 2011,
		    "Doy": 271,
		    "SCF": 0.244494,
		    "Cloud": 99.4177,
		    "Age": 5.27116
		  },
		  {
		    "Year": 2011,
		    "Doy": 272,
		    "SCF": 0.236293,
		    "Cloud": 0.969046,
		    "Age": 0.0866304
		  },
		  {
		    "Year": 2011,
		    "Doy": 273,
		    "SCF": 0.959623,
		    "Cloud": 43.3033,
		    "Age": 0.512168
		  },
		  {
		    "Year": 2011,
		    "Doy": 274,
		    "SCF": 0.980723,
		    "Cloud": 9.20792,
		    "Age": 0.160708
		  },
		  {
		    "Year": 2011,
		    "Doy": 275,
		    "SCF": 9.5685,
		    "Cloud": 99.9111,
		    "Age": 1.15855
		  },
		  {
		    "Year": 2011,
		    "Doy": 276,
		    "SCF": 9.61685,
		    "Cloud": 97.6051,
		    "Age": 2.10721
		  },
		  {
		    "Year": 2011,
		    "Doy": 277,
		    "SCF": 9.43255,
		    "Cloud": 61.2924,
		    "Age": 1.93201
		  },
		  {
		    "Year": 2011,
		    "Doy": 278,
		    "SCF": 9.04031,
		    "Cloud": 82.5281,
		    "Age": 2.42027
		  },
		  {
		    "Year": 2011,
		    "Doy": 279,
		    "SCF": 8.47657,
		    "Cloud": 28.1024,
		    "Age": 0.998498
		  },
		  {
		    "Year": 2011,
		    "Doy": 280,
		    "SCF": 15.0861,
		    "Cloud": 37.9033,
		    "Age": 0.890205
		  },
		  {
		    "Year": 2011,
		    "Doy": 281,
		    "SCF": 18.7438,
		    "Cloud": 21.2827,
		    "Age": 0.472674
		  },
		  {
		    "Year": 2011,
		    "Doy": 282,
		    "SCF": 44.0678,
		    "Cloud": 99.9927,
		    "Age": 1.47222
		  },
		  {
		    "Year": 2011,
		    "Doy": 283,
		    "SCF": 44.0678,
		    "Cloud": 73.6598,
		    "Age": 1.81239
		  },
		  {
		    "Year": 2011,
		    "Doy": 284,
		    "SCF": 38.9967,
		    "Cloud": 46.492,
		    "Age": 1.38359
		  },
		  {
		    "Year": 2011,
		    "Doy": 285,
		    "SCF": 35.9022,
		    "Cloud": 11.1246,
		    "Age": 0.418279
		  },
		  {
		    "Year": 2011,
		    "Doy": 286,
		    "SCF": 29.863,
		    "Cloud": 6.87276,
		    "Age": 0.162562
		  },
		  {
		    "Year": 2011,
		    "Doy": 287,
		    "SCF": 21.4456,
		    "Cloud": 87.8297,
		    "Age": 1.02503
		  },
		  {
		    "Year": 2011,
		    "Doy": 288,
		    "SCF": 19.2284,
		    "Cloud": 76.052,
		    "Age": 1.56394
		  },
		  {
		    "Year": 2011,
		    "Doy": 289,
		    "SCF": 18.7275,
		    "Cloud": 16.4885,
		    "Age": 0.463344
		  },
		  {
		    "Year": 2011,
		    "Doy": 290,
		    "SCF": 14.9243,
		    "Cloud": 96.2092,
		    "Age": 1.42489
		  },
		  {
		    "Year": 2011,
		    "Doy": 291,
		    "SCF": 14.8165,
		    "Cloud": 52.4151,
		    "Age": 1.24198
		  },
		  {
		    "Year": 2011,
		    "Doy": 292,
		    "SCF": 13.8433,
		    "Cloud": 53.587,
		    "Age": 1.25012
		  },
		  {
		    "Year": 2011,
		    "Doy": 293,
		    "SCF": 12.4664,
		    "Cloud": 19.4818,
		    "Age": 0.640249
		  },
		  {
		    "Year": 2011,
		    "Doy": 294,
		    "SCF": 18.625,
		    "Cloud": 93.7267,
		    "Age": 1.56613
		  },
		  {
		    "Year": 2011,
		    "Doy": 295,
		    "SCF": 18.3762,
		    "Cloud": 94.7202,
		    "Age": 2.38232
		  },
		  {
		    "Year": 2011,
		    "Doy": 296,
		    "SCF": 18.172,
		    "Cloud": 95.705,
		    "Age": 3.22957
		  },
		  {
		    "Year": 2011,
		    "Doy": 297,
		    "SCF": 18.1642,
		    "Cloud": 98.1866,
		    "Age": 4.13284
		  },
		  {
		    "Year": 2011,
		    "Doy": 298,
		    "SCF": 18.2382,
		    "Cloud": 97.1279,
		    "Age": 4.9845
		  },
		  {
		    "Year": 2011,
		    "Doy": 299,
		    "SCF": 17.78,
		    "Cloud": 99.1567,
		    "Age": 5.93498
		  },
		  {
		    "Year": 2011,
		    "Doy": 300,
		    "SCF": 17.5418,
		    "Cloud": 97.1889,
		    "Age": 6.7386
		  },
		  {
		    "Year": 2011,
		    "Doy": 301,
		    "SCF": 17.0128,
		    "Cloud": 91.3803,
		    "Age": 7.08512
		  },
		  {
		    "Year": 2011,
		    "Doy": 302,
		    "SCF": 15.292,
		    "Cloud": 87.0383,
		    "Age": 7.09261
		  },
		  {
		    "Year": 2011,
		    "Doy": 303,
		    "SCF": 12.7655,
		    "Cloud": 50.1005,
		    "Age": 4.11316
		  },
		  {
		    "Year": 2011,
		    "Doy": 304,
		    "SCF": 13.3695,
		    "Cloud": 78.5837,
		    "Age": 4.21898
		  },
		  {
		    "Year": 2011,
		    "Doy": 305,
		    "SCF": 14.0973,
		    "Cloud": 97.8917,
		    "Age": 5.10432
		  },
		  {
		    "Year": 2011,
		    "Doy": 306,
		    "SCF": 13.7457,
		    "Cloud": 49.4313,
		    "Age": 2.69149
		  },
		  {
		    "Year": 2011,
		    "Doy": 307,
		    "SCF": 15.2975,
		    "Cloud": 99.9244,
		    "Age": 3.69004
		  },
		  {
		    "Year": 2011,
		    "Doy": 308,
		    "SCF": 15.309,
		    "Cloud": 94.6091,
		    "Age": 4.48072
		  },
		  {
		    "Year": 2011,
		    "Doy": 309,
		    "SCF": 12.7927,
		    "Cloud": 98.6592,
		    "Age": 5.41059
		  },
		  {
		    "Year": 2011,
		    "Doy": 310,
		    "SCF": 12.2093,
		    "Cloud": 93.908,
		    "Age": 6.08529
		  },
		  {
		    "Year": 2011,
		    "Doy": 311,
		    "SCF": 11.217,
		    "Cloud": 78.6931,
		    "Age": 5.39646
		  },
		  {
		    "Year": 2011,
		    "Doy": 312,
		    "SCF": 11.2681,
		    "Cloud": 49.3209,
		    "Age": 3.62098
		  },
		  {
		    "Year": 2011,
		    "Doy": 313,
		    "SCF": 7.64033,
		    "Cloud": 12.0225,
		    "Age": 0.941126
		  },
		  {
		    "Year": 2011,
		    "Doy": 314,
		    "SCF": 19.9251,
		    "Cloud": 96.5914,
		    "Age": 1.86281
		  },
		  {
		    "Year": 2011,
		    "Doy": 315,
		    "SCF": 19.7438,
		    "Cloud": 52.6045,
		    "Age": 1.70463
		  },
		  {
		    "Year": 2011,
		    "Doy": 316,
		    "SCF": 22.2095,
		    "Cloud": 66.8414,
		    "Age": 2.27417
		  },
		  {
		    "Year": 2011,
		    "Doy": 317,
		    "SCF": 21.6572,
		    "Cloud": 81.3534,
		    "Age": 2.71105
		  },
		  {
		    "Year": 2011,
		    "Doy": 318,
		    "SCF": 19.7689,
		    "Cloud": 64.4128,
		    "Age": 2.66066
		  },
		  {
		    "Year": 2011,
		    "Doy": 319,
		    "SCF": 20.534,
		    "Cloud": 11.3515,
		    "Age": 0.70771
		  },
		  {
		    "Year": 2011,
		    "Doy": 320,
		    "SCF": 21.4487,
		    "Cloud": 16.4676,
		    "Age": 0.777815
		  },
		  {
		    "Year": 2011,
		    "Doy": 321,
		    "SCF": 26.5033,
		    "Cloud": 16.2971,
		    "Age": 0.821085
		  },
		  {
		    "Year": 2011,
		    "Doy": 322,
		    "SCF": 24.6467,
		    "Cloud": 99.9767,
		    "Age": 1.82078
		  },
		  {
		    "Year": 2011,
		    "Doy": 323,
		    "SCF": 24.6444,
		    "Cloud": 97.2604,
		    "Age": 2.68366
		  },
		  {
		    "Year": 2011,
		    "Doy": 324,
		    "SCF": 24.0281,
		    "Cloud": 87.3824,
		    "Age": 3.24303
		  },
		  {
		    "Year": 2011,
		    "Doy": 325,
		    "SCF": 25.1008,
		    "Cloud": 38.5141,
		    "Age": 2.01741
		  },
		  {
		    "Year": 2011,
		    "Doy": 326,
		    "SCF": 31.4171,
		    "Cloud": 72.8136,
		    "Age": 2.57936
		  },
		  {
		    "Year": 2011,
		    "Doy": 327,
		    "SCF": 38.4768,
		    "Cloud": 86.141,
		    "Age": 3.19561
		  },
		  {
		    "Year": 2011,
		    "Doy": 328,
		    "SCF": 36.9355,
		    "Cloud": 50.8659,
		    "Age": 2.01116
		  },
		  {
		    "Year": 2011,
		    "Doy": 329,
		    "SCF": 33.3453,
		    "Cloud": 28.789,
		    "Age": 1.07009
		  },
		  {
		    "Year": 2011,
		    "Doy": 330,
		    "SCF": 46.3687,
		    "Cloud": 65.6145,
		    "Age": 1.57214
		  },
		  {
		    "Year": 2011,
		    "Doy": 331,
		    "SCF": 40.8689,
		    "Cloud": 35.3095,
		    "Age": 1.12637
		  },
		  {
		    "Year": 2011,
		    "Doy": 332,
		    "SCF": 49.9389,
		    "Cloud": 27.354,
		    "Age": 0.906421
		  },
		  {
		    "Year": 2011,
		    "Doy": 333,
		    "SCF": 54.3609,
		    "Cloud": 100,
		    "Age": 1.90634
		  },
		  {
		    "Year": 2011,
		    "Doy": 334,
		    "SCF": 54.3609,
		    "Cloud": 61.1239,
		    "Age": 2.01465
		  },
		  {
		    "Year": 2011,
		    "Doy": 335,
		    "SCF": 61.1556,
		    "Cloud": 96.3695,
		    "Age": 2.96586
		  },
		  {
		    "Year": 2011,
		    "Doy": 336,
		    "SCF": 59.113,
		    "Cloud": 85.2309,
		    "Age": 3.36041
		  },
		  {
		    "Year": 2011,
		    "Doy": 337,
		    "SCF": 59.9702,
		    "Cloud": 81.4699,
		    "Age": 3.43935
		  },
		  {
		    "Year": 2011,
		    "Doy": 338,
		    "SCF": 59.3658,
		    "Cloud": 66.9154,
		    "Age": 3.04194
		  },
		  {
		    "Year": 2011,
		    "Doy": 339,
		    "SCF": 61.3538,
		    "Cloud": 97.6009,
		    "Age": 3.93626
		  },
		  {
		    "Year": 2011,
		    "Doy": 340,
		    "SCF": 61.7593,
		    "Cloud": 48.2561,
		    "Age": 2.38943
		  },
		  {
		    "Year": 2011,
		    "Doy": 341,
		    "SCF": 72.4898,
		    "Cloud": 64.9773,
		    "Age": 2.4746
		  },
		  {
		    "Year": 2011,
		    "Doy": 342,
		    "SCF": 74.0879,
		    "Cloud": 43.4293,
		    "Age": 1.38698
		  },
		  {
		    "Year": 2011,
		    "Doy": 343,
		    "SCF": 84.4909,
		    "Cloud": 91.339,
		    "Age": 2.17899
		  },
		  {
		    "Year": 2011,
		    "Doy": 344,
		    "SCF": 85.7738,
		    "Cloud": 53.7247,
		    "Age": 1.76877
		  },
		  {
		    "Year": 2011,
		    "Doy": 345,
		    "SCF": 86.0045,
		    "Cloud": 99.8616,
		    "Age": 2.76634
		  },
		  {
		    "Year": 2011,
		    "Doy": 346,
		    "SCF": 86.0421,
		    "Cloud": 100,
		    "Age": 3.76634
		  },
		  {
		    "Year": 2011,
		    "Doy": 347,
		    "SCF": 86.0421,
		    "Cloud": 95.2988,
		    "Age": 4.53956
		  },
		  {
		    "Year": 2011,
		    "Doy": 348,
		    "SCF": 86.3256,
		    "Cloud": 87.4082,
		    "Age": 4.90311
		  },
		  {
		    "Year": 2011,
		    "Doy": 349,
		    "SCF": 86.9371,
		    "Cloud": 65.8624,
		    "Age": 5.90485
		  },
		  {
		    "Year": 2011,
		    "Doy": 350,
		    "SCF": 86.9371,
		    "Cloud": 86.5182,
		    "Age": 5.97306
		  },
		  {
		    "Year": 2011,
		    "Doy": 351,
		    "SCF": 87.8289,
		    "Cloud": 51.64,
		    "Age": 4.48987
		  },
		  {
		    "Year": 2011,
		    "Doy": 352,
		    "SCF": 88.5743,
		    "Cloud": 17.5718,
		    "Age": 1.03181
		  },
		  {
		    "Year": 2011,
		    "Doy": 353,
		    "SCF": 85.6767,
		    "Cloud": 42.1844,
		    "Age": 1.12662
		  },
		  {
		    "Year": 2011,
		    "Doy": 354,
		    "SCF": 86.6621,
		    "Cloud": 14.196,
		    "Age": 0.461883
		  },
		  {
		    "Year": 2011,
		    "Doy": 355,
		    "SCF": 85.9682,
		    "Cloud": 40.7719,
		    "Age": 0.702579
		  },
		  {
		    "Year": 2011,
		    "Doy": 356,
		    "SCF": 82.6412,
		    "Cloud": 45.4646,
		    "Age": 0.910806
		  },
		  {
		    "Year": 2011,
		    "Doy": 357,
		    "SCF": 83.249,
		    "Cloud": 68.7272,
		    "Age": 1.32036
		  },
		  {
		    "Year": 2011,
		    "Doy": 358,
		    "SCF": 84.5016,
		    "Cloud": 16.9625,
		    "Age": 0.734193
		  },
		  {
		    "Year": 2011,
		    "Doy": 359,
		    "SCF": 74.7247,
		    "Cloud": 99.9854,
		    "Age": 1.73432
		  },
		  {
		    "Year": 2011,
		    "Doy": 360,
		    "SCF": 74.7247,
		    "Cloud": 93.9856,
		    "Age": 2.62955
		  },
		  {
		    "Year": 2011,
		    "Doy": 361,
		    "SCF": 75.0752,
		    "Cloud": 35.9013,
		    "Age": 1.49033
		  },
		  {
		    "Year": 2011,
		    "Doy": 362,
		    "SCF": 79.9363,
		    "Cloud": 99.5453,
		    "Age": 2.48251
		  },
		  {
		    "Year": 2011,
		    "Doy": 363,
		    "SCF": 79.9622,
		    "Cloud": 68.001,
		    "Age": 2.27823
		  },
		  {
		    "Year": 2011,
		    "Doy": 364,
		    "SCF": 80.6248,
		    "Cloud": 43.8657,
		    "Age": 1.63863
		  },
		  {
		    "Year": 2011,
		    "Doy": 365,
		    "SCF": 78.5595,
		    "Cloud": 66.5798,
		    "Age": 1.80096
		  },
		  {
		    "Year": 2012,
		    "Doy": 1,
		    "SCF": 82.4694,
		    "Cloud": 98.4411,
		    "Age": 0.984571
		  },
		  {
		    "Year": 2012,
		    "Doy": 2,
		    "SCF": 82.6584,
		    "Cloud": 91.7369,
		    "Age": 1.82129
		  },
		  {
		    "Year": 2012,
		    "Doy": 3,
		    "SCF": 83.3597,
		    "Cloud": 99.0604,
		    "Age": 2.79669
		  },
		  {
		    "Year": 2012,
		    "Doy": 4,
		    "SCF": 83.6804,
		    "Cloud": 97.1185,
		    "Age": 3.68641
		  },
		  {
		    "Year": 2012,
		    "Doy": 5,
		    "SCF": 83.8866,
		    "Cloud": 57.6948,
		    "Age": 2.72248
		  },
		  {
		    "Year": 2012,
		    "Doy": 6,
		    "SCF": 85.0355,
		    "Cloud": 32.2457,
		    "Age": 0.983903
		  },
		  {
		    "Year": 2012,
		    "Doy": 7,
		    "SCF": 84.1659,
		    "Cloud": 96.7665,
		    "Age": 1.9301
		  },
		  {
		    "Year": 2012,
		    "Doy": 8,
		    "SCF": 84.7729,
		    "Cloud": 47.4882,
		    "Age": 1.49545
		  },
		  {
		    "Year": 2012,
		    "Doy": 9,
		    "SCF": 83.2375,
		    "Cloud": 88.0972,
		    "Age": 2.10184
		  },
		  {
		    "Year": 2012,
		    "Doy": 10,
		    "SCF": 84.0284,
		    "Cloud": 88.2353,
		    "Age": 2.73693
		  },
		  {
		    "Year": 2012,
		    "Doy": 11,
		    "SCF": 85.1474,
		    "Cloud": 24.3257,
		    "Age": 1.05116
		  },
		  {
		    "Year": 2012,
		    "Doy": 12,
		    "SCF": 82.5302,
		    "Cloud": 61.2522,
		    "Age": 1.35677
		  },
		  {
		    "Year": 2012,
		    "Doy": 13,
		    "SCF": 83.9876,
		    "Cloud": 56.752,
		    "Age": 1.4571
		  },
		  {
		    "Year": 2012,
		    "Doy": 14,
		    "SCF": 85.3993,
		    "Cloud": 99.9927,
		    "Age": 2.45636
		  },
		  {
		    "Year": 2012,
		    "Doy": 15,
		    "SCF": 85.3993,
		    "Cloud": 99.2312,
		    "Age": 3.42771
		  },
		  {
		    "Year": 2012,
		    "Doy": 16,
		    "SCF": 85.4211,
		    "Cloud": 99.7685,
		    "Age": 4.41676
		  },
		  {
		    "Year": 2012,
		    "Doy": 17,
		    "SCF": 85.4931,
		    "Cloud": 10.7699,
		    "Age": 0.683425
		  },
		  {
		    "Year": 2012,
		    "Doy": 18,
		    "SCF": 83.6999,
		    "Cloud": 100,
		    "Age": 1.68316
		  },
		  {
		    "Year": 2012,
		    "Doy": 19,
		    "SCF": 83.6999,
		    "Cloud": 48.3503,
		    "Age": 1.49686
		  },
		  {
		    "Year": 2012,
		    "Doy": 20,
		    "SCF": 87.154,
		    "Cloud": 99.9913,
		    "Age": 2.49667
		  },
		  {
		    "Year": 2012,
		    "Doy": 21,
		    "SCF": 87.1557,
		    "Cloud": 98.2522,
		    "Age": 3.41147
		  },
		  {
		    "Year": 2012,
		    "Doy": 22,
		    "SCF": 87.2366,
		    "Cloud": 98.437,
		    "Age": 4.33694
		  },
		  {
		    "Year": 2012,
		    "Doy": 23,
		    "SCF": 87.4386,
		    "Cloud": 86.5299,
		    "Age": 4.58714
		  },
		  {
		    "Year": 2012,
		    "Doy": 24,
		    "SCF": 88.5911,
		    "Cloud": 72.092,
		    "Age": 4.24845
		  },
		  {
		    "Year": 2012,
		    "Doy": 25,
		    "SCF": 88.1819,
		    "Cloud": 96.3501,
		    "Age": 5.06053
		  },
		  {
		    "Year": 2012,
		    "Doy": 26,
		    "SCF": 88.3141,
		    "Cloud": 99.9913,
		    "Age": 6.06035
		  },
		  {
		    "Year": 2012,
		    "Doy": 27,
		    "SCF": 88.319,
		    "Cloud": 100,
		    "Age": 7.06035
		  },
		  {
		    "Year": 2012,
		    "Doy": 28,
		    "SCF": 88.319,
		    "Cloud": 97.9641,
		    "Age": 7.91091
		  },
		  {
		    "Year": 2012,
		    "Doy": 29,
		    "SCF": 88.6356,
		    "Cloud": 70.9909,
		    "Age": 6.67667
		  },
		  {
		    "Year": 2012,
		    "Doy": 30,
		    "SCF": 91.0843,
		    "Cloud": 88.6091,
		    "Age": 6.81833
		  },
		  {
		    "Year": 2012,
		    "Doy": 31,
		    "SCF": 91.1795,
		    "Cloud": 80.5233,
		    "Age": 6.80106
		  },
		  {
		    "Year": 2012,
		    "Doy": 32,
		    "SCF": 92.4145,
		    "Cloud": 62.3041,
		    "Age": 5.86375
		  },
		  {
		    "Year": 2012,
		    "Doy": 33,
		    "SCF": 93.2307,
		    "Cloud": 99.9578,
		    "Age": 6.86081
		  },
		  {
		    "Year": 2012,
		    "Doy": 34,
		    "SCF": 93.2417,
		    "Cloud": 30.1049,
		    "Age": 1.88513
		  },
		  {
		    "Year": 2012,
		    "Doy": 35,
		    "SCF": 89.5511,
		    "Cloud": 98.3206,
		    "Age": 2.81928
		  },
		  {
		    "Year": 2012,
		    "Doy": 36,
		    "SCF": 89.7129,
		    "Cloud": 99.9114,
		    "Age": 3.81617
		  },
		  {
		    "Year": 2012,
		    "Doy": 37,
		    "SCF": 89.7284,
		    "Cloud": 71.5489,
		    "Age": 3.70047
		  },
		  {
		    "Year": 2012,
		    "Doy": 38,
		    "SCF": 92.8629,
		    "Cloud": 90.8738,
		    "Age": 4.28705
		  },
		  {
		    "Year": 2012,
		    "Doy": 39,
		    "SCF": 93.9668,
		    "Cloud": 21.1118,
		    "Age": 1.44547
		  },
		  {
		    "Year": 2012,
		    "Doy": 40,
		    "SCF": 88.6835,
		    "Cloud": 96.4387,
		    "Age": 2.20371
		  },
		  {
		    "Year": 2012,
		    "Doy": 41,
		    "SCF": 88.8221,
		    "Cloud": 87.7198,
		    "Age": 2.84554
		  },
		  {
		    "Year": 2012,
		    "Doy": 42,
		    "SCF": 88.6528,
		    "Cloud": 91.4197,
		    "Age": 3.5916
		  },
		  {
		    "Year": 2012,
		    "Doy": 43,
		    "SCF": 89.2438,
		    "Cloud": 41.6439,
		    "Age": 1.66297
		  },
		  {
		    "Year": 2012,
		    "Doy": 44,
		    "SCF": 84.9568,
		    "Cloud": 81.4388,
		    "Age": 2.05618
		  },
		  {
		    "Year": 2012,
		    "Doy": 45,
		    "SCF": 87.3847,
		    "Cloud": 100,
		    "Age": 3.05618
		  },
		  {
		    "Year": 2012,
		    "Doy": 46,
		    "SCF": 87.3847,
		    "Cloud": 49.1078,
		    "Age": 2.10709
		  },
		  {
		    "Year": 2012,
		    "Doy": 47,
		    "SCF": 88.4414,
		    "Cloud": 99.2199,
		    "Age": 3.07644
		  },
		  {
		    "Year": 2012,
		    "Doy": 48,
		    "SCF": 88.531,
		    "Cloud": 24.1202,
		    "Age": 1.08529
		  },
		  {
		    "Year": 2012,
		    "Doy": 49,
		    "SCF": 83.8666,
		    "Cloud": 99.7844,
		    "Age": 2.08254
		  },
		  {
		    "Year": 2012,
		    "Doy": 50,
		    "SCF": 83.9258,
		    "Cloud": 21.2657,
		    "Age": 0.876731
		  },
		  {
		    "Year": 2012,
		    "Doy": 51,
		    "SCF": 82.1345,
		    "Cloud": 92.374,
		    "Age": 1.68986
		  },
		  {
		    "Year": 2012,
		    "Doy": 52,
		    "SCF": 82.4897,
		    "Cloud": 14.3388,
		    "Age": 0.620929
		  },
		  {
		    "Year": 2012,
		    "Doy": 53,
		    "SCF": 81.4952,
		    "Cloud": 77.3691,
		    "Age": 1.38371
		  },
		  {
		    "Year": 2012,
		    "Doy": 54,
		    "SCF": 81.5653,
		    "Cloud": 47.5133,
		    "Age": 1.41838
		  },
		  {
		    "Year": 2012,
		    "Doy": 55,
		    "SCF": 87.6592,
		    "Cloud": 20.4985,
		    "Age": 0.789771
		  },
		  {
		    "Year": 2012,
		    "Doy": 56,
		    "SCF": 84.3289,
		    "Cloud": 73.9666,
		    "Age": 1.42039
		  },
		  {
		    "Year": 2012,
		    "Doy": 57,
		    "SCF": 85.1978,
		    "Cloud": 54.8238,
		    "Age": 1.44748
		  },
		  {
		    "Year": 2012,
		    "Doy": 58,
		    "SCF": 86.2034,
		    "Cloud": 99.0785,
		    "Age": 2.424
		  },
		  {
		    "Year": 2012,
		    "Doy": 59,
		    "SCF": 86.3982,
		    "Cloud": 16.6722,
		    "Age": 0.9456
		  },
		  {
		    "Year": 2012,
		    "Doy": 60,
		    "SCF": 83.3902,
		    "Cloud": 33.4882,
		    "Age": 0.977844
		  },
		  {
		    "Year": 2012,
		    "Doy": 61,
		    "SCF": 81.9195,
		    "Cloud": 16.4536,
		    "Age": 0.802428
		  },
		  {
		    "Year": 2012,
		    "Doy": 62,
		    "SCF": 88.7406,
		    "Cloud": 1.18267,
		    "Age": 0.0546622
		  },
		  {
		    "Year": 2012,
		    "Doy": 63,
		    "SCF": 77.4811,
		    "Cloud": 62.9308,
		    "Age": 0.662739
		  },
		  {
		    "Year": 2012,
		    "Doy": 64,
		    "SCF": 77.1631,
		    "Cloud": 96.8021,
		    "Age": 1.60069
		  },
		  {
		    "Year": 2012,
		    "Doy": 65,
		    "SCF": 77.2566,
		    "Cloud": 82.7125,
		    "Age": 2.15121
		  },
		  {
		    "Year": 2012,
		    "Doy": 66,
		    "SCF": 78.4424,
		    "Cloud": 69.9735,
		    "Age": 2.22838
		  },
		  {
		    "Year": 2012,
		    "Doy": 67,
		    "SCF": 81.3022,
		    "Cloud": 100,
		    "Age": 3.22872
		  },
		  {
		    "Year": 2012,
		    "Doy": 68,
		    "SCF": 81.3022,
		    "Cloud": 65.274,
		    "Age": 2.8777
		  },
		  {
		    "Year": 2012,
		    "Doy": 69,
		    "SCF": 80.7863,
		    "Cloud": 74.76,
		    "Age": 2.9495
		  },
		  {
		    "Year": 2012,
		    "Doy": 70,
		    "SCF": 80.8069,
		    "Cloud": 63.9983,
		    "Age": 2.36423
		  },
		  {
		    "Year": 2012,
		    "Doy": 71,
		    "SCF": 83.5628,
		    "Cloud": 37.2769,
		    "Age": 1.73372
		  },
		  {
		    "Year": 2012,
		    "Doy": 72,
		    "SCF": 80.3069,
		    "Cloud": 24.5203,
		    "Age": 1.14141
		  },
		  {
		    "Year": 2012,
		    "Doy": 73,
		    "SCF": 77.8805,
		    "Cloud": 13.4377,
		    "Age": 0.683828
		  },
		  {
		    "Year": 2012,
		    "Doy": 74,
		    "SCF": 74.1485,
		    "Cloud": 23.4226,
		    "Age": 0.826233
		  },
		  {
		    "Year": 2012,
		    "Doy": 75,
		    "SCF": 70.6054,
		    "Cloud": 99.0269,
		    "Age": 1.81521
		  },
		  {
		    "Year": 2012,
		    "Doy": 76,
		    "SCF": 70.5627,
		    "Cloud": 45.3588,
		    "Age": 1.57295
		  },
		  {
		    "Year": 2012,
		    "Doy": 77,
		    "SCF": 67.6545,
		    "Cloud": 89.709,
		    "Age": 2.35841
		  },
		  {
		    "Year": 2012,
		    "Doy": 78,
		    "SCF": 67.4112,
		    "Cloud": 25.8725,
		    "Age": 0.997405
		  },
		  {
		    "Year": 2012,
		    "Doy": 79,
		    "SCF": 62.7735,
		    "Cloud": 21.2473,
		    "Age": 0.772595
		  },
		  {
		    "Year": 2012,
		    "Doy": 80,
		    "SCF": 65.2812,
		    "Cloud": 91.9146,
		    "Age": 1.68156
		  },
		  {
		    "Year": 2012,
		    "Doy": 81,
		    "SCF": 64.8329,
		    "Cloud": 48.0156,
		    "Age": 1.62641
		  },
		  {
		    "Year": 2012,
		    "Doy": 82,
		    "SCF": 62.7547,
		    "Cloud": 89.9886,
		    "Age": 2.52481
		  },
		  {
		    "Year": 2012,
		    "Doy": 83,
		    "SCF": 62.4009,
		    "Cloud": 1.2535,
		    "Age": 0.0912328
		  },
		  {
		    "Year": 2012,
		    "Doy": 84,
		    "SCF": 57.7444,
		    "Cloud": 60.7769,
		    "Age": 0.694853
		  },
		  {
		    "Year": 2012,
		    "Doy": 85,
		    "SCF": 58.1619,
		    "Cloud": 4.99336,
		    "Age": 0.134952
		  },
		  {
		    "Year": 2012,
		    "Doy": 86,
		    "SCF": 46.1209,
		    "Cloud": 73.0097,
		    "Age": 0.861023
		  },
		  {
		    "Year": 2012,
		    "Doy": 87,
		    "SCF": 44.1682,
		    "Cloud": 57.0415,
		    "Age": 1.08017
		  },
		  {
		    "Year": 2012,
		    "Doy": 88,
		    "SCF": 41.7015,
		    "Cloud": 61.2021,
		    "Age": 1.33368
		  },
		  {
		    "Year": 2012,
		    "Doy": 89,
		    "SCF": 40.707,
		    "Cloud": 40.797,
		    "Age": 0.912459
		  },
		  {
		    "Year": 2012,
		    "Doy": 90,
		    "SCF": 38.4258,
		    "Cloud": 66.6832,
		    "Age": 1.40425
		  },
		  {
		    "Year": 2012,
		    "Doy": 91,
		    "SCF": 38.1426,
		    "Cloud": 31.0751,
		    "Age": 0.794877
		  },
		  {
		    "Year": 2012,
		    "Doy": 92,
		    "SCF": 39.7368,
		    "Cloud": 60.4664,
		    "Age": 1.1645
		  },
		  {
		    "Year": 2012,
		    "Doy": 93,
		    "SCF": 39.753,
		    "Cloud": 64.2525,
		    "Age": 1.4921
		  },
		  {
		    "Year": 2012,
		    "Doy": 94,
		    "SCF": 40.5631,
		    "Cloud": 9.81082,
		    "Age": 0.458179
		  },
		  {
		    "Year": 2012,
		    "Doy": 95,
		    "SCF": 39.3166,
		    "Cloud": 9.0608,
		    "Age": 0.343581
		  },
		  {
		    "Year": 2012,
		    "Doy": 96,
		    "SCF": 50.0849,
		    "Cloud": 99.4208,
		    "Age": 1.33765
		  },
		  {
		    "Year": 2012,
		    "Doy": 97,
		    "SCF": 50.1034,
		    "Cloud": 89.9123,
		    "Age": 2.10954
		  },
		  {
		    "Year": 2012,
		    "Doy": 98,
		    "SCF": 51.0464,
		    "Cloud": 43.7073,
		    "Age": 1.46042
		  },
		  {
		    "Year": 2012,
		    "Doy": 99,
		    "SCF": 58.9007,
		    "Cloud": 83.003,
		    "Age": 2.17951
		  },
		  {
		    "Year": 2012,
		    "Doy": 100,
		    "SCF": 58.3149,
		    "Cloud": 99.6381,
		    "Age": 3.17531
		  },
		  {
		    "Year": 2012,
		    "Doy": 101,
		    "SCF": 58.0407,
		    "Cloud": 97.4639,
		    "Age": 4.08873
		  },
		  {
		    "Year": 2012,
		    "Doy": 102,
		    "SCF": 56.8443,
		    "Cloud": 99.8701,
		    "Age": 5.08247
		  },
		  {
		    "Year": 2012,
		    "Doy": 103,
		    "SCF": 56.8371,
		    "Cloud": 85.1453,
		    "Age": 5.18718
		  },
		  {
		    "Year": 2012,
		    "Doy": 104,
		    "SCF": 56.9052,
		    "Cloud": 76.2846,
		    "Age": 4.98888
		  },
		  {
		    "Year": 2012,
		    "Doy": 105,
		    "SCF": 57.7612,
		    "Cloud": 63.3727,
		    "Age": 4.19894
		  },
		  {
		    "Year": 2012,
		    "Doy": 106,
		    "SCF": 58.9643,
		    "Cloud": 99.6968,
		    "Age": 5.18644
		  },
		  {
		    "Year": 2012,
		    "Doy": 107,
		    "SCF": 58.89,
		    "Cloud": 84.7781,
		    "Age": 5.36577
		  },
		  {
		    "Year": 2012,
		    "Doy": 108,
		    "SCF": 57.9492,
		    "Cloud": 61.9,
		    "Age": 4.08652
		  },
		  {
		    "Year": 2012,
		    "Doy": 109,
		    "SCF": 56.5393,
		    "Cloud": 99.1065,
		    "Age": 5.03338
		  },
		  {
		    "Year": 2012,
		    "Doy": 110,
		    "SCF": 56.3362,
		    "Cloud": 99.1093,
		    "Age": 6.00628
		  },
		  {
		    "Year": 2012,
		    "Doy": 111,
		    "SCF": 56.1371,
		    "Cloud": 98.9051,
		    "Age": 6.92694
		  },
		  {
		    "Year": 2012,
		    "Doy": 112,
		    "SCF": 56.1974,
		    "Cloud": 83.6563,
		    "Age": 7.10496
		  },
		  {
		    "Year": 2012,
		    "Doy": 113,
		    "SCF": 54.932,
		    "Cloud": 99.8073,
		    "Age": 8.10463
		  },
		  {
		    "Year": 2012,
		    "Doy": 114,
		    "SCF": 54.9316,
		    "Cloud": 97.726,
		    "Age": 8.92041
		  },
		  {
		    "Year": 2012,
		    "Doy": 115,
		    "SCF": 54.4429,
		    "Cloud": 72.2899,
		    "Age": 7.76288
		  },
		  {
		    "Year": 2012,
		    "Doy": 116,
		    "SCF": 54.1974,
		    "Cloud": 99.2874,
		    "Age": 8.68739
		  },
		  {
		    "Year": 2012,
		    "Doy": 117,
		    "SCF": 54.1953,
		    "Cloud": 99.8394,
		    "Age": 9.68021
		  },
		  {
		    "Year": 2012,
		    "Doy": 118,
		    "SCF": 54.0453,
		    "Cloud": 96.7919,
		    "Age": 10.354
		  },
		  {
		    "Year": 2012,
		    "Doy": 119,
		    "SCF": 53.9516,
		    "Cloud": 20.477,
		    "Age": 2.1878
		  },
		  {
		    "Year": 2012,
		    "Doy": 120,
		    "SCF": 51.7805,
		    "Cloud": 0.639444,
		    "Age": 0.0459582
		  },
		  {
		    "Year": 2012,
		    "Doy": 121,
		    "SCF": 47.0294,
		    "Cloud": 83.3951,
		    "Age": 0.868413
		  },
		  {
		    "Year": 2012,
		    "Doy": 122,
		    "SCF": 46.5983,
		    "Cloud": 2.88046,
		    "Age": 0.0595363
		  },
		  {
		    "Year": 2012,
		    "Doy": 123,
		    "SCF": 42.8047,
		    "Cloud": 32.8135,
		    "Age": 0.365938
		  },
		  {
		    "Year": 2012,
		    "Doy": 124,
		    "SCF": 42.7027,
		    "Cloud": 46.1803,
		    "Age": 0.707894
		  },
		  {
		    "Year": 2012,
		    "Doy": 125,
		    "SCF": 44.6922,
		    "Cloud": 99.8219,
		    "Age": 1.70371
		  },
		  {
		    "Year": 2012,
		    "Doy": 126,
		    "SCF": 44.6893,
		    "Cloud": 57.5091,
		    "Age": 1.48231
		  },
		  {
		    "Year": 2012,
		    "Doy": 127,
		    "SCF": 39.6859,
		    "Cloud": 34.5713,
		    "Age": 0.803845
		  },
		  {
		    "Year": 2012,
		    "Doy": 128,
		    "SCF": 37.4397,
		    "Cloud": 58.0703,
		    "Age": 1.11872
		  },
		  {
		    "Year": 2012,
		    "Doy": 129,
		    "SCF": 34.8343,
		    "Cloud": 92.3581,
		    "Age": 1.98177
		  },
		  {
		    "Year": 2012,
		    "Doy": 130,
		    "SCF": 34.8337,
		    "Cloud": 89.9485,
		    "Age": 2.66881
		  },
		  {
		    "Year": 2012,
		    "Doy": 131,
		    "SCF": 33.539,
		    "Cloud": 99.8978,
		    "Age": 3.66305
		  },
		  {
		    "Year": 2012,
		    "Doy": 132,
		    "SCF": 33.539,
		    "Cloud": 99.8204,
		    "Age": 4.66262
		  },
		  {
		    "Year": 2012,
		    "Doy": 133,
		    "SCF": 33.5319,
		    "Cloud": 25.9623,
		    "Age": 1.51119
		  },
		  {
		    "Year": 2012,
		    "Doy": 134,
		    "SCF": 22.7661,
		    "Cloud": 100,
		    "Age": 2.51034
		  },
		  {
		    "Year": 2012,
		    "Doy": 135,
		    "SCF": 22.7661,
		    "Cloud": 81.0673,
		    "Age": 2.86936
		  },
		  {
		    "Year": 2012,
		    "Doy": 136,
		    "SCF": 22.6595,
		    "Cloud": 91.3676,
		    "Age": 3.55334
		  },
		  {
		    "Year": 2012,
		    "Doy": 137,
		    "SCF": 21.9693,
		    "Cloud": 93.6609,
		    "Age": 4.33279
		  },
		  {
		    "Year": 2012,
		    "Doy": 138,
		    "SCF": 21.9404,
		    "Cloud": 95.645,
		    "Age": 5.18379
		  },
		  {
		    "Year": 2012,
		    "Doy": 139,
		    "SCF": 21.3101,
		    "Cloud": 80.7489,
		    "Age": 5.16987
		  },
		  {
		    "Year": 2012,
		    "Doy": 140,
		    "SCF": 19.0258,
		    "Cloud": 96.4768,
		    "Age": 5.96556
		  },
		  {
		    "Year": 2012,
		    "Doy": 141,
		    "SCF": 17.9875,
		    "Cloud": 70.4653,
		    "Age": 5.40468
		  },
		  {
		    "Year": 2012,
		    "Doy": 142,
		    "SCF": 17.4712,
		    "Cloud": 79.2511,
		    "Age": 4.97063
		  },
		  {
		    "Year": 2012,
		    "Doy": 143,
		    "SCF": 16.8786,
		    "Cloud": 77.3107,
		    "Age": 5.25929
		  },
		  {
		    "Year": 2012,
		    "Doy": 144,
		    "SCF": 16.8614,
		    "Cloud": 13.1781,
		    "Age": 1.04885
		  },
		  {
		    "Year": 2012,
		    "Doy": 145,
		    "SCF": 15.2241,
		    "Cloud": 10.0381,
		    "Age": 0.512319
		  },
		  {
		    "Year": 2012,
		    "Doy": 146,
		    "SCF": 13.0616,
		    "Cloud": 19.1103,
		    "Age": 0.492179
		  },
		  {
		    "Year": 2012,
		    "Doy": 147,
		    "SCF": 12.3212,
		    "Cloud": 6.50602,
		    "Age": 0.163359
		  },
		  {
		    "Year": 2012,
		    "Doy": 148,
		    "SCF": 11.9272,
		    "Cloud": 5.36643,
		    "Age": 0.141488
		  },
		  {
		    "Year": 2012,
		    "Doy": 149,
		    "SCF": 12.4751,
		    "Cloud": 70.5662,
		    "Age": 0.840155
		  },
		  {
		    "Year": 2012,
		    "Doy": 150,
		    "SCF": 12.1503,
		    "Cloud": 32.7813,
		    "Age": 0.66135
		  },
		  {
		    "Year": 2012,
		    "Doy": 151,
		    "SCF": 12.2465,
		    "Cloud": 59.0295,
		    "Age": 1.04508
		  },
		  {
		    "Year": 2012,
		    "Doy": 152,
		    "SCF": 11.81,
		    "Cloud": 88.0169,
		    "Age": 1.81047
		  },
		  {
		    "Year": 2012,
		    "Doy": 153,
		    "SCF": 11.5522,
		    "Cloud": 89.0213,
		    "Age": 2.49812
		  },
		  {
		    "Year": 2012,
		    "Doy": 154,
		    "SCF": 11.5234,
		    "Cloud": 74.9299,
		    "Age": 2.63782
		  },
		  {
		    "Year": 2012,
		    "Doy": 155,
		    "SCF": 11.5863,
		    "Cloud": 98.9414,
		    "Age": 3.60549
		  },
		  {
		    "Year": 2012,
		    "Doy": 156,
		    "SCF": 11.3328,
		    "Cloud": 67.6436,
		    "Age": 3.2356
		  },
		  {
		    "Year": 2012,
		    "Doy": 157,
		    "SCF": 9.48799,
		    "Cloud": 87.4138,
		    "Age": 3.75419
		  },
		  {
		    "Year": 2012,
		    "Doy": 158,
		    "SCF": 8.33367,
		    "Cloud": 60.9908,
		    "Age": 3.00288
		  },
		  {
		    "Year": 2012,
		    "Doy": 159,
		    "SCF": 8.05741,
		    "Cloud": 83.6241,
		    "Age": 3.48027
		  },
		  {
		    "Year": 2012,
		    "Doy": 160,
		    "SCF": 7.99036,
		    "Cloud": 64.6327,
		    "Age": 3.05784
		  },
		  {
		    "Year": 2012,
		    "Doy": 161,
		    "SCF": 8.60268,
		    "Cloud": 95.246,
		    "Age": 3.94295
		  },
		  {
		    "Year": 2012,
		    "Doy": 162,
		    "SCF": 8.17508,
		    "Cloud": 77.0864,
		    "Age": 3.98892
		  },
		  {
		    "Year": 2012,
		    "Doy": 163,
		    "SCF": 7.4068,
		    "Cloud": 74.1186,
		    "Age": 3.94751
		  },
		  {
		    "Year": 2012,
		    "Doy": 164,
		    "SCF": 5.54693,
		    "Cloud": 99.115,
		    "Age": 4.93215
		  },
		  {
		    "Year": 2012,
		    "Doy": 165,
		    "SCF": 5.48605,
		    "Cloud": 96.2043,
		    "Age": 5.75084
		  },
		  {
		    "Year": 2012,
		    "Doy": 166,
		    "SCF": 5.09854,
		    "Cloud": 94.8754,
		    "Age": 6.45056
		  },
		  {
		    "Year": 2012,
		    "Doy": 167,
		    "SCF": 4.8296,
		    "Cloud": 79.275,
		    "Age": 6.00886
		  },
		  {
		    "Year": 2012,
		    "Doy": 168,
		    "SCF": 4.06861,
		    "Cloud": 98.8394,
		    "Age": 6.96196
		  },
		  {
		    "Year": 2012,
		    "Doy": 169,
		    "SCF": 3.85545,
		    "Cloud": 94.3426,
		    "Age": 7.58846
		  },
		  {
		    "Year": 2012,
		    "Doy": 170,
		    "SCF": 3.33984,
		    "Cloud": 99.3751,
		    "Age": 8.55252
		  },
		  {
		    "Year": 2012,
		    "Doy": 171,
		    "SCF": 3.3001,
		    "Cloud": 22.3689,
		    "Age": 2.38236
		  },
		  {
		    "Year": 2012,
		    "Doy": 172,
		    "SCF": 3.76777,
		    "Cloud": 88.0226,
		    "Age": 3.07374
		  },
		  {
		    "Year": 2012,
		    "Doy": 173,
		    "SCF": 3.73478,
		    "Cloud": 51.0226,
		    "Age": 2.62469
		  },
		  {
		    "Year": 2012,
		    "Doy": 174,
		    "SCF": 4.33904,
		    "Cloud": 94.7544,
		    "Age": 3.47093
		  },
		  {
		    "Year": 2012,
		    "Doy": 175,
		    "SCF": 4.11099,
		    "Cloud": 99.6657,
		    "Age": 4.46757
		  },
		  {
		    "Year": 2012,
		    "Doy": 176,
		    "SCF": 4.10465,
		    "Cloud": 92.5876,
		    "Age": 5.19405
		  },
		  {
		    "Year": 2012,
		    "Doy": 177,
		    "SCF": 3.71813,
		    "Cloud": 78.81,
		    "Age": 4.95156
		  },
		  {
		    "Year": 2012,
		    "Doy": 178,
		    "SCF": 2.95333,
		    "Cloud": 85.3256,
		    "Age": 5.25849
		  },
		  {
		    "Year": 2012,
		    "Doy": 179,
		    "SCF": 2.87509,
		    "Cloud": 46.9029,
		    "Age": 3.09341
		  },
		  {
		    "Year": 2012,
		    "Doy": 180,
		    "SCF": 2.84815,
		    "Cloud": 28.4401,
		    "Age": 1.34843
		  },
		  {
		    "Year": 2012,
		    "Doy": 181,
		    "SCF": 3.63547,
		    "Cloud": 94.6347,
		    "Age": 2.34074
		  },
		  {
		    "Year": 2012,
		    "Doy": 182,
		    "SCF": 3.31735,
		    "Cloud": 95.699,
		    "Age": 3.2305
		  },
		  {
		    "Year": 2012,
		    "Doy": 183,
		    "SCF": 3.24895,
		    "Cloud": 77.7101,
		    "Age": 3.34158
		  },
		  {
		    "Year": 2012,
		    "Doy": 184,
		    "SCF": 3.00453,
		    "Cloud": 94.6119,
		    "Age": 4.15554
		  },
		  {
		    "Year": 2012,
		    "Doy": 185,
		    "SCF": 2.97781,
		    "Cloud": 68.8795,
		    "Age": 3.70783
		  },
		  {
		    "Year": 2012,
		    "Doy": 186,
		    "SCF": 3.36931,
		    "Cloud": 89.0877,
		    "Age": 4.20313
		  },
		  {
		    "Year": 2012,
		    "Doy": 187,
		    "SCF": 3.85503,
		    "Cloud": 73.0993,
		    "Age": 3.97683
		  },
		  {
		    "Year": 2012,
		    "Doy": 188,
		    "SCF": 4.68849,
		    "Cloud": 86.72,
		    "Age": 4.28933
		  },
		  {
		    "Year": 2012,
		    "Doy": 189,
		    "SCF": 5.10115,
		    "Cloud": 99.7227,
		    "Age": 5.28925
		  },
		  {
		    "Year": 2012,
		    "Doy": 190,
		    "SCF": 5.10115,
		    "Cloud": 99.2412,
		    "Age": 6.26577
		  },
		  {
		    "Year": 2012,
		    "Doy": 191,
		    "SCF": 5.05157,
		    "Cloud": 98.0373,
		    "Age": 7.07709
		  },
		  {
		    "Year": 2012,
		    "Doy": 192,
		    "SCF": 4.35996,
		    "Cloud": 87.8956,
		    "Age": 7.27434
		  },
		  {
		    "Year": 2012,
		    "Doy": 193,
		    "SCF": 5.14255,
		    "Cloud": 99.8322,
		    "Age": 8.26641
		  },
		  {
		    "Year": 2012,
		    "Doy": 194,
		    "SCF": 5.13752,
		    "Cloud": 97.0252,
		    "Age": 9.01436
		  },
		  {
		    "Year": 2012,
		    "Doy": 195,
		    "SCF": 3.58742,
		    "Cloud": 95.0868,
		    "Age": 9.55428
		  },
		  {
		    "Year": 2012,
		    "Doy": 196,
		    "SCF": 2.28457,
		    "Cloud": 87.9898,
		    "Age": 9.31732
		  },
		  {
		    "Year": 2012,
		    "Doy": 197,
		    "SCF": 2.02541,
		    "Cloud": 72.4868,
		    "Age": 7.57432
		  },
		  {
		    "Year": 2012,
		    "Doy": 198,
		    "SCF": 2.00843,
		    "Cloud": 80.9202,
		    "Age": 7.24787
		  },
		  {
		    "Year": 2012,
		    "Doy": 199,
		    "SCF": 2.02191,
		    "Cloud": 98.2149,
		    "Age": 8.15274
		  },
		  {
		    "Year": 2012,
		    "Doy": 200,
		    "SCF": 2.03223,
		    "Cloud": 93.9232,
		    "Age": 8.7356
		  },
		  {
		    "Year": 2012,
		    "Doy": 201,
		    "SCF": 1.95893,
		    "Cloud": 97.5266,
		    "Age": 9.53203
		  },
		  {
		    "Year": 2012,
		    "Doy": 202,
		    "SCF": 1.84894,
		    "Cloud": 70.3169,
		    "Age": 7.71151
		  },
		  {
		    "Year": 2012,
		    "Doy": 203,
		    "SCF": 1.68341,
		    "Cloud": 54.9839,
		    "Age": 5.4527
		  },
		  {
		    "Year": 2012,
		    "Doy": 204,
		    "SCF": 3.14738,
		    "Cloud": 89.7056,
		    "Age": 6.06219
		  },
		  {
		    "Year": 2012,
		    "Doy": 205,
		    "SCF": 0.617277,
		    "Cloud": 98.1764,
		    "Age": 6.945
		  },
		  {
		    "Year": 2012,
		    "Doy": 206,
		    "SCF": 0.629055,
		    "Cloud": 93.4757,
		    "Age": 7.64337
		  },
		  {
		    "Year": 2012,
		    "Doy": 207,
		    "SCF": 0.615762,
		    "Cloud": 97.8493,
		    "Age": 8.45037
		  },
		  {
		    "Year": 2012,
		    "Doy": 208,
		    "SCF": 0.429371,
		    "Cloud": 25.198,
		    "Age": 2.14735
		  },
		  {
		    "Year": 2012,
		    "Doy": 209,
		    "SCF": 0.549724,
		    "Cloud": 23.7164,
		    "Age": 0.698793
		  },
		  {
		    "Year": 2012,
		    "Doy": 210,
		    "SCF": 0.818895,
		    "Cloud": 99.8671,
		    "Age": 1.69663
		  },
		  {
		    "Year": 2012,
		    "Doy": 211,
		    "SCF": 0.686569,
		    "Cloud": 15.3538,
		    "Age": 0.569947
		  },
		  {
		    "Year": 2012,
		    "Doy": 212,
		    "SCF": 1.77037,
		    "Cloud": 43.7126,
		    "Age": 0.784621
		  },
		  {
		    "Year": 2012,
		    "Doy": 213,
		    "SCF": 3.80522,
		    "Cloud": 86.3999,
		    "Age": 1.58754
		  },
		  {
		    "Year": 2012,
		    "Doy": 214,
		    "SCF": 1.6323,
		    "Cloud": 49.1143,
		    "Age": 1.38289
		  },
		  {
		    "Year": 2012,
		    "Doy": 215,
		    "SCF": 3.04715,
		    "Cloud": 98.8905,
		    "Age": 2.35011
		  },
		  {
		    "Year": 2012,
		    "Doy": 216,
		    "SCF": 3.02766,
		    "Cloud": 77.6602,
		    "Age": 2.71935
		  },
		  {
		    "Year": 2012,
		    "Doy": 217,
		    "SCF": 3.17587,
		    "Cloud": 77.0629,
		    "Age": 3.1207
		  },
		  {
		    "Year": 2012,
		    "Doy": 218,
		    "SCF": 3.14944,
		    "Cloud": 76.5317,
		    "Age": 3.53967
		  },
		  {
		    "Year": 2012,
		    "Doy": 219,
		    "SCF": 1.52091,
		    "Cloud": 97.7403,
		    "Age": 4.42006
		  },
		  {
		    "Year": 2012,
		    "Doy": 220,
		    "SCF": 1.50888,
		    "Cloud": 97.3463,
		    "Age": 5.2949
		  },
		  {
		    "Year": 2012,
		    "Doy": 221,
		    "SCF": 1.48919,
		    "Cloud": 60.2238,
		    "Age": 3.8495
		  },
		  {
		    "Year": 2012,
		    "Doy": 222,
		    "SCF": 0.929335,
		    "Cloud": 77.8397,
		    "Age": 3.82429
		  },
		  {
		    "Year": 2012,
		    "Doy": 223,
		    "SCF": 0.282596,
		    "Cloud": 78.7173,
		    "Age": 4.04597
		  },
		  {
		    "Year": 2012,
		    "Doy": 224,
		    "SCF": 0.23664,
		    "Cloud": 7.69276,
		    "Age": 0.372793
		  },
		  {
		    "Year": 2012,
		    "Doy": 225,
		    "SCF": 0.323617,
		    "Cloud": 10.2238,
		    "Age": 0.197148
		  },
		  {
		    "Year": 2012,
		    "Doy": 226,
		    "SCF": 0.391193,
		    "Cloud": 38.8096,
		    "Age": 0.514759
		  },
		  {
		    "Year": 2012,
		    "Doy": 227,
		    "SCF": 0.38267,
		    "Cloud": 66.2496,
		    "Age": 1.05537
		  },
		  {
		    "Year": 2012,
		    "Doy": 228,
		    "SCF": 0.327527,
		    "Cloud": 3.0992,
		    "Age": 0.102941
		  },
		  {
		    "Year": 2012,
		    "Doy": 229,
		    "SCF": 0.594213,
		    "Cloud": 69.3358,
		    "Age": 0.784056
		  },
		  {
		    "Year": 2012,
		    "Doy": 230,
		    "SCF": 0.644452,
		    "Cloud": 66.4076,
		    "Age": 1.16817
		  },
		  {
		    "Year": 2012,
		    "Doy": 231,
		    "SCF": 0.665746,
		    "Cloud": 99.1351,
		    "Age": 2.14689
		  },
		  {
		    "Year": 2012,
		    "Doy": 232,
		    "SCF": 0.652597,
		    "Cloud": 11.8811,
		    "Age": 0.427643
		  },
		  {
		    "Year": 2012,
		    "Doy": 233,
		    "SCF": 1.80789,
		    "Cloud": 99.9606,
		    "Age": 1.42753
		  },
		  {
		    "Year": 2012,
		    "Doy": 234,
		    "SCF": 1.80789,
		    "Cloud": 23.9565,
		    "Age": 0.702381
		  },
		  {
		    "Year": 2012,
		    "Doy": 235,
		    "SCF": 4.76501,
		    "Cloud": 88.8642,
		    "Age": 1.52181
		  },
		  {
		    "Year": 2012,
		    "Doy": 236,
		    "SCF": 3.71417,
		    "Cloud": 86.8977,
		    "Age": 2.17637
		  },
		  {
		    "Year": 2012,
		    "Doy": 237,
		    "SCF": 1.40155,
		    "Cloud": 53.2616,
		    "Age": 1.78635
		  },
		  {
		    "Year": 2012,
		    "Doy": 238,
		    "SCF": 1.20964,
		    "Cloud": 65.1283,
		    "Age": 1.89374
		  },
		  {
		    "Year": 2012,
		    "Doy": 239,
		    "SCF": 0.84561,
		    "Cloud": 87.803,
		    "Age": 2.45236
		  },
		  {
		    "Year": 2012,
		    "Doy": 240,
		    "SCF": 0.396489,
		    "Cloud": 1.47811,
		    "Age": 0.108492
		  },
		  {
		    "Year": 2012,
		    "Doy": 241,
		    "SCF": 1.46255,
		    "Cloud": 99.8832,
		    "Age": 1.10749
		  },
		  {
		    "Year": 2012,
		    "Doy": 242,
		    "SCF": 1.38505,
		    "Cloud": 40.5315,
		    "Age": 0.880625
		  },
		  {
		    "Year": 2012,
		    "Doy": 243,
		    "SCF": 2.35631,
		    "Cloud": 72.5689,
		    "Age": 1.36011
		  },
		  {
		    "Year": 2012,
		    "Doy": 244,
		    "SCF": 0.84021,
		    "Cloud": 18.2377,
		    "Age": 0.459223
		  },
		  {
		    "Year": 2012,
		    "Doy": 245,
		    "SCF": 1.25094,
		    "Cloud": 29.2667,
		    "Age": 0.609126
		  },
		  {
		    "Year": 2012,
		    "Doy": 246,
		    "SCF": 1.72288,
		    "Cloud": 73.4342,
		    "Age": 1.07545
		  },
		  {
		    "Year": 2012,
		    "Doy": 247,
		    "SCF": 1.62283,
		    "Cloud": 53.0258,
		    "Age": 1.18785
		  },
		  {
		    "Year": 2012,
		    "Doy": 248,
		    "SCF": 1.4657,
		    "Cloud": 27.9148,
		    "Age": 0.686493
		  },
		  {
		    "Year": 2012,
		    "Doy": 249,
		    "SCF": 2.83091,
		    "Cloud": 24.5983,
		    "Age": 0.480397
		  },
		  {
		    "Year": 2012,
		    "Doy": 250,
		    "SCF": 3.23355,
		    "Cloud": 94.4624,
		    "Age": 1.4111
		  },
		  {
		    "Year": 2012,
		    "Doy": 251,
		    "SCF": 2.85164,
		    "Cloud": 23.5913,
		    "Age": 0.780033
		  },
		  {
		    "Year": 2012,
		    "Doy": 252,
		    "SCF": 3.03722,
		    "Cloud": 27.6387,
		    "Age": 0.618782
		  },
		  {
		    "Year": 2012,
		    "Doy": 253,
		    "SCF": 4.86534,
		    "Cloud": 91.2903,
		    "Age": 1.51064
		  },
		  {
		    "Year": 2012,
		    "Doy": 254,
		    "SCF": 4.61579,
		    "Cloud": 92.6919,
		    "Age": 2.3393
		  },
		  {
		    "Year": 2012,
		    "Doy": 255,
		    "SCF": 4.60318,
		    "Cloud": 95.4474,
		    "Age": 3.19425
		  },
		  {
		    "Year": 2012,
		    "Doy": 256,
		    "SCF": 4.13687,
		    "Cloud": 97.9555,
		    "Age": 4.12461
		  },
		  {
		    "Year": 2012,
		    "Doy": 257,
		    "SCF": 3.78956,
		    "Cloud": 80.0023,
		    "Age": 4.20068
		  },
		  {
		    "Year": 2012,
		    "Doy": 258,
		    "SCF": 4.0041,
		    "Cloud": 50.3857,
		    "Age": 2.78545
		  },
		  {
		    "Year": 2012,
		    "Doy": 259,
		    "SCF": 3.57729,
		    "Cloud": 28.151,
		    "Age": 1.63434
		  },
		  {
		    "Year": 2012,
		    "Doy": 260,
		    "SCF": 4.82202,
		    "Cloud": 90.2853,
		    "Age": 2.45157
		  },
		  {
		    "Year": 2012,
		    "Doy": 261,
		    "SCF": 4.68946,
		    "Cloud": 44.7565,
		    "Age": 1.77703
		  },
		  {
		    "Year": 2012,
		    "Doy": 262,
		    "SCF": 5.71022,
		    "Cloud": 67.9402,
		    "Age": 1.97516
		  },
		  {
		    "Year": 2012,
		    "Doy": 263,
		    "SCF": 3.81765,
		    "Cloud": 27.8934,
		    "Age": 1.05313
		  },
		  {
		    "Year": 2012,
		    "Doy": 264,
		    "SCF": 4.3603,
		    "Cloud": 67.2284,
		    "Age": 1.46105
		  },
		  {
		    "Year": 2012,
		    "Doy": 265,
		    "SCF": 4.21874,
		    "Cloud": 41.37,
		    "Age": 1.08244
		  },
		  {
		    "Year": 2012,
		    "Doy": 266,
		    "SCF": 4.97137,
		    "Cloud": 73.282,
		    "Age": 1.4092
		  },
		  {
		    "Year": 2012,
		    "Doy": 267,
		    "SCF": 5.79049,
		    "Cloud": 56.095,
		    "Age": 1.35235
		  },
		  {
		    "Year": 2012,
		    "Doy": 268,
		    "SCF": 12.0047,
		    "Cloud": 63.0048,
		    "Age": 1.32491
		  },
		  {
		    "Year": 2012,
		    "Doy": 269,
		    "SCF": 13.1621,
		    "Cloud": 99.1077,
		    "Age": 2.30231
		  },
		  {
		    "Year": 2012,
		    "Doy": 270,
		    "SCF": 12.8575,
		    "Cloud": 95.4553,
		    "Age": 3.1785
		  },
		  {
		    "Year": 2012,
		    "Doy": 271,
		    "SCF": 12.6344,
		    "Cloud": 27.9049,
		    "Age": 1.08735
		  },
		  {
		    "Year": 2012,
		    "Doy": 272,
		    "SCF": 8.99413,
		    "Cloud": 30.5522,
		    "Age": 0.859171
		  },
		  {
		    "Year": 2012,
		    "Doy": 273,
		    "SCF": 9.4435,
		    "Cloud": 56.4445,
		    "Age": 1.15088
		  },
		  {
		    "Year": 2012,
		    "Doy": 274,
		    "SCF": 7.69173,
		    "Cloud": 14.6957,
		    "Age": 0.614065
		  },
		  {
		    "Year": 2012,
		    "Doy": 275,
		    "SCF": 10.4844,
		    "Cloud": 85.6079,
		    "Age": 1.32799
		  },
		  {
		    "Year": 2012,
		    "Doy": 276,
		    "SCF": 10.1457,
		    "Cloud": 81.4506,
		    "Age": 1.89048
		  },
		  {
		    "Year": 2012,
		    "Doy": 277,
		    "SCF": 8.85155,
		    "Cloud": 99.5314,
		    "Age": 2.87666
		  },
		  {
		    "Year": 2012,
		    "Doy": 278,
		    "SCF": 8.4915,
		    "Cloud": 65.5763,
		    "Age": 2.59583
		  },
		  {
		    "Year": 2012,
		    "Doy": 279,
		    "SCF": 6.68392,
		    "Cloud": 10.5342,
		    "Age": 0.469611
		  },
		  {
		    "Year": 2012,
		    "Doy": 280,
		    "SCF": 8.96509,
		    "Cloud": 35.6781,
		    "Age": 0.718574
		  },
		  {
		    "Year": 2012,
		    "Doy": 281,
		    "SCF": 15.9609,
		    "Cloud": 98.2481,
		    "Age": 1.69382
		  },
		  {
		    "Year": 2012,
		    "Doy": 282,
		    "SCF": 15.956,
		    "Cloud": 99.8569,
		    "Age": 2.68985
		  },
		  {
		    "Year": 2012,
		    "Doy": 283,
		    "SCF": 15.9196,
		    "Cloud": 6.3449,
		    "Age": 0.3311
		  },
		  {
		    "Year": 2012,
		    "Doy": 284,
		    "SCF": 12.5536,
		    "Cloud": 37.9862,
		    "Age": 0.588416
		  },
		  {
		    "Year": 2012,
		    "Doy": 285,
		    "SCF": 12.6463,
		    "Cloud": 8.08746,
		    "Age": 0.212097
		  },
		  {
		    "Year": 2012,
		    "Doy": 286,
		    "SCF": 17.5143,
		    "Cloud": 79.1116,
		    "Age": 0.968467
		  },
		  {
		    "Year": 2012,
		    "Doy": 287,
		    "SCF": 23.5633,
		    "Cloud": 99.9506,
		    "Age": 1.96532
		  },
		  {
		    "Year": 2012,
		    "Doy": 288,
		    "SCF": 29.618,
		    "Cloud": 99.2173,
		    "Age": 2.94353
		  },
		  {
		    "Year": 2012,
		    "Doy": 289,
		    "SCF": 35.6674,
		    "Cloud": 97.0347,
		    "Age": 3.82851
		  },
		  {
		    "Year": 2012,
		    "Doy": 290,
		    "SCF": 40.9894,
		    "Cloud": 91.3393,
		    "Age": 4.4277
		  },
		  {
		    "Year": 2012,
		    "Doy": 291,
		    "SCF": 45.3433,
		    "Cloud": 88.7067,
		    "Age": 4.85774
		  },
		  {
		    "Year": 2012,
		    "Doy": 292,
		    "SCF": 49.3245,
		    "Cloud": 69.0958,
		    "Age": 4.03909
		  },
		  {
		    "Year": 2012,
		    "Doy": 293,
		    "SCF": 52.0506,
		    "Cloud": 39.9532,
		    "Age": 2.34277
		  },
		  {
		    "Year": 2012,
		    "Doy": 294,
		    "SCF": 51.5485,
		    "Cloud": 99.4947,
		    "Age": 3.32552
		  },
		  {
		    "Year": 2012,
		    "Doy": 295,
		    "SCF": 51.3765,
		    "Cloud": 92.5185,
		    "Age": 4.03991
		  },
		  {
		    "Year": 2012,
		    "Doy": 296,
		    "SCF": 50.9795,
		    "Cloud": 72.877,
		    "Age": 4.07308
		  },
		  {
		    "Year": 2012,
		    "Doy": 297,
		    "SCF": 50.7928,
		    "Cloud": 26.4656,
		    "Age": 2.11802
		  },
		  {
		    "Year": 2012,
		    "Doy": 298,
		    "SCF": 47.936,
		    "Cloud": 100,
		    "Age": 3.11715
		  },
		  {
		    "Year": 2012,
		    "Doy": 299,
		    "SCF": 45.6834,
		    "Cloud": 20.9173,
		    "Age": 0.67582
		  },
		  {
		    "Year": 2012,
		    "Doy": 300,
		    "SCF": 42.9978,
		    "Cloud": 33.4302,
		    "Age": 0.750321
		  },
		  {
		    "Year": 2012,
		    "Doy": 301,
		    "SCF": 44.2182,
		    "Cloud": 17.3392,
		    "Age": 0.561151
		  },
		  {
		    "Year": 2012,
		    "Doy": 302,
		    "SCF": 55.2835,
		    "Cloud": 54.5103,
		    "Age": 0.960023
		  },
		  {
		    "Year": 2012,
		    "Doy": 303,
		    "SCF": 73.0874,
		    "Cloud": 98.7439,
		    "Age": 1.93621
		  },
		  {
		    "Year": 2012,
		    "Doy": 304,
		    "SCF": 91.4173,
		    "Cloud": 5.34823,
		    "Age": 0.264144
		  },
		  {
		    "Year": 2012,
		    "Doy": 305,
		    "SCF": 87.8398,
		    "Cloud": 100,
		    "Age": 1.26293
		  },
		  {
		    "Year": 2012,
		    "Doy": 306,
		    "SCF": 85.0709,
		    "Cloud": 100,
		    "Age": 2.26293
		  },
		  {
		    "Year": 2012,
		    "Doy": 307,
		    "SCF": 82.3126,
		    "Cloud": 96.252,
		    "Age": 3.1476
		  },
		  {
		    "Year": 2012,
		    "Doy": 308,
		    "SCF": 79.7626,
		    "Cloud": 96.5627,
		    "Age": 4.00168
		  },
		  {
		    "Year": 2012,
		    "Doy": 309,
		    "SCF": 77.5731,
		    "Cloud": 86.6416,
		    "Age": 4.35191
		  },
		  {
		    "Year": 2012,
		    "Doy": 310,
		    "SCF": 76.1358,
		    "Cloud": 71.5444,
		    "Age": 3.78251
		  },
		  {
		    "Year": 2012,
		    "Doy": 311,
		    "SCF": 74.025,
		    "Cloud": 99.5048,
		    "Age": 4.7581
		  },
		  {
		    "Year": 2012,
		    "Doy": 312,
		    "SCF": 72.1708,
		    "Cloud": 87.2706,
		    "Age": 5.14065
		  },
		  {
		    "Year": 2012,
		    "Doy": 313,
		    "SCF": 70.5699,
		    "Cloud": 84.7958,
		    "Age": 5.18353
		  },
		  {
		    "Year": 2012,
		    "Doy": 314,
		    "SCF": 69.3345,
		    "Cloud": 100,
		    "Age": 6.183
		  },
		  {
		    "Year": 2012,
		    "Doy": 315,
		    "SCF": 68.1684,
		    "Cloud": 96.493,
		    "Age": 6.96203
		  },
		  {
		    "Year": 2012,
		    "Doy": 316,
		    "SCF": 67.164,
		    "Cloud": 90.7831,
		    "Age": 7.18092
		  },
		  {
		    "Year": 2012,
		    "Doy": 317,
		    "SCF": 65.804,
		    "Cloud": 49.1244,
		    "Age": 3.82214
		  },
		  {
		    "Year": 2012,
		    "Doy": 318,
		    "SCF": 64.1875,
		    "Cloud": 67.5346,
		    "Age": 3.1971
		  },
		  {
		    "Year": 2012,
		    "Doy": 319,
		    "SCF": 62.7437,
		    "Cloud": 69.4808,
		    "Age": 2.95055
		  },
		  {
		    "Year": 2012,
		    "Doy": 320,
		    "SCF": 61.4603,
		    "Cloud": 34.7649,
		    "Age": 1.52141
		  },
		  {
		    "Year": 2012,
		    "Doy": 321,
		    "SCF": 62.2277,
		    "Cloud": 79.294,
		    "Age": 1.89049
		  },
		  {
		    "Year": 2012,
		    "Doy": 322,
		    "SCF": 63.9809,
		    "Cloud": 99.9782,
		    "Age": 2.88961
		  },
		  {
		    "Year": 2012,
		    "Doy": 323,
		    "SCF": 66.3141,
		    "Cloud": 22.2671,
		    "Age": 0.99049
		  },
		  {
		    "Year": 2012,
		    "Doy": 324,
		    "SCF": 64.2845,
		    "Cloud": 96.8793,
		    "Age": 1.88964
		  },
		  {
		    "Year": 2012,
		    "Doy": 325,
		    "SCF": 63.2758,
		    "Cloud": 72.12,
		    "Age": 2.08394
		  },
		  {
		    "Year": 2012,
		    "Doy": 326,
		    "SCF": 63.2013,
		    "Cloud": 99.7168,
		    "Age": 3.07477
		  },
		  {
		    "Year": 2012,
		    "Doy": 327,
		    "SCF": 63.3067,
		    "Cloud": 92.7421,
		    "Age": 3.76318
		  },
		  {
		    "Year": 2012,
		    "Doy": 328,
		    "SCF": 64.181,
		    "Cloud": 99.9898,
		    "Age": 4.76282
		  },
		  {
		    "Year": 2012,
		    "Doy": 329,
		    "SCF": 65.3985,
		    "Cloud": 29.8348,
		    "Age": 1.89201
		  },
		  {
		    "Year": 2012,
		    "Doy": 330,
		    "SCF": 66.8951,
		    "Cloud": 100,
		    "Age": 2.89112
		  },
		  {
		    "Year": 2012,
		    "Doy": 331,
		    "SCF": 68.7322,
		    "Cloud": 98.3779,
		    "Age": 3.85078
		  },
		  {
		    "Year": 2012,
		    "Doy": 332,
		    "SCF": 70.3736,
		    "Cloud": 93.3012,
		    "Age": 4.56665
		  },
		  {
		    "Year": 2012,
		    "Doy": 333,
		    "SCF": 72.5647,
		    "Cloud": 94.1041,
		    "Age": 5.22825
		  },
		  {
		    "Year": 2012,
		    "Doy": 334,
		    "SCF": 74.8051,
		    "Cloud": 90.2851,
		    "Age": 5.63991
		  },
		  {
		    "Year": 2012,
		    "Doy": 335,
		    "SCF": 77.5447,
		    "Cloud": 77.8962,
		    "Age": 5.15807
		  },
		  {
		    "Year": 2012,
		    "Doy": 336,
		    "SCF": 80.1417,
		    "Cloud": 93.9371,
		    "Age": 5.79937
		  },
		  {
		    "Year": 2012,
		    "Doy": 337,
		    "SCF": 84.0243,
		    "Cloud": 18.2376,
		    "Age": 1.37012
		  },
		  {
		    "Year": 2012,
		    "Doy": 338,
		    "SCF": 87.1237,
		    "Cloud": 13.1913,
		    "Age": 0.769539
		  },
		  {
		    "Year": 2012,
		    "Doy": 339,
		    "SCF": 87.0058,
		    "Cloud": 13.3592,
		    "Age": 0.631286
		  },
		  {
		    "Year": 2012,
		    "Doy": 340,
		    "SCF": 85.0208,
		    "Cloud": 37.0699,
		    "Age": 0.787828
		  },
		  {
		    "Year": 2012,
		    "Doy": 341,
		    "SCF": 86.5708,
		    "Cloud": 15.0672,
		    "Age": 0.576967
		  },
		  {
		    "Year": 2012,
		    "Doy": 342,
		    "SCF": 85.8167,
		    "Cloud": 50.6204,
		    "Age": 0.96741
		  },
		  {
		    "Year": 2012,
		    "Doy": 343,
		    "SCF": 86.3734,
		    "Cloud": 18.1536,
		    "Age": 0.605655
		  },
		  {
		    "Year": 2012,
		    "Doy": 344,
		    "SCF": 85.0786,
		    "Cloud": 79.224,
		    "Age": 1.22829
		  },
		  {
		    "Year": 2012,
		    "Doy": 345,
		    "SCF": 88.0731,
		    "Cloud": 35.6463,
		    "Age": 0.9196
		  },
		  {
		    "Year": 2012,
		    "Doy": 346,
		    "SCF": 87.7335,
		    "Cloud": 48.533,
		    "Age": 0.999056
		  },
		  {
		    "Year": 2012,
		    "Doy": 347,
		    "SCF": 88.737,
		    "Cloud": 41.6198,
		    "Age": 0.938367
		  },
		  {
		    "Year": 2012,
		    "Doy": 348,
		    "SCF": 85.1048,
		    "Cloud": 78.3352,
		    "Age": 1.52766
		  },
		  {
		    "Year": 2012,
		    "Doy": 349,
		    "SCF": 85.1193,
		    "Cloud": 81.2291,
		    "Age": 2.05649
		  },
		  {
		    "Year": 2012,
		    "Doy": 350,
		    "SCF": 84.8971,
		    "Cloud": 87.5376,
		    "Age": 2.6543
		  },
		  {
		    "Year": 2012,
		    "Doy": 351,
		    "SCF": 85.801,
		    "Cloud": 99.8969,
		    "Age": 3.65028
		  },
		  {
		    "Year": 2012,
		    "Doy": 352,
		    "SCF": 86.7416,
		    "Cloud": 59.1827,
		    "Age": 4.65028
		  },
		  {
		    "Year": 2012,
		    "Doy": 353,
		    "SCF": 87.6895,
		    "Cloud": 94.9973,
		    "Age": 5.35948
		  },
		  {
		    "Year": 2012,
		    "Doy": 354,
		    "SCF": 89.1134,
		    "Cloud": 56.6339,
		    "Age": 4.71152
		  },
		  {
		    "Year": 2012,
		    "Doy": 355,
		    "SCF": 91.2649,
		    "Cloud": 18.9608,
		    "Age": 1.31469
		  },
		  {
		    "Year": 2012,
		    "Doy": 356,
		    "SCF": 89.4866,
		    "Cloud": 97.8842,
		    "Age": 2.30803
		  },
		  {
		    "Year": 2012,
		    "Doy": 357,
		    "SCF": 88.0525,
		    "Cloud": 94.2785,
		    "Age": 3.13058
		  },
		  {
		    "Year": 2012,
		    "Doy": 358,
		    "SCF": 86.9037,
		    "Cloud": 89.4283,
		    "Age": 3.73015
		  },
		  {
		    "Year": 2012,
		    "Doy": 359,
		    "SCF": 86.9552,
		    "Cloud": 91.682,
		    "Age": 4.38096
		  },
		  {
		    "Year": 2012,
		    "Doy": 360,
		    "SCF": 87.5066,
		    "Cloud": 99.8882,
		    "Age": 5.37675
		  },
		  {
		    "Year": 2012,
		    "Doy": 361,
		    "SCF": 88.1591,
		    "Cloud": 67.1827,
		    "Age": 5.05598
		  },
		  {
		    "Year": 2012,
		    "Doy": 362,
		    "SCF": 90.2678,
		    "Cloud": 22.9168,
		    "Age": 1.43105
		  },
		  {
		    "Year": 2012,
		    "Doy": 363,
		    "SCF": 88.763,
		    "Cloud": 69.0987,
		    "Age": 1.83622
		  },
		  {
		    "Year": 2012,
		    "Doy": 364,
		    "SCF": 87.0589,
		    "Cloud": 99.9768,
		    "Age": 2.83302
		  },
		  {
		    "Year": 2012,
		    "Doy": 365,
		    "SCF": 85.6314,
		    "Cloud": 89.4515,
		    "Age": 3.2973
		  },
		  {
		    "Year": 2013,
		    "Doy": 1,
		    "SCF": 83.9526,
		    "Cloud": 23.1662,
		    "Age": 0.230832
		  },
		  {
		    "Year": 2013,
		    "Doy": 2,
		    "SCF": 81.8309,
		    "Cloud": 59.9808,
		    "Age": 0.798041
		  },
		  {
		    "Year": 2013,
		    "Doy": 3,
		    "SCF": 79.9061,
		    "Cloud": 39.9271,
		    "Age": 0.804409
		  },
		  {
		    "Year": 2013,
		    "Doy": 4,
		    "SCF": 79.3571,
		    "Cloud": 64.4549,
		    "Age": 1.12733
		  },
		  {
		    "Year": 2013,
		    "Doy": 5,
		    "SCF": 79.65,
		    "Cloud": 91.083,
		    "Age": 1.95396
		  },
		  {
		    "Year": 2013,
		    "Doy": 6,
		    "SCF": 80.9695,
		    "Cloud": 74.6137,
		    "Age": 2.23414
		  },
		  {
		    "Year": 2013,
		    "Doy": 7,
		    "SCF": 81.6631,
		    "Cloud": 96.5497,
		    "Age": 3.10306
		  },
		  {
		    "Year": 2013,
		    "Doy": 8,
		    "SCF": 82.9889,
		    "Cloud": 29.0759,
		    "Age": 1.22213
		  },
		  {
		    "Year": 2013,
		    "Doy": 9,
		    "SCF": 81.8274,
		    "Cloud": 59.2752,
		    "Age": 1.43216
		  },
		  {
		    "Year": 2013,
		    "Doy": 10,
		    "SCF": 81.8274,
		    "Cloud": 0,
		    "Age": 0
		  },
		  {
		    "Year": 2013,
		    "Doy": 11,
		    "SCF": 82.4727,
		    "Cloud": 23.0673,
		    "Age": 0.621288
		  },
		  {
		    "Year": 2013,
		    "Doy": 12,
		    "SCF": 82.9464,
		    "Cloud": 9.81151,
		    "Age": 0.287184
		  },
		  {
		    "Year": 2013,
		    "Doy": 13,
		    "SCF": 84.6616,
		    "Cloud": 8.19358,
		    "Age": 0.245546
		  },
		  {
		    "Year": 2013,
		    "Doy": 14,
		    "SCF": 85.0902,
		    "Cloud": 32.0748,
		    "Age": 0.500167
		  },
		  {
		    "Year": 2013,
		    "Doy": 15,
		    "SCF": 83.2522,
		    "Cloud": 67.5312,
		    "Age": 1.03208
		  },
		  {
		    "Year": 2013,
		    "Doy": 16,
		    "SCF": 84.5316,
		    "Cloud": 42.3541,
		    "Age": 0.860912
		  },
		  {
		    "Year": 2013,
		    "Doy": 17,
		    "SCF": 82.8864,
		    "Cloud": 83.5732,
		    "Age": 1.56501
		  },
		  {
		    "Year": 2013,
		    "Doy": 18,
		    "SCF": 82.1992,
		    "Cloud": 93.9372,
		    "Age": 2.44779
		  },
		  {
		    "Year": 2013,
		    "Doy": 19,
		    "SCF": 82.3708,
		    "Cloud": 43.4692,
		    "Age": 1.63506
		  },
		  {
		    "Year": 2013,
		    "Doy": 20,
		    "SCF": 82.5832,
		    "Cloud": 97.4994,
		    "Age": 2.56769
		  },
		  {
		    "Year": 2013,
		    "Doy": 21,
		    "SCF": 83.5143,
		    "Cloud": 43.9108,
		    "Age": 1.76319
		  },
		  {
		    "Year": 2013,
		    "Doy": 22,
		    "SCF": 84.6224,
		    "Cloud": 13.2813,
		    "Age": 0.611264
		  },
		  {
		    "Year": 2013,
		    "Doy": 23,
		    "SCF": 87.4231,
		    "Cloud": 8.7223,
		    "Age": 0.398327
		  },
		  {
		    "Year": 2013,
		    "Doy": 24,
		    "SCF": 84.4748,
		    "Cloud": 20.2364,
		    "Age": 0.4671
		  },
		  {
		    "Year": 2013,
		    "Doy": 25,
		    "SCF": 88.5645,
		    "Cloud": 18.57,
		    "Age": 0.432777
		  },
		  {
		    "Year": 2013,
		    "Doy": 26,
		    "SCF": 86.9593,
		    "Cloud": 99.9651,
		    "Age": 1.43237
		  },
		  {
		    "Year": 2013,
		    "Doy": 27,
		    "SCF": 85.6517,
		    "Cloud": 100,
		    "Age": 2.43237
		  },
		  {
		    "Year": 2013,
		    "Doy": 28,
		    "SCF": 84.462,
		    "Cloud": 57.2891,
		    "Age": 2.06193
		  },
		  {
		    "Year": 2013,
		    "Doy": 29,
		    "SCF": 84.8364,
		    "Cloud": 94.6807,
		    "Age": 2.90889
		  },
		  {
		    "Year": 2013,
		    "Doy": 30,
		    "SCF": 86.5489,
		    "Cloud": 44.849,
		    "Age": 1.72827
		  },
		  {
		    "Year": 2013,
		    "Doy": 31,
		    "SCF": 83.4934,
		    "Cloud": 22.0399,
		    "Age": 0.873709
		  },
		  {
		    "Year": 2013,
		    "Doy": 32,
		    "SCF": 90.8669,
		    "Cloud": 13.5855,
		    "Age": 0.559264
		  },
		  {
		    "Year": 2013,
		    "Doy": 33,
		    "SCF": 85.9363,
		    "Cloud": 70.1843,
		    "Age": 1.15223
		  },
		  {
		    "Year": 2013,
		    "Doy": 34,
		    "SCF": 85.2182,
		    "Cloud": 97.1262,
		    "Age": 2.10775
		  },
		  {
		    "Year": 2013,
		    "Doy": 35,
		    "SCF": 84.7095,
		    "Cloud": 98.9298,
		    "Age": 3.07628
		  },
		  {
		    "Year": 2013,
		    "Doy": 36,
		    "SCF": 84.4077,
		    "Cloud": 85.4741,
		    "Age": 3.52963
		  },
		  {
		    "Year": 2013,
		    "Doy": 37,
		    "SCF": 84.2435,
		    "Cloud": 93.8501,
		    "Age": 4.16955
		  },
		  {
		    "Year": 2013,
		    "Doy": 38,
		    "SCF": 84.8003,
		    "Cloud": 71.3315,
		    "Age": 3.92767
		  },
		  {
		    "Year": 2013,
		    "Doy": 39,
		    "SCF": 86.0991,
		    "Cloud": 64.9826,
		    "Age": 3.5215
		  },
		  {
		    "Year": 2013,
		    "Doy": 40,
		    "SCF": 85.9727,
		    "Cloud": 10.9901,
		    "Age": 0.351645
		  },
		  {
		    "Year": 2013,
		    "Doy": 41,
		    "SCF": 84.7811,
		    "Cloud": 97.4311,
		    "Age": 1.31577
		  },
		  {
		    "Year": 2013,
		    "Doy": 42,
		    "SCF": 84.1746,
		    "Cloud": 98.6597,
		    "Age": 2.29014
		  },
		  {
		    "Year": 2013,
		    "Doy": 43,
		    "SCF": 83.7361,
		    "Cloud": 69.4321,
		    "Age": 2.31162
		  },
		  {
		    "Year": 2013,
		    "Doy": 44,
		    "SCF": 84.6865,
		    "Cloud": 69.2781,
		    "Age": 2.34659
		  },
		  {
		    "Year": 2013,
		    "Doy": 45,
		    "SCF": 85.5225,
		    "Cloud": 99.8998,
		    "Age": 3.34339
		  },
		  {
		    "Year": 2013,
		    "Doy": 46,
		    "SCF": 86.4538,
		    "Cloud": 95.2645,
		    "Age": 4.17118
		  },
		  {
		    "Year": 2013,
		    "Doy": 47,
		    "SCF": 87.6582,
		    "Cloud": 74.7528,
		    "Age": 4.11747
		  },
		  {
		    "Year": 2013,
		    "Doy": 48,
		    "SCF": 87.9161,
		    "Cloud": 97.3251,
		    "Age": 5.01587
		  },
		  {
		    "Year": 2013,
		    "Doy": 49,
		    "SCF": 88.3405,
		    "Cloud": 99.9768,
		    "Age": 6.01411
		  },
		  {
		    "Year": 2013,
		    "Doy": 50,
		    "SCF": 88.795,
		    "Cloud": 88.8009,
		    "Age": 6.1234
		  },
		  {
		    "Year": 2013,
		    "Doy": 51,
		    "SCF": 89.2886,
		    "Cloud": 36.4274,
		    "Age": 2.49992
		  },
		  {
		    "Year": 2013,
		    "Doy": 52,
		    "SCF": 87.8257,
		    "Cloud": 49.067,
		    "Age": 1.9673
		  },
		  {
		    "Year": 2013,
		    "Doy": 53,
		    "SCF": 88.7088,
		    "Cloud": 97.0754,
		    "Age": 2.77669
		  },
		  {
		    "Year": 2013,
		    "Doy": 54,
		    "SCF": 89.8245,
		    "Cloud": 96.7544,
		    "Age": 3.67858
		  },
		  {
		    "Year": 2013,
		    "Doy": 55,
		    "SCF": 91.8354,
		    "Cloud": 6.64072,
		    "Age": 0.306362
		  },
		  {
		    "Year": 2013,
		    "Doy": 56,
		    "SCF": 86.6625,
		    "Cloud": 1.20094,
		    "Age": 0.0602791
		  },
		  {
		    "Year": 2013,
		    "Doy": 57,
		    "SCF": 90.2345,
		    "Cloud": 50.7152,
		    "Age": 0.547275
		  },
		  {
		    "Year": 2013,
		    "Doy": 58,
		    "SCF": 90.196,
		    "Cloud": 19.1307,
		    "Age": 0.241465
		  },
		  {
		    "Year": 2013,
		    "Doy": 59,
		    "SCF": 91.1055,
		    "Cloud": 23.4909,
		    "Age": 0.312834
		  },
		  {
		    "Year": 2013,
		    "Doy": 60,
		    "SCF": 91.5193,
		    "Cloud": 13.5443,
		    "Age": 0.177672
		  },
		  {
		    "Year": 2013,
		    "Doy": 61,
		    "SCF": 90.3079,
		    "Cloud": 67.3569,
		    "Age": 0.80817
		  },
		  {
		    "Year": 2013,
		    "Doy": 62,
		    "SCF": 93.4478,
		    "Cloud": 11.7601,
		    "Age": 0.232675
		  },
		  {
		    "Year": 2013,
		    "Doy": 63,
		    "SCF": 92.5062,
		    "Cloud": 99.6921,
		    "Age": 1.22932
		  },
		  {
		    "Year": 2013,
		    "Doy": 64,
		    "SCF": 91.8572,
		    "Cloud": 55.7992,
		    "Age": 1.18181
		  },
		  {
		    "Year": 2013,
		    "Doy": 65,
		    "SCF": 91.5397,
		    "Cloud": 97.6678,
		    "Age": 2.1292
		  },
		  {
		    "Year": 2013,
		    "Doy": 66,
		    "SCF": 91.8987,
		    "Cloud": 44.0425,
		    "Age": 1.32403
		  },
		  {
		    "Year": 2013,
		    "Doy": 67,
		    "SCF": 92.9993,
		    "Cloud": 0.232359,
		    "Age": 0.0082197
		  },
		  {
		    "Year": 2013,
		    "Doy": 68,
		    "SCF": 88.0978,
		    "Cloud": 99.6457,
		    "Age": 1.00482
		  },
		  {
		    "Year": 2013,
		    "Doy": 69,
		    "SCF": 83.6538,
		    "Cloud": 26.0372,
		    "Age": 0.521035
		  },
		  {
		    "Year": 2013,
		    "Doy": 70,
		    "SCF": 83.0165,
		    "Cloud": 17.2821,
		    "Age": 0.315888
		  },
		  {
		    "Year": 2013,
		    "Doy": 71,
		    "SCF": 88.6423,
		    "Cloud": 14.8932,
		    "Age": 0.225104
		  },
		  {
		    "Year": 2013,
		    "Doy": 72,
		    "SCF": 83.7339,
		    "Cloud": 45.0486,
		    "Age": 0.560508
		  },
		  {
		    "Year": 2013,
		    "Doy": 73,
		    "SCF": 90.2118,
		    "Cloud": 8.19465,
		    "Age": 0.152784
		  },
		  {
		    "Year": 2013,
		    "Doy": 74,
		    "SCF": 88.4882,
		    "Cloud": 78.62,
		    "Age": 0.875084
		  },
		  {
		    "Year": 2013,
		    "Doy": 75,
		    "SCF": 88.1244,
		    "Cloud": 98.7657,
		    "Age": 1.85362
		  },
		  {
		    "Year": 2013,
		    "Doy": 76,
		    "SCF": 87.8873,
		    "Cloud": 100,
		    "Age": 2.85362
		  },
		  {
		    "Year": 2013,
		    "Doy": 77,
		    "SCF": 87.6587,
		    "Cloud": 92.1496,
		    "Age": 3.53865
		  },
		  {
		    "Year": 2013,
		    "Doy": 78,
		    "SCF": 87.3998,
		    "Cloud": 99.3944,
		    "Age": 4.51692
		  },
		  {
		    "Year": 2013,
		    "Doy": 79,
		    "SCF": 87.1823,
		    "Cloud": 99.9506,
		    "Age": 5.51459
		  },
		  {
		    "Year": 2013,
		    "Doy": 80,
		    "SCF": 87.1864,
		    "Cloud": 26.6079,
		    "Age": 1.78874
		  },
		  {
		    "Year": 2013,
		    "Doy": 81,
		    "SCF": 86.9593,
		    "Cloud": 86.4615,
		    "Age": 2.47853
		  },
		  {
		    "Year": 2013,
		    "Doy": 82,
		    "SCF": 90.2059,
		    "Cloud": 1.29968,
		    "Age": 0.0571134
		  },
		  {
		    "Year": 2013,
		    "Doy": 83,
		    "SCF": 86.9905,
		    "Cloud": 1.35196,
		    "Age": 0.0281428
		  },
		  {
		    "Year": 2013,
		    "Doy": 84,
		    "SCF": 89.0612,
		    "Cloud": 50.949,
		    "Age": 0.52452
		  },
		  {
		    "Year": 2013,
		    "Doy": 85,
		    "SCF": 91.9177,
		    "Cloud": 1.52331,
		    "Age": 0.0292174
		  },
		  {
		    "Year": 2013,
		    "Doy": 86,
		    "SCF": 88.7136,
		    "Cloud": 0.29624,
		    "Age": 0.0110945
		  },
		  {
		    "Year": 2013,
		    "Doy": 87,
		    "SCF": 94.9497,
		    "Cloud": 0.174259,
		    "Age": 0.00607002
		  },
		  {
		    "Year": 2013,
		    "Doy": 88,
		    "SCF": 92.58,
		    "Cloud": 70.6954,
		    "Age": 0.71391
		  },
		  {
		    "Year": 2013,
		    "Doy": 89,
		    "SCF": 94.1772,
		    "Cloud": 13.5511,
		    "Age": 0.266244
		  },
		  {
		    "Year": 2013,
		    "Doy": 90,
		    "SCF": 90.8988,
		    "Cloud": 9.30398,
		    "Age": 0.103016
		  },
		  {
		    "Year": 2013,
		    "Doy": 91,
		    "SCF": 93.7257,
		    "Cloud": 1.94598,
		    "Age": 0.0208103
		  },
		  {
		    "Year": 2013,
		    "Doy": 92,
		    "SCF": 91.6776,
		    "Cloud": 33.8978,
		    "Age": 0.349782
		  },
		  {
		    "Year": 2013,
		    "Doy": 93,
		    "SCF": 90.8507,
		    "Cloud": 16.8334,
		    "Age": 0.253198
		  },
		  {
		    "Year": 2013,
		    "Doy": 94,
		    "SCF": 94.5109,
		    "Cloud": 3.78175,
		    "Age": 0.0436993
		  },
		  {
		    "Year": 2013,
		    "Doy": 95,
		    "SCF": 88.5744,
		    "Cloud": 18.7822,
		    "Age": 0.201342
		  },
		  {
		    "Year": 2013,
		    "Doy": 96,
		    "SCF": 90.159,
		    "Cloud": 57.1337,
		    "Age": 0.719385
		  },
		  {
		    "Year": 2013,
		    "Doy": 97,
		    "SCF": 89.9018,
		    "Cloud": 50.7762,
		    "Age": 0.887138
		  },
		  {
		    "Year": 2013,
		    "Doy": 98,
		    "SCF": 92.7078,
		    "Cloud": 17.8388,
		    "Age": 0.323449
		  },
		  {
		    "Year": 2013,
		    "Doy": 99,
		    "SCF": 91.3397,
		    "Cloud": 20.7374,
		    "Age": 0.290411
		  },
		  {
		    "Year": 2013,
		    "Doy": 100,
		    "SCF": 89.7966,
		    "Cloud": 67.2538,
		    "Age": 0.887951
		  },
		  {
		    "Year": 2013,
		    "Doy": 101,
		    "SCF": 89.0216,
		    "Cloud": 97.2394,
		    "Age": 1.84071
		  },
		  {
		    "Year": 2013,
		    "Doy": 102,
		    "SCF": 88.5244,
		    "Cloud": 99.939,
		    "Age": 2.83804
		  },
		  {
		    "Year": 2013,
		    "Doy": 103,
		    "SCF": 88.1454,
		    "Cloud": 54.3514,
		    "Age": 2.19424
		  },
		  {
		    "Year": 2013,
		    "Doy": 104,
		    "SCF": 87.1965,
		    "Cloud": 100,
		    "Age": 3.19424
		  },
		  {
		    "Year": 2013,
		    "Doy": 105,
		    "SCF": 86.4492,
		    "Cloud": 78.4094,
		    "Age": 3.22413
		  },
		  {
		    "Year": 2013,
		    "Doy": 106,
		    "SCF": 84.9037,
		    "Cloud": 99.9811,
		    "Age": 4.22305
		  },
		  {
		    "Year": 2013,
		    "Doy": 107,
		    "SCF": 83.8147,
		    "Cloud": 36.0505,
		    "Age": 1.66135
		  },
		  {
		    "Year": 2013,
		    "Doy": 108,
		    "SCF": 81.1209,
		    "Cloud": 97.36,
		    "Age": 2.60747
		  },
		  {
		    "Year": 2013,
		    "Doy": 109,
		    "SCF": 78.9631,
		    "Cloud": 89.62,
		    "Age": 3.20642
		  },
		  {
		    "Year": 2013,
		    "Doy": 110,
		    "SCF": 77.3636,
		    "Cloud": 20.7459,
		    "Age": 0.945646
		  },
		  {
		    "Year": 2013,
		    "Doy": 111,
		    "SCF": 72.4069,
		    "Cloud": 76.6201,
		    "Age": 1.61829
		  },
		  {
		    "Year": 2013,
		    "Doy": 112,
		    "SCF": 68.993,
		    "Cloud": 93.1436,
		    "Age": 29.4676
		  },
		  {
		    "Year": 2013,
		    "Doy": 113,
		    "SCF": 66.1457,
		    "Cloud": 58.776,
		    "Age": 29.9504
		  },
		  {
		    "Year": 2013,
		    "Doy": 114,
		    "SCF": 64.3597,
		    "Cloud": 71.3987,
		    "Age": 30.4438
		  },
		  {
		    "Year": 2013,
		    "Doy": 115,
		    "SCF": 62.6533,
		    "Cloud": 85.3361,
		    "Age": 30.9482
		  },
		  {
		    "Year": 2013,
		    "Doy": 116,
		    "SCF": 60.7297,
		    "Cloud": 57.4105,
		    "Age": 30.2179
		  },
		  {
		    "Year": 2013,
		    "Doy": 117,
		    "SCF": 59.82,
		    "Cloud": 35.3251,
		    "Age": 29.5544
		  },
		  {
		    "Year": 2013,
		    "Doy": 118,
		    "SCF": 59.0481,
		    "Cloud": 99.7981,
		    "Age": 29.882
		  },
		  {
		    "Year": 2013,
		    "Doy": 119,
		    "SCF": 58.6,
		    "Cloud": 72.7732,
		    "Age": 30.3799
		  },
		  {
		    "Year": 2013,
		    "Doy": 120,
		    "SCF": 56.7062,
		    "Cloud": 65.7774,
		    "Age": 30.8757
		  },
		  {
		    "Year": 2013,
		    "Doy": 121,
		    "SCF": 55.9995,
		    "Cloud": 90.933,
		    "Age": 31.171
		  },
		  {
		    "Year": 2013,
		    "Doy": 122,
		    "SCF": 55.1763,
		    "Cloud": 33.2876,
		    "Age": 1.46562
		  },
		  {
		    "Year": 2013,
		    "Doy": 123,
		    "SCF": 54.2023,
		    "Cloud": 99.984,
		    "Age": 2.45942
		  },
		  {
		    "Year": 2013,
		    "Doy": 124,
		    "SCF": 53.5826,
		    "Cloud": 99.088,
		    "Age": 3.42675
		  },
		  {
		    "Year": 2013,
		    "Doy": 125,
		    "SCF": 53.1128,
		    "Cloud": 57.8658,
		    "Age": 2.85491
		  },
		  {
		    "Year": 2013,
		    "Doy": 126,
		    "SCF": 50.8464,
		    "Cloud": 60.5684,
		    "Age": 2.94629
		  },
		  {
		    "Year": 2013,
		    "Doy": 127,
		    "SCF": 48.1831,
		    "Cloud": 51.7464,
		    "Age": 2.79752
		  },
		  {
		    "Year": 2013,
		    "Doy": 128,
		    "SCF": 46.3217,
		    "Cloud": 85.1496,
		    "Age": 3.53525
		  },
		  {
		    "Year": 2013,
		    "Doy": 129,
		    "SCF": 44.3301,
		    "Cloud": 99.9245,
		    "Age": 4.52921
		  },
		  {
		    "Year": 2013,
		    "Doy": 130,
		    "SCF": 42.522,
		    "Cloud": 69.0417,
		    "Age": 3.80766
		  },
		  {
		    "Year": 2013,
		    "Doy": 131,
		    "SCF": 40.0312,
		    "Cloud": 98.8557,
		    "Age": 4.77028
		  },
		  {
		    "Year": 2013,
		    "Doy": 132,
		    "SCF": 37.6677,
		    "Cloud": 99.3393,
		    "Age": 5.73019
		  },
		  {
		    "Year": 2013,
		    "Doy": 133,
		    "SCF": 35.2978,
		    "Cloud": 99.5832,
		    "Age": 6.72768
		  },
		  {
		    "Year": 2013,
		    "Doy": 134,
		    "SCF": 32.9861,
		    "Cloud": 82.9248,
		    "Age": 6.73586
		  },
		  {
		    "Year": 2013,
		    "Doy": 135,
		    "SCF": 30.5939,
		    "Cloud": 99.8824,
		    "Age": 7.72454
		  },
		  {
		    "Year": 2013,
		    "Doy": 136,
		    "SCF": 28.2782,
		    "Cloud": 99.8025,
		    "Age": 8.72434
		  },
		  {
		    "Year": 2013,
		    "Doy": 137,
		    "SCF": 25.918,
		    "Cloud": 99.4191,
		    "Age": 9.68873
		  },
		  {
		    "Year": 2013,
		    "Doy": 138,
		    "SCF": 23.7242,
		    "Cloud": 62.5787,
		    "Age": 7.28289
		  },
		  {
		    "Year": 2013,
		    "Doy": 139,
		    "SCF": 21.9568,
		    "Cloud": 32.1288,
		    "Age": 3.43904
		  },
		  {
		    "Year": 2013,
		    "Doy": 140,
		    "SCF": 20.7282,
		    "Cloud": 94.3676,
		    "Age": 4.29062
		  },
		  {
		    "Year": 2013,
		    "Doy": 141,
		    "SCF": 19.5536,
		    "Cloud": 93.6777,
		    "Age": 4.90779
		  },
		  {
		    "Year": 2013,
		    "Doy": 142,
		    "SCF": 18.4213,
		    "Cloud": 99.6442,
		    "Age": 5.89218
		  },
		  {
		    "Year": 2013,
		    "Doy": 143,
		    "SCF": 17.1773,
		    "Cloud": 98.6756,
		    "Age": 6.87591
		  },
		  {
		    "Year": 2013,
		    "Doy": 144,
		    "SCF": 15.874,
		    "Cloud": 86.6503,
		    "Age": 7.1201
		  },
		  {
		    "Year": 2013,
		    "Doy": 145,
		    "SCF": 14.6365,
		    "Cloud": 65.3194,
		    "Age": 5.93701
		  },
		  {
		    "Year": 2013,
		    "Doy": 146,
		    "SCF": 13.1095,
		    "Cloud": 26.4518,
		    "Age": 2.64771
		  },
		  {
		    "Year": 2013,
		    "Doy": 147,
		    "SCF": 12.4128,
		    "Cloud": 96.9217,
		    "Age": 3.60049
		  },
		  {
		    "Year": 2013,
		    "Doy": 148,
		    "SCF": 11.7521,
		    "Cloud": 98.3808,
		    "Age": 4.59756
		  },
		  {
		    "Year": 2013,
		    "Doy": 149,
		    "SCF": 11.0845,
		    "Cloud": 91.7078,
		    "Age": 5.02221
		  },
		  {
		    "Year": 2013,
		    "Doy": 150,
		    "SCF": 10.4699,
		    "Cloud": 94.4137,
		    "Age": 5.7979
		  },
		  {
		    "Year": 2013,
		    "Doy": 151,
		    "SCF": 9.72137,
		    "Cloud": 90.7129,
		    "Age": 6.27225
		  },
		  {
		    "Year": 2013,
		    "Doy": 152,
		    "SCF": 9.08388,
		    "Cloud": 89.8546,
		    "Age": 6.73774
		  },
		  {
		    "Year": 2013,
		    "Doy": 153,
		    "SCF": 7.99611,
		    "Cloud": 86.4028,
		    "Age": 6.95737
		  },
		  {
		    "Year": 2013,
		    "Doy": 154,
		    "SCF": 6.70211,
		    "Cloud": 35.837,
		    "Age": 2.73537
		  },
		  {
		    "Year": 2013,
		    "Doy": 155,
		    "SCF": 6.35351,
		    "Cloud": 54.5092,
		    "Age": 2.31221
		  },
		  {
		    "Year": 2013,
		    "Doy": 156,
		    "SCF": 6.82653,
		    "Cloud": 71.9501,
		    "Age": 2.55501
		  },
		  {
		    "Year": 2013,
		    "Doy": 157,
		    "SCF": 6.19259,
		    "Cloud": 79.1963,
		    "Age": 2.99553
		  },
		  {
		    "Year": 2013,
		    "Doy": 158,
		    "SCF": 5.35006,
		    "Cloud": 59.9286,
		    "Age": 2.5913
		  },
		  {
		    "Year": 2013,
		    "Doy": 159,
		    "SCF": 4.74599,
		    "Cloud": 68.2939,
		    "Age": 2.80031
		  },
		  {
		    "Year": 2013,
		    "Doy": 160,
		    "SCF": 4.09385,
		    "Cloud": 79.2762,
		    "Age": 3.08845
		  },
		  {
		    "Year": 2013,
		    "Doy": 161,
		    "SCF": 3.43003,
		    "Cloud": 50.8325,
		    "Age": 2.18352
		  },
		  {
		    "Year": 2013,
		    "Doy": 162,
		    "SCF": 2.86037,
		    "Cloud": 4.99627,
		    "Age": 0.211118
		  },
		  {
		    "Year": 2013,
		    "Doy": 163,
		    "SCF": 2.78702,
		    "Cloud": 77.0237,
		    "Age": 0.943409
		  },
		  {
		    "Year": 2013,
		    "Doy": 164,
		    "SCF": 2.6886,
		    "Cloud": 99.9274,
		    "Age": 1.94236
		  },
		  {
		    "Year": 2013,
		    "Doy": 165,
		    "SCF": 2.58694,
		    "Cloud": 36.7892,
		    "Age": 1.16245
		  },
		  {
		    "Year": 2013,
		    "Doy": 166,
		    "SCF": 2.40008,
		    "Cloud": 7.18273,
		    "Age": 0.278965
		  },
		  {
		    "Year": 2013,
		    "Doy": 167,
		    "SCF": 3.55324,
		    "Cloud": 66.1546,
		    "Age": 0.918852
		  },
		  {
		    "Year": 2013,
		    "Doy": 168,
		    "SCF": 2.41898,
		    "Cloud": 39.8019,
		    "Age": 0.895072
		  },
		  {
		    "Year": 2013,
		    "Doy": 169,
		    "SCF": 2.10561,
		    "Cloud": 12.9832,
		    "Age": 0.380321
		  },
		  {
		    "Year": 2013,
		    "Doy": 170,
		    "SCF": 2.66254,
		    "Cloud": 84.4202,
		    "Age": 1.16407
		  },
		  {
		    "Year": 2013,
		    "Doy": 171,
		    "SCF": 3.42842,
		    "Cloud": 60.5041,
		    "Age": 1.36091
		  },
		  {
		    "Year": 2013,
		    "Doy": 172,
		    "SCF": 3.18293,
		    "Cloud": 99.8533,
		    "Age": 2.35449
		  },
		  {
		    "Year": 2013,
		    "Doy": 173,
		    "SCF": 3.01457,
		    "Cloud": 96.2128,
		    "Age": 3.21339
		  },
		  {
		    "Year": 2013,
		    "Doy": 174,
		    "SCF": 2.90668,
		    "Cloud": 92.7879,
		    "Age": 3.9124
		  },
		  {
		    "Year": 2013,
		    "Doy": 175,
		    "SCF": 2.7266,
		    "Cloud": 97.5241,
		    "Age": 4.797
		  },
		  {
		    "Year": 2013,
		    "Doy": 176,
		    "SCF": 2.54243,
		    "Cloud": 68.6185,
		    "Age": 4.07106
		  },
		  {
		    "Year": 2013,
		    "Doy": 177,
		    "SCF": 2.45168,
		    "Cloud": 99.9956,
		    "Age": 5.05234
		  },
		  {
		    "Year": 2013,
		    "Doy": 178,
		    "SCF": 2.3897,
		    "Cloud": 97.7317,
		    "Age": 6.03996
		  },
		  {
		    "Year": 2013,
		    "Doy": 179,
		    "SCF": 2.34865,
		    "Cloud": 83.1127,
		    "Age": 5.93061
		  },
		  {
		    "Year": 2013,
		    "Doy": 180,
		    "SCF": 2.15819,
		    "Cloud": 99.5121,
		    "Age": 6.91943
		  },
		  {
		    "Year": 2013,
		    "Doy": 181,
		    "SCF": 1.96163,
		    "Cloud": 88.4443,
		    "Age": 7.20623
		  },
		  {
		    "Year": 2013,
		    "Doy": 182,
		    "SCF": 1.9167,
		    "Cloud": 91.4386,
		    "Age": 7.62088
		  },
		  {
		    "Year": 2013,
		    "Doy": 183,
		    "SCF": 1.66146,
		    "Cloud": 95.2801,
		    "Age": 8.20975
		  },
		  {
		    "Year": 2013,
		    "Doy": 184,
		    "SCF": 1.458,
		    "Cloud": 98.1136,
		    "Age": 9.09314
		  },
		  {
		    "Year": 2013,
		    "Doy": 185,
		    "SCF": 1.10207,
		    "Cloud": 98.7395,
		    "Age": 10.0907
		  },
		  {
		    "Year": 2013,
		    "Doy": 186,
		    "SCF": 0.788643,
		    "Cloud": 47.1251,
		    "Age": 5.21187
		  },
		  {
		    "Year": 2013,
		    "Doy": 187,
		    "SCF": 0.458569,
		    "Cloud": 0.725802,
		    "Age": 0.12987
		  },
		  {
		    "Year": 2013,
		    "Doy": 188,
		    "SCF": 0.548332,
		    "Cloud": 25.7509,
		    "Age": 0.368461
		  },
		  {
		    "Year": 2013,
		    "Doy": 189,
		    "SCF": 0.737441,
		    "Cloud": 5.50923,
		    "Age": 0.178864
		  },
		  {
		    "Year": 2013,
		    "Doy": 190,
		    "SCF": 0.941054,
		    "Cloud": 93.253,
		    "Age": 1.10998
		  },
		  {
		    "Year": 2013,
		    "Doy": 191,
		    "SCF": 0.37975,
		    "Cloud": 3.77645,
		    "Age": 0.15515
		  },
		  {
		    "Year": 2013,
		    "Doy": 192,
		    "SCF": 0.270902,
		    "Cloud": 0.282052,
		    "Age": 0.0311281
		  },
		  {
		    "Year": 2013,
		    "Doy": 193,
		    "SCF": 0.272436,
		    "Cloud": 0.277579,
		    "Age": 0.0205701
		  },
		  {
		    "Year": 2013,
		    "Doy": 194,
		    "SCF": 0.369545,
		    "Cloud": 98.0527,
		    "Age": 1.00064
		  },
		  {
		    "Year": 2013,
		    "Doy": 195,
		    "SCF": 0.441548,
		    "Cloud": 96.7585,
		    "Age": 1.93674
		  },
		  {
		    "Year": 2013,
		    "Doy": 196,
		    "SCF": 0.478859,
		    "Cloud": 88.0536,
		    "Age": 2.58436
		  },
		  {
		    "Year": 2013,
		    "Doy": 197,
		    "SCF": 0.492427,
		    "Cloud": 98.7076,
		    "Age": 3.54742
		  },
		  {
		    "Year": 2013,
		    "Doy": 198,
		    "SCF": 0.464514,
		    "Cloud": 94.6891,
		    "Age": 4.31716
		  },
		  {
		    "Year": 2013,
		    "Doy": 199,
		    "SCF": 0.389588,
		    "Cloud": 83.5899,
		    "Age": 4.44409
		  },
		  {
		    "Year": 2013,
		    "Doy": 200,
		    "SCF": 0.289271,
		    "Cloud": 4.26542,
		    "Age": 0.250343
		  },
		  {
		    "Year": 2013,
		    "Doy": 201,
		    "SCF": 0.222264,
		    "Cloud": 0.144612,
		    "Age": 0.00825312
		  },
		  {
		    "Year": 2013,
		    "Doy": 202,
		    "SCF": 0.201944,
		    "Cloud": 1.3459,
		    "Age": 0.0142481
		  },
		  {
		    "Year": 2013,
		    "Doy": 203,
		    "SCF": 0.196568,
		    "Cloud": 1.08588,
		    "Age": 0.0117795
		  },
		  {
		    "Year": 2013,
		    "Doy": 204,
		    "SCF": 0.210995,
		    "Cloud": 13.76,
		    "Age": 0.139616
		  },
		  {
		    "Year": 2013,
		    "Doy": 205,
		    "SCF": 0.361862,
		    "Cloud": 50.2029,
		    "Age": 0.571568
		  },
		  {
		    "Year": 2013,
		    "Doy": 206,
		    "SCF": 0.778926,
		    "Cloud": 42.2113,
		    "Age": 0.589546
		  },
		  {
		    "Year": 2013,
		    "Doy": 207,
		    "SCF": 0.654503,
		    "Cloud": 31.8921,
		    "Age": 0.534913
		  },
		  {
		    "Year": 2013,
		    "Doy": 208,
		    "SCF": 0.72729,
		    "Cloud": 35.6876,
		    "Age": 0.608807
		  },
		  {
		    "Year": 2013,
		    "Doy": 209,
		    "SCF": 0.671899,
		    "Cloud": 99.0851,
		    "Age": 1.59078
		  },
		  {
		    "Year": 2013,
		    "Doy": 210,
		    "SCF": 0.614625,
		    "Cloud": 70.5442,
		    "Age": 1.85605
		  },
		  {
		    "Year": 2013,
		    "Doy": 211,
		    "SCF": 0.64017,
		    "Cloud": 100,
		    "Age": 2.85275
		  },
		  {
		    "Year": 2013,
		    "Doy": 212,
		    "SCF": 0.674272,
		    "Cloud": 88.0162,
		    "Age": 3.41153
		  },
		  {
		    "Year": 2013,
		    "Doy": 213,
		    "SCF": 0.393892,
		    "Cloud": 28.6113,
		    "Age": 1.35963
		  },
		  {
		    "Year": 2013,
		    "Doy": 214,
		    "SCF": 0.493457,
		    "Cloud": 96.6986,
		    "Age": 2.3083
		  },
		  {
		    "Year": 2013,
		    "Doy": 215,
		    "SCF": 0.556351,
		    "Cloud": 99.4976,
		    "Age": 3.30244
		  },
		  {
		    "Year": 2013,
		    "Doy": 216,
		    "SCF": 0.618553,
		    "Cloud": 44.4739,
		    "Age": 2.0925
		  },
		  {
		    "Year": 2013,
		    "Doy": 217,
		    "SCF": 0.83451,
		    "Cloud": 69.5847,
		    "Age": 2.0337
		  },
		  {
		    "Year": 2013,
		    "Doy": 218,
		    "SCF": 0.955186,
		    "Cloud": 99.6573,
		    "Age": 3.01866
		  },
		  {
		    "Year": 2013,
		    "Doy": 219,
		    "SCF": 0.812763,
		    "Cloud": 42.5673,
		    "Age": 1.65718
		  },
		  {
		    "Year": 2013,
		    "Doy": 220,
		    "SCF": 1.3564,
		    "Cloud": 99.9521,
		    "Age": 2.64961
		  },
		  {
		    "Year": 2013,
		    "Doy": 221,
		    "SCF": 1.9123,
		    "Cloud": 78.0131,
		    "Age": 3.05941
		  },
		  {
		    "Year": 2013,
		    "Doy": 222,
		    "SCF": 2.27556,
		    "Cloud": 51.527,
		    "Age": 2.12216
		  },
		  {
		    "Year": 2013,
		    "Doy": 223,
		    "SCF": 3.02058,
		    "Cloud": 96.3696,
		    "Age": 2.99743
		  },
		  {
		    "Year": 2013,
		    "Doy": 224,
		    "SCF": 3.3123,
		    "Cloud": 67.6901,
		    "Age": 2.73774
		  },
		  {
		    "Year": 2013,
		    "Doy": 225,
		    "SCF": 1.94898,
		    "Cloud": 97.3178,
		    "Age": 3.64159
		  },
		  {
		    "Year": 2013,
		    "Doy": 226,
		    "SCF": 0.783594,
		    "Cloud": 48.8978,
		    "Age": 2.40522
		  },
		  {
		    "Year": 2013,
		    "Doy": 227,
		    "SCF": 0.289203,
		    "Cloud": 7.473,
		    "Age": 0.242968
		  },
		  {
		    "Year": 2013,
		    "Doy": 228,
		    "SCF": 0.297257,
		    "Cloud": 99.8766,
		    "Age": 1.24168
		  },
		  {
		    "Year": 2013,
		    "Doy": 229,
		    "SCF": 0.319747,
		    "Cloud": 29.3796,
		    "Age": 0.641203
		  },
		  {
		    "Year": 2013,
		    "Doy": 230,
		    "SCF": 0.370198,
		    "Cloud": 99.9768,
		    "Age": 1.63748
		  },
		  {
		    "Year": 2013,
		    "Doy": 231,
		    "SCF": 0.401936,
		    "Cloud": 42.5831,
		    "Age": 1.15569
		  },
		  {
		    "Year": 2013,
		    "Doy": 232,
		    "SCF": 0.344797,
		    "Cloud": 61.601,
		    "Age": 1.42976
		  },
		  {
		    "Year": 2013,
		    "Doy": 233,
		    "SCF": 0.30282,
		    "Cloud": 41.273,
		    "Age": 1.0766
		  },
		  {
		    "Year": 2013,
		    "Doy": 234,
		    "SCF": 0.283538,
		    "Cloud": 22.167,
		    "Age": 0.338013
		  },
		  {
		    "Year": 2013,
		    "Doy": 235,
		    "SCF": 0.245629,
		    "Cloud": 22.4674,
		    "Age": 0.303768
		  },
		  {
		    "Year": 2013,
		    "Doy": 236,
		    "SCF": 0.235358,
		    "Cloud": 43.8261,
		    "Age": 0.608285
		  },
		  {
		    "Year": 2013,
		    "Doy": 237,
		    "SCF": 0.224104,
		    "Cloud": 30.4406,
		    "Age": 0.539545
		  },
		  {
		    "Year": 2013,
		    "Doy": 238,
		    "SCF": 0.211806,
		    "Cloud": 2.19608,
		    "Age": 0.0419492
		  },
		  {
		    "Year": 2013,
		    "Doy": 239,
		    "SCF": 0.294247,
		    "Cloud": 0.344107,
		    "Age": 0.00380405
		  },
		  {
		    "Year": 2013,
		    "Doy": 240,
		    "SCF": 0.474591,
		    "Cloud": 27.0697,
		    "Age": 0.273572
		  },
		  {
		    "Year": 2013,
		    "Doy": 241,
		    "SCF": 1.01953,
		    "Cloud": 95.0765,
		    "Age": 1.19809
		  },
		  {
		    "Year": 2013,
		    "Doy": 242,
		    "SCF": 0.689428,
		    "Cloud": 79.1475,
		    "Age": 1.74341
		  },
		  {
		    "Year": 2013,
		    "Doy": 243,
		    "SCF": 0.384875,
		    "Cloud": 10.2596,
		    "Age": 0.32134
		  },
		  {
		    "Year": 2013,
		    "Doy": 244,
		    "SCF": 1.6388,
		    "Cloud": 88.6131,
		    "Age": 1.14587
		  },
		  {
		    "Year": 2013,
		    "Doy": 245,
		    "SCF": 0.259376,
		    "Cloud": 3.49603,
		    "Age": 0.0887668
		  },
		  {
		    "Year": 2013,
		    "Doy": 246,
		    "SCF": 0.318062,
		    "Cloud": 13.7439,
		    "Age": 0.150086
		  },
		  {
		    "Year": 2013,
		    "Doy": 247,
		    "SCF": 0.22956,
		    "Cloud": 2.20681,
		    "Age": 0.0284358
		  },
		  {
		    "Year": 2013,
		    "Doy": 248,
		    "SCF": 0.390711,
		    "Cloud": 50.0022,
		    "Age": 0.529446
		  },
		  {
		    "Year": 2013,
		    "Doy": 249,
		    "SCF": 0.457832,
		    "Cloud": 98.6704,
		    "Age": 1.50218
		  },
		  {
		    "Year": 2013,
		    "Doy": 250,
		    "SCF": 0.504018,
		    "Cloud": 81.5314,
		    "Age": 2.04366
		  },
		  {
		    "Year": 2013,
		    "Doy": 251,
		    "SCF": 0.542129,
		    "Cloud": 61.7745,
		    "Age": 1.99683
		  },
		  {
		    "Year": 2013,
		    "Doy": 252,
		    "SCF": 0.750515,
		    "Cloud": 18.6263,
		    "Age": 0.65934
		  },
		  {
		    "Year": 2013,
		    "Doy": 253,
		    "SCF": 1.16784,
		    "Cloud": 68.4631,
		    "Age": 1.3091
		  },
		  {
		    "Year": 2013,
		    "Doy": 254,
		    "SCF": 0.852964,
		    "Cloud": 51.6088,
		    "Age": 1.37393
		  },
		  {
		    "Year": 2013,
		    "Doy": 255,
		    "SCF": 0.846315,
		    "Cloud": 23.2231,
		    "Age": 0.61605
		  },
		  {
		    "Year": 2013,
		    "Doy": 256,
		    "SCF": 1.55913,
		    "Cloud": 25.3846,
		    "Age": 0.435488
		  },
		  {
		    "Year": 2013,
		    "Doy": 257,
		    "SCF": 3.12356,
		    "Cloud": 99.6311,
		    "Age": 1.42959
		  },
		  {
		    "Year": 2013,
		    "Doy": 258,
		    "SCF": 4.65786,
		    "Cloud": 99.6994,
		    "Age": 2.42361
		  },
		  {
		    "Year": 2013,
		    "Doy": 259,
		    "SCF": 6.05884,
		    "Cloud": 99.5948,
		    "Age": 3.41037
		  },
		  {
		    "Year": 2013,
		    "Doy": 260,
		    "SCF": 7.32548,
		    "Cloud": 94.8229,
		    "Age": 4.19457
		  },
		  {
		    "Year": 2013,
		    "Doy": 261,
		    "SCF": 7.93104,
		    "Cloud": 72.0314,
		    "Age": 3.77372
		  },
		  {
		    "Year": 2013,
		    "Doy": 262,
		    "SCF": 7.59408,
		    "Cloud": 79.2189,
		    "Age": 3.83265
		  },
		  {
		    "Year": 2013,
		    "Doy": 263,
		    "SCF": 6.4452,
		    "Cloud": 7.25387,
		    "Age": 0.38211
		  },
		  {
		    "Year": 2013,
		    "Doy": 264,
		    "SCF": 6.04944,
		    "Cloud": 74.5129,
		    "Age": 0.977705
		  },
		  {
		    "Year": 2013,
		    "Doy": 265,
		    "SCF": 4.63477,
		    "Cloud": 69.2452,
		    "Age": 1.40013
		  },
		  {
		    "Year": 2013,
		    "Doy": 266,
		    "SCF": 3.32004,
		    "Cloud": 8.39348,
		    "Age": 0.249437
		  },
		  {
		    "Year": 2013,
		    "Doy": 267,
		    "SCF": 3.16014,
		    "Cloud": 37.7445,
		    "Age": 0.498889
		  },
		  {
		    "Year": 2013,
		    "Doy": 268,
		    "SCF": 3.18984,
		    "Cloud": 77.195,
		    "Age": 1.13108
		  },
		  {
		    "Year": 2013,
		    "Doy": 269,
		    "SCF": 3.23424,
		    "Cloud": 58.1807,
		    "Age": 1.27545
		  },
		  {
		    "Year": 2013,
		    "Doy": 270,
		    "SCF": 2.65288,
		    "Cloud": 1.49415,
		    "Age": 0.0541721
		  },
		  {
		    "Year": 2013,
		    "Doy": 271,
		    "SCF": 2.92359,
		    "Cloud": 96.5317,
		    "Age": 1.01986
		  },
		  {
		    "Year": 2013,
		    "Doy": 272,
		    "SCF": 3.05553,
		    "Cloud": 55.342,
		    "Age": 1.10888
		  },
		  {
		    "Year": 2013,
		    "Doy": 273,
		    "SCF": 2.68269,
		    "Cloud": 28.1105,
		    "Age": 0.659623
		  },
		  {
		    "Year": 2013,
		    "Doy": 274,
		    "SCF": 2.41062,
		    "Cloud": 10.0954,
		    "Age": 0.234406
		  },
		  {
		    "Year": 2013,
		    "Doy": 275,
		    "SCF": 2.54785,
		    "Cloud": 26.9646,
		    "Age": 0.332609
		  },
		  {
		    "Year": 2013,
		    "Doy": 276,
		    "SCF": 3.55701,
		    "Cloud": 61.8512,
		    "Age": 0.826776
		  },
		  {
		    "Year": 2013,
		    "Doy": 277,
		    "SCF": 5.38347,
		    "Cloud": 97.8305,
		    "Age": 1.78573
		  },
		  {
		    "Year": 2013,
		    "Doy": 278,
		    "SCF": 5.6678,
		    "Cloud": 81.913,
		    "Age": 2.26294
		  },
		  {
		    "Year": 2013,
		    "Doy": 279,
		    "SCF": 5.65024,
		    "Cloud": 52.5821,
		    "Age": 1.73546
		  },
		  {
		    "Year": 2013,
		    "Doy": 280,
		    "SCF": 7.30659,
		    "Cloud": 83.749,
		    "Age": 2.2575
		  },
		  {
		    "Year": 2013,
		    "Doy": 281,
		    "SCF": 8.68186,
		    "Cloud": 85.2164,
		    "Age": 2.78539
		  },
		  {
		    "Year": 2013,
		    "Doy": 282,
		    "SCF": 6.9693,
		    "Cloud": 84.1135,
		    "Age": 3.15117
		  },
		  {
		    "Year": 2013,
		    "Doy": 283,
		    "SCF": 6.65278,
		    "Cloud": 19.6024,
		    "Age": 0.666963
		  },
		  {
		    "Year": 2013,
		    "Doy": 284,
		    "SCF": 2.54896,
		    "Cloud": 17.7284,
		    "Age": 0.293493
		  },
		  {
		    "Year": 2013,
		    "Doy": 285,
		    "SCF": 0.591468,
		    "Cloud": 0.742386,
		    "Age": 0.0178874
		  },
		  {
		    "Year": 2013,
		    "Doy": 286,
		    "SCF": 0.426166,
		    "Cloud": 0.562339,
		    "Age": 0.0138613
		  },
		  {
		    "Year": 2013,
		    "Doy": 287,
		    "SCF": 0.966511,
		    "Cloud": 27.524,
		    "Age": 0.286844
		  },
		  {
		    "Year": 2013,
		    "Doy": 288,
		    "SCF": 0.832322,
		    "Cloud": 26.4256,
		    "Age": 0.471386
		  },
		  {
		    "Year": 2013,
		    "Doy": 289,
		    "SCF": 3.00064,
		    "Cloud": 85.2733,
		    "Age": 1.30855
		  },
		  {
		    "Year": 2013,
		    "Doy": 290,
		    "SCF": 5.63934,
		    "Cloud": 98.8121,
		    "Age": 2.28545
		  },
		  {
		    "Year": 2013,
		    "Doy": 291,
		    "SCF": 8.38846,
		    "Cloud": 5.39332,
		    "Age": 0.157023
		  },
		  {
		    "Year": 2013,
		    "Doy": 292,
		    "SCF": 9.49634,
		    "Cloud": 72.8659,
		    "Age": 0.880085
		  },
		  {
		    "Year": 2013,
		    "Doy": 293,
		    "SCF": 9.48744,
		    "Cloud": 91.0699,
		    "Age": 1.77548
		  },
		  {
		    "Year": 2013,
		    "Doy": 294,
		    "SCF": 9.4563,
		    "Cloud": 100,
		    "Age": 2.77505
		  },
		  {
		    "Year": 2013,
		    "Doy": 295,
		    "SCF": 9.49835,
		    "Cloud": 99.9956,
		    "Age": 3.77505
		  },
		  {
		    "Year": 2013,
		    "Doy": 296,
		    "SCF": 9.61331,
		    "Cloud": 96.1184,
		    "Age": 4.57641
		  },
		  {
		    "Year": 2013,
		    "Doy": 297,
		    "SCF": 8.6346,
		    "Cloud": 34.0204,
		    "Age": 1.94244
		  },
		  {
		    "Year": 2013,
		    "Doy": 298,
		    "SCF": 9.58376,
		    "Cloud": 36.8497,
		    "Age": 1.03605
		  },
		  {
		    "Year": 2013,
		    "Doy": 299,
		    "SCF": 15.2055,
		    "Cloud": 80.9035,
		    "Age": 1.65637
		  },
		  {
		    "Year": 2013,
		    "Doy": 300,
		    "SCF": 16.5689,
		    "Cloud": 97.813,
		    "Age": 2.58071
		  },
		  {
		    "Year": 2013,
		    "Doy": 301,
		    "SCF": 17.2378,
		    "Cloud": 54.5296,
		    "Age": 2.1609
		  },
		  {
		    "Year": 2013,
		    "Doy": 302,
		    "SCF": 18.9334,
		    "Cloud": 75.0535,
		    "Age": 2.5443
		  },
		  {
		    "Year": 2013,
		    "Doy": 303,
		    "SCF": 22.9575,
		    "Cloud": 33.6079,
		    "Age": 0.48711
		  },
		  {
		    "Year": 2013,
		    "Doy": 304,
		    "SCF": 27.1771,
		    "Cloud": 69.0175,
		    "Age": 1.04861
		  },
		  {
		    "Year": 2013,
		    "Doy": 305,
		    "SCF": 26.9965,
		    "Cloud": 29.2348,
		    "Age": 0.409263
		  },
		  {
		    "Year": 2013,
		    "Doy": 306,
		    "SCF": 25.8829,
		    "Cloud": 23.6944,
		    "Age": 0.550938
		  },
		  {
		    "Year": 2013,
		    "Doy": 307,
		    "SCF": 37.073,
		    "Cloud": 99.6428,
		    "Age": 1.54013
		  },
		  {
		    "Year": 2013,
		    "Doy": 308,
		    "SCF": 48.126,
		    "Cloud": 76.5014,
		    "Age": 1.57893
		  },
		  {
		    "Year": 2013,
		    "Doy": 309,
		    "SCF": 56.2167,
		    "Cloud": 44.6745,
		    "Age": 1.01384
		  },
		  {
		    "Year": 2013,
		    "Doy": 310,
		    "SCF": 61.8757,
		    "Cloud": 46.3622,
		    "Age": 0.908339
		  },
		  {
		    "Year": 2013,
		    "Doy": 311,
		    "SCF": 62.2706,
		    "Cloud": 86.2727,
		    "Age": 1.56864
		  },
		  {
		    "Year": 2013,
		    "Doy": 312,
		    "SCF": 64.3647,
		    "Cloud": 58.97,
		    "Age": 0.878757
		  },
		  {
		    "Year": 2013,
		    "Doy": 313,
		    "SCF": 65.4777,
		    "Cloud": 72.2536,
		    "Age": 1.4149
		  },
		  {
		    "Year": 2013,
		    "Doy": 314,
		    "SCF": 67.5353,
		    "Cloud": 18.4751,
		    "Age": 0.110836
		  },
		  {
		    "Year": 2013,
		    "Doy": 315,
		    "SCF": 62.3144,
		    "Cloud": 99.9797,
		    "Age": 1.1019
		  },
		  {
		    "Year": 2013,
		    "Doy": 316,
		    "SCF": 57.8982,
		    "Cloud": 25.2746,
		    "Age": 0.352576
		  },
		  {
		    "Year": 2013,
		    "Doy": 317,
		    "SCF": 57.9967,
		    "Cloud": 16.7606,
		    "Age": 0.194331
		  },
		  {
		    "Year": 2013,
		    "Doy": 318,
		    "SCF": 53.851,
		    "Cloud": 91.0574,
		    "Age": 1.04757
		  },
		  {
		    "Year": 2013,
		    "Doy": 319,
		    "SCF": 48.983,
		    "Cloud": 100,
		    "Age": 2.04754
		  },
		  {
		    "Year": 2013,
		    "Doy": 320,
		    "SCF": 44.3444,
		    "Cloud": 80.957,
		    "Age": 1.08533
		  },
		  {
		    "Year": 2013,
		    "Doy": 321,
		    "SCF": 42.6928,
		    "Cloud": 22.9729,
		    "Age": 0.325165
		  },
		  {
		    "Year": 2013,
		    "Doy": 322,
		    "SCF": 44.5187,
		    "Cloud": 88.1606,
		    "Age": 1.15185
		  },
		  {
		    "Year": 2013,
		    "Doy": 323,
		    "SCF": 46.1582,
		    "Cloud": 32.1554,
		    "Age": 0.535427
		  },
		  {
		    "Year": 2013,
		    "Doy": 324,
		    "SCF": 49.2474,
		    "Cloud": 69.6654,
		    "Age": 0.958733
		  },
		  {
		    "Year": 2013,
		    "Doy": 325,
		    "SCF": 50.6147,
		    "Cloud": 12.0635,
		    "Age": 0.199113
		  },
		  {
		    "Year": 2013,
		    "Doy": 326,
		    "SCF": 53.0619,
		    "Cloud": 54.4929,
		    "Age": 0.524495
		  },
		  {
		    "Year": 2013,
		    "Doy": 327,
		    "SCF": 51.9836,
		    "Cloud": 28.9881,
		    "Age": 0.395355
		  },
		  {
		    "Year": 2013,
		    "Doy": 328,
		    "SCF": 49.4089,
		    "Cloud": 25.91,
		    "Age": 0.212784
		  },
		  {
		    "Year": 2013,
		    "Doy": 329,
		    "SCF": 44.2644,
		    "Cloud": 82.4532,
		    "Age": 0.709922
		  },
		  {
		    "Year": 2013,
		    "Doy": 330,
		    "SCF": 40.8695,
		    "Cloud": 100,
		    "Age": 1.70944
		  },
		  {
		    "Year": 2013,
		    "Doy": 331,
		    "SCF": 37.8874,
		    "Cloud": 64.1567,
		    "Age": 1.14473
		  },
		  {
		    "Year": 2013,
		    "Doy": 332,
		    "SCF": 36.6918,
		    "Cloud": 29.5538,
		    "Age": 0.598972
		  },
		  {
		    "Year": 2013,
		    "Doy": 333,
		    "SCF": 39.7568,
		    "Cloud": 100,
		    "Age": 1.59687
		  },
		  {
		    "Year": 2013,
		    "Doy": 334,
		    "SCF": 43.2691,
		    "Cloud": 78.0504,
		    "Age": 2.04134
		  },
		  {
		    "Year": 2013,
		    "Doy": 335,
		    "SCF": 43.6608,
		    "Cloud": 37.8089,
		    "Age": 1.09347
		  },
		  {
		    "Year": 2013,
		    "Doy": 336,
		    "SCF": 44.4105,
		    "Cloud": 99.0445,
		    "Age": 2.09131
		  },
		  {
		    "Year": 2013,
		    "Doy": 337,
		    "SCF": 45.8744,
		    "Cloud": 45.9985,
		    "Age": 1.10127
		  },
		  {
		    "Year": 2013,
		    "Doy": 338,
		    "SCF": 44.6779,
		    "Cloud": 28.834,
		    "Age": 0.90991
		  },
		  {
		    "Year": 2013,
		    "Doy": 339,
		    "SCF": 50.6739,
		    "Cloud": 100,
		    "Age": 1.90737
		  },
		  {
		    "Year": 2013,
		    "Doy": 340,
		    "SCF": 57.2855,
		    "Cloud": 59.3208,
		    "Age": 1.59932
		  },
		  {
		    "Year": 2013,
		    "Doy": 341,
		    "SCF": 61.7208,
		    "Cloud": 21.35,
		    "Age": 0.533481
		  },
		  {
		    "Year": 2013,
		    "Doy": 342,
		    "SCF": 66.5927,
		    "Cloud": 78.6387,
		    "Age": 1.02919
		  },
		  {
		    "Year": 2013,
		    "Doy": 343,
		    "SCF": 71.0802,
		    "Cloud": 94.3772,
		    "Age": 1.92263
		  },
		  {
		    "Year": 2013,
		    "Doy": 344,
		    "SCF": 76.5192,
		    "Cloud": 89.6839,
		    "Age": 2.05514
		  },
		  {
		    "Year": 2013,
		    "Doy": 345,
		    "SCF": 80.9166,
		    "Cloud": 31.9498,
		    "Age": 1.58197
		  },
		  {
		    "Year": 2013,
		    "Doy": 346,
		    "SCF": 76.9052,
		    "Cloud": 74.5337,
		    "Age": 2.51139
		  },
		  {
		    "Year": 2013,
		    "Doy": 347,
		    "SCF": 75.4378,
		    "Cloud": 41.0597,
		    "Age": 3.10736
		  },
		  {
		    "Year": 2013,
		    "Doy": 348,
		    "SCF": 78.2924,
		    "Cloud": 95.1347,
		    "Age": 3.99792
		  },
		  {
		    "Year": 2013,
		    "Doy": 349,
		    "SCF": 81.5309,
		    "Cloud": 37.1467,
		    "Age": 4.25078
		  },
		  {
		    "Year": 2013,
		    "Doy": 350,
		    "SCF": 77.0876,
		    "Cloud": 98.6785,
		    "Age": 5.22039
		  },
		  {
		    "Year": 2013,
		    "Doy": 351,
		    "SCF": 73.5089,
		    "Cloud": 33.6598,
		    "Age": 5.68246
		  },
		  {
		    "Year": 2013,
		    "Doy": 352,
		    "SCF": 72.3773,
		    "Cloud": 91.1564,
		    "Age": 6.66979
		  },
		  {
		    "Year": 2013,
		    "Doy": 353,
		    "SCF": 72.1629,
		    "Cloud": 100,
		    "Age": 7.66979
		  },
		  {
		    "Year": 2013,
		    "Doy": 354,
		    "SCF": 72.1797,
		    "Cloud": 57.3212,
		    "Age": 8.32046
		  },
		  {
		    "Year": 2013,
		    "Doy": 355,
		    "SCF": 71.7478,
		    "Cloud": 2.03447,
		    "Age": 9.0784
		  },
		  {
		    "Year": 2013,
		    "Doy": 356,
		    "SCF": 70.4631,
		    "Cloud": 80.1609,
		    "Age": 9.94723
		  },
		  {
		    "Year": 2013,
		    "Doy": 357,
		    "SCF": 70.1633,
		    "Cloud": 35.1121,
		    "Age": 10.7923
		  },
		  {
		    "Year": 2013,
		    "Doy": 358,
		    "SCF": 69.5777,
		    "Cloud": 99.5193,
		    "Age": 11.7796
		  },
		  {
		    "Year": 2013,
		    "Doy": 359,
		    "SCF": 69.4082,
		    "Cloud": 95.3689,
		    "Age": 12.7794
		  },
		  {
		    "Year": 2013,
		    "Doy": 360,
		    "SCF": 69.7589,
		    "Cloud": 43.201,
		    "Age": 13.4265
		  },
		  {
		    "Year": 2013,
		    "Doy": 361,
		    "SCF": 68.4089,
		    "Cloud": 99.8272,
		    "Age": 14.3786
		  },
		  {
		    "Year": 2013,
		    "Doy": 362,
		    "SCF": 67.3358,
		    "Cloud": 90.7682,
		    "Age": 15.3526
		  },
		  {
		    "Year": 2013,
		    "Doy": 363,
		    "SCF": 66.8595,
		    "Cloud": 41.1722,
		    "Age": 16.3136
		  },
		  {
		    "Year": 2013,
		    "Doy": 364,
		    "SCF": 66.8333,
		    "Cloud": 99.429,
		    "Age": 17.3073
		  },
		  {
		    "Year": 2013,
		    "Doy": 365,
		    "SCF": 66.993,
		    "Cloud": 84.0612,
		    "Age": 18.2732
		  },
		  {
		    "Year": 2014,
		    "Doy": 1,
		    "SCF": 66.9236,
		    "Cloud": 99.9884,
		    "Age": 19.2607
		  },
		  {
		    "Year": 2014,
		    "Doy": 2,
		    "SCF": 66.9636,
		    "Cloud": 99.682,
		    "Age": 20.2557
		  },
		  {
		    "Year": 2014,
		    "Doy": 3,
		    "SCF": 67.0342,
		    "Cloud": 97.6693,
		    "Age": 21.2557
		  },
		  {
		    "Year": 2014,
		    "Doy": 4,
		    "SCF": 67.2652,
		    "Cloud": 94.3918,
		    "Age": 22.2415
		  },
		  {
		    "Year": 2014,
		    "Doy": 5,
		    "SCF": 67.5998,
		    "Cloud": 99.9085,
		    "Age": 23.239
		  },
		  {
		    "Year": 2014,
		    "Doy": 6,
		    "SCF": 68.0078,
		    "Cloud": 92.7799,
		    "Age": 24.2348
		  },
		  {
		    "Year": 2014,
		    "Doy": 7,
		    "SCF": 68.3189,
		    "Cloud": 99.3044,
		    "Age": 25.2189
		  },
		  {
		    "Year": 2014,
		    "Doy": 8,
		    "SCF": 68.6642,
		    "Cloud": 83.2798,
		    "Age": 26.1005
		  },
		  {
		    "Year": 2014,
		    "Doy": 9,
		    "SCF": 70.4319,
		    "Cloud": 66.3085,
		    "Age": 27.1005
		  },
		  {
		    "Year": 2014,
		    "Doy": 10,
		    "SCF": 72.5074,
		    "Cloud": 40.8971,
		    "Age": 28.0156
		  },
		  {
		    "Year": 2014,
		    "Doy": 11,
		    "SCF": 74.8899,
		    "Cloud": 89.1785,
		    "Age": 29.0185
		  },
		  {
		    "Year": 2014,
		    "Doy": 12,
		    "SCF": 76.4795,
		    "Cloud": 43.7698,
		    "Age": 29.9563
		  },
		  {
		    "Year": 2014,
		    "Doy": 13,
		    "SCF": 75.1323,
		    "Cloud": 100,
		    "Age": 30.9547
		  },
		  {
		    "Year": 2014,
		    "Doy": 14,
		    "SCF": 74.1116,
		    "Cloud": 77.5075,
		    "Age": 31.9531
		  },
		  {
		    "Year": 2014,
		    "Doy": 15,
		    "SCF": 73.8357,
		    "Cloud": 94.1419,
		    "Age": 32.953
		  },
		  {
		    "Year": 2014,
		    "Doy": 16,
		    "SCF": 73.6755,
		    "Cloud": 81.7391,
		    "Age": 33.9513
		  },
		  {
		    "Year": 2014,
		    "Doy": 17,
		    "SCF": 73.344,
		    "Cloud": 87.6421,
		    "Age": 34.9513
		  },
		  {
		    "Year": 2014,
		    "Doy": 18,
		    "SCF": 73.3221,
		    "Cloud": 93.898,
		    "Age": 35.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 19,
		    "SCF": 73.4822,
		    "Cloud": 96.13,
		    "Age": 36.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 20,
		    "SCF": 73.8653,
		    "Cloud": 100,
		    "Age": 37.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 21,
		    "SCF": 74.3213,
		    "Cloud": 79.4621,
		    "Age": 38.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 22,
		    "SCF": 74.768,
		    "Cloud": 92.1032,
		    "Age": 39.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 23,
		    "SCF": 75.0262,
		    "Cloud": 98.6582,
		    "Age": 40.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 24,
		    "SCF": 75.4128,
		    "Cloud": 92.2673,
		    "Age": 41.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 25,
		    "SCF": 75.5459,
		    "Cloud": 100,
		    "Age": 42.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 26,
		    "SCF": 75.7277,
		    "Cloud": 97.1073,
		    "Age": 43.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 27,
		    "SCF": 75.9941,
		    "Cloud": 97.7709,
		    "Age": 44.9497
		  },
		  {
		    "Year": 2014,
		    "Doy": 28,
		    "SCF": 76.3114,
		    "Cloud": 98.2574,
		    "Age": 45.9458
		  },
		  {
		    "Year": 2014,
		    "Doy": 29,
		    "SCF": 76.7235,
		    "Cloud": 100,
		    "Age": 46.9458
		  },
		  {
		    "Year": 2014,
		    "Doy": 30,
		    "SCF": 77.1817,
		    "Cloud": 99.4278,
		    "Age": 47.653
		  },
		  {
		    "Year": 2014,
		    "Doy": 31,
		    "SCF": 77.7244,
		    "Cloud": 96.92,
		    "Age": 46.6776
		  },
		  {
		    "Year": 2014,
		    "Doy": 32,
		    "SCF": 78.1942,
		    "Cloud": 98.9544,
		    "Age": 47.2467
		  },
		  {
		    "Year": 2014,
		    "Doy": 33,
		    "SCF": 78.8037,
		    "Cloud": 92.0073,
		    "Age": 48.2467
		  },
		  {
		    "Year": 2014,
		    "Doy": 34,
		    "SCF": 79.7458,
		    "Cloud": 88.8119,
		    "Age": 43.0764
		  },
		  {
		    "Year": 2014,
		    "Doy": 35,
		    "SCF": 80.3292,
		    "Cloud": 99.9898,
		    "Age": 43.9619
		  },
		  {
		    "Year": 2014,
		    "Doy": 36,
		    "SCF": 81.1806,
		    "Cloud": 99.984,
		    "Age": 44.9511
		  },
		  {
		    "Year": 2014,
		    "Doy": 37,
		    "SCF": 82.0908,
		    "Cloud": 94.0854,
		    "Age": 42.9249
		  },
		  {
		    "Year": 2014,
		    "Doy": 38,
		    "SCF": 83.1499,
		    "Cloud": 99.8461,
		    "Age": 43.9234
		  },
		  {
		    "Year": 2014,
		    "Doy": 39,
		    "SCF": 84.3164,
		    "Cloud": 63.3018,
		    "Age": 26.5609
		  },
		  {
		    "Year": 2014,
		    "Doy": 40,
		    "SCF": 83.799,
		    "Cloud": 97.3469,
		    "Age": 26.7414
		  },
		  {
		    "Year": 2014,
		    "Doy": 41,
		    "SCF": 83.9072,
		    "Cloud": 93.9188,
		    "Age": 25.8177
		  },
		  {
		    "Year": 2014,
		    "Doy": 42,
		    "SCF": 84.4067,
		    "Cloud": 74.2938,
		    "Age": 16.4544
		  },
		  {
		    "Year": 2014,
		    "Doy": 43,
		    "SCF": 83.7572,
		    "Cloud": 89.8636,
		    "Age": 13.3506
		  },
		  {
		    "Year": 2014,
		    "Doy": 44,
		    "SCF": 83.7608,
		    "Cloud": 96.2462,
		    "Age": 13.991
		  },
		  {
		    "Year": 2014,
		    "Doy": 45,
		    "SCF": 84.0065,
		    "Cloud": 96.5715,
		    "Age": 14.2252
		  },
		  {
		    "Year": 2014,
		    "Doy": 46,
		    "SCF": 84.5149,
		    "Cloud": 96.3783,
		    "Age": 14.7036
		  },
		  {
		    "Year": 2014,
		    "Doy": 47,
		    "SCF": 85.2734,
		    "Cloud": 97.0202,
		    "Age": 15.216
		  },
		  {
		    "Year": 2014,
		    "Doy": 48,
		    "SCF": 86.3087,
		    "Cloud": 92.0988,
		    "Age": 8.43643
		  },
		  {
		    "Year": 2014,
		    "Doy": 49,
		    "SCF": 88.399,
		    "Cloud": 15.8589,
		    "Age": 0.447348
		  },
		  {
		    "Year": 2014,
		    "Doy": 50,
		    "SCF": 86.6979,
		    "Cloud": 93.2329,
		    "Age": 1.27447
		  },
		  {
		    "Year": 2014,
		    "Doy": 51,
		    "SCF": 86.0958,
		    "Cloud": 99.984,
		    "Age": 2.27058
		  },
		  {
		    "Year": 2014,
		    "Doy": 52,
		    "SCF": 85.2251,
		    "Cloud": 98.1819,
		    "Age": 3.05122
		  },
		  {
		    "Year": 2014,
		    "Doy": 53,
		    "SCF": 84.569,
		    "Cloud": 95.5277,
		    "Age": 3.83692
		  },
		  {
		    "Year": 2014,
		    "Doy": 54,
		    "SCF": 83.7406,
		    "Cloud": 99.894,
		    "Age": 4.81504
		  },
		  {
		    "Year": 2014,
		    "Doy": 55,
		    "SCF": 83.0875,
		    "Cloud": 100,
		    "Age": 5.81504
		  },
		  {
		    "Year": 2014,
		    "Doy": 56,
		    "SCF": 82.4795,
		    "Cloud": 99.9376,
		    "Age": 6.81161
		  },
		  {
		    "Year": 2014,
		    "Doy": 57,
		    "SCF": 81.9161,
		    "Cloud": 99.7952,
		    "Age": 7.79176
		  },
		  {
		    "Year": 2014,
		    "Doy": 58,
		    "SCF": 81.6197,
		    "Cloud": 98.1162,
		    "Age": 8.62132
		  },
		  {
		    "Year": 2014,
		    "Doy": 59,
		    "SCF": 81.1513,
		    "Cloud": 99.5266,
		    "Age": 9.28096
		  },
		  {
		    "Year": 2014,
		    "Doy": 60,
		    "SCF": 80.7518,
		    "Cloud": 99.7372,
		    "Age": 10.2406
		  },
		  {
		    "Year": 2014,
		    "Doy": 61,
		    "SCF": 80.4094,
		    "Cloud": 99.2899,
		    "Age": 10.9625
		  },
		  {
		    "Year": 2014,
		    "Doy": 62,
		    "SCF": 80.1158,
		    "Cloud": 100,
		    "Age": 11.9625
		  },
		  {
		    "Year": 2014,
		    "Doy": 63,
		    "SCF": 79.8761,
		    "Cloud": 99.8983,
		    "Age": 12.9438
		  },
		  {
		    "Year": 2014,
		    "Doy": 64,
		    "SCF": 79.6986,
		    "Cloud": 96.4291,
		    "Age": 12.6592
		  },
		  {
		    "Year": 2014,
		    "Doy": 65,
		    "SCF": 79.5302,
		    "Cloud": 93.9081,
		    "Age": 12.8446
		  },
		  {
		    "Year": 2014,
		    "Doy": 66,
		    "SCF": 79.4919,
		    "Cloud": 99.9986,
		    "Age": 13.8444
		  },
		  {
		    "Year": 2014,
		    "Doy": 67,
		    "SCF": 79.5605,
		    "Cloud": 63.0794,
		    "Age": 8.25425
		  },
		  {
		    "Year": 2014,
		    "Doy": 68,
		    "SCF": 80.9243,
		    "Cloud": 53.7994,
		    "Age": 3.41544
		  },
		  {
		    "Year": 2014,
		    "Doy": 69,
		    "SCF": 83.3266,
		    "Cloud": 19.3518,
		    "Age": 1.39686
		  },
		  {
		    "Year": 2014,
		    "Doy": 70,
		    "SCF": 81.1225,
		    "Cloud": 99.4729,
		    "Age": 2.24295
		  },
		  {
		    "Year": 2014,
		    "Doy": 71,
		    "SCF": 79.508,
		    "Cloud": 70.1167,
		    "Age": 2.26507
		  },
		  {
		    "Year": 2014,
		    "Doy": 72,
		    "SCF": 78.4528,
		    "Cloud": 72.9907,
		    "Age": 2.71036
		  },
		  {
		    "Year": 2014,
		    "Doy": 73,
		    "SCF": 77.2307,
		    "Cloud": 100,
		    "Age": 3.7017
		  },
		  {
		    "Year": 2014,
		    "Doy": 74,
		    "SCF": 76.4895,
		    "Cloud": 70.8608,
		    "Age": 3.70861
		  },
		  {
		    "Year": 2014,
		    "Doy": 75,
		    "SCF": 76.9492,
		    "Cloud": 100,
		    "Age": 4.68404
		  },
		  {
		    "Year": 2014,
		    "Doy": 76,
		    "SCF": 78.0127,
		    "Cloud": 27.9066,
		    "Age": 2.36692
		  },
		  {
		    "Year": 2014,
		    "Doy": 77,
		    "SCF": 76.4325,
		    "Cloud": 92.7498,
		    "Age": 2.68093
		  },
		  {
		    "Year": 2014,
		    "Doy": 78,
		    "SCF": 75.5675,
		    "Cloud": 100,
		    "Age": 3.65542
		  },
		  {
		    "Year": 2014,
		    "Doy": 79,
		    "SCF": 74.8576,
		    "Cloud": 100,
		    "Age": 4.65542
		  },
		  {
		    "Year": 2014,
		    "Doy": 80,
		    "SCF": 74.6117,
		    "Cloud": 38.2757,
		    "Age": 2.8335
		  },
		  {
		    "Year": 2014,
		    "Doy": 81,
		    "SCF": 74.6167,
		    "Cloud": 98.1483,
		    "Age": 3.78354
		  },
		  {
		    "Year": 2014,
		    "Doy": 82,
		    "SCF": 75.0245,
		    "Cloud": 89.9393,
		    "Age": 3.75891
		  },
		  {
		    "Year": 2014,
		    "Doy": 83,
		    "SCF": 76.8546,
		    "Cloud": 49.3278,
		    "Age": 1.99557
		  },
		  {
		    "Year": 2014,
		    "Doy": 84,
		    "SCF": 76.1979,
		    "Cloud": 2.67862,
		    "Age": 0.018431
		  },
		  {
		    "Year": 2014,
		    "Doy": 85,
		    "SCF": 76.6554,
		    "Cloud": 98.468,
		    "Age": 1.00258
		  },
		  {
		    "Year": 2014,
		    "Doy": 86,
		    "SCF": 77.7356,
		    "Cloud": 95.2035,
		    "Age": 1.80511
		  },
		  {
		    "Year": 2014,
		    "Doy": 87,
		    "SCF": 79.2315,
		    "Cloud": 43.9654,
		    "Age": 0.739123
		  },
		  {
		    "Year": 2014,
		    "Doy": 88,
		    "SCF": 80.9372,
		    "Cloud": 1.43511,
		    "Age": 0.0302191
		  },
		  {
		    "Year": 2014,
		    "Doy": 89,
		    "SCF": 76.5584,
		    "Cloud": 10.1315,
		    "Age": 0.00274021
		  },
		  {
		    "Year": 2014,
		    "Doy": 90,
		    "SCF": 76.2234,
		    "Cloud": 71.2192,
		    "Age": 0.489834
		  },
		  {
		    "Year": 2014,
		    "Doy": 91,
		    "SCF": 76.3621,
		    "Cloud": 91.1455,
		    "Age": 1.18348
		  },
		  {
		    "Year": 2014,
		    "Doy": 92,
		    "SCF": 76.6786,
		    "Cloud": 47.3193,
		    "Age": 0.937521
		  },
		  {
		    "Year": 2014,
		    "Doy": 93,
		    "SCF": 75.9911,
		    "Cloud": 1.83797,
		    "Age": 0.00838755
		  },
		  {
		    "Year": 2014,
		    "Doy": 94,
		    "SCF": 76.629,
		    "Cloud": 0.331218,
		    "Age": 0.00166338
		  },
		  {
		    "Year": 2014,
		    "Doy": 95,
		    "SCF": 75.9464,
		    "Cloud": 99.5368,
		    "Age": 0.990067
		  },
		  {
		    "Year": 2014,
		    "Doy": 96,
		    "SCF": 75.7996,
		    "Cloud": 97.4822,
		    "Age": 1.86046
		  },
		  {
		    "Year": 2014,
		    "Doy": 97,
		    "SCF": 75.8972,
		    "Cloud": 18.4073,
		    "Age": 0.305882
		  },
		  {
		    "Year": 2014,
		    "Doy": 98,
		    "SCF": 75.1325,
		    "Cloud": 99.9884,
		    "Age": 1.26958
		  },
		  {
		    "Year": 2014,
		    "Doy": 99,
		    "SCF": 74.6232,
		    "Cloud": 99.6442,
		    "Age": 2.24508
		  },
		  {
		    "Year": 2014,
		    "Doy": 100,
		    "SCF": 73.9863,
		    "Cloud": 99.5368,
		    "Age": 3.1766
		  },
		  {
		    "Year": 2014,
		    "Doy": 101,
		    "SCF": 73.8406,
		    "Cloud": 34.0033,
		    "Age": 0.536022
		  },
		  {
		    "Year": 2014,
		    "Doy": 102,
		    "SCF": 72.0809,
		    "Cloud": 100,
		    "Age": 1.53342
		  },
		  {
		    "Year": 2014,
		    "Doy": 103,
		    "SCF": 70.9225,
		    "Cloud": 87.9026,
		    "Age": 2.25092
		  },
		  {
		    "Year": 2014,
		    "Doy": 104,
		    "SCF": 69.9532,
		    "Cloud": 66.0518,
		    "Age": 1.9171
		  },
		  {
		    "Year": 2014,
		    "Doy": 105,
		    "SCF": 69.1203,
		    "Cloud": 3.51717,
		    "Age": 0.0123466
		  },
		  {
		    "Year": 2014,
		    "Doy": 106,
		    "SCF": 69.3713,
		    "Cloud": 99.2579,
		    "Age": 1.00433
		  },
		  {
		    "Year": 2014,
		    "Doy": 107,
		    "SCF": 69.9973,
		    "Cloud": 99.9971,
		    "Age": 1.98769
		  },
		  {
		    "Year": 2014,
		    "Doy": 108,
		    "SCF": 71.0872,
		    "Cloud": 0.900546,
		    "Age": 0.00249584
		  },
		  {
		    "Year": 2014,
		    "Doy": 109,
		    "SCF": 68.2037,
		    "Cloud": 8.06517,
		    "Age": 0.0135537
		  },
		  {
		    "Year": 2014,
		    "Doy": 110,
		    "SCF": 67.2889,
		    "Cloud": 2.62121,
		    "Age": 0.00583465
		  },
		  {
		    "Year": 2014,
		    "Doy": 111,
		    "SCF": 65.4754,
		    "Cloud": 2.14297,
		    "Age": 0.0241011
		  },
		  {
		    "Year": 2014,
		    "Doy": 112,
		    "SCF": 63.2274,
		    "Cloud": 8.53187,
		    "Age": 0.0118612
		  },
		  {
		    "Year": 2014,
		    "Doy": 113,
		    "SCF": 64.8051,
		    "Cloud": 21.5514,
		    "Age": 0.0376678
		  },
		  {
		    "Year": 2014,
		    "Doy": 114,
		    "SCF": 63.3037,
		    "Cloud": 75.5004,
		    "Age": 0.423332
		  },
		  {
		    "Year": 2014,
		    "Doy": 115,
		    "SCF": 63.1763,
		    "Cloud": 5.89851,
		    "Age": 0.0908906
		  },
		  {
		    "Year": 2014,
		    "Doy": 116,
		    "SCF": 61.1121,
		    "Cloud": 54.0395,
		    "Age": 0.28974
		  },
		  {
		    "Year": 2014,
		    "Doy": 117,
		    "SCF": 59.1446,
		    "Cloud": 16.8056,
		    "Age": 0.106982
		  },
		  {
		    "Year": 2014,
		    "Doy": 118,
		    "SCF": 57.8508,
		    "Cloud": 48.8739,
		    "Age": 0.461606
		  },
		  {
		    "Year": 2014,
		    "Doy": 119,
		    "SCF": 55.7372,
		    "Cloud": 98.0251,
		    "Age": 1.43151
		  },
		  {
		    "Year": 2014,
		    "Doy": 120,
		    "SCF": 54.2539,
		    "Cloud": 73.3371,
		    "Age": 1.77671
		  },
		  {
		    "Year": 2014,
		    "Doy": 121,
		    "SCF": 52.2979,
		    "Cloud": 10.0904,
		    "Age": 0.160646
		  },
		  {
		    "Year": 2014,
		    "Doy": 122,
		    "SCF": 55.9638,
		    "Cloud": 22.4638,
		    "Age": 0.089397
		  },
		  {
		    "Year": 2014,
		    "Doy": 123,
		    "SCF": 54.4331,
		    "Cloud": 72.0437,
		    "Age": 0.499164
		  },
		  {
		    "Year": 2014,
		    "Doy": 124,
		    "SCF": 54.3024,
		    "Cloud": 25.2896,
		    "Age": 0.108148
		  },
		  {
		    "Year": 2014,
		    "Doy": 125,
		    "SCF": 52.6737,
		    "Cloud": 81.1443,
		    "Age": 0.603591
		  },
		  {
		    "Year": 2014,
		    "Doy": 126,
		    "SCF": 51.4107,
		    "Cloud": 100,
		    "Age": 1.60282
		  },
		  {
		    "Year": 2014,
		    "Doy": 127,
		    "SCF": 50.2546,
		    "Cloud": 100,
		    "Age": 2.60282
		  },
		  {
		    "Year": 2014,
		    "Doy": 128,
		    "SCF": 48.9337,
		    "Cloud": 100,
		    "Age": 3.60282
		  },
		  {
		    "Year": 2014,
		    "Doy": 129,
		    "SCF": 47.6623,
		    "Cloud": 98.982,
		    "Age": 4.32213
		  },
		  {
		    "Year": 2014,
		    "Doy": 130,
		    "SCF": 46.6212,
		    "Cloud": 82.9533,
		    "Age": 3.90118
		  },
		  {
		    "Year": 2014,
		    "Doy": 131,
		    "SCF": 45.1947,
		    "Cloud": 93.6107,
		    "Age": 4.43762
		  },
		  {
		    "Year": 2014,
		    "Doy": 132,
		    "SCF": 43.8756,
		    "Cloud": 97.9931,
		    "Age": 5.21136
		  },
		  {
		    "Year": 2014,
		    "Doy": 133,
		    "SCF": 42.6271,
		    "Cloud": 86.8036,
		    "Age": 4.49319
		  },
		  {
		    "Year": 2014,
		    "Doy": 134,
		    "SCF": 40.9459,
		    "Cloud": 85.3685,
		    "Age": 4.56578
		  },
		  {
		    "Year": 2014,
		    "Doy": 135,
		    "SCF": 39.2739,
		    "Cloud": 100,
		    "Age": 5.56094
		  },
		  {
		    "Year": 2014,
		    "Doy": 136,
		    "SCF": 37.6901,
		    "Cloud": 96.2747,
		    "Age": 6.2096
		  },
		  {
		    "Year": 2014,
		    "Doy": 137,
		    "SCF": 36.162,
		    "Cloud": 89.8675,
		    "Age": 5.67651
		  },
		  {
		    "Year": 2014,
		    "Doy": 138,
		    "SCF": 34.621,
		    "Cloud": 16.489,
		    "Age": 0.58465
		  },
		  {
		    "Year": 2014,
		    "Doy": 139,
		    "SCF": 32.3008,
		    "Cloud": 83.3635,
		    "Age": 1.40555
		  },
		  {
		    "Year": 2014,
		    "Doy": 140,
		    "SCF": 30.1881,
		    "Cloud": 31.7193,
		    "Age": 0.585849
		  },
		  {
		    "Year": 2014,
		    "Doy": 141,
		    "SCF": 27.328,
		    "Cloud": 94.3748,
		    "Age": 1.03397
		  },
		  {
		    "Year": 2014,
		    "Doy": 142,
		    "SCF": 24.672,
		    "Cloud": 83.7498,
		    "Age": 1.70862
		  },
		  {
		    "Year": 2014,
		    "Doy": 143,
		    "SCF": 22.0037,
		    "Cloud": 94.2533,
		    "Age": 2.58566
		  },
		  {
		    "Year": 2014,
		    "Doy": 144,
		    "SCF": 19.3803,
		    "Cloud": 60.6943,
		    "Age": 1.1521
		  },
		  {
		    "Year": 2014,
		    "Doy": 145,
		    "SCF": 16.5012,
		    "Cloud": 97.4311,
		    "Age": 2.0759
		  },
		  {
		    "Year": 2014,
		    "Doy": 146,
		    "SCF": 13.7612,
		    "Cloud": 15.9097,
		    "Age": 0.165612
		  },
		  {
		    "Year": 2014,
		    "Doy": 147,
		    "SCF": 12.4117,
		    "Cloud": 96.6542,
		    "Age": 1.10326
		  },
		  {
		    "Year": 2014,
		    "Doy": 148,
		    "SCF": 11.2307,
		    "Cloud": 10.0035,
		    "Age": 0.12339
		  },
		  {
		    "Year": 2014,
		    "Doy": 149,
		    "SCF": 10.1793,
		    "Cloud": 11.1017,
		    "Age": 0.10119
		  },
		  {
		    "Year": 2014,
		    "Doy": 150,
		    "SCF": 9.91427,
		    "Cloud": 39.1859,
		    "Age": 0.288605
		  },
		  {
		    "Year": 2014,
		    "Doy": 151,
		    "SCF": 8.37333,
		    "Cloud": 19.76,
		    "Age": 0.131996
		  },
		  {
		    "Year": 2014,
		    "Doy": 152,
		    "SCF": 7.58184,
		    "Cloud": 5.96539,
		    "Age": 0.0763138
		  },
		  {
		    "Year": 2014,
		    "Doy": 153,
		    "SCF": 7.20557,
		    "Cloud": 28.4651,
		    "Age": 0.201194
		  },
		  {
		    "Year": 2014,
		    "Doy": 154,
		    "SCF": 7.19283,
		    "Cloud": 74.7598,
		    "Age": 0.919301
		  },
		  {
		    "Year": 2014,
		    "Doy": 155,
		    "SCF": 6.82291,
		    "Cloud": 99.4366,
		    "Age": 1.91444
		  },
		  {
		    "Year": 2014,
		    "Doy": 156,
		    "SCF": 6.34232,
		    "Cloud": 99.923,
		    "Age": 2.91413
		  },
		  {
		    "Year": 2014,
		    "Doy": 157,
		    "SCF": 5.89328,
		    "Cloud": 49.9337,
		    "Age": 1.48608
		  },
		  {
		    "Year": 2014,
		    "Doy": 158,
		    "SCF": 5.77531,
		    "Cloud": 92.7351,
		    "Age": 2.32904
		  },
		  {
		    "Year": 2014,
		    "Doy": 159,
		    "SCF": 4.98487,
		    "Cloud": 37.362,
		    "Age": 1.48733
		  },
		  {
		    "Year": 2014,
		    "Doy": 160,
		    "SCF": 4.30119,
		    "Cloud": 9.12505,
		    "Age": 0.306496
		  },
		  {
		    "Year": 2014,
		    "Doy": 161,
		    "SCF": 3.99201,
		    "Cloud": 26.0141,
		    "Age": 0.473901
		  },
		  {
		    "Year": 2014,
		    "Doy": 162,
		    "SCF": 3.68738,
		    "Cloud": 30.735,
		    "Age": 0.430083
		  },
		  {
		    "Year": 2014,
		    "Doy": 163,
		    "SCF": 3.43155,
		    "Cloud": 82.3623,
		    "Age": 1.2194
		  },
		  {
		    "Year": 2014,
		    "Doy": 164,
		    "SCF": 3.08889,
		    "Cloud": 18.5719,
		    "Age": 0.403185
		  },
		  {
		    "Year": 2014,
		    "Doy": 165,
		    "SCF": 2.34914,
		    "Cloud": 2.41643,
		    "Age": 0.057635
		  },
		  {
		    "Year": 2014,
		    "Doy": 166,
		    "SCF": 2.31367,
		    "Cloud": 9.13619,
		    "Age": 0.116339
		  },
		  {
		    "Year": 2014,
		    "Doy": 167,
		    "SCF": 2.09687,
		    "Cloud": 2.81964,
		    "Age": 0.0651831
		  },
		  {
		    "Year": 2014,
		    "Doy": 168,
		    "SCF": 2.08309,
		    "Cloud": 79.5159,
		    "Age": 0.850761
		  },
		  {
		    "Year": 2014,
		    "Doy": 169,
		    "SCF": 1.93923,
		    "Cloud": 4.24198,
		    "Age": 0.102287
		  },
		  {
		    "Year": 2014,
		    "Doy": 170,
		    "SCF": 2.44158,
		    "Cloud": 71.4377,
		    "Age": 0.809231
		  },
		  {
		    "Year": 2014,
		    "Doy": 171,
		    "SCF": 2.31693,
		    "Cloud": 70.3872,
		    "Age": 1.04364
		  },
		  {
		    "Year": 2014,
		    "Doy": 172,
		    "SCF": 2.20303,
		    "Cloud": 75.2899,
		    "Age": 1.59075
		  },
		  {
		    "Year": 2014,
		    "Doy": 173,
		    "SCF": 2.1808,
		    "Cloud": 81.5013,
		    "Age": 1.95971
		  },
		  {
		    "Year": 2014,
		    "Doy": 174,
		    "SCF": 1.7866,
		    "Cloud": 87.2955,
		    "Age": 2.59777
		  },
		  {
		    "Year": 2014,
		    "Doy": 175,
		    "SCF": 1.53658,
		    "Cloud": 70.6228,
		    "Age": 2.61601
		  },
		  {
		    "Year": 2014,
		    "Doy": 176,
		    "SCF": 1.36638,
		    "Cloud": 39.0546,
		    "Age": 1.50488
		  },
		  {
		    "Year": 2014,
		    "Doy": 177,
		    "SCF": 1.46802,
		    "Cloud": 60.9324,
		    "Age": 1.62229
		  },
		  {
		    "Year": 2014,
		    "Doy": 178,
		    "SCF": 1.57927,
		    "Cloud": 99.5164,
		    "Age": 2.57702
		  },
		  {
		    "Year": 2014,
		    "Doy": 179,
		    "SCF": 1.6795,
		    "Cloud": 95.2669,
		    "Age": 3.39095
		  },
		  {
		    "Year": 2014,
		    "Doy": 180,
		    "SCF": 1.75284,
		    "Cloud": 66.6434,
		    "Age": 2.46028
		  },
		  {
		    "Year": 2014,
		    "Doy": 181,
		    "SCF": 2.27279,
		    "Cloud": 90.0606,
		    "Age": 3.10766
		  },
		  {
		    "Year": 2014,
		    "Doy": 182,
		    "SCF": 2.55247,
		    "Cloud": 73.4759,
		    "Age": 2.90072
		  },
		  {
		    "Year": 2014,
		    "Doy": 183,
		    "SCF": 1.77839,
		    "Cloud": 36.7545,
		    "Age": 1.45586
		  },
		  {
		    "Year": 2014,
		    "Doy": 184,
		    "SCF": 0.87631,
		    "Cloud": 28.5154,
		    "Age": 0.651995
		  },
		  {
		    "Year": 2014,
		    "Doy": 185,
		    "SCF": 0.692916,
		    "Cloud": 42.4622,
		    "Age": 0.77751
		  },
		  {
		    "Year": 2014,
		    "Doy": 186,
		    "SCF": 0.95259,
		    "Cloud": 94.4526,
		    "Age": 1.73857
		  },
		  {
		    "Year": 2014,
		    "Doy": 187,
		    "SCF": 1.24135,
		    "Cloud": 99.2797,
		    "Age": 2.73761
		  },
		  {
		    "Year": 2014,
		    "Doy": 188,
		    "SCF": 1.53741,
		    "Cloud": 97.1059,
		    "Age": 3.72487
		  },
		  {
		    "Year": 2014,
		    "Doy": 189,
		    "SCF": 1.53781,
		    "Cloud": 96.5693,
		    "Age": 4.59345
		  },
		  {
		    "Year": 2014,
		    "Doy": 190,
		    "SCF": 0.575044,
		    "Cloud": 40.2188,
		    "Age": 2.34411
		  },
		  {
		    "Year": 2014,
		    "Doy": 191,
		    "SCF": 0.325832,
		    "Cloud": 39.6739,
		    "Age": 1.37234
		  },
		  {
		    "Year": 2014,
		    "Doy": 192,
		    "SCF": 0.280155,
		    "Cloud": 20.7718,
		    "Age": 0.403142
		  },
		  {
		    "Year": 2014,
		    "Doy": 193,
		    "SCF": 0.373931,
		    "Cloud": 30.9407,
		    "Age": 0.443389
		  },
		  {
		    "Year": 2014,
		    "Doy": 194,
		    "SCF": 0.317097,
		    "Cloud": 14.2341,
		    "Age": 0.0928727
		  },
		  {
		    "Year": 2014,
		    "Doy": 195,
		    "SCF": 0.963513,
		    "Cloud": 87.0475,
		    "Age": 0.952718
		  },
		  {
		    "Year": 2014,
		    "Doy": 196,
		    "SCF": 0.875589,
		    "Cloud": 80.488,
		    "Age": 1.4984
		  },
		  {
		    "Year": 2014,
		    "Doy": 197,
		    "SCF": 0.493639,
		    "Cloud": 48.0393,
		    "Age": 1.22457
		  },
		  {
		    "Year": 2014,
		    "Doy": 198,
		    "SCF": 0.423109,
		    "Cloud": 98.5865,
		    "Age": 2.18435
		  },
		  {
		    "Year": 2014,
		    "Doy": 199,
		    "SCF": 0.35041,
		    "Cloud": 73.0055,
		    "Age": 2.36358
		  },
		  {
		    "Year": 2014,
		    "Doy": 200,
		    "SCF": 0.299569,
		    "Cloud": 39.0992,
		    "Age": 1.40486
		  },
		  {
		    "Year": 2014,
		    "Doy": 201,
		    "SCF": 0.239352,
		    "Cloud": 32.8977,
		    "Age": 0.511751
		  },
		  {
		    "Year": 2014,
		    "Doy": 202,
		    "SCF": 0.238604,
		    "Cloud": 19.4392,
		    "Age": 0.314271
		  },
		  {
		    "Year": 2014,
		    "Doy": 203,
		    "SCF": 0.434831,
		    "Cloud": 42.3815,
		    "Age": 0.31691
		  },
		  {
		    "Year": 2014,
		    "Doy": 204,
		    "SCF": 0.32788,
		    "Cloud": 11.7293,
		    "Age": 0.168475
		  },
		  {
		    "Year": 2014,
		    "Doy": 205,
		    "SCF": 1.20598,
		    "Cloud": 33.0133,
		    "Age": 0.106747
		  },
		  {
		    "Year": 2014,
		    "Doy": 206,
		    "SCF": 0.670186,
		    "Cloud": 22.4072,
		    "Age": 0.249931
		  },
		  {
		    "Year": 2014,
		    "Doy": 207,
		    "SCF": 1.20531,
		    "Cloud": 39.6163,
		    "Age": 0.590887
		  },
		  {
		    "Year": 2014,
		    "Doy": 208,
		    "SCF": 1.16825,
		    "Cloud": 87.8679,
		    "Age": 1.41064
		  },
		  {
		    "Year": 2014,
		    "Doy": 209,
		    "SCF": 1.21073,
		    "Cloud": 26.6586,
		    "Age": 0.711324
		  },
		  {
		    "Year": 2014,
		    "Doy": 210,
		    "SCF": 0.484669,
		    "Cloud": 34.9192,
		    "Age": 0.213949
		  },
		  {
		    "Year": 2014,
		    "Doy": 211,
		    "SCF": 0.574793,
		    "Cloud": 42.9186,
		    "Age": 0.699924
		  },
		  {
		    "Year": 2014,
		    "Doy": 212,
		    "SCF": 0.803065,
		    "Cloud": 93.544,
		    "Age": 1.21486
		  },
		  {
		    "Year": 2014,
		    "Doy": 213,
		    "SCF": 0.85021,
		    "Cloud": 62.9242,
		    "Age": 1.41099
		  },
		  {
		    "Year": 2014,
		    "Doy": 214,
		    "SCF": 0.924016,
		    "Cloud": 97.2509,
		    "Age": 2.35384
		  },
		  {
		    "Year": 2014,
		    "Doy": 215,
		    "SCF": 0.966499,
		    "Cloud": 99.4801,
		    "Age": 3.34935
		  },
		  {
		    "Year": 2014,
		    "Doy": 216,
		    "SCF": 1.02931,
		    "Cloud": 97.1111,
		    "Age": 4.23822
		  },
		  {
		    "Year": 2014,
		    "Doy": 217,
		    "SCF": 1.08408,
		    "Cloud": 75.1075,
		    "Age": 2.7552
		  },
		  {
		    "Year": 2014,
		    "Doy": 218,
		    "SCF": 0.858278,
		    "Cloud": 55.8961,
		    "Age": 2.29723
		  },
		  {
		    "Year": 2014,
		    "Doy": 219,
		    "SCF": 1.26295,
		    "Cloud": 80.3497,
		    "Age": 2.05978
		  },
		  {
		    "Year": 2014,
		    "Doy": 220,
		    "SCF": 0.732533,
		    "Cloud": 42.9678,
		    "Age": 1.19466
		  },
		  {
		    "Year": 2014,
		    "Doy": 221,
		    "SCF": 0.946633,
		    "Cloud": 98.5929,
		    "Age": 1.84391
		  },
		  {
		    "Year": 2014,
		    "Doy": 222,
		    "SCF": 1.14952,
		    "Cloud": 60.2784,
		    "Age": 1.75178
		  },
		  {
		    "Year": 2014,
		    "Doy": 223,
		    "SCF": 1.83961,
		    "Cloud": 76.1014,
		    "Age": 2.7502
		  },
		  {
		    "Year": 2014,
		    "Doy": 224,
		    "SCF": 2.47816,
		    "Cloud": 83.742,
		    "Age": 3.14036
		  },
		  {
		    "Year": 2014,
		    "Doy": 225,
		    "SCF": 2.82249,
		    "Cloud": 82.3205,
		    "Age": 3.42571
		  },
		  {
		    "Year": 2014,
		    "Doy": 226,
		    "SCF": 3.4814,
		    "Cloud": 93.4789,
		    "Age": 3.57971
		  },
		  {
		    "Year": 2014,
		    "Doy": 227,
		    "SCF": 4.02351,
		    "Cloud": 58.3503,
		    "Age": 2.59439
		  },
		  {
		    "Year": 2014,
		    "Doy": 228,
		    "SCF": 4.67489,
		    "Cloud": 83.4612,
		    "Age": 2.87277
		  },
		  {
		    "Year": 2014,
		    "Doy": 229,
		    "SCF": 6.08388,
		    "Cloud": 98.6146,
		    "Age": 3.81042
		  },
		  {
		    "Year": 2014,
		    "Doy": 230,
		    "SCF": 7.60596,
		    "Cloud": 61.9706,
		    "Age": 3.00249
		  },
		  {
		    "Year": 2014,
		    "Doy": 231,
		    "SCF": 6.07481,
		    "Cloud": 91.6504,
		    "Age": 3.6733
		  },
		  {
		    "Year": 2014,
		    "Doy": 232,
		    "SCF": 4.77319,
		    "Cloud": 61.5438,
		    "Age": 3.01503
		  },
		  {
		    "Year": 2014,
		    "Doy": 233,
		    "SCF": 3.92473,
		    "Cloud": 61.0327,
		    "Age": 1.6801
		  },
		  {
		    "Year": 2014,
		    "Doy": 234,
		    "SCF": 4.78615,
		    "Cloud": 70.2175,
		    "Age": 1.89957
		  },
		  {
		    "Year": 2014,
		    "Doy": 235,
		    "SCF": 5.39623,
		    "Cloud": 94.9465,
		    "Age": 2.56736
		  },
		  {
		    "Year": 2014,
		    "Doy": 236,
		    "SCF": 5.65386,
		    "Cloud": 91.4783,
		    "Age": 3.34391
		  },
		  {
		    "Year": 2014,
		    "Doy": 237,
		    "SCF": 5.91239,
		    "Cloud": 46.8766,
		    "Age": 1.62696
		  },
		  {
		    "Year": 2014,
		    "Doy": 238,
		    "SCF": 2.34352,
		    "Cloud": 58.5454,
		    "Age": 1.58662
		  },
		  {
		    "Year": 2014,
		    "Doy": 239,
		    "SCF": 0.96114,
		    "Cloud": 40.422,
		    "Age": 2.51288
		  },
		  {
		    "Year": 2014,
		    "Doy": 240,
		    "SCF": 0.522487,
		    "Cloud": 28.284,
		    "Age": 1.1198
		  },
		  {
		    "Year": 2014,
		    "Doy": 241,
		    "SCF": 0.467951,
		    "Cloud": 87.7812,
		    "Age": 1.89298
		  },
		  {
		    "Year": 2014,
		    "Doy": 242,
		    "SCF": 0.437986,
		    "Cloud": 99.9593,
		    "Age": 2.88572
		  },
		  {
		    "Year": 2014,
		    "Doy": 243,
		    "SCF": 0.405291,
		    "Cloud": 98.7129,
		    "Age": 3.84976
		  },
		  {
		    "Year": 2014,
		    "Doy": 244,
		    "SCF": 0.371165,
		    "Cloud": 95.0601,
		    "Age": 4.3604
		  },
		  {
		    "Year": 2014,
		    "Doy": 245,
		    "SCF": 0.249206,
		    "Cloud": 73.6587,
		    "Age": 4.03764
		  },
		  {
		    "Year": 2014,
		    "Doy": 246,
		    "SCF": 0.203275,
		    "Cloud": 5.72209,
		    "Age": 0.26894
		  },
		  {
		    "Year": 2014,
		    "Doy": 247,
		    "SCF": 0.203122,
		    "Cloud": 0.100765,
		    "Age": 0.00341726
		  },
		  {
		    "Year": 2014,
		    "Doy": 248,
		    "SCF": 0.240745,
		    "Cloud": 14.6083,
		    "Age": 0.148755
		  },
		  {
		    "Year": 2014,
		    "Doy": 249,
		    "SCF": 0.674297,
		    "Cloud": 58.8782,
		    "Age": 0
		  },
		  {
		    "Year": 2014,
		    "Doy": 250,
		    "SCF": 1.0916,
		    "Cloud": 99.9579,
		    "Age": 0.999622
		  },
		  {
		    "Year": 2014,
		    "Doy": 251,
		    "SCF": 1.55455,
		    "Cloud": 70.2108,
		    "Age": 1.07155
		  },
		  {
		    "Year": 2014,
		    "Doy": 252,
		    "SCF": 0.895779,
		    "Cloud": 99.8838,
		    "Age": 2.06832
		  },
		  {
		    "Year": 2014,
		    "Doy": 253,
		    "SCF": 0.280352,
		    "Cloud": 10.4035,
		    "Age": 0.0753037
		  },
		  {
		    "Year": 2014,
		    "Doy": 254,
		    "SCF": 0.774859,
		    "Cloud": 30.3628,
		    "Age": 0.323094
		  },
		  {
		    "Year": 2014,
		    "Doy": 255,
		    "SCF": 0.57785,
		    "Cloud": 94.2751,
		    "Age": 1.32265
		  },
		  {
		    "Year": 2014,
		    "Doy": 256,
		    "SCF": 0.265097,
		    "Cloud": 14.0493,
		    "Age": 0.250916
		  },
		  {
		    "Year": 2014,
		    "Doy": 257,
		    "SCF": 0.20197,
		    "Cloud": 0.271767,
		    "Age": 0.00480706
		  },
		  {
		    "Year": 2014,
		    "Doy": 258,
		    "SCF": 0.47524,
		    "Cloud": 31.8563,
		    "Age": 0.316279
		  },
		  {
		    "Year": 2014,
		    "Doy": 259,
		    "SCF": 0.330984,
		    "Cloud": 23.8302,
		    "Age": 0.260655
		  },
		  {
		    "Year": 2014,
		    "Doy": 260,
		    "SCF": 0.280991,
		    "Cloud": 16.0545,
		    "Age": 0.16456
		  },
		  {
		    "Year": 2014,
		    "Doy": 261,
		    "SCF": 0.222436,
		    "Cloud": 3.98071,
		    "Age": 0.0543778
		  },
		  {
		    "Year": 2014,
		    "Doy": 262,
		    "SCF": 0.453549,
		    "Cloud": 17.7856,
		    "Age": 0.208513
		  },
		  {
		    "Year": 2014,
		    "Doy": 263,
		    "SCF": 1.9573,
		    "Cloud": 69.7848,
		    "Age": 0.868019
		  },
		  {
		    "Year": 2014,
		    "Doy": 264,
		    "SCF": 1.90782,
		    "Cloud": 69.0058,
		    "Age": 1.26033
		  },
		  {
		    "Year": 2014,
		    "Doy": 265,
		    "SCF": 0.860094,
		    "Cloud": 16.1922,
		    "Age": 0.402676
		  },
		  {
		    "Year": 2014,
		    "Doy": 266,
		    "SCF": 1.26095,
		    "Cloud": 89.4436,
		    "Age": 1.22302
		  },
		  {
		    "Year": 2014,
		    "Doy": 267,
		    "SCF": 1.67552,
		    "Cloud": 53.6229,
		    "Age": 1.26814
		  },
		  {
		    "Year": 2014,
		    "Doy": 268,
		    "SCF": 1.74205,
		    "Cloud": 48.7791,
		    "Age": 1.04719
		  },
		  {
		    "Year": 2014,
		    "Doy": 269,
		    "SCF": 2.19356,
		    "Cloud": 44.3255,
		    "Age": 0.925661
		  },
		  {
		    "Year": 2014,
		    "Doy": 270,
		    "SCF": 1.85051,
		    "Cloud": 30.0598,
		    "Age": 0.657101
		  },
		  {
		    "Year": 2014,
		    "Doy": 271,
		    "SCF": 1.58529,
		    "Cloud": 100,
		    "Age": 1.65453
		  },
		  {
		    "Year": 2014,
		    "Doy": 272,
		    "SCF": 1.34861,
		    "Cloud": 87.6004,
		    "Age": 2.2885
		  },
		  {
		    "Year": 2014,
		    "Doy": 273,
		    "SCF": 1.13806,
		    "Cloud": 97.4544,
		    "Age": 3.24784
		  },
		  {
		    "Year": 2014,
		    "Doy": 274,
		    "SCF": 0.884728,
		    "Cloud": 99.1723,
		    "Age": 4.22003
		  },
		  {
		    "Year": 2014,
		    "Doy": 275,
		    "SCF": 0.602668,
		    "Cloud": 5.59476,
		    "Age": 0.335832
		  },
		  {
		    "Year": 2014,
		    "Doy": 276,
		    "SCF": 2.41579,
		    "Cloud": 90.2987,
		    "Age": 1.17694
		  },
		  {
		    "Year": 2014,
		    "Doy": 277,
		    "SCF": 3.66072,
		    "Cloud": 99.3421,
		    "Age": 2.15736
		  },
		  {
		    "Year": 2014,
		    "Doy": 278,
		    "SCF": 4.91851,
		    "Cloud": 96.5646,
		    "Age": 3.05242
		  },
		  {
		    "Year": 2014,
		    "Doy": 279,
		    "SCF": 6.07092,
		    "Cloud": 98.9468,
		    "Age": 4.02185
		  },
		  {
		    "Year": 2014,
		    "Doy": 280,
		    "SCF": 7.27504,
		    "Cloud": 99.9884,
		    "Age": 5.01911
		  },
		  {
		    "Year": 2014,
		    "Doy": 281,
		    "SCF": 8.51424,
		    "Cloud": 99.6718,
		    "Age": 6.00295
		  },
		  {
		    "Year": 2014,
		    "Doy": 282,
		    "SCF": 9.69536,
		    "Cloud": 95.8173,
		    "Age": 6.73842
		  },
		  {
		    "Year": 2014,
		    "Doy": 283,
		    "SCF": 11.024,
		    "Cloud": 92.3728,
		    "Age": 7.29091
		  },
		  {
		    "Year": 2014,
		    "Doy": 284,
		    "SCF": 11.5199,
		    "Cloud": 36.4676,
		    "Age": 3.02765
		  },
		  {
		    "Year": 2014,
		    "Doy": 285,
		    "SCF": 11.1866,
		    "Cloud": 96.0356,
		    "Age": 3.87561
		  },
		  {
		    "Year": 2014,
		    "Doy": 286,
		    "SCF": 10.5668,
		    "Cloud": 31.1523,
		    "Age": 1.75164
		  },
		  {
		    "Year": 2014,
		    "Doy": 287,
		    "SCF": 11.3348,
		    "Cloud": 99.8243,
		    "Age": 2.74686
		  },
		  {
		    "Year": 2014,
		    "Doy": 288,
		    "SCF": 12.1652,
		    "Cloud": 97.2074,
		    "Age": 3.61841
		  },
		  {
		    "Year": 2014,
		    "Doy": 289,
		    "SCF": 12.7483,
		    "Cloud": 99.3306,
		    "Age": 4.58855
		  },
		  {
		    "Year": 2014,
		    "Doy": 290,
		    "SCF": 13.3375,
		    "Cloud": 99.1171,
		    "Age": 5.5477
		  },
		  {
		    "Year": 2014,
		    "Doy": 291,
		    "SCF": 13.6875,
		    "Cloud": 100,
		    "Age": 6.5477
		  },
		  {
		    "Year": 2014,
		    "Doy": 292,
		    "SCF": 14.0985,
		    "Cloud": 79.4816,
		    "Age": 6.10253
		  },
		  {
		    "Year": 2014,
		    "Doy": 293,
		    "SCF": 11.269,
		    "Cloud": 41.8282,
		    "Age": 3.09546
		  },
		  {
		    "Year": 2014,
		    "Doy": 294,
		    "SCF": 11.4783,
		    "Cloud": 99.7357,
		    "Age": 4.07306
		  },
		  {
		    "Year": 2014,
		    "Doy": 295,
		    "SCF": 11.7064,
		    "Cloud": 99.7604,
		    "Age": 5.06163
		  },
		  {
		    "Year": 2014,
		    "Doy": 296,
		    "SCF": 11.9165,
		    "Cloud": 99.9332,
		    "Age": 6.05649
		  },
		  {
		    "Year": 2014,
		    "Doy": 297,
		    "SCF": 12.1741,
		    "Cloud": 99.9811,
		    "Age": 7.05573
		  },
		  {
		    "Year": 2014,
		    "Doy": 298,
		    "SCF": 12.5398,
		    "Cloud": 49.9562,
		    "Age": 4.24676
		  },
		  {
		    "Year": 2014,
		    "Doy": 299,
		    "SCF": 12.5111,
		    "Cloud": 49.9562,
		    "Age": 4.24676
		  },
		  {
		    "Year": 2014,
		    "Doy": 300,
		    "SCF": 11.5267,
		    "Cloud": 73.526,
		    "Age": 3.11838
		  },
		  {
		    "Year": 2014,
		    "Doy": 301,
		    "SCF": 11.0392,
		    "Cloud": 95.5238,
		    "Age": 3.95348
		  },
		  {
		    "Year": 2014,
		    "Doy": 302,
		    "SCF": 9.02493,
		    "Cloud": 14.7079,
		    "Age": 1.13198
		  },
		  {
		    "Year": 2014,
		    "Doy": 303,
		    "SCF": 12.991,
		    "Cloud": 46.7563,
		    "Age": 1.39563
		  },
		  {
		    "Year": 2014,
		    "Doy": 304,
		    "SCF": 16.8635,
		    "Cloud": 100,
		    "Age": 2.38899
		  },
		  {
		    "Year": 2014,
		    "Doy": 305,
		    "SCF": 20.886,
		    "Cloud": 99.1795,
		    "Age": 3.28711
		  },
		  {
		    "Year": 2014,
		    "Doy": 306,
		    "SCF": 24.972,
		    "Cloud": 99.8548,
		    "Age": 4.27653
		  },
		  {
		    "Year": 2014,
		    "Doy": 307,
		    "SCF": 29.1749,
		    "Cloud": 96.8677,
		    "Age": 5.07455
		  },
		  {
		    "Year": 2014,
		    "Doy": 308,
		    "SCF": 33.4206,
		    "Cloud": 84.3329,
		    "Age": 4.77901
		  },
		  {
		    "Year": 2014,
		    "Doy": 309,
		    "SCF": 37.5646,
		    "Cloud": 96.0435,
		    "Age": 5.57126
		  },
		  {
		    "Year": 2014,
		    "Doy": 310,
		    "SCF": 41.4564,
		    "Cloud": 56.8831,
		    "Age": 4.37157
		  },
		  {
		    "Year": 2014,
		    "Doy": 311,
		    "SCF": 43.5083,
		    "Cloud": 99.9898,
		    "Age": 5.35698
		  },
		  {
		    "Year": 2014,
		    "Doy": 312,
		    "SCF": 45.7962,
		    "Cloud": 93.5597,
		    "Age": 5.86861
		  },
		  {
		    "Year": 2014,
		    "Doy": 313,
		    "SCF": 47.8301,
		    "Cloud": 100,
		    "Age": 6.86861
		  },
		  {
		    "Year": 2014,
		    "Doy": 314,
		    "SCF": 49.9496,
		    "Cloud": 93.3259,
		    "Age": 7.23953
		  },
		  {
		    "Year": 2014,
		    "Doy": 315,
		    "SCF": 51.1143,
		    "Cloud": 46.3505,
		    "Age": 3.17168
		  },
		  {
		    "Year": 2014,
		    "Doy": 316,
		    "SCF": 52.5733,
		    "Cloud": 99.9913,
		    "Age": 4.1698
		  },
		  {
		    "Year": 2014,
		    "Doy": 317,
		    "SCF": 54.1299,
		    "Cloud": 99.1911,
		    "Age": 5.15505
		  },
		  {
		    "Year": 2014,
		    "Doy": 318,
		    "SCF": 55.7978,
		    "Cloud": 99.3146,
		    "Age": 6.11497
		  },
		  {
		    "Year": 2014,
		    "Doy": 319,
		    "SCF": 57.5289,
		    "Cloud": 100,
		    "Age": 7.11497
		  },
		  {
		    "Year": 2014,
		    "Doy": 320,
		    "SCF": 59.5394,
		    "Cloud": 99.9274,
		    "Age": 8.10752
		  },
		  {
		    "Year": 2014,
		    "Doy": 321,
		    "SCF": 61.3448,
		    "Cloud": 99.3683,
		    "Age": 9.06732
		  },
		  {
		    "Year": 2014,
		    "Doy": 322,
		    "SCF": 63.2069,
		    "Cloud": 98.5028,
		    "Age": 9.87764
		  },
		  {
		    "Year": 2014,
		    "Doy": 323,
		    "SCF": 65.1602,
		    "Cloud": 94.5354,
		    "Age": 10.36
		  },
		  {
		    "Year": 2014,
		    "Doy": 324,
		    "SCF": 67.526,
		    "Cloud": 96.5874,
		    "Age": 11
		  },
		  {
		    "Year": 2014,
		    "Doy": 325,
		    "SCF": 70.2638,
		    "Cloud": 94.547,
		    "Age": 11.5608
		  },
		  {
		    "Year": 2014,
		    "Doy": 326,
		    "SCF": 73.4569,
		    "Cloud": 43.7342,
		    "Age": 6.11075
		  },
		  {
		    "Year": 2014,
		    "Doy": 327,
		    "SCF": 73.5779,
		    "Cloud": 95.7713,
		    "Age": 6.80219
		  },
		  {
		    "Year": 2014,
		    "Doy": 328,
		    "SCF": 73.921,
		    "Cloud": 72.9113,
		    "Age": 5.85977
		  },
		  {
		    "Year": 2014,
		    "Doy": 329,
		    "SCF": 74.7321,
		    "Cloud": 35.0155,
		    "Age": 1.55346
		  },
		  {
		    "Year": 2014,
		    "Doy": 330,
		    "SCF": 72.252,
		    "Cloud": 57.4753,
		    "Age": 1.60832
		  },
		  {
		    "Year": 2014,
		    "Doy": 331,
		    "SCF": 72.1919,
		    "Cloud": 99.8475,
		    "Age": 2.60283
		  },
		  {
		    "Year": 2014,
		    "Doy": 332,
		    "SCF": 72.3128,
		    "Cloud": 99.4525,
		    "Age": 3.58253
		  },
		  {
		    "Year": 2014,
		    "Doy": 333,
		    "SCF": 72.5908,
		    "Cloud": 95.6537,
		    "Age": 4.2471
		  },
		  {
		    "Year": 2014,
		    "Doy": 334,
		    "SCF": 73.1696,
		    "Cloud": 97.9989,
		    "Age": 5.15791
		  },
		  {
		    "Year": 2014,
		    "Doy": 335,
		    "SCF": 73.9776,
		    "Cloud": 98.1337,
		    "Age": 6.03022
		  },
		  {
		    "Year": 2014,
		    "Doy": 336,
		    "SCF": 74.9994,
		    "Cloud": 99.7183,
		    "Age": 7.00584
		  },
		  {
		    "Year": 2014,
		    "Doy": 337,
		    "SCF": 76.3942,
		    "Cloud": 57.6628,
		    "Age": 4.74366
		  },
		  {
		    "Year": 2014,
		    "Doy": 338,
		    "SCF": 75.2603,
		    "Cloud": 8.66065,
		    "Age": 0.476917
		  },
		  {
		    "Year": 2014,
		    "Doy": 339,
		    "SCF": 77.1334,
		    "Cloud": 96.7457,
		    "Age": 1.43009
		  },
		  {
		    "Year": 2014,
		    "Doy": 340,
		    "SCF": 79.4689,
		    "Cloud": 23.8333,
		    "Age": 0.656305
		  },
		  {
		    "Year": 2014,
		    "Doy": 341,
		    "SCF": 75.1644,
		    "Cloud": 80.0703,
		    "Age": 1.36248
		  },
		  {
		    "Year": 2014,
		    "Doy": 342,
		    "SCF": 73.196,
		    "Cloud": 43.7493,
		    "Age": 1.10282
		  },
		  {
		    "Year": 2014,
		    "Doy": 343,
		    "SCF": 73.2829,
		    "Cloud": 34.8749,
		    "Age": 0.945141
		  },
		  {
		    "Year": 2014,
		    "Doy": 344,
		    "SCF": 70.4116,
		    "Cloud": 57.6543,
		    "Age": 1.12644
		  },
		  {
		    "Year": 2014,
		    "Doy": 345,
		    "SCF": 69.652,
		    "Cloud": 80.2594,
		    "Age": 1.73114
		  },
		  {
		    "Year": 2014,
		    "Doy": 346,
		    "SCF": 70.1952,
		    "Cloud": 77.7279,
		    "Age": 2.17642
		  },
		  {
		    "Year": 2014,
		    "Doy": 347,
		    "SCF": 71.6454,
		    "Cloud": 68.6906,
		    "Age": 2.24188
		  },
		  {
		    "Year": 2014,
		    "Doy": 348,
		    "SCF": 71.3567,
		    "Cloud": 99.5978,
		    "Age": 3.22545
		  },
		  {
		    "Year": 2014,
		    "Doy": 349,
		    "SCF": 71.4969,
		    "Cloud": 69.8515,
		    "Age": 3.01957
		  },
		  {
		    "Year": 2014,
		    "Doy": 350,
		    "SCF": 69.4506,
		    "Cloud": 78.7291,
		    "Age": 3.22251
		  },
		  {
		    "Year": 2014,
		    "Doy": 351,
		    "SCF": 71.7442,
		    "Cloud": 97.2714,
		    "Age": 4.06827
		  },
		  {
		    "Year": 2014,
		    "Doy": 352,
		    "SCF": 74.3615,
		    "Cloud": 97.527,
		    "Age": 4.93975
		  },
		  {
		    "Year": 2014,
		    "Doy": 353,
		    "SCF": 77.4793,
		    "Cloud": 60.3095,
		    "Age": 3.77486
		  },
		  {
		    "Year": 2014,
		    "Doy": 354,
		    "SCF": 78.0928,
		    "Cloud": 73.8415,
		    "Age": 3.54746
		  },
		  {
		    "Year": 2014,
		    "Doy": 355,
		    "SCF": 78.3925,
		    "Cloud": 81.9874,
		    "Age": 3.53577
		  },
		  {
		    "Year": 2014,
		    "Doy": 356,
		    "SCF": 79.1793,
		    "Cloud": 32.7972,
		    "Age": 1.62513
		  },
		  {
		    "Year": 2014,
		    "Doy": 357,
		    "SCF": 78.6377,
		    "Cloud": 36.3339,
		    "Age": 1.19784
		  },
		  {
		    "Year": 2014,
		    "Doy": 358,
		    "SCF": 77.2294,
		    "Cloud": 58.8331,
		    "Age": 1.3281
		  },
		  {
		    "Year": 2014,
		    "Doy": 359,
		    "SCF": 78.4488,
		    "Cloud": 38.3097,
		    "Age": 0.959775
		  },
		  {
		    "Year": 2014,
		    "Doy": 360,
		    "SCF": 78.3294,
		    "Cloud": 92.4981,
		    "Age": 1.77823
		  },
		  {
		    "Year": 2014,
		    "Doy": 361,
		    "SCF": 78.8324,
		    "Cloud": 62.1362,
		    "Age": 1.87341
		  },
		  {
		    "Year": 2014,
		    "Doy": 362,
		    "SCF": 77.2629,
		    "Cloud": 100,
		    "Age": 2.87311
		  },
		  {
		    "Year": 2014,
		    "Doy": 363,
		    "SCF": 75.862,
		    "Cloud": 98.6597,
		    "Age": 3.80116
		  },
		  {
		    "Year": 2014,
		    "Doy": 364,
		    "SCF": 74.7037,
		    "Cloud": 73.9367,
		    "Age": 3.70138
		  },
		  {
		    "Year": 2014,
		    "Doy": 365,
		    "SCF": 72.7978,
		    "Cloud": 86.0784,
		    "Age": 4.28342
		  },
		  {
		    "Year": 2015,
		    "Doy": 1,
		    "SCF": 70.2077,
		    "Cloud": 72.6558,
		    "Age": 5.13345
		  },
		  {
		    "Year": 2015,
		    "Doy": 2,
		    "SCF": 67.1247,
		    "Cloud": 46.8119,
		    "Age": 2.73615
		  },
		  {
		    "Year": 2015,
		    "Doy": 3,
		    "SCF": 66.6333,
		    "Cloud": 60.8655,
		    "Age": 2.35397
		  },
		  {
		    "Year": 2015,
		    "Doy": 4,
		    "SCF": 67.6108,
		    "Cloud": 31.189,
		    "Age": 1.28619
		  },
		  {
		    "Year": 2015,
		    "Doy": 5,
		    "SCF": 68.1257,
		    "Cloud": 95.4083,
		    "Age": 2.20165
		  },
		  {
		    "Year": 2015,
		    "Doy": 6,
		    "SCF": 69.2986,
		    "Cloud": 100,
		    "Age": 3.20165
		  },
		  {
		    "Year": 2015,
		    "Doy": 7,
		    "SCF": 70.7304,
		    "Cloud": 52.9402,
		    "Age": 2.38707
		  },
		  {
		    "Year": 2015,
		    "Doy": 8,
		    "SCF": 71.8354,
		    "Cloud": 25.1127,
		    "Age": 1.18087
		  },
		  {
		    "Year": 2015,
		    "Doy": 9,
		    "SCF": 71.2018,
		    "Cloud": 90.2642,
		    "Age": 1.98009
		  },
		  {
		    "Year": 2015,
		    "Doy": 10,
		    "SCF": 71.3148,
		    "Cloud": 100,
		    "Age": 2.98
		  },
		  {
		    "Year": 2015,
		    "Doy": 11,
		    "SCF": 71.1665,
		    "Cloud": 99.8185,
		    "Age": 3.97229
		  },
		  {
		    "Year": 2015,
		    "Doy": 12,
		    "SCF": 71.1909,
		    "Cloud": 77.1038,
		    "Age": 3.59434
		  },
		  {
		    "Year": 2015,
		    "Doy": 13,
		    "SCF": 71.7057,
		    "Cloud": 95.7924,
		    "Age": 4.35849
		  },
		  {
		    "Year": 2015,
		    "Doy": 14,
		    "SCF": 72.1653,
		    "Cloud": 89.5815,
		    "Age": 3.50782
		  },
		  {
		    "Year": 2015,
		    "Doy": 15,
		    "SCF": 72.4158,
		    "Cloud": 99.6181,
		    "Age": 4.49578
		  },
		  {
		    "Year": 2015,
		    "Doy": 16,
		    "SCF": 72.9775,
		    "Cloud": 78.0653,
		    "Age": 3.84116
		  },
		  {
		    "Year": 2015,
		    "Doy": 17,
		    "SCF": 73.4023,
		    "Cloud": 88.969,
		    "Age": 4.30446
		  },
		  {
		    "Year": 2015,
		    "Doy": 18,
		    "SCF": 74.4201,
		    "Cloud": 88.0738,
		    "Age": 4.62499
		  },
		  {
		    "Year": 2015,
		    "Doy": 19,
		    "SCF": 75.2154,
		    "Cloud": 96.9084,
		    "Age": 5.47905
		  },
		  {
		    "Year": 2015,
		    "Doy": 20,
		    "SCF": 76.1145,
		    "Cloud": 93.6483,
		    "Age": 6.02835
		  },
		  {
		    "Year": 2015,
		    "Doy": 21,
		    "SCF": 77.1528,
		    "Cloud": 95.6392,
		    "Age": 6.59785
		  },
		  {
		    "Year": 2015,
		    "Doy": 22,
		    "SCF": 78.5267,
		    "Cloud": 60.7924,
		    "Age": 4.56119
		  },
		  {
		    "Year": 2015,
		    "Doy": 23,
		    "SCF": 80.7249,
		    "Cloud": 71.5537,
		    "Age": 2.74454
		  },
		  {
		    "Year": 2015,
		    "Doy": 24,
		    "SCF": 80.9551,
		    "Cloud": 62.2952,
		    "Age": 2.49162
		  },
		  {
		    "Year": 2015,
		    "Doy": 25,
		    "SCF": 80.9685,
		    "Cloud": 86.6441,
		    "Age": 2.92129
		  },
		  {
		    "Year": 2015,
		    "Doy": 26,
		    "SCF": 81.1664,
		    "Cloud": 84.322,
		    "Age": 3.31115
		  },
		  {
		    "Year": 2015,
		    "Doy": 27,
		    "SCF": 81.3199,
		    "Cloud": 75.5653,
		    "Age": 3.12991
		  },
		  {
		    "Year": 2015,
		    "Doy": 28,
		    "SCF": 81.0296,
		    "Cloud": 94.8986,
		    "Age": 3.85868
		  },
		  {
		    "Year": 2015,
		    "Doy": 29,
		    "SCF": 81.1331,
		    "Cloud": 83.4265,
		    "Age": 4.13361
		  },
		  {
		    "Year": 2015,
		    "Doy": 30,
		    "SCF": 81.573,
		    "Cloud": 99.9898,
		    "Age": 5.13335
		  },
		  {
		    "Year": 2015,
		    "Doy": 31,
		    "SCF": 82.1367,
		    "Cloud": 93.3417,
		    "Age": 5.69965
		  },
		  {
		    "Year": 2015,
		    "Doy": 32,
		    "SCF": 82.7941,
		    "Cloud": 99.9477,
		    "Age": 6.69783
		  },
		  {
		    "Year": 2015,
		    "Doy": 33,
		    "SCF": 83.5863,
		    "Cloud": 77.5612,
		    "Age": 5.86823
		  },
		  {
		    "Year": 2015,
		    "Doy": 34,
		    "SCF": 86.7261,
		    "Cloud": 31.5607,
		    "Age": 2.45667
		  },
		  {
		    "Year": 2015,
		    "Doy": 35,
		    "SCF": 87.5899,
		    "Cloud": 33.1531,
		    "Age": 1.25207
		  },
		  {
		    "Year": 2015,
		    "Doy": 36,
		    "SCF": 85.4483,
		    "Cloud": 100,
		    "Age": 2.2498
		  },
		  {
		    "Year": 2015,
		    "Doy": 37,
		    "SCF": 83.9593,
		    "Cloud": 28.5156,
		    "Age": 0.513708
		  },
		  {
		    "Year": 2015,
		    "Doy": 38,
		    "SCF": 83.5058,
		    "Cloud": 40.0673,
		    "Age": 0.53309
		  },
		  {
		    "Year": 2015,
		    "Doy": 39,
		    "SCF": 80.5444,
		    "Cloud": 59.9023,
		    "Age": 0.526994
		  },
		  {
		    "Year": 2015,
		    "Doy": 40,
		    "SCF": 80.7864,
		    "Cloud": 99.9782,
		    "Age": 1.52628
		  },
		  {
		    "Year": 2015,
		    "Doy": 41,
		    "SCF": 81.2861,
		    "Cloud": 93.0238,
		    "Age": 2.52628
		  },
		  {
		    "Year": 2015,
		    "Doy": 42,
		    "SCF": 82.2213,
		    "Cloud": 59.5402,
		    "Age": 1.9685
		  },
		  {
		    "Year": 2015,
		    "Doy": 43,
		    "SCF": 82.7603,
		    "Cloud": 47.7169,
		    "Age": 1.38029
		  },
		  {
		    "Year": 2015,
		    "Doy": 44,
		    "SCF": 83.4515,
		    "Cloud": 99.9898,
		    "Age": 2.37957
		  },
		  {
		    "Year": 2015,
		    "Doy": 45,
		    "SCF": 84.4197,
		    "Cloud": 28.9926,
		    "Age": 1.12302
		  },
		  {
		    "Year": 2015,
		    "Doy": 46,
		    "SCF": 82.0978,
		    "Cloud": 99.3422,
		    "Age": 2.10483
		  },
		  {
		    "Year": 2015,
		    "Doy": 47,
		    "SCF": 80.2037,
		    "Cloud": 96.7123,
		    "Age": 3.01378
		  },
		  {
		    "Year": 2015,
		    "Doy": 48,
		    "SCF": 78.6341,
		    "Cloud": 66.1685,
		    "Age": 2.72577
		  },
		  {
		    "Year": 2015,
		    "Doy": 49,
		    "SCF": 79.0563,
		    "Cloud": 76.6626,
		    "Age": 2.94032
		  },
		  {
		    "Year": 2015,
		    "Doy": 50,
		    "SCF": 80.6172,
		    "Cloud": 45.3621,
		    "Age": 3.94073
		  },
		  {
		    "Year": 2015,
		    "Doy": 51,
		    "SCF": 78.831,
		    "Cloud": 49.9774,
		    "Age": 2.25899
		  },
		  {
		    "Year": 2015,
		    "Doy": 52,
		    "SCF": 81.0048,
		    "Cloud": 25.7526,
		    "Age": 0.996905
		  },
		  {
		    "Year": 2015,
		    "Doy": 53,
		    "SCF": 75.1392,
		    "Cloud": 42.2832,
		    "Age": 0.895177
		  },
		  {
		    "Year": 2015,
		    "Doy": 54,
		    "SCF": 75.8745,
		    "Cloud": 98.8789,
		    "Age": 1.87395
		  },
		  {
		    "Year": 2015,
		    "Doy": 55,
		    "SCF": 77.056,
		    "Cloud": 98.0016,
		    "Age": 2.78913
		  },
		  {
		    "Year": 2015,
		    "Doy": 56,
		    "SCF": 78.5775,
		    "Cloud": 82.5958,
		    "Age": 3.17487
		  },
		  {
		    "Year": 2015,
		    "Doy": 57,
		    "SCF": 79.6747,
		    "Cloud": 100,
		    "Age": 4.16839
		  },
		  {
		    "Year": 2015,
		    "Doy": 58,
		    "SCF": 81.193,
		    "Cloud": 43.4574,
		    "Age": 2.35245
		  },
		  {
		    "Year": 2015,
		    "Doy": 59,
		    "SCF": 81.0726,
		    "Cloud": 98.0672,
		    "Age": 3.29849
		  },
		  {
		    "Year": 2015,
		    "Doy": 60,
		    "SCF": 81.3797,
		    "Cloud": 99.9158,
		    "Age": 4.26055
		  },
		  {
		    "Year": 2015,
		    "Doy": 61,
		    "SCF": 82.012,
		    "Cloud": 80.1743,
		    "Age": 4.27357
		  },
		  {
		    "Year": 2015,
		    "Doy": 62,
		    "SCF": 83.2424,
		    "Cloud": 93.795,
		    "Age": 4.83934
		  },
		  {
		    "Year": 2015,
		    "Doy": 63,
		    "SCF": 85.3891,
		    "Cloud": 6.26621,
		    "Age": 0.545427
		  },
		  {
		    "Year": 2015,
		    "Doy": 64,
		    "SCF": 83.2634,
		    "Cloud": 100,
		    "Age": 1.39995
		  },
		  {
		    "Year": 2015,
		    "Doy": 65,
		    "SCF": 81.6879,
		    "Cloud": 99.3378,
		    "Age": 2.38635
		  },
		  {
		    "Year": 2015,
		    "Doy": 66,
		    "SCF": 80.3991,
		    "Cloud": 60.6238,
		    "Age": 3.38989
		  },
		  {
		    "Year": 2015,
		    "Doy": 67,
		    "SCF": 78.5657,
		    "Cloud": 67.7644,
		    "Age": 4.38735
		  },
		  {
		    "Year": 2015,
		    "Doy": 68,
		    "SCF": 79.2967,
		    "Cloud": 31.6271,
		    "Age": 1.89824
		  },
		  {
		    "Year": 2015,
		    "Doy": 69,
		    "SCF": 76.7379,
		    "Cloud": 58.3888,
		    "Age": 2.07633
		  },
		  {
		    "Year": 2015,
		    "Doy": 70,
		    "SCF": 81.7363,
		    "Cloud": 0.882001,
		    "Age": 0.243899
		  },
		  {
		    "Year": 2015,
		    "Doy": 71,
		    "SCF": 74.2107,
		    "Cloud": 8.58072,
		    "Age": 0.154249
		  },
		  {
		    "Year": 2015,
		    "Doy": 72,
		    "SCF": 80.1805,
		    "Cloud": 2.79211,
		    "Age": 0.0580877
		  },
		  {
		    "Year": 2015,
		    "Doy": 73,
		    "SCF": 77.5041,
		    "Cloud": 0.357278,
		    "Age": 0.0100913
		  },
		  {
		    "Year": 2015,
		    "Doy": 74,
		    "SCF": 77.4889,
		    "Cloud": 4.07577,
		    "Age": 0.047626
		  },
		  {
		    "Year": 2015,
		    "Doy": 75,
		    "SCF": 75.5598,
		    "Cloud": 100,
		    "Age": 1.04744
		  },
		  {
		    "Year": 2015,
		    "Doy": 76,
		    "SCF": 74.0869,
		    "Cloud": 100,
		    "Age": 2.04744
		  },
		  {
		    "Year": 2015,
		    "Doy": 77,
		    "SCF": 72.7516,
		    "Cloud": 94.859,
		    "Age": 2.89156
		  },
		  {
		    "Year": 2015,
		    "Doy": 78,
		    "SCF": 71.5684,
		    "Cloud": 99.8751,
		    "Age": 3.88605
		  },
		  {
		    "Year": 2015,
		    "Doy": 79,
		    "SCF": 70.5204,
		    "Cloud": 92.6685,
		    "Age": 4.49977
		  },
		  {
		    "Year": 2015,
		    "Doy": 80,
		    "SCF": 69.2751,
		    "Cloud": 15.0015,
		    "Age": 0.677563
		  },
		  {
		    "Year": 2015,
		    "Doy": 81,
		    "SCF": 70.474,
		    "Cloud": 99.9666,
		    "Age": 1.67451
		  },
		  {
		    "Year": 2015,
		    "Doy": 82,
		    "SCF": 72.4081,
		    "Cloud": 50.8729,
		    "Age": 2.67576
		  },
		  {
		    "Year": 2015,
		    "Doy": 83,
		    "SCF": 73.9951,
		    "Cloud": 1.3547,
		    "Age": 0.0478885
		  },
		  {
		    "Year": 2015,
		    "Doy": 84,
		    "SCF": 74.9669,
		    "Cloud": 99.6253,
		    "Age": 1.04386
		  },
		  {
		    "Year": 2015,
		    "Doy": 85,
		    "SCF": 76.3829,
		    "Cloud": 99.9927,
		    "Age": 2.04002
		  },
		  {
		    "Year": 2015,
		    "Doy": 86,
		    "SCF": 77.9019,
		    "Cloud": 98.7003,
		    "Age": 3.00203
		  },
		  {
		    "Year": 2015,
		    "Doy": 87,
		    "SCF": 79.5183,
		    "Cloud": 94.6499,
		    "Age": 1.02382
		  },
		  {
		    "Year": 2015,
		    "Doy": 88,
		    "SCF": 80.4996,
		    "Cloud": 95.979,
		    "Age": 1.96317
		  },
		  {
		    "Year": 2015,
		    "Doy": 89,
		    "SCF": 81.4677,
		    "Cloud": 91.4526,
		    "Age": 2.53059
		  },
		  {
		    "Year": 2015,
		    "Doy": 90,
		    "SCF": 83.282,
		    "Cloud": 9.27614,
		    "Age": 0.333396
		  },
		  {
		    "Year": 2015,
		    "Doy": 91,
		    "SCF": 80.0675,
		    "Cloud": 82.2967,
		    "Age": 1.09393
		  },
		  {
		    "Year": 2015,
		    "Doy": 92,
		    "SCF": 77.9139,
		    "Cloud": 38.5594,
		    "Age": 1.6743
		  },
		  {
		    "Year": 2015,
		    "Doy": 93,
		    "SCF": 79.7594,
		    "Cloud": 20.2638,
		    "Age": 0.567616
		  },
		  {
		    "Year": 2015,
		    "Doy": 94,
		    "SCF": 75.6186,
		    "Cloud": 27.7595,
		    "Age": 0.257715
		  },
		  {
		    "Year": 2015,
		    "Doy": 95,
		    "SCF": 74.8808,
		    "Cloud": 99.7226,
		    "Age": 1.25382
		  },
		  {
		    "Year": 2015,
		    "Doy": 96,
		    "SCF": 74.7323,
		    "Cloud": 88.9418,
		    "Age": 2.01111
		  },
		  {
		    "Year": 2015,
		    "Doy": 97,
		    "SCF": 74.2117,
		    "Cloud": 93.1756,
		    "Age": 2.80006
		  },
		  {
		    "Year": 2015,
		    "Doy": 98,
		    "SCF": 73.9675,
		    "Cloud": 60.9258,
		    "Age": 3.80042
		  },
		  {
		    "Year": 2015,
		    "Doy": 99,
		    "SCF": 73.0065,
		    "Cloud": 31.5302,
		    "Age": 1.47936
		  },
		  {
		    "Year": 2015,
		    "Doy": 100,
		    "SCF": 72.9548,
		    "Cloud": 28.6844,
		    "Age": 0.555355
		  },
		  {
		    "Year": 2015,
		    "Doy": 101,
		    "SCF": 69.934,
		    "Cloud": 88.7248,
		    "Age": 1.37075
		  },
		  {
		    "Year": 2015,
		    "Doy": 102,
		    "SCF": 67.5944,
		    "Cloud": 53.0045,
		    "Age": 1.33379
		  },
		  {
		    "Year": 2015,
		    "Doy": 103,
		    "SCF": 65.7639,
		    "Cloud": 31.8456,
		    "Age": 0.586817
		  },
		  {
		    "Year": 2015,
		    "Doy": 104,
		    "SCF": 64.1726,
		    "Cloud": 70.2184,
		    "Age": 1.19119
		  },
		  {
		    "Year": 2015,
		    "Doy": 105,
		    "SCF": 64.0435,
		    "Cloud": 92.3973,
		    "Age": 2.02334
		  },
		  {
		    "Year": 2015,
		    "Doy": 106,
		    "SCF": 64.3485,
		    "Cloud": 74.4023,
		    "Age": 2.29822
		  },
		  {
		    "Year": 2015,
		    "Doy": 107,
		    "SCF": 65.1358,
		    "Cloud": 18.6983,
		    "Age": 0.537848
		  },
		  {
		    "Year": 2015,
		    "Doy": 108,
		    "SCF": 63.6732,
		    "Cloud": 28.3216,
		    "Age": 0.29013
		  },
		  {
		    "Year": 2015,
		    "Doy": 109,
		    "SCF": 63.7893,
		    "Cloud": 26.6292,
		    "Age": 0.374776
		  },
		  {
		    "Year": 2015,
		    "Doy": 110,
		    "SCF": 56.4083,
		    "Cloud": 11.1794,
		    "Age": 0.0399504
		  },
		  {
		    "Year": 2015,
		    "Doy": 111,
		    "SCF": 60.5926,
		    "Cloud": 2.42717,
		    "Age": 0.0260085
		  },
		  {
		    "Year": 2015,
		    "Doy": 112,
		    "SCF": 56.7234,
		    "Cloud": 35.2165,
		    "Age": 0.363546
		  },
		  {
		    "Year": 2015,
		    "Doy": 113,
		    "SCF": 56.1436,
		    "Cloud": 11.4244,
		    "Age": 0.185174
		  },
		  {
		    "Year": 2015,
		    "Doy": 114,
		    "SCF": 54.3999,
		    "Cloud": 96.5058,
		    "Age": 1.13895
		  },
		  {
		    "Year": 2015,
		    "Doy": 115,
		    "SCF": 52.8832,
		    "Cloud": 98.5319,
		    "Age": 2.1221
		  },
		  {
		    "Year": 2015,
		    "Doy": 116,
		    "SCF": 51.6834,
		    "Cloud": 55.6898,
		    "Age": 1.76474
		  },
		  {
		    "Year": 2015,
		    "Doy": 117,
		    "SCF": 50.1113,
		    "Cloud": 18.4327,
		    "Age": 0.494296
		  },
		  {
		    "Year": 2015,
		    "Doy": 118,
		    "SCF": 49.7821,
		    "Cloud": 48.4254,
		    "Age": 0.727897
		  },
		  {
		    "Year": 2015,
		    "Doy": 119,
		    "SCF": 49.6875,
		    "Cloud": 75.2322,
		    "Age": 1.22189
		  },
		  {
		    "Year": 2015,
		    "Doy": 120,
		    "SCF": 49.5383,
		    "Cloud": 71.8733,
		    "Age": 1.62711
		  },
		  {
		    "Year": 2015,
		    "Doy": 121,
		    "SCF": 48.6707,
		    "Cloud": 80.1717,
		    "Age": 2.09917
		  },
		  {
		    "Year": 2015,
		    "Doy": 122,
		    "SCF": 47.7396,
		    "Cloud": 66.6337,
		    "Age": 2.26386
		  },
		  {
		    "Year": 2015,
		    "Doy": 123,
		    "SCF": 46.7571,
		    "Cloud": 89.2473,
		    "Age": 2.9787
		  },
		  {
		    "Year": 2015,
		    "Doy": 124,
		    "SCF": 46.0315,
		    "Cloud": 99.7357,
		    "Age": 3.97611
		  },
		  {
		    "Year": 2015,
		    "Doy": 125,
		    "SCF": 45.4117,
		    "Cloud": 99.9971,
		    "Age": 4.97611
		  },
		  {
		    "Year": 2015,
		    "Doy": 126,
		    "SCF": 44.8609,
		    "Cloud": 84.3022,
		    "Age": 4.33499
		  },
		  {
		    "Year": 2015,
		    "Doy": 127,
		    "SCF": 44.2369,
		    "Cloud": 99.7517,
		    "Age": 5.32425
		  },
		  {
		    "Year": 2015,
		    "Doy": 128,
		    "SCF": 43.6944,
		    "Cloud": 34.152,
		    "Age": 1.54664
		  },
		  {
		    "Year": 2015,
		    "Doy": 129,
		    "SCF": 42.599,
		    "Cloud": 85.3147,
		    "Age": 2.11728
		  },
		  {
		    "Year": 2015,
		    "Doy": 130,
		    "SCF": 40.5863,
		    "Cloud": 16.793,
		    "Age": 2.38121
		  },
		  {
		    "Year": 2015,
		    "Doy": 131,
		    "SCF": 39.5821,
		    "Cloud": 99.7996,
		    "Age": 3.37512
		  },
		  {
		    "Year": 2015,
		    "Doy": 132,
		    "SCF": 38.987,
		    "Cloud": 76.6656,
		    "Age": 3.20236
		  },
		  {
		    "Year": 2015,
		    "Doy": 133,
		    "SCF": 36.9353,
		    "Cloud": 64.3595,
		    "Age": 2.24219
		  },
		  {
		    "Year": 2015,
		    "Doy": 134,
		    "SCF": 35.2848,
		    "Cloud": 10.262,
		    "Age": 0.430745
		  },
		  {
		    "Year": 2015,
		    "Doy": 135,
		    "SCF": 33.5647,
		    "Cloud": 7.44276,
		    "Age": 0.110926
		  },
		  {
		    "Year": 2015,
		    "Doy": 136,
		    "SCF": 32.7543,
		    "Cloud": 99.9739,
		    "Age": 1.11032
		  },
		  {
		    "Year": 2015,
		    "Doy": 137,
		    "SCF": 32.2248,
		    "Cloud": 92.0306,
		    "Age": 1.9465
		  },
		  {
		    "Year": 2015,
		    "Doy": 138,
		    "SCF": 31.6541,
		    "Cloud": 57.3876,
		    "Age": 1.7764
		  },
		  {
		    "Year": 2015,
		    "Doy": 139,
		    "SCF": 31.0173,
		    "Cloud": 99.7938,
		    "Age": 2.76931
		  },
		  {
		    "Year": 2015,
		    "Doy": 140,
		    "SCF": 30.5781,
		    "Cloud": 62.9169,
		    "Age": 2.00432
		  },
		  {
		    "Year": 2015,
		    "Doy": 141,
		    "SCF": 29.4201,
		    "Cloud": 71.1969,
		    "Age": 2.19244
		  },
		  {
		    "Year": 2015,
		    "Doy": 142,
		    "SCF": 27.725,
		    "Cloud": 95.9625,
		    "Age": 2.90236
		  },
		  {
		    "Year": 2015,
		    "Doy": 143,
		    "SCF": 26.3412,
		    "Cloud": 35.3692,
		    "Age": 1.55514
		  },
		  {
		    "Year": 2015,
		    "Doy": 144,
		    "SCF": 25.7373,
		    "Cloud": 99.8359,
		    "Age": 2.54391
		  },
		  {
		    "Year": 2015,
		    "Doy": 145,
		    "SCF": 25.1843,
		    "Cloud": 80.3093,
		    "Age": 2.83563
		  },
		  {
		    "Year": 2015,
		    "Doy": 146,
		    "SCF": 24.2948,
		    "Cloud": 82.879,
		    "Age": 3.32701
		  },
		  {
		    "Year": 2015,
		    "Doy": 147,
		    "SCF": 23.602,
		    "Cloud": 50.8721,
		    "Age": 2.25937
		  },
		  {
		    "Year": 2015,
		    "Doy": 148,
		    "SCF": 23.7503,
		    "Cloud": 98.5464,
		    "Age": 3.21999
		  },
		  {
		    "Year": 2015,
		    "Doy": 149,
		    "SCF": 23.3548,
		    "Cloud": 47.7788,
		    "Age": 2.07168
		  },
		  {
		    "Year": 2015,
		    "Doy": 150,
		    "SCF": 22.97,
		    "Cloud": 99.849,
		    "Age": 3.0651
		  },
		  {
		    "Year": 2015,
		    "Doy": 151,
		    "SCF": 22.8005,
		    "Cloud": 75.6099,
		    "Age": 2.92886
		  },
		  {
		    "Year": 2015,
		    "Doy": 152,
		    "SCF": 22.0682,
		    "Cloud": 90.436,
		    "Age": 3.6508
		  },
		  {
		    "Year": 2015,
		    "Doy": 153,
		    "SCF": 21.3292,
		    "Cloud": 99.7822,
		    "Age": 4.64669
		  },
		  {
		    "Year": 2015,
		    "Doy": 154,
		    "SCF": 20.656,
		    "Cloud": 69.0936,
		    "Age": 4.07705
		  },
		  {
		    "Year": 2015,
		    "Doy": 155,
		    "SCF": 19.6233,
		    "Cloud": 62.121,
		    "Age": 3.43333
		  },
		  {
		    "Year": 2015,
		    "Doy": 156,
		    "SCF": 18.6536,
		    "Cloud": 13.6262,
		    "Age": 0.543674
		  },
		  {
		    "Year": 2015,
		    "Doy": 157,
		    "SCF": 18.2979,
		    "Cloud": 80.7492,
		    "Age": 1.31911
		  },
		  {
		    "Year": 2015,
		    "Doy": 158,
		    "SCF": 17.9754,
		    "Cloud": 49.801,
		    "Age": 1.35124
		  },
		  {
		    "Year": 2015,
		    "Doy": 159,
		    "SCF": 17.0799,
		    "Cloud": 65.3532,
		    "Age": 1.41556
		  },
		  {
		    "Year": 2015,
		    "Doy": 160,
		    "SCF": 16.4886,
		    "Cloud": 40.0371,
		    "Age": 0.62168
		  },
		  {
		    "Year": 2015,
		    "Doy": 161,
		    "SCF": 15.8089,
		    "Cloud": 89.2685,
		    "Age": 1.47901
		  },
		  {
		    "Year": 2015,
		    "Doy": 162,
		    "SCF": 15.2614,
		    "Cloud": 75.2315,
		    "Age": 1.84488
		  },
		  {
		    "Year": 2015,
		    "Doy": 163,
		    "SCF": 14.7043,
		    "Cloud": 73.0731,
		    "Age": 2.00698
		  },
		  {
		    "Year": 2015,
		    "Doy": 164,
		    "SCF": 14.1382,
		    "Cloud": 87.323,
		    "Age": 2.73154
		  },
		  {
		    "Year": 2015,
		    "Doy": 165,
		    "SCF": 13.5481,
		    "Cloud": 70.5688,
		    "Age": 2.13937
		  },
		  {
		    "Year": 2015,
		    "Doy": 166,
		    "SCF": 12.802,
		    "Cloud": 18.2072,
		    "Age": 0.746443
		  },
		  {
		    "Year": 2015,
		    "Doy": 167,
		    "SCF": 11.6495,
		    "Cloud": 2.63312,
		    "Age": 0.0767006
		  },
		  {
		    "Year": 2015,
		    "Doy": 168,
		    "SCF": 11.5711,
		    "Cloud": 99.9927,
		    "Age": 1.07627
		  },
		  {
		    "Year": 2015,
		    "Doy": 169,
		    "SCF": 11.6027,
		    "Cloud": 99.8853,
		    "Age": 2.07409
		  },
		  {
		    "Year": 2015,
		    "Doy": 170,
		    "SCF": 11.6429,
		    "Cloud": 68.226,
		    "Age": 2.10744
		  },
		  {
		    "Year": 2015,
		    "Doy": 171,
		    "SCF": 11.3688,
		    "Cloud": 61.0638,
		    "Age": 1.91591
		  },
		  {
		    "Year": 2015,
		    "Doy": 172,
		    "SCF": 11.7939,
		    "Cloud": 94.5179,
		    "Age": 2.75103
		  },
		  {
		    "Year": 2015,
		    "Doy": 173,
		    "SCF": 12.217,
		    "Cloud": 63.5275,
		    "Age": 2.36737
		  },
		  {
		    "Year": 2015,
		    "Doy": 174,
		    "SCF": 12.052,
		    "Cloud": 73.5937,
		    "Age": 2.83465
		  },
		  {
		    "Year": 2015,
		    "Doy": 175,
		    "SCF": 11.5885,
		    "Cloud": 77.6872,
		    "Age": 3.01938
		  },
		  {
		    "Year": 2015,
		    "Doy": 176,
		    "SCF": 9.68073,
		    "Cloud": 93.3487,
		    "Age": 3.61207
		  },
		  {
		    "Year": 2015,
		    "Doy": 177,
		    "SCF": 7.83767,
		    "Cloud": 51.1894,
		    "Age": 2.41346
		  },
		  {
		    "Year": 2015,
		    "Doy": 178,
		    "SCF": 7.05475,
		    "Cloud": 31.6722,
		    "Age": 1.2912
		  },
		  {
		    "Year": 2015,
		    "Doy": 179,
		    "SCF": 6.62763,
		    "Cloud": 20.1919,
		    "Age": 0.465486
		  },
		  {
		    "Year": 2015,
		    "Doy": 180,
		    "SCF": 6.51713,
		    "Cloud": 70.7334,
		    "Age": 1.46388
		  },
		  {
		    "Year": 2015,
		    "Doy": 181,
		    "SCF": 6.03742,
		    "Cloud": 45.4702,
		    "Age": 0.77825
		  },
		  {
		    "Year": 2015,
		    "Doy": 182,
		    "SCF": 5.51837,
		    "Cloud": 30.8073,
		    "Age": 0.663332
		  },
		  {
		    "Year": 2015,
		    "Doy": 183,
		    "SCF": 5.20864,
		    "Cloud": 38.4009,
		    "Age": 0.402626
		  },
		  {
		    "Year": 2015,
		    "Doy": 184,
		    "SCF": 4.69492,
		    "Cloud": 67.4776,
		    "Age": 0.883139
		  },
		  {
		    "Year": 2015,
		    "Doy": 185,
		    "SCF": 4.41019,
		    "Cloud": 27.4177,
		    "Age": 0.519501
		  },
		  {
		    "Year": 2015,
		    "Doy": 186,
		    "SCF": 4.71926,
		    "Cloud": 72.7203,
		    "Age": 1.1293
		  },
		  {
		    "Year": 2015,
		    "Doy": 187,
		    "SCF": 4.99076,
		    "Cloud": 92.7285,
		    "Age": 2.0121
		  },
		  {
		    "Year": 2015,
		    "Doy": 188,
		    "SCF": 4.71984,
		    "Cloud": 68.7964,
		    "Age": 2.06303
		  },
		  {
		    "Year": 2015,
		    "Doy": 189,
		    "SCF": 4.85481,
		    "Cloud": 99.6907,
		    "Age": 3.05175
		  },
		  {
		    "Year": 2015,
		    "Doy": 190,
		    "SCF": 4.93039,
		    "Cloud": 85.1128,
		    "Age": 3.34361
		  },
		  {
		    "Year": 2015,
		    "Doy": 191,
		    "SCF": 4.41267,
		    "Cloud": 52.943,
		    "Age": 2.44654
		  },
		  {
		    "Year": 2015,
		    "Doy": 192,
		    "SCF": 4.20982,
		    "Cloud": 36.0988,
		    "Age": 0.889833
		  },
		  {
		    "Year": 2015,
		    "Doy": 193,
		    "SCF": 4.50336,
		    "Cloud": 87.5223,
		    "Age": 1.72321
		  },
		  {
		    "Year": 2015,
		    "Doy": 194,
		    "SCF": 4.90452,
		    "Cloud": 83.1478,
		    "Age": 2.39749
		  },
		  {
		    "Year": 2015,
		    "Doy": 195,
		    "SCF": 4.97612,
		    "Cloud": 89.5311,
		    "Age": 3.1436
		  },
		  {
		    "Year": 2015,
		    "Doy": 196,
		    "SCF": 4.92247,
		    "Cloud": 92.4445,
		    "Age": 3.96206
		  },
		  {
		    "Year": 2015,
		    "Doy": 197,
		    "SCF": 4.60356,
		    "Cloud": 81.4102,
		    "Age": 3.61428
		  },
		  {
		    "Year": 2015,
		    "Doy": 198,
		    "SCF": 4.39876,
		    "Cloud": 100,
		    "Age": 4.61217
		  },
		  {
		    "Year": 2015,
		    "Doy": 199,
		    "SCF": 4.21723,
		    "Cloud": 88.4197,
		    "Age": 4.18952
		  },
		  {
		    "Year": 2015,
		    "Doy": 200,
		    "SCF": 3.9478,
		    "Cloud": 64.4211,
		    "Age": 5.19144
		  },
		  {
		    "Year": 2015,
		    "Doy": 201,
		    "SCF": 4.24067,
		    "Cloud": 52.9815,
		    "Age": 3.3739
		  },
		  {
		    "Year": 2015,
		    "Doy": 202,
		    "SCF": 3.91814,
		    "Cloud": 99.1127,
		    "Age": 4.35529
		  },
		  {
		    "Year": 2015,
		    "Doy": 203,
		    "SCF": 3.66958,
		    "Cloud": 57.6541,
		    "Age": 3.34284
		  },
		  {
		    "Year": 2015,
		    "Doy": 204,
		    "SCF": 3.52991,
		    "Cloud": 84.7478,
		    "Age": 3.24578
		  },
		  {
		    "Year": 2015,
		    "Doy": 205,
		    "SCF": 3.39544,
		    "Cloud": 70.6988,
		    "Age": 3.25305
		  },
		  {
		    "Year": 2015,
		    "Doy": 206,
		    "SCF": 3.3368,
		    "Cloud": 100,
		    "Age": 4.24812
		  },
		  {
		    "Year": 2015,
		    "Doy": 207,
		    "SCF": 3.29421,
		    "Cloud": 99.8998,
		    "Age": 5.24623
		  },
		  {
		    "Year": 2015,
		    "Doy": 208,
		    "SCF": 3.24612,
		    "Cloud": 78.6871,
		    "Age": 4.30491
		  },
		  {
		    "Year": 2015,
		    "Doy": 209,
		    "SCF": 3.15136,
		    "Cloud": 99.0154,
		    "Age": 5.25395
		  },
		  {
		    "Year": 2015,
		    "Doy": 210,
		    "SCF": 3.06821,
		    "Cloud": 99.9303,
		    "Age": 6.25072
		  },
		  {
		    "Year": 2015,
		    "Doy": 211,
		    "SCF": 3.01571,
		    "Cloud": 63.0001,
		    "Age": 4.60078
		  },
		  {
		    "Year": 2015,
		    "Doy": 212,
		    "SCF": 2.76772,
		    "Cloud": 60.2129,
		    "Age": 3.71781
		  },
		  {
		    "Year": 2015,
		    "Doy": 213,
		    "SCF": 2.74261,
		    "Cloud": 87.73,
		    "Age": 4.13344
		  },
		  {
		    "Year": 2015,
		    "Doy": 214,
		    "SCF": 2.81935,
		    "Cloud": 47.1305,
		    "Age": 2.65095
		  },
		  {
		    "Year": 2015,
		    "Doy": 215,
		    "SCF": 2.67139,
		    "Cloud": 94.1748,
		    "Age": 3.43332
		  },
		  {
		    "Year": 2015,
		    "Doy": 216,
		    "SCF": 2.55168,
		    "Cloud": 99.4293,
		    "Age": 4.4268
		  },
		  {
		    "Year": 2015,
		    "Doy": 217,
		    "SCF": 2.39053,
		    "Cloud": 98.4665,
		    "Age": 5.36519
		  },
		  {
		    "Year": 2015,
		    "Doy": 218,
		    "SCF": 2.09709,
		    "Cloud": 78.4346,
		    "Age": 4.97345
		  },
		  {
		    "Year": 2015,
		    "Doy": 219,
		    "SCF": 1.83971,
		    "Cloud": 49.5541,
		    "Age": 3.11142
		  },
		  {
		    "Year": 2015,
		    "Doy": 220,
		    "SCF": 1.72662,
		    "Cloud": 63.9131,
		    "Age": 1.69053
		  },
		  {
		    "Year": 2015,
		    "Doy": 221,
		    "SCF": 1.72297,
		    "Cloud": 96.5289,
		    "Age": 2.60837
		  },
		  {
		    "Year": 2015,
		    "Doy": 222,
		    "SCF": 1.6466,
		    "Cloud": 94.855,
		    "Age": 3.3376
		  },
		  {
		    "Year": 2015,
		    "Doy": 223,
		    "SCF": 1.5403,
		    "Cloud": 81.9052,
		    "Age": 3.67069
		  },
		  {
		    "Year": 2015,
		    "Doy": 224,
		    "SCF": 1.22015,
		    "Cloud": 12.0465,
		    "Age": 0.700627
		  },
		  {
		    "Year": 2015,
		    "Doy": 225,
		    "SCF": 1.0989,
		    "Cloud": 2.36411,
		    "Age": 0.358182
		  },
		  {
		    "Year": 2015,
		    "Doy": 226,
		    "SCF": 1.0319,
		    "Cloud": 1.25259,
		    "Age": 0.180399
		  },
		  {
		    "Year": 2015,
		    "Doy": 227,
		    "SCF": 1.03788,
		    "Cloud": 26.2745,
		    "Age": 0.304876
		  },
		  {
		    "Year": 2015,
		    "Doy": 228,
		    "SCF": 1.00084,
		    "Cloud": 98.8063,
		    "Age": 1.29024
		  },
		  {
		    "Year": 2015,
		    "Doy": 229,
		    "SCF": 0.941948,
		    "Cloud": 15.5083,
		    "Age": 0.142392
		  },
		  {
		    "Year": 2015,
		    "Doy": 230,
		    "SCF": 0.870495,
		    "Cloud": 12.8191,
		    "Age": 0.160597
		  },
		  {
		    "Year": 2015,
		    "Doy": 231,
		    "SCF": 0.736075,
		    "Cloud": 0.96196,
		    "Age": 0.0230841
		  },
		  {
		    "Year": 2015,
		    "Doy": 232,
		    "SCF": 0.700966,
		    "Cloud": 19.0631,
		    "Age": 0.209212
		  },
		  {
		    "Year": 2015,
		    "Doy": 233,
		    "SCF": 0.677892,
		    "Cloud": 11.2257,
		    "Age": 0.118609
		  },
		  {
		    "Year": 2015,
		    "Doy": 234,
		    "SCF": 0.668352,
		    "Cloud": 19.7916,
		    "Age": 0.225463
		  },
		  {
		    "Year": 2015,
		    "Doy": 235,
		    "SCF": 0.591235,
		    "Cloud": 0.82536,
		    "Age": 0.0243664
		  },
		  {
		    "Year": 2015,
		    "Doy": 236,
		    "SCF": 1.40095,
		    "Cloud": 56.4641,
		    "Age": 0.558082
		  },
		  {
		    "Year": 2015,
		    "Doy": 237,
		    "SCF": 2.75258,
		    "Cloud": 98.1151,
		    "Age": 1.52671
		  },
		  {
		    "Year": 2015,
		    "Doy": 238,
		    "SCF": 1.96879,
		    "Cloud": 49.3103,
		    "Age": 0.607338
		  },
		  {
		    "Year": 2015,
		    "Doy": 239,
		    "SCF": 1.69968,
		    "Cloud": 99.9695,
		    "Age": 1.6043
		  },
		  {
		    "Year": 2015,
		    "Doy": 240,
		    "SCF": 1.48189,
		    "Cloud": 52.7052,
		    "Age": 0.724704
		  },
		  {
		    "Year": 2015,
		    "Doy": 241,
		    "SCF": 1.4383,
		    "Cloud": 87.4342,
		    "Age": 1.56503
		  },
		  {
		    "Year": 2015,
		    "Doy": 242,
		    "SCF": 1.18741,
		    "Cloud": 59.6331,
		    "Age": 1.70625
		  },
		  {
		    "Year": 2015,
		    "Doy": 243,
		    "SCF": 1.08013,
		    "Cloud": 33.308,
		    "Age": 0.979869
		  },
		  {
		    "Year": 2015,
		    "Doy": 244,
		    "SCF": 1.78505,
		    "Cloud": 99.7415,
		    "Age": 1.9702
		  },
		  {
		    "Year": 2015,
		    "Doy": 245,
		    "SCF": 2.39073,
		    "Cloud": 99.8315,
		    "Age": 2.96242
		  },
		  {
		    "Year": 2015,
		    "Doy": 246,
		    "SCF": 2.95993,
		    "Cloud": 95.6853,
		    "Age": 3.81887
		  },
		  {
		    "Year": 2015,
		    "Doy": 247,
		    "SCF": 1.84576,
		    "Cloud": 49.1686,
		    "Age": 1.33346
		  },
		  {
		    "Year": 2015,
		    "Doy": 248,
		    "SCF": 1.59281,
		    "Cloud": 96.2576,
		    "Age": 2.17931
		  },
		  {
		    "Year": 2015,
		    "Doy": 249,
		    "SCF": 1.0662,
		    "Cloud": 37.5297,
		    "Age": 1.08141
		  },
		  {
		    "Year": 2015,
		    "Doy": 250,
		    "SCF": 1.14047,
		    "Cloud": 62.157,
		    "Age": 1.4781
		  },
		  {
		    "Year": 2015,
		    "Doy": 251,
		    "SCF": 0.553325,
		    "Cloud": 14.6529,
		    "Age": 0.551001
		  },
		  {
		    "Year": 2015,
		    "Doy": 252,
		    "SCF": 0.44435,
		    "Cloud": 0.238144,
		    "Age": 0.0108553
		  },
		  {
		    "Year": 2015,
		    "Doy": 253,
		    "SCF": 0.86238,
		    "Cloud": 53.6468,
		    "Age": 0.544401
		  },
		  {
		    "Year": 2015,
		    "Doy": 254,
		    "SCF": 1.63619,
		    "Cloud": 83.1317,
		    "Age": 1.12991
		  },
		  {
		    "Year": 2015,
		    "Doy": 255,
		    "SCF": 2.3256,
		    "Cloud": 99.531,
		    "Age": 2.11548
		  },
		  {
		    "Year": 2015,
		    "Doy": 256,
		    "SCF": 3.01484,
		    "Cloud": 99.3407,
		    "Age": 3.08874
		  },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 257,
		  //   "SCF": 3.45875,
		  //   "Cloud": 99.8664,
		  //   "Age": 4.08189
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 258,
		  //   "SCF": 3.85123,
		  //   "Cloud": 99.1708,
		  //   "Age": 5.03741
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 259,
		  //   "SCF": 3.95073,
		  //   "Cloud": 98.5754,
		  //   "Age": 5.94755
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 260,
		  //   "SCF": 3.92908,
		  //   "Cloud": 98.0643,
		  //   "Age": 6.81786
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 261,
		  //   "SCF": 2.91287,
		  //   "Cloud": 80.9001,
		  //   "Age": 5.74794
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 262,
		  //   "SCF": 1.0859,
		  //   "Cloud": 22.6625,
		  //   "Age": 6.75583
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 263,
		  //   "SCF": 1.23261,
		  //   "Cloud": 71.198,
		  //   "Age": 4.96736
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 264,
		  //   "SCF": 1.57019,
		  //   "Cloud": 92.3698,
		  //   "Age": 5.54838
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 265,
		  //   "SCF": 1.94328,
		  //   "Cloud": 99.5629,
		  //   "Age": 6.51952
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 266,
		  //   "SCF": 2.05578,
		  //   "Cloud": 78.3677,
		  //   "Age": 5.63697
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 267,
		  //   "SCF": 2.25878,
		  //   "Cloud": 95.6722,
		  //   "Age": 6.35227
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 268,
		  //   "SCF": 2.37965,
		  //   "Cloud": 52.9292,
		  //   "Age": 3.56063
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 269,
		  //   "SCF": 1.2417,
		  //   "Cloud": 22.0352,
		  //   "Age": 1.13909
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 270,
		  //   "SCF": 0.885318,
		  //   "Cloud": 0.926928,
		  //   "Age": 0.0474575
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 271,
		  //   "SCF": 0.773324,
		  //   "Cloud": 43.8162,
		  //   "Age": 0.479528
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 272,
		  //   "SCF": 0.598473,
		  //   "Cloud": 6.12907,
		  //   "Age": 0.0268065
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 273,
		  //   "SCF": 0.923921,
		  //   "Cloud": 90.3259,
		  //   "Age": 0.926231
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 274,
		  //   "SCF": 0.87099,
		  //   "Cloud": 99.6079,
		  //   "Age": 1.92305
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 275,
		  //   "SCF": 0.823082,
		  //   "Cloud": 85.9813,
		  //   "Age": 2.52612
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 276,
		  //   "SCF": 0.513132,
		  //   "Cloud": 2.29068,
		  //   "Age": 0.0659172
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 277,
		  //   "SCF": 1.72902,
		  //   "Cloud": 28.8664,
		  //   "Age": 0.172031
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 278,
		  //   "SCF": 3.02005,
		  //   "Cloud": 86.1856,
		  //   "Age": 1.00797
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 279,
		  //   "SCF": 4.65922,
		  //   "Cloud": 83.1439,
		  //   "Age": 1.38682
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 280,
		  //   "SCF": 7.2489,
		  //   "Cloud": 97.9859,
		  //   "Age": 2.34942
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 281,
		  //   "SCF": 8.62438,
		  //   "Cloud": 98.0265,
		  //   "Age": 3.27915
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 282,
		  //   "SCF": 9.16777,
		  //   "Cloud": 98.4839,
		  //   "Age": 4.22222
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 283,
		  //   "SCF": 9.15717,
		  //   "Cloud": 77.9333,
		  //   "Age": 3.95732
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 284,
		  //   "SCF": 7.7283,
		  //   "Cloud": 99.865,
		  //   "Age": 4.94077
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 285,
		  //   "SCF": 6.36299,
		  //   "Cloud": 97.1799,
		  //   "Age": 5.74594
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 286,
		  //   "SCF": 4.98075,
		  //   "Cloud": 51.099,
		  //   "Age": 2.74217
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 287,
		  //   "SCF": 3.63073,
		  //   "Cloud": 9.25031,
		  //   "Age": 0.167021
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 288,
		  //   "SCF": 3.27582,
		  //   "Cloud": 16.1888,
		  //   "Age": 0.253431
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 289,
		  //   "SCF": 2.94469,
		  //   "Cloud": 18.4625,
		  //   "Age": 0.357736
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 290,
		  //   "SCF": 2.76263,
		  //   "Cloud": 3.42561,
		  //   "Age": 1.30681
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 291,
		  //   "SCF": 2.48679,
		  //   "Cloud": 3.61884,
		  //   "Age": 0.0586491
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 292,
		  //   "SCF": 2.429,
		  //   "Cloud": 4.94295,
		  //   "Age": 0.0819987
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 293,
		  //   "SCF": 3.66953,
		  //   "Cloud": 80.6078,
		  //   "Age": 0.78102
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 294,
		  //   "SCF": 4.77956,
		  //   "Cloud": 98.8252,
		  //   "Age": 1.75602
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 295,
		  //   "SCF": 5.58363,
		  //   "Cloud": 69.9221,
		  //   "Age": 1.62948
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 296,
		  //   "SCF": 4.27653,
		  //   "Cloud": 17.6052,
		  //   "Age": 0.499774
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 297,
		  //   "SCF": 5.37678,
		  //   "Cloud": 88.424,
		  //   "Age": 1.32603
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 298,
		  //   "SCF": 6.23428,
		  //   "Cloud": 15.8367,
		  //   "Age": 0.44681
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 299,
		  //   "SCF": 7.55305,
		  //   "Cloud": 94.695,
		  //   "Age": 1.385
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 300,
		  //   "SCF": 8.3805,
		  //   "Cloud": 67.6173,
		  //   "Age": 1.59734
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 301,
		  //   "SCF": 7.45203,
		  //   "Cloud": 88.7347,
		  //   "Age": 2.29884
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 302,
		  //   "SCF": 7.18296,
		  //   "Cloud": 95.4751,
		  //   "Age": 3.0266
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 303,
		  //   "SCF": 6.49285,
		  //   "Cloud": 99.9971,
		  //   "Age": 4.0266
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 304,
		  //   "SCF": 5.81208,
		  //   "Cloud": 100,
		  //   "Age": 5.0266
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 305,
		  //   "SCF": 5.16138,
		  //   "Cloud": 76.5692,
		  //   "Age": 4.62446
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 306,
		  //   "SCF": 4.62011,
		  //   "Cloud": 36.0312,
		  //   "Age": 1.86966
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 307,
		  //   "SCF": 5.97571,
		  //   "Cloud": 29.3673,
		  //   "Age": 0.862633
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 308,
		  //   "SCF": 5.42654,
		  //   "Cloud": 20.862,
		  //   "Age": 0.574909
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 309,
		  //   "SCF": 8.71162,
		  //   "Cloud": 98.8499,
		  //   "Age": 1.55175
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 310,
		  //   "SCF": 11.2628,
		  //   "Cloud": 98.8499,
		  //   "Age": 2.52774
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 311,
		  //   "SCF": 13.977,
		  //   "Cloud": 14.6667,
		  //   "Age": 0.215546
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 312,
		  //   "SCF": 22.2374,
		  //   "Cloud": 9.4449,
		  //   "Age": 0.154792
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 313,
		  //   "SCF": 25.9242,
		  //   "Cloud": 92.1259,
		  //   "Age": 1.05987
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 314,
		  //   "SCF": 28.5595,
		  //   "Cloud": 71.9205,
		  //   "Age": 1.51514
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 315,
		  //   "SCF": 26.9805,
		  //   "Cloud": 20.6499,
		  //   "Age": 0.56092
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 316,
		  //   "SCF": 33.3388,
		  //   "Cloud": 67.3402,
		  //   "Age": 0.807757
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 317,
		  //   "SCF": 34.4888,
		  //   "Cloud": 16.4017,
		  //   "Age": 0.391505
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 318,
		  //   "SCF": 38.1487,
		  //   "Cloud": 92.8202,
		  //   "Age": 1.1865
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 319,
		  //   "SCF": 39.1745,
		  //   "Cloud": 14.7594,
		  //   "Age": 0.451872
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 320,
		  //   "SCF": 50.1217,
		  //   "Cloud": 98.0773,
		  //   "Age": 1.39657
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 321,
		  //   "SCF": 61.2959,
		  //   "Cloud": 95.8773,
		  //   "Age": 2.29653
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 322,
		  //   "SCF": 72.6084,
		  //   "Cloud": 37.2996,
		  //   "Age": 1.28204
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 323,
		  //   "SCF": 76.0706,
		  //   "Cloud": 78.2481,
		  //   "Age": 1.75743
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 324,
		  //   "SCF": 81.0299,
		  //   "Cloud": 22.3252,
		  //   "Age": 0.683122
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 325,
		  //   "SCF": 80.6568,
		  //   "Cloud": 66.8657,
		  //   "Age": 1.23525
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 326,
		  //   "SCF": 81.1726,
		  //   "Cloud": 82.4918,
		  //   "Age": 1.84488
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 327,
		  //   "SCF": 82.7807,
		  //   "Cloud": 30.8701,
		  //   "Age": 0.691444
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 328,
		  //   "SCF": 80.7443,
		  //   "Cloud": 88.2426,
		  //   "Age": 1.53579
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 329,
		  //   "SCF": 80.7407,
		  //   "Cloud": 89.7161,
		  //   "Age": 2.28727
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 330,
		  //   "SCF": 0,
		  //   "Cloud": 0,
		  //   "Age": 0
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 331,
		  //   "SCF": 63.4278,
		  //   "Cloud": 57.2957,
		  //   "Age": 2.15967
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 332,
		  //   "SCF": 57.5001,
		  //   "Cloud": 21.2214,
		  //   "Age": 0.756698
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 333,
		  //   "SCF": 59.6271,
		  //   "Cloud": 93.1652,
		  //   "Age": 1.58989
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 334,
		  //   "SCF": 64.0049,
		  //   "Cloud": 27.9835,
		  //   "Age": 0.819102
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 335,
		  //   "SCF": 62.1864,
		  //   "Cloud": 21.0878,
		  //   "Age": 0.545607
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 336,
		  //   "SCF": 62.6738,
		  //   "Cloud": 86.1394,
		  //   "Age": 1.33979
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 337,
		  //   "SCF": 64.4796,
		  //   "Cloud": 69.2727,
		  //   "Age": 1.5644
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 338,
		  //   "SCF": 65.6747,
		  //   "Cloud": 75.236,
		  //   "Age": 1.95872
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 339,
		  //   "SCF": 66.0775,
		  //   "Cloud": 93.9564,
		  //   "Age": 2.80546
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 340,
		  //   "SCF": 67.8055,
		  //   "Cloud": 82.3808,
		  //   "Age": 3.13438
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 341,
		  //   "SCF": 69.0884,
		  //   "Cloud": 8.82928,
		  //   "Age": 0.389251
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 342,
		  //   "SCF": 67.8909,
		  //   "Cloud": 100,
		  //   "Age": 1.38741
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 343,
		  //   "SCF": 67.7553,
		  //   "Cloud": 17.4118,
		  //   "Age": 0.515844
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 344,
		  //   "SCF": 63.1566,
		  //   "Cloud": 47.3559,
		  //   "Age": 0.804986
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 345,
		  //   "SCF": 63.1996,
		  //   "Cloud": 60.6464,
		  //   "Age": 1.08342
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 346,
		  //   "SCF": 63.7826,
		  //   "Cloud": 44.7253,
		  //   "Age": 1.06623
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 347,
		  //   "SCF": 64.8585,
		  //   "Cloud": 48.4976,
		  //   "Age": 1.11773
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 348,
		  //   "SCF": 69.4453,
		  //   "Cloud": 75.599,
		  //   "Age": 1.62454
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 349,
		  //   "SCF": 72.6205,
		  //   "Cloud": 16.8937,
		  //   "Age": 0.473368
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 350,
		  //   "SCF": 71.9284,
		  //   "Cloud": 98.7177,
		  //   "Age": 1.45421
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 351,
		  //   "SCF": 71.7004,
		  //   "Cloud": 80.1824,
		  //   "Age": 1.99834
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 352,
		  //   "SCF": 72.6963,
		  //   "Cloud": 48.9819,
		  //   "Age": 1.52431
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 353,
		  //   "SCF": 71.6471,
		  //   "Cloud": 100,
		  //   "Age": 2.5242
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 354,
		  //   "SCF": 68.4572,
		  //   "Cloud": 80.9175,
		  //   "Age": 2.85773
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 355,
		  //   "SCF": 66.3406,
		  //   "Cloud": 77.0876,
		  //   "Age": 3.04683
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 356,
		  //   "SCF": 66.458,
		  //   "Cloud": 94.9071,
		  //   "Age": 3.89856
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 357,
		  //   "SCF": 66.9765,
		  //   "Cloud": 90.9731,
		  //   "Age": 4.5846
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 358,
		  //   "SCF": 66.673,
		  //   "Cloud": 99.9855,
		  //   "Age": 5.58409
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 359,
		  //   "SCF": 63.352,
		  //   "Cloud": 54.4553,
		  //   "Age": 3.72047
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 360,
		  //   "SCF": 59.7374,
		  //   "Cloud": 25.1116,
		  //   "Age": 1.3756
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 361,
		  //   "SCF": 59.8503,
		  //   "Cloud": 98.4578,
		  //   "Age": 2.3331
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 362,
		  //   "SCF": 60.1157,
		  //   "Cloud": 96.8758,
		  //   "Age": 3.25443
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 363,
		  //   "SCF": 60.1157,
		  //   "Cloud": 100,
		  //   "Age": 4.25443
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 364,
		  //   "SCF": 0,
		  //   "Cloud": 0,
		  //   "Age": 0
		  // },
		  // {
		  //   "Year": 2015,
		  //   "Doy": 365,
		  //   "SCF": 0,
		  //   "Cloud": 0,
		  //   "Age": 0
		  // }
		];

		return allYears;
	},





	
});




