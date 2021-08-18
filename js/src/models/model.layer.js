M.Model.Layer = M.Model.extend({

    type : 'layer',

    options : {
        hoverTooltip : true,    // hover instead of click  todo..
    },

    _initialize : function (layer) {

        // set source
        this.store = layer; // db object
        
        // data not loaded
        this.loaded = false;

        this.on('hover_enabled', this._onHoverEnabled);
        this.on('hover_disabled', this._onHoverDisabled);

    },

    _on_timeseries_layer_date_changed : function () {},

    addHooks : function () {
        this._setHooks('on');
    },

    removeHooks : function  () {
        this._setHooks('off');
        this._removeGridEvents();
    },

    _setHooks : function (on) {

        // all visible tiles loaded event (for phantomJS)
        M.DomEvent[on](this.layer, 'load', this._onLayerLoaded, this);
        M.DomEvent[on](this.layer, 'loading', this._onLayerLoading, this);

        M.Mixin.Events[on]('timeseries_layer_date_changed', this._on_timeseries_layer_date_changed, this);

      
    },

    getType : function () {
        return this.type;
    },

    // dummy
    _mapMove : function () {},
    
    _unload : function (e) {
        this.removeHooks();
    },

    _onLayerLoaded : function () {
        app._loaded.push(this.getUuid());
        app._loaded = _.uniq(app._loaded);
    },

    _onLayerLoading : function () {
        app._loading.push(this.getUuid());
        app._loading = _.uniq(app._loading);
    },

    initLayer : function () {

        // create Leaflet layer, load data if necessary
        this._inited = true;
        
        // add hooks
        this.addHooks();
    },

    add : function (type) {

        // mark as base or layermenu layer
        this._isBase = (type == 'baselayer');
        
        // add
        this.addTo();
    },

    addTo : function () {
        if (!this._inited) this.initLayer();

        // add to map
        this._addTo();
        
        // add to controls
        this.addToControls();
    },

    _addTo : function (type) {
        if (!this._inited) this.initLayer();

        var map = app._map;

        // leaflet fn
        map.addLayer(this.layer);

        // add gridLayer if available
        if (this.gridLayer) {
            map.addLayer(this.gridLayer);
        }

        // add to active layers
        app.MapPane.addActiveLayer(this);   // includes baselayers

        // update zindex
        this._addToZIndex(type);

        this._added = true;

        // fire layer enabled
        this.fire('enabled', {
            layer : this
        });

    },

    _addThin: function () {
        if (!this._inited) this.initLayer();

        var map = app._map;

        // only add to map temporarily
        map.addLayer(this.layer);
        this.layer.bringToFront();

        // add gridLayer if available
        if (this.gridLayer) {
            map.addLayer(this.gridLayer);
        }

    },

    _removeThin : function () {
        if (!this._inited) this.initLayer();

        var map = app._map;

        map.removeLayer(this.layer);

        // remove gridLayer if available
        if (this.gridLayer) {
            this.gridLayer._flush();
            if (map.hasLayer(this.gridLayer)) map.removeLayer(this.gridLayer); 
        }
    },

    flyTo : function () {
        var extent = this.getMeta().extent;

        if (!extent) return;

        var southWest = L.latLng(extent[1], extent[0]),
            northEast = L.latLng(extent[3], extent[2]),
            bounds = L.latLngBounds(southWest, northEast),
            map = app._map,
            row_count = parseInt(this.getMeta().row_count),
            flyOptions = {};

        // if large file, don't zoom out
        if (row_count > 500000) { 
            var zoom = map.getZoom();
            flyOptions.minZoom = zoom;
        }

        flyOptions.maxZoom = 18;

        // fly
        map.fitBounds(bounds, flyOptions);
    },

    addToControls : function () {
        if (this._isBase) return;
        this._addToDescription();
        this._addToLayermenu();
    },

    _addToLayermenu : function () {
        // activate in layermenu
        var layerMenu = app.MapPane.getControls().layermenu;
        layerMenu && layerMenu._enableLayer(this.getUuid());
    },

    _addToLegends : function () {
        // add legends if active
        var legendsControl = app.MapPane.getControls().legends;
        legendsControl && legendsControl.addLegend(this);
    },

    _addToInspect : function () {
        // add to inspectControl if available
        var inspectControl = app.MapPane.getControls().inspect;     
        if (inspectControl) inspectControl.addLayer(this);
    },

    _addToDescription : function () {

        // add to descriptionControl if available
        var descriptionControl = app.MapPane.getControls().description;
        if (!descriptionControl) return;

        descriptionControl._addLayer(this);

        // hide if empty and not editor
        var project = app.activeProject;
        var isEditor = project.isEditor();

        // ensure description control is visible
        descriptionControl.show(); // debug
        return; // debug


        // if (this.store.description || isEditor) { // todo: what if only editor 
        //     descriptionControl.show();
        // } else {                                // refactor to descriptionControl
        //     descriptionControl.hide();
        // }
        
    },

    leafletEvent : function (event, fn) {
        this.layer.on(event, fn);
    },

    _addToZIndex : function (type) {
        if (type == 'baselayer') this._isBase = true;
        var zx = this._zx || this._getZX();

        // add to baselayers
        if (this._isBase) {
            zx.b.add(this);
            return;
        } 
        
        var custom_zindex = this.getCustomZIndex();
        if (custom_zindex) {
            zx.b.addAt(this, 600);
            return;
        } 

        // add to data layers
        zx.l.add(this);
        
        // this._isBase ? zx.b.add(this) : zx.l.add(this); // either base or layermenu
    },

    _removeFromZIndex : function () {
        var zx = this._zx || this._getZX();
        this._isBase ? zx.b.remove(this) : zx.l.remove(this);
    },

    _getZX : function () {
        return app.MapPane.getZIndexControls();
    },

    remove : function (map) {
        var map = map || app._map;

        // leaflet fn
        if (map.hasLayer(this.layer)) map.removeLayer(this.layer);

        // remove from active layers
        app.MapPane.removeActiveLayer(this);    

        // remove gridLayer if available
        if (this.gridLayer) {
            this.gridLayer._flush();
            if (map.hasLayer(this.gridLayer)) map.removeLayer(this.gridLayer); 
        }

        // remove from zIndex
        this._removeFromZIndex();

        // remove from descriptionControl if avaialbe
        var descriptionControl = app.MapPane.getControls().description;
        if ( descriptionControl ) descriptionControl._removeLayer(this);

        this._added = false;

        // fire layer enabled
        this.fire('disabled', {
            layer : this
        });
    },

    getActiveLayers : function () {
        return this._activeLayers;
    },

    enable : function () {
        this.addTo();
    },

    disable : function () {
        this.remove();
    },


    getCustomOptions : function () {
        var c = M.parse(this.store.options) || {};
        return c;
    },

    setCustomOptions : function (o) {
        var existing_options = M.parse(this.store.options) || {};

        _.each(o, function (value, key) {
            existing_options[key] = value;
        });

        // save
        this.store.options = JSON.stringify(existing_options);
        this.save('options');

    },

    saveOpacity : function (opacity) {

        // save if editable
        var project = app.activeProject;
        if (project && project.isEditable()) {
            this.store.opacity = opacity;
            this.save('opacity');
        }
    },

    setOpacity : function (opacity) {
        if (isNaN(opacity)) opacity = 1;
        this.opacity = opacity;
        this.layer.setOpacity(this.opacity);
    },

    getOpacity : function () {
        var opacity = this.opacity || this.store.opacity;
        if (isNaN(opacity)) opacity = 1;
        return opacity;
    },

    getContainer : function () {
        return this.layer.getContainer();
    },

    getTitle : function () {
        return this.store.title;
    },

    setTitle : function (title) {

        // save title
        this.store.title = title;
        this.save('title');

        // set on legend
        this.setLegendsTitle(title);

        return this;
    },

    getDescription : function () {
        return this.store.description;
    },

    setDescription : function (description) {
        this.store.description = description;
        this.save('description');
    },

    getSatellitePosition : function () {
        return this.store.satellite_position;
    },

    setSatellitePosition : function (satellite_position) {
        this.store.satellite_position = satellite_position;
        this.save('satellite_position');
    },

    getCopyright : function () {
        return this.store.copyright;
    },

    setCopyright : function (copyright) {
        this.store.copyright = copyright;
        this.save('copyright');
    },

    getUuid : function () {
        return this.store.uuid;
    },

    getFileUuid : function () {
        return this.store.file;
    },

    setActiveMask : function (mask) {
        if (!_.isString(mask)) return console.error('Mask must be stringified.');
        this.store.active_mask = mask;
        // this.save('active_mask');
    },

    getActiveMask : function () {
        // mask_id
        return this.store.active_mask || null;
    },

    setFilterMask : function (bool) {
        this.store.filter_mask = bool;
        this.save('filter_mask');
    },

    getFilterMask : function () {
        return this.store.filter_mask || false;
    },

    // todo: create options object which can allow any option switch (ie. JSON)
    setAverageDataOption : function (bool) {
        var options = M.parse(this.store.options);
        if (!options) {
            options = {
                average_data : bool
            } 
        } else {
            options.average_data = bool;
        }
        this.store.options = M.stringify(options);
        this.save('options');
    },

    getAverageDataOption : function () {
        var options = M.parse(this.store.options);
        if (!options) return false;
        return options.average_data;
    },

    getAttribution : function () {
        return this.store.attribution;
    },

    getFile : function () {
        var fileUuid = this.getFileUuid();
        var file = _.find(app.Projects, function (p) {
            return p.files[fileUuid];
        });
        if (!file) return false;
        return file.files[fileUuid];
    },

    getProjectUuid : function () {
        return app.activeProject.store.uuid;
    },

    getName : function () {
        return this.getTitle();
    },

    getEditorStyle : function () {
        return this.getDefaultEditorStyle();
    },

    getDefaultEditorStyle : function () {
        var meta = this.getMeta();

        var columns = meta.columns;
        var field;

        for (var c in columns) {
            field = c;
        }
        
        var style = {
            field : field,
            colors : ['red', 'white', 'blue'],
            marker : {
                width : field,
                opacity : 1
            }
        };

        return style;
    },

    getMeta : function () {
        var metajson = this.store.metadata;
        if (!metajson) return false;

        var meta = M.parse(metajson);
        return meta;
    },

    getMetaFields : function () {
        var meta = this.getMeta();
        if (!meta) return false;
        if (!meta.json) return false;
        if (!meta.json.vector_layers) return false;
        if (!meta.json.vector_layers[0]) return false;
        if (!meta.json.vector_layers[0].fields) return false;
        return meta.json.vector_layers[0].fields;
    },

    reloadMeta : function (callback) {

        var json = JSON.stringify({
            file_id : this.getFileUuid(),
            layer_id : this.getUuid()
        });

        app.api.reloadMeta(json, callback || function (ctx, json) {

        });
    },

    getTooltip : function () {
        var json = this.store.tooltip;
        if (!json) return false;
        var meta = M.parse(json);
        return meta;
    },

    labelsEnabled : function () {
        var t = this.getTooltip();
        if (!t) return false;
        return t.labels;
    },

    setTooltip : function (meta) {
        this.store.tooltip = JSON.stringify(meta);
        this.save('tooltip');
    },

    getStyleJSON : function () {
        return this.getStyling();
    },
    setStyleJSON : function (styleJSON) {
        return this.setStyling(styleJSON);
    },

    // todo: remove
    getStyling : function () {
        var json = this.store.style;
        return M.parse(json);
    },
    // todo: remove
    setStyling : function (styleJSON) {
        var style = _.isObject(styleJSON) ? JSON.stringify(styleJSON) : styleJSON;
        // this.store.style = JSON.stringify(styleJSON);
        this.store.style = style;
        this.save('style');
    },
    
    setStyle : function () {},

    getLegends : function () {
        var meta = this.store.legends;
        if (meta) return M.parse(meta);
        return false;
    },

    getActiveLegends : function () {
        var legends = this.getLegends();
        var active = _.filter(legends, function (l) {
            return l.on;
        });
        return active;
    },

    setLegends : function (legends) {
        if (!legends) return;
        this.store.legends = JSON.stringify(legends);
        this.save('legends');
    },

    setLegendsTitle : function (title) {
        var legends = M.parse(this.store.legends);
        if (!legends[0]) return;
        legends[0].value = title;
        this.setLegends(legends);
    },


    createLegends : function (callback) {
        var layerID = this._getLayerUuid();
        var accessToken = app.tokens.access_token;

        // get layer feature values for this layer
        var options = {
            layerUuid : layerID,
            accessToken : accessToken
        };

        // create legends on server
        app.api.createLegends(options, callback)
    },

    getLegedJson : function () {
        return this.store.legend;
    },

    getFeaturesValues : function (callback, ctx) {
        if (!callback || !ctx) return console.error('must provide callback() and context');

        // get layer feature values for this layer
        var json = JSON.stringify({
            fileUuid : this.getFileUuid(),
            cartoid : this.getCartoid()
        });

        // get from server
        app.api.getfeaturesvalues(json, callback.bind(ctx))
    },

    hide : function () {
        var container = this.getContainer();
        container.style.visibility = 'hidden';
    },

    show : function () {
        var container = this.getContainer();
        container.style.visibility = 'visible';
    },

    // save updates to layer (like description, style)
    save : function (field) {
        var json = {};
        json[field] = this.store[field];
        json.layer  = this.store.uuid;
        json.uuid   = app.activeProject.getUuid(); // project uuid
        this._save(json);
    },

    _save : function (json) {
        app.api.updateLayer(json, function (err, result) {

            if (err) {
                return app.feedback.setError({
                    title : 'Something went wrong',
                    description : err
                });
            }

            var result = M.parse(result);

            if (!result || result.error) {
                return app.feedback.setError({
                    title : 'Something went wrong',
                    description : err
                });
            }

            
        }.bind(this));
    },

    _setZIndex : function (z) {
        this.layer.setZIndex(z);
    },
    

    _addGridEvents : function () {
        this._setGridEvents('on');
    },

    _setGridEvents : function (on) {
        var grid = this.gridLayer;
        if (!grid || !on) return;

        // experimental: hover popup in config
        if (app.options.custom && app.options.custom.hoverPopup) {

            // add movemouse event to grid
            grid[on]('mousemove', this._gridOnHover, this);
            grid[on]('mouseover', this._gridOnMouseOver, this);
            grid[on]('mouseout', this._gridOnMouseOut, this);

        } else {
            
            // test
            grid[on]('mousemove', _.throttle(this._gridOnHover.bind(this), 200), this);

            // click popup
            grid[on]('mousedown', this._gridOnMousedown, this);     
            grid[on]('mouseup', this._gridOnMouseup, this);  
            grid[on]('click', this._gridOnClick, this);
        }

    },

    // experimental: hover popup in config
    _gridOnHover : function () {},
    _gridOnMouseOver : function () {},
    _gridOnMouseOut : function () {},

    _removeGridEvents : function () {
        this._setGridEvents('off');
    },

    _flush : function () {
        this.remove();
        app.MapPane._clearPopup();
        this._removeGridEvents();
        this.layer = null;
        this.gridLayer = null;
        this._inited = false;
    },

    downloadLayer : function () {

    },
    shareLayer : function () {
        console.log('share layer', this);
    },
    deleteLayer : function () {
        console.log('M.Model.Layer delete layer', this);
    },

    isVector : function () {
        return false;
    },

    getLegendImage : function () {
        return;
    },

    isRaster : function () {
        return false;
    },
  
    isCube : function () {
        return false;
    },
    
    isStyleable : function () {
        return this.isVector() || this.isRaster() || this.isCube();
    },

    getAttributionControl : function () {
        return app.MapPane._attributionControl;
    },
    
    _invalidateTiles : function () {
        return;
    },

    getDisplayNames : function () {},

    isDefo : function () {
        return false;
    },

    isWMS : function () {
        return false;
    },

    getSourceURL : function () {
    },

    getWMSLayerString : function () {

    },

    getWMSExtraOptions : function () {

    },

    getWMSLegend : function () {

    },

    isGeoJSON : function () {
        return false;
    },

    _onHoverEnabled : function () {},
    _onHoverDisabled : function () {},

    getCustomZIndex : function () {
        var z = parseInt(this.store.custom_zindex);
        if (_.isNaN(z)) return '';
        return z;
    },

    setCustomZIndex : function (zidx) {
        try {
        this.store.custom_zindex = parseInt(zidx);
        this.save('custom_zindex');
        } catch (e) {
            console.log('parseInt err:', e, zidx);
        }
    }


});






M.ErrorLayer = M.Model.Layer.extend({
    initialize : function (layer) {
        console.log('Errorlayer: ', layer);
    }
});

// shorthand for creating all types of layers
M.createLayer = function (layer) {

    // error layer
    if (!layer.data) return new M.ErrorLayer();

    // check if vector/raster
    var isVector = (layer.data.postgis && layer.data.postgis.geom_type == 'geometry');
    var isRaster = (layer.data.postgis && layer.data.postgis.geom_type == 'raster');

    // postgis vector
    if (isVector) return new M.VectorLayer(layer);

    // postgis raster
    if (isRaster) return new M.RasterLayer(layer);

    if (layer.data.geojson7946) return new M.Model.Layer.GeoJSONLayer(layer);

    // cubes
    if (layer.data.cube) return new M.Model.Layer.CubeLayer(layer);

    // mapbox
    if (layer.data.mapbox) return new M.MapboxLayer(layer);

    // norkart
    if (layer.data.norkart) return new M.NorkartLayer(layer);

    // google
    if (layer.data.google) return new M.GoogleLayer(layer);

    // graph
    if (layer.data.graph) return new M.Layer.Graph(layer);

    // wms
    if (layer.data.wms) return new M.WMSLayer(layer);

    // tile service
    if (layer.data.tile_service) return new M.TileServiceLayer(layer);

    // catch-all error layer
    return new M.ErrorLayer(layer);
};

// update options and redraw
L.TileLayer.include({
    setOptions : function (options) {
        L.setOptions(this, options);
        this.redraw();
    }
});
L.UtfGrid.include({
    setOptions : function (options) {
        L.setOptions(this, options);
        this.redraw();
    }
});

L.TopoJSON = L.GeoJSON.extend({  
    addData: function(jsonData) {    
        if (!this._topology) this._topology = jsonData;

        if (jsonData.type === "Topology") {
            for (key in jsonData.objects) {
                geojson = topojson.feature(jsonData, jsonData.objects[key]);
                this._geojson = geojson;
                L.GeoJSON.prototype.addData.call(this, geojson);
            }
        }    
        else {
            L.GeoJSON.prototype.addData.call(this, jsonData);
        }
    },
    toGeoJSON : function () {
        return topojson.merge(this._topology, this._topology.objects.collection.geometries);
    },
});
