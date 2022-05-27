let db = null;

//setter function kivülról path beállítása
//hova tegye majd a file-okat app-jsbe ezt kell meghívni

const init = async (fp) => {
  //init promise-t ad vissza
  const lowdb = await import("lowdb");
  //lowdb adapterét létre hozom
  const adapter = new lowdb.JSONFile(fp);
  db = new lowdb.Low(adapter);
  await db.read(); //feltölti?
  db.data ||= { users: [] };
  return db.write();
};

//modal réteg?
//user kezelési functionok:

const getAlluser = async () => {
  await db.read();
  return db.data.users;
};
const findUserByEmail = async (email) => {
  await db.read();
  return db.data.users.find((user) => {
    return user.email === email;
  });
};

const createUser = async (user) => {
  await db.read();
  db.data.users.push(user);
  return db.write();
};

module.exports = {
  getAlluser,
  findUserByEmail,
  createUser,
  init,
};
