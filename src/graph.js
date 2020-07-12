import { getRelatedArtists } from './requests'
import { selectedArtistsInfo, addRelatedArtistsToGraphData, addArtistToSelected, maxNumRelated, artistInfoName, artistInfoImg, artistInfoAudio } from './index'

var graph;

const svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height');

function myGraph() {
    // Add and remove elements on the graph object
    this.addNode = node => {
        nodes.push({ 'name': node.name, 'popularity': node.popularity, 'uuid': node.uuid, 'image': node.image, 'audio': node.audio });
        update();
    };

    this.removeNode = function (name) {
        var i = 0;
        var n = findNode(name);
        while (i < links.length) {
            if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                links.splice(i, 1);
            }
            else i++;
        }
        nodes.splice(findNodeIndex(name), 1);
        update();
    };

    this.removeLink = function (source, target) {
        for (var i = 0; i < links.length; i++) {
            if (links[i].source.name == source && links[i].target.name == target) {
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

    var findNode = function (name) {
        for (var i in nodes) {
            if (nodes[i]["name"] === name) return nodes[i];
        }
        ;
    };

    var findNodeIndex = function (name) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].name == name) {
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
            .data(links, d => d.source.name + "-" + d.target.name);

        link.enter().append("line")
            .attr("name", d => d.source.name + "-" + d.target.name)
            .attr("stroke-width", 2)
            .attr("stroke", "#aaa")
            .attr("class", "link");

        link.append("title")
            .text(d => d.value);

        link.exit().remove();

        var node = vis.selectAll("g.node")
            .data(nodes, d => d.name);

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        nodeEnter.append("svg:circle")
            .attr("r", d => Math.sqrt(d.popularity))
            .attr("name", d => "Node;" + d.name)
            .attr("class", "nodeStrokeClass")
            .attr("fill", '#aaa')
            .on('dblclick', dblclick)
            .on('click', click);

        nodeEnter.append("svg:text")
            .attr("class", "textClass")
            .attr("x", 14)
            .attr("y", ".31em")
            .text(d => d.name);

        node.exit().remove();

        force.on("tick", (e) => {
            node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

            // nodes.forEach(function(d) {
            //     d.y += (height/2 - d.y) * e.alpha;
            //     d.x += (height/2 - d.x) * e.alpha;
            //   });
            // node
            // .attr("cx", function(d) { return d.x = Math.max(d.r, Math.min(width - d.r, d.x)); })
            // .attr("cy", function(d) { return d.y = Math.max(d.r, Math.min(height - d.r, d.y)); });

            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
        });

        // Restart the force layout.
        force
            .gravity(5.0)
            .charge(-3000)
            .linkDistance(d => d.value * 5)
            .size([width/2, height/2])
            .start();
    };

    function click(d) {
        artistInfoName.innerText = d.name;
        artistInfoImg.src = d.image;
        artistInfoAudio.src = d.audio;
    }

    function dblclick(d) {
        addArtistToSelected(d);
        getRelatedArtists(d.uuid).then(data => {
            data.artists.splice(0, maxNumRelated).forEach((relatedArtist, index) => {
                selectedArtistsInfo.nodes.push({
                    name: relatedArtist.name,
                    popularity: relatedArtist.popularity,
                    uuid: relatedArtist.id,
                    image: relatedArtist.images[0].url,
                    group: 1
                });
                selectedArtistsInfo.links.push({
                    source: d.name,
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

export { drawGraph, updateGraph, graph }