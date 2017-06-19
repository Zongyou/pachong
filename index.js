/**
 * 电影天堂爬虫
 */

var cheerio = require('cheerio');
var http = require('http');
var iconv = require('iconv-lite');
var mongo_url = 'mongodb://localhost:27017/asd-mongo';
var url1 = 'http://news.xidian.edu.cn/xwjh/jx.htm';
var url2 = 'http://news.xidian.edu.cn/xwjh/jx/';
var index = 1; //页面数控制
var titles = []; //用于保存title
let map = {};
var url1s=[];
var url2s=[];
var count = 0;
var url='http://news.xidian.edu.cn/';
var text=[];

function getTitle(url2, i) {

  console.log("正在获取第" + i + "页的内容");
  http.get(url2 + i + '.htm', function(sres) {
    var chunks = [];
    titles=[];
    url2s=[];
    sres.on('data', function (chunk) {
      chunks.push(chunk);
    });
    sres.on('end', function () {
      var html = iconv.decode(Buffer.concat(chunks), 'UTF-8');
      var $ = cheerio.load(html, {decodeEntities: false});
      $('.m-li-li a').each(function (idx, element) {
        var $element = $(element);
        url2s.push({
          bt: $element.attr('href')
        })
      })
      getContent(url2s, count);
      $('.m-li-li .pc-news-bt').each(function (idx, element) {
        var $element = $(element);
        titles.push({
          title: $element.text()
        })
        map[$element.text()] = $element.href;
      })
      console.log(titles);
    });
  });
      if(i < 3) {
        getTitle(url2, ++index); //递归执行，页数+1
      } else {
        //for (let item of titles ) {
        //  console.log(item);
        //}
        //console.log(titles);
        console.log("Title获取完毕！");
        console.log(Object.keys(map).length);
        //save();
      }

}

function save() {
  var MongoClient = require('mongodb').MongoClient; //导入依赖
  MongoClient.connect(mongo_url, function (err, db) {
    if (err) {
      console.error(err);
      return;
    } else {
      console.log("成功连接数据库");
      var collection = db.collection('node-reptitle');
      collection.insertMany(titles, function (err,result) { //插入数据
        if (err) {
          console.error(err);
        } else {
          console.log("保存数据成功");
        }
      })
      db.close();
    }
  });
}

function getContent(urls, n,h) {
  console.log("正在获取第" + n + "个url的内容");
  var b=urls[n].bt;
  b=b.substring(h,b.length);
  console.log(url + b);
  text=[];
  http.get(url +b , function(sres) {
    var chunks = [];
    sres.on('data', function(chunk) {
      chunks.push(chunk);
    });
    sres.on('end', function() {
      var html = iconv.decode(Buffer.concat(chunks), 'UTF-8');
      var $ = cheerio.load(html, {decodeEntities: false});
      $('.neirong').each(function (idx, element) {
        var $element = $(element);
        text.push({
          content: $element.text()
        })
        console.log($element.text());
      })
      if(n < urls.length - 1) {
        getContent(urls, ++count,h);
      } else {
        console.log("content获取完毕！");
        //console.log(text);
        //save();
      }
    });
  });
}

function neirong_title(url1,h){
  http.get(url1, function(sres) {
    var chunks = [];
    url1s=[];
    titles=[];
    sres.on('data', function(chunk) {
      chunks.push(chunk);
    });
    sres.on('end', function() {
      var html = iconv.decode(Buffer.concat(chunks), 'UTF-8');
      var $ = cheerio.load(html, {decodeEntities: false});
      $('.m-li-li a').each(function (idx, element) {
        var $element = $(element);
        url1s.push({
          bt: $element.attr('href')
        })

      })
      getContent(url1s,count,h);
      $('.m-li-li .pc-news-bt').each(function (idx, element) {
        var $element = $(element);
        titles.push({
          title: $element.text()
        })
        map[$element.text()] = $element.href;
      })
      console.log(titles);
    });
  });
}


function main() {
  //首页和后几页的地址不同，得分别处理
  //程序还有些许问题，不同网址需要截取的长度有时为3，有时为6，需要判断合成网址是否404错误
  console.log("开始爬取");
  console.log("正在获取首页的内容");
  neirong_title(url1,3);//爬首页
  for(var i=1;i<=3;i++)
  {
    neirong_title(url2+ i + '.htm',6);//爬后面几页,第二个参数是从第几位开始截取网址
  }
  //getTitle(url2, index);

}




main(); //运行主函数
