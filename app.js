// 모듈 설정
var express = require('express');
var http = require('http');
var static = require('serve-static');
var path = require('path');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession =require('express-session');

var expressErrorHandler = require('express-error-handler');


// 데이터베이스 설정
var mongoClient =require('mongodb').MongoClient;

var database;
function connectdb(){
 var databaseUrl='mongodb://localhost:27017';//바뀐부분1
 
 mongoClient.connect(databaseUrl, {useNewUrlParser: true}, function(err, client){//2
  if(err){
   console.log('데이터베이스 연결 에러 발생');
   return;
  };
  
  console.log('데이터베이스에 연결됨: '+databaseUrl);
  
  database=client.db("local");//3
 });
};

//서버 설정
var app = express();

app.set('port',process.env.PORT || 3000);
app.use('/public',static(path.join(__dirname,'public')));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));

// 라우팅
var router =express.Router();

router.route('/process/login').post(function(req, res){
    console.log('/process/login 라우팅함수 호출됨.');

    var paramId = req.body.uid || req.query.uid;
    var paramUpw= req.body.upw || req.query.upw;
    console.log('요청 파라미터'+paramId +', '+paramUpw);

    if(database){
        authUser(database, paramId, paramUpw, function(err, docs){
            if(err){
                console.log('에러발생');
                res.writeHead(200,{"content-Type":"text/html;charset=utf8"});
                res.write('<h1>에러 발생</h1>');
                res.end();
                return;
            };

            if(docs){
                console.dir(docs);
                res.writeHead(200,{"content-Type":"text/html;charset=utf8"});
                res.write('<h1>사용자 로그인 성공</h1>');
                res.write('<div><p> 사용자 : ' + docs[0].name +  ' </p></div>');
                res.write('<br><br><a href="/public/login.html"> 다시 로그인하기</a>');
                res.end();
                return;
            }else{
                console.log('사용자 데이터 없음');
                res.writeHead(200,{"content-Type":"text/html;charset=utf8"});
                res.write('<h1>사용자 데이터 조회 안됨</h1>');
                res.end();
            };
        }); 
    }else{
        console.log('에러발생');
        res.writeHead(200,{"content-Type":"text/html;charset=utf8"});
        res.write('<h1>데이터 베이스 연결안됨</h1>');
        res.end();
    };

});



app.use('/', router);

var authUser = function(db, id, pw, callback) {
    console.log('authUser 호출됨 : '+id +','+pw);

    var users = db.collection('users');

    users.find({"id":id, "pw":pw}).toArray(function(err,docs){
        if(err){
            callback(err, null);
            return;
        };
 
        if(docs.length > 0){
            console.log('일치하는 사용자를 찾음');
            callback(null, docs);
        }else{
            console.log('일치하는 사용자를 찾지못함');
            callback(null, null);            
        };  
    });
};


//에러발생시 페스
var errorHandler = expressErrorHandler({
    static:{'404':'./public/404.html'}
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);


//express 서버 생성
var server = http.createServer(app).listen(app.get('port'),function(){
   console.log('익스프레스로 서버가 실행되었습니다    포트번호:', app.get('port')) ;


   connectdb();
});




