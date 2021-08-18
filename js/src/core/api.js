M.Api = M.Class.extend({


	initialize : function (options) {
		M.setOptions(this, options);
	},

	// PORTAL
	getPortal : function (done) {
		var path = '/v2/portal';
		this.get(path, {}, done);
	},

	logout : function (options, done) {
		var path = '/logout';
		
		options = options || {};
		this.get(path, options, done);
	},

	cubes : {
		render : {
			start : function (options, done) {
				var path = '/v2/cubes/render/start';
				app.api.post(path, options, done);
			},

			estimate : function (options, done) {
				var path = '/v2/cubes/render/estimate';
				app.api.post(path, options, done);
			},

			status : function (options, done) {
				var path = '/v2/cubes/render/status';
				app.api.post(path, options, done);
			},
		}
	},

	// pre-render
	preRender : function (options, done) {
		var path = '/v2/tiles/render';
		this.post(path, options, done);
	},

	// pre-render
	preRenderCube : function (options, done) {
		var path = '/v2/cubes/render';
		this.post(path, options, done);
	},


	// PROJECTS
	createProject : function (options, done) {
		var path = '/v2/projects/create';
		this.post(path, options, done);
	},

	updateProject : function (options, done) {
		var path = '/v2/projects/update';
		this.post(path, options, done);
	},

	deleteProject : function (options, done) {
		var path = '/v2/projects/delete';
		this.post(path, options, done);
	},

	getProject : function (options, done) {
  		var path = '/v2/projects/public';		
		this.get(path, options, done)
  	},

  	getPrivateProject : function (options, done) {
  		var path = '/v2/projects/private';
		this.get(path, options, done)
  	},

  	addFileToTheProject : function (options, done) {
		var path = '/v2/projects/data';
		this.post(path, options, done);
	},

	projectSetAccess  : function (options, done) {
		var path = '/v2/projects/access';		
		this.post(path, options, done);
	},


	checkUniqueSlug : function (options,done) {
		var path = '/v2/projects/slug/unique';
		this.post(path, options , done);
	},

	getAvailableSlug : function (options,done) {
		var path = '/v2/projects/slug/available';
		this.post(path, options , done);
	},


  	// USERS
	auth : function (done) {
		var path = '/v2/users/session';
		this.get(path, {}, done);
	},

	getTokenFromPassword : function (options, done) {
		var path = '/v2/users/token';
		this.get(path, options, done);
	},

	deleteUser : function (options, done) {
		var path = '/v2/users/delete';
		this.post(path, options, done);
	},

	updateUser: function (options, done) {
		var path = '/v2/users/update';
		this.post(path, options, done);
	},

	updateUsername: function (options, done) {
		var path = '/v2/users/updateUsername';
		this.post(path, options, done);
	},

	createUser: function (options, done) {
		var path = '/v2/users/create';
		this.post(path, options, done);
	},

	uniqueEmail: function (options, done) {
		var path = '/v2/users/email/unique';
		this.post(path, options, done);
	},

	uniqueUsername: function (options, done) {
		var path = '/v2/users/username/unique';
		this.post(path, options, done);
	},

	requestContact : function (options, done) {
		var path = '/v2/users/contacts/request';
		this.post(path, options, done);
	},
	
	resetPassword : function (options, done) {
   		var path = '/v2/users/password/reset';
		this.post(path, options, done) 		
  	},

	userInvite : function (options, done) {
		var path = '/v2/users/invite';
		this.post(path, options, done);
	},

	addInvites: function (options, done) {
		var path = '/v2/users/invite/project';	
		this.post(path, options, done);
	},

	inviteLink : function (options, done) {
		var path = '/v2/users/invite/link';
		this.get(path, options, done);
	},

	acceptInvite : function (options, done) {
		var path = '/v2/users/invite/accept';
		this.post(path, options, done);
	},

	inviteToProjects : function (options, done) {
		var path = '/v2/users/invite/projects';		
		this.post(path, options, done);
	},

	













	// DATA 


	shareDataset : function (options, done) {
		var path = '/v2/data/share';
		this.post(path, options, done);
	},

	deleteDataset : function (options, done) {
		var path = '/v2/data/delete';
		this.post(path, options, done);
	},

	updateFile : function (options, done) {
		var path = '/v2/data/update';
		this.post(path, options, done);
  	},

  	fileGetLayers : function (options, done) {
		var path = '/v2/data/layers';
		this.post(path, options, done);
	},

	getLayer : function (options, done) {
		var path = '/v2/layers/getLayer';
		this.post(path, options, done);
	},

	downloadDataset : function (options, done) {
		var path = '/v2/data/download';
		this.post(path, options, done);
	},

	vectorizeDataset : function (options, done) {
		var path = '/v2/tiles/vectorize';
		this.post(path, options, done);
	},

	importStatus : function (options, done) {
		var path = '/v2/data/status';
		this.get(path, options, done);
	},

	importExternalFile : function (options, done) {
		var path = '/v2/data/external';
		this.post(path, options, done);
	},


  	// LAYERS
  	getWMSLayers : function (options, done) {
  		var path  = '/v2/layers/wms';
  		this.get(path, options, done);
  	},


	deleteLayer : function (options, done) {
		var path = '/v2/layers/delete';
		this.post(path, options, done);
	},

	updateLayer : function (options, done) {
		var path = '/v2/layers/update';
		this.post(path, options, done);
	},

	setCartocss : function (options, done) {
		var path = '/v2/layers/carto';
		this.post(path, options, done);
	},

	getCartocss : function (options, done) {
		var path = '/v2/layers/carto';		
		this.get(path, options, done);
	},

	json2carto : function (options, done) {
		var path = '/v2/layers/carto/json';
		this.post(path, options, done);
	},

	customCarto : function (options, done) {
		var path = '/v2/layers/carto/custom';
		this.post(path, options, done);
	},

	downloadLayerDataset : function (options, done) {
		var path = '/v2/layers/download';
		this.post(path, options, done);
	},

	createLayer : function (options, done) {
		var path = '/v2/layers/create';
		this.post(path, options, done);
	},

	createDefaultLayer : function (options, done) {
		var path = '/v2/layers/create/default';
		this.post(path, options, done);
	},

	reloadMeta : function (options, done) {
		var path = '/v2/layers/meta';
		this.post(path, options, done);
	},

	updateCube : function (options, done) {
		console.log('updateCube', options);
		var path = '/v2/cubes/update';
		this.post(path, options, done);
	},

	removeFromCube : function (options, done) {
		console.log('removeFromCube', options);
		var path = '/v2/cubes/remove';
		this.post(path, options, done);
	},

	addToCube : function (options, done) {
		console.log('addToCube', options);
		var path = '/v2/cubes/add';
		this.post(path, options, done);
	},

	createCube : function (options, done) {
		console.log('createCube', options);
		var path = '/v2/cubes/create';
		this.post(path, options, done);
	},

	getCube : function (options, done) {
		var path = '/v2/cubes/get';
		this.get(path, options, done);
	},

	
	// TILES
	// [mile]
	createTileLayer : function (options, done) {
		var path = '/v2/tiles/create';
		this.post(path, options, done);
	},


	// [mile]
	addMask : function (options, done) {
		console.log('addMask', options);
		var path = '/v2/cubes/mask';
		this.post(path, options, done);
	},

	// getMaskBackdropData : function (options, done) {
	// 	console.log('getMaskData', options);
	// 	// var path = 'https://gist.githubusercontent.com/knutole/f37803e645d966698b91f66ddb674b04/raw/8977bd7e73f26ffb7f10eef655b852841322326c/dummy-scf-backdrop-data.json'
	// 	// this.get(path, options, done);

	// 	var data_id = options.data_id;

	// 	var dummy_data = M.stringify([
	// 		{
	// 			"doy" : 1,
	// 			"min" : 1,
	// 			"max" : 20,
	// 			"average" : 10
	// 		},
	// 		{
	// 			"doy" : 2,
	// 			"min" : 3,
	// 			"max" : 30,
	// 			"average" : 20
	// 		}
	// 	]);
	// 	return done(null, dummy_data);
	// },


	// getMaskYearlyData : function (options, done) {

	// 	var data_id = options.data_id;
	// 	var year = options.year;

	// 	var dummy_data = M.stringify([
	// 		{
	// 			"year" : "2018",
	// 			"doy" : 1,
	// 			"min" : 1,
	// 			"max" : 20,
	// 			"average" : 10
	// 		},
	// 		{
	// 			"year" : "2018",
	// 			"doy" : 2,
	// 			"min" : 3,
	// 			"max" : 30,
	// 			"average" : 20
	// 		}
	// 	]);
	// 	return done(null, dummy_data);

	// },

	getEndpointData : function (options, done) {
		var path = options.url;
		this.get(options.url, {}, done);
	},









	// LEGENDS


	createLegends : function (options, done) {
		// var path = '/api/layer/createlegends';
		var path = '/v2/legends/create';
		this.post(path, options, done);
	},

	

	









	// HASHES
	
	
	getHash : function (options, done) {
		// var path = '/api/project/hash/get';
		// var path = '/v2/hashes/get';		
		var path = '/v2/hashes';		
		this.get(path, options, done);
	},

	setHash : function (options, done) {
		// var path = '/api/project/hash/set';
		// var path = '/v2/hashes/set';
		var path = '/v2/hashes';
		this.post(path, options, done);
	},





	// QUERIES

	queryCube : function (options, done) {
		console.log('queryCube', options);
		var path = '/v2/cubes/query';
		this.post(path, options, done);
	},
	
	dbFetchArea : function (options, done) {
		var path = '/v2/query/polygon';
		this.post(path, options, done);
	},

	dbFetch : function (options, done) {
		var path = '/v2/query/point';
		this.post(path, options, done);
	},

	fetchHistogram : function (options, done) {
		var path = '/v2/query/histogram';
		this.post(path, options, done);
	},

	getVectorPoints : function (options, done) {
		var path = '/v2/query/getVectorPoints';
		this.post(path, options, done);
	},

	fetchRasterDeformation : function (options, done) {
		var path = '/v2/query/defo';
		this.post(path, options, done);
	},

	queryRasterPoint : function (options, done) {
		var path = '/v2/query/raster/point';
		this.post(path, options, done);
	},


	// LOG


	errorLog : function (options, done) {
		// var path = '/api/error/log';
		var path = '/v2/log/error';
		this.post(path, options, done);
	},

	analyticsSet : function (options, done) {
		// var path = '/api/analytics/set';
		var path = '/v2/log';
		this.post(path, options, done);
	},

	analyticsGet : function (options, done) {
		// var path = '/api/analytics/get';
		var path = '/v2/log';
		this.get(path, options, done);
	},


	// get custom data (allYears)
	getCustomData : function (options, done) {
  		var path = '/v2/static/getCustomData';		
		this.get(path, options, done)
  	},





	// STATIC



	createThumb : function (options, done) {
		// var path = '/api/util/createThumb';
		var path = '/v2/static/thumb';		// todo: GET ?
		this.post(path, options, done);
	},

	pdfsnapshot : function (options, done) {
		// var path = '/api/util/pdfsnapshot';
		var path = '/v2/static/pdf';
		this.post(path, options, done);
	},

	snap : function (options, done) {
		// var path = '/api/util/snapshot';
		var path = '/v2/static/screen';
		this.post(path, options, done);
	},














	
	// helper fn's
	post : function (path, options, done) {
		this._post(path, JSON.stringify(options), function (err, response) {
			done && done(err, response);
		});
	},

	_post : function (path, json, done, context, baseurl) {
		var http = new XMLHttpRequest();
		var url = baseurl || this.options.url || M.Util._getServerUrl();
		url += path;

		// open
		http.open("POST", url, true);

		// set json header
		http.setRequestHeader('Content-type', 'application/json');

		// response
		http.onreadystatechange = function() {
			if (http.readyState == 4) {
				if (http.status == 200) {
					done && done(null, http.responseText); 
				} else {
					done && done(http.status, http.responseText);
				}
			}
		};

		// add access_token to request
		var access_token = (window.app && app.tokens) ? app.tokens.access_token : null;
		var options = _.isString(json) ? M.parse(json) : json;
		options.access_token = options.access_token || access_token;

		var send_json = M.stringify(options);
		
		// send
		http.send(send_json);
	},

	get : function (path, options, done) {
		this._get(path, JSON.stringify(options), function (err, response) {
			done && done(err, response);
		});
	},

	_get : function (path, options, done, context, baseurl) {
		var http = new XMLHttpRequest();
		var url = baseurl || this.options.url || M.Util._getServerUrl();
		if (_.includes(path, 'http') && _.includes(path, '://')) {
			url = path;
		} else {
			url += path;
		}

		// add options to query
		url = this._addQueryOptions(url, options);

		// open
		http.open("GET", url, true);

		// set json header
		http.setRequestHeader('Content-type', 'application/json');

		// response
		http.onreadystatechange = function() {
			if (http.readyState == 4) {
				if (http.status == 200) {
					done && done(null, http.responseText);
				} else {
					done && done(http.status, http.responseText);
				}
			}
		};
		
		// send
		http.send();
	},

	_addQueryOptions : function (url, options) {
		var options = options || {};
		options = _.isObject(options) ? options : M.parse(options);
		options.access_token = (window.app && app.tokens) ? app.tokens.access_token : null;
		if (!_.isEmpty(options)) {
			_.forOwn(options, function (value, key) {
				// encode and add
				url += _.includes(url, '?') ? '&' : '?';
				url += encodeURIComponent(key) + '=' + encodeURIComponent(value);
			});
		}
		return url;
	},

});