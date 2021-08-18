M.Control = L.Control.extend({

	initialize : function (options) {

		// set options
		M.setOptions(this, options);

		// listen up
		this._listen();

		// local initialize
		this._initialize(options);

	},      

	_listen : function () {
		M.Mixin.Events.on('projectSelected', this._projectSelected, this);
		M.Mixin.Events.on('editEnabled',     this._editEnabled, this);
		M.Mixin.Events.on('editDisabled',    this._editDisabled, this);
		M.Mixin.Events.on('layerEnabled',    this._layerEnabled, this);
		M.Mixin.Events.on('layerDisabled',   this._layerDisabled, this);
		M.Mixin.Events.on('layerAdded',      this._onLayerAdded, this);
		M.Mixin.Events.on('layerEdited',     this._onLayerEdited, this);
		M.Mixin.Events.on('layerStyleEdited',this._onLayerStyleEdited, this);
		M.Mixin.Events.on('layerDeleted',    this._onLayerDeleted, this);
		M.Mixin.Events.on('fileImported',    this._onFileImported, this);
		M.Mixin.Events.on('fileDeleted',     this._onFileDeleted, this);
		M.Mixin.Events.on('layerPointClick', this._onLayerPointClick, this);
	},

	_projectSelected : function (e) {
		var projectUuid = e.detail.projectUuid;
		if (!projectUuid) {
			this._project = null;
			return this._off();
		}
		// set project
		this._project = app.activeProject = app.Projects[projectUuid];

		// refresh pane
		this._refresh();
	},

	// dummies
	_initialize 	 : function () {},
	_editEnabled 	 : function () {},
	_editDisabled 	 : function () {},
	_layerEnabled 	 : function () {},
	_layerDisabled 	 : function () {},
	_updateView 	 : function () {},
	_refresh 	 	 : function () {},
	_onFileImported  : function () {},
	_onFileDeleted   : function () {},
	_onLayerAdded    : function () {},
	_onLayerEdited   : function () {},
	_onLayerStyleEdited   : function () {},
	_onLayerDeleted  : function () {},
	_off 		 	 : function () {},
	_onLayerPointClick : function () {},

});