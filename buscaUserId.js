// 1) Define tu userId según corresponda (ObjectId, String o Number)
const userIdToSearch = ObjectId("");

// 2) Filtro genérico para todas las colecciones
const filtro = {
  $or: [
    { "userId": userIdToSearch },
    { "user": userIdToSearch }
  ]
};

// 3) Recorremos todas las colecciones
db.getCollectionNames().forEach(collName => {
  const coll = db.getCollection(collName);

  if (collName === "calendars") {
    // Para `calendar`, queremos contar los elementos de `tasks`
    const pipeline = [
      { $match: filtro },          // primero filtrar documentos que te interesan
      { $unwind: "$tasks" },       // "despliega" cada tarea en un documento propio
      { $count: "totalTasks" }     // cuenta cuántos documentos (tareas) hay
    ];
    const res = coll.aggregate(pipeline).toArray();
    const totalTasks = (res.length > 0) ? res[0].totalTasks : 0;
    print(`★ calendar → ${totalTasks} tarea(s) encontradas en total`);
  } else {
    // Para el resto, simplemente contamos documentos
    const count = coll.countDocuments(filtro);
    if (count > 0) {
      print(`${collName} → ${count} doc(s) encontrados`);
    }
  }
});
