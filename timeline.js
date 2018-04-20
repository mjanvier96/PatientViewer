function timeline(domElement) {

    //--------------------------------------------------------------------------
    //
    // chart
    //

    // chart geometry
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
        outerWidth = 1900,
        outerHeight = 800,
        width = outerWidth - margin.left - margin.right,
        height = outerHeight - margin.top - margin.bottom;

    // global timeline variables
    var timeline = {},   // The timeline
        data = {},       // Container for the data
        data2 = {},
        components = [], // All the components of the timeline for redrawing
        bandGap = 25,    // Arbitray gap between to consecutive bands
        bands = {},      // Registry for all the bands in the timeline
        bandY = 0,       // Y-Position of the next band
        bandNum = 0;     // Count of bands for ids
    
    var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");
    var parseDate2 = d3.timeParse("%m/%d/%Y %H:%M");

    // Create svg element
    var svg = d3.select(domElement).append("svg")
        .attr("class", "svg")
        .attr("id", "svg")
        .attr("width", outerWidth)
        .attr("height", outerHeight)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top +  ")");

    svg.append("clipPath")
        .attr("id", "chart-area")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var chart = svg.append("g")
            .attr("class", "chart")
            .attr("clip-path", "url(#chart-area)" );

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("visibility", "visible");

    //--------------------------------------------------------------------------
    //
    // data
    //

    timeline.data = function(items, items2, items3) {

        var tracks = [];

        data.items = items;
        data2.items = items2;

        function compareDescending(item1, item2) {
            // Every item must have two fields: 'start' and 'end'.
            var result = item1.starttime - item2.starttime;
            // later first
            if (result < 0) { return 1; }
            if (result > 0) { return -1; }
            // shorter first
            result = item2.endtime - item1.endtime;
            if (result < 0) { return 1; }
            if (result > 0) { return -1; }
            return 0;
        }

        function calculateTracks(items) {
            var i, track;

            function sortBackward() {
                // older items end deeper
                items.forEach(function (item) {
                    for (i = 0, track = 0; i < tracks.length; i++, track++) {
                        if (item.endtime < tracks[i]) { break; }
                    }
                    item.track = track;
                    tracks[track] = item.starttime;
                });
            }

            data.items.sort(compareDescending);
            sortBackward();
        }

        // Convert yearStrings into dates
        data.items.forEach(function (item){
            item.starttime = parseDate(item.starttime);
            item.endtime = parseDate(item.endtime);
            //console.log(item.starttime);
            //console.log(item.endtime);
            item.instant = false;
            item.whichData = 1;
        });
        
        data2.items.forEach(function (item){
            item.starttime = parseDate2(item.charttime);
            item.endtime = item.starttime
            item.instant = true;
            item.whichData = 2;
        });
        

        
        console.log(data.items);
        console.log(data2.items);
        //console.log(data.items);
        
        data.items = data.items.concat(data2.items);
        console.log(data.items);
        calculateTracks(data.items);
        data.nTracks = tracks.length;
        data.minDate = d3.min(data.items, function (d) { return d.starttime; });
        data.maxDate = d3.max(data.items, function (d) { return d3.timeHour.offset(d.endtime, 12); });//12 hour buffer
        console.log(data.minDate);
        console.log(data.maxDate);
        return timeline;
    };

    //----------------------------------------------------------------------
    //
    // band
    //

    timeline.band = function (bandName, sizeFactor) {

        var band = {};
        band.id = "band" + bandNum;
        band.x = 0;
        band.y = bandY;
        band.w = width;
        band.h = height * (sizeFactor || 1);
        band.trackOffset = 4;
        // Prevent tracks from getting too high
        band.trackHeight = Math.min((band.h - band.trackOffset) / data.nTracks, 20);
        band.itemHeight = band.trackHeight * 0.8,
        band.parts = [],
        band.instantWidth = 100; // arbitray value

        
        band.xScale = d3.scaleTime()
            .domain([data.minDate, data.maxDate])
            .range([0, band.w]);
        
        band.yScale = function (track) {
            return band.trackOffset + track * band.trackHeight;
        };

        band.g = chart.append("g")
            .attr("id", band.id)
            .attr("transform", "translate(0," + band.y +  ")");

        band.g.append("rect")
            .attr("class", "band")
            .attr("width", band.w)
            .attr("height", band.h);

        // Items
        var items = band.g.selectAll("g")
            .data(data.items)
            .enter().append("svg")
            .attr("y", function (d) { return band.yScale(d.track); })
            .attr("height", band.itemHeight)
            .attr("class", function (d) { return d.instant ? "part instant" : "part interval";});

        var intervals = d3.select("#band" + bandNum).selectAll(".interval");
        intervals.append("rect")
            .attr("width", "100%")
            .attr("height", "100%");
        intervals.append("text")
            .attr("class", "intervalLabel")
            .attr("x", 1)
            .attr("y", 10)
            .text(function (d) { return d.label; });

        var instants = d3.select("#band" + bandNum).selectAll(".instant");
        instants.append("circle")
            .attr("cx", band.itemHeight / 2)
            .attr("cy", band.itemHeight / 2)
            .attr("r", 5);
        instants.append("text")
            .attr("class", "instantLabel")
            .attr("x", 15)
            .attr("y", 10)
            .text(function (d) { return d.label; });
        console.log(instants);

        band.addActions = function(actions) {
            // actions - array: [[trigger, function], ...]
            actions.forEach(function (action) {
                items.on(action[0], action[1]);
            })
        };

        band.redraw = function () {
            items
                .attr("x", function (d) { return band.xScale(d.starttime);})
                .attr("width", function (d) {
                
                
                    if(d.instant){
                        //return band.xScale(d.endtime);
                    } else {
                        return band.xScale(d.endtime) - band.xScale(d.starttime); 
                    }
                
                
                    });
            band.parts.forEach(function(part) { part.redraw(); })
        };

        bands[bandName] = band;
        components.push(band);
        // Adjust values for next band
        bandY += band.h + bandGap;
        bandNum += 1;

        return timeline;
    };

    //----------------------------------------------------------------------
    //
    // tooltips
    //

    timeline.tooltips = function (bandName) {
        var band = bands[bandName];

        band.addActions([
            // trigger, function
            ["mouseover", showTooltip],
            ["mouseout", hideTooltip]
        ]);

        function getHtml(element, d) {
            var html;
            if (element.attr("class") == "interval") {
                html = d.label + "<br>" + d.starttime + " - " + d.endtime;
            } else {
                html = d.label + "<br>" + d.starttime;
            }
            return html;
        }

        function showTooltip (d) {

            var x = event.pageX < band.x + band.w / 2
                    ? event.pageX + 10
                    : event.pageX - 110,
                y = event.pageY < band.y + band.h / 2
                    ? event.pageY + 30
                    : event.pageY - 30;

            tooltip
                .html(getHtml(d3.select(this), d))
                .style("top", y + "px")
                .style("left", x + "px")
                .style("visibility", "visible");
        }

        function hideTooltip () {
            tooltip.style("visibility", "hidden");
        }

        return timeline;
    };

    //----------------------------------------------------------------------
    //
    // xAxis
    //

    timeline.xAxis = function (bandName) {

        var band = bands[bandName];
        var axis = d3.axisBottom(band.xScale);
            //.tickSize(6, 0)
            //.tickFormat(function (d) { d; });

        var xAxis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (band.y + band.h)  + ")");

        xAxis.redraw = function () {
            xAxis.call(axis);
        };

        band.parts.push(xAxis); // for brush.redraw
        components.push(xAxis); // for timeline.redraw

        return timeline;
    };

    //----------------------------------------------------------------------
    //
    // brush
    //
    
    // band.xScale
    timeline.brush = function (bandName, targetNames) {

        var band = bands[bandName];
        
         var brush = d3.brushX()
         .extent([[band.xScale.range()[0], 0], [band.xScale.range()[1], band.w]])
        .on("brush end", function() {
                var s = d3.event.selection || band.xScale.range();
                var domain = s.map(band.xScale.invert, band.xScale);
                targetNames.forEach(function(d) {
                    bands[d].xScale.domain(domain);
                    bands[d].redraw();
                });
            });
        
        var xBrush = band.g.append("svg")
            .attr("class", "x brush")
            .call(brush);

        xBrush.selectAll("rect")
            .attr("y", 4)
            .attr("height", band.h - 4);

        return timeline;
    };

    //----------------------------------------------------------------------
    //
    // redraw
    //

    timeline.redraw = function () {
        components.forEach(function (component) {
            component.redraw();
        })
    };

    return timeline;
}