import { getRelatedArtists } from './requests'
import { selectedArtistsInfo, addRelatedArtistsToGraphData, addArtistToSelected, maxNumRelated, artistInfoName, artistInfoImg } from './index'

const svg = d3.select('svg');
const width = +svg.attr('width');
const height = +svg.attr('height');
const color = d3.scaleOrdinal(d3.schemeCategory10);
const graph = { nodes: [], links: [] };

const linksContainer = svg.append('g').attr('class', 'links');
const nodesContainer = svg.append('g').attr('class', 'nodes');

const simulation = d3.forceSimulation()
                     .force('link', d3.forceLink().id(function(d) { return d.name; }))
                     .force('charge', d3.forceManyBody())
                     .force('center', d3.forceCenter(width / 2, height / 2))
                     .on('tick', ticked);

function start () {
    const nodeElements = nodesContainer.selectAll('g').data(graph.nodes, d => d.name);
    const node = nodeElements.enter().append('g');
    
    node.append('circle')
        .attr('r', 5)
        .attr('fill', function(d) { return color(d.group); })
        .attr('cursor', 'pointer')
        .on('dblclick', dblclick)
        .on('click', click)
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
        .attr('stroke-width', 1.5)
        .attr('stroke', 'black');

    linkElements.exit().remove();

    simulation.nodes(graph.nodes);
    simulation.force('link').links(graph.links);
    simulation.restart();
};

function click(d) {
    artistInfoName.innerText = d.name;
    artistInfoImg.src = d.image;
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

start();

export { updateGraph }