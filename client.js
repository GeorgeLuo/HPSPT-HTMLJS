      $.mobile.ajaxEnabled = false;
            var x = document.getElementById("demo");
            var socket = null;
            var isopen = false;
            var returningUser = false;
			var gender = "";
            var id = ""
            var gpsLongitude;
            var gpsLatitude;
			var permcity;
			var listCreated = false;
			var heatmap;
      var googlemap;
			
			function findCity() {
				//I'm not doing anything else, so just leave
    navigator.geolocation.getCurrentPosition(function(pos) {
		geocoder = new google.maps.Geocoder();
		var latlng = new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
		geocoder.geocode({'latLng': latlng}, function(results, status) { 
			if (status == google.maps.GeocoderStatus.OK) {
				var result = results[0];
				var city = "";
				for(var i=0, len=result.address_components.length; i<len; i++) {
					var ac = result.address_components[i];
					if(ac.types.indexOf("locality") >= 0) city = ac.long_name;
				}
					console.log("your city: " + city);
          permcity = city;
					localStorage.setItem("hotspotlocation", city);
			} 
		});
    });


			}
			
                // Also works with: var yourStartLatLng = '59.3426606750, 18.0736160278';
				        $('#map').live("pageshow", function() {
                var yourStartLatLng = new google.maps.LatLng(gpsLatitude, gpsLongitude);
                $('#map_canvas').gmap({'center': yourStartLatLng, 'zoom': 17, 'disableDefaultUI': true});
				console.log("your latitude is " + gpsLatitude + ", longitude " + gpsLongitude);
        
				mapRequest();
        });
		
            $(function () {
				setLocation();
				document.getElementById('loginButton').style.visibility='hidden';
                console.log(localStorage.getItem("hotspotsecretpassword") + " is the password");
                if (localStorage.getItem("hotspotsecretpassword") != null) {
                    returnUser = true;
                    id         = localStorage.getItem("hotspotsecretpassword");
					          permcity   = localStorage.getItem("hotspotlocation");
                    setTimeout(hideSplash, 5000);
                } else {
					          findCity();
                    setTimeout(hideSplashtoLogin, 5000);
                }
            });

            function hideSplash() {
                $.mobile.changePage("#map", "slide");
            }

            function hideSplashtoLogin() {
                $.mobile.changePage("#login", "slide");
            }

            function login() {
                var box = document.getElementsByName('login_info')[0];
                id            = box.value;
                returningUser = true;
                localStorage.setItem("hotspotsecretpassword", id);
                localStorage.setItem("hotspotlocation", permcity);
				if($('#radio-choice-h-6a').prop('checked'))
					gender = "male";
				if($('#radio-choice-h-6b').prop('checked'))
					gender = "female";
				if($('#radio-choice-h-6c').prop('checked'))
					gender = "withhold";
                var message = "login/%/" + id + "/%/" + gender + "/%/" + gpsLatitude + "/%/" + gpsLongitude + "/%/" + permcity;
                if (isopen) {
                    socket.send(message);
                    console.log("Text message: " + message + " sent.");
                    mapRequest();
            }
			}

            function setLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(update);
                }
            }

            function update(position) {
                gpsLatitude  = position.coords.latitude;
                gpsLongitude = position.coords.longitude;
                console.log("location set to " + gpsLatitude + " " + gpsLongitude);
            }

           // setInterval(sendLocation, 60000);

            window.onload = function () {

                socket            = new WebSocket("ws://107.170.187.49:160");
                socket.binaryType = "arraybuffer";

                socket.onopen     = function () {
                    console.log("Connected!");
                    isopen = true;
                }

                socket.onmessage = function (e) {
                    if (typeof e.data == "string") {
						console.log(e.data);
						decodelist = (e.data).split(':>');
						var requestType = decodelist[0]
                        console.log("Text message received: " + e.data);
						if (requestType == "citydata")
						{
							var content = decodelist[1];
							var contentlist = content.split(",");
							var tempLatLong = "";
              var displayArray = [];
							for(var i = 0; i < contentlist.length-1; i++)
							{
							tempLatLong = contentlist[i].match(/\S+/g);
							console.log(tempLatLong);
							var point = new google.maps.LatLng(tempLatLong[0], tempLatLong[1]);
							displayArray.push(point);
							//$('#map_canvas').gmap('addMarker', { 'position': point } );
							}
							console.log("Display array: " + displayArray);
              var pointArray = new google.maps.MVCArray(displayArray);
							  heatmap = new google.maps.visualization.HeatmapLayer({
								data: pointArray,
                opacity: 0.4
							});
              try{
              heatmap.setMap($('#map_canvas').gmap('get','map'));
              }
              catch (e) {setTimeout(function() {throw e; }, 0);} 
						}
            
            if (requestType == "hotspotsare") {
  					
						var contentJSON = JSON.parse(decodelist[1]);
						$.each(contentJSON, function(key, value) {
							var hs = new google.maps.LatLng(value.match(/\S+/g)[0], value.match(/\S+/g)[1]);
							$('#map_canvas').gmap('addMarker', {'position': hs } ).click(function()
              {
								$("#map_canvas").gmap("openInfoWindow", { "content": key + " and the ratio is: "}, this);
							});
						});
						}
						
						if (requestType == "collegeBoardData")
						{
							var content = decodelist[1];
							var contentlist = content.split("/@$/");
							for(var i = 0; i < contentlist.length-1; i++)
							{
							if(!listCreated){
								$("#content").append("<ul id='list' data-role='listview' data-inset='true'></ul>");
								listCreated = true;
								$("#content").trigger("create");
								}
								
								$("#list").append("<li>" + contentlist[i] + "</li>");
								$("#list").listview("refresh");
								
							}
						}
						
						}
						
                      else {
                        var arr = new Uint8Array(e.data);
                        var hex = '';
                        for (var i = 0; i < arr.length; i++) {
                            hex += ('00' + arr[i].toString(16)).substr(-2);
                        }
                        console.log("Binary message received: " + hex);
                    }
                }

                socket.onclose = function (e) {
                    console.log("Connection closed.");
                    socket = null;
                    isopen = false;
                }
            };

            function sendLocation() {
                if (returningUser == true) {
                    setLocation()
                    var message = "locationis/%/" + gpsLatitude + "/%/" + gpsLongitude + "/%/" + id;
                    if (isopen) {
                        socket.send(message);
                        console.log("Text message sent.");
                    } else {
                        console.log("Connection not opened.")
                    }
                }
            };

            function mapRequest() {
				
                var message = "mapRequest/%/" + permcity;

                if (isopen) {
                    socket.send(message);
                    console.log("Text message: " + message + " sending");
                } else {
                    console.log("Connection not opened.")
                }
            };
			
			function up()
			{
			  $('#map_canvas').gmap('clear', 'markers');
			  gpsLatitude = 38.034586, -78.498864
			  permcity = "Charlottesville"
			var LatLng = new google.maps.LatLng(38.034586, -78.498864);
			$('#map_canvas').gmap('get','map').setOptions({'center':LatLng});
			console.log("coordinates faked");
			pullCollegeBoard(permcity);
			}
			
			function pullCollegeBoard(city) {
			if(listCreated)
			{
				$("#list").empty();
				$("#list").listview("refresh");
				listCreated = false;
			}
			socket.send("collegeBoardRequest/%/" + city);
			}

            function sendBinary() {
                if (isopen) {
                    var buf = new ArrayBuffer(32);
                    var arr = new Uint8Array(buf);
                    for (i = 0; i < arr.length; ++i) 
                        arr[i] = i;
                    socket.send(buf);
                    console.log("Binary message sent.");
                } else {
                    console.log("Connection not opened.")
                }
            };
			
			function deleteAccount()
			{
			localStorage.removeItem("hotspotlocation");
			localStorage.removeItem("hotspotsecretpassword");
			}
			
			function sendCollegePost()
			{
			if (!$("#post").val().trim()==""){
			socket.send("sendCollegePost/%/" + $("#post").val().trim() + "/%/" + permcity + "/%/" + id);
			$("#post").val("");
			$("#list").empty();
			$("#list").listview("refresh");
			}
			}
			
            
            function appendToList(){
                if(!listCreated){
                    $("#content").append("<ul id='list' data-role='listview' data-inset='true'></ul>");
                    listCreated = true;
                    $("#content").trigger("create");
                }
				
				if (!$("#post").val()=="")
				{
				$("#list").append("<li>" + $("#post").val() + "</li>");
				$("#list").listview("refresh");
				$("#post").val("");
				}
				}
                