M.Chart = M.Control.extend({

    initialize : function(options) {

        app.log('opened:chart');

        // set options
        M.setOptions(this, options);
        var multiPopUp = options.multiPopUp;
        var e = options.e;

        // If we are sampling with polygon (draw)
        if ( multiPopUp ) {

            // Get pop-up settings
            var _layer = this._getWuLayerFromPostGISLayer(multiPopUp.layer_id);
            this.popupSettings = _layer.getTooltip();

            // Create content
            var content = this.multiPointPopUp(multiPopUp);

        // csv 
        } else if (this.isCSV()) {

            // get layer
            var layer = options.e.layer;

            // get tooltip
            this.popupSettings = layer.getTooltip();

            // create custom csv content
            var content = this.createCSVContent();


        // If we are sampling from point (click)
        } else {

            // catch error
            if (!e) return console.error('no "e" provided?');

            // Get pop-up settings
            this.popupSettings = e.layer.getTooltip();

            // Create content
            var content = this.singlePopUp(e);
     
            var timeseries_chart = true;
        }

        // Return if disabled
        if ( typeof this.popupSettings.enable == 'undefined' ) this.popupSettings.enable = true;
        if ( !this.popupSettings.enable ) return;

        // clear old popup
        this._popup = null;

        // return if no content
        if (!content) return;   

        // Create empty     
        if (!this._popupContent) this._popupContent = '';
        
        // append content
        this._popupContent = content;

        // Open popup
        this.openPopup(e, multiPopUp);

        // refresh
        if (timeseries_chart) {
            this._resize_chart_update_size();
        }
    },

    createCSVContent : function (layer) {

        // get layer
        var layer = layer || this.options.e.layer;

        // get meta
        var meta = layer.getMeta();

        // get csv
        var csv = meta.csv;

        // get data
        var data = this.options.e.data;

        // get tooltip settings
        var tooltip = layer.getTooltip();

        // get metafields
        var fields = tooltip.metaFields;

        // get csv classes
        var display_name = _.find(csv, {type : 'display_name'});
        var legend = _.find(csv, {type : 'legend'});
        var t1 = _.find(csv, {type : 't1'});
        var t2 = _.find(csv, {type : 't2'});
        var t3 = _.find(csv, {type : 't3'});
        var t4 = _.find(csv, {type : 't4'});
        var t5 = _.find(csv, {type : 't5'});
        var t6 = _.find(csv, {type : 't6'});

        // create container
        var container = M.DomUtil.create('div', 'popup-csv-container');

        // create header
        var header = M.DomUtil.create('div', 'popup-csv-header', container, layer.getTitle());

        // create content wrapper
        var content = M.DomUtil.create('div', 'popup-csv-content', container);

        // create inner content
        _.forEach(data, function (v, k) {
            if (_.isNull(v)) return;
            if (k == 'the_geom_3857') return;
            if (k == 'the_geom_4326') return;
            if (k == 'type') return;
            if (k == 'comments') return;
            if (k == 'gid') return;
            if (k == 'lat') return;
            if (k == 'lng') return;

            // check if the field is enabled in popup settings
            var isOn = _.isUndefined(fields[k]) ? false : fields[k].on;
            if (!isOn) return;

            // create line
            var line_wrap = M.DomUtil.create('div', 'popup-csv-line-wrap', content);

            // set name, value
            var name_div = M.DomUtil.create('div', 'popup-csv-line-name', line_wrap, display_name[k]);
            var value_div = M.DomUtil.create('div', 'popup-csv-line-value', line_wrap, v + ' ' + legend[k]);

            // set tilstandsklasse
            var tclass = this._get_t_class_html(csv, k, v);
            line_wrap.appendChild(tclass);

        }.bind(this));

        return container;
    },

    _get_t_class_html : function (csv, k, v) {
        var t1 = _.find(csv, {type : 't1'});
        var t2 = _.find(csv, {type : 't2'});
        var t3 = _.find(csv, {type : 't3'});
        var t4 = _.find(csv, {type : 't4'});
        var t5 = _.find(csv, {type : 't5'});
        var t6 = _.find(csv, {type : 't6'});

        // k = 4
        // v = 270

        var tclass = 0;


        if (t1 && v <  parseFloat(t1[k])) tclass = 1;
        if (t1 && v >= parseFloat(t1[k])) tclass = 2;
        if (t2 && v >= parseFloat(t2[k])) tclass = 3;
        if (t3 && v >= parseFloat(t3[k])) tclass = 4;
        if (t4 && v >= parseFloat(t4[k])) tclass = 5;
        if (t5 && v >= parseFloat(t5[k])) tclass = 6;
        if (t6 && v >= parseFloat(t6[k])) tclass = 7;

        var content = M.DomUtil.create('div', 'popup-csv-class tilstandsklasse-' + tclass);
        content.innerHTML = tclass ? 'Tilstandsklasse ' + tclass : 'Ukjent tilstandsklasse';

        return content;

    },

    isCSV : function () {
        var options = this.options;
        var layer = options.e.layer;
        if (!layer) return;

        // return true if csv key exists on metadata
        return _.has(layer.getMeta(), 'csv');
    },


    // Open pop-up
    openPopup : function (e, multiPopUp) {

        if ( this._popup ) return;

        var popup   = this._createPopup(e);
        var content = this._popupContent;
        var map     = app._map;
        var project = this._project || app.activeProject;

        // set latlng
        var latlng = multiPopUp ? multiPopUp.center : e.latlng;

        // return if no content
        if (!content) return this._clearPopup();
        
        // set popup close event
        this._addPopupCloseEvent();

        // keep popup while open
        this._popup = popup;

        // set content
        popup.setContent(content);

        // open popup
        popup.open();

        // show marker on popup, but not on multi cause polygon
        if (!multiPopUp) {

            // set latlng
            latlng = this._getMarkerPosition(latlng, e);
            
            // Add marker circle
            this._addMarkerCircle(latlng);
        }

    },


    updateExistingPopup : function (options) {
        var popup = options.context._chart._popup;
        var e = options.e;
        var multiPopUp = options.multiPopUp;

        // Todo: enable popup-settings for draw selection
        if ( multiPopUp ) return;

        if (this.isCSV()) {

            // get layer
            var layer = options.e.layer;

            // get tooltip
            this.popupSettings = layer.getTooltip();

            // create content
            var content = this.createCSVContent(layer);
        
        } else {
            var content = this.singlePopUp(e);
        }

        // set content to popup
        popup.setContent(content, true);
    },

    // get real marker position (from data)
    _getMarkerPosition : function (latlng, e) {
        
        // debug. problems with e.data.lat/lng coming from dataset, which may be any projection... 
        return latlng; 
        
        // return latlng if no data 
        if (!e.data || !e.data.lat || !e.data.lng) return latlng;

        // read latlng from data
        var lat = e.data.lat;
        var lng = e.data.lng;

        // return leaflet latlng object
        return L.latLng(lat, lng);
    },

    // Add marker circle (not working)
    _addMarkerCircle : function (latlng) {

        // circle marker styling
        var styling = { 
            radius: 15,
            fillColor: "white",
            color: "gainsboro",
            weight: 15,
            opacity : 0.7,
            fillOpacity: 0
        };

        // create circle marker
        this._circleMarker = L.circleMarker(latlng, styling).addTo(app._map);
    },

    _addPopupCloseEvent : function () {
        if (this._popInit) return;
        this._popInit = true;   // only run once

        // close event
        app._map.on('popupclose',  this._clearPopup, this);
    },

    _removePopupCloseEvent : function () {

        // remove close event
        app._map.off('popupclose',  this._clearPopup, this);
    },

    _refresh : function () {

        // remove old popup
        if (this._popup) this._popup._remove();
        
        // clear popup
        this._clearPopup(false);
    },

    _clearPopup : function (clearPolygons) {
        
        // clear polygon
        if (clearPolygons) app.MapPane.getControls().draw._clearAll();

        // nullify
        this._popupContent = '';
        this._popup = null;

        // remove marker
        this._circleMarker && app._map.removeLayer(this._circleMarker);

        // remove event
        this._removePopupCloseEvent();
    },
    

    // Create leaflet pop-up
    _createPopup : function (e) {

        // Create smaller pop-up if there are no graphs to show
        if ( !this.popupSettings.timeSeries || this.popupSettings.timeSeries.enable == false ) {
            var maxWidth = 200;
            var minWidth = 200;

        // Create large pop-up for graph
        } else {
            var maxWidth = 400;
            var minWidth = 200;         
        }


        // create popup
        var popup = this._popup = M.popup({
            offset : [18, 0],           
            closeButton : false,
            zoomAnimation : false,
            maxWidth : maxWidth,
            minWidth : minWidth,
            // maxHeight : 350,
            appendTo : app._appPane,
            defaultPosition : {
                x : 7,          
                y : 6
            }                    
        });

        
        if ( app.isMobile.mobile ) {

            var _mobileWidth = window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth ||
                document.body.offsetWidth;          

            popup._container.style.maxWidth = _mobileWidth - 13 + 'px';
        }

        if ( !this.popupSettings.timeSeries || this.popupSettings.timeSeries.enable == false ) {
            M.DomUtil.addClass(popup._container, 'tiny-pop-up')
        }

        return popup;
    },



    // Create single point C3 pop-up content
    singlePopUp : function (e) {

        // check if timeseries
        var timeSeries = (this.popupSettings.timeSeries && this.popupSettings.timeSeries.enable == true );

        // create content, as timeseries or normal
        var content = timeSeries ? this.singleC3PopUp(e) : this._createPopupContent(e);

        return content;
    },

    // Create "normal" pop-up content without time series
    _createPopupContent : function (e) {

        this.popupSettings = e.layer.getTooltip();

        var c3Obj = {
            data : e.data,
            layer : e.layer,
            layerName : e.layer.store.title,
            meta : false,
            popupSettings : this.popupSettings,
            d3array : {
                    meta    : [],
                    xName   : 'field_x', 
                    yName   : 'mm',
                    x   : [],
                    y   : [],
                    ticks   : [],
                    tmpTicks : []
            },
            multiPopUp : false
        };

        this._c3Obj = this.createC3dataObj(c3Obj);
    

        var headerOptions = {
            headerMeta  : this._c3Obj.d3array.meta,
            layerName   : e.layer.store.title,
            areaSQ      : false,
            pointCount  : false,
            multiPopUp  : false,
            layer       : e.layer
        };

        // Create HTML
        var _header = this.createHeader(headerOptions);
        var _chartContainer = this.createChartContainer();
        var _footer = this.createFooter();

        var content = this._content = M.DomUtil.create('div', 'popup-inner-content');
        content.appendChild(_header);
        content.appendChild(_chartContainer);
        content.appendChild(_footer);

        return content;     
    },  

    _remove_chart_ghost : function () {

        // resize end
        M.DomUtil.remove(app._chart_ghost);
        M.DomEvent.off(document, 'mouseup', this._remove_chart_ghost, this);

        // update size with latest values
        setTimeout(this._resize_chart_update_size.bind(this), 50);
    },

    _resize_chart_update_size : function () {

        // on first open
        if (!app._chart_resize) {
            app._chart_resize = {
                new_x : 400,
                new_y : 300
            };
        }

        // get vars
        var new_x = app._chart_resize.new_x;
        var new_y = app._chart_resize.new_y;

        // set wrapper size
        this._popup._wrapper.style.width = new_x + 'px';
        this._popup._wrapper.style.height = new_y + 'px';
       
        // resize fonts
        // fix font sizes
        var _header = app._resize_chart_header;
        if (!_header) return;
        var zoom;
        var fontSize;

        if (new_x < 500) { 
            zoom = 1;
            fontSize = 12;
        } 
        if (new_x >= 500 && new_x < 700) {
            zoom = 1.1;
            fontSize = 13;
        }
        if (new_x >= 700 && new_x < 900) {
            zoom = 1.2;
            fontSize = 14;
        }
        if (new_x >= 900 && new_x < 1100) {
            zoom = 1.3;
            fontSize = 15;
        }
        if (new_x >= 1100 && new_x < 1400) {
            zoom = 1.4;
            fontSize = 16;
        }
        if (new_x >= 1400 && new_x < 1700) {
            zoom = 1.5;
            fontSize = 17;
        }
        if (new_x >= 1700 ) {
            zoom = 1.6;
            fontSize = 18;
        }

        // set zoom, font
        _header.style.zoom = zoom;
        this._footerDates.style.fontSize = fontSize;

        // calc
        var new_header_height = _header.offsetHeight * zoom + 40;
        var chart_x = new_x - 20;
        var chart_y = new_y - new_header_height;

        // do the actual update
        if (this._chart) {
            this._chart.resize({
                height : chart_y, 
                width : chart_x
            });
        }

        // remember
        app._rememberChartSizeHeight = new_y;
        app._rememberChartSizeWidth = new_x;

        // unhide
        M.DomUtil.removeClass(app._popup_content_div, 'visibility-hidden');

    },

    _resize_chart_fn : function (e) {

        // hide chart content while resizing
        M.DomUtil.addClass(app._popup_content_div, 'visibility-hidden');

        // calc
        var move_x = e.pageX - app._chart_resize.start_x;
        var move_y = app._chart_resize.start_y - e.pageY;
        var new_x = app._chart_resize.start_size_x + move_x;
        var new_y = app._chart_resize.start_size_y + move_y;
        if (new_x < 400) new_x = 400;
        if (new_y < 300) new_y = 300;

        // remember chart size
        app._chart_resize.new_x = new_x;
        app._chart_resize.new_y = new_y;

        // set wrapper size
        this._popup._wrapper.style.width = new_x + 'px';
        this._popup._wrapper.style.height = new_y + 'px';

    },

    _getChartUnit : function (layer) {
        try {
            var tooltip = layer.store.tooltip;
            var parsed = M.parse(tooltip);
            var chartUnit = parsed.chartUnit;
            if (chartUnit) return chartUnit;
            return 'mm'; // default
        } catch (e) {
            return 'mm'; // default
        }
    },

    singleC3PopUp : function (e) {

        // get precision
        var styleJSON = e.layer.getStyleJSON();
        var precision = _.isNumber(styleJSON.precision) ? styleJSON.precision : 1;

        var c3Obj = {
            data : e.data,
            layer : e.layer,
            meta : false,
            popupSettings : this.popupSettings,
            d3array : {
                    meta    : [],
                    xName   : 'field_x', 
                    yName   : 'mm',
                    x   : [],
                    y   : [],
                    ticks   : [],
                    tmpTicks : []
            },
            precision : precision
        };

        this._c3Obj = this.createC3dataObj(c3Obj);

        var headerOptions = {
            headerMeta  : this._c3Obj.d3array.meta,
            layerName   : e.layer.store.title,
            areaSQ      : false,
            pointCount  : false,
            multiPopUp  : false,
            layer       : e.layer
        };


        var content = M.DomUtil.create('div', 'popup-inner-content');

        app._popup_content_div = content;

        // Create header HTML
        var _header = app._resize_chart_header = this.createHeader(headerOptions);
        var _chartContainer = this.createChartContainer();
        var _footer = this.createFooter();
        content.appendChild(_header);
        content.appendChild(_chartContainer);
        content.appendChild(_footer);

        // create chart unit label
        var chartUnitLabel = M.DomUtil.create('div', 'chart-unit-label');
        chartUnitLabel.innerHTML = this._getChartUnit(e.layer)
        _footer.appendChild(chartUnitLabel);

        // Create graph HTML
        if ( this.popupSettings && this.popupSettings.timeSeries.enable != false) {
            
            var _chart = this.C3Chart(this._c3Obj);
            var _chartTicks = this.chartTicks(this._c3Obj);
            _chartContainer.appendChild(_chart);

            // resizable
            var resizeButton = M.DomUtil.create('div', 'resize-chart-button');
            resizeButton.innerHTML = '<i class="fa fa-expand"></i>';
            _chartContainer.appendChild(resizeButton);
            
            // on resize start
            M.DomEvent.on(resizeButton, 'mousedown', function (e) {
                if (e.which == 3) return; // ignore right click

                var start_x = e.pageX;
                var start_y = e.pageY;

                var start_size_x = this._popup._wrapper.offsetWidth;
                var start_size_y = this._popup._wrapper.offsetHeight;

                app._chart_resize = {
                    start_x,
                    start_y, 
                    start_size_x,
                    start_size_y,
                };

                // create ghost fullscreen
                app._chart_ghost = M.DomUtil.create('div', 'resize-ghost-fullscreen');
                app._appPane.appendChild(app._chart_ghost); // add 
               
                // add event listener for mouseup
                M.DomEvent.on(document, 'mouseup', this._remove_chart_ghost, this);

                // resize move
                M.DomEvent.on(app._chart_ghost, 'mousemove', _.throttle(this._resize_chart_fn.bind(this), 20), this);

                
            }.bind(this));
        
        }


        return content;         
    },


    _calculateRegression : function (c) {

        var c = this._c3object;
        var x = []; // dates
        var start_date;

        var y_ = _.clone(c.d3array.y);
        y_.splice(0,1);
        
        var y = [];
        y_.forEach(function (value) {
            y.push(parseFloat(value));
        });

        var dates = _.clone(c.d3array.x);
        dates.splice(0,1);

        dates.forEach(function (d, i) {
            if (i == 0) {
                // set start date
                start_date = moment(d);
                x.push(0);

            } else {
                // days since start_date
                var b = moment(d);
                var diff_in_days = b.diff(start_date, 'days');
                x.push(diff_in_days);
            }
        });

        var xx = [];
        var xy = [];

        x.forEach(function (x_, i) {
            xy.push(x[i] * y[i]);
            xx.push(x[i] * x[i]);
        });

        var x_sum = 0;
        var y_sum = 0;
        var xx_sum = 0;
        var xy_sum = 0;

        x.forEach(function (value, i) {
            if (!_.isNaN(value)) {
                x_sum += value;
            }
        });

        y.forEach(function (value, i) {
            if (!_.isNaN(value)) {
                y_sum += value;
            }
        });

        xx.forEach(function (value, i) {
            if (!_.isNaN(value)) {
                xx_sum += value;
            }
        });

        xy.forEach(function (value, i) {
            if (!_.isNaN(value)) {
                xy_sum += value;
            }
        });

        var n = y.length;
        var result_a = ((y_sum * xx_sum) - (x_sum * xy_sum)) / ((n * xx_sum) - (x_sum * x_sum));
        var result_b = ((n * xy_sum) - (x_sum * y_sum)) / ((n * xx_sum) - (x_sum * x_sum));
        var result_y_start = result_a + (result_b * x[0]);
        var result_y_end = result_a + (result_b * x[x.length-1]);


        // var reg = ['regression', result_y_start, result_y_end];

        // need every step 
        var reg = ['regression'];
        y.forEach(function (y_, i) {
            if (i == 0) {
                reg.push(result_y_start);
            } else {
                var val = (result_y_end / n) * (i);
                reg.push(val);
            }
        });

        return reg;

    },

    // Create multi point C3 pop-up content
    multiPointPopUp : function (_data) {

        var _average = _data.average;
        var _center = _data.center;
        var _layer = this._getWuLayerFromPostGISLayer(_data.layer_id);
        var _layerName = _layer.store.title;
        var _totalPoints = _data.total_points;

        // Show square meters if less than 1000
        if ( _data.area < 1000 ) {

            var area = Math.round(_data.area);
            var _areaSQ = area + 'm' + '<sup>2</sup>';

        // Show square KM if more than 1000 (0.01 km2)
        } else {

            var area = _data.area / 1000000;
            var areaRounded = Math.floor(area * 1000) / 1000;
            var _areaSQ = areaRounded + 'km' + '<sup>2</sup>';
        }      


        var c3Obj = {
            data        : _average,
            meta        : false,
            popupSettings   : this.popupSettings,
            d3array     : {
                meta    : [],
                xName   : 'field_x', 
                yName   : 'mm',
                x   : [],
                y   : [],
                ticks   : [],
                tmpTicks : []
            },
            multiPopUp : {
                center  : _center
            }

        };

        this._c3Obj = this.createC3dataObj(c3Obj);

        var headerOptions = {
            headerMeta  : this._c3Obj.d3array.meta,
            layerName   : _layerName,
            areaSQ      : _areaSQ,
            pointCount  : _totalPoints,
            multiPopUp  : true,
            layer       : _layer
        };

        var content = M.DomUtil.create('div', 'popup-inner-content visibility-hidden');

        app._popup_content_div = content;

        // Create header
        var _header = app._resize_chart_header = this.createHeader(headerOptions);
        var _chartContainer = this.createChartContainer();
        var _footer = this.createFooter();
        content.appendChild(_header);
        content.appendChild(_chartContainer);
        content.appendChild(_footer);


        if ( this.popupSettings.timeSeries && this.popupSettings.timeSeries.enable == true ) {

            // Create chart
            var _chart = this.C3Chart(this._c3Obj);
            var _chartTicks = this.chartTicks(this._c3Obj);
            _chartContainer.appendChild(_chart);

            // resizable
            var resizeButton = M.DomUtil.create('div', 'resize-chart-button');
            resizeButton.innerHTML = '<i class="fa fa-expand"></i>';
            _chartContainer.appendChild(resizeButton);
            
            // on resize start
            M.DomEvent.on(resizeButton, 'mousedown', function (e) {
                if (e.which == 3) return; // ignore right click

                var start_x = e.pageX;
                var start_y = e.pageY;

                var start_size_x = this._popup._wrapper.offsetWidth;
                var start_size_y = this._popup._wrapper.offsetHeight;

                app._chart_resize = {
                    start_x,
                    start_y, 
                    start_size_x,
                    start_size_y,
                };

                // create ghost fullscreen
                app._chart_ghost = M.DomUtil.create('div', 'resize-ghost-fullscreen');
                app._appPane.appendChild(app._chart_ghost); // add 
               
                // add event listener for mouseup
                M.DomEvent.on(document, 'mouseup', this._remove_chart_ghost, this);

                // resize move
                M.DomEvent.on(app._chart_ghost, 'mousemove', _.throttle(this._resize_chart_fn.bind(this), 20), this);
                
            }.bind(this));

            setTimeout(this._resize_chart_update_size.bind(this), 20);

        }

        return content;
    },      


    chartTicks : function (c3Obj) {

        // Data
        var data = c3Obj.d3array;

        // Ticks
        var t = data.ticks;

        var first_data_point = data.x[1];
        var last_data_point = data.x[data.x.length -1];

        // start/end date
        var start = moment(first_data_point).format("DD.MM.YYYY");
        var end = moment(last_data_point).format("DD.MM.YYYY"); 

        this._footerDates.innerHTML = '<span class="start-date">' + start + '</span><span class="end-date">' + end + '</span>';
    },



    createFooter : function () {
        var footerContainer = this._footerContainer = M.DomUtil.create('div', 'c3-footer');

        var dates = this._footerDates = M.DomUtil.create('div', 'c3-footer-dates', footerContainer);
        return footerContainer;
    },


    createChartContainer : function () {
        var chartContainer = this._chartContainer = M.DomUtil.create('div', 'c3-chart-container');
        return chartContainer;
    },


    // Header
    createHeader : function (options) {

        // get vars
        var headerMeta = options.headerMeta;
        var layerName  = options.layerName;
        var areaSQ     = options.areaSQ;
        var pointCount = options.pointCount;
        var multiPopUp = options.multiPopUp;


        // If custom title
        if ( this.popupSettings.title && this.popupSettings.title != '' ) {
            layerName = this.popupSettings.title
        }

        this._chartTitle = layerName;

        // Container
        var container = M.DomUtil.createId('div', 'c3-header-metacontainer');

        // If not time series, make small pop-up
        if ( !this.popupSettings.timeSeries || this.popupSettings.timeSeries.enable == false ) {
            container.className = 'small-pop-up';
        }

        // Header
        var headerWrapper = M.DomUtil.create('div', 'c3-header-wrapper', container);
        var headerName = M.DomUtil.create('div', 'c3-header-layer-name', headerWrapper, layerName);

        // add more text for multiquery
        if (multiPopUp) {
            
            // set geom text based on type
            var geom_type = options.layer.getMeta().geometry_type;
            var geom_text = 'items';
            if (geom_type == 'ST_Point') geom_text = 'points';
            if (geom_type == 'ST_MultiPolygon') geom_text = 'polygons';

            // set text
            var plural = 'Sampling ' + pointCount + ' ' + geom_text + ' over approx. ' + areaSQ;
            var _pointCount = M.DomUtil.create('div', 'c3-point-count', headerWrapper, plural);
        }


        var c = 0;
        headerMeta.forEach(function(meta, i) {

            var _key = meta[0];
            var _val = meta[1];

            var setting = this.popupSettings ? this.popupSettings.metaFields[_key] : false;

            if (!setting) return;

            // if ( _key == 'lat' || _key == 'lng' || _key == 'geom' || _key == 'the_geom_3857' || _key == 'the_geom_4326' ) return;
            if ( _key == 'geom' || _key == 'the_geom_3857' || _key == 'the_geom_4326' ) return;
            
            // Do not show field if there is no value
            if ( !_val ) return;

            // Do not show field if it's been set to "off" in settings!
            if ( setting.on == false ) return;

            // Use title from settings, if there is one
            if (  setting.title && setting.title != '' ) {
                var title = setting.title
            } else {
                var title = _key;
            }

            c++;

            var roundedVal = 100;

            if ( roundedVal ) {
                var newVal = Math.floor(parseFloat(_val) * roundedVal) / roundedVal;

                if (!isNaN(newVal)) {
                    _val = newVal;
                }
                
            }


            if ( _val && _val != -9999) {
                var metaPair = M.DomUtil.create('div', 'tableRow c3-header-metapair metapair-' + c, container);
                var metaKey = M.DomUtil.create('div', 'tableCell c3-header-metakey', metaPair, title);
                var metaVal = M.DomUtil.create('div', 'tableCell c3-header-metaval', metaPair, _val);
            }

        }.bind(this));

        return container;

    },

    // Chart
    C3Chart : function (c3Obj) {
        
        var data = c3Obj.d3array;

        this._currentChartData = data;

        // Ticks
        var t = data.ticks;

        // X's and Why's
        var x = data.x;
        var y = data.y;

        var y = _.filter(y, function (i) {
            return parseFloat(i) > -9999;
        });

        

        // Get first TICK date and the first X date
        var firstTickDate = t[0];
        var firstXDate = x[0];

        // If the first X date is more recent than the first TICK date,
        // remove the first tick date.
        if ( firstXDate > firstTickDate ) t.splice(0,1);    
        
        // Get min and max Y
        var minY = Math.min.apply(null, y);
        var maxY = Math.max.apply(null, y);

        // Get range
        var range;

        var settingsRange = c3Obj.popupSettings.timeSeries.minmaxRange;

        // Use range from settings
        if ( settingsRange ) {
    
            // range = parseInt(settingsRange);
            range = parseFloat(settingsRange);
    
        // Use dynamic range based on current point
        } else {

        
            if (minY < 0) {
                
                var convertedMinY = Math.abs(minY);


                if (convertedMinY > maxY) {
                    range = convertedMinY;
                } else {
                    range = maxY;
                }


            } else {
                range = Math.floor(maxY * 100) / 100;
            }

        }

        this._range = range;

        // Column name
        var xName = data.xName;
        var yName = data.yName;

        // Add column name to X and Y (required by C3)
        x.unshift(xName);
        y.unshift(yName);

        _columns = [x, y];

        // Create container
        var _C3Container = M.DomUtil.createId('div', 'c3-container');   


        if ( app.isMobile.mobile ) {

            var _mobileWidth = window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth ||
                document.body.offsetWidth;          

            var _width = _mobileWidth - 33;
        } else {
            var _width = 400;
        }   

        // helper fns
        var tooltip_interpolation_parser = function (color, d) {
            var defaultColor = '#0000FF';
            var red = false;
            
            // only for edi
            if (!_.includes(location.host, 'maps.edinsights.no')) {
                return defaultColor;
            }
            
            try {

                // hacky interpolation coloring scheme
                var a = _.toString(d.value);
                if (_.isEmpty(a)) return defaultColor;
                var i = _.includes(a, '00001');
                if (i) red = true;

                // second method, looking for when second decicmal is a 1
                var b = a.split('.');
                var c = b[1];
                if (_.isUndefined(c)) return defaultColor;
                var d = c.charAt(1);
                if (d == '1') red = true;

                // return color
                if (red) return 'red';
                return defaultColor;

            } catch (e) {
                return defaultColor;
            }
        }

        // helper fn
        var tooltip_html_parser = function (data) {
            var d = data[0];
            var tooltip_value = d.value;
            var tooltip_title = moment(d).format("DD.MM.YYYY");
            var tooltip_value_color = tooltip_interpolation_parser(null, d);
            var tooltip_html = '<table class="c3-tooltip"><tbody><tr><th colspan="2">' + tooltip_title + '</th></tr><tr class="c3-tooltip-name--mm"><td class="name"><span style="background-color:' + tooltip_value_color + '"></span>mm</td><td class="value">' + tooltip_value + '</td></tr></tbody></table>';
            return tooltip_html;
        }

        // CHART SETTINGS
        var chartSettings = {
            interaction : true,

            bindto: _C3Container,

            size: {
                height: app._rememberChartSizeHeight || 300,
                width : app._rememberChartSizeWidth || _width
            },

            point : {
                show : false,
                r: 3
            },

            grid: {
                y: { show: true },
                x: { show: true }
            },

            legend: {
                show: false
            },      

            zoom : {
                enabled : false
            },

            data: {

                xs: {
                    mm: 'field_x',
                    regression : 'reg_x'
                },

                columns: _columns,

                colors : {
                    mm: '#0000FF',
                    regression: '#C83333',
                },
                types: {
                    mm : 'scatter',
                    regression : 'line'
                },
                color : tooltip_interpolation_parser,
            },

            axis: {

                x: {
                    type: 'timeseries',
                    localtime: false,
                    tick: {
                            format: '%Y',
                            values: [],
                            multiline: true
                    }
                },

                y: {
                    max : range,
                    min : -range,
                    tick: {
                        format: function (d) { 
                            // return d;
                            // console.log('d', d);
                            var f = (Math.floor(d * 100) / 100);
                            // console.log('f:', f);
                            return f;
                        }
                    }
                }
            },

            tooltip: {
                grouped : true,
                // format: {
                //     title: function (d) { 
                //         var nnDate = moment(d).format("DD.MM.YYYY");
                //         return nnDate;
                //     }
                // }
                contents : function (data) {
                    var d = data[0];
                    var tooltip_value = d.value;
                    var tooltip_title = moment(d.x).format("DD.MM.YYYY");
                    var tooltip_value_color = tooltip_interpolation_parser(null, d);
                    var tooltip_html = '<table class="c3-tooltip"><tbody><tr><th colspan="2">' + tooltip_title + '</th></tr><tr class="c3-tooltip-name--mm"><td class="name"><span style="background-color:' + tooltip_value_color + '"></span>mm</td><td class="value">' + tooltip_value + '</td></tr></tbody></table>';
                    return tooltip_html;
                }
                
            },

            color: {
                pattern: ['#000000']
            }               
        };

        // create chart
        var chart = this._chart = c3.generate(chartSettings);

        // add zoom events
        this._addChartEvents(_C3Container);

        // add regression button
        this._addRegressionButton();

        // add CSV button
        this._addCSVButton();

        return _C3Container;
    },



    _addCSVButton : function () {
        var button = M.DomUtil.create('div', 'csv-button-wrapper', this._footerContainer, 'Export as CSV');
        button.setAttribute('title', 'Export as CSV');
        M.DomEvent.on(button, 'click', this._exportCSV, this);
    },

    _exportCSV : function () {

        // get data
        var csv_data = this._currentChartData.meta;

        // create csv
        var csv = [];
        _.each(csv_data, function (c) {
            var value = c[1];
            var key = moment(c[0], "YYYYMMDD");

            // format dates
            var k = key.isValid() ? key.format('YYYY-MM-DD') : c[0];
            var item = [k, value].join(', ')

            // push
            csv.push(item);
        });

        // parse
        csv = csv.join('\n');
        
        // create csv blob
        var a = window.document.createElement('a');
        a.href = window.URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
        a.download = this._chartTitle + '.csv'; // remove spaces

        // Append anchor to body.
        document.body.appendChild(a);
        a.click();

        // Remove anchor from body
        document.body.removeChild(a);

        // log
        app.log('exported:csv');

    },

    _addRegressionButton : function () {

        var w = M.DomUtil.create('div', 'regression-button-wrapper', this._footerContainer);

        this.regressionButton = new M.button({ 
            type      : 'switch',
            isOn      : false,
            right     : false,
            id        : 'regression-button',
            appendTo  : w,
            fn        : this._updateRegression.bind(this),
            className : 'relative-switch'
        });

        this._regressionButtonWrapper = w;

        // label
        var label = M.DomUtil.create('label', 'invite-permissions-label', w);
        label.htmlFor = 'regression';
        label.appendChild(document.createTextNode('Regression'));
    },

    _updateRegression : function (e) {

        var elem = e.target;
        var on = elem.getAttribute('on');

        if ( on == 'false' || !on ) {

            M.DomUtil.addClass(elem, 'switch-on');
            elem.setAttribute('on', 'true');

            // get regression 
            var reg = this._calculateRegression();
            var x = this._c3Obj.d3array.x;

            var reg_y = [reg[0], reg[1], reg[reg.length-1]];
            var reg_x = ['reg_x', x[1], x[x.length-1]];

            // add to chart
            this._chart.load({
                columns: [reg_x, reg_y]
            });

        } else {

            M.DomUtil.removeClass(elem, 'switch-on');
            elem.setAttribute('on', 'false');

            this._chart.unload({
                ids : 'regression'
            });

        }
        
    },

    _addChartEvents : function (div) {

        // create throttled function
        this._throttledChartMousemove = _.throttle(this._onChartMousemove, 50);

        // mousewheel zoom on chart
        M.DomEvent.on(div, 'mousewheel', this._throttleChartMousemove, this); // prob leaking
    },

    _throttleChartMousemove : function (e) {
        L.DomEvent.stop(e); // stop other scrolling
        this._throttledChartMousemove(e);
    },

    _onChartMousemove : function (e) {

        // cross-browser wheel delta
        var e = window.event || e; // old IE support
        var delta = Math.max(-1, Math.min(1, (e.wheelDeltaY || -e.detail)));

        // only Y scroll
        if (e.wheelDeltaY == 0) return; // not IE compatible

        // size of step
        var d = this._range / 8;

        // find if y axis has negative values on top
        var axis_reversed = (this._chart.axis.max().y < 0);

        // zoom Y axis
        if (delta > 0) { // moving up

            // set range
            this._range = this._range += d;

            // update axis
            this._chart.axis.max(this._range);
            this._chart.axis.min(-this._range);
        
        } else { // moving down
            
            // set range
            this._range = this._range -= d;

            // dont go under 1
            if (axis_reversed) {
                if (this._range > 1) this._range = 1;
            } else {
                if (this._range < 1) this._range = 1;
            }

            // update axis
            this._chart.axis.max(this._range);
            this._chart.axis.min(-this._range);
        }

    },

    // Create data object
    createC3dataObj : function (c3Obj) {

        var data = c3Obj.data;
        var meta = c3Obj.meta;      
        var d3array = c3Obj.d3array;
        var precision = c3Obj.precision || 1;

        // already stored tooltip (edited, etc.)
        if (meta) {     

            // add meta to tooltip
            for (var m in meta.fields) {

                var field = meta.fields[m];

                // only add active tooltips
                if (field.on) {

                    // get key/value
                    var _val = parseFloat(data[field.key]).toString().substring(0,10);
                    var _key = field.title || field.key;

                    // divide by precision
                    _val = _val / precision;

                    this.C3dataObjBuilder(_key, _val, d3array);
                }
            }

        // first time use of meta.. (or something)
        } else {

            for (var key in data) {

                var _val = parseFloat(data[key]).toString().substring(0,10);
                if (_val == 'NaN') _val = data[key];
                var _key = key;

                // divide by precision
                _val = parseFloat(_val) / precision;

                this.C3dataObjBuilder(_key, _val, d3array);
            }
        }

        this._c3object = c3Obj;

        return c3Obj;
    },


    // Split time series from other meta
    // TODO: fix this sheeet
    C3dataObjBuilder : function (_key, _val, d3array) {

        // Stop if disabled date in timeseries
        if ( this.popupSettings.timeSeries && this.popupSettings.timeSeries[_key] ) {
            if ( !this.popupSettings.timeSeries[_key].on ) return;
        }

        var isDate = M.Tools.validateDateFormat(_key);

        // CREATE DATE SERIES
        // CREATE DATE SERIES
        if ( isDate ) {

            // Create Legible Date Value
            var nnDate = new Date(isDate);

            // DATE
            d3array.x.push(nnDate);

            // VALUE
            d3array.y.push(_val);


            // Get only year
            // var year = moment(isDate).format("YYYY");
            // var chartTick = new Date(year);

            var cleanDate = moment(isDate);
            var chartTick = new Date(cleanDate);

            var newTick = true;


            // Calculate the ticks
            d3array.ticks.forEach(function(ct) { 

                // Avoid duplicates... (must set toUTCString as _date is CEST time format, while chartTick is CET)
                if ( ct == chartTick ) newTick = false; 

            })

            if ( newTick ) d3array.ticks.push(chartTick);

        // CREATE META FIELDS
        // CREATE META FIELDS
        } 

        // Exclude the generated fields
        if ( _key.substring(0,7) == 'the_geo') return;
        d3array.meta.push([_key, _val])

    },

    _getWuLayerFromPostGISLayer : function (postgis_layer_id) {
        var layers = app.activeProject.getLayers();
        var layerUuid = _.find(layers, function(layer) {
            if (!layer || !layer.store || !layer.store.data || !layer.store.data.postgis) return false;
            return layer.store.data.postgis.layer_id == postgis_layer_id;
        });
        return layerUuid;       
    }

});

M.chart = function (options) {
    return new M.Chart(options);
}