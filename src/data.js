const graph1 = {
    nodes: [
        { id: "a" },
        { id: "b" },
        { id: "c" }
    ],
    links: []
}

const graph2 = {
    nodes: [
        { id: "a" },
        { id: "b" },
        { id: "c" }
    ],
    links: [
        { source: "a", target: "b" },
        { source: "b", target: "c" },
        { source: "c", target: "a" }
    ]
}

const graph3 = {
    nodes: [
        { id: "a" },
        { id: "b" }
    ],
    links: [
        { source: "a", target: "b" }
    ]
}

export { graph1, graph2, graph3 }