function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    //document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    //document.getElementById("main").style.marginLeft= "0";
}

function loadData(){
    loadSideBarData();
    loadDemographics();
}

function loadSideBarData(){
    d3.csv("MetavisionItems.csv", function (error, data) {
        data.forEach(function(item){
        var ul = document.getElementById("itemList");
        var li = document.createElement("li");
        console.log(item);
        li.appendChild(document.createTextNode(item.LABEL));
        li.setAttribute("id", item.ITEMID);
        li.setAttribute("value", item.ITEMID);
        li.onclick = addToCurrentView;
        ul.appendChild(li); 
        });
    });
}

function addToCurrentView(){
    var currentUL = document.getElementById("currentList");
    this.onclick = addToItemList;
    currentUL.appendChild(this);
    loadChart(this.getAttribute("value"));
}

function addToItemList(){
    var currentUL = document.getElementById("itemList");
    this.onclick = addToCurrentView;
    currentUL.appendChild(this);
    removeChart(this.getAttribute("value"));
}

function loadDemographics(){
    d3.csv("s34_adm.csv", function (error, data) {
        document.getElementById("ethinicty").innerHTML += data[0].ethnicity;
        document.getElementById("adminType").innerHTML += data[0].admission_type;
        document.getElementById("adminSource").innerHTML += data[0].admission_location;
        document.getElementById("stayPeriod").innerHTML += data[0].admittime + " - " + data[0].dischtime;
        document.getElementById("insuranceType").innerHTML += data[0].insurance; 
        document.getElementById("diagnosis").innerHTML += data[0].diagnosis;
        return;
    });

    d3.csv("s34_info.csv", function (error, data) {
        document.getElementById("subjectID").innerHTML += data[0].subject_id;  
        document.getElementById("age").innerHTML += data[0].dob;  
        document.getElementById("gender").innerHTML += data[0].gender;  
    });


    document.getElementById("SAP").innerHTML += "test"; 
    return;
}

function loadChart(itemid){
    
    function compareDescending(item1, item2) {
            // Every item must have two fields: 'start' and 'end'.
            var result = item1.charttime - item2.charttime;
            // later first
            if (result < 0) { return 1; }
            if (result > 0) { return -1; }
            return 0;
        }
    
    
    var svg = d3.select(".data").append("li").attr("id", itemid + "li").append("svg").attr("width", 1900).attr("height", 200).attr("id", itemid + "svg"),
    margin = {top: 10, right: 150, bottom: 90, left: 40},
    margin2 = {top: 130, right: 150, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;
    
    svg.append("text").attr("x", 1760).attr("y", 60).attr("font-size", "16px").attr("fill", "white").attr("id", itemid + "Label").attr("font-family","sans-serif");
    svg.append("text").attr("x", 1775).attr("y", 100).attr("font-size", "36px").attr("fill", "green").attr("id", itemid + "Value").attr("font-family","sans-serif");
    
    var parseDate = d3.timeParse("%m/%d/%Y %H:%M");
    
    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]);

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);
    
    var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

    var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

    var line = d3.line()
    .x(function (d) { return x(d.charttime); })
    .y(function (d) { return y(d.value); });

    var line2 = d3.line()
    .x(function (d) { return x2(d.charttime); })
    .y(function (d) { return y2(d.value); });
    
    var clip = svg.append("defs").append("#" + itemid + "svg" + ":clipPath")
    .attr("id", "clip")
    .append("#respiratoryRateGraph:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0); 


    var Line_chart = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("clip-path", "url(#clip)");


    var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
    
    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        Line_chart.select(".line").attr("d", line);
        focus.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
                                 .scale(width / (s[1] - s[0]))
                                 .translate(-s[0], 0));
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        Line_chart.select(".line").attr("d", line);
        focus.select(".axis--x").call(xAxis);
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }

    function type(d) {
        d.charttime = parseDate(d.charttime);
        d.value = +d.value;
        return d;
    }
    
    d3.csv("s34_chartevents_144319.csv", type, function (error, dataStart) {
        if (error) throw error;


        var data = [];
        for(var i = 0; i < dataStart.length; i++){
            if(dataStart[i].itemid == itemid){
                data.push(dataStart[i]);
               }
        }
        
        data.sort(compareDescending);
        document.getElementById(itemid + "Label").innerHTML += data[0].label + ":";
        document.getElementById(itemid + "Value").innerHTML += data[data.length-1].value;
        //console.log(data);

        x.domain(d3.extent(data, function(d) { return d.charttime; }));
        y.domain([0, d3.max(data, function (d) { return d.value; })]);
        x2.domain(x.domain());
        y2.domain(y.domain());


        focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        focus.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis);

        Line_chart.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

        context.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line2);


        context.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

        svg.append("rect")
            .attr("class", "zoom")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom);

        return;
    });
}

function removeChart(itemid){
    var node = document.getElementById(itemid + "li");
    node.parentNode.removeChild(node);
}

function filterResults() {
    // Declare variables
    var input, filter, ul, li, a, i;
    input = document.getElementById('itemInput');
    filter = input.value.toUpperCase();
    ul = document.getElementById("itemList");
    li = ul.getElementsByTagName('li');

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        if (li[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}


openNav();