import { getRelatedArtists } from './requests'
import { selectedArtistsInfo, addRelatedArtistsToGraphData, addArtistToSelected, maxNumRelated, artistInfoName, selectedArtists } from './index'

const playerContainer = document.querySelector('.player-container');

const svg = d3.select('svg');
const width = +svg.attr('width');
const height = +svg.attr('height');
const color = d3.scaleOrdinal(d3.schemeCategory10);
const graph = { nodes: [], links: [] };

const linksContainer = svg.append('g').attr('class', 'links');
const nodesContainer = svg.append('g').attr('class', 'nodes');

let defaultNodeFill = "#1f77b4";
let defaultNodeStroke = '#eee';
let highlightNodeStoke = '#8c564b';
let defaultFontWeight = 'regular';
let highlightFontWeight = 'bold';
let highlightLinkColor = '#444';
let defaultLinkColor = '#888';
let defaultLinkWidth = 1.0;
let highlightLinkWidth = 2.0;
let defaultTransparency = 1.0;
let highlightTransparency = 0.3;
const popularityScalar = 0.1;

let min_zoom = 0.4;
let max_zoom = 2;
let zoom = d3.zoom().scaleExtent([min_zoom,max_zoom])

let linkedByIndex = {};
function findConnections() {
    graph.links.forEach(d => {
        linkedByIndex[d.source.index + "," + d.target.index] = true
    });
}

function isConnected(a, b) {
    return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
}

const simulation = d3.forceSimulation()
                     .force('link', d3.forceLink().id(function(d) { return d.name; }).distance(30))
                     .force('charge', d3.forceManyBody().strength(-400))
                     .force('center', d3.forceCenter(width / 2, height / 2))
                     .force("collide",
                        d3.forceCollide()
                        .radius(5)
                        .strength(0.7)
                        .iterations(16))
                     .on('tick', ticked);

function start () {
    const nodeElements = nodesContainer.selectAll('g').data(graph.nodes, d => d.name);
    const node = nodeElements.enter().append('g');
    node.append('circle')
        .attr('r', d => d.popularity * popularityScalar)
        .attr('fill', defaultNodeFill)
        .attr('stroke', '#eee')
        .attr('stroke-width', 2.0)
        .attr('cursor', 'pointer')
        .on('dblclick', dblclick)
        .on('click', click)
        .on("mouseover", d => set_highlight(d))
        .on("mouseout", d => exit_highlight(d))
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    node.append('text')
        .text(d => d.name)
        .attr('x', d => d.popularity * popularityScalar-2)
        .attr('y', d => -d.popularity * popularityScalar+2);

    nodeElements.exit().remove();

    const linkElements = linksContainer.selectAll('line').data(graph.links);

    linkElements.enter()
        .append('line')
        .attr('stroke-width', 1.0)
        .attr('stroke', defaultLinkColor);

    linkElements.exit().remove();

    simulation.nodes(graph.nodes);
    simulation.force('link').links(graph.links);
    simulation.alphaTarget(0.1).restart();
};

function click(d) {
    artistInfoName.innerText = d.name;
    playerContainer.innerHTML = `<iframe src="https://open.spotify.com/embed/artist/${d.uuid}" class="spotify-player" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
}

function dblclick(d) {
    if (!selectedArtists.map(artist => artist.name).includes(d.name)) {
        addArtistToSelected(d);
        getRelatedArtists(d.uuid).then(data => {
            data.artists.splice(0, maxNumRelated).forEach((relatedArtist, index) => {
                if (!selectedArtistsInfo.nodes.map(node => node.name).includes(relatedArtist.name)) {
                    selectedArtistsInfo.nodes.push({
                        name: relatedArtist.name,
                        popularity: relatedArtist.popularity,
                        uuid: relatedArtist.id,
                        image: relatedArtist.images[0].url,
                        group: 1
                    });
                }
                selectedArtistsInfo.links.push({
                    source: d.name,
                    target: relatedArtist.name,
                    value: index + 1
                });
            })
    
            updateGraph(selectedArtistsInfo);
        });
    }
}

function set_highlight(d) {
    d.fx = d.x;
    d.fy = d.y;
    findConnections();

    let node = svg.selectAll('circle');
    let text = svg.selectAll('text');
    let link = svg.selectAll('line');

    svg.style('cursor','pointer');
    node.attr('r', o => isConnected(d, o) ? o.popularity * popularityScalar + 2 : o.popularity * popularityScalar)
    node.style('stroke', o => isConnected(d, o) ? highlightNodeStoke : defaultNodeStroke);
    node.style('opacity', o => isConnected(d, o) ? 1 : highlightTransparency);
    text.style('font-weight', o => isConnected(d, o) ? highlightFontWeight : defaultFontWeight);
    text.style('opacity', o => isConnected(d, o) ? 1 : highlightTransparency);
    link.style('stroke', o => o.source.index == d.index || o.target.index == d.index ? highlightLinkColor : defaultLinkColor);
    link.style('stroke-width', o => o.source.index == d.index || o.target.index == d.index ? highlightLinkWidth : defaultLinkWidth);
    link.style('opacity', o => o.source.index == d.index || o.target.index == d.index ? 1 : highlightTransparency);		
}

function exit_highlight(d) {
    d.fx = null;
    d.fy = null;

    let node = svg.selectAll('circle');
    let text = svg.selectAll('text');
    let link = svg.selectAll('line');

    svg.style('cursor','move');
    node.attr('r', d => d.popularity * 0.1)
    node.style('stroke', defaultNodeStroke);
    node.style('opacity', defaultTransparency);
    text.style('font-weight', 100);
    text.style('opacity', defaultTransparency);
    link.style('stroke', defaultLinkColor);
    link.style('stroke-width', defaultLinkWidth);
    link.style('opacity', defaultTransparency);
}

function ticked() {
    nodesContainer.selectAll('g')
                  .attr('transform', d => `translate(${d.x},${d.y})`)

    linksContainer.selectAll('line')
                  .attr('x1', d => d.source.x)
                  .attr('y1', d => d.source.y)
                  .attr('x2', d => d.target.x)
                  .attr('y2', d => d.target.y);
}

zoom.on("zoom", function() {
    nodesContainer.attr("transform", d3.event.transform);
    linksContainer.attr("transform", d3.event.transform);
})

svg.call(zoom).on("dblclick.zoom", null);
  

const addNode = node => graph.nodes.push(node);
const addLink = (source, target) => graph.links.push({source, target});
const createNode = artist => { 
    return { x: width/2, y: height/2, ...artist }
};

const removeNode = name => {
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

const removeLink = (source, target) => {
    for (var i = 0; i < links.length; i++) {
        if (links[i].source.name == source && links[i].target.name == target) {
            links.splice(i, 1);
            break;
        }
    }
    update();
};

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function updateGraph(graphData) {
    const updatedArtists = graphData.nodes.map(artist => artist.name);
    graph.nodes = graph.nodes.filter(node => {
        return updatedArtists.includes(node.name);
    });
    graphData.nodes.forEach(artist => {
        if (!graph.nodes.find(node => node.name === artist.name)) {
            addNode(createNode(artist))
        }
    });

    graph.links = graph.links.filter(link => selectedArtists.includes(link.source.name));
    graphData.links.forEach(newLink => {
        if (!graph.links.find(link => link.source.name === newLink.source &&
                              link.target.name === newLink.target)) {
            addLink(graph.nodes.find(node => node.name === newLink.source), 
                    graph.nodes.find(node => node.name === newLink.target))
        }
    });
    start();
}

start();

export { updateGraph }