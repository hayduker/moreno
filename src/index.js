import { drawGraph, updateGraph } from './graph'
import { searchArtists, getRelatedArtists, artistsFound } from './requests'

const artistSearchElem = document.getElementById('artist-search');
const selectedArtistsElem = document.querySelector('.selected-artists');

const selectedArtists = []; // JSON.parse(localStorage.getItem('selected-artists')) || [];

const selectedArtistsInfo = {
    nodes: [],
    links: []
};

artistSearchElem.addEventListener('input', e => searchArtists(e.target.value));

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

function autocomplete(inputElem) {
    let currentFocus;
    /*execute a function when someone writes in the text field:*/
    inputElem.addEventListener('input', function (e) {
        const searchQuery = this.value;
        closeAllLists();
        if (!searchQuery) { return false; }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        const dropdownContainer = document.createElement('div');
        dropdownContainer.setAttribute('id', this.id + 'autocomplete-list');
        dropdownContainer.setAttribute('class', 'autocomplete-items');
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(dropdownContainer);

        artistsFound.forEach(artist => {
            // check if the item starts with the same letters as the text field value
            if (artist.name.substr(0, searchQuery.length).toUpperCase() == searchQuery.toUpperCase()) {
                const dropdownItem = document.createElement('div');
                dropdownItem.innerHTML = '<strong>' + artist.name.substr(0, searchQuery.length) + '</strong>';
                dropdownItem.innerHTML += artist.name.substr(searchQuery.length);
                dropdownItem.innerHTML += '<input type="hidden" value="' + artist.name + '">';

                dropdownItem.addEventListener('click', function () {
                    inputElem.value = '';
                    if (!selectedArtists.find(artistInArr => artistInArr.id === artist.id)) {
                        selectedArtists.push({
                            name: artist.name,
                            id: artist.id
                        })

                        displaySelectedArtists();
                        saveSelectedArtists();

                        selectedArtistsInfo.nodes.push({
                            id: artist.name,
                            group: 1
                        })

                        getRelatedArtists(artist.id).then(data => {
                            console.log('getting related artists');
                            data.artists.forEach((relatedArtist, index) => {
                                console.log('processing related artist');
                                selectedArtistsInfo.nodes.push({
                                    id: relatedArtist.name,
                                    group: 1
                                })
                                selectedArtistsInfo.links.push({
                                    source: artist.name,
                                    target: relatedArtist.name,
                                    value: index + 1
                                })
                            })

                            updateGraph(selectedArtistsInfo);
                        });
                    }

                    closeAllLists();
                });

                dropdownContainer.appendChild(dropdownItem);
            }
        })
    });
    // Enable navigating dropdown with keyboard
    inputElem.addEventListener('keydown', function (e) {
        let listElems;
        const list = document.getElementById(this.id + 'autocomplete-list');
        if (list) listElems = list.getElementsByTagName('div');
        if (e.keyCode == 40) { // DOWN arrow
            currentFocus++;
            addActive(listElems);
        } else if (e.keyCode == 38) { // UP arrow
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
        if (!listElems) return false;
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

drawGraph();

document.querySelector('#button').addEventListener('click', updateGraph);