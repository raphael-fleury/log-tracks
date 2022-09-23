import "dotenv/config";
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { inputFolderPath, outputFolderPath, dateFormat, timeFormat } from './config.js';
import ExcelJS from 'exceljs';
import moment from 'moment';
import path from 'path';

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

function formatData(playlist, item) {
    const { added_at } = item
    const { id, name } = formatTrack(item.track)

    return [id, {
        name, added_at,
        playlist: playlist.name
    }]
}

function getTrackList() {
    const result = new Map();

    for (const playlist of getPlaylists()) {
        playlist.tracks.items.sort((a, b) => moment(a.added_at) - moment(b.added_at))
        for (const item of playlist.tracks.items) {
            const [id, data] = formatData(playlist, item)
            if (!result.has(id)) {
                result.set(id, data)
            }
        }
    }

    return result;
}

function tracklistToArray(tracklist) {
    const keys = Array.from(tracklist.keys());
    return keys.map(key => {
        return { id: key, ...tracklist.get(key) }
    })
}

function extractDateAndTime(added_at) {
    const date = moment(added_at).format(dateFormat)
    const time = moment(added_at).format(timeFormat)
    return [ date, time ]
}

function writeIds(tracklist) {
    const content = Array.from(tracklist.keys()).join('\n')
    writeFileSync(path.join(outputFolderPath, 'result.txt'), content)
}

function writeSheet(tracklist) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Result');

    sheet.addRow(['ID', 'Playlist', 'Date', 'Time', 'Track'])
    sheet.addRows(tracklistToArray(tracklist).map(d => 
        [d.id, d.playlist, ...extractDateAndTime(d.added_at), d.name]
    ))

    sheet.getColumn('A').hidden = true;
    workbook.xlsx.writeFile(path.join(outputFolderPath, 'result.xlsx'))
        .then(() => console.log("File written successfully."))
        .catch(() => console.error("File written successfully."))
}

function main() {
    const tracklist = getTrackList()
    writeSheet(tracklist)
}

main();