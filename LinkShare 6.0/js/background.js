var unreadCount=-1;
var curemail=null;
var socket=null;
var setuping=false;
var channelToken=null;
var login=false;
var online=false;
var setupChannelConTask=null;

console.log("background page");

restore_options();
init();

function restore_options() {
  
	   if(localStorage["maxtabnumber"]==null)
	      localStorage["maxtabnumber"]=MAXTABNUMBER;
	    

	   if(localStorage['tome']==null)
		   localStorage['tome']=TOME;
	   
	   if(localStorage['toall']==null)
		   localStorage['toall']=TOALL;
}

function updateIcon() {

	console.log("updateIcon  "+getCurLocalTime());
	
	if (login)
		{
			if(online)
				{
		    	chrome.browserAction.setIcon({path:loginIcon});
		        chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
			    if (unreadCount > 0)
			    	{
			        chrome.browserAction.setBadgeText({text:unreadCount.toString()});
			    	}
			    else
			    	{
				    chrome.browserAction.setBadgeText({text:""});
			    	}
				}
			else
				{
		    	chrome.browserAction.setIcon({path:notLoginIcon});
		        chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
			    chrome.browserAction.setBadgeText({text:""});
				}
		}
	else
		{
	    	chrome.browserAction.setIcon({path:notLoginIcon});
	    	chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
	    	chrome.browserAction.setBadgeText({text:"?"});
		}
	
}

function setOfflineIcon()
{
	console.log("setOfflineIcon"+getCurLocalTime());
	online=false;
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
	
  console.log("background page log off   "+getCurLocalTime());
  unreadCount=-1;
  curemail=null;
  localStorage.removeItem("groups");
  login=false;
  closechannel();
  updateIcon();
}

chrome.extension.onMessage.addListener(function(message, sender){
  if (message.action == 'relogin')
{
  console.log("content script  "+getCurLocalTime());
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
 console.log("pls login  "+getCurLocalTime());

chrome.cookies.get({"name":cookiename, "url":cookieDomain}, function(cookie){

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
  login=true;
  normal();
  console.log("pls login normal  "+getCurLocalTime());
        }
        else
        {
  chrome.tabs.create({url: authurl},null);
  unreadCount=-1;  
  updateIcon();
  console.log("login page  "+getCurLocalTime());
        }
  });   
}

function normal()
{
  if (window.navigator.onLine==true) 
  { 
    console.log("normal    "+getCurLocalTime());
    getMsgs();
    getUnreadMsgCount();
    getGroups();
    setupChannel();
  }
  else
  {
	  channelErrHandler();
  }
      updateIcon();
}

function init()
{
console.log("init    "+getCurLocalTime());
var oldcuremail=curemail;

chrome.cookies.get({"name":cookiename, "url":cookieDomain}, function(cookie){

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
	  		if(oldcuremail!=curemail)
	  		{
		  		login=true;
		  		online=true;
		  		normal();
		  		updateIcon();
	  		}
        }
        else
        {
	        logoff();
	        setbuttonplslogin();
	        updateIcon();
        }
  });

}

function getUnreadMsgCount()
{
	console.log("getUnreadMsgCount    "+getCurLocalTime());
	$.ajax({
	   type: "get",
	   url: hostadd+"favurl/newnum",
	   dataType:"json",
	   success:function(data){
		   if (data.newfavurlnum)
		   {
		     unreadCount=parseInt(data.newfavurlnum);
		     updateIcon();
		   }
		}	
});

}

function getMsgs()
{
	console.log("getMsgs    "+getCurLocalTime());
	$.ajax({
	type: "get",
    url:hostadd+"favurl/pending",
    dataType:"json",
    success:function(data)
    {
    	if(data)
    	   extractJson(data);
    }
	});

}


function extractJson(data)
{
  
  var maxnumber=localStorage["maxtabnumber"];
  
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


function updateChannel(sid,channel)
{

console.log("updatestatus    "+getCurLocalTime());

$.ajax({
   type: "post",
   data:{ "id": sid,"channel":channel},
   url: hostadd+"favurl/channel",
   dataType:"json",
   success: function(json)
   {
	   if(json)
	   {
	    json=json.FavURLNotify;
	    var nickname=json.nickname;
	    var surl=json.url;
	    var sendtime=getLocalSendTime(json.sendtime);
	    sendtime=jQuery.timeago(sendtime);  
	    var avatarurl=json.avatarURL;

	   if (avatarurl==null)
	     avatarurl=hostadd+'images/mystery-man.jpg';

	   var userid=json.fromid;

	    console.log("updatehandler");

	     chrome.tabs.create({url: surl,active :false},function(tab){
	     
	     chrome.tabs.executeScript(tab.id,{file: 'js/ReceiveMSG.js'},function()
	     {
	     chrome.tabs.sendMessage(tab.id, {"status": "success","nickname":nickname,"sendtime":sendtime,"avatarurl":avatarurl,"userid":userid});
	       });
	       
	     });
	     
	     console.log("tab created"); 
	   }
   }
});

}

function getLocalSendTime(sendtime)
{
  var d = new Date(sendtime);
  var sendtime = d.format("yyyy-MM-dd hh:mm:ss"); 
  return sendtime;
}

function getChannelToken()
{

	console.log("getChannelToken    "+getCurLocalTime());
	
channelToken=localStorage["channelToken"];

if (channelToken==null)
{
  $.ajax({
   type: "post",
   url: hostadd+"service/channel",
   datatype:"text",
   async:false,
   success: function(data){
		if (data)
		{
		  channelToken=data;
		  localStorage["channelToken"]=channelToken;
		}	   
   }
});

}

}

function setupChannelCon()
{
	if (!channelOpened)
	{
		if (!setuping)
		{
		console.log("setupChannelCon     "+getCurLocalTime());		
		setuping=true;
		isGoogleCon=false;		      
		var  channel = new goog.appengine.Channel(channelToken);
		socket = channel.open();
		socket.onopen = channelonOpened;
		socket.onmessage = channelonMessage;
		socket.onerror = channelonError;
		socket.onclose = channelonClose;
		}
	}
else
	{
    	clearInterval(googleCheck);
	}
	
}

function setupChannel()
{
	console.log("setupChannel    "+getCurLocalTime());
	getChannelToken();
	ping();  
	if (isGoogleCon) 
		{
			channelOpened=false;		
			setupChannelConTask=setInterval(setupChannelCon(),10000);	
			setbuttonsend();
		}
		else
		{
			setOfflineIcon();
			setNotifyPopup("discongoogle.html");
			googleCheck=setInterval(connectGoogle,10000);
		}		
}

function connectGoogle()
{

  console.log("retry connect google    "+getCurLocalTime());

  ping();

  if (isGoogleCon) 
  {
    clearInterval(googleCheck);
    removePopup();
    channelOpened=false;    
	setupChannelConTask=setInterval(setupChannelCon(),10000);
	
    online=true;
	setbuttonsend();
	getMsgs();
	getUnreadMsgCount();
	updateIcon();
    isGoogleCon=false;
    isErrProcessing=false;
  }

}

var conCheck;

function reConnect()
{
  console.log("retry connect    "+getCurLocalTime());
  if (window.navigator.onLine==true) 
  {
    clearInterval(conCheck);
    removePopup();
    
    online=true;
	getMsgs();
	getUnreadMsgCount();
	updateIcon();
    setupChannel();
    isErrProcessing=false;
  }
}

var channelOpened=false;
function channelonOpened()
{
  console.log("channel opened    "+getCurLocalTime());
  channelOpened=true;
  setuping=false;
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
	  console.log("channel msg: FavURLs   "+getCurLocalTime());
	  extractJson(msg);	
	}
	else
	{
	  if (newfavurlnum)
	  {
			console.log("channel msg: unreadmsg    "+newfavurlnum+" "+getCurLocalTime());
			unreadCount=parseInt(newfavurlnum);
			updateIcon();
	  }
	  else
	  {
		    if (newgroups)
		    {
			    console.log("channel msg: newgroups    "+getCurLocalTime());
			    saveGroups(newgroups);
		    }	
	  }
	}

}

var isErrProcessing=false;

function channelonError(err)
{
	setuping=false;
if (login)
	{
		console.log("channel error code: "+ err.code+" "+getCurLocalTime());
		var code =err.code;
	
		if (code==401|| code==500)
		{
		    localStorage.removeItem("channelToken");
		}
	
		channelErrHandler();
	}
else
	{
		localStorage.removeItem("channelToken");
	}
}

function channelonClose()
{
	setuping=false;
  console.log("channel closed    "+getCurLocalTime());
}

function channelErrHandler()
{

	if (!isErrProcessing)
	{  
		isErrProcessing=true;
		if (window.navigator.onLine==true)
		{ 
			console.log("channel setup error    "+getCurLocalTime());
			closechannel();	
			setupChannel();
		}
		else
		{
			console.log("network disconnect    "+getCurLocalTime());
			setOfflineIcon();  
			closechannel();
			setNotifyPopup("disconnect.html");
			conCheck=setInterval(reConnect,10000);					  
		}				
	}

}

var googleCheck;

function setNotifyPopup(page)
{
	console.log("setNotifyPopup     "+getCurLocalTime());	
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

function removePopup()
{
	console.log("removePopup    "+getCurLocalTime());
	
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

var isGoogleCon = false;

function ping()
{
console.log("ping google   "+getCurLocalTime());
  
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


function closechannel()
{
	console.log("closeChannel    "+getCurLocalTime());
	
  if(socket)
  {
	  socket.close();  
  }
  
}

var hasfriend=false;

function checkFriends()
{

	console.log("checkFriends    "+getCurLocalTime());
	
$.ajax({
   type: "get",
   url: hostadd+"friend/available",
   dataType:"text",
   async:false,
   success: function (data){
	    if(data)
	    {
	      if (data==="true")
	      {
	    	  hasfriend=true;
	      }
	     
	     if (data==="false")
	      {
	    	 hasfriend=false;
	      }
	    }
   }
});
}

var friends_num=0;
function getSendGroups()
{
	console.log("getSendGroups    "+getCurLocalTime());
	friends_num=0;
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
        friends_num=friends_num+groups[i].num;
   }
   }

   return  sendgroupids;
}

return null;

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


function getCurLocalTime()
{
  var d = new Date();
  var sendtime = d.format("yyyy-MM-dd hh:mm:ss"); 
  return sendtime;
}

function isValidURL(s) {
    return (/^https?\:/i).test(s);
}

function send(tab)
{
	console.log("send    "+getCurLocalTime());
   if (window.navigator.onLine==true) 
   { 
	   var surl=tab.url;
	   if (isValidURL(surl))
	   {       	
		      var tabid=tab.id;
		      var sendgroupids=undefined;
		      var surltitle=tab.title;
		      var siconurl=tab.favIconUrl;
		      var toall=toBool(localStorage["toall"]);
		      var hasSentFriends=false;
		      		       
		       if (!toall)
		    	   {
		    	   sendgroupids=getSendGroups();
		    	   if (friends_num>0)
		    		   {
		    		   hasSentFriends=true;
		    		   }
		    	   }
		       
		       if(toall)
		    	   {
		    	   checkFriends();		    	   
		    	   if(hasfriend)
		    		   hasSentFriends=true;
		    	   }
		    	   
		       var tome=toBool(localStorage["tome"]);		       
		       
		       if (tome)
		       hasSentFriends=true;
		       
	    	   chrome.tabs.executeScript(tabid,{file: 'js/SendMSG.js'},function (){
			       if (!hasSentFriends)
		    	   {
			    	   if (toall)
			    		   {
			    		   chrome.tabs.sendMessage(tabid, {"status": "noFriends"});
			    		   }
			    	   else
			    		   {
			    		   if (sendgroupids.length>0)
			    			   chrome.tabs.sendMessage(tabid, {"status": "noFriendsInGroup"});
			    		   else
			    			   chrome.tabs.sendMessage(tabid, {"status": "noGroupSelected"});	   
			    		   }	    	   
		    	   }
		       else
		    	   {
		    	   sendURLRequest(tome,toall,sendgroupids,surl,tabid,surltitle,siconurl);
		    	   }	    		   
	    	   });
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
  
	function sendURLRequest(tome,toall,groupids,surl,tabid,urltitle,iconurl)
	{
	
		console.log("sendURLRequest    "+getCurLocalTime());
	 $.ajax({
	    type: "post",
	    data:{"tome":tome, "toall":toall,"groupids":groupids,"url":surl, "tabid":tabid, "sendtime":getUTCSendTime(), "urltitle":urltitle, "iconurl":iconurl},
	    url: hostadd+"favurl/send",
	    datatype:"text",
	    statusCode: 
	    { 
	      404:function()
	      {
	    	  chrome.tabs.sendMessage(tabid, {"status": "notFound"});
	      }
	    },
	    success: function(data)
	    {
	    	var tabid=parseInt(data);
	    	console.log("send done:"+tabid);
	    	chrome.tabs.sendMessage(tabid, {"status": "sentsuccess"});
	    }
	 });
	
	} 
}