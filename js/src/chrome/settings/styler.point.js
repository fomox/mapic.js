M.Styler.Point = M.Styler.extend({

	type : 'point',

	// creates content of point container
	_createOptions : function () {

		// color
		this._createColor();

		// opacity
		this._createOpacity();

		// pointsize
		this._createPointsize();

		// blend mode
		this._createBlendMode();

		// blend mode
		this._createInterpolated();

		// targets
		this._createTargets();

	},

	_preSelectOptions : function () {

		// open relevant subfields
		this._initSubfields(this.carto().color.column, 'color');
		this._initSubfields(this.carto().opacity.column, 'opacity');
		this._initSubfields(this.carto().pointsize.column, 'pointsize');
	},

	_clearOptions : function () {

		var content = this._content[this.type];

		// return if not content yet
		if (_.isEmpty(content)) return;

		// get divs
		var color_wrapper = content.color.line.container;
		var color_children = content.color.line.childWrapper;
		var opacity_wrapper = content.opacity.line.container;
		var opacity_children = content.opacity.line.childWrapper;
		var pointsize_wrapper = content.pointsize.line.container;
		var pointsize_children = content.pointsize.line.childWrapper;
		var targets 		= content.targets.wrapper;
		var blendmode 		= content.blendmode.line.container;
		

		// remove divs
		color_wrapper && M.DomUtil.remove(color_wrapper);
		color_children && M.DomUtil.remove(color_children);
		opacity_wrapper && M.DomUtil.remove(opacity_wrapper);
		opacity_children && M.DomUtil.remove(opacity_children);
		pointsize_wrapper && M.DomUtil.remove(pointsize_wrapper);
		pointsize_children && M.DomUtil.remove(pointsize_children);
		targets && 		M.DomUtil.remove(targets);
		blendmode && 		M.DomUtil.remove(blendmode);
	},

	_addPointSizeFields : function (column) {

		// get wrapper
		var childWrapper = this._content[this.type].pointsize.line.childWrapper;

		// clear old
		childWrapper.innerHTML = '';

		// get min/max values
		var minMax  = this.carto().pointsize.range || [1,10];

		// line
		var line = new M.fieldLine({
			id        : 'minmaxpointsize',
			appendTo  : childWrapper,
			title     : 'Min/max size',
			input     : false,
			className : 'sub-line'
		});

		// Inputs
		var input = new M.button({
			id 	  : 'minmaxpointsize',
			type 	  : 'dualinput',
			right 	  : true,
			appendTo  : line.container,
			value     : minMax,
			fn        : this.savePointSizeDualBlur.bind(this),
			minmax    : minMax,
			tabindex  : [this.tabindex++, this.tabindex++]
		});



		// rememeber 
		this._content[this.type].pointsize.minmax = {
			line : line,
			input : input
		};

		// save carto
		this.carto().pointsize.column  = column;
		this.carto().pointsize.range = minMax;

		this.markChanged();

	}

});