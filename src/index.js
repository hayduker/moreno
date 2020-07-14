import { updateGraph } from './graph'
import { searchArtists, getRelatedArtists, getArtist } from './requests'

const artistSearchElem = document.getElementById('artist-search');
const selectedArtistsElem = document.querySelector('.selected-artists');

const artistInfoName = document.querySelector('.artist-info-name');
// const artistInfoImg = document.querySelector('.artist-info-img');

// const relatedSlider = document.querySelector('.related-slider');

let selectedArtists = []; // JSON.parse(localStorage.getItem('selected-artists')) || [];

let selectedArtistsInfo = {
    nodes: [],
    links: []
};

let maxNumRelated = 6; // relatedSlider.value;

function displaySelectedArtists() {
    selectedArtistsElem.innerHTML = '';
    document.querySelector('.selected-artists-title').style.visibility = selectedArtists.length > 0 ? 'visible' : 'hidden';
    selectedArtists.forEach((artist, index) => {
        const listElem = document.createElement('li');
        listElem.innerHTML = `
        <div><i class="fas fa-angle-right"></i>
            ${artist.name}
        </div>
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-times remove-artist"></i>';
        deleteBtn.addEventListener('click', () => {     
            selectedArtists.splice(index, 1);
            selectedArtistsInfo.links = selectedArtistsInfo.links.filter(link => link.source !== artist.name);

            const artistsToKeep = selectedArtists.map(artist => artist.name).concat(selectedArtistsInfo.links.map(link => link.target));
            selectedArtistsInfo.nodes = selectedArtistsInfo.nodes.filter(node => artistsToKeep.includes(node.name));

            updateGraph(selectedArtistsInfo);
            displaySelectedArtists();
            saveSelectedArtists();
        });
        listElem.appendChild(deleteBtn);

        selectedArtistsElem.appendChild(listElem);
    })
}

function saveSelectedArtists() {
    //localStorage.setItem('selected-artists', JSON.stringify(selectedArtists));
}

autocomplete(document.getElementById('artist-search'));

function addRelatedArtistsToGraphData (sourceArtist, relatedArtists) {
    relatedArtists.forEach((relatedArtist, index) => {
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
            source: sourceArtist.name,
            target: relatedArtist.name,
            value: index + 1
        });
    });
};

function addArtistToSelected (sourceArtist) {
    selectedArtists.push({
        name: sourceArtist.name,
        id: sourceArtist.id,
    });

    displaySelectedArtists();
}

function addArtistToGraphData (sourceArtist) {
    getArtist(sourceArtist.id).then(data => {
        if (!selectedArtistsInfo.nodes.map(node => node.name).includes(sourceArtist.name)) {
            selectedArtistsInfo.nodes.push({
                name: sourceArtist.name,
                popularity: data.popularity,
                uuid: sourceArtist.id,
                image: data.images[0].url,
                group: 1
            });
        }
    });

    getRelatedArtists(sourceArtist.id).then(data => {
        const relatedArtists = data.artists.splice(0, maxNumRelated);
        addRelatedArtistsToGraphData(sourceArtist, relatedArtists);
        updateGraph(selectedArtistsInfo);
    });
}

function autocomplete(inputElem) {
    let currentFocus;
    /*execute a function when someone writes in the text field:*/
    inputElem.addEventListener('input', e => {
        const searchQuery = e.target.value;
        searchArtists(searchQuery).then(artistsFound => {
            closeAllLists();
            if (!searchQuery) { return false; }
            currentFocus = -1;
            /*create a DIV element that will contain the items (values):*/
            const dropdownContainer = document.createElement('div');
            dropdownContainer.setAttribute('id', e.target.id + 'autocomplete-list');
            dropdownContainer.setAttribute('class', 'autocomplete-items');
            /*append the DIV element as a child of the autocomplete container:*/
            e.target.parentNode.appendChild(dropdownContainer);
    
            const maxDropdownSize = 10;
            artistsFound.splice(0, maxDropdownSize).forEach(artist => {
                // check if the item starts with the same letters as the text field value
                if (artist.name.substr(0, searchQuery.length).toUpperCase() == searchQuery.toUpperCase()) {
                    const dropdownItem = document.createElement('div');
                    dropdownItem.innerHTML = '<strong>' + artist.name.substr(0, searchQuery.length) + '</strong>';
                    dropdownItem.innerHTML += artist.name.substr(searchQuery.length);
                    dropdownItem.innerHTML += '<input type="hidden" value="' + artist.name + '">';
                    
                    dropdownItem.addEventListener('click', () => {
                        inputElem.value = '';
                        if (!selectedArtists.find(artistinArr => artistinArr.id === artist.id)) {
                            addArtistToSelected(artist);
                            addArtistToGraphData(artist, maxNumRelated);
                        }
                        saveSelectedArtists();
                        closeAllLists();
                    });
    
                    dropdownContainer.appendChild(dropdownItem);
                }
            })
        })
    });
    // Enable navigating dropdown with keyboard
    inputElem.addEventListener('keydown', function (e) {
        let listElems;
        const list = document.getElementById(this.id + 'autocomplete-list');
        if (list) listElems = list.getElementsByTagName('div');
        if (e.keyCode == 40) { // DOWN
            currentFocus++;
            addActive(listElems);
        } else if (e.keyCode == 38) { // UP
            currentFocus--;
            addActive(listElems);
        } else if (e.keyCode == 13) { // ENTER
            e.preventDefault();
            if (currentFocus > -1) {
                if (listElems) listElems[currentFocus].click();
            }
        }
    });
    function addActive(listElems) {
        if (listElems.length === 0) return false;
        removeActive(listElems);
        if (currentFocus >= listElems.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (listElems.length - 1);
        listElems[currentFocus].classList.add('autocomplete-active');
    }
    function removeActive(listElems) {
        for (let i = 0; i < listElems.length; i++) {
            listElems[i].classList.remove('autocomplete-active');
        }
    }
    function closeAllLists(inElem) {
        var listElems = document.getElementsByClassName('autocomplete-items');
        for (let i = 0; i < listElems.length; i++) {
            const elem = listElems[i];
            if (inElem != elem && inElem != inputElem) {
                elem.parentNode.removeChild(elem);
            }
        }
    }
    document.addEventListener('click', function (e) {
        closeAllLists(e.target);
    });
}

// relatedSlider.addEventListener('input', e => {
//     maxNumRelated = +e.target.value;
//     selectedArtists.forEach(artist => addArtistToGraphData(artist));
// });

//drawGraph();

export { selectedArtistsInfo, addRelatedArtistsToGraphData, addArtistToSelected, maxNumRelated, artistInfoName, selectedArtists}