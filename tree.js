var treeWidth = document.getElementById("hierarchy").offsetWidth,
    treeHeight = document.getElementById("hierarchy").offsetHeight;

var treeM = [20, 20, 20, 20],
    rectWidth = 150,
    xScale = d3.scale.linear().range([0, rectWidth]),
    rectHeight = 30,
    currentSelectionId = "Home",
    currentPage,
    categories=[],
    root;

var tree = d3.layout.tree()
    //.size([treeWidth, treeHeight]);


var lineFunction = d3.svg.line()
    .x(function (d) {
        return d.y;
    })
    .y(function (d) {
        return d.x;
    })
    .interpolate('linear');

var vis = d3.select("#hierarchy").append("svg:svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + treeWidth + " " + treeHeight*3)
    .append("svg:g")
    .attr("transform", "translate(" + 20 + "," + 20 + ")");


var categoriesUrl = "http://34.228.166.70/api/categories/count";

d3.json(categoriesUrl, function (json) {


    categories = json.children;
    
    for (var i = 0; i<categories.length; i++){
        categories[i].id = i;
        
    }

    
    var dataMap = categories.reduce(function (map, node) {
        map[node.name] = node;
        return map;
    }, {});
    
    var categoriesSizes = [];
    categories.forEach(function(element){categoriesSizes.push(Number(element.size))})
    xScale.domain([0, Math.max(... categoriesSizes)]);

    // create the tree array
    var treeData = [{
        name: "Home",
        id: "Home",
        children: [],
        size: Math.max(... categoriesSizes),
        x0: 0,
        y0: 0
    }];
    
    
    json.children.forEach(function (node) {
        // add to parent
        var parent = dataMap[node.parent];
        if (parent) {
            // create child array if it doesn't exist
            (parent.children || (parent.children = []))
            // add node to child array
            .push(node);
        } else {
            // parent is null or missing
            treeData[0].children.push(node);
        }
    });


    root = treeData[0];

    function toggleAll(d) {
        if (d.children) {
            d.children.forEach(toggleAll);
            toggle(d);
        }
    }

    //Initialize the display to show a few nodes.
    root.children.forEach(toggleAll);
    toggle(root);
    update(root);
});

function update(sourcePage) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root),
        duration = 500,
        layersWidth = rectWidth * 1.5,
        layersHeight = rectHeight * 1.5,
        i = 0;

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {

        if (d.depth > sourcePage.depth) {
            d.x = i * layersHeight;
            i++;
        } else {
            d.x = d.x0;
        }

        d.y = d.depth * layersWidth;
    });


    // Update the nodes…
    var node = vis.selectAll("g.node")
        .data(nodes, function (d) {
             return d.id; 
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function (d) {
            if (d.depth > sourcePage.depth) {
                return "translate(" + sourcePage.y + "," + sourcePage.x + ")";
            }
        })
        .on("click", function (d) {
            toggle(d);
            update(d);
            pageSelect(d)
        });

    nodeEnter.append("svg:rect")
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("id", function(d){return d.id})
        .style("cursor", function (d) {
            return d._children ? "pointer" : "default";
        })
        .style("fill", "lightsteelblue");

    nodeEnter.append("svg:rect")
        .attr("width", function (d) {
            return xScale(d.size)
        })
        .attr("height", rectHeight)
        .style("cursor", function (d) {
            return d._children ? "pointer" : "default";
        })
        .style("fill", "steelblue");

    nodeEnter.append("rect:text")
        .attr("x", rectWidth * 0.05)
        .attr("y", rectHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "left")
        .style("cursor", function (d) {
            return d._children ? "pointer" : "default";
        })
        .text(function (d) {
      
            return d.name.replace(/_/g," ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
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
            return "translate(" + sourcePage.y + "," + sourcePage.x + ")";
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
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
                    },
                {
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
                    },
                {
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
                    },
                {
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
                    }
            ]
            return lineFunction(lineData)
        })

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", function (d) {
            var lineData = [
                {
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
                    },
                {
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth + layersWidth / 4
                    },
                {
                    "x": d.target.x + rectHeight / 2,
                    "y": d.source.y + rectWidth + layersWidth / 4
                    },
                {
                    "x": d.target.x + rectHeight / 2,
                    "y": d.target.y
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
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
                    },
                {
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
                    },
                {
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
                    },
                {
                    "x": d.source.x + rectHeight / 2,
                    "y": d.source.y + rectWidth
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

    d3.selectAll("rect").style("stroke","")
    document.getElementById(d.id).style.strokeWidth = 4;
    document.getElementById(d.id).style.stroke = "steelblue";

    if (d.id != currentSelectionId) {
        DrawBars(d);
        currentSelectionId = d.id;
        currentPage = d;
    }

}
