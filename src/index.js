const path = require('path');
const fs = require('fs');


const http = require('http');
const express = require('express');
const https = require('https');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { listFiles } = require('./utils.js');
const dotenv = require('dotenv').config();

// const { Database } = require('@jodu555/mysqlapi');
// const database = Database.createDatabase('localhost', 'root', '', 'rt-chat');
// database.connect();
// require('./utils/database')();

const app = express();
app.use(cors());
app.use(morgan('dev'));
// app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
    if (req.path.includes('/assets/previewImgs')) {
        res.set('Cache-control', `public, max-age=${60 * 5}`)
    }
    next();
})

let server;
if (process.env.https) {
    const sslProperties = {
        key: fs.readFileSync(process.env.KEY_FILE),
        cert: fs.readFileSync(process.env.CERT_FILE),
    };
    server = https.createServer(sslProperties, app)
} else {
    server = http.createServer(app);
}


// Your Middleware handlers here
app.use(express.static(path.join('static')));

app.get("/video", require('./video.js'));

const crawlAndIndex = () => {
    const { dirs, files } = listFiles(process.env.VIDEO_PATH);

    const overcategories = ['Aniworld', 'STO'];

    const obj = {};

    let sortIdx = -1;
    dirs.forEach(dir => {
        if (overcategories.includes(dir)) {
            sortIdx == -1 ? sortIdx = 0 : sortIdx++;
        } else {
            obj[overcategories[sortIdx]] == undefined ? obj[overcategories[sortIdx]] = [dir] : obj[overcategories[sortIdx]].push(dir);
        }
    });

    console.log(obj);

    // console.log(dirs);
    // return;
    // for (let i = 0; i < dirs.length;) {
    //     const title = dirs[i];
    //     const se = [];
    //     // console.log(title, i);
    //     i++;
    //     // console.log(1337, title, i, dirs[i]);
    //     while (dirs[i] != undefined && dirs[i].includes('Season-')) {
    //         console.log(1212, title, i, dirs[i]);
    //         se.push(dirs[i]);
    //         i++;
    //     }
    //     console.log(title, se);
    //     i++;
    // }

}

class Item {
    constructor(ID, title) {
        this.ID = ID;
        this.title = title;
        this.seasons = [];
        this.movies = [];
    }
}

const PORT = process.env.PORT || 3100;
server.listen(PORT, () => {
    console.log(`Express App Listening ${process.env.https ? 'with SSL ' : ''}on ${PORT}`);

    crawlAndIndex();
});