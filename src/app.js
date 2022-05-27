const express = require("express");
const session = require("express-session"); //midw functionként kel meghivni majd be kell konfoguralni
const passport = require("passport");
const Local = require("passport-local").Strategy;
const Google = require("passport-google-oauth2").Strategy;
const bcryptjs = require("bcryptjs");
const { findUserByEmail, createUser } = require("../db");

const app = express();

//client id 743193911881-tbfe02hfa4i0jiql7jbdq1d2j5nese79.apps.googleusercontent.com
//secret  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

app.use(
  session({
    //req objectbe tesz be 1 sessiont(egy propertit)
    resave: false,
    secret: "1234",
    saveUninitialized: false,
  })
);

app.use(express.json()); //json alapu nem formos az aut
app.use(passport.initialize());
app.use(passport.session());

//1 irányú titkosítás visszafejthetetlen
const hash = (password) => {
  return bcryptjs.hash(password, 10); //salt
};

const compare = (password, hashed) => {
  return bcryptjs.compare(password, hashed);
};

const db = {}; //kamu database

//mentés kiolvasás a sessionból ahhoz kell ez seri:ment deseri:olvs
passport.serializeUser((user, done) => {
  done(null, user.email);
});
passport.deserializeUser(async (email, done) => {
  done(null, await findUserByEmail(email));
});

passport.use(
  new Google(
    {
      clientID:
        "743193911881-tbfe02hfa4i0jiql7jbdq1d2j5nese79.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:8080/google/callback",
    }, //usert mentjuk majd a local db-be
    (req, actoken, reftoken, profile, done) => {
      done(null, profile);
    }
  )
);

//Stratégia melyik paramba vana jelsző honan veszi ki
passport.use(
  new Local(
    {
      passwordField: "password",
      usernameField: "email",
    },
    async (email, password, done) => {
      //ha nincs email v jelszó akor nem léptetem be null:nincs error
      if (!email || !password) {
        return done(null, false, { message: "wrong credentials " });
      } //email cim szerepel adatbázisba? ellenörizzük le
      const userInDb = await findUserByEmail(email);
      if (!userInDb) {
        //nincs mg az email cim
        return done(null, false, { message: "wrong credentials " });
      }

      const result = await compare(password, userInDb.password); //itt hashed jelszavakat has össze:promise jön vissza emiatt kell then
      if (result === true) {
        //ha a jelszavak egyeznek
        return done(null, userInDb);
      }
      done(null, false, { message: "wrong credentials " });
    }
  )
);

app.post("/signup", async (req, res, next) => {
  //bodybol kell kettö adat: email meg a password:
  const { email, password } = req.body;
  //regisztrációt végzem el ÉN nem passport!!
  if (!email || !password) {
    return res.status(400).json({ message: "Missing crends" });
  } //havvsn email:akkor ez már létezik
  if (await findUserByEmail(email)) {
    return res.status(400).json({ message: "email already exists" });
  } //van jelszó email létezik: DE NEM JEL BE CSAK SAVE

  const hashed = await hash(password);
  await createUser({ email, password: hashed });
  res.json({ ok: true });
});

//ez itt a pasportos autentikáció-loc strtegy:middleware amit expr futtat pasp aut loc funct ad visdaz
app.post("/signin", passport.authenticate("local"), (req, res, next) => {
  res.json(req.user);
});

//ez váltja ki a google regget
app.get("/google", passport.authenticate("google", { scope: ["email"] }));

app.get("/google/callback", passport.authenticate("google"), (req, res) => {
  res.json(req.user);
});

//ezt akkkor ha jwt token lenne: nem session hanem frontenden az aut
/*app.post("/signin", (req, res, next) => {
const doAuth = passport.authenticate("local", (err, user, info) => {
    if (err) {
      //ha van hiba
      return next(err); //átadom ahibakezelö middlewarenk
    }

    if (!user) {
      //ha nincs user:stratégia lekezeli beteszi ob
      return res.json(info);
    } //ha van user: logIn elvégzi a háttérmüveletekr
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(err);
      }
      res.json(user); //ledobom az usert és jwt tokent itt csinálnék.
    });
  });

  doAuth(req, res, next);
});*/

//minden authnál kellene az if ez fárasztó-->verify middleaere
const verify = (req, res, next) => {
  if (!req.user) {
    //nincs benne a sessiobe a user pasport olvassak kki sessionbol a usert nincs userünk
    return res.status(403).end();
  }
  next(); //ok midw végzett-->kövi mindw jön
};

app.get("/profile", verify, (req, res, next) => {
  res.json(req.user);
});

//ez egy endpoint saját sessionnal mert rreqbe ugye bekerült a session
app.get("/", (req, res) => {
  res.end("orking");
});
module.exports = app;
