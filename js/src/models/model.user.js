M.User = M.Class.extend({ 

	initialize : function (store) {

		// set vars
		this.store = store;

		// init file objects
		this.initFiles();

		this._listen();
	},

	_listen : function () {
		// M.Mixin.Events.on('closeMenuTabs',   this._onCloseMenuTabs, this);
	},

	initFiles : function () {

		// get files
		var files = this.store.files;
		this._files = {};
		if (!files) return;

		// create
		files.forEach(function (file) {
			this._files[file.uuid] = new M.Model.File(file);
		}, this);
	},

	isPublic : function () {
		var isPublic = (this.store.local.email == 'public@mapic.io' || this.store.uuid == 'mapic-public');
		return isPublic;
	},

	isContact : function () {
		if (!app.Account) return console.error('too early!');
		if (this.getUuid() == app.Account.getUuid()) return;

		var isContact = _.includes(app.Account.getContactListUuids(), this.getUuid());

		return isContact;
	},


	getContactListUuids : function () {
		var uuids = [];
		this.getContactList().forEach(function (c) {
			uuids.push(c.uuid);
		});
		return uuids;
	},

	getContactList : function ()  {
		return this.store.contact_list;
	},

	sendContactRequest : function (user) {

		var options = {
			contact : user.getUuid()
		};

		app.api.requestContact(options, function (err, response) {
			if (err) {
				return app.feedback.setError({
					title : 'Something went wrong',
					description : err
				});
			}
			// set feedback 
			app.feedback.setMessage({
				title : 'Friend request sent'
				// description : description
			});
		});

	},

	inviteToProjects : function (options) {

		var userUuid = this.getUuid();
		var userName = this.getFullName();
		var num = options.edit.length + options.read.length;

		var invites = {
			edit : options.edit,
			read : options.read,
			user : userUuid
		};

		// send to server
		app.api.inviteToProjects(invites, function (err, response) {
			if (err) {
				return app.feedback.setError({
					title : 'Something went wrong',
					description : err
				});
			}
			var result = M.parse(response);

			// set feedback 
			app.feedback.setMessage({
				title : 'Project invites sent!',
				description : userName + ' has been invited to ' + num + ' projects'
			});
			
			// update locally
			result.projects.forEach(function (projectAccess) {
				var project = app.Projects[projectAccess.project];
				project.store.access = projectAccess.access;
			});

		}.bind(this));

	},

	getFiles : function () {
		return this._files;
	},

	getFileStore : function (fileUuid) {
		var file = _.find(this.store.files, function (f) {
			return f.uuid == fileUuid;
		});
		return file;
	},

	getFile : function (fileUuid) {
		return this._files[fileUuid]; // return object
	},

	getUsername : function () {
		return this.store.username;
	},

	setFile : function (file) {
		this.store.files.push(file);
		this._files[file.uuid] = new M.Model.File(file);
		return this._files[file.uuid];
	},

	removeFile : function (fileUuid) {
		// var fileUuid = file.file_id;
		var r = _.remove(this.store.files, function (f) {
			return f.uuid ==fileUuid;
		});

		this._files[fileUuid] = null;
		delete this._files[fileUuid];

	},

	// set functions
	setLastName : function (value) {
		this.store.lastName = value;
		this.save('lastName');
	},

	setFirstName : function (value) {
		this.store.firstName = value;
		this.save('firstName');
	},

	setCompany : function (value) {
		this.store.company = value;
		this.save('company');
	},

	setPosition : function (value) {
		this.store.position = value;
		this.save('position');
	},

	setPhone : function (value) {
		this.store.phone = value;
		this.save('phone');
	},

	setMobile : function (value) {
		this.store.mobile = value;
		this.save('mobile');
	},

	setEmail : function (value) {
		this.store.local.email = value;
		this.save('local.email');
	},

	setUsername : function (value) {

		// set fields
		var changes = {
			username : value,
			uuid : this.store.uuid
		};


		app.api.updateUsername(changes, function (err, result) {
			if (err) console.error('err', err);

			var parsed = M.parse(result);
			console.log('result: ', parsed);

		}.bind(this));

	},


	setKey : function (key, value) {
		if (key == 'lastName' ) return this.setLastName(value);
		if (key == 'firstName') return this.setFirstName(value);
		if (key == 'company'  ) return this.setCompany(value);
		if (key == 'position' ) return this.setPosition(value);
		if (key == 'mobile'   ) return this.setMobile(value);
		if (key == 'phone'    ) return this.setPhone(value);
		if (key == 'email'    ) return this.setEmail(value);
	},


	// save 
	save : function (key) {

		// set fields
		var json = {};
		json[field] = this.store[field];
		json.uuid = this.store.uuid;

		// save to server
		this._save(json);
		
		// // clear timer
		// if (this._saveTimer) clearTimeout(this._saveTimer);

		// // save changes on timeout
		// var that = this;
		// this._saveTimer = setTimeout(function () {
		
		// 	// find changes
		// 	var changes = that._findChanges();
			
		// 	// return if no changes
		// 	if (!changes) return;

		// 	that._save(changes);
		
		// }, 1000);       // don't save more than every goddamed second

	},

	_save : function (changes) {
		if (app.activeProject) changes.project = app.activeProject.getUuid(); // for edit_user access, may need project...
		app.api.updateUser(changes, function (err, result) {
			if (err) console.error('err', err);

			result = M.parse(result);

			if (result.error) {
				console.error('something went worng', result);
			} else {
				M.Mixin.Events.fire('userUpdated', { detail : {
					userId : changes.uuid
				}});
			}
		}.bind(this));
	},


	attachToApp : function () {
		app.Users[this.getUuid()] = this;
	},


	deleteUser : function (context, callback) {

		// delete in local store
		delete app.Users[this.store.uuid];

		// delete on server
		var uuid = this.store.uuid;
		var json = JSON.stringify({ 
			uuid : uuid
		});

		// post              path          data           callback        context of cb
		app.api.deleteUser(json, context[callback]);

	},

	// get functions
	getKey : function (key) {
		return this.store[key];
	},

	getFirstName : function () {
		return this.store.firstName;
	},

	getLastName : function () {
		return this.store.lastName;
	},

	getFullName : function () {
		return this.store.firstName + ' ' + this.store.lastName;
	},

	getName : function () {
		return this.getFullName();
	},

	getCompany : function () {
		return this.store.company;
	},

	getPosition : function () {
		return this.store.position;
	},

	getPhone : function () {
		return this.store.phone;
	},

	getMobile : function () {
		return this.store.mobile;
	},

	getEmail : function () {
		return this.store.local.email;
	},

	getToken : function () {
		return this.store.token;
	},

	getUuid : function () {
		return this.store.uuid;
	},



	// find changes to user.store for saving to server. works for two levels deep // todo: refactor, move to class?
	// hacky for realz! no good!!
	_findChanges : function () {
		var clone   = _.cloneDeep(this.store);
		var last    = _.cloneDeep(this.lastSaved);
		var changes = [];
		for (c in clone) {
			if (_.isObject(clone[c])) {
				var a = clone[c];
				for (b in a) {
					var d = a[b];
					equal = _.isEqual(clone[c][b], last[c][b]);
					if (!equal) {
						var change = {};
						change[c] = {};
						change[c][b] = clone[c][b];
						changes.push(change);
					}
				}
			} else {
				var equal = _.isEqual(clone[c], last[c]);
				if (!equal) {
					var change = {};
					change[c] = clone[c];
					changes.push(change);
				}
			}
		}
		if (changes.length == 0) return false; // return false if no changes
		var json = {};
		changes.forEach(function (change) {
			for (c in change) { json[c] = change[c]; }
		}, this);
		json.uuid = this.getUuid();
		this.lastSaved = _.cloneDeep(this.store);  // update lastSaved
		return json;
	},

	logout : function () {

		// confirm
		if (!confirm('Are you sure you want to log out?')) return;

		this._logout();
	},

	_logout : function () {
		
		// slack monitor
		// app.Socket.sendUserEvent({
		//     	user : app.Account.getFullName(),
		//     	event : 'logged out.',
		//     	description : '',
		//     	timestamp : Date.now()
		// });

		app.log('logout', {
			category : 'Users'
		});

		// redirect to logout
		window.location.href = app.options.servers.portal + 'logout';
	},

	isSuper : function () {
		return this.store.access.super;
		// return this.store.access.account_type == 'super';
	}

});