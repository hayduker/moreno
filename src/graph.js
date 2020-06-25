var graph;

const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// const simulation = d3.forceSimulation()
//     .force("link", d3.forceLink().id(function (d) { return d.id; }))
//     .force("charge", d3.forceManyBody())
//     .force("center", d3.forceCenter(width / 2, height / 2));

const color = d3.scaleOrdinal(d3.schemeCategory10);


function myGraph() {
    // Add and remove elements on the graph object
    this.addNode = function (id) {
        nodes.push({ "id": id });
        update();
    };

    this.removeNode = function (id) {
        var i = 0;
        var n = findNode(id);
        while (i < links.length) {
            if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                links.splice(i, 1);
            }
            else i++;
        }
        nodes.splice(findNodeIndex(id), 1);
        update();
    };

    this.removeLink = function (source, target) {
        for (var i = 0; i < links.length; i++) {
            if (links[i].source.id == source && links[i].target.id == target) {
                links.splice(i, 1);
                break;
            }
        }
        update();
    };

    this.removeallLinks = function () {
        links.splice(0, links.length);
        update();
    };

    this.removeAllNodes = function () {
        nodes.splice(0, links.length);
        update();
    };

    this.addLink = function (source, target, value) {
        links.push({ "source": findNode(source), "target": findNode(target), "value": value });
        update();
    };

    var findNode = function (id) {
        for (var i in nodes) {
            if (nodes[i]["id"] === id) return nodes[i];
        }
        ;
    };

    var findNodeIndex = function (id) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].id == id) {
                return i;
            }
        }
        ;
    };

    // set up the D3 visualisation in the specified element
    var vis = svg
        // d3.select("body")
        //     .append("svg:svg")
        //     .attr("width", w)
        //     .attr("height", h)
        .attr("id", "svg")
        .attr("pointer-events", "all")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .append('svg:g');

    var force = d3.layout.force();

    var nodes = force.nodes(),
        links = force.links();

    var update = function () {
        var link = vis.selectAll("line")
            .data(links, function (d) {
                return d.source.id + "-" + d.target.id;
            });

        link.enter().append("line")
            .attr("id", function (d) {
                return d.source.id + "-" + d.target.id;
            })
            .attr("stroke-width", 4)
            .attr("stroke", "#aaa")
            .attr("class", "link");
        link.append("title")
            .text(function (d) {
                return d.value;
            });
        link.exit().remove();

        var node = vis.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id;
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        nodeEnter.append("svg:circle")
            .attr("r", 12)
            .attr("id", function (d) {
                return "Node;" + d.id;
            })
            .attr("class", "nodeStrokeClass")
            .attr("fill", function (d) { return color(d.id); });

        nodeEnter.append("svg:text")
            .attr("class", "textClass")
            .attr("x", 14)
            .attr("y", ".31em")
            .text(function (d) {
                return d.id;
            });

        node.exit().remove();

        force.on("tick", function () {

            node.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            link.attr("x1", function (d) {
                return d.source.x;
            })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });
        });

        // Restart the force layout.
        force
            .gravity(.01)
            .charge(-80000)
            .friction(0)
            .linkDistance(function (d) { return d.value * 10 })
            .size([width, height])
            .start();
    };


    // Make it all go
    update();
}

function updateGraph(graphData) {
    graphData.nodes.forEach(node => graph.addNode(node.id));
    graphData.links.forEach(link => graph.addLink(link.source, link.target, '20'));
    keepNodesOnTop();
}

function drawGraph() {
    graph = new myGraph("#svgdiv");
}

// because of the way the network is created, nodes are created first, and links second,
// so the lines were on top of the nodes, this just reorders the DOM to put the svg:g on top
function keepNodesOnTop() {
    document.querySelectorAll(".nodeStrokeClass").forEach(elem => {
        var gnode = elem.parentNode;
        gnode.parentNode.appendChild(gnode);
    });
}

export { drawGraph, updateGraph }