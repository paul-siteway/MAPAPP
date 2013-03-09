(function() {
	

	//create a namespace

	window.MapApp = {
		Models: {},
		Collections: {},
		Views: {}
	};
	window.template = function (id) {
		return _.template($('#' + id).html());
	};
    




	// ########################################
	// ########## CUSTOM FUNCTIONS ############
	// ########################################
	MapApp.addLocationToMap = function (id, lat, lon, title){
		MapApp.map.addMarker({
			lat			: lat,
			lng			: lon,
			title		: title,
			html		: "",
			click: function(e) {
			//alert('You clicked in this marker '+title);
			},
			infoWindow: {
				content: $('#orteView .ort').eq(id).html()
			}
		});
		return 'marker added';
	};

	MapApp.removeMarkers = function () {
		MapApp.map.removeMarkers();
	};

	//Initialize the Google Map
	MapApp.map = new GMaps({
        div: '#map',
        lat: 53.571148,
        lng: 10.024898,
        zoom: 3
      });




	// ################################
	// ######### GLOBAL EVENTS ########
	// ################################
	var vents = _.extend({}, Backbone.Events);


	// ################################
	// ########## BB ROUTES ##########
	// ################################

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


	// ################################
	// ########  ORT M O D E L  #######
	// ################################
	MapApp.Models.Ort = Backbone.Model.extend({

		defaults: {
			title: 'Ich bin der Default Titel',
			lat: 51.511214,
			lon: -0.119824,
			logo: 'http://lorempixel.com/80/80/people/',
			nationalCLC: 'NationalCLC here',
			actionLines: 'Action Lines here',
			eLLType: 'Type of E&LL facility',
			link: 'http://www.google.de'
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

	// ################################################################
	// ######## ORTE C O L L E C T I O N ######## / A list or Orte
	// ################################ ################################

	MapApp.Collections.Orte = Backbone.Collection.extend({
	
		filterType : function(ellType){
			return _(this.filter(function(data){
				return data.get('eLLType') == ellType;
			}))
		},
		searchTitle : function(letters){
			if(letters == "") return this;

			var pattern = new RegExp(letters, 'gi');
			return _(this.filter(function(data){
				return pattern.test(data.get('title'))
			}))
		},
		model: MapApp.Models.Ort
	});

	// ################################
	// ########## ORTE VIEW  ########## - View for all Orte
	// ################################

	MapApp.Views.Orte = Backbone.View.extend({
		tagName: 'div' ,
		events: {
			'keyup #searchTitle' : 'search',
			'change #filterType' : 'filterType',
		},
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
		},
		search : function (e) {
			var letters = $('#searchTitle').val();
			this.render(this.collection.searchTitle(letters));
		},
		filterType: function(e){
			var type = $('#llType').find('option:selected').val();
			if(type == '') status = 0;
			this.render(this.collection.filterType(type));
		}
	});



	// ################################
	// ########  ORT V I E W   ######## 
	// ################################

	 
	MapApp.Views.Ort = Backbone.View.extend({
		tagName : "div", 
		className: 'ort',
		events: {
			'click' : 'showOrtInMap',
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
		},
		showOrtInMap: function () {
			console.log(this.model.get('id'));
			var lat = this.model.get('lat');
			var lon = this.model.get('lon');
			MapApp.map.setCenter(lat, lon);
			MapApp.map.setZoom(6);
		}
	});


	// ########################################
	// ##########  M A P ++ V I E W   ######### 
	// ########################################
	 

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
			this.showAll();
			
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
			var logo = ort.get('logo');
			var id = ort.get('id');
			var nationalCLC = ort.get('nationalCLC');
			var actionLines = ort.get('actionLines');
			var eLLType = ort.get('eLLType');
			var link = ort.get('link');
			MapApp.addLocationToMap(id, lat, lon, title);
		},
		destroyMarker: function (id) {
			this.model.destroy();
		},
		remove: function () {
			this.$el.remove();
		}
	});

	// ########################################
	// ##########  ADD ORT V I E W   ########## 
	// ########################################
	

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


	// ########################################
	// ###########  NEW COLLECTION  ########### 
	// ########################################
	

	MapApp.orteCollection = new MapApp.Collections.Orte([
		{	
			id: 0,
			title: "Experience & Living Lab Hamburg", 
			lat: 53.551085,
			lon: 9.993682, 
			html: "<strong>ich bin fett</strong> und jetzt nicht mehr",
			logo: "http://lorempixel.com/g/80/80/nature/",
			nationalCLC: 'Berlin',
			actionLines: 'Computing in the Cloud, Smart Energy Systems',
			eLLType: 'Office',
			link: 'http://www.google.de'

		},
		{
			id: 1,
			title: "Experience & Living Lab Berlin", 
			lat: 52.519171, 
			lon: 13.406091,
			html: "<small>ich bin small</small> und jetzt nicht mehr",
			logo: "http://lorempixel.com/g/80/80/sports/",
			nationalCLC: 'Trento',
			actionLines: 'Networking Solutions for Future Media',
			eLLType: 'Office',
			link: 'http://www.google.de'

		},
		{
			id: 2,
			title: "Experience & Living Lab Stockholm", 
			lat: 59.328930, 
			lon: 18.064910,
			html: "<h4>ich bin h4</h4> und jetzt nicht mehr",
			logo: "http://lorempixel.com/g/80/80/cats/",
			nationalCLC: 'Helsinki',
			actionLines: 'Computing in the Cloud,Smart Spaces',
			eLLType: 'Office',
			link: 'http://www.google.de'

		},
		{
			id: 3,
			title: "Experience & Living Lab Berlin", 
			lat: 52.519171, 
			lon: 13.406091,
			html: "<small>ich bin small</small> und jetzt nicht mehr",
			logo: "http://lorempixel.com/g/80/80/abstract/",
			nationalCLC: 'Eindhoven',
			actionLines: 'Health & Wellbeing, Smart Energy Systems',
			eLLType: 'Lab',
			link: 'http://www.google.de'
		},
		{
			id: 4
		}
	]);


	//########################################
	//########## CREATE VIEWS AND COLLECTIONS
	//########################################

	var orteView = new MapApp.Views.Orte({collection: MapApp.orteCollection});
	$('#orteView').append(orteView.render().el);
	var addOrtView = new MapApp.Views.AddOrt({collection: MapApp.orteCollection});
	new MapApp.Views.Map({collection: MapApp.orteCollection});



})();//siaf
