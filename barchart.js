var tastesWidth = document.getElementById("tastes").offsetWidth,
    tastesHeight = document.getElementById("tastes").offsetHeight * 0.73;

var sortBy = "size";

var m = [tastesHeight * 0.15, 160, 0, tastesWidth * 0.25], // top right bottom left
    w = tastesWidth * 0.65,
    h = 660 - m[0] - m[2], // height
    x = d3.scale.linear().range([0, w]),
    y = 25, // bar height
    z = d3.scale.ordinal().range(["#f8afaf", "#cb9192"]); // bar color

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top");

d3.select("#title").append("text")
    .text("");

d3.select("#legend")
    .style("visibility", "hidden")

d3.select("#radio-selection")
    .style("visibility", "hidden");

d3.selectAll(".radio-container input")
    .on("click",function(){
     sortBy = this.value;
     DrawBars(currentPage);
     UpdateLegend();
})

var svg = d3.select("#tastes").append("svg:svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + tastesWidth + " " + tastesHeight)
    .append("svg:g")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

svg.append("svg:rect")
    .attr("class", "background")
    .attr("width", "75%")


svg.append("svg:g")
    .attr("class", "x axis");

svg.append("svg:g")
    .attr("class", "y axis");

DrawLegend();


function DrawBars(page) {

    d3.select("#title").text("Selected Page: " + page.name);

    d3.select("#legend").style("visibility", "visible");
    d3.select("#radio-selection").style("visibility", "visible");

    d3.json("tastes.json", function (root) {
        root = page;
        sortBy == "size" ? x.domain([0, root.size]).nice() : x.domain([0, 1]).nice();
        down(root, 0);
    });

    function down(d, i) {
        if (!d.interests || this.__transition__) return;
        var duration = d3.event && d3.event.altKey ? 7500 : 750,
            delay = duration / d.interests.length;

        // Mark any currently-displayed bars as exiting.
        var exit = svg.selectAll(".enter").attr("class", "exit");


        // Enter the new bars for the clicked-on data.
        // Per above, entering bars are immediately visible.
        var enter = bar(d)
            .attr("transform", stack(i))
            .style("opacity", 1);

        // Have the text fade-in, even though the bars are visible.
        enter.select("text").style("fill-opacity", 1e-6);

        // Update the x-scale domain.
        sortBy == "size" ? x.domain([0, d3.max(d.interests, function (d) {return d.size;})]).nice() : x.domain([0, 1]).nice()

        // Update the x-axis.
        svg.selectAll(".x.axis").transition()
            .duration(duration)
            .call(xAxis);

        // Transition entering bars to their new position.
        var enterTransition = enter.transition()
            .duration(duration)
            .delay(function (d, i) {
                return i * delay;
            })
            .attr("transform", function (d, i) {
                return "translate(0," + y * i * 1.2 + ")";
            });

        // Transition entering text.
        enterTransition.select("text").style("fill-opacity", 1);

        // Transition entering rects to the new x-scale.
        enterTransition.select(".total")
            .attr("width", function (d) {
                return sortBy == "size" ? x(d.size) : x(d.score);
            })

        enterTransition.select(".group")
            .attr("width", function (d) {
                return sortBy == "size" ? x(d.groupSize) : x(d.groupScore);
            })


        // Transition exiting bars to fade out.
        var exitTransition = exit.transition()
            .duration(duration)
            .style("opacity", 1e-6)
            .remove();

        // Transition exiting bars to the new x-scale.
        exitTransition.selectAll(".total").attr("width", function (d) {
            return sortBy == "size" ? x(d.size) : x(d.score);
        });

        exitTransition.selectAll(".group").attr("width", function (d) {
            return sortBy == "size" ? x(d.groupSize) : x(d.groupScore);
        });

        // Rebind the current node to the background.
        svg.select(".background").data([d]).transition().duration(duration * 2);
        d.index = i;
    }

    // Creates a set of bars for the given data node, at the specified index.
    function bar(d) {

        var bar = svg.insert("svg:g", ".y.axis")
            .attr("class", "enter")
            .attr("transform", "translate(0,5)")
            .selectAll("g")
            .data(d.interests)
            .enter().append("svg:g")

        bar.append("svg:text")
            .attr("x", -6)
            .attr("y", y / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .text(function (d) {
                return d.name;
            });

        bar.append("svg:rect")
            .attr("class", "total")
            .attr("width", function (d) {
                return sortBy == "size" ? x(d.size) : x(d.score);
            })
            .attr("height", function (d) {
                return sortBy == "size" ? y : y / 2;
            })
            .style("fill", "#f8afaf");

        bar.append("svg:rect")
            .attr("class", "group")
            .attr("width", function (d) {
                return sortBy == "size" ? x(d.groupSize) : x(d.groupScore);
            })
            .attr("height", function (d) {
                return sortBy == "size" ? y : y / 2;
            })
            .style("fill", "#cb9192")
            .attr("transform", function (d) {
                return sortBy == "size" ? "translate(0, 0)" : "translate(0," + y / 2 + ")";
            });

        bar.sort(function (a, b) {
            return sortBy == "size" ? (b.groupSize - a.groupSize) : (b.groupScore - a.groupScore);
        });

        return bar;
    }

    // A stateful closure for stacking bars horizontally.
    function stack(i) {
        var x0 = 0;
        return function (d) {
            var tx = "translate(" + x0 + "," + y * i * 1.2 + ")";
            x0 += x(d.size);
            return tx;
        };
    }

}

function DrawLegend() {

    var legendWidth = tastesWidth,
        legendHeight = tastesHeight * 0.2;

    var legend = d3.select("#legend")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + legendWidth + " " + legendHeight)


    var g1 = legend.append("svg:g")
        .attr("transform", "translate(" + (legendWidth - 120) + "," + (legendHeight * 0.5 - y / 1.5) + ")");

    g1.append("rect")
        .attr("width", 100)
        .attr("height", y)
        .style("fill", "#f8afaf")


    var g2 = legend.append("svg:g")
        .attr("transform", "translate(" + (legendWidth - 120) + "," + (legendHeight * 0.5 + y / 1.5) + ")");

    g2.append("rect")
        .attr("width", 100)
        .attr("height", y)
        .style("fill", "#cb9192")

    g1.append("text")
      .attr("id","legend-text-1")
        .text(function () {
            return sortBy == "size" ? "Total Visitors of the Page" : "Score of the Page from All Visitors"
        })
        .attr("x", -6)
        .attr("y", y / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")

    g2.append("text")
      .attr("id","legend-text-2")
        .text(function () {
            return sortBy == "size" ? "Visitors from the Selected Group" : "Score of the Page from the Selected Group"
        })
        .attr("x", -6)
        .attr("y", y / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
}


function UpdateLegend(){
    
    d3.select("#legend-text-1")
    .text(function () {
            return sortBy == "size" ? "Total Visitors of the Page" : "Score of the Page from All Visitors"
        })
    
    d3.select("#legend-text-2")
    .text(function () {
            return sortBy == "size" ? "Visitors from the Selected Group" : "Score of the Page from the Selected Group"
        })
}