M.Legend = M.Class.extend({

	type : 'legend',

	initialize : function (options) {

		this.options = options;

		this.initLegends();


		// set sat view option
		this.satelliteView = (app.options.customizations && app.options.customizations.satelliteView);

	},

	refreshLegend : function (legend) {
		this.legendObj = legend ? M.parse(legend) : this.legendObj;
		this.updateLegend();	
	},

	updateLegend : function () {

		// get style
		var styleJSON = this.options.carto;

		// Creates legend object as JSON
		this.oldLegend = this.legendObj;

		// get correct legend builder function
		if (this.options.layer.isDefo()) {
			// create legend objecct
			this.legendObj = M.Tools.Legend.buildRasterDeformationLegend(styleJSON, this.options.layer, this.legendObj);
		} else {
			// create legend objecct
			this.legendObj = M.Tools.Legend.buildLegendObject(styleJSON, this.options.layer, this.legendObj);
		}

		// Rolls out the HTML
		this.createLegendStyler();

		// Saves the changes (object)
		this.saveLegend();

		// fire event
		var layerID = this.options.layer.options.uuid;
		M.Mixin.Events.fire('updateLegend', { detail : { layerUuid : layerID }}); 

	},

	saveLegend : function () {
		this.options.layer.setLegends( this.legendObj );
	},


	// BUILD LEGEND HTML
	// BUILD LEGEND HTML
	// BUILD LEGEND HTML

	// Init – runs only once
	initLegends : function () {

		// Legend section
		this._legensOuter = M.DomUtil.create('div', 'chrome-field-wrapper field-legend displayNone', this.options.container);
		this._legendSection = M.DomUtil.create('div', 'chrome-content-section-wrapper toggles-wrapper', this._legensOuter);

		// Container for legend title and switch (this is always there).
		this._legendTopLineWrapper = M.DomUtil.create('div', 'chrome-legend-top-section', this._legendSection);

		// Where the legends are + the switches for opacity slider and legend meta
		this._legendContent = M.DomUtil.create('div', 'legend-content', this._legendSection);

		// get style & legends
		var styleJSON = this.options.carto;
		var legends = this.options.layer.store.legends;
		var oldLegend = legends ? JSON.parse(legends) : false;

		// Creates legend object as JSON
		this.legendObj = M.Tools.Legend.buildLegendObject(styleJSON, this.options.layer, oldLegend);

		// Create legend styler
		this.createLegendStyler();

	},

	// Clear content when updating
	clearLegendContent : function () {
		this._legendTopLineWrapper.innerHTML = '';
		this._legendContent.innerHTML = '';
	},

	// Create the basic switches, and run the options to create legend for
	// lines, polygons and points.
	createLegendStyler : function () {

		// clear
		this.clearLegendContent();

		// The top section hold the "Legend" title + on/off switch
		// This part should always be there

		// console.log('createLegendStyler', this);

		// If legend on/off option does not exist, see if we have it stored
		if ( typeof this.legendObj.enable == 'undefined' ) {
			if ( this.oldLegendObj ) {
				this.legendObj.enable = this.oldLegendObj.enable;
			} else {
				this.legendObj.enable = true;
			}
		}

		var _isOn = this.legendObj.enable;

		// wrapper
		var line = new M.fieldLine({
			id           : 'legend-section',
			appendTo     : this._legendTopLineWrapper,
			title        : '<b>Legend</b>',
			input        : false
		});

		// Switch
		this.enableLegendButton = new M.button({
			id 	     	 : 'legen-section-switch',
			type 	     : 'switch',
			isOn 	     : _isOn,
			right 	     : true,
			appendTo     : line.container,
			fn 	     : this._switchEnableLegend.bind(this)
			// context      : this
		});


		// If switch is off, do not roll out the rest of the options.
		if ( !_isOn ) return; // console.error('legend done cause !_isOn');


		// Legend meta
		// Legend meta

		var legendMetaOptionsWrapper = M.DomUtil.create('div', 'legend-meta-options-wrapper', this._legendContent);


		// Layer meta option switch
		// Layer meta option switch
		// Layer meta option switch

		// wrapper
		var layerMetaOption = new M.fieldLine({
			id           : 'layer-meta-option',
			appendTo     : legendMetaOptionsWrapper,
			title        : '<b>Layer meta</b>',
			input        : false
		});		


		// If layer meta option does not exist, see if we have it stored
		if ( typeof this.legendObj.layerMeta == 'undefined' ) {
			if ( this.oldLegendObj ) {
				this.legendObj.layerMeta = this.oldLegendObj.layerMeta;
			} else {
				this.legendObj.layerMeta = true;
			}
		}

		_isOn = this.legendObj.layerMeta;


		// Layer meta switch
		var button = new M.button({
			id 	     : 'layerMeta',
			type 	     : 'switch',
			isOn 	     : _isOn,
			right 	     : true,
			appendTo     : layerMetaOption.container,
			fn 	     : this._switch.bind(this) // onSwitch
		});



		// Opacity slider switch
		// Opacity slider switch
		// Opacity slider switch

		// wrapper
		var opacitySliderOption = new M.fieldLine({
			id           : 'opacity-slider-option',
			appendTo     : legendMetaOptionsWrapper,
			title        : '<b>Opacity slider</b>',
			input        : false
		});

		// If opacity slider option does not exist, see if we have it stored
		if ( typeof this.legendObj.opacitySlider == 'undefined' ) {
			if ( this.oldLegendObj ) {
				this.legendObj.opacitySlider = this.oldLegendObj.opacitySlider;
			} else {
				this.legendObj.opacitySlider = true;
			}			
		}

		_isOn = this.legendObj.opacitySlider;
	

		// Opacity slider switch
		var button = new M.button({
			id 	     : 'opacitySlider',
			type 	     : 'switch',
			isOn 	     : _isOn,
			right 	     : true,
			appendTo     : opacitySliderOption.container,
			fn 	     : this._switch.bind(this)
		});

		var polygons  = this.legendObj.polygon;
		var lines     = this.legendObj.line;
		var points    = this.legendObj.point;

		// Build points
		// this.pointsHTML(points);

		// Build polygons and lines
		// these are connected, beacuse if you have styling for both,
		// they will need to be part of the same legend.
		// this.polygonAndLinesHTML(polygons, lines);

		var legendArray = M.Tools.Legend.getLegendArray(points, lines, polygons);

		// Create legend settings from array
		this.createLegendSettingsFromArray(legendArray);

		// Create legend HTML from array
		this.createLegendHTMLFromArray(legendArray);

	},

	createLegendSettingsFromArray : function (legendArray) {
		legendArray.forEach(function (l) {
			l.gradient ? this.gradientLegendSetting(l) : this.eachLegendSetting(l);
		}.bind(this));
	},

	createLegendHTMLFromArray : function (legendArray) {
		var legendHTML = '';
		var gradientHTML = '';

		legendArray.forEach(function (l) {
			
			if ( l.gradient ) {
				gradientHTML += M.Tools.Legend.gradientLegendHTML(l, this);
			} else {
				legendHTML += M.Tools.Legend.eachLegendHTML(l, this.satelliteView);
			}
			
		}.bind(this));

		this.legendObj.html = legendHTML;
		this.legendObj.gradient = gradientHTML;

	},

	eachLegendSetting : function (options) {		

		var name = options.layerName;
		var style = options.style;
		var object = options.object;

		// Create container for each legend
		var container = M.DomUtil.create('div', 'legend-each-container', this._legendContent);

		// Color space to the left (can be line, dot or polygon)
		var color = M.DomUtil.create('div', 'legend-each-color', container);
		    color.setAttribute('style', style);

		// Legend name
		var _name = object.name ? object.name : '';

		// NAME INPUT
		// NAME INPUT
		// NAME INPUT

		var input = new M.button({
			id 	     	 : 'test',
			type 	     : 'input',
			right 	     : false,
			isOn         : true,
			appendTo     : container,
			value        : _name,
			placeholder  : name,
			tabindex     : 1,
			fn 	     	 : this._saveLegendName,
			className    : 'legend-each-name target-input',
			allowText    : true,
			sourceObject : object,
			context      : this
		});


		M.DomEvent.on(input.input, 'keydown', this.checkKey);

		// Each legend on/off button
		// Each legend on/off button
		// Each legend on/off button


		// Set on to true by default
		if ( typeof object.isOn == 'undefined' ) {
    			object.isOn = true;
		}

		// Put on/off state to wrapper
		object.isOn ? M.DomUtil.removeClass(container, 'is-off') : M.DomUtil.addClass(container, 'is-off');

		// Switch to toggle this specific legend on or off
		var button = new M.button({
			id 	     	 : name,
			type 	     : 'switch',
			isOn 	     : object.isOn,
			right 	     : true,
			appendTo     : container,
			fn 	     	 : this._switchLegend,
			className    : 'legend-switch',
			sourceObject : object,
			context      : this
		});

	},

	// SETTINGS SETTINGS
	// SETTINGS SETTINGS
	// SETTINGS SETTINGS


	gradientLegendSetting : function (options) {
		var gradientStyle = options.style;
		var object = options.object;
		var minVal = options.gradient.minVal;
		var maxVal = options.gradient.maxVal;
		var bline = options.gradient.bline;
		var gradientName = object.name ? object.name : bline;
		var gradident_footer_left = object.left_footer || 'left';
		var gradident_footer_right = object.right_footer || 'right';

		// create container
		var container = M.DomUtil.create('div', 'legend-each-container', this._legendContent);

		// override style
		container.style.paddingLeft = 0;

		// create containers
		var gradientWrapper = M.DomUtil.create('div', 'info-legend-container', container);
		var gradientInfoWrapper = M.DomUtil.create('div', 'info-legend-frame', gradientWrapper);
		var gradientInfoMinVal = M.DomUtil.create('div', 'info-legend-val info-legend-min-val', gradientInfoWrapper, _.toString(minVal));


		// this is where the GUI in the Legend Styler is created


		// create input for adding text on top of gradient
		var input = new M.button({
			id 	     	 : 'gradient-header',
			type 	     : 'input',
			isOn 	     : true,
			right 	     : true,
			appendTo     : gradientInfoWrapper,
			fn 	     	 : this._saveGradientHeader,
			className    : 'info-legend-header',
			sourceObject : options.object,
			allowText    : true,
			placeholder  : gradientName,
			context      : this
		});

		// add two inputs under gradient to add left/right keywords to legend
		var gradient_footer_container = M.DomUtil.create('div', 'sub-gradient-container', gradientWrapper);

		// create input for adding text on bottom of gradient
		var input2 = new M.button({
			id 	     	 : 'gradient-footer-left',
			type 	     : 'input',
			isOn 	     : true,
			right 	     : true,
			appendTo     : gradient_footer_container,
			fn 	     	 : this._saveGradientFooterLeft,
			className    : 'info-legend-footer align-left',
			sourceObject : options.object,
			allowText    : true,
			placeholder  : gradident_footer_left,
			context      : this
		});

		// create input for adding text on bottom of gradient
		var input3 = new M.button({
			id 	     	 : 'gradient-footer-right',
			type 	     : 'input',
			isOn 	     : true,
			right 	     : true,
			appendTo     : gradient_footer_container,
			fn 	     	 : this._saveGradientFooterRight,
			className    : 'info-legend-footer align-right',
			sourceObject : options.object,
			allowText    : true,
			placeholder  : gradident_footer_right,
			context      : this
		});

		// set blur event
		M.DomEvent.on(input.input, 'keydown', this.checkKey);		    
		M.DomEvent.on(input2.input, 'keydown', this.checkKey);		    
		M.DomEvent.on(input3.input, 'keydown', this.checkKey);		    
		
		// create containers
		var gradientInfoMaxVal = M.DomUtil.create('div', 'info-legend-val info-legend-max-val', gradientInfoWrapper, _.toString(maxVal));
		var gradientLegend = M.DomUtil.create('div', 'info-legend-gradient-container', gradientInfoWrapper);
		gradientLegend.setAttribute('style', gradientStyle);

		// Set on to true by default
		if (typeof options.object.isOn == 'undefined') {
    			options.object.isOn = true;
		}

		// Put on/off state to wrapper
		options.object.isOn ? M.DomUtil.removeClass(container, 'is-off') : M.DomUtil.addClass(container, 'is-off');

		// Switch to toggle this specific legend on or off
		var button = new M.button({
			id 	     	 : 'random',
			type 	     : 'switch',
			isOn 	     : options.object.isOn,
			right 	     : true,
			appendTo     : container,
			fn 	     	 : this._switchGradient,
			className    : 'legend-switch',
			sourceObject : options.object,
			context      : this
		});

		// does nothing?
		// this.gradientBottom(options);

	},


	_saveGradientFooterLeft : function (e) {
		var value = e.target.value;

		this.sourceObject.left_footer = value;
		this.context.updateLegend();

	},

	_saveGradientFooterRight : function (e) {
		var value = e.target.value;

		this.sourceObject.right_footer = value;
		this.context.updateLegend();

	},

	_saveGradientHeader : function (e) {

		var value = e.target.value;

		this.sourceObject.name = value;
		this.context.updateLegend();

	},


	// gradientBottom : function (options) {
	// 	if ( !this.satelliteView ) return;

	// 	var container = M.DomUtil.create('div', 'legend-each-container', this._legendContent);

	// 	container.style.paddingLeft = 0;

	// 	var cont     = M.DomUtil.create('div', 'info-legend-gradient-bottomline', container);
	// 	var leg      = M.DomUtil.create('div', 'legend-gradient-footer', cont);
	// 	leg.id   	 = 'legend-gradient-footer';
	// 	var top      = M.DomUtil.create('div', 'legend-gradient-footer-top', leg, 'Deformation in satellite line of sight')
	// 	var lineCont = M.DomUtil.create('div', 'legend-gradient-footer-line-container', leg);
	// 	var line     = M.DomUtil.create('div', 'legend-gradient-footer-line', lineCont);
	// 	var arrowL   = M.DomUtil.create('div', 'legend-gradient-footer-arrow-left', lineCont);
	// 	var arrowR   = M.DomUtil.create('div', 'legend-gradient-footer-arrow-right', lineCont);
	// 	var midLine  = M.DomUtil.create('div', 'legend-gradient-footer-middle-line', lineCont);
	// 	var textL    = M.DomUtil.create('div', 'legend-gradient-footer-toward', leg, 'Towards satellite');
	// 	var textR    = M.DomUtil.create('div', 'legend-gradient-footer-from', leg, 'Away from satellite');
	// },

	checkKey : function (e) {
		// key: enter
		if ( e.keyCode == 13 ) this.blur();
	},

	_saveLegendName : function (e) {

		var name = e.target.value;
		this.sourceObject.name = name;

		// Fire change
		this.context.updateLegend();	

	},


	


	_switch : function (e) {

		if ( e.target.id == 'switch_layerMeta' ) {
			if ( this.legendObj.layerMeta ) {
				this.legendObj.layerMeta = false;
			} else {
				this.legendObj.layerMeta = true;
			}
		}

		if ( e.target.id == 'switch_opacitySlider' ) {
			if ( this.legendObj.opacitySlider ) {
				this.legendObj.opacitySlider = false;
			} else {
				this.legendObj.opacitySlider = true;
			}
		}

		// Fire change
		this.updateLegend();		

	},

	_switchEnableLegend : function  (e) {
		if ( this.legendObj.enable ) {
			// M.DomUtil.addClass(this._legendContent, 'displayNone');
			this.legendObj.enable = false;
		} else {
			// M.DomUtil.removeClass(this._legendContent, 'displayNone');
			this.legendObj.enable = true;
		}

		this.updateLegend();
	},

	_switchLegend : function () {		

		if ( this.sourceObject.isOn ) {
			M.DomUtil.addClass(this.appendTo, 'is-off');
			this.sourceObject.isOn = false;	

		} else {
			M.DomUtil.removeClass(this.appendTo, 'is-off');
			this.sourceObject.isOn = true;
		}

		// Fire change
		this.context.updateLegend();

	},

	_switchGradient : function () {		

		if ( this.sourceObject.isOn ) {
			M.DomUtil.addClass(this.appendTo, 'is-off');
			this.sourceObject.isOn = false;
		} else {
			M.DomUtil.removeClass(this.appendTo, 'is-off');
			this.sourceObject.isOn = true;
		}

		// Fire change
		// this.updateLegend();
		this.context.updateLegend();

	}

});

// ██╗     ███████╗ ██████╗ ███████╗███╗   ██╗██████╗     ████████╗ ██████╗  ██████╗ ██╗     ███████╗
// ██║     ██╔════╝██╔════╝ ██╔════╝████╗  ██║██╔══██╗    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
// ██║     █████╗  ██║  ███╗█████╗  ██╔██╗ ██║██║  ██║       ██║   ██║   ██║██║   ██║██║     ███████╗
// ██║     ██╔══╝  ██║   ██║██╔══╝  ██║╚██╗██║██║  ██║       ██║   ██║   ██║██║   ██║██║     ╚════██║
// ███████╗███████╗╚██████╔╝███████╗██║ ╚████║██████╔╝       ██║   ╚██████╔╝╚██████╔╝███████╗███████║
// ╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═════╝        ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝



M.Tools.Legend = {

	buildRasterDeformationLegend : function (json, layer, prev_legend) {

		// get scale, title
		var scaleMin = (json.scale && _.isNumber(json.scale.min)) ? json.scale.min : -10;
		var scaleMax = (json.scale && _.isNumber(json.scale.max)) ? json.scale.max : 10;
		var legendTitle = (json.legendScaleTitle && _.isString(json.legendScaleTitle)) ? json.legendScaleTitle : '';

		// get colors
		var stops = json.stops;
		var colorArray = [];
		_.each(json.stops, function (s) {
			var c = 'rgba(';
			c += [s.col.r, s.col.g, s.col.b, s.col.a].join(',');
			c += ')';
			colorArray.push(c);
		});
		var colors = colorArray.join(',');


		var standard = {
		  "enable": true,
		  "layerMeta": false,
		  "opacitySlider": false,
		  "layerName": layer.getName(),
		  "point": {
		    "all": {
		      "color": {
		        "column": "mvel",
		   //      "value": [
		   //   		"#0000ff",
					// "#00ffff",
					// "#00ff00",
					// "#ffff00",
					// "#ff0000",
		   //      ],
		   		"value" : colorArray,
		        "minRange" : scaleMin,
		        "maxRange" : scaleMax,
		      },
		      "opacity": {
		        "column": false,
		        "value": 1
		      },
		      "pointsize": {
		        "column": false,
		        "value": 5
		      },
		      "isOn": true
		    },
		    "target": []
		  },
		  "polygon": {
		    "all": {},
		    "target": []
		  },
		  "line": {
		    "all": {},
		    "target": []
		  },
		  "html": "",
		  // "gradient": gradient
		  "gradient" : ''
		}

		return standard;

	},











	// ┌┐ ┬ ┬┬┬  ┌┬┐  ┬  ┌─┐┌─┐┌─┐┌┐┌┌┬┐  ┌─┐┌┐  ┬┌─┐┌─┐┌┬┐
	// ├┴┐│ │││   ││  │  ├┤ │ ┬├┤ │││ ││  │ │├┴┐ │├┤ │   │ 
	// └─┘└─┘┴┴─┘─┴┘  ┴─┘└─┘└─┘└─┘┘└┘─┴┘  └─┘└─┘└┘└─┘└─┘ ┴ 
	// ┌─┐┬─┐┌─┐┌┬┐  ┌─┐┌─┐┬─┐┌┬┐┌─┐ ┬┌─┐┌─┐┌┐┌
	// ├┤ ├┬┘│ ││││  │  ├─┤├┬┘ │ │ │ │└─┐│ ││││
	// └  ┴└─└─┘┴ ┴  └─┘┴ ┴┴└─ ┴ └─┘└┘└─┘└─┘┘└┘


	buildLegendObject : function  (styleJSON, layer, oldLegend) {

		var point 	= styleJSON.point;
		var line 	= styleJSON.line;
		var polygon = styleJSON.polygon;

		this.legendObj = oldLegend;

		// Here we either get legend from store, or we pick up the legend from last update.
		// We store this as "old legend object", and itarete through the styling json to look
		// for styling updates.

		// If legend object exists, save it as "old legend object"
		if ( this.legendObj ) {

			this.oldLegendObj = this.legendObj;
			var _layerMeta = this.oldLegendObj.layerMeta ? true : false;
			var _opacitySlider = this.oldLegendObj.opacitySlider ? true : false;
			var _enable = this.oldLegendObj.enable ? true : false;

		// If legend does not exist, get it from store and save it as "old legend object"
		} else {
			var legend = layer.getLegends();
			if ( legend ) this.oldLegendObj = legend;
		}

		// Create blank legend object that we populate with data from style json		
		this.legendObj = {

			enable : _enable,
			layerMeta : _layerMeta,
			opacitySlider : _opacitySlider,
			layerName : layer.getTitle(),
			
			point 	: {
				all 	: {},
				target 	: []
			},

			polygon : {
				all 	: {},
				target 	: []
			},

			line 	: {
				all 	: {},
				target 	: []
			},

			html : '',
			gradient : ''
		};

		// Build legend objects
		this.legendPoint(point);
		this.legendPolygon(polygon);
		this.legendLine(line);

		return this.legendObj;

	},

	// BUILD LEGEND OBJECT: POINT
	// BUILD LEGEND OBJECT: POINT
	// BUILD LEGEND OBJECT: POINT

	legendPoint : function (point) {
	
		if (!point || !point.enabled ) return;		

		var legend = {};
		var column;
		var value;
		var minRange;
		var maxRange;

		// COLOR
		// COLOR
		// COLOR

		// polygon color range
		if ( point.color.column ) {

			column   = point.color.column;
			value    = point.color.value;
			minRange = point.color.range[0];
			maxRange = point.color.range[1];

			// Save legend data
			legend.color = {};
			legend.color.column   = column; 
			legend.color.value    = value;
			legend.color.minRange = minRange;
			legend.color.maxRange = maxRange;


		// static polygon color
		} else {				

			value = point.color.staticVal ? point.color.staticVal : 'red';

			// Save legend data
			legend.color = {};
			legend.color.column = false;
			legend.color.value  = value;

		}
		

		// OPACITY
		// OPACITY
		// OPACITY

		// polygon opacity range
		if ( point.opacity.column ) {

			column   = point.opacity.column;
			minRange = point.opacity.range[0];
			maxRange = point.opacity.range[1];

			// Save legend data
			legend.opacity = {};
			legend.opacity.column   = column; 
			legend.opacity.minRange = minRange;
			legend.opacity.maxRange = maxRange;


		// static polygon opacity
		} else {

			if ( !point.opacity.staticVal && point.opacity.staticVal != 0 ) {
				value = 1;
			} else {
				value = point.opacity.staticVal;
			}				

			// Save legend data
			legend.opacity = {};
			legend.opacity.column = false;
			legend.opacity.value  = value;

		}


		// POINT SIZE
		// POINT SIZE
		// POINT SIZE

		// polygon pointsize range
		if ( point.pointsize.column ) {

			column   = point.pointsize.column;
			minRange = point.pointsize.range[0];
			maxRange = point.pointsize.range[1];

			// Save legend data
			legend.pointsize = {};
			legend.pointsize.column   = column; 
			legend.pointsize.minRange = minRange;
			legend.pointsize.maxRange = maxRange;


		// static polygon pointsize
		} else {

			if ( !point.pointsize.staticVal && point.pointsize.staticVal != 0 ) {
				value = 1.2;
			} else {
				value = point.pointsize.staticVal;
			}				

			// Save legend data
			legend.pointsize = {};
			legend.pointsize.column = false;
			legend.pointsize.value  = value;

		}


		if ( this.oldLegendObj && this.oldLegendObj.point.all ) {
			if ( this.oldLegendObj.point.all.name ) {
				legend.name = this.oldLegendObj.point.all.name;
			}
			if ( this.oldLegendObj.point.all.left_footer ) {
				legend.left_footer = this.oldLegendObj.point.all.left_footer;
			}
			if ( this.oldLegendObj.point.all.right_footer ) {
				legend.right_footer = this.oldLegendObj.point.all.right_footer;
			}

			if ( typeof this.oldLegendObj.point.all.isOn !== 'undefined' ) {
				legend.isOn = this.oldLegendObj.point.all.isOn;
			}
		}


		// Push legend object into array
		this.legendObj.point.all = legend;



		// FILTERS
		// FILTERS
		// FILTERS

		// polygon filters
		if ( point.targets && point.targets.length >= 1 ) {

			point.targets.forEach(function (target, i) {

				column   = target.column;
				var color    = target.color;					
				var opacity  = target.opacity;
				var width    = target.width;
				var operator = target.operator;
				value    = target.value;

				// Save legend data
				var legend = {
					column   : column,
					color    : color,
					opacity  : opacity,
					value    : value,
					width    : width,
					operator : operator
				};

				if ( this.oldLegendObj && this.oldLegendObj.point.target[i] ) {
					if ( this.oldLegendObj.point.target[i].name ) {
						legend.name = this.oldLegendObj.point.target[i].name;
					}
					if ( this.oldLegendObj.point.all.left_footer ) {
						legend.left_footer = this.oldLegendObj.point.target[i].left_footer;
					}
					if ( this.oldLegendObj.point.all.right_footer ) {
						legend.right_footer = this.oldLegendObj.point.target[i].right_footer;
					}

					if ( typeof this.oldLegendObj.point.target[i].isOn !== 'undefined' ) {
						legend.isOn = this.oldLegendObj.point.target[i].isOn;
					}
				}

				this.legendObj.point.target.push(legend);

			}.bind(this))

		
		}	

	},	


	// BUILD LEGEND OBJECT: POLYGON
	// BUILD LEGEND OBJECT: POLYGON
	// BUILD LEGEND OBJECT: POLYGON

	legendPolygon : function (polygon) {


		// polygon enabled
		if ( !polygon || !polygon.enabled ) return;		

	
		// Create blank legend
		var legend = {};

		// COLOR
		// COLOR
		// COLOR

		// polygon color range
		if ( polygon.color.column ) {

			var column   = polygon.color.column;
			var value    = polygon.color.value; 
			var minRange = polygon.color.range[0];
			var maxRange = polygon.color.range[1];

			// Save legend data
			legend.color = {};
			legend.color.column   = column; 
			legend.color.value    = value;
			legend.color.minRange = minRange;
			legend.color.maxRange = maxRange;


		// static polygon color
		} else {

			
			var value = polygon.color.staticVal ? polygon.color.staticVal : "red";
			

			// Save legend data
			legend.color = {};
			legend.color.column = false;
			legend.color.value  = value;

		}
		

		// OPACITY
		// OPACITY
		// OPACITY

		// polygon opacity range
		if ( polygon.opacity.column ) {

			var column   = polygon.opacity.column;
			var value    = polygon.opacity.value; 
			var minRange = polygon.opacity.range[0];
			var maxRange = polygon.opacity.range[1];

			// Save legend data
			legend.opacity = {};
			legend.opacity.column   = column; 
			legend.opacity.value    = value;
			legend.opacity.minRange = minRange;
			legend.opacity.maxRange = maxRange;


		// static polygon opacity
		} else {

			if ( !polygon.opacity.staticVal && polygon.opacity.staticVal != 0 ) {
				var value = 1;
			} else {
				var value = polygon.opacity.staticVal;
			}

			// Save legend data
			legend.opacity = {};
			legend.opacity.column = false;
			legend.opacity.value  = value;

		}

		
		if ( this.oldLegendObj && this.oldLegendObj.polygon.all ) {
			if ( this.oldLegendObj.polygon.all.name ) {
				legend.name = this.oldLegendObj.polygon.all.name;
			}

			if ( typeof this.oldLegendObj.polygon.all.isOn !== 'undefined' ) {
				legend.isOn = this.oldLegendObj.polygon.all.isOn;
			}
		}



		// Push legend object into array
		this.legendObj.polygon.all = legend;



		// FILTERS	
		// FILTERS
		// FILTERS

		// polygon filters
		if ( polygon.targets && polygon.targets.length >= 1 ) {

			polygon.targets.forEach(function (target, i) {
				
				var column   = target.column;
				var color    = target.color;					
				var opacity  = target.opacity;
				var value    = target.value;
				var operator = target.operator;

				// Save legend data
				var legend = {
					column   : column,
					color    : color,
					opacity  : opacity,
					value    : value,
					operator : operator
				};


				if ( this.oldLegendObj && this.oldLegendObj.polygon.target[i] ) {
					if ( this.oldLegendObj.polygon.target[i].name ) {
						legend.name = this.oldLegendObj.polygon.target[i].name;
					}

					if ( typeof this.oldLegendObj.polygon.target[i].isOn !== 'undefined' ) {					
						legend.isOn = this.oldLegendObj.polygon.target[i].isOn;
					}
				}



				this.legendObj.polygon.target.push(legend);

			}.bind(this))	

		
		}			

	},

	// BUILD LEGEND OBJECTL: LINE
	// BUILD LEGEND OBJECTL: LINE
	// BUILD LEGEND OBJECTL: LINE
	
	legendLine : function (line) {


		// line enabled
		if (!line || !line.enabled ) return;
		
		// Create blank legend
		var legend = {};			

		// COLOR
		// COLOR
		// COLOR

		// line color range
		if ( line.color.column ) {

			var column 	= line.color.column;
			var value 	= line.color.value;
			var minRange	= line.color.range[0];
			var maxRange	= line.color.range[1];

			// Save legend data
			legend.color = {};
			legend.color.column   = column; 
			legend.color.value    = value;
			legend.color.minRange = minRange;
			legend.color.maxRange = maxRange;


		// static line color
		} else {
			
			var value = line.color.staticVal ? line.color.staticVal : 'red';

			// Save legend data
			legend.color = {};
			legend.color.column = false;
			legend.color.value  = value;


		}


		// OPACITY
		// OPACITY
		// OPACITY

		// line opacity range
		if ( line.opacity.column ) {

			var column = line.opacity.column;
			var minRange = line.opacity.range[0];
			var maxRange = line.opacity.range[1];

			// Save legend data
			legend.opacity = {};
			legend.opacity.column   = column; 
			legend.opacity.minRange = minRange;
			legend.opacity.maxRange = maxRange;

		// line static opacity
		} else {

			if ( !line.opacity.staticVal && line.opacity.staticVal != 0 ) {
				var value = 1;
			} else {
				var value = line.opacity.staticVal;
			}				

			// Save legend data
			legend.opacity = {};
			legend.opacity.column   = false;
			legend.opacity.value    = value;
		
		}


		// WIDTH
		// WIDTH
		// WIDTH

		// line width range
		if ( line.width.column ) {

			var column = line.width.column;
			var minRange = line.width.range[0];
			var maxRange = line.width.range[1];

			// Save legend data
			legend.width = {};
			legend.width.column   = column;
			legend.width.minRange = minRange;
			legend.width.maxRange = maxRange;

		// static line width
		} else {


			if ( !line.width.staticVal && line.width.staticVal != 0 ) {
				var value = 5;
			} else {
				var value = line.width.staticVal;
			}


			// Save legend data
			legend.width = {};
			legend.width.column   = false;
			legend.width.value    = value;

		}



		if ( this.oldLegendObj && this.oldLegendObj.line.all ) {
			if ( this.oldLegendObj.line.all ) {
				legend.name = this.oldLegendObj.line.all.name;
			}
			if ( typeof this.oldLegendObj.line.all.isOn !== 'undefined' ) {
				legend.isOn = this.oldLegendObj.line.all.isOn;
			}
		}

		this.legendObj.line.all = legend;


				

		// FILTERS
		// FILTERS
		// FILTERS

		// line filters
		if ( line.targets && line.targets.length >= 1 ) {

			line.targets.forEach(function (target, i) {

				var column   = target.column;
				var color    = target.color;					
				var opacity  = target.opacity;
				var value    = target.value;
				var width    = target.width;
				var operator = target.operator;

				// Save legend data
				var legend = {
					column   : column,
					color    : color,
					opacity  : opacity,
					value    : value,
					width    : width,
					operator : operator
				}


				if ( this.oldLegendObj && this.oldLegendObj.line.target[i] ) {
					if ( this.oldLegendObj.line.target[i].name ) {
						legend.name = this.oldLegendObj.line.target[i].name;
					}
					if ( typeof this.oldLegendObj.line.target[i].isOn !== 'undefined' ) {
						legend.isOn = this.oldLegendObj.line.target[i].isOn;
					}
				}

				this.legendObj.line.target.push(legend);
									

			}.bind(this))

		} 

	},



	// **************************************************************************
	// **************************************************************************

	// ┌─┐┌─┐┌┬┐  ┬  ┌─┐┌─┐┌─┐┌┐┌┌┬┐  ┌─┐┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐┌─┐
	// │ ┬├┤  │   │  ├┤ │ ┬├┤ │││ ││  └─┐├┤  │  │ │││││ ┬└─┐
	// └─┘└─┘ ┴   ┴─┘└─┘└─┘└─┘┘└┘─┴┘  └─┘└─┘ ┴  ┴ ┴┘└┘└─┘└─┘
	// ┌─┐┌─┐  ┌─┐┬─┐┬─┐┌─┐┬ ┬
	// ├─┤└─┐  ├─┤├┬┘├┬┘├─┤└┬┘
	// ┴ ┴└─┘  ┴ ┴┴└─┴└─┴ ┴ ┴ 	

	// **************************************************************************
	// **************************************************************************


	getLegendArray : function (points, lines, polygons) {

		this._legends = [];

		// Build points
		this.pointsHTML(points);

		// Build polygons and lines
		this.polygonAndLinesHTML(polygons, lines);

		return this._legends;

	},




	// GRADIENT
	// GRADIENT
	// GRADIENT

	getGradientStyle : function (colorStops) {


		// Set styling
		var gradientStyle = 'background: -webkit-linear-gradient(left, ' + colorStops.join() + ');';
		gradientStyle    += 'background: -o-linear-gradient(right, '     + colorStops.join() + ');';
		gradientStyle    += 'background: -moz-linear-gradient(right, '   + colorStops.join() + ');';
		gradientStyle    += 'background: linear-gradient(to right, '     + colorStops.join() + ');';


		return gradientStyle;

	},


	// POINTS
	// POINTS
	// POINTS

	pointsHTML : function (points) {
	
		// TARGETED POINTS
		// TARGETED POINTS
		// TARGETED POINTS

		points.target.forEach(function (point, i) {		

			// Color & opacity
			var color   = point.color,
			    opacity = point.opacity,
			    RGB     = M.Tools.color2RGB(color),
			    rgba    = 'rgba(' + RGB.r + ',' + RGB.g + ',' + RGB.b + ',' + opacity + ');',
			    style   = 'background:' + rgba + '; ';
		
			// Name
			var name = point.column + ': ';
			var operator = point.operator + ' ';
			if ( operator != '= ' ) name += operator;
			name += point.value;

			// Size
			var size = point.width;
			if ( size > 20 ) size = 20;
			if ( size < 10  ) size = 10;
			style += 'width: ' + size + 'px; height: ' + size + 'px; border-radius: ' + size + 'px;';

			// Set dot position
			var _top = (20/2) - (size/2);
			var _left = (28/2) - (size/2);
			style += 'top: ' + _top + 'px; ' + 'left: ' + _left + 'px; ';

			this._legends.push({
					layerName : name,
					style : style,
					object : point,
					gradient : false
			});


		}.bind(this));


		// ALL POINTS
		// ALL POINTS
		// ALL POINTS

		// Can contain range

		// Static colors
		// Static colors
		// Static colors

		var pointStyle = '';
		var hasAllStyle = false;

		
		if ( points.all.color && !points.all.color.column ) {

			var color   = points.all.color.value;
			var opacity = points.all.opacity.value;			
			var RGB = M.Tools.color2RGB(color);
			var rgba = 'rgba(' + RGB.r + ',' + RGB.g + ',' + RGB.b + ',' + opacity + ');';
			pointStyle += 'background:' + rgba + ';';

			// Size
			var size    = points.all.pointsize.value;
			if ( size > 20 ) size = 20;
			if ( size < 10  ) size = 10;

			pointStyle += 'width: ' + size + 'px; height: ' + size + 'px; border-radius: ' + size + 'px;';

			// Set dot position
			var _top = (20/2) - (size/2);
			var _left = (28/2) - (size/2);			
			pointStyle += 'top: ' + _top + 'px; ' + 'left: ' + _left + 'px; ';			

			if ( opacity != 0 ) hasAllStyle = true;
		}


		if ( hasAllStyle ) {

			var layerName = this.legendObj.layerName;

			this._legends.push({
					layerName : layerName,
					style : pointStyle,
					object : points.all,
					gradient : false
			});			

		}



		// Color range
		// Color range
		// Color range

		if ( points.all.color && points.all.color.column ) {

			var colorStops = points.all.color.value;
			var minVal     = points.all.color.minRange;
			var maxVal     = points.all.color.maxRange;
			var column     = points.all.color.column;

			// Get gradient style
			var gradientStyle = this.getGradientStyle(colorStops);
 		
			// Set on to true by default
			if ( typeof points.all.isOn == 'undefined' ) {
	    			points.all.isOn = true;
			}

			var layerName = this.legendObj.layerName;

			this._legends.push({
				layerName : layerName,
				style : gradientStyle,
				object : points.all,
				gradient : {
					minVal     : minVal,
					maxVal     : maxVal,
					bline      : column
					// name       : column				
				}
			});	
		}		
	},


	// POLYGONS AND LINES HTML
	// POLYGONS AND LINES HTML
	// POLYGONS AND LINES HTML

	polygonAndLinesHTML : function  (polygons, lines) {
	

		// MATCHING TARGETS
		// MATCHING TARGETS
		// MATCHING TARGETS

		// (aka. we have a line and a polygon with the same target)

		var linePolygonTargetMatches = {};

		lines.target.forEach(function (l, i) {
			polygons.target.forEach(function (p, a) {

				// If it is a match
				if ( p.value == l.value ) {


					// Line style
					var lineColor   = l.color;
					var lineOpacity = l.opacity;
					var lineWidth   = l.width;
					var lineRGB     = M.Tools.color2RGB(lineColor);
					var lineRgba    = 'rgba(' + lineRGB.r + ',' + lineRGB.g + ',' + lineRGB.b + ',' + lineOpacity + ');';
					var lineStyle   = 'border: ' + (lineWidth/2) + 'px solid ' + lineRgba;

					if ( !p.color ) {
						lineStyle += 'height: 0px; top: 7px;';
					}


					// Polygon style
					var polygonColor   = p.color;
					var polygonOpacity = p.opacity;
					var polygonRGB     = M.Tools.color2RGB(polygonColor);
					var polygonRgba    = 'rgba(' + polygonRGB.r + ',' + polygonRGB.g + ',' + polygonRGB.b + ',' + polygonOpacity + ');';
					var polygonStyle   = 'background:' + polygonRgba;

					var style = lineStyle + polygonStyle;

					// Store matches
					linePolygonTargetMatches[l.value] = style;
				}

			}.bind(this))
		}.bind(this));



		// LINES LINES LINES LINES LINES LINES LINES 
		// LINES LINES LINES LINES LINES LINES LINES 
		// LINES LINES LINES LINES LINES LINES LINES 

		// TARGETED LINES
		// TARGETED LINES
		// TARGETED LINES

		lines.target.forEach(function (line, i) {

			// Stop if this target also exists in polygons
			if ( linePolygonTargetMatches[line.value] ) return;
			
			// Style
			var color   = line.color;
			var opacity = line.opacity;
			var RGB     = M.Tools.color2RGB(color);
			var rgba    = 'rgba(' + RGB.r + ',' + RGB.g + ',' + RGB.b + ',' + opacity + ');';
			var style   = 'border: ' + 2 + 'px solid ' + rgba;

			style += 'height: 0px; top: 7px;';

			// Name
			var name = line.column + ': ';
			var operator = line.operator + ' ';
			if ( operator != '= ' ) name += operator;
			name += line.value;

			this._legends.push({
					layerName : name,
					style : style,
					object : line,
					gradient : false					
			});

		}.bind(this));



		// POLYGONS POLYGONS POLYGONS POLYGONS POLYGONS 
		// POLYGONS POLYGONS POLYGONS POLYGONS POLYGONS 
		// POLYGONS POLYGONS POLYGONS POLYGONS POLYGONS 

		// TARGETED POLYGONS
		// TARGETED POLYGONS
		// TARGETED POLYGONS

		polygons.target.forEach(function (polygon, i) {

			// Stop if this target also exists in polygons
			if ( linePolygonTargetMatches[polygon.value] ) {
				var style = linePolygonTargetMatches[polygon.value];
			} else {
				var color   = polygon.color;
				var opacity = polygon.opacity;
				var RGB     = M.Tools.color2RGB(color);
				var rgba    = 'rgba(' + RGB.r + ',' + RGB.g + ',' + RGB.b + ',' + opacity + ');';
				var style   = 'background:' + rgba;
			}

			// Name
			var name = polygon.column + ': ';
			var operator = polygon.operator + ' ';
			if ( operator != '= ' ) name += operator;
			name += polygon.value;

			// this.eachLegendSetting(name, style, polygon);
			this._legends.push({
					layerName : name,
					style : style,
					object : polygon,
					gradient : false
			});			


		}.bind(this));


		// ALL POLYGONS & LINES - ALL POLYGONS & LINES - ALL POLYGONS & LINES
		// ALL POLYGONS & LINES - ALL POLYGONS & LINES - ALL POLYGONS & LINES
		// ALL POLYGONS & LINES - ALL POLYGONS & LINES - ALL POLYGONS & LINES


		// Static colors
		// Static colors
		// Static colors

		var allStyle = '';
		var hasAllStyle = false;

		// Polygon
		if ( polygons.all.color && !polygons.all.color.column ) {
			var color   = polygons.all.color.value;
			var opacity = polygons.all.opacity.value;			
			var RGB = M.Tools.color2RGB(color);
			var rgba = 'rgba(' + RGB.r + ',' + RGB.g + ',' + RGB.b + ',' + opacity + ');';
			allStyle += 'background:' + rgba;

			if ( opacity != 0 ) hasAllStyle = true;
		}

		// Line
		if ( lines.all.color && !lines.all.color.column ) {
			var color   = lines.all.color.value;
			var opacity = lines.all.opacity.value;
			var width   = lines.all.width.value;
			var RGB = M.Tools.color2RGB(color);
			var rgba = 'rgba(' + RGB.r + ',' + RGB.g + ',' + RGB.b + ',' + opacity + ');';

			if ( !polygons.all.color ) {
				allStyle += 'height: 0px; top: 7px;';
				width = width/2;
			}

			allStyle += 'border: ' + 2 + 'px solid ' + rgba;

			if ( opacity != 0 ) hasAllStyle = true;
		}


		if ( hasAllStyle ) {

			var layerName = this.legendObj.layerName;

			this._legends.push({
					layerName : layerName,
					style : allStyle,
					object : polygons.all,
					gradient : false
			});			

		}



		// Color range
		// Color range
		// Color range

		if ( polygons.all.color && polygons.all.color.column ) {

			var colorStops = polygons.all.color.value;
			var minVal     = polygons.all.color.minRange;
			var maxVal     = polygons.all.color.maxRange;
			var column     = polygons.all.color.column;

			// Get gradient style
			var gradientStyle = this.getGradientStyle(colorStops);
			var layerName = this.legendObj.layerName;

			this._legends.push({
				layerName : layerName,
				style : gradientStyle,
				object : polygons.all,
				gradient : {
					minVal     : minVal,
					maxVal     : maxVal,
					bline      : column
					// name       : column					
				}
			});	
		}
	},

	eachLegendHTML : function (options) {
		var name = options.layerName;
		var style = options.style;
		var object = options.object;		

		// Set on to true by default
		if ( typeof object.isOn == 'undefined' ) {
    			object.isOn = true;
		}

		var _name = object.name ? object.name : '';


		// Store HTML of legend for easy access in legend box on map
		if ( object.isOn ) {			

			if ( _name && _name.length>0 ) {
				var nn = _name;
			} else {
				var nn = name;
			}

			var htmlStr  = '<div class="legend-each-container">';
			    htmlStr += '<div class="legend-each-name">' + nn + '</div>';			    
			    htmlStr += '<div class="legend-each-color" style="' + style + '"></div>';
			    htmlStr += '</div>';
			
			    return htmlStr;
		}

		return '';
	},




	gradientLegendHTML : function (options, stylerObject) {
		var gradientStyle = options.style;
		var object = options.object;
		var minVal = options.gradient.minVal;
		var maxVal = options.gradient.maxVal;
		var bline = options.gradient.bline;
		var gradientName = object.name ? object.name : bline;
		var satelliteView = stylerObject.satelliteView;
		var layer = stylerObject.options.layer;

		var gradident_footer_left = object.left_footer || '';
		var gradident_footer_right = object.right_footer || '';

		if (_.includes(window.location.host, 'ngi.no')) {
			gradientName = 'mean velocity per year in mm';
		}
		// var gradientName = layer.getStyleJSON().legendScaleTitle || 'mean velocity per year in mm';

		// HTML PART
		// HTML PART
		// HTML PART

		// Set on to true by default
		if ( typeof options.object.isOn == 'undefined' ) {
    			options.object.isOn = true;
		}
		
		if ( options.object.isOn ) {

			// Container
			var _legendHTML = '<div class="info-legend-container">';

			// Legend Frame
			_legendHTML += '<div class="info-legend-frame">';
			_legendHTML += '<div class="info-legend-val info-legend-min-val">' + minVal + '</div>';

			if ( satelliteView ) {
				_legendHTML += '<div class="info-legend-header">' + gradientName + '</div>';
			} else {
				_legendHTML += '<div class="info-legend-header">' + gradientName + '</div>';
			}

			_legendHTML += '<div class="info-legend-val info-legend-max-val">' + maxVal + '</div>';

			// Gradient
			_legendHTML += '<div class="info-legend-gradient-container" style="' + gradientStyle + '"></div>';
			_legendHTML += '<div class="info-legend-bottom-line"><span style="float:left; text-align: left">' + gradident_footer_left + '</span><span style="float:right; text-align: right">'+ gradident_footer_right + '</span></div>';

			_legendHTML += '</div>';
			_legendHTML += '</div>';

			return _legendHTML + this.gradientFooterHTML(satelliteView);

		}

		return '';



	},


	gradientFooterHTML : function (satelliteView) {

		if ( !satelliteView ) return '';
	
		var gradientFooter  ='<div class="info-legend-gradient-bottomline">';
		    gradientFooter += '<div id="legend-gradient-footer" class="legend-gradient-footer">';
		    gradientFooter += '<div class="legend-gradient-footer-top">Deformation in satellite line of sight</div>';
		    gradientFooter += '<div class="legend-gradient-footer-line-container">';

		    gradientFooter += '<div class="legend-gradient-footer-line"></div>';
		    gradientFooter += '<div class="legend-gradient-footer-arrow-left"></div>';
		    gradientFooter += '<div class="legend-gradient-footer-arrow-right"></div>';
		    gradientFooter += '<div class="legend-gradient-footer-middle-line"></div>';
    		    gradientFooter += '</div>';

		    gradientFooter += '<div class="legend-gradient-footer-toward">Towards satellite</div>';
		    gradientFooter += '<div class="legend-gradient-footer-from">Away from satellite</div>';
    		    
		    gradientFooter += '</div>';
		    gradientFooter += '</div>';

		return gradientFooter;

	}
};


// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$




M.Legend.Raster = M.Legend.extend({

			
	// initialize : function (options) {

	// 	// console.log('M.Legend.Raster', options);

	// 	// background: linear-gradient(to right, #0000ff,#00ffff,#00ff00,#ffff00,#ff0000);

	// },


});








