M.Chrome.SettingsContent = M.Chrome.extend({

	_initialize : function () {
	
	},


	initLayout : function () {
	},


	_addEvents : function () {

		var trigger = this.options.trigger;
		if (trigger) {
			M.DomEvent.on(trigger, 'click', this.show, this);
		}

		M.DomEvent.on(window, 'resize', this._windowResize, this);

		M.Mixin.Events.on('layerSelected', this._refreshTab, this);
	},

	_refreshTab : function (e) {

		if ( !e.detail.layer ) return;
		
		var uuid = e.detail.layer.getUuid();
		this._storeActiveLayerUuid(uuid);

		// refresh
		if ( this.showing ) this.show();		
	},


	_removeEvents : function () {
		M.DomEvent.off(window, 'resize', this._windowResize, this);
	},

	_windowResize : function () {

	},

	_onLayerAdded : function () {
		this._refresh();
	},

	_onLayerEdited : function () {
		this._refresh();
	},

	show : function () {

		if (!this._inited) this._initLayout();

		this.showing = true;		

		// hide others
		this.hideAll();

		// show this
		this._container.style.display = 'block';

		// mark button
		M.DomUtil.addClass(this.options.trigger, 'active-tab');
	},

	hide : function () {
		this._container.style.display = 'none';
		M.DomUtil.removeClass(this.options.trigger, 'active-tab');
	},

	hideAll : function () {
		if (!this.options || !this.options.parent) return console.log('hideAll not possible');

		var tabs = this.options.parent.getTabs();
		for (var t in tabs) {
			var tab = tabs[t];
			tab.hide();
		}

		this.showing = false;

		// Hides the "add folder" in layer menu
		this._hideLayerEditor();

	},
	
	// Hides the "add folder" in layer menu
	_hideLayerEditor : function () {
		var layerMenu = app.MapPane.getControls().layermenu;
		if (layerMenu) layerMenu.disableEdit();
	},

	_projectSelected : function (e) {
		var p = e.detail.projectUuid;
		if (!p) return;

		// set project
		this._project = app.activeProject = app.Projects[p];

		// refresh pane
		this._refresh();
	},

	_refresh : function () {
	},

	_initLayout_activeLayers : function (title, subtitle, container, layers) {

		title = title || 'Layer';
		subtitle = subtitle || 'Select a layer to style...';
		var sortedLayers = [];
		
		// active layer wrapper
		var wrap = this._activeLayersWrap = M.DomUtil.create('div', 'chrome chrome-content styler-content active-layer wrapper', container);

		// title
		title = M.DomUtil.create('div', 'chrome chrome-content active-layer title', wrap, title);
		
		// create dropdown
		var selectWrap = M.DomUtil.create('div', 'chrome chrome-content active-layer', wrap);

		// get layers
		if ( !layers ) {
			layers = this._project.getStylableLayers();
		}

		// placeholder

		// fill select options
		layers.forEach(function (layer) {
			sortedLayers.push({
				title: layer.getTitle(),
				value: layer.getUuid()
			});
		});	

		this._stylerDropDown = new M.Dropdown({
			fn: this._selectedActiveLayer.bind(this),
			appendTo: selectWrap,
			content: sortedLayers,
			project: this._project,
			placeholder: subtitle,
		});

		return this._stylerDropDown;

	},

	_storeActiveLayerUuid : function (uuid) {
		app.Chrome.Right.options.editingLayer = uuid;
	},

	_getActiveLayerUuid : function () {
		return app.Chrome.Right.options.editingLayer;
	},

	opened : function () {
	},

	closed : function () {
	},

	// add layer temporarily for editing
	_tempaddLayer : function () {

		// remember
		this._temps = this._temps || [];

		// remove others
		this._tempRemoveLayers();

		// if not already added to map
		if (this._layer && !this._layer._added) {

			// add
			this._layer._addThin();

			// remember
			this._temps.push(this._layer);

			// move into view
			this._layer.flyTo();
		}

	},

	// remove temp added layers
	_tempRemoveLayers : function () {
		if (!this._temps) return;

		// remove other layers added tempy for styling
		this._temps.forEach(function (layer) {
			layer._removeThin();
		}, this);

		this._temps = [];
	},

	// UNUSED Function
	//_gradientStyle : function (colorArray) {
	//	var gradientStyle = 'background: -webkit-linear-gradient(left, ' + colorArray.join() + ');';
	//	gradientStyle    += 'background: -o-linear-gradient(right, '     + colorArray.join() + ');';
	//	gradientStyle    += 'background: -moz-linear-gradient(right, '   + colorArray.join() + ');';
	//	gradientStyle    += 'background: linear-gradient(to right, '     + colorArray.join() + ');';
    //
	//	return gradientStyle;
	//},

	// Make sure hex decimals have two digits
	padToTwo : function (numberString) {

		if (numberString.length < 2) numberString = '0' + numberString;
		return numberString;
	},

	// OMG code... haven't written it myself...
	// But it interpolates values between hex values
	hexAverage : function (twoHexes) {
		return twoHexes.reduce(function (previousValue, currentValue) {
			return currentValue
			.replace(/^#/, '')
			.match(/.{2}/g)
			.map(function (value, index) {
				return previousValue[index] + parseInt(value, 16);
			});
		}, [0, 0, 0])
		.reduce(function (previousValue, currentValue) {
			var newValue = this.padToTwo(Math.floor(currentValue / twoHexes.length).toString(16));
			return previousValue + newValue;
		}.bind(this), '#');
	},	

	_validateDateFormat : function (key) {
		return M.Tools.validateDateFormat(key);
	},

	// Returns a number between 0 and 1 from a range
	_normalize : function (value, min, max) {
		normalized = (value - min) / (max - min);
		return normalized;
	}

	// Sets min value to zero, and returns value from range, up to 1.
	//_normalizeOffset : function (value, min, max) {
	//	if ( min > 0 ) min = 0;
	//	normalized = (value - min) / (max - min);
	//	return normalized;
	//}
});
