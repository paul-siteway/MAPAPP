(function() {
	
	window.MapApp = {
		Models: {},
		Collections: {},
		Views: {}
	};
	window.template = function (id) {
		return _.template($('#' + id).html());
	};
    
	// 
	// GLOBAL EVENTS 
	// 
	var vents = _.extend({}, Backbone.Events);


	// 
	// BB ROUTES
	// 

	MapApp.Router = Backbone.Router.extend({
		routes: {
			'': 'index',
			'show/:id': 'show',
			'showAll': 'showAll',
			'add/:id/*title': 'add',
			'search/*title': 'search',
			'*other': 'Default'
		},
		index: function () {
			console.log('index');
		},
		show: function (id) {
			console.log('show:'+id) ;
			vents.trigger('ort:show', id);
		},
		showAll: function (id) {
			vents.trigger('ort:showAll', id);
		},
		add: function (id,title) {
			console.log('add id:'+id+' title:'+title) ;
			//EVENT SHOULD FIRE HERE
		},
		search: function (title) {
			console.log('search title:'+title) ;
			//EVENT SHOULD FIRE HERE
		},
		Default: function (other) {
			console.log('Not sure wht you tying to do: you acessed:'+other) ;
			//EVENT SHOULD FIRE HERE
		} 
	});

	MapApp.router = new MapApp.Router;
	Backbone.history.start();


	// 
	// ########  ORT M O D E L  ######## 
	// 
	MapApp.Models.Ort = Backbone.Model.extend({

		defaults: {
			title: 'Ich bin der Default Titel',
			lat: 51.511214,
			lon: -0.119824,
			html: 'ich bin der Default HTML Inhalt'
		},
		sync: function () { return false; },
		validate: function(attrs){
			if(	! _.isNumber(attrs.lat)	){
				return 'lat Must not be empty';
			}
			if(	! _.isNumber(attrs.lon) ){
				return 'lon Must not be empty';
			}
			if(	!$.trim(attrs.title) ){
				return 'title Must not be empty';
			}
		},

		display: function(){
			return this.get('title') +' is displaying';
		}

	});

	// 
	// ######## ORTE C O L L E C T I O N ######## / A list or Orte
	// 

	MapApp.Collections.Orte = Backbone.Collection.extend({
		model: MapApp.Models.Ort
	});

	// 
	// ORTE VIEW  - View for all Orte
	// 

	MapApp.Views.Orte = Backbone.View.extend({
		tagName: 'ul' ,
		initialize: function() {
			this.collection.on('add', this.addOne, this);
		},
		render: function(){
			this.collection.each(this.addOne, this);
			return this;
		},
		addOne: function (ort) {
			var ortView = new MapApp.Views.Ort({model: ort});
			this.$el.append(ortView.render().el);
		}
	});

	// 
	// ########  ORT V I E W   ######## 
	// 
	MapApp.Views.Ort = Backbone.View.extend({
		tagName : "li", 
		className: 'ort',
		events: {
			'click strong': 'showAlert',
			'click button': 'destroy'
		},
		template: template('ortTemplate'),
		initialize: function(){
			this.model.on('change', this.render, this );
			this.model.on('destroy', this.remove, this );
			
		},
		render: function(){
			this.$el.html(	this.template(this.model.toJSON())	);
			vents.trigger('change');
			return this;
		}, 
		showAlert: function () {
			var newOrtTitle = prompt('edit the Title:',this.model.get('title') );
			if(!newOrtTitle) return;
			this.model.set('title', newOrtTitle);
		},
		destroy: function () {
			this.model.destroy();
		},
		remove: function () {
			this.$el.remove();
		}
	});


	// 
	// ########  M A P ++ V I E W   ######## 
	// 
	 

	MapApp.Views.Map = Backbone.View.extend({
		el: '#mapActions',
		events: {
			'click #showAll' : 'showAll',
			'click #removeAll' : 'removeAll'

		},
		initialize: function(){
			// vents.on('ort:show', this.showOrt, this);
			vents.on('ort:showAll', this.showAll, this);
			vents.on('change', this.showAll, this);
			this.collection.on('add', this.showAll, this);
			this.collection.on('remove', this.showAll, this);
			
		},
		showAll: function() {
			this.removeAll();
			this.collection.each(this.showOrt, this);
		},
		removeAll: function () {
			MapApp.removeMarkers();
		},
		showOrt: function(ort){
			console.log('showORT In MAP VIEW');			
			var lat = ort.get('lat');
			var lon = ort.get('lon');
			var title = ort.get('title');
			var html = ort.get('html');
			MapApp.addLocationToMap(lat, lon, title, html);
		},
		destroyMarker: function (id) {
			this.model.destroy();
		},
		remove: function () {
			this.$el.remove();
		}
	});

	// 
	// ########  ADD ORT V I E W   ######## 
	// 
	

	MapApp.Views.AddOrt = Backbone.View.extend({
		el: '#addOrt',
		events: {
			'submit': 'submit'
		},
		initialize: function(){
		}, 
		submit: function(e){
			e.preventDefault();
			var newTitle = $(e.currentTarget).find('input.title').val();
			var newLat = $(e.currentTarget).find('input.lat').val();
			var newLon = $(e.currentTarget).find('input.lon').val();
			// if(! $.trim(newTitle) ) return "title must not be empty!";
			var ort = new MapApp.Models.Ort();
			ort.set({title: newTitle, lat: newLat, lon: newLon});
			this.collection.add(ort);
			//console.log('newTitle is:'+newTitle+' isValid:'+$.trim(newTitle));
		}
	});


	// 
	// ########  NEW COLLECTION  ######## 
	// 
	

	MapApp.orteCollection = new MapApp.Collections.Orte([
		{	
			id: 0,
			title: "Hamburg", 
			lat: 53.551085,
			lon: 9.993682, 
			html: "<strong>ich bin fett</strong> und jetzt nicht mehr"
		},
		{
			id: 1,
			title: "Berlin", 
			lat: 52.519171, 
			lon: 13.406091,
			html: "<small>ich bin small</small> und jetzt nicht mehr"
		},
		{
			id: 2,
			title: "Stockholm", 
			lat: 59.328930, 
			lon: 18.064910,
			html: "<h4>ich bin h4</h4> und jetzt nicht mehr"
		},
		{
			id: 3,
			title: "Belin", 
			lat: 52.519171, 
			lon: 13.406091,
			html: "<small>ich bin small</small> und jetzt nicht mehr"
		},
		{
			id: 4,
		}
	]);

	var orteView = new MapApp.Views.Orte({collection: MapApp.orteCollection});

	$('#orteView').append(orteView.render().el);

	var addOrtView = new MapApp.Views.AddOrt({collection: MapApp.orteCollection});

	new MapApp.Views.Map({collection: MapApp.orteCollection});

	///CUSTOM FUNCTIONS
	MapApp.addLocationToMap = function (lat, lon, title, html) {
		MapApp.map.addMarker({
			lat: lat,
			lng: lon,
			title: title,
			click: function(e) {
			//alert('You clicked in this marker '+title);
			},
			infoWindow: {
				content: title+': '+html
			}
		});
		return 'marker added';
	};

	MapApp.removeMarkers = function () {
		MapApp.map.removeMarkers();
	};


	MapApp.map = new GMaps({
        div: '#map',
        lat: 53.571148,
        lng: 10.024898,
        zoom: 3
      });

})();//siaf
