var hostadd="http://localhost:8888/";
var cookieDomain="http://localhost";
var authurl=hostadd+"login.html";
var talkgadgeturl="https://talkgadget.google.com/talkgadget/dch/test";
var cookiename="current_USERID";
var MAXTABNUMBER=20;
var TOALL=true;
var TOME=false;

var notLoginIcon="images/gmail_not_logged_in.png";
var loginIcon="images/gmail_logged_in.png";

Array.prototype.remove=function(dx)
{
	if(isNaN(dx)||dx>this.length)
	{
		return false;
	}

	for(var i=0,n=0;i<this.length;i++)
　　	{
		if(this[i]!=this[dx])
　　　　	{
　　　　　　		this[n++]=this[i];
　　　　	}
　　	}

　　this.length-=1;
}

var toBool = function(str) {
	if ("false" === str) return false;
	if ("true" === str) return true;
};

function getGroups()
{

$.ajax({
   type: "get",
   url: hostadd+"group",
   dataType:"json",
    async:false,
   success: getGroupsHandler
});

function getGroupsHandler(data)
{
    if(data)
  {
    var newgroups=data.groups;
    saveGroups(newgroups);
  }

}

}

function saveGroups(newgroups)
{

  if (newgroups.length>0)
  {
    var groupsstr=localStorage["groups"];
    if (groupsstr!=null)
    {
      var groups=JSON.parse(groupsstr);

      for(var i=0;i<newgroups.length;i++)
      {
        var newid=newgroups[i].id;
        var type=newgroups[i].type;

        if (type=="SEND")
        {
          for(var j=0;j<groups.length;j++)
          {
            var id=groups[j].id;

            if (id==newid)
            {
              var status=groups[j].status;
              newgroups[i].status=status;
              break;
            }
          }
        }
      }

      for(var i=0;i<newgroups.length;i++)
      {
        var type=newgroups[i].type;

        if (type!="SEND")
        {
          newgroups.remove(i);
        }
      }
    }
    
  }
  localStorage["groups"]=JSON.stringify(newgroups);
  
}



