// Functions to handle messages and files in the chat app
const sqlite3 = require('sqlite3').verbose(); // verbose mode for detailed error messages
const db = new sqlite3.Database('chat.db'); // create database object


const setup = () => {
    db.serialize(() => {
        db.run("create table if not exists messages (id INTEGER PRIMARY KEY, username TEXT, text TEXT, time TEXT, room TEXT)");
        db.run("create table if not exists files (id INTEGER PRIMARY KEY, username TEXT, filename TEXT, data BLOB, time TEXT, isImage BOOLEAN, isVideo BOOLEAN, room TEXT)");
    }); // db.serialize() to run multiple queries
}; // create table if it doesn't exist


const get_chat = async (room) => {
    const msgQuery = `select username, text, time from messages where room = ?`;
    try {
        const msgRows = await new Promise((resolve, reject) => {
            db.all(msgQuery, [room], (err, rows) => {
                if (err) {
                    console.error('Error fetching messages:', err.message);
                    return reject(err);
                } else { resolve(rows); }
            });
        });
        return(msgRows);
    } catch (error) { console.error('Error in get_chat function:', error.message); }
}


const load = (room) => {
    return new Promise((resolve, reject) => {
        const msg_query = `select 'message' as type, username, text, time from messages where room = ?`;
        const file_query = `select 'file' as type, username, filename, data, time, isImage, isVideo from files where room = ?`;

        db.all(msg_query, [room], (e, msgRows) => {
            if (e) {
                console.log('Error fetching messages:', e.message);
                return reject(e);
            }
            db.all(file_query, [room], (e, fileRows) => {
                if (e) {
                    console.log('Error fetching files:', e.message);
                    return reject(e);
                }
                const combinedResults = [...msgRows, ...fileRows];
                combinedResults.sort((a, b) => new Date(a.time) - new Date(b.time));
                resolve(combinedResults);
            });
        });
    });
}


const getFile = (room, username, file) => {
    console.log('in getfile 1')
    const { filename, data, isImage, isVideo } = file; // import file from utils
    const all = {
        username: username,
        filename: filename,
        data: data,
        time: new Date().toLocaleString(),
        isImage: isImage,
        isVideo: isVideo
    };

    // insert file into the database
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("insert into files (username, filename, data, time, isImage, isVideo, room) values (?, ?, ?, ?, ?, ?, ?)");
        stmt.run(all.username,  all.filename,  all.data,  all.time,  all.isImage,  all.isVideo, room, (e) => {
            if (e) { 
                console.log('Error inserting file:', e.message); 
                reject(e);
            } 
            else { 
                console.log('File inserted successfully');
                resolve(all);
            }
        });
        stmt.finalize();
        console.log('in getfile 2')
    });
}


const msg = (room, username, text) => {
    const message = {
        username,
        text,
        time: new Date().toLocaleString()
    };
    // insert message into the database
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("insert into messages (username, text, time, room) values (?, ?, ?, ?)");
        stmt.run(message.username, message.text, message.time, room, (e) => {
            if (e) { 
                console.log('Error inserting message:', e.message);
                reject(e);
            }  else {  resolve(message); }
        });
        stmt.finalize();
    });
};


const location_time = (username, location) => {
    return {
        username,
        location,
        time : new Date().toLocaleString()
    };
};


setup(); 
module.exports = {
    msg,
    location_time,
    getFile,
    get_chat,
    load
}


// db.close((err) => {
//     if (err) { console.error('Error closing the database:', err.message); }
// });