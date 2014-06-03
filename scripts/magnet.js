/*
 *  Magnet - v.1.1.2
 *  A jQuery plugin to create filterable layouts.
 *  http://fokkusudesign.com/magnet/magnet.html
 *
 *  Developed by Haundo Studio
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {
	// undefined is used here as the undefined global variable in ECMAScript 3 is
	// mutable (ie. it can be changed by someone else). undefined isn't really being
	// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
	// can no longer be modified.

	// window and document are passed through as local variable rather than global
	// as this (slightly) quickens the resolution process and can be more efficiently
	// minified (especially when both are regularly referenced in your plugin).

	// Create the defaults once
	var pluginName = 'magnet',
		defaults = {
			columns: {
				items: 10
			},
			containerSelector: '.magnet',
			containerStyle: { position: 'relative', overflow: 'hidden' },
			duration: 800,
			filter: '*',
			filterSelector: '.magnet-filter',
			gutter: null,
			hiddenClass: 'magnet-hidden',
			hiddenStyle: { opacity: 0, scale: 0 },
			itemSelector: '.magnet-item',
			itemStyle: { position: 'absolute' },
			layoutMode: 'masonry',
			rows: {
				items: 10
			},
			visibleStyle: { 'opacity': '1', 'scale': '1' }
		};

	// The actual plugin constructor
	function Plugin ( element, options ) {
		this.element = element;
		this.$element = element;
		// jQuery has an extend method which merges the contents of two or
		// more objects, storing the result in the first object. The first object
		// is generally empty as we don't want to alter the default options for
		// future instances of the plugin
		this.settings = $.extend( {}, defaults, options );
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}	

	Plugin.prototype = {
		init: function () {
			// Place initialization logic here
			// You already have access to the DOM element and
			// the options via the instance, e.g. this.element
			// and this.settings
			// you can add more functions like the one below and
			// call them like so: this.yourOtherFunction(this.element, this.settings).
			var self = this;

			self.$id = $('#' + self.element.id);
			self.$container = $(self.$id).find(self.settings.containerSelector);
			self.$item = $(self.$id).find(self.settings.itemSelector);
			
			self.containerWidth;
			self.items = {
				i: [],
				w: [],
				h: [],
				x: [],
				y: [],
				v: []
			};

			self.getContainerWidth();
			self.setStyles();
			self.fetchItems();
			self.filterItems();
			self.layoutItems();
			self.resizeContainer();
			self.onResize();
			self.onClick();
		},

		getContainerWidth: function() {
			var self = this,
					$container = self.$container;

			self.containerWidth = $container.width();
		},

		setStyles: function () {
			var self = this,
					$container = self.$container,
					$item = self.$item;

			$container.css(self.settings.containerStyle);
			$item.css(self.settings.itemStyle);
			$item.css({
				'margin-right': self.settings.gutter + 'px',
				'margin-bottom': self.settings.gutter + 'px'
			});
		},

		fetchItems: function () {
			var self = this,
					$item = self.$item,
					i = 0;

			$item.each(function(){
				var $this = $(this),
					w = $this[0].getBoundingClientRect().width + ($this.outerWidth(true) - $this.outerWidth()),
					h = $this.outerHeight(true);

				self.items.i.push(i);
				self.items.w.push(w);
				self.items.h.push(h);
				self.items.v.push(true);

				i++;
			});
		},

		filterItems: function () {
			var self = this,
					$item = self.$item,
					i = 0;

			$item.each(function(){
				var $this = $(this),
						v = true;

				if(self.settings.filter === '*' || $this.hasClass(self.settings.filter)){
				 	$this.removeClass(self.settings.hiddenClass);
				}else{
					v = false;
					$this.addClass(self.settings.hiddenClass);
				}

				self.items.v[i] = v;

				i++;
			});
		},

		layoutItems: function () {
			var self = this,
					layout = self.settings.layoutMode,
					items = self.items,
					$container = self.$container,
					$item = self.$item,
					i = 0, // Items
					c = 1, // Columns
					r = 1, // Rows
					n, // Next item
					height = 0,
					min_height = self.items.h[0],
					max_height = 0,
					width = 0,
					max_width = 0,
					exit = true, // Exit
					flag = false; // Found

			if(layout == 'masonry'){
				$item.each(function(){
					var $this = $(this);				

					if(items.v[i]){
						items.x[i] = width;
						items.y[i] = height;

						do{
							flag = false;

							for(j = i - 1; j >= 0 && !flag; j--){ // Loop all the rows from current to first
								if(items.v[j]){
									condition_1 = items.x[i] + items.w[i] > items.x[j] && items.x[i] + items.w[i] < items.x[j] + items.w[j];
									condition_2 = items.x[j] + items.w[j] > items.x[i] && items.x[j] + items.w[j] < items.x[i] + items.w[i];
									condition_3 = items.x[i] == items.x[j];
									condition_4 = items.x[i] + items.w[i] == items.x[j] + items.w[j];
									condition_5 = items.y[j] + items.h[j] > items.y[i];
									condition = (condition_1 || condition_2 || condition_3 || condition_4) && condition_5;

									if(condition){
										flag = true;

										width = items.x[j];

										if(width + items.w[i] + items.w[j] <= self.containerWidth){
											width += items.w[j];
										}else{
											width = 0;
											height += min_height;
										}

										items.x[i] = width; //  Update item position
										items.y[i] = height;
									}
								}
							}

							if(flag){
								exit = false; //Restart the loop if condition is true
							}else{
								exit = true;
							}

						}while(!exit);

						self.animateItems($this, width, height, true);

						if(items.h[i] < min_height){
							min_height = items.h[i];
						}

						n = i + 1; //Next item
						while(items.v[n] == false){ //Get next visible item
							n++;
						}
						
						if(width + items.w[i] + items.w[n] <= self.containerWidth){
							width += items.w[i];
						}else{
							height += min_height;

							width = 0;
							min_height = items.h[n];
						}

					}else{
						self.animateItems($this, items.x[i], items.y[i], false);
					}

					i++;
				});
			}else if(layout == 'tiled'){
				$item.each(function(){
					var $this = $(this);				

					if(items.v[i]){
						items.x[i] = width;
						items.y[i] = height;

						for(j = i - 1; j >= 0; j--){ // Loop all the rows from current to first
							if(items.v[j]){
								condition_1 = items.x[i] + items.w[i] > items.x[j] && items.x[i] + items.w[i] < items.x[j] + items.w[j];
								condition_2 = items.x[j] + items.w[j] > items.x[i] && items.x[j] + items.w[j] < items.x[i] + items.w[i];
								condition_3 = items.x[i] == items.x[j];
								condition_4 = items.x[i] + items.w[i] == items.x[j] + items.w[j];
								condition_5 = items.y[j] + items.h[j] > items.y[i];
								condition = (condition_1 || condition_2 || condition_3 || condition_4) && condition_5;
								if(condition){								
									if(width + items.w[i] > self.containerWidth){
										width = 0;
									}else{
										height = items.h[j] + items.y[j];
									}

									items.x[i] = width; // Update item position
									items.y[i] = height;
								}
							}
						}

						self.animateItems($this, width, height, true);

						if(height > max_height) { // Set height to the add of minimum height of rows
							height = max_height;
						}

						if(items.h[i] < min_height){
							min_height = items.h[i];
						}

						n = i + 1; // Next item
						while(items.v[n] == false){ // Get next visible item
							n++;
						}

						if(width + items.w[i] + items.w[n] <= self.containerWidth){
							width += items.w[i];
						}else{
							max_height += min_height;
							width = 0;
							height = max_height;
							min_height = items.h[n];
						}

					}else{
						self.animateItems($this, items.x[i], items.y[i], false);
					}

					i++;
				});
			}else if(layout == 'rows'){
				$item.each(function(){
					var $this = $(this);			

					if(items.v[i]){
						items.x[i] = width;
						items.y[i] = height;

						self.animateItems($this, width, height, true);

						if(items.h[i] > max_height){
							max_height = items.h[i];
						}

						n = i + 1; //Next item
						while(items.v[n] == false){ //Get next visible item
							n++;
						}

						if(width + items.w[i] + items.w[n] <= self.containerWidth && c < self.settings.rows.items){
							width += items.w[i];
						}else{
							height += max_height;
							c = 0;
							width = 0;
							max_height = 0;
						}

						c++;
					}else{
						self.animateItems($this, items.x[i], items.y[i], false);
					}

					i++;
				});
			}else if(layout == 'columns'){
				$item.each(function(){
					var $this = $(this);			

					if(items.v[i]){
						items.x[i] = width;
						items.y[i] = height;

						self.animateItems($this, width, height, true);

						if(items.w[i] > max_width){
							max_width = items.w[i];
						}

						n = i + 1; //Next item
						while(items.v[n] == false){ //Get next visible item
							n++;
						}

						if(r < self.settings.columns.items){
							height += items.h[i];
						}else{
							width += max_width;
							r = 0;
							height = 0;
							max_width = 0;
						}

						r++;
					}else{
						self.animateItems($this, items.x[i], items.y[i], false);
					}

					i++;
				});
			}else if(layout == 'vertical'){
				$item.each(function(){
					var $this = $(this);

					if(items.v[i]){
						items.x[i] = width;
				 		items.y[i] = height;

						self.animateItems($this, width, height, true);
						height += items.h[i];
					}else{
						self.animateItems($this, items.x[i],  items.y[i], false);
					}	

					i++;
				});
			}else if(layout == 'horizontal'){
				$item.each(function(){
					var $this = $(this);

					if(items.v[i]){
						items.x[i] = width;
				 		items.y[i] = height;

						self.animateItems($this, width, height, true);
						width += items.w[i];
					}else{
						self.animateItems($this, items.x[i],  items.y[i], false);
					}	

					i++;
				});
			}else{
				layout = 'masonry';
				self.layoutItems();
			}
		},

		animateItems: function ($this, w, h, visible) {
			var self = this;

			if(visible){
				opacity = self.settings.visibleStyle.opacity;
				scale = self.settings.visibleStyle.scale;
			}else{
				opacity = self.settings.hiddenStyle.opacity;
				scale = self.settings.hiddenStyle.scale;	
			}

			$this.css({
				'transform': 'translate3d(' + w + 'px,' + h + 'px, 0px) scale3d(' + scale + ', ' + scale + ', ' + scale + ')',
				'opacity': opacity,
				'transition': self.settings.duration + 'ms'
			});
		},

		resizeContainer: function () {
			var self = this,
					layout = self.settings.layoutMode,
					items = self.items,
					$container = self.$container,
					$item = self.$item,
					i = 0,
					width = 0,
					height = 0;
			
			if(layout == 'columns' || layout == 'horizontal'){
				for(i = 0; i < items.v.length; i++){
					if(items.v[i]){
						if(items.w[i] + items.x[i] > width){
							width = items.w[i] + items.x[i];
						}
					}
				}

				width += $container.outerWidth() - self.containerWidth; // Add container border + padding + margin

				$container.css('width', width);
			}

			for(i = 0; i < items.v.length; i++){
				if(items.v[i]){
					if(items.h[i] + items.y[i] > height){
						height = items.h[i] + items.y[i];
					}
				}
			}

			height += $container.outerHeight() - $container.height();

			$container.css({
				'height': height,
				'transition': self.settings.duration + 'ms'
			});
		},
		
		onClick: function () {
			var self = this,
					$filter = $(self.$id).find(self.settings.filterSelector);

			$filter.on('click', '[data-filter]', function () {
				var $this = $(this);

				if($this.parent().is($filter)) { // Check if clicked element is direct child of filterSelector
					$this.addClass('active').siblings().removeClass('active'); // Add active to clicked element, remove it from non-clicked elements
				}else{
					$this.parent().addClass('active').siblings().removeClass('active'); // Add active to parent of the clicked element, remove it from parent of non-clicked elements
				}

				self.settings.filter = $this.attr('data-filter'); // Get filter of clicked element
				self.getContainerWidth();
				self.filterItems();
				self.layoutItems();
				self.resizeContainer();
			});
		},

		onResize: function () {
			var self = this;

			$(window).resize(function(){
				self.getContainerWidth();
				self.layoutItems();
				self.resizeContainer();
			});
		}
	};

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[ pluginName ] = function ( options ) {
		this.each(function() {
			if ( !$.data( this, 'plugin_' + pluginName ) ) {
				$.data( this, 'plugin_' + pluginName, new Plugin( this, options ) );
			}
		});
		// chain jQuery functions
		return this;
	};

})( jQuery, window, document );