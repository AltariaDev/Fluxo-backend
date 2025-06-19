const dbName = process.env.MONGO_DB_NAME;
db = db.getSiblingDB(dbName);

db.createUser({
	user: 'sherpappdb',
	pwd: '3E48qAq6Unu8LJAffcvA',
	roles:[
    		{
      			role: 'readWrite',
      			db: dbName
    		}
  	]
});

db.configs.insertOne({
	"appName": "SherpApp Backend",
	"version": "0.3.0",
	"initialized": true,
	"createdAt": new Date()
});

print('MongoDB inicializado correctamente', dbName)
