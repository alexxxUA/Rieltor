var querystring	= require('querystring'),
	express		= require('express'),
	app			= express(),
	fs 			= require("fs"),
	mime 		= require('mime');

var mongo;
app.configure('development', function(){
    mongo = {
        "hostname":"localhost",
        "port":27017,
        "username":"",
        "password":"",
        "name":"",
        "db":"db"
    }
});
app.configure('production', function(){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    mongo = env['mongodb-1.8'][0]['credentials'];
});
var generate_mongo_url = function(obj){
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}
var mongourl = generate_mongo_url(mongo);

var ObjectID = require('mongodb').ObjectID;

//set path to the views (template) directory
app.set('views', __dirname + '/views');

//set path to static files
app.use(express.static(__dirname+ '/static',{maxAge : new Date(Date.now() + 900000000)}));

//POST
app.use(express.bodyParser());

//Cookie
app.use(express.cookieParser());

//Remove "Rooms" collection

// require('mongodb').connect(mongourl, function(err, db){
// 		db.collection('rooms').drop();
// });

function calcTime(offset) {
	d = new Date();
	utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	nd = new Date(utc + (3600000*offset));

	return nd;
}


//Handle GET requests on '/'
app.get('/', function(req, res){
	require('mongodb').connect(mongourl, function(err, db){
		db.collection('rooms', function(err, collection){
			collection.find({}).toArray(function(err, results){
				res.render('index.jade', {'addAttrs' : addAttrs, 'rooms' : results});
			})
		})
	})

});
app.get('/addRoom', function(req, res){
	var d = calcTime(req.cookies.timeZone),
		curDate = d.getDate(),
		curMonth = d.getMonth()+1,
		curYear = d.getFullYear(),
		curDate = (curMonth<=9? '0'+curMonth : curMonth)+'/'+(curDate<=9? '0'+curDate : curDate)+'/'+curYear;

	require('mongodb').connect(mongourl, function(err, db){
		db.collection('rooms', function(err, collection){
			collection.insert({
				town: req.query.town.val,
				region: req.query.region.val,
				street: req.query.street.val,
				numbRoom: +req.query.numbRoom.val,
				floor: +req.query.floor.val,
				buildFloors: +req.query.buildFloors.val,
				space: +req.query.space.val,
				livingSpace: +req.query.livingSpace.val,
				kitchenSpace: +req.query.kitchenSpace.val,
				balcony: +req.query.balcony.val,
				bathroom: req.query.bathroom.val,
				condition: req.query.condition.val,
				price: +req.query.price.val,
				auction: req.query.auction.val,
				saleStage : req.query.saleStage.val,
				notes: req.query.notes.val,
				publishDate : {mSec : d, faoormatedDate : curDate}
			}, function(err, insertedData){
				res.send(insertedData[0]);
			})
		})
	})
});

//Delete room
app.get('/delRoom', function(req, res){
	require('mongodb').connect(mongourl, function(err, db){
		db.collection('rooms', function(err, collection){
			collection.remove({_id : ObjectID(req.query.delID)});
			res.send('Deleted');
		})
	})
})

//Edit room
app.get('/editRoom', function(req, res){
	require('mongodb').connect(mongourl, function(err, db){
		db.collection('rooms', function(err, collection){
			collection.update({_id : ObjectID(req.query.id.val)},{ $set: {
				town: req.query.town.val,
				region: req.query.region.val,
				street: req.query.street.val,
				numbRoom: +req.query.numbRoom.val,
				floor: +req.query.floor.val,
				buildFloors: +req.query.buildFloors.val,
				space: +req.query.space.val,
				livingSpace: +req.query.livingSpace.val,
				kitchenSpace: +req.query.kitchenSpace.val,
				balcony: +req.query.balcony.val,
				bathroom: req.query.bathroom.val,
				condition: req.query.condition.val,
				price: +req.query.price.val,
				auction: req.query.auction.val,
				saleStage: req.query.saleStage.val,
				notes: req.query.notes.val
			}});
			res.send(req.query);
		})
	})
})

//Search room
app.get('/searchRoom', function(req, res){
	var searchObject = {};

	//Build search object
	for(var item in addAttrs){
		if(addAttrs[item].searchable){
			if(addAttrs[item].searchableType == 'one' && req.query[item].val){
				searchObject[item] = {$regex: req.query[item].val, $options:'i'};
			}
			else if(addAttrs[item].searchableType == 'range'){
				if(req.query[item+'From'].val && req.query[item+'To'].val)
					searchObject[item] = {$gte: +req.query[item+'From'].val, $lte: +req.query[item+'To'].val};
				else if(req.query[item+'From'].val)
					searchObject[item] = +req.query[item+'From'].val;
				else if(req.query[item+'To'].val)
					searchObject[item] = {$gte: 0, $lte: +req.query[item+'To'].val};
			}
		}
	}

	require('mongodb').connect(mongourl, function(err, db){
		db.collection('rooms', function(err, collection){
			collection.find(searchObject).toArray(function(err, searchResult){
				res.cookie('searchObj', searchResult, { path: '/', expires: new Date(Date.now() + 900000000), httpOnly: true });
				res.send(searchResult);
			});
		});
	});
});

//Page 404
app.get('/error404', function(req, res){
	res.render('error404.jade');
});

//Get file
app.get('*', function(req, res){
	fs.readFile(__dirname + req.originalUrl, 'utf8', function(err, text){
		var type = mime.lookup(__dirname + req.originalUrl);
		if(!err){
			if (!res.getHeader('Content-Type')) {
			  	var charset = mime.charsets.lookup(type);
				res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
        		res.send(text);
			}
		}
		else{
			res.redirect('/error404');
		}
    });
});
var addAttrs = {
	town: {
		id:'town',
		label: 'Город',
		type: 'text',
		dataValidate: 'notEmpty',
		dataValidateMessage: 'Заполните поле',
		searchable: true,
		searchableType: 'one'
	},
	region: {
		id:'region',
		label: 'Район',
		type: 'text',
		dataValidate: 'none',
		searchable: true,
		searchableType: 'one'
	},
	street: {
		id: 'street',
		label: 'Улица',
		type: 'text',
		dataValidate: 'notEmpty',
		dataValidateMessage: 'Заполните пожалуйста улицу',
		searchable: true,
		searchableType: 'one'
	}, 
	numbRoom: {
		id:'numbRoom' ,
		label: 'Кол. комнат',
		type: 'text',
		dataValidate: 'numb',
		dataValidateMessage: 'Заполните количество комнат',
		searchable: true,
		searchableType: 'range'
	},
	floor: {
		id:'floor' ,
		label: 'Этаж',
		type: 'text',
		dataValidate: 'numb',
		dataValidateMessage: 'Заполните этаэ',
		searchable: true,
		searchableType: 'range'
	},
	buildFloors: {
		id:'buildFloors' ,
		label: 'Кол. этажей в доме',
		type: 'text',
		dataValidate: 'numb',
		dataValidateMessage: 'Заполните количество этажей в доме',
		searchable: true,
		searchableType: 'range'
	},
	space: {
		id:'space' ,
		label: 'Площадь',
		type: 'text',
		dataValidate: 'floatNumb',
		dataValidateMessage: 'Заполните общую площадь квартиры',
		searchable: true,
		searchableType: 'range'
	},
	livingSpace: {
		id:'livingSpace' ,
		label: 'Жилая площадь',
		type: 'text',
		dataValidate: 'floatNumb',
		dataValidateMessage: 'Заполните жилую площадь квартиры',
		searchable: true,
		searchableType: 'range'
	},
	kitchenSpace: {
		id:'kitchenSpace' ,
		label: 'Кухонная площадь',
		type: 'text',
		dataValidate: 'floatNumb',
		dataValidateMessage: 'Заполните кухонную площадь',
		searchable: true,
		searchableType: 'range'
	},
	balcony: {
		id:'balcony' ,
		label: 'Кол. балконов',
		type: 'text',
		dataValidate: 'numb',
		dataValidateMessage: 'Заполните количесвто балконов',
		searchable: true,
		searchableType: 'range'
	},
	bathroom: {
		id:'bathroom' ,
		label: 'Санузел',
		type: 'select',
		options: ['Выбирите тип', 'совмещенный', 'разделенный'],
		dataValidate: 'notEmpty',
		dataValidateMessage: 'Выбирите тип санузла',
		searchable: true,
		searchableType: 'one'
	},
	condition: {
		id:'condition' ,
		label: 'Состояние квартиры',
		type: 'select',
		options: ['Выбирите состояние', 'отличное', 'хорошое', 'среднее', 'плохое'],
		dataValidate: 'notEmpty',
		dataValidateMessage: 'Выбирете состояние квартиры',
		searchable: true,
		searchableType: 'one'
	},
	price: {
		id:'price' ,
		label: 'Цена в $',
		type: 'text',
		dataValidate: 'floatNumb',
		dataValidateMessage: 'Заполните цену в числовом формате',
		searchable: true,
		searchableType: 'range'
	},
	auction: {
		id:'auction' ,
		label: 'Торг',
		type: 'select',
		options: ['Выбирите возможность','возможен', 'невозможен'],
		dataValidate: 'notEmpty',
		dataValidateMessage: 'Выбирете возможность торга',
		searchable: true,
		searchableType: 'one'
	},
	saleStage: {
		id : 'saleStage',
		label: 'Етап продажи',
		type: 'select',
		options: ['Выбирете етап', 'Продается', 'Ожидание взноса', 'Продана'],
		dataValidate: 'notEmpty',
		dataValidateMessage: 'Выбирете етап продажи',
		searchable: true,
		searchableType: 'one'
	},
	notes: {
		id:'notes' ,
		label: 'Заметки',
		type: 'textarea',
		dataValidate: 'none',
		searchable: false
	}
};
//listen on localhost 8888
app.listen(8000);