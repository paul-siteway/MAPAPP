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
    



	// ################################
	// ######### GLOBAL EVENTS ########
	// ################################
	MapApp.vents = _.extend({}, Backbone.Events);
	
	// ################################
	// ######### GLOBAL VARS   ########
	// ################################


	$('select#ellType').change(function(){
		MapApp.vents.trigger('filterbyType');	
	});
	

	MapApp.filterList = [];



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
				content: $('#orteView #ort'+id).html()
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


	MapApp.readProp = function (obj, prop) {
		return obj[prop];
	};




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
			MapApp.vents.trigger('ort:show', id);
		},
		showAll: function (id) {
			MapApp.vents.trigger('ort:showAll', id);
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
			lat: 51.511214,
			lon: -0.119824,
			title: 'Ich bin der Default Titel',
			logo: 'http://lorempixel.com/80/80/people/',
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





	// ################################
	// #####  SINGLE ORT V I E W   ####
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
			var id = this.model.get('id');
			this.$el.html( this.template(this.model.toJSON()) ).attr('id', 'ort'+id);
			MapApp.vents.trigger('change');
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



	// ################################
	// ########## ORTE VIEW  ########## - View for all Orte
	// ################################

	MapApp.Views.Orte = Backbone.View.extend({
		tagName: 'div' ,
		initialize: function() {
			this.collection.on('add', this.addOne, this);
			this.collection.on('reset', this.render, this);
			MapApp.vents.on('filterbyType', this.startFilterType, this);
			MapApp.vents.on('startSearch', this.search, this);
		},
		render: function(){
			console.log('redering ORTE VIEW');
			this.$el.html('');
			this.collection.each(this.addOne, this);
			return this;
		},
		renderFiltered : function(orte){

		$("#orteView").html("");
		orte.each(function(ort){
			var view = new MapApp.Views.Ort({
				model: ort,
				collection: this.collection
			});
			$("#orteView").append(view.render().el);
		});
		return this;
		},
		addOne: function (ort) {
			var ortView = new MapApp.Views.Ort({model: ort});
			this.$el.append(ortView.render().el);
		},
		startFilterType: function(){
			
			var type = $('#ellType').find('option:selected').val();
			console.log('startFilterType:' +type);
			this.collection.reset(this.collection.query({ eLLType: {$like: type}}) );
		}
	});
	

	// ########################################
	// #######  SILNGLE FILTER  VIEW   ######## 
	// ########################################
	
	

	MapApp.Views.Filter = Backbone.View.extend({
		tagName: 'select',
		className: 'span2',
		template: template('filterTemplate'),
		events: {
			'change' : 'selectChanged'
		},
		initialize: function () {
			// console.log('initialized Single Filter View');
		},
		render: function () {
			this.renderFilters();
			this.renderallOptions();
		},
		renderFilters: function () {
			var optionName = MapApp.filterList[this.options.index];
			//this.$el.html('<option value="'+optionName+'">'+optionName+'</option>' );
			this.$el.html( this.template( {optionName: optionName} ));	
		},
		renderallOptions: function () {
			// console.log('Rendering Options');
			var optionList = MapApp.optionenCollection.at(this.options.index).get('filteroptions');
			optionList = _.uniq(optionList);
			_.each(optionList, function (name) {
				if(_.isArray(name) || _.isUndefined(name) || _.isNull(name)) return;
				console.log(name);
				this.$el.append( this.template( {optionName: name} ));	
			},this);
			//MapApp.optionenCollection.at(this.options.index).get('filtername');
		},
		selectChanged :  function () {
			alert('hihi');
		}

	});


	// ########################################
	// ##########   FILTERS  VIEW   ########### 
	// ########################################
	
	MapApp.Views.Filters = Backbone.View.extend({
		tagName: 'div', 
		className: 'filters',
		initialize: function () {
			this.createFilterList();
			this.createOptionsLists();
			this.render();
		},
		createFilterList: function () {
			// console.log('creatingFilterList');
			//Empty the Filter list
			MapApp.filterList = [];
			//Lopp over all Locations in collection
			this.collection.each(function (ort) {
				//get only the Filterable Attributes
				var filterableList = ort.get('filterable');
				//Push each Attribute to List
				for (var key in filterableList) {
					MapApp.filterList.push(key);
				}
			});
			//Remove all dublicates
			MapApp.filterList = _.uniq(MapApp.filterList);			
		},
		createOptionsLists: function () {
			MapApp.optionsLists = {};
			//Go trough each Filter in the Filterlist
			_.each(MapApp.filterList,function (filtername, index){
					//Add a empty Model to ne optionen Collection
					MapApp.optionenCollection.add({});
					//Set the Filtername to the Model in Collection
					MapApp.optionenCollection.at(index).set('filtername',filtername);
					
					//Temp array for all Options
					var tempArray = [];
					//Go trough all Orte and get each FIltername
					MapApp.orteCollection.each(function (ort) {
						var option = ort.get('filterable')[filtername];
						tempArray.push(option);
				});
				MapApp.optionenCollection.at(index).set('filteroptions', tempArray);
			});

		},
		render: function () {
			////Filter trough all ITEMS
			_.each(MapApp.filterList, function (filter,index) {
				//for each vreate a new View.
				MapApp.filterView = new MapApp.Views.Filter({index:index}); 
				MapApp.filterView.render();
				this.$el.append(  MapApp.filterView.el );
			},this);
			return this;
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
			MapApp.vents.on('ort:showAll', this.showAll, this);
			MapApp.vents.on('change', this.showAll, this);
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


	// #############################
	// ########  COLLCTIONS ######## 
	// #############################



	MapApp.Collections.Orte = Backbone.QueryCollection.extend({
		model: MapApp.Models.Ort
	});


	//##



	MapApp.Models.option = Backbone.Model.extend({
		defaults: {
			filtername: 'Filtername',
			filteroptions: '[1,2,3,4]'
		}
	});

	MapApp.Collections.Optionen = Backbone.QueryCollection.extend({
		model: MapApp.Models.option
	});

	MapApp.optionenCollection = new MapApp.Collections.Optionen([]);



	//########################################
	//########## CREATE VIEWS AND COLLECTIONS
	//########################################

	MapApp.orteCollection = new MapApp.Collections.Orte([
		{	
			id: 0,
			title: "Experience & Living Lab Berlin",
			lat: 52.519171,
			lon: 13.406091, 
			logo: "http://lorempixel.com/g/80/80/nature/",
			filterable: {
				nationalCLC: 'Berlin',
				actionLines: ['Computing in the Cloud, Smart Energy Systems'],
				services: ['Service1','Service2','Service3','Service4'],
				eLLType: 'Office'
			},
			link: 'http://www.google.de'

		},
		{
			id: 1,
			title: "Experience & Living Lab Trento", 
			lat: 46.069692, 
			lon: 11.12108,
			logo: "http://lorempixel.com/g/80/80/sports/",
			filterable: {
				nationalCLC: 'Trento',
				actionLines: ['Networking Solutions for Future Media'],
				services: ['Service1','Service2','Service3','Service4'],
				eLLType: 'Office'
			},
			link: 'http://www.google.de'

		},
		{
			id: 2,
			title: "Experience & Living Lab Helsinki", 
			lat: 60.169845, 
			lon: 24.938551,
			logo: "http://lorempixel.com/g/80/80/cats/",
			filterable: {
				nationalCLC: 'Helsinki',
				actionLines: ['Computing in the Cloud','Smart Spaces'],
				services: ['Service1','Service2','Service3','Service4'],
				eLLType: 'University'
			},
			link: 'http://www.google.de'

		},
		{
			id: 3,
			title: "Experience & Living Lab Eindhoven", 
			lat: 51.441642, 
			lon: 5.469723,
			logo: "http://lorempixel.com/g/80/80/abstract/",
			filterable: {
				nationalCLC: 'Eindhoven',
				actionLines: ['Health & Wellbeing', 'Smart Energy Systems'],
				services: ['Service1','Service2','Service3','Service4'],
				eLLType: 'Lab'
			},
			link: 'http://www.google.de'
		},
		{
			id: 4,
			filterable: {}
		}
	]);

	
	

	MapApp.filterView = new MapApp.Views.Filter({model:MapApp.Models.Ort});
	
	MapApp.filtersView = new MapApp.Views.Filters({collection: MapApp.orteCollection});
	$('#filterLocations').append( MapApp.filtersView.el);

	MapApp.orteView = new MapApp.Views.Orte({collection: MapApp.orteCollection});
	$('#orteView').append(MapApp.orteView.render().el);
	
	//MapApp.filtersView = new MapApp.Views.Filter({collection: MapApp.orteCollection});
	//$('#controls').append(MapApp.filtersView.render().el);

	MapApp.addOrtView = new MapApp.Views.AddOrt({collection: MapApp.orteCollection});
	new MapApp.Views.Map({collection: MapApp.orteCollection});



})();//siaf
