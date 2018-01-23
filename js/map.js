// BASEMAP

var map = L.map('mainmap', {
    scrollWheelZoom: false,
    attributionControl: false
}).setView([40.716303, -73.940535], 11);

var tonerUrl = "https://stamen-tiles.a.ssl.fastly.net/toner-lite/{Z}/{X}/{Y}.png";

var url = tonerUrl.replace(/({[A-Z]})/g, function(s) {
    return s.toLowerCase();
});

var basemap = L.tileLayer(url, {
    subdomains: ['','a.','b.','c.','d.'],
    minZoom: 0,
    maxZoom: 20,
    opacity: 0.5,
    type: 'png'
}); 

basemap.addTo(map);

// SYMBOLOGY FUNCTIONS 

function getColor(d) {
        return  d == 0 ? '#d73027':
                d < 0.50 ? '#fc8d59': 
                d < 1 ? '#fee08b':
                '#66bd63';
    }

function getBorder(d) {
        return d == 0 ? '#AC1A12':
            d < 0.50 ? '#E56D33':
            d < 1 ? '#D8B757':
            '#3F9C3A';
    }

function getRadius(d) {
        return d < 5 ? 3:
        d < 10 ? 4: 
        d < 20?   5:
        d < 50?   6:
        d < 100?   7:
        d < 200?   8:
        d < 400 ?   9:
        10;
    }

// INTERACTION

function highlightFeature(e) {

    var layer = e.target;

    layer.setStyle({
        fillOpacity: 1,
        opacity: 1
    });

    $(e.target.getElement()).attr('id', 'active');

    $('.leaflet-interactive').not('#active').css("fillOpacity","0.2").css("strokeOpacity","0.25");

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

}

function resetHighlight(e) {

    var layer = e.target;

    layer.setStyle({
        fillOpacity: 0.5,
        opacity: 0.5
    });

    $(e.target.getElement()).removeAttr("id");

    $('.leaflet-interactive').css("fill","").css("fillOpacity","").css("strokeOpacity","").css("strokeWidth","");
    
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });
} 


function pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, 
        {
            radius: getRadius(feature.properties.All_Counted_Units),
            color: getBorder(feature.properties.Pct_Total_Units_Affordable),
            fillColor: getColor(feature.properties.Pct_Total_Units_Affordable),
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.5
        }
    );
}

// MAP DATA

// Field Names: 
// 
// Project_ID   Project_Name    Project_Start_Date  Project_Completion_Date Building_ID Number  Street  Borough Postcode    
// BBL BIN Community_Board Council_District    Census_Tract    NTA_Neighborhood_Tabulation_Area    Latitude    Longitude   
// Latitude_Internal   Longitude_Internal  Building_Completion_Date    Reporting_Construction_Type Extended_Affordability_Only 
// Prevailing_Wage_Status  Extremely_Low_Income_Units  Very_Low_Income Low_Income_Units    Moderate_Income Middle_Income   Other   
// Counted_Rental_Units    Counted_Homeownership_Units All_Counted_Units   Total_Units LatLong_Copied_from_Centroid    
// PUMA_Number PUMA_Full_Name  Neighborhood    MHI_2015    AMI_2015    Income_Range_of_2015_Median_Earner  Highest_Income_Band_Affordable  
// Units_Affordable_to_Median_Income_Earner    Units_Unaffordable_to_Median_Income_Earner  Units_Other Pct_Total_Units_Affordable  
// Pct_Total_Units_Unaffordable    Pct_Total_Units_Other                            

geojson = L.geoJson(HNYdata, {
    pointToLayer: pointToLayer,
    onEachFeature: onEachFeature
}).addTo(map);

// POP UPS 

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}

function unitUnits(x) {
    if (x == 1) 
        {return 'unit'}
    else 
        {return 'units'}
}

geojson.bindPopup(function (layer) {
    return L.Util.template('<h2>' + layer.feature.properties.Number + ' ' + toTitleCase(layer.feature.properties.Street) + ', ' + layer.feature.properties.Borough + '</h2>' +
            'This building in ' + layer.feature.properties.Neighborhood + ' has <b>' + layer.feature.properties.All_Counted_Units + ' ' + unitUnits(layer.feature.properties.All_Counted_Units) + '</b> (out of ' + layer.feature.properties.Total_Units +') counting towards the Housing New York plan. ' +
            '<table>' + 
              '<tr><th>Income Range</th><th># of Units</th></tr>' +
              '<tr><td>$0—$23,350</td><td>' + layer.feature.properties.Extremely_Low_Income_Units + '</td></tr>' + 
              '<tr><td>$23,351—$38,850</td><td>' + layer.feature.properties.Very_Low_Income + '</td></tr>' +
              '<tr><td>$38,851—$62,150</td><td>' + layer.feature.properties.Low_Income_Units + '</td></tr>' +
              '<tr><td>$62,150—$93,240</td><td>' + layer.feature.properties.Moderate_Income + '</td></tr>' +
              '<tr><td>$93,241—$128,205</td><td>' + layer.feature.properties.Middle_Income + '</td></tr>' +
              '<tr class="no-border"><td><q>other</q> units</td><td>' + layer.feature.properties.Other + '</td></tr>' +
              '</table>' +
              'A typical (median-income) household in this neighborhood makes about <b>$' + numberWithCommas(layer.feature.properties.MHI_2015) + ' a year</b>, so locals can afford <b>' + Math.floor(layer.feature.properties.Pct_Total_Units_Affordable*1000)/10 + '%</b> of the units in this building.');
        });

map.on('popupopen', function(e) {
    var location = map.project(e.popup._latlng); 
    location.y -= e.popup._container.clientHeight/2;
    map.panTo(map.unproject(location),{animate: true});
    $("#legend").css("display","none");
    $(".leaflet-control-container").css("display","none");
});

map.on('popupclose', function(e) {
    $("#legend").css("display","block");
    $(".leaflet-control-container").css("display","block");
});

// LAYER CONTROL

/* 

var baselayers = {};

var overlays = {
    "Sold $1 Lots": ODL_sold,
    "Pending $1 Lots": ODL_pending
};

L.control.layers(baselayers, overlays, {position: 'topright', collapsed: false}).addTo(map);

*/ 

L.Control.geocoder().addTo(map);

$('.leaflet-control-layers-overlays span').click(function() {
    $(this).toggleClass('layer-selected')
 });

$('.leaflet-control-layers-base').html("Layers:");
