var app = require('express')();
var router = require("express").Router();
var path = __dirname + '/';
app.use(require("express").static('public'));
const nodemailer = require('nodemailer');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var afterLoad = require('after-load');
app.set('port', (process.env.PORT || 5000));


let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'coldcompany11@gmail.com',
        pass: 'ColdCompany123'
    }
});

var con = mysql.createConnection({
  host: "sql11.freesqldatabase.com",
  user: "sql11175040",
  password: "TmYutnsD6q",
  database: "sql11175040"
});

var userOk = "nok";
var emailOk = "nok";
var name = "";
var user = "";

router.use(function (req,res,next) {
  //console.log("/" + req.method);
  next();
});

router.get("/",function(req,res){
  res.sendFile(path + "index.html");
});

router.get("/team.html",function(req,res){
  res.sendFile(path + "team.html");
});

router.get("/contact.html",function(req,res){
  res.sendFile(path + "contact.html");
});

router.get("/index.html",function(req,res){
  res.sendFile(path + "index.html");
});

router.get("/product.html",function(req,res){
  res.sendFile(path + "index.html");
});

router.get("/createaccount.html",function(req,res){
  res.sendFile(path + "createaccount.html");
});

router.get("/dashboard.html",function(req,res){
  res.sendFile(path + "dashboard.html");
});

router.get("/login.html",function(req,res){
  res.sendFile(path + "login.html");
});

router.get("/info.html",function(req,res){
  res.sendFile(path + "info.html");
});

router.get("/user.html",function(req,res){
  res.sendFile(path + "user.html");
});

app.get('/activate/users', function(req, res) {
  var user_id = req.param('id');
  name = user_id;
  res.sendFile(path + "activate.html");
});

app.use("/",router);

app.use("*",function(req,res){
  res.sendFile(path + "404.html");
});

http.listen(app.get('port'),function(){
  console.log("Live at Port 3000");
});
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
    });

/*afterLoad('https://google.com', function(html){
   console.log(html);
});*/


io.sockets.on('connection', function(socket){
    console.log('A user connected: ' + socket.id);

    socket.on('submit', function(data){
      console.log(data);
      let mailOptions = {
         from: '<velez.fmvs@gmail.com>', // sender address
         to: 'coldcompany11@gmail.com', // list of receivers
         subject: data.subject, // Subject line
         text: data.message + "\nName: " + data.name // plain text body
      };
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              return console.log(error);
          }
      });
    });
    socket.on('enviar', function(data){
        var post  = {
          name: data.name,
          surname: data.surname,
          email: data.email,
          username: data.username,
          password: data.password
        }

        con.query('SELECT * FROM members WHERE username = ?', data.username, function (err, result) {
          if (err) throw err;
          if(result == ""){
            socket.emit('userOk', "ok");
            socket.broadcast.emit('userOk', "ok");
            userOk = "ok";
            console.log(userOk);
          }
          else{
            socket.emit('userOk', "nok");
            socket.broadcast.emit('userOk', "nok");
            userOk = "nok";
            console.log("Error: username already exists!");
          }
        });

        con.query('SELECT * FROM members WHERE email = ?' , data.email, function (err, result){
          if (err) throw err;
          if (result == ""){
            socket.emit('emailOk', "ok");
            socket.broadcast.emit('userOk', "ok");
            emailOk = "ok";
            console.log(emailOk);
          }
          else{
            socket.emit('emailOk', "nok");
            socket.broadcast.emit('emailOk', "nok");
            emailOk = "nok";
            console.log("Error: email already exists");
          }
        });


    });
    //registo
    socket.on('registo', function(data){
          var post  = {
          name: data.name,
          surname: data.surname,
          email: data.email,
          username: data.username,
          password: data.password
        }
          con.query('INSERT into members set?',post, function (err, result) {
            if (err) throw err;
            console.log("1 user created");
          });

        let mailOptions = {
          to: data.email,
          subject: 'Account activation',
          text: 'http://192.168.1.67:3000/activate/users?id='+data.username
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
        });
    });

    //login
    socket.on('entrar2', function(data){
      con.query('SELECT * FROM members WHERE username = ? AND password = ?',[data.username, data.password], function (err, result, rows) {
        if (err) throw err;
        if(result != ""){
          con.query('SELECT email_activation FROM members WHERE username = ?', data.username, function(err, rows){
            if(err) throw err;
            if (rows[0].email_activation == 10){
              user = data.username;
              console.log("logged in");
              socket.emit('login', "ok");
              socket.broadcast.emit('login', "ok");
            }
            else{
              console.log("not logged in");
              socket.emit('login', "nok");
              socket.broadcast.emit('login', "nok");
            }
          });
        }
        else{
          console.log("not logged in");
          socket.emit('login', "nok");
          socket.broadcast.emit('login', "nok");
        }
      });
    });

    //ativar email
    socket.on('ativar', function(data){
      if(data == "ok")
      {
        //ativar
        con.query('UPDATE members SET email_activation = 10 WHERE members.username = ?', name, function(err, result){
            if(err) throw err;
        });

      }
      else{
        console.log("email activation error!");
      }
    });

    //get user
    socket.on('get', function(data){
      if(data == "user"){
        socket.emit('user', user);
        socket.broadcast.emit('user', user);
      }
      else{
        socket.emit('user', "error");
        socket.broadcast.emit('user', "error");
      }
    });

    //pedir dados
    socket.on('pedirDados', function(data){
      con.query('SELECT * FROM members WHERE username = ?', user, function(err, rows){
        if(err) throw err;
        socket.emit('dadosName', rows[0].name);
        socket.broadcast.emit('dadosName', rows[0].name);
        socket.emit('dadosSurname', rows[0].surname);
        socket.broadcast.emit('dadosSurname', rows[0].surname);
        socket.emit('dadosEmail', rows[0].email);
        socket.broadcast.emit('dadosEmail', rows[0].email);
      });
    });
});
