LPBackgroundRequester=function(e){return function(t,n){n=n||{};var i,a=this,o=null,r=!1,c=[],s=n.interfaceDefinition,u=Date.now(),f=function(e){LPMessaging.handleResponse(e)},d=function(e,t){LPMessaging.handleRequest(s,e,function(e){l({type:"contentScriptResponse",data:e,frameID:t})},{context:n.reflectionContext,additionalArguments:t})},l=function(e){e.sourceFrameID=o,LPMessaging.makeRequest(i,e)},m=function(e){if(null===o&&e.request.initializationID===u){"undefined"!=typeof Topics&&Topics.get(Topics.REQUEST_FRAMEWORK_INITIALIZED).publish(e,a),o=e.frameID,r=!1,i({type:"initialized",sourceFrameID:o});for(var t=0,n=c.length;t<n;++t)c[t]()}},p=function(t){var i=n.reflectionContext||e,a=function(){var e="interactive"===document.readyState||"complete"===document.readyState;return e&&(t(),i.removeEventListener("readystatechange",a,!0)),e};a()||i.addEventListener("readystatechange",a,!0)},g=function(e){if(e.frameID===o)switch(e.type){case"backgroundResponse":case"contentScriptResponse":f(e.data);break;case"contentScriptRequest":d(e.data,e.sourceFrameID)}else"initialization"===e.type&&m(e.data)},h=function(t){p(function(){i({type:"initialize",data:{initializationID:u,interfaceName:n.interfaceName,top:n.mainRequestFramework,url:e.location.href,childFrameCount:document.getElementsByTagName("iframe").length,frameIdentity:t}})})};this.initialize=function(e){null!==o||r||(i=t(g),n.frameIdentityManager?n.frameIdentityManager.getFrameIdentity(h):h(),r=!0),e&&c.push(e)},this.sendRequest=function(e){null===o?this.initialize(function(){l(e)}):l(e)}}}(this);