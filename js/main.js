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
	// ORT MODEL 
	// 
	MapApp.Models.Ort = Backbone.Model.extend({

		defaults: {
			title: 'Home',
			lat: 666,
			lon: 8
		},

		validate: function(attrs){
			if(	! $.trim(attrs.lat)	){
				return 'lat Must not be empty';
			}
			if(	! $.trim(attrs.lon) ){
				return 'lon Must not be empty';
			}
			if(	! $.trim(attrs.title) ){
				return 'title Must not be empty';
			}
			console.log('title');
		},

		display: function(){
			return this.get('title') +' is displaying';
		}

	});

	// 
	// ORTE Collection / A list or Orte
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
	// ORT VIEW 
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


	MapApp.Views.AddOrt = Backbone.View.extend({
		el: '#addOrt',
		events: {
			'submit': 'submit'
		},
		initialize: function(){
		}, 
		submit: function(e){
			e.preventDefault();
			var newOrtTitle = $(e.currentTarget).find('input[type="text"]').val();
			if(! $.trim(newOrtTitle) ) return "title must not be empty!";
			var ort = new MapApp.Models.Ort({title: newOrtTitle});
			console.log(ort);
			this.collection.add(ort);
		}
	});

	orteCollection = new MapApp.Collections.Orte([
		{
			title: "Arbeit", 
			lat: 15,
			lon: 16
		},
		{
			title: "Bücherei", 
			lat: 17, 
			lon: 3
		},
		{
			title: "Werkstatt", 
			lat: 6, 
			lon: 13
		}
	]);

	var orteView = new MapApp.Views.Orte({collection: orteCollection});

	$('body').append(orteView.render().el);

	var addOrtView = new MapApp.Views.AddOrt({collection: orteCollection});


})();//siaf
