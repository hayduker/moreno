const client_id = 'd2c3ba669348417495eda0f62ed677c2';
const client_secret = 'aa8e6e110b8b494e9aa33a9a5cd4679e';

let clientCredsToken = '';

const getClientCredentialsToken = async () => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
        },
        body: 'grant_type=client_credentials'
    });

    return response.json();
}

getClientCredentialsToken().then(data => clientCredsToken = data.access_token);

const getArtist = async artistId => {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
            'Authorization': 'Bearer ' + clientCredsToken
        }
    });

    return response.json();
};

const getRelatedArtists = async artistId => {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
        headers: {
            'Authorization': 'Bearer ' + clientCredsToken
        }
    });

    return response.json();
};

const searchArtists = async query => {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=artist`, {
        headers: {
            'Authorization': 'Bearer ' + clientCredsToken
        }
    });

    const data = await response.json();
    let artistsFound = [];
    if (data.artists) return artistsFound = data.artists.items.map(artist => {
            return {
                name: artist.name,
                id: artist.id
            }
        });
    return artistsFound;
};

export { getArtist, getRelatedArtists, searchArtists }