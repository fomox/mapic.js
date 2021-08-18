M.Chrome.Left = M.Chrome.extend({

	_ : 'leftchrome', 

	options : {
		defaultWidth : 282,
		tabs : {
			projects : true,
			users : true
		}
	},

	_initialize : function (options) {

		// init container
		this.initContainer();

		// add hooks
		this._addEvents();
	},

	initContainer : function () {


		// create container
		this._container = M.DomUtil.create('div', 'chrome chrome-container chrome-left', app._appPane);

		// Outer scroller
		this._outerScroller = M.DomUtil.create('div', 'chrome-left-outer-scroller', this._container);

		// Inner scroller
		this._innerScroller = M.DomUtil.create('div', 'chrome-left-inner-scroller', this._outerScroller);

		// holder for all tabs
		this._tabs = {};
	
		// settings tab
		if (this.options.tabs.projects) {

			// create settings selector
			this._tabs.projects = new M.Chrome.Projects({
				appendTo : this._innerScroller,
				chrome : this
			});
		}

		// data tab (disable for EDI)
		if (this.options.tabs.users && window.location.host != 'maps.edinsights.no') {

			// create settings selector
			this._tabs.users = new M.Chrome.Users({
				appendTo : this._innerScroller,
				chrome : this // ie. left chrome
			});
		}

		// close by default
		this.close(true);

	},

	_addEvents : function () {

	},

	open : function () {

		if (this._isOpen) return;
		this._isOpen = true;

		// set width of right pane
		this._container.style.width = this.options.defaultWidth + 'px';
		this._container.style.display = 'block';

		// update map size
		this.updateMapSize();
	},

	close : function (force) {

		if (!this._isOpen && !force) return;
		this._isOpen = false;

		// set width of right pane
		this._container.style.width = '0';
		this._container.style.display = 'none';

		// update map size
		this.updateMapSize();
	},


	_onCloseMenuTabs : function () {

		this.close();
	},
	

	getDimensions : function () {
		var dims = {
			width : this.options.defaultWidth,
			height : this._container.offsetHeight
		};
		return dims;
	}

});