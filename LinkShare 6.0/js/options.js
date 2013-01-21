
var curemail=null;

function displayUserInfo()
{
	$.ajax({
		type:"GET",
		url:hostadd+"user",
		dataType:"JSON",
		success:function(data){
			var userinfo=data.user;
			$('#email').html(userinfo.email);
			$('#nickname').html(userinfo.nickname);
			$("#user_link").attr("href",hostadd+'user/page?id='+userinfo.id);
			
			var avatarURL=userinfo.avatarURL;
			if (avatarURL==null)
				avatarURL=hostadd+'images/mystery-man.jpg';
			
			$("#user_avatar").attr("src", avatarURL);
		}	
	})
}

function addSignOutEvent()
{
$('#signout').click(function()
		{
			curemail=null;
			window.location.href=hostadd+"service/logoff";
			chrome.extension.sendRequest({action:'logoff'}, function(response) {
			console.log('option page log off');
	    });
		});
}

function addTabNumChangeEvent()
{
var temp;
$("#maxtabnumber").bind({
	focusin:function (){
		temp=$(this).val();
		},
	focusout:function (){
		var lastValue=$(this).val();
		if(temp!=lastValue&&null!=lastValue&&""!=lastValue)
		{
			localStorage["maxtabnumber"] =lastValue;
		}
	}
 });
}

function restore_options() {

  var maxnumber=localStorage["maxtabnumber"];
  
   if(maxnumber==null)
    {
      maxnumber=MAXTABNUMBER;
    }
   
   $('#maxtabnumber').val(maxnumber);
   $('.ccme_check')[0].checked = toBool(localStorage['tome']);
   $('.toall_check')[0].checked = toBool(localStorage['toall']);
   
   addGroupCheckEvent();	
   addCCmeCheckEvent();
   addToallCheckEvent();
   
   getGroups();
   displayGroups();  
}

var toBool = function(str) {
	if ("false" === str) return false;
	if ("true" === str) return true;
};

function displayGroups()
{
	   var groupsstr=localStorage["groups"];
	   if (groupsstr!=null)
	   {
	     var groups=JSON.parse(groupsstr);
	    
	 	$('#group_box li').remove();
	 	
		$(groups).each(function(){									
			var str1='<li data-id="'+ this.id+'">';
			
			var str2='';
			if (this.status==3)
				str2='<input type="checkbox" class="group_check" checked="true" />';
			else
				str2='<input type="checkbox" class="group_check" />';
			
			var str3='<label >'+this.name+'</label >';
			var str4='</li>';
			var str=str1+str2+str3+str4;
			$('#group_box').append(str);
		})
		
	   }
}

function setGroupStatus(groupid,status)
{
	   var groupsstr=localStorage["groups"];
	   var groups=undefined;
	   if (groupsstr!=null)
	   {
	     groups=JSON.parse(groupsstr);
	     
	      for(var i=0;i<groups.length;i++)
	      {
				 if (groups[i].id==groupid)
				 {
					 groups[i].status=status;
					 break;
				 }
	      }
		
	   }
	   localStorage["groups"]=JSON.stringify(groups);	   
}

function addGroupCheckEvent()
{
	$('#group_box li .group_check').live("click",function(){		
		var groupid = $(this).parents('li').attr('data-id');
		if (this.checked)
			{
				setGroupStatus(groupid,3);
			}
		else
			{
				setGroupStatus(groupid,0);
			}
	});
}

function addCCmeCheckEvent()
{
	$('.ccme_check').click(function(){		
		localStorage['tome'] = this.checked;
	});
}

function addToallCheckEvent()
{
	$('.toall_check').click(function(){		
		localStorage['toall'] = this.checked;
	});
}

onload=function()
{

console.log("init");
chrome.cookies.get({name:"current_USERID", url:cookieDomain,}, function(cookie){

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
	 	displayUserInfo();
	 	addSignOutEvent();
	 	addTabNumChangeEvent();
	 	restore_options();
    }
  else
  	{      
	  chrome.tabs.create({url: authurl},null);
	  window.close();
  	}
  });


 }
