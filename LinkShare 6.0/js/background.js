
var hasfriends=false;
var unreadCount=-1;
var curemail=null;
var socket=null;
var setuping=false;
var channelToken=null;

console.log("background page");
init();

function updateIcon() {

  if (unreadCount == -2) {
    chrome.browserAction.setIcon({path:loginIcon});
    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
    chrome.browserAction.setBadgeText({text:""});
  }
  if (unreadCount == -1) {
    chrome.browserAction.setIcon({path:notLoginIcon});
    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
    chrome.browserAction.setBadgeText({text:"?"});
  } else {
    chrome.browserAction.setIcon({path:loginIcon});
    chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
    chrome.browserAction.setBadgeText({text:""});
    if (unreadCount > 0){
    chrome.browserAction.setBadgeText({text:unreadCount.toString()});
  }
  }
}

function setLogoffIcon()
{
  unreadCount=-1;
  updateIcon();
}

function setOfflineIcon()
{
  unreadCount=-2;
  updateIcon();
}

chrome.extension.onRequest.addListener(onRequest); 

function onRequest(request, sender, sendResponse) {
if (request.action == 'logoff')
 {
  logoff();
 }
}

function logoff()
{
  console.log("background page log off");
  hasfriends=false;
  unreadCount=-1;
  curemail=null;
  localStorage.removeItem("groups");
  closechannel();
  updateIcon();
}

chrome.extension.onMessage.addListener(function(message, sender){
  if (message.action == 'relogin')
{
  console.log("content script");
  init();
}
});

function setbuttonsend()
{
  setbuttonnone();
  chrome.browserAction.onClicked.addListener(send);
}

function setbuttonplslogin()
{
    setbuttonnone();
    chrome.browserAction.onClicked.addListener(plslogin);
}

function setbuttonnone()
{
  chrome.browserAction.onClicked.removeListener(send);
  chrome.browserAction.onClicked.removeListener(plslogin);
}

function plslogin()
{
 console.log("pls login");

chrome.cookies.get({name:cookiename, url:cookieDomain,}, function(cookie){

if (cookie!=null)
{
    curemail=cookie.value;
}
else
{
    curemail=null;
}

  if (curemail!=null)
        {
  setbuttonnone();
  normal();
  console.log("pls login normal");
        }
        else
        {
  chrome.tabs.create({url: authurl},null);
  unreadCount=-1;  
  updateIcon();
  console.log("login page");
        }
  });   
}

function normal()
{
  if (window.navigator.onLine==true) 
  { 
    console.log("normal");
    unreadCount=0;
    setbuttonsend();
    checkFriends();
    getGroups();
    setupChannelTask();
    if (hasfriends)
    {
      getMsgs();
      getUnreadMsgCount();
    }
  }
  else
  {
    disConnectHandler();
  }
      updateIcon();
}

function init()
{

console.log("init");
if (curemail==null)
{
chrome.cookies.get({name:cookiename, url:cookieDomain,}, function(cookie){

if (cookie!=null)
{
    curemail=cookie.value;
}

  if (curemail!=null)
        {
          normal();
        }
        else
        {
        setbuttonplslogin();
        }
  });
}
updateIcon();
}

function recheck()
{

console.log("recheck");

chrome.cookies.get({name:cookiename, url:cookieDomain,}, function(cookie){

if (cookie!=null)
{
    curemail=cookie.value;
}
else
{
    curemail=null;
}
  
  if (curemail==null)
        {
    unreadCount=-1;
    setbuttonplslogin();
        }
        else
        {
          if(!hasfriends)
          checkFriends();
        }
  });

updateIcon();

}


function getUnreadMsgCount()
{

$.ajax({
   type: "get",
   url: hostadd+"favurl/newnum",
   dataType:"json",
   success: getUnreadMsgCountHandler
});


function getUnreadMsgCountHandler(data)
{
  if (data.newfavurlnum)
  {
    unreadCount=parseInt(data.newfavurlnum);
    updateIcon();
  }

}

}

function getMsgs()
{
    $.get(
    hostadd+"favurl/pending",
    getMsgshandler,
    "json");

function getMsgshandler(data)
{
  if(data)
  {
   extractJson(data);
  }

}

}


function extractJson(data)
{
  
  var maxnumber=localStorage["maxtabnumber"];
  
   if(maxnumber==null)
    {
      maxnumber=MAXTABNUMBER;
    }

  $(data.FavURLShows).each(function(){ 

    var sid=this.id;

    chrome.tabs.query({'windowId':chrome.windows.WINDOW_ID_CURRENT},
    function(tabs){
    var curtabnumber = tabs.length;

    var channel="WEB";

    if(curtabnumber < maxnumber)
    {
      channel="CHROME";
    }

    console.log("check tab number: "+curtabnumber);
    updateChannel(sid,channel);

    console.log("favurl msg: "+sid);

  });

  }); 
          
 }

function checkFriends()
{

$.ajax({
   type: "get",
   url: hostadd+"friend/available",
   dataType:"text",
    async:false,
   success: getFriendsHandler
});

function getFriendsHandler(data)
{
    if(data)
  {
    if (data==="true")
    {
    hasfriends=true;
    }
   
   if (data==="false")
    {
    hasfriends=false;
    }
    

  }
}

}

function updateChannel(sid,channel)
{

console.log("updatestatus");

$.ajax({
   type: "post",
   data:{ "id": sid,"channel":channel},
   url: hostadd+"favurl/channel",
   dataType:"json",
   success: updateHandler
});

function updateHandler(json)
{
  //var json=JSON.parse(json);
  if(json)
  {
    json=json.FavURLNotify;
   var nickname=json.nickname;
   var surl=json.url;
   var status=json.status;
   var sendtime=getLocalSendTime(json.sendtime);
  sendtime=jQuery.timeago(sendtime);  
  var avatarurl=json.avatarURL;

  if (avatarurl==null)
    avatarurl=host+'images/mystery-man.jpg';


  var userid=json.fromid;

   console.log("updatehandler");

    chrome.tabs.create({url: surl,active :false},function(tab){
    
    chrome.tabs.executeScript(tab.id,{file: 'js/ReceiveMSG.js'},function()
    {
    chrome.tabs.sendMessage(tab.id, {"status": "success","nickname":nickname,"sendtime":sendtime,"avatarurl":avatarurl,"userid":userid,});
      });
      
    }); 
   
    console.log("tab created"); 
  }
}
}

function getLocalSendTime(sendtime)
{
  var d = new Date(sendtime);
  var sendtime = d.format("yyyy-MM-dd hh:mm:ss"); 
  return sendtime;
}

function setupChannelTask()
{
  ping();  
  if (isGoogleCon) 
  {
      isGoogleCon=false;
      setupChannel();
  }
  else
  {
    setOfflineIcon();
    setNotifyPopup("msgg.html");
    googleCheck=setInterval(connectGoogle,10000);
  }
  
}

function setupChannel()
{

setuping=true;
channelToken=localStorage["channelToken"];

if (channelToken==null)
{
  $.ajax({
   type: "post",
   url: hostadd+"service/channel",
   datatype:"text",
    async:false,
   success: setupChannelHandler
});

}
else
{
  setupChannelCon(channelToken);
}

function setupChannelHandler(data)
{
  var channelToken=data;
  localStorage["channelToken"]=channelToken;
  setupChannelCon(channelToken);
}

function setupChannelCon(channelToken)
{
    var  channel = new goog.appengine.Channel(channelToken);
    socket = channel.open();
    socket.onopen = channelonOpened;
    socket.onmessage = channelonMessage;
    socket.onerror = channelonError;
    socket.onclose = channelonClose;
    setuping=false;
}

}

var isErrProcessing=false;

function channelonError(err)
{
console.log("channel error code: "+ err.code);
var code =err.code;

if (code==0||code==-1)
{
if (window.navigator.onLine==true) { 

  channelSetupErrHandler();
}else
{
  disConnectHandler();
}

}

if (code==400 || code==401|| code==500)
{
  if (code==401|| code==500)
  {
      localStorage.removeItem("channelToken");
  }

    if (window.navigator.onLine==true)
    {
      channelSetupErrHandler();
    }
    else
    {
      disConnectHandler();
    }

}

}

var googleCheck;
function channelSetupErrHandler()
{
  if (!isErrProcessing)
  {
    console.log("channelSetupErrHandler");
    isErrProcessing=true;
    closechannel();

  ping();

  if (isGoogleCon) 
  {
      isGoogleCon=false;
      resetupchannel();
  }
  else
  {
    setOfflineIcon();
    setNotifyPopup("msgg.html");
    googleCheck=setInterval(connectGoogle,10000);
  }

  }
}

function setNotifyPopup(page)
{
  setbuttonnone();
  chrome.tabs.query({}, function(tabs){

    for (var i=0;i<tabs.length;i++)
    {
    tab=tabs[i];
    chrome.browserAction.setPopup({
    tabId: tab.id,
    popup: page
    });

    chrome.tabs.update(tab.id,{});
    }
   });

}

function connectGoogle()
{

  console.log("retry connect google");

  ping();

  if (isGoogleCon) 
  {
    clearInterval(googleCheck);
    removePopup();
    normal();
    isErrProcessing=false;
    isGoogleCon=false;
  }

}

var isGoogleCon = false;

function ping()
{

 console.log("ping google");
  
$.ajax({
  url: talkgadgeturl,
  type: "GET",
  datatype:"text/html",
  async:false,
  timeout:1500,
  statusCode: 
    { 
      401:function(){isGoogleCon=true;}
   }
  });

}

function resetupchannel()
{
    if (!setuping)
      {  
        setupChannel();
        console.log("resetup channel");  
      }
}

function disConnectHandler()
{ 
  if (!isErrProcessing)
  {
  isErrProcessing=true;
  console.log("network disConnectHandler");

  setOfflineIcon();  

  closechannel();
  setNotifyPopup("msg.html");
  conCheck=setInterval(reConnect,10000);
  }
  
}

var conCheck;

function reConnect()
{
  console.log("retry connect");
  if (window.navigator.onLine==true) 
  {
    clearInterval(conCheck);
    removePopup();
    normal();
    isErrProcessing=false;
  }
}

function removePopup()
{
    chrome.tabs.query({}, function(tabs){

    for (var i=0;i<tabs.length;i++)
    {
    tab=tabs[i];
    chrome.browserAction.setPopup({
    tabId: tab.id,
    popup: ''
    });

    chrome.tabs.update(tab.id,{});
    }
   });
}


function channelonClose()
{
  console.log("channel close");
}

function closechannel()
{
  if(socket)
  {
  socket.close();  
  }
  
}

function channelonOpened()
{
  console.log("channel opened");
  isErrProcessing=false;
  isGoogleCon=false;
}


function channelonMessage(msg)
{
  var msg=JSON.parse(msg.data);

  var FavURLShows=msg.FavURLShows;
  var newfavurlnum=msg.newfavurlnum;
   var newgroups=msg.groups;

if (FavURLShows)
{
  console.log("channel msg: FavURLs");
  extractJson(msg);

}
else
{
  if (newfavurlnum)
  {
    console.log("channel msg: unreadmsg"+newfavurlnum);
   unreadCount=parseInt(newfavurlnum);
   updateIcon();
  }
  else
  {
    if (newgroups)
    {
    console.log("channel msg: newgroups");
    saveGroups(newgroups);
    }

  }
}

}

Date.prototype.format = function(format){ 
var o = { 
"M+" : this.getMonth()+1, //month 
"d+" : this.getDate(), //day 
"h+" : this.getHours(), //hour 
"m+" : this.getMinutes(), //minute 
"s+" : this.getSeconds(), //second 
"q+" : Math.floor((this.getMonth()+3)/3), //quarter 
"S" : this.getMilliseconds() //millisecond 
} 

if(/(y+)/.test(format)) { 
format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
} 

for(var k in o) { 
if(new RegExp("("+ k +")").test(format)) { 
format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length)); 
} 
} 
return format; 
} 

function getSendGroups()
{

var groupsstring=localStorage["groups"];

if (groupsstring!=null)
{

  var groups=JSON.parse(groupsstring);


   var sendgroupids='';
   j=0;

    for(var i=0;i<groups.length;i++)
    {
    var id=groups[i].id;
    var status=groups[i].status;
    if (status==3)
    {
        sendgroupids=sendgroupids+id+"|"; 
     j=j+1;
   }
   }

   return  sendgroupids;
}

return null;

}


function send(tab)
{

    if (window.navigator.onLine==true) 
  { 
    recheck();
    if (hasfriends)
    {    
      var tabid=tab.id;

      surl=tab.url;
      surltitle=tab.title;
      siconurl=tab.favIconUrl;
    	  
      var sendgroupids=getSendGroups();

      if (isValidURL(surl))
      {
       var toall=localStorage["toall"];
      
       if(toall==null)
        {
          toall=TOALL;
        }
       
       var tome=localStorage["tome"];
       
       if(tome==null)
        {
    	   tome=TOME;
        }
       
        chrome.tabs.executeScript(tabid,{file: 'js/SendMSG.js'});
        sendurl(tome,toall,sendgroupids,surl,tabid);
      }
    }
    else
    {
       chrome.tabs.create({url: "options.html"});
    }
  }
  else
  {
    disConnectHandler();
  }
  
function isValidURL(s) {
    return (/^https?\:/i).test(s);
}

function sendurl(tome,toall,groupids,surl,tabid)
{

 $.ajax({
    type: "post",
    data:{"tome":tome, "toall":toall,"groupids":groupids,"url":surl, "tabid":tabid, "sendtime":getUTCSendTime(), "urltitle":surltitle, "iconurl":siconurl},
    url: hostadd+"favurl/send",
    datatype:"text",
    statusCode: 
    { 
      404:notFoundHandler
    },
    success: sendhandler
});

} 

function notFoundHandler()
{
    chrome.tabs.sendMessage(tabid, {"status": "notFound"});
}

function getUTCSendTime()
{
  var d = new Date();
  var localTime = d.getTime();
  localOffset = d.getTimezoneOffset() * 60000;
  utc = localTime + localOffset;
  var nd = new Date(utc);
  var sendtime = nd.format("yyyy-MM-dd hh:mm:ss"); 
  return sendtime;
}

function sendhandler(data)
{
  var tabid=parseInt(data);
  console.log("send done:"+tabid);
  chrome.tabs.sendMessage(tabid, {"status": "sentsuccess"});
}

}