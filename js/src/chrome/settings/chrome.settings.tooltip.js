M.Chrome.SettingsContent.Tooltip = M.Chrome.SettingsContent.extend({


    _initialize : function () {


        // init container
        this._initContainer();

        // add events
        this._addEvents();

        // shortcut
        app.Tools = app.Tools || {};
        app.Tools.Tooltip = this;       
        
    },

    _initContainer : function () {

        // create container
        this._container = M.DomUtil.create('div', 'chrome chrome-content chrome-pane chrome-tooltip', this.options.appendTo);
    },

    _initLayout : function () {


        if (!this._project) return;
  

        // Scroller
        this._midSection = M.DomUtil.create('div', 'chrome-middle-section', this._container);
        this._midOuterScroller = M.DomUtil.create('div', 'chrome-middle-section-outer-scroller', this._midSection);
        this._midInnerScroller = M.DomUtil.create('div', 'chrome-middle-section-inner-scroller', this._midOuterScroller);

        // active layer
        this.layerSelector = this._initLayout_activeLayers(false, false, this._midInnerScroller);

        // Fields wrapper
        this._fieldsWrapper = M.DomUtil.create('div', 'chrome-field-wrapper', this._midInnerScroller);

        // mark as inited
        this._inited = true;
    },

    _refresh : function () {
        
        // flush
        this._inited && this._flush();
        
        // refresh
        this._initLayout();
    },

    _flush : function () {

        // clear content
        this._midSection.innerHTML = '';
    },

    // Runs on init
    show : function () {
        if (!this._inited) this._initLayout();

        // clear
        this._fieldsWrapper.innerHTML = '';

        // hide others
        this.hideAll();

        // mark
        this.showing = true;

        // show this
        this._container.style.display = 'block';

        // mark button
        M.DomUtil.addClass(this.options.trigger, 'active-tab');

        // Enable settings from layer we're working with
        var layerUuid = this._getActiveLayerUuid();
        if ( layerUuid ) this._selectedActiveLayer(false, layerUuid);

        // Execute if only this._layer is available
        // select in dropdown
        this._layer && this.layerSelector.setValue({
            value : layerUuid,
            title : this._layer.getTitle()
        });

    },

    // Event run when layer selected 
    _selectedActiveLayer : function (value, uuid) {

        var layerUuid = uuid || value;

        this._layer = this._project.getLayer(layerUuid);

        if (!this._layer) return; // hack
        
        // Store uuid of layer we're working with
        this._storeActiveLayerUuid(layerUuid);

        // Get stored tooltip meta
        this.tooltipMeta = this._layer.getTooltip();
        
        // Get layermeta
        var layerMeta = M.parse(this._layer.store.metadata);

        // If no tooltip meta stored, create from layer meta
        if ( !this.tooltipMeta ) this.tooltipMeta = this.createTooltipMeta(layerMeta);

        this._fieldsWrapper.innerHTML = '';

        // Init title
        this.initTitle();

        // Init enable/disable
        this.initDisable();     

        // Initialize fields
        this.initFields();

    },

    // Title
    initTitle : function () {

        // get title
        var title = this.tooltipMeta.title;

        // Wrapper
        var sectionWrapper = M.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper);
        
        // Header
        var header = M.DomUtil.create('div', 'chrome-content-header', sectionWrapper, 'Title');

        var titleInput = M.DomUtil.create('input', 'chrome-content-tooltip-title-field', sectionWrapper);
        titleInput.id = 'tooltip-title-input';
        titleInput.name = 'tooltip-title-input';
        titleInput.setAttribute('placeholder', this._layer.store.title);

        if (title) titleInput.value = title;

        // set save event
        M.DomEvent.on(titleInput, 'blur', this.saveTitle, this);
    },


    initDisable : function () {

        // Wrapper
        var sectionWrapper = M.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper);
        
        // Header
        var header = M.DomUtil.create('div', 'chrome-content-header', sectionWrapper, 'Popup/labels');

        if ( typeof this.tooltipMeta.enable == 'undefined' ) {
            this.tooltipMeta.enable = true;
        }


        // Enable/disable switch
        var enableDisableLine = new M.fieldLine({
            id       : 'enable',
            appendTo : sectionWrapper,
            title    : 'Enable popup',
            input    : false
        });     

        var timeSeriesSwitch = new M.button({
            id       : 'enable-pop-up',
            type     : 'switch',
            isOn     : this.tooltipMeta.enable,
            right    : false,
            appendTo : enableDisableLine.container,
            fn       : this._saveEnableSwitch.bind(this)
        });


        // labels
        var labelsToggleLine = new M.fieldLine({
            id       : 'enable',
            appendTo : sectionWrapper,
            title    : 'Enable labels',
            input    : false
        });     

        var labelsToggle = new M.button({
            id       : 'enable-pop-up',
            type     : 'switch',
            isOn     : this.tooltipMeta.labels,
            right    : false,
            appendTo : labelsToggleLine.container,
            fn       : this._toggleLabels.bind(this)
        });


        // hover
        var labelsToggleLine = new M.fieldLine({
            id       : 'enable',
            appendTo : sectionWrapper,
            title    : 'Enable tooltip on hover',
            input    : false
        });     

        var labelsToggle = new M.button({
            id       : 'enable-pop-up',
            type     : 'switch',
            isOn     : this.tooltipMeta.hover,
            right    : false,
            appendTo : labelsToggleLine.container,
            fn       : this._toggleTooltipHover.bind(this)
        });
   
    },

     _toggleTooltipHover : function (e, enabled) {
       
        // save
        this.tooltipMeta.hover = enabled;
        this._layer.setTooltip(this.tooltipMeta);

        // fire event
        if (enabled) {
            this._layer.fire('hover_enabled');
        } else {
            this._layer.fire('hover_disabled');
        }

        
    },

    _toggleLabels : function (e, enabled) {
       
        // save
        this.tooltipMeta.labels = enabled;
        this._layer.setTooltip(this.tooltipMeta);

        // fire event
        if (enabled) {
            this._layer.fire('showLabels');
        } else {
            this._layer.fire('hideLabels');
        }

        
    },

    // Init meta fields and time series
    initFields : function () {
        this.fieldListFromObject('Active fields');
        if ( this.tooltipMeta.timeSeries ) this.initTimeSeries();
    },

    // Creates section with meta field lines
    fieldListFromObject : function (title, timeSeries) {

        var fields = timeSeries ? this.tooltipMeta.timeSeries : this.tooltipMeta.metaFields;

        var sectionWrapper = M.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper);
        var header = M.DomUtil.create('div', 'chrome-content-header', sectionWrapper, title);

        // Function that saves on blur/click
        var saveFunction = timeSeries ? this._saveSwitchTimeSeries : this._saveSwitch;

        var hasInput = timeSeries ? false : true;

        var display_names = this._layer.getDisplayNames();

        for ( var key in fields ) {
            var isOn = fields[key].on;
            var title = display_names ? display_names[key] : fields[key].title;

            // Block 
            if ( key == 'enable' || key == 'minmaxRange' || key == 'graphstyle' ) return;

            var line = new M.fieldLine({
                id       : key,
                appendTo : sectionWrapper,
                title    : title,
                input    : hasInput,
                fn       : this._saveFromBlur.bind(this)
            });     

            var _switch = new M.button({
                id       : key,
                type     : 'switch',
                isOn     : isOn,
                right    : false,
                appendTo : line.container,
                fn       : saveFunction.bind(this)
            });
        }
    },

    // Cretes section with time series
    initTimeSeries : function () {
        // Wrapper
        var sectionWrapper = M.DomUtil.create('div', 'chrome-content-section-wrapper', this._fieldsWrapper);
        
        // Header
        var header = M.DomUtil.create('div', 'chrome-content-header', sectionWrapper, 'Time series');
        var headerExtra = M.DomUtil.create('span', 'chrome-content-header-gray', header, ' (auto detected)');


        // Time series switch
        // Time series switch
        // Time series switch

        var timeSeriesLine = new M.fieldLine({
            id       : 'enable',
            appendTo : sectionWrapper,
            title    : 'Enable time series',
            input    : false
        });     

        var timeSeriesSwitch = new M.button({
            id       : 'enable',
            type     : 'switch',
            isOn     : this.tooltipMeta.timeSeries.enable,
            right    : false,
            appendTo : timeSeriesLine.container,
            fn       : this._saveSwitch.bind(this)
        });



        // RANGE
        // RANGE
        // RANGE

        var rangeLine = new M.fieldLine({
            id       : 'minmaxRange',
            appendTo : sectionWrapper,
            title    : 'Range',
            input    : false
        });

        var rangeMiniInput = new M.button({
            id          : 'minmaxRange',
            type        : 'miniInput',
            right       : false,
            isOn        : true,
            appendTo    : rangeLine.container,
            value       : this.tooltipMeta.timeSeries.minmaxRange,
            placeholder : 'auto',
            tabindex    : 1,
            fn          : this._saveMiniBlur.bind(this),
            className   : 'time-series-input'
        });


        // chart unit (mm, cm, m, etc)
        var chartUnitLine = new M.fieldLine({
            id       : 'chartUnit',
            appendTo : sectionWrapper,
            title    : 'Chart unit',
            input    : false
        });

        var chartUnitInput = new M.button({
            id          : 'chartUnit',
            type        : 'miniInput',
            right       : false,
            isOn        : true,
            appendTo    : chartUnitLine.container,
            value       : this.tooltipMeta.chartUnit,
            placeholder : 'mm',
            tabindex    : 1,
            fn          : this._saveMiniBlur.bind(this),
            className   : 'time-series-input',
            allowText   : true
        });


        // Create list of time series fields
        this.fieldListFromObject('Time Series Fields', true);
    },  
    

    // Save title
    saveTitle : function (e) {

        this.tooltipMeta.title = e.target.value;
        this._layer.setTooltip(this.tooltipMeta);

    },

    // Saves tiny input to right
    _saveMiniBlur : function (e) {

        var key   = e.target.id.substring(17, e.target.id.length);
        var value = e.target.value;

        this._saveToServer(key, value);
    },

    // Save input fields in meta field lines
    _saveFromBlur : function (e) {
    
        var key   = e.target.id.substring(12, e.target.id.length);
        var title = e.target.value;
        
        var thisSwitch = M.DomUtil.get('switch_' + key);
        var thisSwitchState = thisSwitch.getAttribute('state');

        // var on = thisSwitchState ? true : false;
        if ( thisSwitchState == 'true' ) {
            var on = true;
        } else {
            var on = false;
        }

        this._saveToServer(key, on, title);
    },

    // Saves switches, etc
    _saveSwitch : function (e, on) {

        var elem = e.target;
        var key  = elem.getAttribute('key');
        var titleField = M.DomUtil.get('field_input_' + key);
        var title = titleField ? titleField.value : false;
        this._saveToServer(key, on, title);
    },

    _saveSwitchTimeSeries : function (e, on) {

        var elem = e.target;
        var key  = elem.getAttribute('key');
        var titleField = M.DomUtil.get('field_input_' + key);
        var title = titleField ? titleField.value : false;
        this._saveToServer(key, on, title, true);
    },

    _saveEnableSwitch : function (e, on) {
        this.tooltipMeta.enable = on;
        this._layer.setTooltip(this.tooltipMeta);
    },

    _saveToServer : function (key, value, title, timeseries) {

        if ( key == 'enable' || key == 'minmaxRange' || key == 'graphstyle' ) {
            
            // Update object
            this.tooltipMeta.timeSeries[key] = value;

            // Save to server
            this._layer.setTooltip(this.tooltipMeta);

        } else if (key == 'chartUnit') {

            // Update object
            this.tooltipMeta.chartUnit = value;

            // Save to server
            this._layer.setTooltip(this.tooltipMeta);

        } else {


            if ( timeseries ) {

                // Check if key is date 
                var keyIsDate = this._validateDateFormat(key);
                
                // If key is date, try to update timeseries
                if ( keyIsDate ) {
                    this.updateTimeSeriesMeta(key, title, value);
                }

            } else {
                this.updateMeta(key, title, value);
            }
        }

        this._layer.setTooltip(this.tooltipMeta);
    },



    // Save helpers – goes through the JSON object to find a key match in the time series
    updateTimeSeriesMeta : function (key, title, on) {  

        var timeSeries = this.tooltipMeta.timeSeries;
        var hit = false;

        for ( var f in timeSeries ) {

            if ( f == key ) {

                timeSeries[f].title = false;
                timeSeries[f].on = on;

                hit = true
            }
        }

        return hit;
    },

    // Save helper – goes through the JSON object to find a key match in the meta fields
    updateMeta : function (key, title, on) {    

        var metaFields = this.tooltipMeta.metaFields;

        for ( var f in metaFields ) {

            if ( f == key ) {
                metaFields[f].title = title;
                metaFields[f].on = on;
                return;
            }
        }
    },

    
    open : function () {
        // console.log('open!', this);
    },



    // DATA BUILDERS
    // DATA BUILDERS
    // DATA BUILDERS
    // DATA BUILDERS

    // Gets called from Chrome Data _onLayerAdded()
    // TODO: Events?

    _buildTooltipMeta : function (layerMeta) {
        return this.createTooltipMeta(layerMeta);
    },


    // Tooltip meta
    createTooltipMeta : function (layerMeta) {

        // Get columns
        var columns = layerMeta.columns;

        // Returns object with timeseries separated from the other fields
        var splitMetaData = this.buildTimeSeries(columns);

        if (splitMetaData[1] > 5) {
            return splitMetaData[0];
        } else {
            return this.cleanColumns(columns);
        }
    },

    // Create clean columns (without time series)
    cleanColumns : function (columns) {

        var metaData = {
            title : '',
            description : false,
            metaFields : {},
            timeSeries : false
        };

        for (var f in columns) {
            metaData.metaFields[f] = {
                    title : false,
                    on    : true
            }
        }

        return metaData;
    },

    // Splits metadata into "time series" and "meta fields"
    buildTimeSeries : function (columns) {

        var metaData = {
            title : '',
            description : false,            
            timeSeries : {},
            metaFields : {}
        };
        
        var timeSeriesCount = 0;

        for ( var f in columns ) {


            // validate time
            var isTime = this._validateDateFormat(f);

            // Is time series
            if ( isTime ) {
                
                metaData.timeSeries[f] = {
                        title : false,
                        on    : true
                };

                timeSeriesCount ++;     
            } 


            // Is not time series, cont them in anyways
            if ( f.substring(0,7) != 'the_geo' && f != '_columns') {
                
                // console.log(f);

                var _on = isTime ? false : true;

                metaData.metaFields[f] = {
                        title : false,
                        on    : _on
                };

            }       
 
        }

        // Set time series to true by default
        metaData.timeSeries.enable = true;

        return [metaData, timeSeriesCount];
    }

});
