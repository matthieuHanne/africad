mode = 'test'; //test or prod
if(mode === 'test') {
    debug = true;
    api_address = '10.0.0.2';
}
else {
    debug = false;
    api_address = 'www.rendementlocatif.com';
}

$( document ).ready(function() {
    
    $("a#getAnnonce").on("click", function (e) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'getAnnonce', bienId: $('select#biens').val()}, function() {
                if(debug) {
                    console.log('test');
                }
            });
        });
        e.preventDefault();
    });
    
    /*$.ajax({
            type: "GET",
            url: 'http://' + api_address + '/api/web/gestion/biens',
            cache: true,
            beforeSend: function(xhr){
                xhr.setRequestHeader('X-API-KEY', 'oid(546dfggd==--,sdf34DFGH123poitrz5TB,5');
            },
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            crossDomain: true,
            statusCode: {
                404: function(response) {
                        console.log('404');
                    }
                }
        })
        .success(function(response) {
            if(debug) {
                console.log(response);
            }
            var lastBienId;
            if(!jQuery.isEmptyObject(response.biens)) { 
                $.each(response.biens, function( index, value ) {
                    $.each(value, function (index2, value2) {
                        $('select#biens').append('<option value="'+value2.id+'">'+value2.nom+' - '+value2.surface+' m2</option>');
                        lastBienId = value2.id;
                    });
                });
                $('select#biens').val(lastBienId);
            }
        }); */
        
});

    
