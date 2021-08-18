// postgis vector layer
M.VectorLayer = M.Model.Layer.extend({

    type : 'vector',

    initLayer : function () {
        this.update();
        this.addHooks();

        this._listenLocally();

        this._inited = true;
    },

    _listenLocally : function () {
        M.DomEvent.on(this.layer, 'load', this._onLayerLoaded, this);
        M.DomEvent.on(this.layer, 'loading', this._onLayerLoading, this);
        
        this.on('disabled', this._onLayerDisabled);
        this.on('enabled', this._onLayerEnabled);
    },

    _onLayerLoading : function () {
        this._loadStart = Date.now();
    },

    _onLayerLoaded : function () {
        var loadTime = Date.now() - this._loadStart;
    },

    update : function (options, callback) {
        var map = app._map;

        // remove
        if (this.layer) this._flush();

        // prepare raster
        this._prepareRaster();

        // prepare utfgrid
        this._prepareGrid();

        // prepare labels
        this._prepareLabels();

        // enable
        if (options && options.enable) {

            // add to map
            map.addLayer(this.layer);

            // ensure on top
            this.layer.bringToFront();
        }

        // callback
        callback && callback();
    },

    setData : function (data) {
        if (!data) return console.error('no style to set!');
        this.store.data.postgis = data;
        this.save('data');
    },

    setStyle : function (data) {
        return this.setData(data);
    },

    // on change in style editor, etc.
    updateStyle : function (style) {
        var layerUuid = style.layerUuid;
        var postgisOptions = style.options;

        // save 
        this.setData(postgisOptions);

        // update layer option
        this._refreshLayer(layerUuid);
    },

    _refreshLayer : function (layerUuid) {
        this.layer.setOptions({
            layerUuid : layerUuid
        });

        this.layer.redraw();
    },

    _getLayerUuid : function () {
        return this.store.data.postgis.layer_id;
    },

    getCartoCSS : function (cartoid, callback) {
        return this.store.data.postgis.cartocss;
    },

    getSQL : function () {
        return this.store.data.postgis.sql;
    },

    setFilter : function (filter) {
        this.store.filter = filter;
        this.save('filter');
    },

    getFilter : function () {
        return this.store.filter;
    },

    getPostGISData : function () {
        return this.store.data.postgis;
    },

    _prepareRaster : function () {
        var fileUuid = this._fileUuid;
        var subdomains = app.options.servers.tiles.subdomains;
        var access_token = '?access_token=' + app.tokens.access_token;
        var layerUuid = this._getLayerUuid();
        var url = app.options.servers.tiles.uri + '{layerUuid}/{z}/{x}/{y}.png' + access_token;

        // add vector tile raster layer
        this.layer = L.tileLayer(url, {
            layerUuid: this._getLayerUuid(),
            subdomains : subdomains,
            maxRequests : 0,
            maxZoom : 19
        });
    },

    _prepareLabels : function () {

        // check config settigns
        if (!app.options.custom || !app.options.custom.labels) return;

        // point type
        if (this.getGeometryType() == 'ST_Point') {
            this._preparePointLabels();
        }
    },

    _preparePointLabels : function () {

        var options = {
            layer_id : this.getPostGISLayerId()
        }

        // fetch data from server
        app.api.getVectorPoints(options, function (err, points) {
            if (err) return console.error(err);

            // parse
            var p = M.parse(points);

            // store locally
            this._labelPoints = p.points;

            // add labels
            this._addPointLabels();

        }.bind(this));

    },

    _addPointLabels : function () {

        if (!this.labelsEnabled()) return;

        var points = this._labelPoints;

        // create local store
        this._labels = this._labels || [];

        // add label for each point
        _.forEach(points, function (p) {

            // get data
            var label_text = p.comments;
            var lat = p.lat;
            var lng = p.lng;

            // dont add label if no text
            if (_.isNull(label_text) || _.isUndefined(label_text) || !label_text) return;

            // create custom icon (as label)
            var myIcon = L.divIcon({
                className: 'hidden-marker', 
                html : '<div class="vector-point-label">' + label_text + '</div>'
            });

            // create label
            var label = L.marker([lat, lng], {icon: myIcon}).addTo(app._map);

            // remember label
            this._labels.push(label);

        }.bind(this));

    },

    _onLayerDisabled : function (e) {
        this._onHideLabels(e);
    },

     _onLayerEnabled : function (e) {
        this._onShowLabels(e);
    },

    _onShowLabels : function (e) {
        if (this._labels && _.isArray(this._labels) && _.size(this._labels) > 0) return;

        // add labels
        this._addPointLabels(); // todo: not only for points!
    },

    _onHideLabels : function (e) {
        if (!this._labels || !_.isArray(this._labels)) return;

        // remove each label
        _.forEach(this._labels, function (l) {
            l.remove();
        });

        // clear local store
        this._labels = [];
    },

    getPostGISLayerId : function () {
        var pg = this.getPostGISData();
        if (!pg) return false;
        var layer_id = pg.layer_id;
        return layer_id;
    },

    getGeometryType : function () {
        var m = this.getMeta();
        if (!m || !m.geometry_type) return;
        return m.geometry_type;
    },

    getDisplayNames : function () {
       
        var csv = this.getCSV();

        if (!csv) return;

        // get csv classes
        return _.find(csv, {type : 'display_name'});
    },

    getLegendNames : function () {
        var csv = this.getCSV();

        if (!csv) return;

        // get csv classes
        return _.find(csv, {type : 'legend'});
    },

    getCSV : function () {
        // get meta
        var meta = this.getMeta();

        if (!meta) return;

        // get csv
        var csv = meta.csv;

        return csv;
    },

    _invalidateTiles : function () {
        return;
    },

    _updateGrid : function (l) {
        if (this.gridLayer) {
            this.gridLayer._update();
        }
    },

    _prepareGrid : function () {

        // set ids
        var subdomains  = app.options.servers.utfgrid.subdomains;
        var access_token = '?access_token=' + app.tokens.access_token;
        
        var layerUuid = this._getLayerUuid();
        var url = app.options.servers.tiles.uri + "{layerUuid}/{z}/{x}/{y}.grid" + access_token;

        // create gridlayer
        this.gridLayer = new L.UtfGrid(url, {
            useJsonP: false,
            subdomains: subdomains,
            maxRequests : 0,
            requestTimeout : 10000,
            layerUuid : layerUuid,
            maxZoom : 19
        });

        // add grid events
        this._addGridEvents();

    },

    _onHoverEnabled : function () {
        this._setClickEvents('off');
        this._setHoverEvents('on');
    },

    _onHoverDisabled : function () {
        this._setClickEvents('on');
        this._setHoverEvents('off');
    },

    _addGridEvents : function () {
        this._setGridEvents('on');
    },

    _removeGridEvents : function () {
        this._setGridEvents('off');
    },

    _setGridEvents : function (on) {
        // hover popup in config
        var label_settings = this.getTooltip();
        if (label_settings && label_settings.hover) {
            this._setHoverEvents(on);
        } else {
            this._setClickEvents(on);
        }
    },

    _setHoverEvents : function (on) {
        var grid = this.gridLayer;
        if (!grid || !on) return;

        // hover event
        grid[on]('mousemove', _.throttle(this._gridOnHover.bind(this), 200), this);

    },

    _setClickEvents : function (on) {
        var grid = this.gridLayer;
        if (!grid || !on) return;

        // click popup
        grid[on]('mousedown', this._gridOnMousedown, this);     
        grid[on]('mouseup', this._gridOnMouseup, this);  
        grid[on]('click', this._gridOnClick, this);
    },


    _fetchData : function (e, callback) {
        var keys = Object.keys(e.data);
        var column = keys[0];
        var row = e.data[column];
        var layer_id = e.layer.store.data.postgis.layer_id;

        var options = {
            column : column,
            row : row,
            layer_id : layer_id,
            access_token : app.tokens.access_token
        };

        // fetch data from server
        app.api.dbFetch(options, callback.bind(this));
    },

    _gridOnMousedown : function(e) {},

    _gridOnMouseup : function (e) {
        if (!e.data) return;

        // pass layer
        e.layer = this;

        var event = e.e.originalEvent;

        if (this._event === undefined || this._event.x == event.x) {
            
        } else {

            // clear old
            app.MapPane._clearPopup();
        }

    },


    _gridOnHover : function (e) {
        if (!e.data || app.MapPane._drawing) return;

        // todo: 
        // 1. connect to switch
        // 2. throttle/wait for query

        // pass layer
        e.layer = this;

        // fetch data
        this._fetchData(e, function (ctx, json) {
            if (!json) return console.error('no data for popup!');
            var data = M.parse(json);
            if (!data) return console.error('no data for popup!');

            // get label/popup settings
            var label_settings = e.layer.getTooltip();

            // filter active popup fields
            var active_keys = [];
            _.each(label_settings.metaFields, function (value, key) {
                if (value.on) active_keys.push(key);
            });
            var filtered_data = '<div class="tooltip-hover-title">' + this.getTitle() + '</div>';
            _.each(active_keys, function (a) {
                filtered_data += a + ': ' + data[a] + '<br>';
            });
          
            // create tooltip first run
            if (!this._tooltip) {
                this._tooltip = L.tooltip({})
                .setLatLng(e.latlng)
                .addTo(app._map)
                .setContent(filtered_data);
            } 

            // update tooltip
            this._tooltip.setLatLng(e.latlng).setContent(filtered_data);
            
            // remove after delay
            if (this._removeTooltipTimer) clearTimeout(this._removeTooltipTimer);
            this._removeTooltipTimer = setTimeout(function () {
                this._tooltip.remove();
                this._tooltip = null;
            }.bind(this), 1000);

        }.bind(this));
    },


    _fetching : {},
    _cache : {},

    // todo: move custom logic to popup-plugin
    _gridOnMouseOver : function (e) {
        // console.log('__gridOnMouseOver', e);
        if (!e.data || app.MapPane._drawing) return;
        
        var gid = e.data.gid;
        var layer_id = e.target.options.layerUuid;
        var popup = app.MapPane.hoverPopup;
        var popup_id = gid + layer_id;

        // already fetching, will catch on callback
        if (this._fetching[popup_id]) return;

        // check if data already fetched
        if (this._cache[popup_id]) {

            // add content to popup
            popup.addContent({
                id : popup_id,
                data : this._cache[popup_id],
                layer : this
            });

        } else {

            var keys = Object.keys(e.data);
            var column = keys[0];
            var row = e.data[column];
            var postgis_layer_id = this.store.data.postgis.layer_id;
           
            // fetch data from server
            app.api.dbFetch({
                column : column,
                row : row,
                layer_id : layer_id,
                access_token : app.tokens.access_token
            }, function (ctx, json) {
               
                // parse
                var data = M.parse(json);

                if (!data) return;

                // format data for popup 
                var formattedData = this._formatPopupData(data);

                // add content to popup
                popup.addContent({
                    id : popup_id,
                    data : formattedData,
                });

                // save to local cache
                this._cache[popup_id] = formattedData;

                // mark as done fetching
                this._fetching[popup_id] = false;
          
            }.bind(this));

            // mark as fetching
            this._fetching[popup_id] = true;
        }

    },

    _fetchedData : function (ctx, json) {

        // parse
        var data = M.parse(json);

        if (!data) return;

        // store locally
        this._cache[popup_id] = data;

        // mark as done fetching
        this._fetching[popup_id] = false;

        // add content to popup
        popup.addContent({
            id : popup_id,
            data : data
        });

    },

    _formatPopupData : function (data) {

        var fieldNames = this.getDisplayNames();

        var legends = this.getLegendNames();

        var csv = this.getCSV();

        // get tooltip settings
        var tooltip = this.getTooltip();

        // get metafields
        var fields = tooltip.metaFields;


        var rows = [];

        _.forEach(data, function (value, key) {
            
            // check if the field is enabled in popup settings
            var isOn = _.isUndefined(fields[key]) ? false : fields[key].on;

            if (key && fieldNames[key] && !_.isNull(value) && isOn) {   

                rows.push({
                    value : value,
                    key : fieldNames[key].camelize(),
                    legend : legends[key],
                    t : this._get_t_class_html(csv, key, value),
                    k : key // debug
                });

            }
        }.bind(this));

        var formattedData = {
            title : this.getTitle(),
            rows : rows
        };

        return formattedData;
    },

    _get_t_class_html : function (csv, k, v) {

        var t1 = _.find(csv, {type : 't1'});
        var t2 = _.find(csv, {type : 't2'});
        var t3 = _.find(csv, {type : 't3'});
        var t4 = _.find(csv, {type : 't4'});
        var t5 = _.find(csv, {type : 't5'});
        var t6 = _.find(csv, {type : 't6'});

        var tclass = 0;

        if (t1 && v <  parseFloat(t1[k])) tclass = 1;
        if (t1 && v >= parseFloat(t1[k])) tclass = 2;
        if (t2 && v >= parseFloat(t2[k])) tclass = 3;
        if (t3 && v >= parseFloat(t3[k])) tclass = 4;
        if (t4 && v >= parseFloat(t4[k])) tclass = 5;
        if (t5 && v >= parseFloat(t5[k])) tclass = 6;
        if (t6 && v >= parseFloat(t6[k])) tclass = 7;

        return tclass;
    },


    _gridOnMouseOut : function (e) {
        var gid = e.data.gid;
        var layer_id = e.target.options.layerUuid;

        var popup = app.MapPane.hoverPopup;
        var popup_id = gid + layer_id;

        popup.removeContent({
            id : popup_id
        });

    },

    _gridOnClick : function (e) {
        if (!e.data || app.MapPane._drawing) return;

        // pass layer
        e.layer = this;

        // add event (for control.description legend toggle)
        M.Mixin.Events.fire('layerPointClick', { detail : {
            layer_id : e.layer.options.uuid
        }});

        // fetch data
        this._fetchData(e, function (ctx, json) {
            
            if ( !json ) {
                console.error('no data for popup!');
                return;
            }

            var data = M.parse(json);

            e.data = data;
            var event = e.originalEvent;
            this._event = {
                x : event.x,
                y : event.y
            };

            // open popup
            app.MapPane._addPopupContent(e);

        });
    },

    downloadLayer : function () {

        var options = {
            layer_id : this.getUuid(), 
            socket_notification : true
        };

        // set download id for feedback
        this._downloadingID = M.Util.createRandom(5);

        app.api.downloadLayerDataset(options, function (err, resp) {
            if (err) {
                return app.feedback.setError({
                    title : 'Something went wrong',
                    description : err
                });
            }
            // give feedback
            app.feedback.setMessage({
                title : 'Preparing download',
                description : 'Hold tight! Your download will be ready in a minute.',
                id : this._downloadingID
            }); 
        });

    },

    _onDownloadReady : function (e) {
        var options = e.detail;
        var file_id = options.file_id;
        var finished = options.finished;
        var filepath = options.filepath;

        // parse results
        var path = app.options.servers.portal;
        path += 'api/file/download/';
        path += '?file=' + filepath;
        path += '&type=shp';
        path += '&access_token=' + app.tokens.access_token;

        console.log('_onDownloadReady', path);

        app.feedback.msg('Download ready!', 'Click this link to <a href="' + path + '" target="_blank">download dataset</a>.', 20000);

        // open (note: some browsers will block pop-ups. todo: test browsers!)
        window.open(path, 'mywindow');

        // remove feedback
        app.feedback.remove(this._downloadingID);
    },

    shareLayer : function () {

    },

    deleteLayer : function () {

        // confirm
        var message = 'Are you sure you want to delete this layer? \n - ' + this.getTitle();
        if (!confirm(message)) return console.log('No layer deleted.');

        // get project
        var layerUuid = this.getUuid();
        var project = _.find(app.Projects, function (p) {
            return p.layers[layerUuid];
        });

        // delete layer
        project.deleteLayer(this);
    },
    
    isVector : function () {
        return true;
    },

});
