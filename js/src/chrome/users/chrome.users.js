M.Chrome.Users = M.Chrome.extend({

	_ : 'users', 

	options : {
		defaultWidth : 400
	},

	_initialize : function () {

		// init container
		this._initContainer();

		// init content
		this._initContent();
	},

	_initContainer : function () {
		this._container = M.DomUtil.create('div', 'chrome-left-section chrome-users', this.options.appendTo);
	},
	
	_initContent : function () {

		var usersContainer = M.DomUtil.create('div', 'chrome-left-container contacts', this._container);
		var usersTitle = M.DomUtil.create('div', 'chrome-left-title users-title', usersContainer, 'Contacts');
		var users = this.users = app.Users;

		// Define D3 container
		this.D3container = d3.select(usersContainer);
		
		this.openUserCard = false;

		// Init user list etc.
		this._refresh();

		// add invite
		this._inviteButton = M.DomUtil.create('div', 'chrome-left-invite-users', this._container, '+ Invite People');
		M.DomEvent.on(this._inviteButton, 'click', this._openInvite, this);

	},

	_createEmailInput : function (content) {

		var content = this._emailsWrapper;
		// email and + button

		var options = {
			label : 'Email Address',
			sublabel : 'email'
		};

		// label
		var invite_label = options.label;
		var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label invite-emails', content, invite_label);
		
		// container
		var invite_container = M.DomUtil.create('div', 'invite-container narrow', content);
		
		var invite_inner = M.DomUtil.create('div', 'invite-inner', invite_container);
		var invite_input_container = M.DomUtil.create('div', 'invite-input-container', invite_inner);

		// input box
		var invite_input = M.DomUtil.create('input', 'invite-email-input-form', invite_input_container);
		invite_input.setAttribute('placeholder', 'name@domain.com');
		var invite_error = M.DomUtil.create('div', 'smooth-fullscreen-error-label', content);

		// remember
		this._emails.push({
			invite_input : invite_input,
			invite_error : invite_error
		});

	},

	_emails : [],

	_openInvite : function (e) {

		// stop propagation
		e && M.DomEvent.stop(e);
		
		// create fullscreen
		this._fullscreen = new M.Fullscreen({
			title : '<span style="font-weight:200;">Invite people to Mapic</span>',
			innerClassName : 'smooth-fullscreen-inner invite'
		});

		// clear invitations
		this._access = {
			edit : [],
			read : []
		};
		this._emails = [];

		// shortcut
		var content = this._fullscreen._content;

		// personlized message
		var linkText = M.DomUtil.create('div', 'smooth-fullscreen-link-label', content, '<a id="share-link"><i class="fa fa-share-alt"></i> Get shareable link</a>');

		// emails wrapper
		this._emailsWrapper = M.DomUtil.create('div', 'invite-emails-wrapper', content);

		// create email input
		this._createEmailInput();

		// add another + button
		var addAnotherWrapper = M.DomUtil.create('div', 'invite-add-another-wrapper', content);
		var addAnotherBtn = M.DomUtil.create('div', 'smooth-fullscreen-name-label add-another-email', addAnotherWrapper, '+ Add another');
		M.DomEvent.on(addAnotherBtn, 'click', this._createEmailInput, this);

		// personlized message
		var emailMessageWrap = M.DomUtil.create('div', 'invite-email-message-wrap', content);
		var messageText = M.DomUtil.create('div', 'smooth-fullscreen-name-label add-message', emailMessageWrap, 'Make your invite more personal by adding a <a id="custom_message_btn">custom message</a>');
		var messageBtn = M.DomUtil.get('custom_message_btn');
		var messageBoxWrap = M.DomUtil.create('div', 'invite-custom-message-wrapper', emailMessageWrap);
		var messageBoxLabel = M.DomUtil.create('div', 'invite-custom-message-wrapper-label', messageBoxWrap, 'Custom Message'); 
		this._customMessage = M.DomUtil.create('textarea', 'invite-custom-message-wrapper-textarea', messageBoxWrap); 

		// event
		M.DomEvent.on(messageBtn, 'click', function () {
			M.DomUtil.addClass(emailMessageWrap, 'hideme');
			M.DomUtil.addClass(messageBoxWrap, 'showme');
			this._customMessage.focus();
		}, this);

		var toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper', content);

		// create invite input for projects
		this._createInviteInput({
			type : 'read',
			label : 'Invite people to view these projects <span class="optional-medium invite">(optional)</span>',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Users will get read-only access to these projects'
		});

		// create invite input
		this._createInviteInput({
			type : 'edit',
			label : 'Invite people to edit these projects <span class="optional-medium invite">(optional)</span>',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Users will get full edit access to these projects'
		});


		// save button
		var saveBtn = M.DomUtil.create('div', 'smooth-fullscreen-save invite', content, 'Send Invites');
		var save_message = M.DomUtil.create('div', 'invite-success-message', content, '');

		// save button trigger
		M.DomEvent.on(saveBtn, 'click', this._sendInvites, this);
		M.DomEvent.on(linkText, 'click', this._openLinkShare, this);

	},

	_openLinkShare : function (e) {

		// close prev fullscreen
		this._fullscreen.close();

		// stop propagation
		e && M.DomEvent.stop(e);
		
		// create fullscreen
		this._fullscreen = new M.Fullscreen({
			title : '<span style="font-weight:200;">Invite people to Systemapic</span>',
			innerClassName : 'smooth-fullscreen-inner invite'
		});

		// clear invitations
		this._access = {
			edit : [],
			read : []
		};


		// shortcut
		var content = this._fullscreen._content;

		// emails wrapper
		this._emailsWrapper = M.DomUtil.create('div', 'invite-emails-wrapper', content);

		// label
		var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label invite-emails', content, 'Share this link');
		
		// input box
		var invite_container = M.DomUtil.create('div', 'invite-container narrow', content);
		var invite_inner = M.DomUtil.create('div', 'invite-inner', invite_container);
		var invite_input_container = M.DomUtil.create('div', 'invite-input-container', invite_inner);
		this._shareLinkInput = M.DomUtil.create('input', 'invite-email-input-form', invite_input_container);
		this._shareLinkInput.value = app.options.servers.portal + 'invite';
		this._inviteFeedback = M.DomUtil.create('div', 'smooth-fullscreen-feedback-label', content);

		var clipboardWrapper = M.DomUtil.create('div', 'clipboard-wrapper', invite_input_container);
		var clipboardBtn = M.DomUtil.create('div', 'clipboard-button', clipboardWrapper);
		clipboardBtn.innerHTML = '<i class="fa fa-clipboard"></i>';	

		// clipboard events
		M.DomEvent.on(clipboardWrapper, 'mousedown', this._removeClipFeedback, this);
		M.DomEvent.on(clipboardWrapper, 'mouseup', this._copypasted, this);

		var toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper', content);

		// create invite input for projects
		var readInput = this._createInviteInput({
			type : 'read',
			label : 'Invite people to view these projects <span class="optional-medium invite">(optional)</span>',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Users will get read-only access to these projects',
			trigger : this._addedProject.bind(this)
		});

		// create invite input
		var editInput = this._createInviteInput({
			type : 'edit',
			label : 'Invite people to edit these projects <span class="optional-medium invite">(optional)</span>',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'Users will get full edit access to these projects',
			trigger : this._addedProject.bind(this)
		});

		// save button
		var closeBtn = M.DomUtil.create('div', 'smooth-fullscreen-save invite', content, 'Close');

		// select text on focus
		M.DomEvent.on(this._shareLinkInput, 'focus click', function () {
			this._shareLinkInput.select();
		}, this);

		// save button trigger
		M.DomEvent.on(closeBtn, 'click', this._fullscreen.close.bind(this._fullscreen), this);

		// add current project to READ
		this._checkedProjects['read'][app.activeProject.getTitle()] = app.activeProject;
		this._addAccessItem({
			input : readInput,
			project : app.activeProject,
			type : 'read',
			trigger : false,
			checkedProjects : this._checkedProjects['read']
		});

		// close inputs
		this._closeInviteInputs();

		// create default link
		this._createShareableInvite();
	},

	_copypasted : function () {
		this._shareLinkInput.focus();
		this._shareLinkInput.select();
		var copied = document.execCommand('copy');
		var text = copied ? 'Link copied to the clipboard!' : 'Your browser doesn\'t support this. Please copy manually.';
		this._setClipFeedback(text);
	},

	_setClipFeedback : function (text) {
		this._inviteFeedback.innerHTML = text;
		this._inviteFeedback.style.opacity = 1;
	},

	_removeClipFeedback : function () {
		this._inviteFeedback.innerHTML = '';
		this._inviteFeedback.style.opacity = 0;
	},

	_addedProject : function (options) {
		this._createShareableInvite();
		this._removeClipFeedback();
	},

	_createShareableInvite : function () {

		var access = {
			edit : [],
			read: []
		};

		this._access.read.forEach(function (r) {
			access.read.push(r.project.getUuid());
		});
		this._access.edit.forEach(function (e) {
			access.edit.push(e.project.getUuid());
		});

		// this._access[options.type]
		var options = {
			access : access,
			user : app.Account.getUuid()
		};

		console.log('options', options);

		// create share link
		app.api.inviteLink(options, function (err, response) {
			if (err) {
				return app.feedback.setError({
					title : 'Something went wrong',
					description : err
				});
			}

			this._shareLinkInput.value = response;
		}.bind(this));
	},

	// icon on user
	_inviteToProject : function (user, e) {

		// stop propagation
		e && M.DomEvent.stop(e);
		
		// create fullscreen
		this._fullscreen = new M.Fullscreen({
			title : '<span style="font-weight:200;">Invite ' + user.getFullName() + ' to projects</span>',
			innerClassName : 'smooth-fullscreen-inner invite'
		});

		// clear invitations
		this._access = {
			edit : [],
			read : []
		};

		// shortcut
		var content = this._fullscreen._content;

		var toggles_wrapper = M.DomUtil.create('div', 'toggles-wrapper', content);

		// create invite input for projects
		this._createInviteInput({
			type : 'read',
			label : 'Invite ' + user.getFullName() + ' to view these projects',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'The user will get read-only access to these project'
		});

		// create invite input
		this._createInviteInput({
			type : 'edit',
			label : 'Invite ' + user.getFullName() + ' to edit these projects',
			content : toggles_wrapper,
			container : this._fullscreen._inner,
			sublabel : 'The user will get full edit access to these project'
		});


		// save button
		var saveBtn = M.DomUtil.create('div', 'smooth-fullscreen-save invite', content, 'Invite');
		var save_message = M.DomUtil.create('div', 'invite-success-message', content, '');
		M.DomEvent.on(saveBtn, 'click', this._updateInvites, this);

		// remember user
		this._access.user = user;
	},

	_updateInvites : function () {

		var reads = []; 
		var edits = [];
		var user = this._access.user;
		var read = this._access.read;
		var edit = this._access.edit;

		this._access.read.forEach(function (r) {
			reads.push(r.project.getUuid());
		});
		this._access.edit.forEach(function (e) {
			edits.push(e.project.getUuid());
		});

		// invite
		user.inviteToProjects({
			read : reads,
			edit : edits
		});

		// close
		this._fullscreen.close();
	
	},

	_divs : {
		read : {},
		edit : {},
		email : {}
	},

	_checkedProjects : {
		read: {},
		edit: {}	
	},

	_list_item_containers : {
		read: [],
		edit: []
	},

	_sendInvites : function (e) {

		var emails = [];

		this._emails.forEach(function (divObj, i) {
			var invite_input = divObj.invite_input;

			var email_value = invite_input.value;

			if (!email_value.length && i == 0) {
				var invite_error = divObj.invite_error;
				invite_error.innerHTML = 'Please enter an email address';
				return;
			}

			if (email_value.length) emails.push(email_value);
		});
		
		if (!emails.length) return;

		var customMessage = this._customMessage.value.replace(/\n/g, '<br>');

		var access = {
			edit : [],
			read : []
		};

		this._access.edit.forEach(function (p) {
			access.edit.push(p.project.getUuid());
		});

		this._access.read.forEach(function (p) {
			access.read.push(p.project.getUuid());
		});

		var options = {
			emails : emails,
			customMessage : customMessage,
			access : access
		};
		
		var callback = typeof arguments[arguments.length - 1] === 'function' ? arguments[arguments.length - 1] : this._sentInvites.bind(this, e.target);
				
		// send to server
		//app.api.userInvite(options, this._sentInvites.bind(this, e.target));
		app.api.userInvite(options, callback );

		// logs
		this._logInvites(options);

		// clear old
		this._emails = [];

	},

	// slack, analytics
	_logInvites : function (options) {

		//if(window.testMode)	return;

		var read = [];
		var edit = [];
		var description = '';

		options.access.read.forEach(function (p) {
			read.push(app.Projects[p].getTitle());
		});
		options.access.edit.forEach(function (p) {
			edit.push(app.Projects[p].getTitle());
		});

		if (read.length) {
			description += 'to read `' + read.join(', ') + '`';
		}
		if (read.length && edit.length) {
			description += 'and edit `' + edit.join(', ') + '`';
		}
		if (!read.length && edit.length) {
			description += 'to edit `' + edit.join(', ') + '`';
		}

		// send event
		// app.Socket.sendUserEvent({
		app.log('invited', {
				info : {
					users : options.emails.join(', '),
					category : 'Users'
				}
		});
	},

	_sentInvites : function (saveBtn, b, c) {

		// close
		this._fullscreen.close();

		// set feedback 
		app.feedback.setMessage({
			title : 'Invites sent!'
		});
	},

	_onCloseFullscreen : function () {
		this._checkedProjects = {
			read: {},
			edit: {}
		};
		this._list_item_containers = {
			read: [],
			edit: []
		};
	},

	_createInviteInput : function (options) {

		// var me = this;
		// invite users
		var content = options.content || this._fullscreen._content;
		var container = this._fullscreen._container;

		// label
		var invite_label = options.label;
		var name = M.DomUtil.create('div', 'smooth-fullscreen-name-label invite', content, invite_label);
		
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

		// list of all projects, sort alphabetically
		var allProjects = _.sortBy(_.toArray(app.Projects), function (u) {
			return u.getTitle().toLowerCase();
		});
		var items = this._list_item_containers[options.type];

		function onKeyUp(e) {
			var filterProjects = [];
			var currentIsChecked = false;
			var key = event.which ? event.which : event.keyCode;

			if (key !== 40 && key !== 38 && key !== 13 && key !== 9) {
				_.forEach(items, function (_list_item_container, index) {
					var item_index = items[index];
					
					if (_list_item_container.project.getTitle().toLowerCase().indexOf(invite_input.value.toLowerCase()) === -1 
						|| _.keys(this._checkedProjects[options.type]).indexOf(_list_item_container.project.getTitle()) !== -1) {
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
						filterProjects.push(_list_item_container);
					}
				}.bind(this));

				if (_.isEmpty(filterProjects)) {
					invite_list_container.style.display = 'none';
				} else {
					invite_list_container.style.display = 'block';
				}
			}
		}

		_.each(allProjects, function (project, index) {

			// get access
			var access = project.getAccess();
			var isEditor = project.isEditor();
			var isSpectator = project.isSpectator();
			var isShareable = project.isShareable();

			// dont allow spectators with no share access
			if (options.type == 'read' && isSpectator && !isShareable) return;
			
			// dont allow spectators to give edit access
			if (options.type == 'edit' && isSpectator) return;

			// divs
			var list_item_container = M.DomUtil.create('div', 'monkey-scroll-list-item-container project', monkey_scroll_list);
			var avatar_container = M.DomUtil.create('div', 'monkey-scroll-list-item-avatar-container', list_item_container);
			var avatar = M.DomUtil.create('div', 'monkey-scroll-list-item-avatar project', avatar_container, '<i class="project fa fa-map-o"></i>');
			var name_container = M.DomUtil.create('div', 'monkey-scroll-list-item-name-container project', list_item_container);
			var name_bold = M.DomUtil.create('div', 'monkey-scroll-list-item-name-bold project', name_container);

			// set name
			name_bold.innerHTML = project.getTitle();

			if (index === 0) {
				list_item_container.style.backgroundColor = '#DEE7EF';
				items.push({
					project: project,
					list_item_container: list_item_container,
					current: true
				});
			} else {
				items.push({
					project: project,
					list_item_container: list_item_container,
					current: false
				});
			}

			// click event
			M.DomEvent.on(list_item_container, 'click', function () {

				this._checkedProjects[options.type][project.getTitle()] = project;
				// add selected project item to input box
				this._addAccessItem({
					input : invite_input,
					project : project,
					type : options.type,
					trigger : options.trigger,
					checkedProjects : this._checkedProjects[options.type],
					onKeyUp: onKeyUp.bind(this)
				});

				// optional callback
				if (options.trigger) {
					options.trigger({
						project : project
					});
				}

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

				currentContainer = _.find(this._list_item_containers[options.type], function (_list_item_container, index) {
					return _list_item_container.current === true;
				});

				if (currentContainer && currentContainer.project) {
					this._checkedProjects[options.type][currentContainer.project.getTitle()] = currentContainer.project;
					this._addAccessItem({
						input : invite_input,
						project : currentContainer.project,
						type : options.type,
						trigger : options.trigger,
						checkedProjects : this._checkedProjects[options.type],
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

				// remove last item
				var last = _.last(this._access[options.type]);
				var popped = this._access[options.type].pop();
				M.DomUtil.remove(popped.user_container);
				var item = _.find(_.keys(this._checkedProjects[options.type]), function (projectTitle) {
					return projectTitle == last.project.getTitle();
				});
				delete this._checkedProjects[options.type][item];

				// optional callback
				if (options.trigger) {
					options.trigger({
						project : false
					});
				}
			}

			// enter: blur input
			if (key == 13 || key == 27) {
				invite_input.blur();
				invite_input.value = '';
				this._closeInviteInputs();
			}

		}, this);

		M.DomEvent.on(invite_input, 'keyup', onKeyUp, this);

		// close dropdown on any click
		M.DomEvent.on(container, 'click', function (e) {

			// only if target == self
			var relevantTarget = 	e.target == container || 
						e.target == this._fullscreen._inner || 
						e.target == name || 
						e.target == this._fullscreen._content;

			// close 
			if (relevantTarget) this._closeInviteInputs();

		},this);

		return invite_input;
	},

	_closeInviteInputs : function () {

		var container = this._divs.edit.invite_list_container;
		if (container) container.style.display = 'none';

		container = this._divs.read.invite_list_container;
		if (container) container.style.display = 'none';
	},

	_addAccessItem : function (options) {
		var invite_input = options.input;
		var project = options.project;

		if (!project) {
			return;
		}
		// focus input
		invite_input.focus();

		// don't add twice
		var existing = _.find(this._access[options.type], function (i) {
			return i.project == project;
		});
		if (existing) return;

		// insert project box in input area
		var user_container = M.DomUtil.create('div', 'mini-user-container');
		var user_inner = M.DomUtil.create('div', 'mini-user-inner', user_container);
		var user_avatar = M.DomUtil.create('div', 'mini-project-avatar', user_inner, '<i class="fa fa-map"></i>');
		var user_name = M.DomUtil.create('div', 'mini-user-name', user_inner, project.getTitle());
		var user_kill = M.DomUtil.create('div', 'mini-user-kill', user_inner, 'x');

		// insert before input
		var invite_input_container = invite_input.parentNode;
		invite_input_container.insertBefore(user_container, invite_input);

		// click event (kill)
		M.DomEvent.on(user_container, 'click', function () {
			
			// remove div
			M.DomUtil.remove(user_container);
			
			// remove from array
			_.remove(this._access[options.type], function (i) {
				return i.project == project;
			});
			delete options.checkedProjects[project.getTitle()];
			// optional callback
			if (options.trigger) {
				options.trigger({
					project : false
				});
			}
			options.onKeyUp.call(this);
		}, this);

		// add to array
		this._access[options.type].push({
			project : project,
			user_container : user_container
		});

		// remove from other list if active there
		var otherType = (options.type == 'edit') ? 'read' : 'edit';
		existing = _.find(this._access[otherType], function (i) {
			return i.project == project;
		});

		if (existing) {

			// remove div
			M.DomUtil.remove(existing.user_container);
			
			var item = _.find(_.keys(this._checkedProjects[otherType]), function (projectTitle) {
				return projectTitle == project.getTitle(); 
			});

			delete this._checkedProjects[otherType][item];
			
			// remove from array
			_.remove(this._access[otherType], function (i) {
				return i == existing;
			});
		}

	},

	refreshUserList : function (data) {

		// if (this.openUserCard) this.addGhost();

		// BIND
		var eachUser = 
			this.D3container
			.selectAll('.chrome-user')
			.data(data);

		// ENTER
		eachUser
			.enter()
			.append('div')
			.classed('chrome-user', true)
			.classed('chrome-left-itemcontainer', true);

		// UPDATE
		eachUser
			.classed('contact', function (d) {
				return d.isContact();
			})
			.classed('project-contact', function (d) {
				return !d.isContact();
			});

		// EXIT
		eachUser
			.exit()
			.remove();


		// Add user name
		this.addUserName(eachUser);

		// Add action trigger (the [...] button)
		// this.addUserActionTrigger(eachUser);

		// Add user card
		// this.addUserCard(eachUser);

		// add icon to invite to projects
		this.create_inviteToProjectIcon(eachUser);			

		// add icon to add contact
		this.create_addContactIcon(eachUser);	

	
	},

	create_inviteToProjectIcon : function (parent) {

		// Bind
		var nameContent = 
			parent
			.selectAll('.contact-invite-icon')
			.data(function(d) {

				// if user is not a contact
				var a = d.isContact() ? [d] : [];
				return a;
			});

		// Enter
		nameContent
			.enter()
			.append('i')
			.classed('contact-invite-icon', true)
			.classed('fa', true)
			.classed('fa-arrow-circle-right', true);
			

		// Update
		nameContent
			.on('click', function (d) {

				// click on icon
				this._inviteToProject(d);

			}.bind(this));

		// add tooltip
		nameContent
			.html(function (d) {
				var tooltipWidth = 123 + 'px';
				var tooltipText = 'Invite to projects';
				var innerHTML = '<div class="absolute"><div class="project-tooltip contact-invite-tooltip" style="width:' + tooltipWidth + '">' + tooltipText + '</div></div>';
				return innerHTML;
			});
		// Exit
		nameContent
			.exit()
			.remove();

	},

	create_addContactIcon : function (parent) {
		
		// Bind
		var nameContent = 
			parent
			.selectAll('.contact-list-icon')
			.data(function(d) {
				// if user is not a contact
				var a = d.isContact() ? [] : [d];
				return a;
			});

		// Enter
		nameContent
			.enter()
			.append('i')
			.classed('contact-list-icon', true)
			.classed('fa', true)
			.classed('fa-user-plus', true);
			

		// Update
		nameContent
			.on('click', function (d) {
				// click on icon
				this._requestContact(d);
			}.bind(this));

		// add tooltip
		nameContent
			.html(function (d) {
				var tooltipWidth = 110 + 'px';
				var tooltipText = 'Add as contact';
				var innerHTML = '<div class="absolute"><div class="project-tooltip contact-add-tooltip" style="width:' + tooltipWidth + '">' + tooltipText + '</div></div>';
				return innerHTML;
			});
		// Exit
		nameContent
			.exit()
			.remove();
	},

	// ADD USER NAME
	// ADD USER NAME
	// ADD USER NAME

	addUserName : function (parent) {


		// Bind
		var nameContent = 
			parent
			.selectAll('.chrome-left-item-name')
			.data(function(d) { return [d] });

		// Enter
		nameContent
			.enter()
			.append('div')
			.classed('chrome-left-item-name', true);

		// Update
		nameContent
			.html(function (d) { 
				return d.getFullName();
			});

		// Exit
		nameContent
			.exit()
			.remove();


	},

	_requestContact : function (user) {

		// send contact request
		app.Account.sendContactRequest(user);
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
		var dims = {
			width : this.options.defaultWidth,
			height : this._container.offsetHeight
		};
		return dims;
	},

	_refresh : function () {

		// Prepare data as array
		var data = _.toArray(this.users);

		// remove self
		_.remove(data, function (d) {
			return d.getUuid() == app.Account.getUuid();
		});

		// Init user list
		this.refreshUserList(data);			
	}

});