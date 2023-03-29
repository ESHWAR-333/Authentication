const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// // Get Books API
// app.get("/books/", async (request, response) => {
//   const getBooksQuery = `
//   SELECT
//     *
//   FROM
//     book
//   ORDER BY
//     book_id;`;
//   const booksArray = await db.all(getBooksQuery);
//   response.send(booksArray);
// });

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashPwd = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * from user where username='${username}'`;
  const dbResult = await db.get(selectUserQuery);
  if (dbResult == undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const postQuery = `insert into user (username,name,password,gender,location)
                            values('${username}','${name}','${hashPwd}','${gender}','${location}');
                            `;
      await db.run(postQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `select * from user where 
    username='${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser == undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, dbUser.password);
    if (passwordMatch == true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * from user where 
    username='${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser == undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const passwordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (passwordMatch == true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashPwd = await bcrypt.hash(newPassword, 10);
        const updateQuery = `update user set 
                password='${hashPwd}'
        ;`;
        await db.run(updateQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
