import { getRelatedArtists } from './requests'
import { selectedArtistsInfo, addRelatedArtistsToGraphData, addArtistToSelected } from './index'

var graph;

const svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height');

function myGraph() {
    // Add and remove elements on the graph object
    this.addNode = node => {
        nodes.push({ 'id': node.id, 'popularity': node.popularity, 'uuid': node.uuid });
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
    var vis = svg.attr("id", "svg")
        .attr("pointer-events", "all")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .append('svg:g');

    var force = d3.layout.force();

    var nodes = force.nodes(),
        links = force.links();

    var update = function () {
        var link = vis.selectAll("line")
            .data(links, d => d.source.id + "-" + d.target.id);

        link.enter().append("line")
            .attr("id", d => d.source.id + "-" + d.target.id)
            .attr("stroke-width", 2)
            .attr("stroke", "#aaa")
            .attr("class", "link");

        link.append("title")
            .text(d => d.value);

        link.exit().remove();

        var node = vis.selectAll("g.node")
            .data(nodes, d => d.id);

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        nodeEnter.append("svg:circle")
            .attr("r", d => Math.sqrt(d.popularity))
            .attr("id", d => "Node;" + d.id)
            .attr("class", "nodeStrokeClass")
            .attr("fill", '#aaa')
            .on('dblclick', dblclick);

        nodeEnter.append("svg:text")
            .attr("class", "textClass")
            .attr("x", 14)
            .attr("y", ".31em")
            .text(d => d.id);

        node.exit().remove();

        force.on("tick", () => {
            node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
            //node
            // .attr("cx", function(d) { return d.x = Math.max(d.r, Math.min(width - d.r, d.x)); })
            // .attr("cy", function(d) { return d.y = Math.max(d.r, Math.min(height - d.r, d.y)); });

            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        });

        // Restart the force layout.
        force
            .gravity(0.8)
            .charge(-3000)
            .linkDistance(d => d.value * 5)
            .size([width, height])
            .start();
    };


    function dblclick(d) {
        console.log(d)
        addArtistToSelected(d);
        getRelatedArtists(d.uuid).then(data => {
            data.artists.splice(0, 6).forEach((relatedArtist, index) => {
                selectedArtistsInfo.nodes.push({
                    id: relatedArtist.name,
                    popularity: relatedArtist.popularity,
                    uuid: relatedArtist.id,
                    group: 1
                });
                selectedArtistsInfo.links.push({
                    source: d.id,
                    target: relatedArtist.name,
                    value: index + 1
                });
            })

            updateGraph(selectedArtistsInfo);
        });
    }

    // Make it all go
    update();
}

function updateGraph(graphData) {
    graphData.nodes.forEach(node => graph.addNode(node));
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