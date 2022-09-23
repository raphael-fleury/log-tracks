import { readdirSync, readFileSync, writeFileSync } from 'fs';
import moment from 'moment';
import path from 'path';

const inputFolderPath = './playlists'
const outputFolderPath = './output'

function getPlaylists() {
    const folder = readdirSync(inputFolderPath);

    return folder.map(file => {
        const data = readFileSync(path.join(inputFolderPath, file));
        return JSON.parse(data.toString());
    })
}

function formatTrack(track) {
    let { id, name, is_local, artists } = track;

    if (is_local)
        id = name
    else
        name = `${artists[0].name} - ${name}`

    return { id, name }
}

function extractDateAndTime(added_at) {
    const date = moment(added_at).format("DD/MM/YYYY")
    const time = moment(added_at).format("HH:mm")
    return { date, time }
}

function formatData(playlist, item) {
    const { added_at } = item
    const { id, name } = formatTrack(item.track)
    const { date, time } = extractDateAndTime(added_at)

    return [id, {
        name, date, time,
        playlist: playlist.name
    }]
}

function getTrackList() {
    const result = new Map();

    for (const playlist of getPlaylists()) {
        for (const item of playlist.tracks.items) {
            const [id, data] = formatData(playlist, item)
            if (!result.has(id)) {
                result.set(id, data)
            }
        }
    }

    return result;
}

function writeIds(tracklist) {
    const content = Array.from(tracklist.keys()).join('\n')
    writeFileSync(path.join(outputFolderPath, 'result.txt'), content)
}

function main() {
    const tracklist = getTrackList()
    writeIds(tracklist)
}

main();