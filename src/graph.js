import { getRelatedArtists } from './requests'
import { selectedArtistsInfo, addRelatedArtistsToGraphData, addArtistToSelected, maxNumRelated, artistInfoName, spotifyPlayer } from './index'

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
let defaultNodeStrokeWidth = 2.0;
let highlightNodeStrokeWidth = 4.0;
let defaultFontWeight = 'regular';
let highlightFontWeight = 'bold';
let highlightLinkColor = '#444';
let defaultLinkColor = '#888';
let defaultLinkWidth = 1.0;
let highlightLinkWidth = 2.0;
let defaultTransparency = 1.0;
let highlightTransparency = 0.5;

let min_zoom = 0.1;
let max_zoom = 7;
let zoom = d3.zoom().scaleExtent([min_zoom,max_zoom])
 
zoom.on("zoom", () => console.log('hey'));

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
                     .force('link', d3.forceLink().id(function(d) { return d.name; }))
                     .force('charge', d3.forceManyBody().strength(-1000))
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
        .attr('r', d => d.popularity / 10)
        .attr('fill', defaultNodeFill) //color(d.group))
        .attr('stroke', '#eee')
        .attr('stroke-width', 2.0)
        .attr('cursor', 'pointer')
        .on('dblclick', dblclick)
        .on('click', click)
        .on("mouseover", d => set_highlight(d))
        .on("mouseout", exit_highlight)
        .on("dblclick.zoom", () => console.log('hey'))
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    node.append('text')
        .text(d => d.name)
        .attr('x', 6)
        .attr('y', 3);

    nodeElements.exit().remove();

    const linkElements = linksContainer.selectAll('line').data(graph.links);

    linkElements.enter()
        .append('line')
        .attr('stroke-width', 1.0)
        .attr('stroke', defaultLinkColor);

    linkElements.exit().remove();

    simulation.nodes(graph.nodes);
    simulation.force('link').links(graph.links);
    simulation.restart();
};

function click(d) {
    artistInfoName.innerText = d.name;
    // artistInfoImg.src = d.image;
    // artistInfoImg.style.visibility = 'visible';
    console.log(`https://open.spotify.com/embed/artist/${d.uuid}`)
    // spotifyPlayer.src = `https://open.spotify.com/embed/artist/${d.uuid}`
    // spotifyPlayer.style.visibility = 'visible';

    playerContainer.innerHTML = `<iframe src="https://open.spotify.com/embed/artist/${d.uuid}" class="spotify-player" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
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

function set_highlight(d) {
    findConnections();

    let node = svg.selectAll('circle');
    let text = svg.selectAll('text');
    let link = svg.selectAll('line');

    svg.style('cursor','pointer');
    node.style('stroke', o => isConnected(d, o) ? defaultNodeFill : defaultNodeStroke);
    node.style('stroke-width', o => isConnected(d, o) ? highlightNodeStrokeWidth : defaultNodeStrokeWidth);
    node.style('opacity', o => isConnected(d, o) ? 1 : highlightTransparency);
    text.style('font-weight', o => isConnected(d, o) ? highlightFontWeight : defaultFontWeight);
    text.style('opacity', o => isConnected(d, o) ? 1 : highlightTransparency);
    link.style('stroke', o => o.source.index == d.index || o.target.index == d.index ? highlightLinkColor : defaultLinkColor);
    link.style('stroke-width', o => o.source.index == d.index || o.target.index == d.index ? highlightLinkWidth : defaultLinkWidth);
    link.style('opacity', o => o.source.index == d.index || o.target.index == d.index ? 1 : highlightTransparency);		
}

function exit_highlight() {
    let node = svg.selectAll('circle');
    let text = svg.selectAll('text');
    let link = svg.selectAll('line');

    svg.style('cursor','move');
    node.style('stroke', defaultNodeStroke);
    node.style('stroke-width', defaultNodeStrokeWidth);
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

const addNode = node => graph.nodes.push(node);
const addLink = (source, target) => graph.links.push({source, target});
const createNode = artist => { 
    return { x: width/2, y: height/2, ...artist }
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
    graphData.nodes.forEach(artist => {
        if (!graph.nodes.find(node => node.name === artist.name)) {
            addNode(createNode(artist))
        }
    });
    graphData.links.forEach(newLink => {
        if (!graph.links.find(link => link.source.name === newLink.source &&
                              link.target.name === newLink.target)) {
            addLink(graph.nodes.find(node => node.name === newLink.source), 
                    graph.nodes.find(node => node.name === newLink.target))
        }
    });
    start();
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}	

start();

export { updateGraph }