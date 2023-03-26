M.version = '19.11.21';
M.App = M.Class.extend({
	_ : 'app',

	// default options
	options : window.systemapicConfigOptions, // global var from config.js... perhaps refactor.
	language : language,
	_ready : false,
	force_login : false,

	initialize : function (options) {
		
		// print version
		console.log('Mapic v.' + M.version);

		// set global app
		window.app = M.app = this; // todo: remove M.app, use only window.app

		// merge options
		M.setOptions(app, options);

		// init api
		app.api = new M.Api({});

		// analytics
		app.analytics = new M.Analytics();

		// auth
		app.api.auth(app.authed);

	},

	authed : function (err, access_token) {

		// catch err
		if (err) return console.error('Something went wrong: ', err);

		// set access_token
		app.tokens = M.parse(access_token);

		// init socket
		app.Socket = new M.Socket();

		// error handling
		app._initErrorHandling();

		// set page title
		if (window.location.host == 'maps.edinsights.no') {

			document.title = 'EDInsights Maps'

		} else {

			document.title = 'NGI | Insarkart'

		}

		// get objects from server
		app.initServer();

	},

	_initSniffers : function () {

		// Detect mobile devices
		app.detectMobile();

		// get user agent
		app.sniffer = Sniffer(navigator.userAgent);
	},
	
	_initErrorHandling : function () {

		// log all errors
		window.onerror = app._onError;

	},

	_onError : function (message, file, line, char, ref) {
		if (!ref) return console.error('No ref', arguments);
		var stack = ref.stack;
		var project = app.activeProject ? app.activeProject.getTitle() : 'No active project';
		var username = app.Account ? app.Account.getName() : 'No username';
		var options = JSON.stringify({
			message : message,
			file : file,
			line : line,
			user : username,
			stack : stack,
			project : project
		});
		app.api.errorLog(options, function (err, response) {
			if (err) {
				return app.feedback.setError({
					title : 'Something went wrong.',
					description : err
				});
			}
		}); // todo: move req to api.js
	},

	_checkForInvite : function () {
		var pathname = window.location.pathname;
		if (pathname.indexOf('/invite/') == -1) return;
		var invite_token = pathname.split('/').reverse()[0];
		if (invite_token) app.options.invite_token = invite_token;
	},

	initServer : function () {
		console.log('Securely connected to server: \n', app.options.servers.portal);

		// check for invite link
		app._checkForInvite();

		// data for server
		var data = JSON.stringify(app.options);

		// get portal
		app.api.getPortal(function (err, response) {
			if (err) return console.error('Something went wrong.');

			// parse
			var store = M.parse(response);

			// build app
			app.build(store)
		});
	},


	build : function (portalStore) {

		// set vars
		app.options.json = portalStore;

		// load json model
		app._initObjects();

		// create app container
		app._initContainer();

		// init chrome
		app._initChrome();

		// create panes
		app._initPanes();

		// init pane view
		app._initView();

		// ready
		app._ready = true; // todo: fire app ready event

		// select project
		M.Mixin.Events.fire('appReady');

		// init sniffers
		app._initSniffers();

		// log entry
		app._logEntry();

		// force login
		// app._forceLogin();

	},

	_forceLogin : function () {
		if (!app.options.force_login) return;
		if (!app.Account.isPublic()) return;
		if (this._publicProjectActive) return;

		// login screen
		this._login('Welcome! Please log in.');
	},

	_logEntry : function () {
		var b = app.sniffer.browser;
		var o = app.sniffer.os;
		var browser = b.fullName + ' ' + b.majorVersion + '.' + b.minorVersion;
		var os = o.fullName + ' ' + o.majorVersion + '.' + o.minorVersion;

		app.log('login', {
		    	info : {
		    		browser : browser,
		    		os : os
		    	},
		    	category : 'Users'
		});
	},

	_initObjects : function () {

		// data controller
		app.Data = new M.Data();

		// controller .. todo: refactor what's in controller.. or expand..
		app.Controller = new M.Controller();

		// main user account
		app.Account = new M.User(app.options.json.account);

		// contact list
		app.Users = {};
		app.Account.getContactList().forEach(function(user) {
		       app.Users[user.uuid] = new M.User(user);    
		});
		app.options.json.users.project_users.forEach(function(user) {
		       if (!app.Users[user.uuid]) app.Users[user.uuid] = new M.User(user);             
		});

		// add self to users list
		app.Users[app.Account.getUuid()] = app.Account;

		// create project objects
		app.Projects = {};
		app.options.json.projects.forEach(function(store, i, arr) {
		       	app.Projects[store.uuid] = new M.Model.Project(store);
		});

		// phantomjs
		app.phantomjs = new M.PhantomJS();
	},

	_initChrome : function () {

		// chrome
		app.Chrome = {};

		// top chrome
		app.Chrome.Top = new M.Chrome.Top();

		// right chrome
		app.Chrome.Right = new M.Chrome.Right();

		// right chrome
		app.Chrome.Left = new M.Chrome.Left();
	},

	_initPanes : function () {

		// render tooltip
		app.Tooltip = new M.Tooltip();

		// render style handler
		app.Style = new M.Style();

		// render progress bar
		app.ProgressBar = new M.ProgressPane({
			color : 'white',
			addTo : app._appPane
		});

		// render map pane
		app.MapPane = new M.MapPane();

		// render eror pane
		app.FeedbackPane = new M.FeedbackPane();

		// settings pane
		app.MapSettingsPane = new M.MapSettingsPane();

		// share pane
		app.Share = new M.Share();

		// // big slider
		// app.Animator = new M.Animator({ // refactor to project controls
		// 	// data : 'allYears',
		// 	data : 'scf.average.2000.2015', // todo: refactor data fetching
		// 	hide : true
		// });

		// add account tab
		app.AccountPane = new M.Pane.Account();

		// load public stylesheet
		if (app.Account.isPublic()) {
			app.Controller.loadjscssfile('/css/public-stylesheet.css', 'css');
		}
	},

	// init default view on page-load
	_initView : function () {
			
		// runs hotlink
		if (app._initHotlink()) {
			return;
		} 

		// open first project (ordered by lastUpdated)
		app.Controller.openDefaultProject();
	},

	_initInvite : function () {
		var project = app.options.json.invite;

		if (!project) return false;

		// select project
		M.Mixin.Events.fire('projectSelected', {detail : {
			projectUuid : project.id
		}});

		app.feedback.setMessage({
			title : 'Project access granted',
			description : 'You\'ve been given access to the project ' + project.name 
		});
	},

	_initHotlink : function (hotlink) {

		// parse error prone content of hotlink..
		var hotlink = hotlink || window.hotlink;
		app.hotlink = M.parse(hotlink);

		// return if no hotlink
		if (_.isEmpty(app.hotlink)) return false;

		// check if user owns project
		var project = app._projectExists(app.hotlink);
		if (project) {
			app._setProject(project);
			return true;
		}

		// request project from server
		app.api.getProject({
			username : app.hotlink.username,
			project_slug : app.hotlink.project
		}, function (err, project_json) {
			if (err) return app._login('Please log in to view this private project.');

			var project_store = M.parse(project_json);

			// import project
			app._importProject(project_store, function (err, project) {
				app._setProject(project);

				if (project.isPublic()) {
					this._publicProjectActive = true;
				}
			}.bind(this));
		});

		return true;
	},

	_login : function (msg) {
		// open login
		var login = new M.Pane.Login();
		login.setDescription(msg);
		login.open();
	},

	_importProject : function (project_store, done) {

		// already exists
		if (app.Projects[project_store.uuid]) {
			return; 
		}

		// create project model
		var project = new M.Model.Project(project_store);
		app.Projects[project.getUuid()] = project;
		app.Chrome.Projects._addProject(project);

		// return
		done(null, project);
	},


	// check if project exists (for hotlink)
	_projectExists : function (hotlink) {
		var project_slug = hotlink.project; 
		var username = hotlink.username;

		// find project slug in M.app.Projects
		var project_slug = project_slug || window.hotlink.project;
		for (var p in M.app.Projects) {
			var project = M.app.Projects[p];
			if (project_slug == project.store.slug) {
				if (project.store.createdByUsername == username) {
					return project; 
				}
			}
		}
		return false;
	},

	_initEvents : function () {
	},

	_getDimensions : function (e) {
		var w = window,
		    d = document,
		    e = d.documentElement,
		    g = d.getElementsByTagName('body')[0],
		    x = w.innerWidth || e.clientWidth || g.clientWidth,
		    y = w.innerHeight|| e.clientHeight|| g.clientHeight,
		    d = {
			height : y,
			width : x,
			e : e
		    }
		return d;
	},

	_initContainer : function () {

		// find or create container
		var id = app.options.id;
		app._appPane = M.DomUtil.get(id) || M.DomUtil.createId('div', id || 'app', document.body);

		// create map container
		app._mapContainer = M.DomUtil.createId('div', 'map-container', app._appPane);
	},

	_setProject : function (project) {

		// select project
		M.Mixin.Events.fire('projectSelected', {detail : {
			projectUuid : project.getUuid()
		}});
	},

	// get name provided for portal from options hash 
	getPortalName : function () {
		return app.options.portalName;
	},


	// todo: move to own script
	detectMobile : function() {
		
		app.isMobile = M.Util.isMobile();

		if (app.isMobile) {

			// Set size	
			this.setMobileSize();

			// Listen to the wind blow
			this.mobileListners();
		}

	},

	mobileListners : function () {

		M.DomEvent.on(window, 'resize', this.setMobileSize, this);

	},


	setMobileSize : function () {

		// Check landscape or portrait format
		var portrait = window.innerHeight > window.innerWidth;

		// Get width
		var width  = portrait ? app.isMobile.width : app.isMobile.height;
		var height = portrait ? app.isMobile.height : app.isMobile.width;

		// Check device type
		var device = app.isMobile.mobile ? 'mobile' : 'tablet';

		// load stylesheet
		app.Controller.loadjscssfile('/css/' + device + '.css', 'css');

		// set width of map
		app._map._container.style.width = width + 'px';
		// app._map._container.style.height = height + 'px';

	},


	debug : function () {

		// add red borders to tiles
		app.Style.setStyle('img.leaflet-tile', {
			'border-top': '1px solid rgba(255, 0, 0, 0.65)',
			'border-left': '1px solid rgba(255, 0, 0, 0.65)'
		});

		// click event to get tile address
		if (app._map) app._map.on('mousedown', function (e) {
			var lat = e.latlng.lat;
			var lng = e.latlng.lng;
			var zoom = app._map.getZoom();
			var tile = app._getTileURL(lat, lng, zoom);

			// log to console
			console.log('tile:', tile);
		});

		// extend Number with toRad
		if (typeof(Number.prototype.toRad) === "undefined") {
			Number.prototype.toRad = function() {
				return this * Math.PI / 180;
			}
		}
	},

	// for debug
	_getTileURL : function (lat, lon, zoom) {
		var xtile = parseInt(Math.floor( (lon + 180) / 360 * (1<<zoom) ));
		var ytile = parseInt(Math.floor( (1 - Math.log(Math.tan(lat.toRad()) + 1 / Math.cos(lat.toRad())) / Math.PI) / 2 * (1<<zoom) ));
		return "" + zoom + "/" + xtile + "/" + ytile;
	},

});
