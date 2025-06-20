// 1) Define tus IDs aquí manualmente
const userIds = [
  ObjectId("68400d6b0db6a66ef51296df"),
  // Puedes añadir más:
  // ObjectId("otro_id"),
  // "user_string_id"
];

// 2) Filtro común por los campos `userId` o `user`
const filtro = {
  $or: [
    { userId: { $in: userIds } },
    { user: { $in: userIds } }
  ]
};

// 3) Recorremos todas las colecciones
db.getCollectionNames().forEach(collName => {
  const coll = db.getCollection(collName);

  if (collName === "calendars") {
    // Contar tareas dentro de `tasks`
    const pipeline = [
      { $match: filtro },
      { $unwind: "$tasks" },
      { $count: "totalTasks" }
    ];
    const res = coll.aggregate(pipeline).toArray();
    const totalTasks = (res.length > 0) ? res[0].totalTasks : 0;
    print(`★ ${collName} → ${totalTasks} tarea(s) encontradas`);
  } else if (collName === "userlogs") {
    const logs = coll.find(filtro).toArray();
  print(`★ ${collName} → ${logs.length} doc(s) encontrados`);

  logs.forEach((doc, i) => {
    print(`\n— Documento ${i + 1} —`);

    const filtrado = {};
    Object.keys(doc).forEach(key => {
      const val = doc[key];
      if (
        val !== null &&
        val !== undefined &&
        val !== 0 &&
        val !== "" &&
        !(Array.isArray(val) && val.length === 0)
      ) {
        filtrado[key] = val;
      }
    });

    printjson(filtrado);
  });
  } else {
    // Conteo genérico
    const count = coll.countDocuments(filtro);
    if (count > 0) {
      print(`★ ${collName} → ${count} doc(s) encontrados`);
    }
  }
});
