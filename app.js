/**
 * Module dependencies.
 */

var express = require('express');

// ハッシュ値を求めるために必要なもの
var crypto = require("crypto");
var secretKey = "SJKHFKAKHKASHFIUHE8689KHk"; // シークレットは適当に変えてください
var getHash = function(target) {
  var sha = crypto.createHmac("sha256", secretKey);
  sha.update(target);
  return sha.digest("hex");
};

// passportで必要なもの
var flash = require("connect-flash"),
  passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy;

// MongoDBを使うのに必要なもの
var mongoose = require("mongoose");
// ユーザーのモデルを作成
var db = mongoose.createConnection("mongodb://localhost/passporttest", function(error, res) {});
var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    requird: true
  }
});
var User = db.model("User", UserSchema);

// サーバー起動時にユーザーが無ければ、テスト用のデータを投入します。
// 間違っても本番用のサーバーにこんなコードを入れちゃ駄目です。
// User.find({}, function(err, docs) {
//   if (!err && docs.length === 0) {
//     var aaaUser = new User();
//     aaaUser.email = "aaa@example.com";
//     aaaUser.password = getHash("aaa");
//     aaaUser.save();
//     console.log(docs);
//   } else {
//     console.log(err);
//   }
// });


// passportでのセッション設定
// シリアライズの設定をしないと、user.passwordでパスワードがポロリする可能性があるので、必要な項目だけ持たせる
passport.serializeUser(function(user, done) {
  done(null, {
    email: user.email,
    _id: user._id
  });
});
passport.deserializeUser(function(serializedUser, done) {
  User.findById(serializedUser._id, function(err, user) {
    done(err, user);
  });
});

// LOcalStrategyを使う設定
passport.use(new LocalStrategy(
  // フォームの名前をオプションとして渡す。
  // 今回はusernameの代わりにemailを使っているので、指定が必要
  {
    usernameField: "email",
    passwordField: "password"
  },
  function(email, password, done) {
    // 非同期で処理させるといいらしいです
    process.nextTick(function() {
      User.findOne({
        email: email
      }, function(err, user) {
        if (err)
          return done(err);
        if (!user)
          return done(null, false, {
            message: "ユーザーが見つかりませんでした。"
          });
        var hashedPassword = getHash(password);
        if (user.password !== hashedPassword)
          return done(null, false, {
            message: "パスワードが間違っています。"
          });
        return done(null, user);
      });
    });
  }));

// リクエストがあったとき、ログイン済みかどうか確認する関数
var isLogined = function(req, res, next) {
  if (req.isAuthenticated())
    return next(); // ログイン済み
  // ログインしてなかったらログイン画面に飛ばす
  res.redirect("/login");
};


var app = express();

var ect = require('ect');
var ectRender = ect({
  watch: true,
  root: __dirname + 'views',
  ext: '.ect'
});
app.engine('ect', ectRender.render);
app.set('view engine', 'ect');
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public/'));

app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
  secret: "2KJHKSFH687JGJKjk"
})); // こちらにも別のシークレットが必要です

// app.router を使う前にpassportの設定が必要です
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(app.router);
// app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

// app.get('/', routes.index);
app.get('/', function(req, res) {
  res.render('index', {
    title: 'Express',
  });
});
app.get("/login", function(req, res) {
  res.render("login", {
    user: req.user,
    message: req.flash("error")
  });
});
app.post("/login",
  passport.authenticate("local", {
    failureRedirect: '/login',
    failureFlash: true
  }),
  function(req, res) {
    // ログインに成功したらトップへリダイレクト
    res.redirect("/member_only");
  });
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});
app.get("/member_only", isLogined, function(req, res) {
  // console.log(req.user);
  res.render("member_only", {
    user: req.user
  });
});
app.get("/register_account",function(req,res){
  res.render("register_account",{
    title: "Register Account"
  });
});
app.post("/register_account",function(req,res){

  var res_error = function(mes){
    res.render("register_account",{
      title:"Register Account",
      message: mes
    });
  };
  var email = req.body.email;
  var pw = req.body.password;
  var pwc = req.body.password_c;
  if (email === "") {
    res_error("input the email");
  }
  if (pw !== pwc) {
    res_error("password is different with confirmed one");
  }
  User.find({email:email},function(err,user){
    if (err) {
      res_error(err);
    }else if (user===[]) {
      res_error("This email is already registered");
    }else{
      var i = {
        email:email,
        password:getHash(pw)
      };
      var newuser = new User(i);
      newuser.save();
      res.render("login",{
        message:"successed to register!"
      });
    }
  });
});

// http.createServer(app).listen(app.get('port'), function(){
//   console.log('Express server listening on port ' + app.get('port'));
// });

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
