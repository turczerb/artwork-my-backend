const path = require("path");
const app = require("./src/app");
const { init } = require("./db");

//app.js létrehozás után be kell requirelni
//pr envbe az all körny változó ??=ha nem létezik akk 8080-ra ugrunk. cross env:op rendsz fuggetlen áll be körny v
const port = process.env?.PORT ?? 8080;

init(path.join(__dirname, "db.json")).then(() => {
  app.listen(port, () => {
    console.log("App  is listening port= " + port);
  });
});
