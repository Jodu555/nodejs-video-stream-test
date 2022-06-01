const path = require('path');
const fs = require('fs');


const http = require('http');
const express = require('express');
const https = require('https');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
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

app.get("/video", (req, res) => {
    console.log(req.params);
    // Ensure there is a range given for the video
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
        return;
    }

    const videoPath = path.join(path.join(process.env.VIDEO_PATH, 'STO', 'Mia and Me – Abenteuer in Centopia', 'Season-1', 'Mia and Me – Abenteuer in Centopia St#1 Flg#1.mp4'));
    const videoSize = fs.statSync(videoPath).size;

    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    // console.log({ videoPath, videoSize, start, end });

    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
});

const PORT = process.env.PORT || 3100;
server.listen(PORT, () => {
    console.log(`Express App Listening ${process.env.https ? 'with SSL ' : ''}on ${PORT}`);
});