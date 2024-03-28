import "dotenv/config";
import express from "express";
import { DatabaseClient } from "./db-client.js";
import dayjs from "dayjs";
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.PORT | 4040;

app.set("view engine", "ejs")
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

async function getUserbyUsername(username) {
  const query = { username: username };
  const users = await DatabaseClient.getUsersCollection();
  const user = await users.findOne(query);

  return user;
}

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  
  const existingUser = await getUserbyUsername(username);

  if (existingUser) {
      res.redirect("user-exists");
      return;
  }
  
  const newUser = {username: username, password: password};

  const users = await DatabaseClient.getUsersCollection();

  await users.insertOne(newUser); 

  setCookie(res, username);
  res.redirect("authenticated");
})

app.all("/user-exists", (_, res) => res.render("user-exists"));

function setCookie(res, username) {
  const expirationDate = dayjs().add(12, "h");
  res.cookie("username", username,  
    {
      expires: expirationDate.toDate(),
      httpOnly: true
    });

}
app.get("/", (req, res) => {
  const username = req.cookies.username;
  if (username) {
    res.redirect("authenticated")
  } else {
    res.redirect("login")
  }
})

app.get("/login", (_, res) => {
  res.render("login-register")
})

app.all("/invalid-auth", (_, res) => {
  res.render("invalid-auth");
})

app.all("/authenticated", (req, res) => {
  const username = req.cookies.username;
  res.render("authenticated", { username: username });
})

app.get("/show-cookies", (req, res) => {
  const cookies = req.cookies;
  res.render("cookies", {cookies: Object.entries(cookies)});
});

app.all("/clear-cookies", (req, res) => {
  const cookies = Object.entries(req.cookies)
  
  for (const [key, value] of cookies) {
    res.clearCookie(key);
  }
  res.redirect("/login"); 
})

app.post("/login", async (req,res) => {
  const { username, password } = req.body;
  const users = await DatabaseClient.getUsersCollection();

  const query = { 
    username: username,
    password: password
  }
  const options = {
    projection: {
      _id: 1,
      username: 1,
      password: 1
    }
  }
  const user = await users.findOne(query, options);
  if (user) {
    setCookie(res, username);
    res.status(200) 
    res.redirect("authenticated")
  } else {
    res.status = 400;
    res.redirect("invalid-auth")
  }

})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
