var background_page = chrome.extension.getBackgroundPage();
var current_tab;

function serviceClick(service)
{    
	return function () 
	{
       share(service, current_tab);
    }
}

function addActions()
{
	var show_actions = false;
	
	var actions = actionsGetter();
	var action_element = document.getElementById('actions');
	
	for (var action in actions)
	{		
		if(!actions[action])
			continue;

		show_actions = true;
			
		var element = document.createElement('div');
		element.setAttribute('class', 'item');
			
		var image = document.createElement('img');
		image.setAttribute('width', '16');

		var nbsp = document.createTextNode('\u00A0');
		
		var anchor = document.createElement('a');
		anchor.setAttribute('href', '#');
		
		switch(action)
		{
			case 'copy':
				image.id = 'copy_link';
				image.setAttribute('src', 'images/copy.png');
				
				anchor.innerText = chrome.i18n.getMessage('copy');
				anchor.addEventListener('click', function () 
												{ 
													background_page.copyToClipboard(current_tab.shortenedUrl); 
													window.close(); 
												}
												, false);
			break;
			
			case 'details':
				image.setAttribute('src', 'images/details.png');
				
				anchor.innerText = chrome.i18n.getMessage('details');
				anchor.addEventListener('click', function () { chrome.tabs.create({url: current_tab.shortenedUrl + '+' }); }, false);
			break;
			
			case 'qrcode':
				image.setAttribute('src', 'images/qrcode.png');
				
				anchor.innerText = chrome.i18n.getMessage('qr_code');
				anchor.addEventListener('click', function () 
												{ 
													document.getElementById('qrcode').setAttribute('style', 'visibility:visible; display:block;'); 
													element.setAttribute('style', 'visibility:hidden; display:none;');
												}
												, false);
			
				var qr_code = document.getElementById('qrcode');
				
				var image_qr_code = document.createElement('img');
				image_qr_code.setAttribute('src' , 'http://chart.apis.google.com/chart?cht=qr&chs=120x120&choe=UTF-8&chld=H|0&chl=' + current_tab.shortenedUrl);
				image_qr_code.setAttribute('style', 'cursor: pointer;');
				image_qr_code.addEventListener('click' , function () { chrome.tabs.create({url: current_tab.shortenedUrl + '.qr'}); }, false);
				
				qr_code.appendChild(image_qr_code);
			break;
		}
		
		element.appendChild(image);
		element.appendChild(nbsp);
		element.appendChild(anchor);
		action_element.appendChild(element);
	}
	
	if(show_actions)
		document.getElementById('actions').setAttribute('style', 'visibility:visible; display:block;');
}

function addServices()
{		
	var show_services = false;

	var services = servicesGetter();
	var services_element = document.getElementById('services');
	
	for (var service in services)
	{		
		if(!services[service] || servicesJSON[service] == undefined)
			continue;
			
		show_services = true;
	
		var element = document.createElement('div');
		element.setAttribute('class', 'item');
		
		var image = document.createElement('img');
		image.setAttribute('width', '16');
		image.setAttribute('src', 'images/' + servicesJSON[service].icon);

		var nbsp = document.createTextNode('\u00A0');
		
		var anchor = document.createElement('a');
		anchor.setAttribute('href', '#');
		anchor.innerText = servicesJSON[service].name;
		anchor.addEventListener('click', serviceClick(service));
		
		element.appendChild(image);
		element.appendChild(nbsp);
		element.appendChild(anchor);
		services_element.appendChild(element);
	}	
	
	if(show_services)
		services_element.setAttribute('style', 'visibility:visible; display:block;');
}

function onResponse(response)
{				
	if(response.status == 'error')
	{
		document.getElementById('loading').innerText = response.message;
	}
	else
	{
		var preferences = preferencesGetter();
	
		current_tab.shortenedUrl = response.message;
	
		if(preferences.auto_copy)
			background_page.copyToClipboard(current_tab.shortenedUrl);
	
		document.getElementById('url').innerText = current_tab.shortenedUrl;
		
		if(current_tab.incognito)
		{					
			var history_element = document.getElementById('history');
			history_element.innerText = chrome.i18n.getMessage('incognito_mode');
		}
		else
		{
			if(preferences.history_enabled)
			{					
				var history_element = document.getElementById('ahistory');
				if(response.added_to_history == false)
				{
					history_element.innerText = chrome.i18n.getMessage('not_added_to_history');
					history_element.setAttribute('style', 'color: #C80000');
					history_element.addEventListener('click', function () { chrome.tabs.create({url: 'options.html'}); }, false)
				}
				else
				{
					history_element.innerText = chrome.i18n.getMessage('added_to_history');
					history_element.setAttribute('style', 'color: #008000;');
					history_element.addEventListener('click', function () { chrome.tabs.create({url: 'http://goo.gl'}); }, false)
				}
			}
			else
			{
				document.getElementById('history').setAttribute('style', 'visibility:hidden; display:none;');
			}
		}
		
		addActions();
		addServices();
		
		document.getElementById('loading').setAttribute('style', 'visibility:hidden; display:none;');
		document.getElementById('response').setAttribute('style', 'visibility:visible; display:block;');
	}
}

function init()
{
	chrome.tabs.getSelected(null, function(tab) 
	{
		current_tab = tab;
		background_page.shortenUrl(tab.url, tab.incognito, onResponse);
	});
}

document.addEventListener('DOMContentLoaded', function () 
{
	document.getElementById('loading').innerText = chrome.i18n.getMessage('shortening');
	document.getElementById('actions').innerHTML = "<div class=\"title\">" + chrome.i18n.getMessage('actions') + "</div>";
	document.getElementById('services').innerHTML = "<div class=\"title\">" + chrome.i18n.getMessage('services') + "</div>";
	init();
});