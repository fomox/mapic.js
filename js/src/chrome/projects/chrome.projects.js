M.Chrome.Projects = M.Chrome.extend({

	_ : 'projects', 

	options : {
		// defaultWidth : 220,
		defaultWidth : 283,
		publicTooltipWidth : 55,
		countInfoTooltipWidth : 155,
		labels : {
			private_project : 'Only invited users can access project',
			public_project : 'Anyone with a link can access project',
			download_on : 'Allowed to download data',
			download_off : 'Not allowed to download data',
			share_on : 'Allowed to invite others (as viewers)',
			share_off : 'Not allowed to invite others'
		}
	},

	_initialize : function () {

		// shortcut
		app.Chrome.Projects = this;

		// init container
		this._initContainer();

		// init content
		this._initContent();
	},

	_initContainer : function () {
		this._container = M.DomUtil.create('div', 'chrome-left-section chrome-projects', this.options.appendTo);
	},

	_allowCreateProject : function () {
		// only allow supers on EDI to create project
		if (window.location.host == 'maps.edinsights.no') {
			return app.Account.isSuper();
		}

		// otherwise allow like before
		return true;
	},
	
	_initContent : function () {

		// Create Container
		var projectsContainer = this._projectsContainer = M.DomUtil.create('div', 'chrome-left-container', this._container);

		// Create Title
		var title = 'Projects <span style="font-weight:400; font-size: 16px; color: gainsboro">(' + _.size(app.Projects) + ')</span> ';
		var projectsTitle = M.DomUtil.create('div', 'chrome-left-title projects-title', projectsContainer, title);

		// only allow for certain users
		if (this._allowCreateProject()) {

			// Create NEW button
			var newProjectButton = M.DomUtil.create('div', 'chrome-left-new-button', projectsContainer, '+');

			// new trigger
			M.DomEvent.on(newProjectButton, 'click', this._openNewProjectFullscreen, this);

		}

		// save divs
		this._projects = {};

		// sort by name
		var projects = _.sortBy(_.toArray(app.Projects), function (p) {
			return p.getName().toLowerCase();
		});

		// project wrapper
		this._projectsWrapper = M.DomUtil.create('div', 'chrome-left-project-wrapper', projectsContainer);

		// iterate projects, create item
		// _.each(projects, this._addProject, this);
		_.each(projects, this._addProject.bind(this));
	
	},


	_addProject : function (project) {

		// ensure right project
		project = app.Projects[project.getUuid()];

		// Create line with project
		var wrapper = M.DomUtil.create('div', 'chrome-left-itemcontainer chrome-project', this._projectsWrapper);
		var title = M.DomUtil.create('div', 'chrome-left-item-name', wrapper);

		title.id = 'title-'+ project.getUuid();
		// add edit button if project is editable
		if (project.isEditable()) {

			// edit trigger, todo: only if can edit
			var trigger = M.DomUtil.create('div', 'chrome-left-popup-trigger', wrapper);
		
			// edit trigger event
			M.DomEvent.on(trigger, 'click', this._openEditProjectFullscreen.bind(this, project), this);

			// add extra padding
			M.DomUtil.addClass(title, 'extra-padding-right');
		}


		var projectTitle = '';
		var tooltipText = '';
		var tooltipWidth = '';
		var usersNo;

		var editorsNo = _.size(project.store.access.edit);
		var readersNo = _.size(project.store.access.read);

		// if project is not created by self -> shared with the user
		if (project.store.createdBy != app.Account.getUuid()) {
			
			// get user
			var createdBy = project.store.createdByName;
			tooltipText = 'Shared with you by ' + createdBy;

			// set tooltip width
			var width = tooltipText.length * 7 + 'px';

			// set title + tooltip
			projectTitle += '<i class="project-icon fa fa-arrow-circle-right"><div class="absolute"><div class="project-tooltip" style="width:' + width + '">' + tooltipText + '</div></div></i>';
		}

		// add project name
		projectTitle += project.getName();


		// if public, add globe icon + tooltip
		if (project.isPublic()) {
			tooltipText = 'Public';
			tooltipWidth = this.options.publicTooltipWidth + 'px';
			
			projectTitle += '<i class="project-public-icon fa fa-globe"><div class="absolute"><div class="project-tooltip" style="width:' + tooltipWidth + '">' + tooltipText + '</div></div></i>';

			usersNo   = editorsNo + readersNo;

			if (project && project.isEditor() && project.getUuid()) {
			    tooltipText = 'Shared with ' + usersNo +  ' people.';
			    tooltipWidth = this.options.countInfoTooltipWidth + 'px';
				projectTitle += '<span class="user-counter" id="counter-' + project.getUuid() + '">' + '<div class="absolute"><div class="project-tooltip" style="width:' + tooltipWidth + '">' + tooltipText + '</div></div>' + usersNo + '</span>';
			}
		} else {
			usersNo   = editorsNo + readersNo;
			tooltipWidth = this.options.countInfoTooltipWidth + 'px';
			tooltipText = 'Shared with ' + usersNo +  ' people.';

			if (project && project.isEditor() && project.getUuid()) {
				projectTitle += '<span class="user-counter" id="counter-' + project.getUuid() + '">' + '<div class="absolute"><div class="project-tooltip" style="width:' + tooltipWidth + '">' + tooltipText + '</div></div>' + usersNo + '</span>';
			}

		}

		// set title
		title.innerHTML = projectTitle;

		// select project trigger
		M.DomEvent.on(wrapper, 'click', function () {
			project.selectProject();
			app.log('selected:project', {info : {project_name : project.getName()}});
		}, project);

		
		// remember
		this._projects[project.getUuid()] = {
			wrapper : wrapper,
			trigger : trigger
		}


	},

	_refreshContent : function () {

		// remove old, todo: check for mem leaks
		this._projectsContainer.innerHTML = '';
		M.DomUtil.remove(this._projectsContainer);

		// rebuild
		this._initContent();
	},


	_openNewProjectFullscreen : function (e) {

		// stop propagation
		M.DomEvent.stop(e);
		
		// create fullscreen
		this._fullscreen = new M.Fullscreen({
			title : '<span style="font-weight:200;">Create New Project</span>'
		});

		// clear invitations
		this._resetAccess();

		// shortcut
		var content = this._fullscreen._content;

		// create private/public label
		var private_toggle_label = M.DomUtil.create('div', 'private-public-label smooth-fullscreen-sub-label');

		// add private/public toggle
		var ppswitch = new M.button({
			id: 'public-switch',
			type: 'switch',
			isOn: this._access.options.isPublic,
			right: false,
			disabled: false,
			appendTo: content,
			fn: this._togglePrivatePublic.bind(this, private_toggle_label),
			className: 'public-private-project-switch'
		});

		// add label, default value
		content.appendChild(private_toggle_label);
		private_toggle_label.innerHTML = this._access.options.isPublic ? this.options.labels.public_project : this.options.labels.private_project;


		// project name
		var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', content, 'Project name');
		var name_input = M.DomUtil.create('input', 'smooth-input', content);
		name_input.setAttribute('placeholder', 'Enter name here');
		var name_error = M.DomUtil.create('div', 'smooth-fullscreen-error-label', content);


		var toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper', content);

		// create invite input
		this._createInviteUsersInput({
			type : 'read',
			label : 'Invite spectators to project <span class="optional-medium">(optional)</span>',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Spectators have read-only access to the project'
		});


		var share_toggle_wrapper = M.DomUtil.create('div', 'toggle-wrapper', toggles_wrapper);

		// add share, download toggle
		var share_toggle_label = M.DomUtil.create('div', 'small-toggle-label smooth-fullscreen-sub-label');

		// add private/public toggle
		ppswitch = new M.button({
			id 	     : 'share-switch',
			type 	     : 'switch',
			isOn 	     : true,
			right 	     : false,
			disabled     : false,
			appendTo     : share_toggle_wrapper,
			fn 	     : this._toggleShare.bind(this, share_toggle_label),
			className    : 'share-project-switch'
		});

		// add label, default value
		share_toggle_wrapper.appendChild(share_toggle_label);
		share_toggle_label.innerHTML = this.options.labels.share_on;



		var download_toggle_wrapper = M.DomUtil.create('div', 'toggle-wrapper', toggles_wrapper);

		// add share, download toggle
		var download_toggle_label = M.DomUtil.create('div', 'small-toggle-label smooth-fullscreen-sub-label');

		// add private/public toggle
		ppswitch = new M.button({
			id 	     : 'share-switch',
			type 	     : 'switch',
			isOn 	     : true,
			right 	     : false,
			disabled     : false,
			appendTo     : download_toggle_wrapper,
			fn 	     : this._toggleDownload.bind(this, download_toggle_label),
			className    : 'download-project-switch'
		});

		// add label, default value
		download_toggle_wrapper.appendChild(download_toggle_label);
		download_toggle_label.innerHTML = this.options.labels.download_on;

		toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper', content);
		

		// create invite input
		this._createInviteUsersInput({
			type : 'edit',
			label : 'Invite editors to project <span class="optional-medium">(optional)</span>',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Editors can edit the project'
		});


		// save button
		var saveBtn = M.DomUtil.create('div', 'smooth-fullscreen-save', content, 'Create');

		// pass inputs to triggers
		var options = {
			name_input : name_input,
			name_error : name_error
		};

		// save button trigger
		M.DomEvent.on(saveBtn, 'click', this._createProject.bind(this, options), this);

	},

	openShare : function () {

		// if editor, just go to edit
		// if spectator and project can't be shared, return
		// if spec and p can be shared, go to openShare()

		var project = app.activeProject;

		// just go to edit if editor
		if (project.isEditable()) {
			return this._openEditProjectFullscreen();
		}

		// spectator && not shareable, return
		if (!project.isShareable()) return;

		// spec and shareable
		if (project.isShareable()) {
			this._openShare();
		}

	},

	_openShare : function () {

		// set project
		var project = app.activeProject;

		// stop propagation
		// e && M.DomEvent.stop(e);
		
		// create fullscreen
		this._fullscreen = new M.Fullscreen({
			title : '<span style="font-weight:200;">Invite to</span> ' + project.getName(),
			closeCallback : this._resetAccess.bind(this)
		});

		// clear invitations
		this._resetAccess();

		// shortcut
		var content = this._fullscreen._content;


		var toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper', content);


		// create invite input
		this._createInviteUsersInput({
			type : 'read',
			label : 'Invite spectators to project',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Spectators have read-only access to the project',
			project : project,
			empty : true
		});


		// invite someone new?
		var invite_someone_wrapper = M.DomUtil.create('div', 'invite-someone-wrapper', content);
		var invite_someone_text = M.DomUtil.create('div', 'smooth-fullscreen-name-label add-message', invite_someone_wrapper, 'Want to invite someone else? Send them <a id="invite_someone_btn">an invite!</a>');
		var inviteSomeoneBtn = M.DomUtil.get('invite_someone_btn');

		M.DomEvent.on(inviteSomeoneBtn, 'click', function (e) {
			
			// close fullscreen
			this._fullscreen && this._fullscreen.close();

			// open invite fullscreen
			var u = app.Chrome.Left._tabs.users;
			u._openInvite();
			
			
		}, this);

		// trigger options
		var options = {
			// name_input : name_input,
			// name_error : name_error,
			project : project
		};

		// buttons wrapper
		var buttonsWrapper = M.DomUtil.create('div', 'smooth-fullscreen-buttons-wrapper', content);

		// save button
		var saveBtn = M.DomUtil.create('div', 'smooth-fullscreen-save', buttonsWrapper, 'Invite');
		M.DomEvent.on(saveBtn, 'click', this._addInvites.bind(this, options), this);

	},

	_addInvites : function () {

		var access = {
			read : []
		};

		this._access.read.forEach(function (v) {
			access.read.push(v.user.getUuid());
		});

		var project = app.activeProject;

		// set invitations
		project.addInvites(access);

		// close fullscreen
		this._fullscreen && this._fullscreen.close();

	},

	_openEditProjectFullscreen : function (project, e) {

		app.log('opened:project:edit');

		// set project
		project = project || app.activeProject;

		// stop propagation
		e && M.DomEvent.stop(e);
		
		// create fullscreen
		this._fullscreen = new M.Fullscreen({
			title : '<span style="font-weight:200;">Edit</span> ' + project.getName(),
			closeCallback : this._resetAccess.bind(this)
		});

		// clear invitations
		this._resetAccess();

		// shortcut
		var content = this._fullscreen._content;

		// create private/public label
		var private_toggle_label = M.DomUtil.create('div', 'private-public-label smooth-fullscreen-sub-label');

		// add private/public toggle
		var ppswitch = new M.button({
			id 	     : 'public-switch',
			type 	     : 'switch',
			isOn 	     : project.isPublic(),
			right 	     : false,
			disabled     : false,
			appendTo     : content,
			fn 	     : this._togglePrivatePublic.bind(this, private_toggle_label),
			className    : 'public-private-project-switch'
		});

		this._access.options.isPublic = project.isPublic();

		// add label, default value
		content.appendChild(private_toggle_label);
		private_toggle_label.innerHTML = project.isPublic() ? this.options.labels.public_project : this.options.labels.private_project;


		// create project name input
		var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label clearboth', content, 'Project name');
		var name_input = M.DomUtil.create('input', 'smooth-input', content);
		name_input.setAttribute('placeholder', 'Enter name here');
		name_input.value = project.getName();
		var name_error = M.DomUtil.create('div', 'smooth-fullscreen-error-label', content);

		// pretty wrapper
		var toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper', content);

		this._userShareWrapper = {
			read : toggles_wrapper
		};


		// create invite input
		this._createInviteUsersInput({
			type : 'read',
			label : 'Viewers',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Viewers have read-only access to the project',
			project : project
		});

		var share_toggle_wrapper = M.DomUtil.create('div', 'toggle-wrapper', toggles_wrapper);

		// add share, download toggle
		var share_toggle_label = M.DomUtil.create('div', 'small-toggle-label smooth-fullscreen-sub-label');

		// add private/public toggle
		var sswitch = new M.button({
			id 	     : 'share-switch',
			type 	     : 'switch',
			isOn 	     : project.isShareable(),
			right 	     : false,
			disabled     : false,
			appendTo     : share_toggle_wrapper,
			fn 	     : this._toggleShare.bind(this, share_toggle_label),
			className    : 'share-project-switch'
		});

		// add label, default value
		share_toggle_wrapper.appendChild(share_toggle_label);
		share_toggle_label.innerHTML = project.isShareable() ? this.options.labels.share_on : this.options.labels.share_off;

		this._access.options.share = project.isShareable();

		// add share, download toggle
		var download_toggle_wrapper = M.DomUtil.create('div', 'toggle-wrapper', toggles_wrapper);
		var download_toggle_label = M.DomUtil.create('div', 'small-toggle-label smooth-fullscreen-sub-label');
		var downloadEnabled = (project.isDownloadable() || project.isEditor());

		// add private/public toggle
		var dswitch = new M.button({
			id 	     : 'download-switch',
			type 	     : 'switch',
			isOn 	     : project.isDownloadable(),
			right 	     : false,
			disabled     : !downloadEnabled,
			appendTo     : download_toggle_wrapper,
			fn 	     : this._toggleDownload.bind(this, download_toggle_label),
			className    : 'download-project-switch'
		});

		// add label, default value
		download_toggle_wrapper.appendChild(download_toggle_label);
		download_toggle_label.innerHTML = project.isDownloadable() ? this.options.labels.download_on : this.options.labels.download_off;

		this._access.options.download = project.isDownloadable();

		toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper', content);

		this._userShareWrapper.edit = toggles_wrapper;

		// create invite input
		this._createInviteUsersInput({
			type : 'edit',
			label : 'Editors',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Editors can edit the project',
			project : project
		});

		// invite someone new?
		var invite_someone_wrapper = M.DomUtil.create('div', 'invite-someone-wrapper', content);
		var invite_someone_text = M.DomUtil.create('div', 'smooth-fullscreen-name-label add-message', invite_someone_wrapper, 'Want to invite someone else? Send them <a id="invite_someone_btn">an invite!</a>');
		var inviteSomeoneBtn = M.DomUtil.get('invite_someone_btn');

		M.DomEvent.on(inviteSomeoneBtn, 'click', function (e) {
			
			// close fullscreen
			this._fullscreen && this._fullscreen.close();

			// open invite fullscreen
			var u = app.Chrome.Left._tabs.users;
			u._openInvite();
			
			
		}, this);

		// trigger options
		var options = {
			name_input : name_input,
			name_error : name_error,
			project : project
		};

		// buttons wrapper
		var buttonsWrapper = M.DomUtil.create('div', 'smooth-fullscreen-buttons-wrapper', content);

		// save button
		var saveBtn = M.DomUtil.create('div', 'smooth-fullscreen-save', buttonsWrapper, 'Update');
		M.DomEvent.on(saveBtn, 'click', this._updateProject.bind(this, options), this);

		// add delete button only if access
		if (project.store.createdBy == app.Account.getUuid() || app.Account.isSuper()) {
			var delBtn = M.DomUtil.create('div', 'smooth-fullscreen-delete', buttonsWrapper, 'Delete');
			M.DomEvent.on(delBtn, 'click', this._deleteProject.bind(this, options), this);
		}
		
		// hide share if public
		if (project.isPublic()) {
			this._hideUserShare();
		} else {
			this._showUserShare();
		}
	},

	_hideUserShare : function () {
		M.DomUtil.addClass(this._userShareWrapper.read, 'displayNone');
	},

	_showUserShare : function () {
		M.DomUtil.removeClass(this._userShareWrapper.read, 'displayNone');
	},

	_toggleShare : function (toggle, e, isOn) {

		// set label
		toggle.innerHTML = isOn ? this.options.labels.share_on : this.options.labels.share_off;

		// save setting
		this._access.options.share = isOn;

	},

	_toggleDownload : function (toggle, e, isOn) {

		// set label
		toggle.innerHTML = isOn ? this.options.labels.download_on : this.options.labels.download_off;

		// save setting
		this._access.options.download = isOn;

	},

	_togglePrivatePublic : function (toggle, e, isPublic) {

		// set label
		toggle.innerHTML = isPublic ? this.options.labels.public_project : this.options.labels.private_project;

		// save setting
		this._access.options.isPublic = isPublic;

		if (isPublic) {
			this._hideUserShare();
			app.log('set_public:project', {info : {project_name : this._project.getName()}});
		} else {
			this._showUserShare();
			app.log('set_private:project', {info : {project_name : this._project.getName()}});
		}
	},

	_divs : {
		read : {},
		edit : {}
	},

	_checkedUsers : {
		read: {},
		edit: {}	
	},

	_list_item_containers : {
		read: [],
		edit: []
	},

	_onCloseFullscreen : function () {
		this._resetAccess();
	},

	_onUpdatedProjectAccess : function (options) {
		var tooltipText;
		var tooltipWidth;
		var editorsNo;
		var readersNo;
		var usersNo;

		if (options && options.detail && options.detail.projectId) {
			var project = app.Projects[options.detail.projectId];
			var title = M.DomUtil.get('title-' + options.detail.projectId);
			var projectTitle = '';

			// if project is not created by self -> shared with the user
			if (project.store.createdBy != app.Account.getUuid()) {
				
				// get user
				var createdBy = project.store.createdByName;

				tooltipText = 'Shared with you by ' + createdBy;
				// set tooltip width
				var width = tooltipText.length * 7 + 'px';

				// set title + tooltip
				projectTitle += '<i class="project-icon fa fa-arrow-circle-right"><div class="absolute"><div class="project-tooltip" style="width:' + width + '">' + tooltipText + '</div></div></i>';
			}

			// add project name
			projectTitle += project.getName();

			// if public, add globe icon + tooltip
			if (project.isPublic()) {
				tooltipText = 'Public';

				tooltipWidth = this.options.publicTooltipWidth + 'px';
				
				projectTitle += '<i class="project-public-icon fa fa-globe"><div class="absolute"><div class="project-tooltip" style="width:' + tooltipWidth + '">' + tooltipText + '</div></div></i>';
				editorsNo = project.store.access.edit.length;

				readersNo = project.store.access.read.length;
				usersNo   = editorsNo + readersNo;

				if (project && project.isEditor() && project.getUuid()) {
				    tooltipText = 'Shared with ' + usersNo +  ' people.';
				    tooltipWidth = this.options.countInfoTooltipWidth + 'px';
					projectTitle += '<span class="user-counter" id="counter-' + project.getUuid() + '">' + '<div class="absolute"><div class="project-tooltip" style="width:' + tooltipWidth + '">' + tooltipText + '</div></div>' + usersNo + '</span>';
				}
			} else {

				editorsNo = project.store.access.edit.length;
				readersNo = project.store.access.read.length;
				usersNo   = editorsNo + readersNo;

				tooltipWidth = this.options.countInfoTooltipWidth + 'px';
				tooltipText = 'Shared with ' + usersNo +  ' people.';

				if (project && project.isEditor() && project.getUuid()) {
					projectTitle += '<span class="user-counter" id="counter-' + project.getUuid() + '">' + '<div class="absolute"><div class="project-tooltip" style="width:' + tooltipWidth + '">' + tooltipText + '</div></div>' + usersNo + '</span>';
				}

			}

			// set title
			title.innerHTML = projectTitle;
		}
	},

	// todo: refactor into module, var userList = new M.Tools.UserList();
	_createInviteUsersInput : function (options) {

		// invite users
		var content = options.content || this._fullscreen._content;
		var container = this._fullscreen._container;
		var project = options.project;

		// label
		var invite_label = options.label;
		var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label', content, invite_label);

		// container
		var invite_container = M.DomUtil.create('div', 'invite-container', content);
		
		// sub-label
		var sublabel = M.DomUtil.create('div', 'smooth-fullscreen-sub-label', content, options.sublabel);

		var invite_inner = M.DomUtil.create('div', 'invite-inner', invite_container);
		var invite_input_container = M.DomUtil.create('div', 'invite-input-container', invite_inner);

		// input box
		var invite_input = M.DomUtil.create('input', 'invite-input-form', invite_input_container);

		// invite list
		var invite_list_container = M.DomUtil.create('div', 'invite-list-container', invite_container);
		var invite_list_inner = M.DomUtil.create('div', 'invite-list-inner', invite_list_container);

		// remember div
		this._divs[options.type].invite_list_container = invite_list_container;

		// for manual scrollbar (js)
		var monkey_scroll_bar = M.DomUtil.create('div', 'monkey-scroll-bar', invite_list_inner);
		
		// for holding list
		var monkey_scroll_hider = M.DomUtil.create('div', 'monkey-scroll-hider', invite_list_inner);
		var monkey_scroll_inner = M.DomUtil.create('div', 'monkey-scroll-inner', monkey_scroll_hider);
		var monkey_scroll_list = M.DomUtil.create('div', 'monkey-scroll-list', monkey_scroll_inner);

		// list of all users
		var allUsers = _.sortBy(_.toArray(app.Users), function (u) {
			return u.store.firstName;
		});
		var items = this._list_item_containers[options.type];
		
		function onKeyUp(e) {
			var filterUsers = [];
			var currentIsChecked = false;
			var key = event.which ? event.which : event.keyCode;

			if (key !== 40 && key !== 38 && key !== 13 && key !== 9) {
				_.forEach(items, function (_list_item_container, index) {
					var item_index = items[index];
					
					if (_list_item_container.user.getFullName().toLowerCase().indexOf(invite_input.value.toLowerCase()) === -1 || _.keys(this._checkedUsers[options.type]).indexOf(_list_item_container.user.getFullName()) !== -1) {
						item_index.list_item_container.style.display = 'none';
						item_index.list_item_container.style.backgroundColor = '';
						item_index.current = false;
					} else {
						item_index.list_item_container.style.display = 'block';
						if (!currentIsChecked) {
							item_index.list_item_container.style.backgroundColor = '#DEE7EF';	
							currentIsChecked = true;
							item_index.current = true;
						} else {
							item_index.list_item_container.style.backgroundColor = '';
							item_index.current = false;
						}
						filterUsers.push(_list_item_container);
					}
				}.bind(this));

				if (_.isEmpty(filterUsers)) {
					invite_list_container.style.display = 'none';
				} else {
					invite_list_container.style.display = 'block';
				}
			}
		}

		_.each(allUsers, function (user, index) {

			if (user.getUuid() == app.Account.getUuid()) {
				return;
			}

			// divs
			var list_item_container = M.DomUtil.create('div', 'monkey-scroll-list-item-container', monkey_scroll_list);
			var avatar_container = M.DomUtil.create('div', 'monkey-scroll-list-item-avatar-container', list_item_container);
			var avatar = M.DomUtil.create('div', 'monkey-scroll-list-item-avatar default-avatar', avatar_container);
			var name_container = M.DomUtil.create('div', 'monkey-scroll-list-item-name-container', list_item_container);
			var name_bold = M.DomUtil.create('div', 'monkey-scroll-list-item-name-bold', name_container);
			var name_subtle = M.DomUtil.create('div', 'monkey-scroll-list-item-name-subtle', name_container);
			
			// set name
			name_bold.innerHTML = user.getFullName();
			name_subtle.innerHTML = user.getEmail();

			if (index === 0) {
				list_item_container.style.backgroundColor = '#DEE7EF';
				items.push({
					user: user,
					list_item_container: list_item_container,
					current: true
				});
			} else {
				items.push({
					user: user,
					list_item_container: list_item_container,
					current: false
				});
			}

			// click event
			M.DomEvent.on(list_item_container, 'click', function () {

				// dont allow adding self (as editor) to read
				if (options.type == 'read' && user.getUuid() == app.Account.getUuid()) return;
				if (options.type == 'edit' && user.getUuid() == app.Account.getUuid()) return;

				// add selected user item to input box
				this._checkedUsers[options.type][user.getFullName()] = user;
				this._addUserAccessItem({
					input : invite_input,
					user : user,
					type : options.type,
					checkedUsers : this._checkedUsers[options.type],
					onKeyUp: onKeyUp.bind(this)
				});

				invite_input.value = '';
				onKeyUp.call(this);
			}, this);

			M.DomEvent.on(list_item_container, 'mouseenter', function () {
				_.forEach(items, function (_list_item_container) {
					if (_list_item_container.list_item_container != list_item_container) {
						_list_item_container.list_item_container.style.backgroundColor = '';
						_list_item_container.current = false;
					} else {
						_list_item_container.list_item_container.style.backgroundColor = '#DEE7EF';
						_list_item_container.current = true;
					}
				});

			}, this);

		}.bind(this));


		// events

		// input focus, show dropdown
		M.DomEvent.on(invite_input, 'focus', function () {
			this._closeInviteInputs();
			onKeyUp.call(this);
		}, this);

		// focus input on any click
		M.DomEvent.on(invite_input_container, 'click', function () {
			invite_input.focus();
		}, this);

		// input keyup
		M.DomEvent.on(invite_input, 'keydown', function (e) {

			// get which key
			var key = event.which ? event.which : event.keyCode;

			if (key === 38) {
				_.find(items, function (_list_item_container, index) {
					var showedItemIndexs = [];
					var nearestLessUnchecked = -1;

					_.forEach(items, function (item, index) {
						if (item.list_item_container.style.display === 'block') {
							showedItemIndexs.push(index);
						}
					});

					if (_list_item_container.current === true) {
						items[index].current = false;
						items[index].list_item_container.style.backgroundColor = '';

							if (index > 0 && items[(index - 1) % (items.length)] && items[(index - 1) % (items.length)].list_item_container.style.display === 'block') {
								items[(index - 1) % (items.length)].current = true;
								items[(index - 1) % (items.length)].list_item_container.style.backgroundColor = '#DEE7EF';
								return true;							
							} else if (index === 0 && items[items.length - 1] && items[items.length - 1].list_item_container.style.display === 'block') {
								items[items.length - 1].current = true;
								items[items.length - 1].list_item_container.style.backgroundColor = '#DEE7EF';
								return true;
							}

							_.find(showedItemIndexs, function (item, itemIndex) {
								if (item >= (index)) {
									nearestLessUnchecked = showedItemIndexs[itemIndex - 1];
									return true;
								}
								return false;
							});

							if (nearestLessUnchecked == undefined) {
								nearestLessUnchecked = -1;
							}

							if (nearestLessUnchecked < 0) {
								items[showedItemIndexs[showedItemIndexs.length - 1]].current = true;
								items[showedItemIndexs[showedItemIndexs.length - 1]].list_item_container.style.backgroundColor = '#DEE7EF';
							} else {
								items[nearestLessUnchecked].current = true;
								items[nearestLessUnchecked].list_item_container.style.backgroundColor = '#DEE7EF';
							}
							return true;
					}
					return false;
				});
			}

			if (key === 40 || key === 9) {
				if (key === 9) {
					M.DomEvent.stop(e);
				}

				_.find(items, function (_list_item_container, index) {
					var showedItemIndexs = [];
					var nearestMoreUnchecked = -1;

					_.forEach(items, function (item, index) {
						if (item.list_item_container.style.display === 'block') {
							showedItemIndexs.push(index);
						}
					});
					if (_list_item_container.current === true) {
						items[index].current = false;
						items[index].list_item_container.style.backgroundColor = '';

						if (items[(index + 1) % (items.length)].list_item_container.style.display === 'block') {
							items[(index + 1) % (items.length)].current = true;
							items[(index + 1) % (items.length)].list_item_container.style.backgroundColor = '#DEE7EF';
							return true;
						}

						_.find(showedItemIndexs, function (item, itemIndex) {
							if (item > (index)) {
								nearestMoreUnchecked = showedItemIndexs[itemIndex];
								return true;
							}
							return false;
						});

						if (nearestMoreUnchecked < 0) {
							items[showedItemIndexs[0]].current = true;
							items[showedItemIndexs[0]].list_item_container.style.backgroundColor = '#DEE7EF';
						} else {
							items[nearestMoreUnchecked].current = true;
							items[nearestMoreUnchecked].list_item_container.style.backgroundColor = '#DEE7EF';
						}
						return true;

					}
					return false;
				});
			}

			if (key === 13) {

				currentContainer = _.find(this._list_item_containers[options.type], function (_list_item_container) {
					return _list_item_container.current === true;
				});

				if (currentContainer && currentContainer.user) {
					if (options.type == 'read' && currentContainer.user.getUuid() == app.Account.getUuid()) return;

					this._checkedUsers[options.type][currentContainer.user.getFullName()] = currentContainer.user;
					this._addUserAccessItem({
						input : invite_input,
						user : currentContainer.user,
						type : options.type,
						checkedUsers : this._checkedUsers[options.type],
						onKeyUp: onKeyUp.bind(this)
					});

					invite_input.value = '';
					onKeyUp.call(this);
				}

			}

			// get string length
			var value = invite_input.value;
			var text_length = value.length;
			if (text_length <= 0) text_length = 1;

			// set width of input dynamically
			invite_input.style.width = 30 + (text_length * 20) + 'px';

			// backspace on empty field: delete added user
			if (key == 8 && value.length == 0 && this._access[options.type].length) {

				// get last user_uuid item 
				var last = _.last(this._access[options.type]);

				// dont allow adding self (as editor) to read
				if (options.type == 'edit' && last && last.user && last.user.getUuid() == app.Account.getUuid()) return;

				// remove last item
				var popped = this._access[options.type].pop();
				M.DomUtil.remove(popped.user_container);
				var item = _.find(_.keys(this._checkedUsers[options.type]), function (userName) {
					return userName == last.user.getFullName(); 
				});

				delete this._checkedUsers[options.type][item];

			}

			// enter: blur input
			if (key == 13 || key == 27) {
				invite_input.blur();
				invite_input.value = '';
				this._closeInviteInputs();
			}

		}, this);

		M.DomEvent.on(invite_input, 'keyup', onKeyUp.bind(this), this);

		// close dropdown on any click
		M.DomEvent.on(container, 'click', function (e) {

			// only if target == self
			var relevantTarget = 	e.target == container || 
						e.target == this._fullscreen._inner || 
						e.target == name || 
						e.target == this._fullscreen._content;

			if (relevantTarget) this._closeInviteInputs();

		}, this);

		if (project) {

			// add current access vars
			var projectAccess = project.getAccess();

			// add selected user item to input box
			if (projectAccess && projectAccess[options.type] && !options.empty) {

				// add selected user item to input box
				projectAccess[options.type].forEach(function(userUuid) {

					var user = app.Users[userUuid];

					// ensure user
					if (!user) return console.error('no such user: ', userUuid);

					this._checkedUsers[options.type][user.getFullName()] = user;
					this._addUserAccessItem({
						input : invite_input,
						user : user,
						checkedUsers : this._checkedUsers[options.type],
						type : options.type,
						onKeyUp: onKeyUp.bind(this)
					});
					
				}, this);
			}
			
			// hide by default
			invite_list_container.style.display = 'none';
			invite_input.blur();	
		}
		
	},

	_closeInviteInputs : function () {

		var container = this._divs.edit.invite_list_container;
		if (container) container.style.display = 'none';

		container = this._divs.read.invite_list_container;
		if (container) container.style.display = 'none';
	},

	_addUserAccessItem : function (options) {
		var invite_input = options.input;
		var user = options.user;

		// if user deleted. todo: clean up deleting
		if (!user) return;

		// focus input
		invite_input.focus();

		// don't add twice
		var existing = _.find(this._access[options.type], function (i) {
			return i.user == user;
		});

		if (existing) return;

		// insert user box in input area
		var user_container = M.DomUtil.create('div', 'mini-user-container');
		var user_inner = M.DomUtil.create('div', 'mini-user-inner', user_container);
		var user_avatar = M.DomUtil.create('div', 'mini-user-avatar default-avatar', user_inner);
		var user_name = M.DomUtil.create('div', 'mini-user-name', user_inner, user.getFullName());
		var user_kill = M.DomUtil.create('div', 'mini-user-kill', user_inner, 'x');

		// insert before input
		var invite_input_container = invite_input.parentNode;
		invite_input_container.insertBefore(user_container, invite_input);


		// dont allow deleting of self
		if (user.getUuid() != app.Account.getUuid()) {

			// click event (kill)
			M.DomEvent.on(user_container, 'click', function () {
				
				// remove div
				M.DomUtil.remove(user_container);

				app.log('removed:access:' + options.type, {
					info : {
						project_name : this._project.getName(),
						user : user.getName()
					}
				});
				
				// remove from array
				_.remove(this._access[options.type], function (i) {
					return i.user == user;
				});

				delete options.checkedUsers[user.getFullName()];
				options.onKeyUp.call(this);
			}.bind(this));

		} else {

			// add special color to self
			M.DomUtil.addClass(user_container, 'itsme');

		}

		// add to array
		this._access[options.type].push({
			user : user,
			user_container : user_container
		});

		app.log('added:access:' + options.type, {
			info : {
				project_name : this._project.getName(),
				user : user.getName()
			}
		})

		// remove from other list if active there
		var otherType = (options.type == 'edit') ? 'read' : 'edit';
		existing = _.find(this._access[otherType], function (i) {
			return i.user == user;
		});

		if (existing) {

			// remove div
			M.DomUtil.remove(existing.user_container);
			
			var item = _.find(_.keys(this._checkedUsers[otherType]), function (userName) {
				return userName == user.getFullName(); 
			});

			delete this._checkedUsers[otherType][item];
			
			// remove from array
			_.remove(this._access[otherType], function (i) {
				return i == existing;
			});
		}

	},

	_deleteProject : function (options) {

		var project = options.project;
		var project_name = project.getName();

		// confirm
		var answer = confirm('Are you sure you want to delete project ' + project_name + '? This action cannot be undone!');
		if (!answer) return;

		// delete
		project._delete(); // fires projectDeleted
		project = null;
		this._activeProject = null;

		// close fullscreen
		this._fullscreen && this._fullscreen.close();

		app.log('deleted:project', {info : {project_name : project_name}});

	},

	_updateProject : function (options) {

		// get name
		var projectName = options.name_input.value;
		var project = options.project;

		if(window.testMode) return true;

		// clean invitations array
		var access = {
			edit : [],
			read : [],
			options : {
				share : this._access.options.share,
				download : this._access.options.download,
				isPublic : this._access.options.isPublic
			}
		};


		this._access.edit.forEach(function (i) {
			access.edit.push(i.user.getUuid());
		}, this);
		this._access.read.forEach(function (i) {
			access.read.push(i.user.getUuid());
		}, this);

		
		// missing data
		if (!projectName) {

			// set error message
			options.name_error.innerHTML = 'Please enter a project name';
			
			// done here
			return;
		}

		// slack
		this._logUpdate({
			access : access,
			project : project,
			projectName : projectName
		});


		// reset
		this._resetAccess();

		// get available slug
		app.api.getAvailableSlug({
			project_name : projectName,
			created_by_username : project.getCreatedByUsername()
		}, function (err, response) {
			if (err) return console.error('Couldnt get slug!', err, response);

			console.log('getAvailableSlug', err, response);

			var result = M.parse(response);

			// set project name
			project.setName(projectName);

			// set project slug
			project.setSlug(result.slug);

			// set invitations
			project.setAccess(access);

		});

		// // check if slug is available
		// project.getAvailableSlug(projectName, function (err, response) {
		// 	if (err) return console.error('Couldnt get slug!', err, response);
		// 	// project.checkAvailableSlug(projectName, function (resp) {

		// 	// console.log("---" , resp);
		// 	// if(resp && resp.uniqueSlug){
		// 		// set project name
		// 		project.setName(projectName);

		// 		//set Project Slug
		// 		project.setSlug(response.slug);
		
		// 	// } else{
		// 		// alert("Slug is not available!");
		// 	// }			
		// });
		
		// set invitations
		// project.setAccess(access);

		// add project to list
		//this._refreshContent();

		// close fullscreen
		//this._fullscreen.close();

		// select project
		//project.selectProject();
	},

	_logUpdate : function (options) {

		if(window.testMode) return true;

		var access = options.access;
		var project = options.project;
		var projectName = options.projectName;

		var description = '';
		if (projectName != project.getTitle()) {
			description += ': changed name to ' + projectName;
		}

		var readDelta = _.difference(access.read, this._access.read);
		if (readDelta.length) {
			description += ', added ' + readDelta.length + ' readers';
		}

		var editDelta = _.difference(access.edit, this._access.edit);
		if (editDelta.length) {
			description += ', added ' + editDelta.length + ' editors';
		}

		// send event
		app.log('updated:project', {
		    	info : {
		    		description: description,
		    		project_name : project.getName(),
		    	},
		    	category : 'project'
		});
	},

	_resetAccess : function () {
		this._access = {
			read : [],
			edit : [],
			options : {
				share : true,
				download : true,
				isPublic : false
			}
		};
	},
	
	_createProject : function (parameters) {

		// prevent double clicks
		if (this._creatingProject) return;
		this._creatingProject = true;

		// get name
		var projectName = parameters.name_input.value;

		// missing data
		if (!projectName) {

			// set error message
			parameters.name_error.innerHTML = 'Please enter a project name';

			app.log('error:project:tried_to_create_with_no_name');

			// done here
			return;
		}

		var testCallback = arguments[arguments.length - 1];
		if (typeof testCallback === 'function') {
			return testCallback(true);
		}

		// clean invitations array
		var access = {
			edit : [],
			read : [],
			options : {
				share : this._access.options.share,
				download : this._access.options.download,
				isPublic : this._access.options.isPublic
			}
		};
		this._access.edit.forEach(function (i) {
			access.edit.push(i.user.getUuid());
		}, this);
		this._access.read.forEach(function (i) {
			access.read.push(i.user.getUuid());
		}, this);

		// reset
		this._resetAccess();

		// create project object
		var store = {
			name 		: projectName,
			description 	: 'Project description',
			createdByName 	: app.Account.getName(),
			access 		: access
		};

		// set create options
		var options = {
			store : store,
			callback : this._projectCreated,
			context : this
		};

		// create new project with options, and save
		var project = new M.Model.Project(store);

		// create project on server
		project.create(options, function (err, json) {
			var result = M.parse(json);
			var error  = result.error;
			var store  = result.project;

			// return error
			if (error) {
				this._creatingProject = false;
				this._fullscreen && this._fullscreen.close();
				return app.feedback.setError({
					title : 'There was an error creating new project!',
					description : error.message
				});
			}
				
			// add to global store
			app.Projects[store.uuid] = project;

			// update project store
			project.setNewStore(store);

			// add project to list
			this._refreshContent();

			// close fullscreen
			this._fullscreen && this._fullscreen.close();

			// select project
			project.selectProject();

			// set access
			project.setAccess(access);

			// release
			this._creatingProject = false;

			// analytics
			app.log('created:project', {info : {project_name : project.getName()}});


		});

	},

	// fired on projectSelected
	_refresh : function () {
		if (!this._project) return;

		var wrapper;
		// remove old highligting
		if (this._activeProject) {
			wrapper = this._projects[this._activeProject.getUuid()].wrapper;
			M.DomUtil.removeClass(wrapper, 'active-project');
		}

		// highlight project
		wrapper = this._projects[this._project.getUuid()].wrapper;
		M.DomUtil.addClass(wrapper, 'active-project');

		// remember last
		this._activeProject = this._project;
	},

	_onProjectDeleted : function (e) {
		
		if (!e.detail.projectUuid) return;

		// add project to list
		this._refreshContent();

		// select random project 
		app.Controller.openFirstProject();
		
	},

	_onProjectChanged : function (e) {
		if(window.testMode) return;

		var project = app.Projects[e.detail.projectUuid];
		
		// add project to list
		this._refreshContent();

		// close fullscreen
		this._fullscreen && this._fullscreen.close();

		// select project
		project.selectProject();
	},

	_onLayerAdded : function (options) {
	},
	
	_onFileDeleted : function () {
	},

	_onLayerDeleted : function () {
	},

	_onLayerEdited : function () {
	},

	_registerButton : function () {
	},

	_togglePane : function () {

		console.error('deprecated?');

		// right chrome
		var chrome = this.options.chrome;

		// open/close
		this._isOpen ? chrome.close(this) : chrome.open(this); // pass this tab

	},

	_show : function () {
		this._container.style.display = 'block';
		this._isOpen = true;
	},

	_hide : function () {
		this._container.style.display = 'none';
		this._isOpen = false;
	},

	onOpened : function () {
	},

	onClosed : function () {
	},

	_addEvents : function () {
	},

	_removeEvents : function () {
	},

	_onWindowResize : function () {
	},

	getDimensions : function () {
		return {
			width : this.options.defaultWidth,
			height : this._container.offsetHeight
		};
	}

});