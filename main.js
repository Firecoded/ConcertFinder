/* Listen for the document to load and initialize the application
* @param {function} initializeApp -
*/
$(document).ready(initializeApp);

/**
 * Define all global variables here (below).
 */
/*****************************
*/
var venueSearchResults = [];
var buyTicketsUrl;
var map;
var service;
var latitude;
var longitude;
var lastWindow;
var pageClasses = {
    'page1': '.home',
    'page2': '.event-results',
    'page3': '.concert-details',
    'page4': '.google-maps',
    'page5': '.yelp'
};

/***************************************************************************************************
 * initializeApp
 * @params {undefined} none
 * @returns: {undefined} none
 * initializes the application
 * @calls addClickHandlers
 */

function initializeApp() {
    addClickHandlers();
}

/***************************************************************************************************
* addClickHandlers()
* @params {undefined}
* @returns  {undefined}
* using event delegation, adds click handlers to all elements that need to be clicked
*/

function addClickHandlers() {
    $('#searchGenre').click(handleSearchClick);
    $('.reset').click(startOver);
    $('.reset-2').click(startOver);
    $(".events-body").on("click", ".details", handleDetailsClick);
    $('.results').click(function () {
        transitionPages('page3', 'page2');
    });
    $('.back-to-map').click(goToMap);

    $('#tickets').click(buyTicketsLink);
    $('.back-to-details').click(function () {
        transitionPages('page4', 'page3');
    });
    $('#bar').click(callBars);
    $('#restaurant').click(callRestaurant);
    $('#lodging').click(callHotels);
}

/*************************************************************************************************
* handleSearchClick()
* store city and genre in local variables
* @param: {undefined} none
* @returns: {undefined} none
* @calls getVenueData AJAX function with city and genre variables as parameters
*/

function handleSearchClick() {
    var genreInput = $('#genre :selected');
    var genre = genreInput.val();
    var city = $('#city').val();
    getVenueData(city, genre);
}

/*************************************************************************************************
* getVenueData ajax function
* @param: {string} city
* @param: {string} genre
* @returns runs ticketmaster ajax call and stores result into global array
* @calls page2DomCreation function
* @calls transitionPages function (hide page1, show page2)
*/

function getVenueData(city, genre) {
    var custUrl = 'https://app.ticketmaster.com/discovery/v2/events.jsonp?apikey=hNel2sQARoJR6Ac22KIbXszvF728H6e2';
    if (city) {
        custUrl += '&city=' + city;
    }
    if (genre) {
        custUrl += '&classificationName=' + genre;
    }
    var ajaxConfig = {
        url: custUrl,
        success: function (result) {
            if (result.page.totalElements > 0) {
                for (var venueI = 0; venueI < result._embedded.events.length; venueI++) {
                    venueSearchResults[venueI] = result._embedded.events[venueI];
                }
                $('#city').val('');
                page2DomCreation(venueSearchResults);
                transitionPages('page1', 'page2');
            } else {
                showErrorModal();
            }
        },
        error: function (err) {
            console.log(err);
        }
    };
    $.ajax(ajaxConfig);
}

/*************************************************************************************************
* page2DomCreation function
* using search results stored in global array, will create html elements with various info and then append the elements onto the page
* will create a link on each dom element, possible store index number into dom element to be referenced later
* dom element link will call handlePage3Details function with dom index as param
* @param {array} venueSearchResults
*/

function page2DomCreation(venueSearchResults) {
    $('.events-body').empty();
    for (var resultIndex = 0; resultIndex < venueSearchResults.length; resultIndex++) {
        if (resultIndex % 2 === 0) {
            var eachEventDetailBody = $('<div>', { 'class': 'light' });
        } else {
            var eachEventDetailBody = $('<div>', { 'class': 'dark' });
        }
        var leftEventDiv = $('<div>', { 'class': 'left-event' });
        var eachArtistName = $('<div>', { 'class': 'artist', text: 'ARTIST: ' });
        var artistObject = $('<span>').text(venueSearchResults[resultIndex].name);
        eachArtistName.append(artistObject);

        var eachVenueName = $('<div>', { 'class': 'venue', text: 'VENUE: ' });
        var venueObject = $('<span>').text(venueSearchResults[resultIndex]._embedded.venues[0].name);
        eachVenueName.append(venueObject);

        var eachVenueCity = $('<div>', { 'class': 'results-city', text: 'CITY: ' });
        var cityObject = $('<span>').text(venueSearchResults[resultIndex]._embedded.venues[0].city.name);
        eachVenueCity.append(cityObject);

        var centerEventDiv = $('<div>', { 'class': 'center-event' });
        var eachEventDate = $('<div>', { 'class': 'date', text: 'DATE: ' });
        var dateObject = $('<span>').text(convertDateFormat(venueSearchResults[resultIndex].dates.start.localDate));
        eachEventDate.append(dateObject);

        var eachEventTime = $('<div>', { 'class': 'time', text: 'TIME: ' });
        var timeObject = $('<span>').text(convertMilitaryTime(venueSearchResults[resultIndex].dates.start.localTime));
        eachEventTime.append(timeObject);

        var rightEventDiv = $('<div>', { 'class': 'right-event' });
        var buttonObject = $('<button>', { 'type': 'button', 'class': 'details', 'arrayindex': resultIndex, text: 'DETAILS' });

        rightEventDiv.append(buttonObject);
        leftEventDiv.append(eachArtistName, eachVenueName);
        centerEventDiv.append(eachEventDate, eachEventTime, eachVenueCity);
        eachEventDetailBody.append(leftEventDiv, centerEventDiv, rightEventDiv);

        $('.events-body').append(eachEventDetailBody);
    }
}

/***************************************************************************************************
 * convertMilitaryTime
 * @params {string} milTime
 * @returns {string} timeValue - converted time
 */
function convertMilitaryTime(milTime) {
    if (!milTime) {
        return;
    }
    var time = milTime;
    time = time.split(':');
    var hours = Number(time[0]);
    var minutes = Number(time[1]);
    var seconds = Number(time[2]);
    var timeValue;
    if (hours > 0 && hours <= 12) {
        timeValue = "" + hours;
    } else if (hours > 12) {
        timeValue = "" + (hours - 12);
    } else if (hours == 0) {
        timeValue = "12";
    }
    timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;
    timeValue += (hours >= 12) ? " P.M." : " A.M.";
    return timeValue;
}

/***************************************************************************************************
 * initializeApp
 * @params {string} yyddmm - date
 * @returns {string} returnDate - converted date
 */
function convertDateFormat(yyddmm) {
    var newDate = yyddmm.split('-');
    var returnDate = (newDate[1]) + '-' + newDate[2] + '-' + newDate[0];
    return returnDate;
}

/*************************************************************************************************
* transitionPages
* @params {string} pageToHide, {string} pageToShow - which page to show, which page to hide
*/
function transitionPages(pageToHide, pageToShow) {
    $(pageClasses[pageToHide]).addClass('hidden');
    $(pageClasses[pageToShow]).removeClass('hidden');
}

/**************************************************************************************************
* goToMap - transitions to map from other pages
* @param: {undefined} none
* @returns: {undefined} none
*/
function goToMap() {
    $('.google-maps').removeClass('hidden');
    $('.concert-details').addClass('hidden');
    $('.yelp').addClass('hidden');
}

/**************************************************************************************************
 * handleDetailsClick - handles page 3 detail clicks, adds arrayIndex to the item in the array of venueSearchResults
 * @param: {undefined} none
 * @returns: {undefined} none
 */
function handleDetailsClick() {
    var detailsIndex = $(this).attr('arrayindex');
    handlePage3Details(venueSearchResults[detailsIndex]);
}

/*************************************************************************************************
* handlePage3Details
* @params {string} singleEvent - index of page 2 dom element clicked to reference global array
* this function will pull details from global array and fill them onto page 3 template, artist name, venue, dates, image etc
* variables for lat and long are stored to be passed later
* this page will have 2 links for searchForBarsNearby and searchForRestuarantsNearby function with lat and long as params
*/
//passing in the index into this function
function handlePage3Details(singleEvent) {
    //changing the span text to match the details for the event being generated
    buyTicketsUrl = singleEvent.url;
    var artistPicture = singleEvent.images[3].url;
    $('.pageThreeArtistImg').attr('src', artistPicture);
    $('.pageThreeNameSpan').text(singleEvent.name);
    $('.pageThreeVenueAddressSpan').text(singleEvent._embedded.venues[0].address.line1 + ', ' + singleEvent._embedded.venues[0].city.name);
    $('.pageThreeVenueNameSpan').text(singleEvent._embedded.venues[0].name);
    $('.pageThreeDateSpan').text(convertDateFormat(singleEvent.dates.start.localDate));
    $('.pageThreeTimeSpan').text(convertMilitaryTime(singleEvent.dates.start.localTime));

    longitude = singleEvent._embedded.venues[0].location.longitude;
    latitude = singleEvent._embedded.venues[0].location.latitude;
    transitionPages('page2', 'page3');
}

/**********************************************************
 * callBars
 * @params none
 * calls initializeMap and passes in parameter we want to search for
 * calls goToMap
 */
function callBars() {
    initializeMap('bar');
    goToMap();
}

/**********************************************************
 * callRestaurant
 * @params none
 * calls initializeMap and passes in parameter we want to search for
 * calls goToMap
 */

function callRestaurant() {
    initializeMap('restaurant');
    goToMap();
}

/**********************************************************
 * callHotels
 * @params none
 * calls initializeMap and passes in parameter we want to search for
 * calls goToMap
 */
function callHotels() {
    initializeMap('lodging');
    goToMap();
}

/**********************************************************
 * buyTicketsLink
 * @params none
 * opens link to purchase tickets from ticketmaster
  */

function buyTicketsLink() {
    var win = window.open(buyTicketsUrl, '_blank');
    win.focus();
}

/***************************************************************************************************
* initializeMap
* @param {string} type
* takes in parameters from search for restaurants / bars / hotels to change type in var request to match what type of place person is searching for
*/

function initializeMap(type) {
    //defines location we are targeting on the map
    var location = new google.maps.LatLng(latitude, longitude);
    //creates instance of map
    map = new google.maps.Map(document.getElementById('map'), {
        center: location,
        zoom: 13
    });
    //request contains the radius around given location and the type of facility we are targeting
    var request = {
        location: location,
        radius: '5000',
        type: [`${type}`]
    };
    var marker = new google.maps.Marker({
        map: map,
        position: location,
        title: 'Venue',
    });

    marker.addListener('click', function () {
        infowindow.open(map, marker);
    });
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);
}

/***************************************************************************************************
 * callback - creates a student objects based on input fields in the form and adds the object to global student array
 * @param {string} results, {string} status
 * @return undefined
 * @calls createMarker
 */
function callback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            createMarker(results[i]);
        }
    }
}

/***************************************************************************************************
 * createMarker - creates a student objects based on input fields in the form and adds the object to global student array
 * @param {string} place
 * @return undefined
 * @calls goToYelp
 */
function createMarker(place) {
    var placeLoc = place.geometry.location;
    if (place.icon) {
        var image = new google.maps.MarkerImage(
            place.icon, new google.maps.Size(71, 71),
            new google.maps.Point(0, 0), new google.maps.Point(17, 34),
            new google.maps.Size(25, 25));
    } else var image = null;

    var marker = new google.maps.Marker({
        map: map,
        icon: image,
        position: placeLoc
    });

    var request = {
        reference: place.reference
    };

    var infowindow = new google.maps.InfoWindow({
        contentStr: ""
    });



    google.maps.event.addListener(marker, 'click', function () {

        service.getDetails(request, function (place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var contentStr = '<h3>' + place.name + '</h3><p>' + place.formatted_address;
                if (!!place.formatted_phone_number) contentStr += '<br>' + place.formatted_phone_number;
                if (!!place.website) contentStr += '<br><a target="_blank" href="' + place.website +
                    '">' + place.website + '</a>';
                contentStr += '<br>' + '</p>';
                contentStr += '<p><a class="yelp-transition">Get YELP details</a></p>';
                infowindow.setContent(contentStr);
                if (lastWindow) {
                    lastWindow.close();
                }
                infowindow.open(map, marker);
                lastWindow = infowindow;
            } else {
                var contentStr = "<h5>No Result, status=" + status + "</h5>";
                infowindow.setContent(contentStr);
                infowindow.open(map, marker);
            }
            var name = place.name;
            var addressStringArray = place.formatted_address.split(",");
            var address1 = addressStringArray[0];
            var city = addressStringArray[1];
            $('.yelp-transition').click(function () {
                goToYelp(name, address1, city);
            });
        });
    });
}

function goToYelp(name, address1, city) {
    $('#loader').removeClass('hidden');
    getYelpBusinessID(name, address1, city);
}

/*************************************************************
* getYelpBusinessID function
* @params {string} name, {string} address1, {string} city
* run Andy's yelp api (using his proxy server to access Yelp API) to GET business id via business match endpoint
* @calls (on success) the getYelpBusinessDetails function
*/

function getYelpBusinessID(name, address1, city) {
    var customURL = "https://yelp.ongandy.com/businesses/matches";
    var ajaxConfig = {
        url: customURL,
        method: "POST",
        dataType: "JSON",
        data: {
            api_key: "JXCOALn0Fdm8EKib4ucfwd_mPjsMzQJ-Zbg8614R3WGF0-805GUkh_jEfxTxkg5MTqzVJVselxNsRYUXXzcLYvd5AGqIc30kmwpDez7TNG-hKZWtRrtA_KDv4aJWW3Yx",
            name: name,
            address1: address1,
            city: city,
            state: "CA",
            country: "US"
        },
        success: function (response) {
            if (response.businesses[0]) {
                var businessID = response.businesses[0].id;
                getYelpBusinessDetails(businessID);
            } else {
                $('#loader').addClass('hidden');
                window.alert('Business listing not found, try again!')
            }
        },
        error: function () {
            console.log('error');
        }
    };
    $.ajax(ajaxConfig);
}

/*************************************************************
 * getYelpBusinessDetails function
 * @params {string} id - variable businessID from getYelpBusinessID response
 * run Andy's yelp api (using his proxy server to access the Yelp business details via their '/business/{id}' endpoint
 * @calls showHidePage function hide page 4 show page 5
 * button on page to run startOver function
 */

function getYelpBusinessDetails(id) {
    var detailsURL = "https://yelp.ongandy.com/businesses/details";
    var ajaxConfig = {
        url: detailsURL,
        method: "POST",
        dataType: "JSON",
        data: {
            api_key: "JXCOALn0Fdm8EKib4ucfwd_mPjsMzQJ-Zbg8614R3WGF0-805GUkh_jEfxTxkg5MTqzVJVselxNsRYUXXzcLYvd5AGqIc30kmwpDez7TNG-hKZWtRrtA_KDv4aJWW3Yx",
            id: id
        },
        success: renderYelpDetails,
        error: function () {
            console.log("error");
        }
    };
    $.ajax(ajaxConfig);
}

function renderYelpDetails(details) {
    $('#loader').addClass('hidden');
    $('.place-name').text(details.name);
    var starObject = {
        0: 'images/0.png',
        0.5: 'images/0_5.png',
        1: 'images/1.png',
        1.5: 'images/1_5.png',
        2: 'images/2.png',
        2.5: 'images/2_5.png',
        3: 'images/3.png',
        3.5: 'images/3_5.png',
        4: 'images/4.png',
        4.5: 'images/4_5.png',
        5: 'images/5.png',
    };

    function starRatingImageChanger(starObject, rating) {
        var temp = starObject[rating];
        $('#stars').attr('src', temp);
    }

    var starRating = details.rating;
    starRatingImageChanger(starObject, starRating);

    $('.price-rating').text(details.price);
    var image1 = details.photos[0];
    $('#yelpImage1').attr('src', image1);
    var image2 = details.photos[1];
    $('#yelpImage2').attr('src', image2);
    var image3 = details.photos[2];
    $('#yelpImage3').attr('src', image3);
    $('.business-phone').text('Phone: ' + details.display_phone);
    $('.business-hours').text(function () {
        if (details.hours[0].is_open_now) {
            return "Open now";
        }
        else {
            return "Closed now";
        }
    });
    $('.business-address').text('Address: ' + details.location.display_address);
    $('#yelpURL').attr('href', details.url);
    transitionPages('page4', 'page5');
}

/*************************************************************************************************
* startOver function
* @param: {undefined} none
* @returns: {undefined} none
* basically reset button, go back to page one and empty array
*/
function startOver() {
    $('.event-results, .concert-details, .google-maps, .yelp').addClass('hidden');
    $('.home').removeClass('hidden');
    venueSearchResults = [];
}

/*************************************************************************************************
 * window.onclick function - when error modal pops up
 * basically reset button, go back to page one and empty array
 */
window.onclick = function (event) {
    var modal = document.getElementById("errorModal");

    if (event.target == modal) {
        modal.style.display = "none";
    }
};

/*************************************************************************************************
 * showErrorModal - shows modal that displays error if no concerts in said city
 */
function showErrorModal() {
    $('.shadow1').css('display', 'inline-block');
}
