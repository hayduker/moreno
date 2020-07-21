import { artistInfoName, selectedArtists, addArtist } from './index'

const playerContainer = document.querySelector('.player-container');
const loadingContainer = document.querySelector('.loading-container');
const instructionsContainer = document.querySelector('.instructions-container');
const controlsContainer = document.querySelector('.controls-container');
const svg = d3.select('svg');
const { width, height } = document.querySelector('#graph').getBoundingClientRect();

const graph = { nodes: [], links: [] };

const linksContainer = svg.append('g').attr('class', 'links');
const nodesContainer = svg.append('g').attr('class', 'nodes');
const labelsContainer = svg.append('g').attr('class', 'labels');

let activeArtist;

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
                    .force("x", d3.forceX())
                    .force("y", d3.forceY())
                     .force("collide",
                        d3.forceCollide()
                        .radius(5)
                        .strength(0.7)
                        .iterations(16))
                     .on('tick', ticked);

function start () {
    const nodeElements = nodesContainer.selectAll('circle').data(graph.nodes, d => d.name);

    nodeElements.enter().append('circle')
        .attr('r', d => d.popularity * popularityScalar)
        .attr('fill', defaultNodeFill)
        .attr('stroke', '#eee')
        .attr('stroke-width', 2.0)
        .attr('cursor', 'pointer')
        .on('click', click)
        .on("mouseover", d => setHighlight(d))
        .on("mouseout", d => exitHighlight(d))
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    nodeElements.exit().remove();

    const labelElements = labelsContainer.selectAll('text').data(graph.nodes, d => d.name);

    labelElements.enter().append('text')
        .text(d => d.name)
        .attr('class','graph-text')
        .attr('x', d => d.popularity * popularityScalar-2)
        .attr('y', d => -d.popularity * popularityScalar+2);

    labelElements.exit().remove();

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
    if (d3.event.shiftKey) {
        // Expand graph on clicked node
        addArtist(d);
    } else if (activeArtist !== d.name) {
        // Display music player for clicked artist
        playerContainer.innerHTML = `<iframe src="https://open.spotify.com/embed/artist/${d.id}" class="spotify-player" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;

        artistInfoName.innerText = d.name;
        artistInfoName.href = `https://open.spotify.com/artist/${d.id}`
        activeArtist = d.name;

        loadingContainer.style.display = 'flex';
        playerContainer.parentElement.style.display = 'none';

        setTimeout(() => {
            loadingContainer.style.display = 'none';
            playerContainer.parentElement.style.display = 'flex';
        }, 1000);
    }
}

function setHighlight(d) {
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

function exitHighlight(d) {
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
    nodesContainer.selectAll('circle')
                  .attr('transform', d => `translate(${d.x},${d.y})`)

    labelsContainer.selectAll('text')
                   .attr('transform', d => `translate(${d.x},${d.y})`)

    linksContainer.selectAll('line')
                  .attr('x1', d => d.source.x)
                  .attr('y1', d => d.source.y)
                  .attr('x2', d => d.target.x)
                  .attr('y2', d => d.target.y);
}

zoom.on('zoom', function() {
    nodesContainer.attr('transform', d3.event.transform);
    labelsContainer.attr('transform', d3.event.transform);
    linksContainer.attr('transform', d3.event.transform);
})

svg.call(zoom).on('dblclick.zoom', null);
  

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
    console.log('updateGraph()')
    const updatedArtists = graphData.nodes.map(artist => artist.name);
    graph.nodes = graph.nodes.filter(node => updatedArtists.includes(node.name));
    graphData.nodes.forEach(artist => {
        if (!graph.nodes.find(node => node.name === artist.name)) {
            addNode(createNode(artist))
        }
    });

    // console.log(graph.links)
    // console.log(graphData.links)
    graph.links = graph.links.filter(link => selectedArtists.includes(link.source.name));

    graphData.links.forEach(newLink => {
        if (!graph.links.find(link => link.source.name === newLink.source &&
                              link.target.name === newLink.target)) {
            addLink(graph.nodes.find(node => node.name === newLink.source), 
                    graph.nodes.find(node => node.name === newLink.target))
        }
    });
    start();

    if (selectedArtists.length > 0) {
        instructionsContainer.style.display = 'flex';
        svg.style('cursor','move');
        controlsContainer.style.display = 'flex';
    } else {
        instructionsContainer.style.display = 'none';
        svg.style('cursor','default');
        controlsContainer.style.display = 'none;'
    }
}

start();

export { updateGraph, activeArtist, playerContainer, setHighlight, exitHighlight, graph }