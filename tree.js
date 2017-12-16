var treeWidth = document.getElementById("hierarchy").offsetWidth,
    treeHeight = document.getElementById("hierarchy").offsetHeight; 

var treeM = [20, 20, 20, 20],
    i = 0,
    rectWidth = 100,
    rectHeight = 30,
    currentSelectionId = "Home",
    currentPage,
    root;

var tree = d3.layout.tree()
    .size([treeWidth, treeHeight]);


var lineFunction = d3.svg.line()
    .x(function (d) {
        return d.x;
    })
    .y(function (d) {
        return d.y;
    })
    .interpolate('linear');

var vis = d3.select("#hierarchy").append("svg:svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 "+treeWidth+" "+treeHeight)
    .append("svg:g")
    .attr("transform", "translate(" + 0 + "," + 20 + ")");


d3.json("tastes.json", function (json) {

    root = json;
    root.x0 = treeWidth;
    root.y0 = 0;

    function toggleAll(d) {
        if (d.children) {
            d.children.forEach(toggleAll);
            toggle(d);
        }
    }

    // Initialize the display to show a few nodes.
    root.children.forEach(toggleAll);
    toggle(root);
    update(root);
});

function update(sourcePage) {

    var duration = d3.event && d3.event.altKey ? 5000 : 500;

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse();
    var layersHeight = 100;

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
        d.y = d.depth * layersHeight;
    });

    // Update the nodes…
    var node = vis.selectAll("g.node")
        .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + sourcePage.x0 + "," + sourcePage.y0 + ")";
        })
        .on("click", function (d) {
            toggle(d);
            update(d);
            pageSelect(d)
        });

    nodeEnter.append("svg:rect")
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .style("cursor", function (d) {
            return d._children ? "pointer" : "default";
        })
        .style("fill", "lightsteelblue");

    nodeEnter.append("rect:text")
        .attr("x", rectWidth / 2)
        .attr("y", rectHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("cursor", function (d) {
            return d._children ? "pointer" : "default";
        })
        .text(function (d) {
            return d.name;
        })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + (d.x - rectWidth / 2) + "," + d.y + ")";
        });

    nodeUpdate.select("rect")
        .style("cursor", function (d) {
            return d._children || d.children ? "pointer" : "default";
        })

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + sourcePage.x + "," + sourcePage.y + ")";
        })
        .remove();

    nodeExit.select("rect")
        .attr("width", 1e-6)
        .attr("height", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = vis.selectAll("path.link")
        .data(tree.links(nodes), function (d) {
            return d.target.id;
        });


    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
            var lineData = [
                {
                    "x": d.source.x0,
                    "y": d.source.y0
                    },
                {
                    "x": d.source.x0,
                    "y": d.source.y0
                    },
                {
                    "x": d.source.x0,
                    "y": d.source.y0
                    }
            ]
            return lineFunction(lineData)
        })
        .transition()
        .duration(duration)
        .attr("d", function (d) {
            var lineData = [
                {
                    "x": d.source.x,
                    "y": d.source.y
                    },
                {
                    "x": d.source.x,
                    "y": d.source.y0 + (d.target.y - d.source.y) / 1.5
                    },
                {
                    "x": d.target.x,
                    "y": d.source.y0 + (d.target.y - d.source.y) / 1.5
                    }
            ]
            return lineFunction(lineData)
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", function (d) {
            var lineData = [
                {
                    "x": d.source.x,
                    "y": d.source.y
                    },
                {
                    "x": d.source.x,
                    "y": d.source.y0 + (d.target.y - d.source.y) / 1.5
                    },
                {
                    "x": d.target.x,
                    "y": d.source.y0 + (d.target.y - d.source.y) / 1.5
                    }
            ]
            return lineFunction(lineData)
        });

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            var lineData = [
                {
                    "x": d.source.x,
                    "y": d.source.y
                    },
                {
                    "x": d.source.x,
                    "y": d.source.y0 + (d.target.y - d.source.y) / 1.5
                    },
                {
                    "x": d.target.x,
                    "y": d.source.y0 + (d.target.y - d.source.y) / 1.5
                    }
            ]
            return lineFunction(lineData)
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Toggle children.
function toggle(d) {
    //hide
    if (d.children) {
        d._children = d.children;
        d.children = null;
        //show
    } else {
        d.children = d._children;
        d._children = null;
        //hide other nodes in the same level
        if (d.parent) {
            d.parent.children.forEach(function (element) {
                if (d !== element && element.children) {
                    element._children = element.children;
                    element.children = null;
                }
            });
        }
    }


}

function pageSelect(d) {
 
    if (d.id != currentSelectionId){
    DrawBars(d);
    currentSelectionId = d.id;
    currentPage = d;
  }
  if (!d.interests){
    d3.selectAll('.tick').remove();
    d3.select('.domain').remove();
    d3.select('.enter').remove();
    d3.select('#title').text("");
    d3.select("#legend").style("visibility","hidden");
    d3.select("#radio-selection").style("visibility","hidden");
  }

}
