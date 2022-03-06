// Required modules
const fs = require('fs');
const path = require('path')

// We're going to cache all routes here
const routes = new Map();

// Scrape the routes folder and cache it all
(async function() {
    const folders = await fs.readdirSync(`${__dirname}/routes`);
    
    async function crawlDir(routePath) {
        const filesInFolder = await fs.readdirSync(`${__dirname}/routes/${routePath}`);

        filesInFolder.forEach(async(file) => {
            if(path.extname(file).length > 0) {
                // File is located at this path, add it to routes
                const fileToAdd = require(`${__dirname}/routes/${routePath}/${file}`);
                routes.set(`/${routePath}/${file}`.split(".")[0], fileToAdd.executor);
                console.log(`[ROUTES] Added route /${routePath}/${file}`)
            } else {
                // Directory is located at this path, crawl it
                const newPathToCrawl = `${routePath}/${file}`;
                crawlDir(`${newPathToCrawl}`)
            }
        });
    }

    folders.forEach(async(folder) => {
        await crawlDir(folder);
    });
}());

// Parse cookies string into readable JSON
function parseCookies(cookieString) {
    let cookies = {};

    if(cookieString) {
        cookieString.split(";").map(str => {
            let splitted = str.split("=");
            return Object.assign(cookies, {[splitted[0]]: splitted[1]});
        });
    }

    return cookies;
};

// Retrieve JSON or plaintext data from request
async function retrieveBody(request) {
    const contentType = request.headers['content-type' || 'Content-Type'];

    let body = [];

    if(contentType) {
        await request.on('data', (chunk) => {
            body.push(chunk);
        });
    
        if(body.length !== 0) {
            body = Buffer.concat(body)
            request.headers['content-type'].toLowerCase() == 'application/json' 
            ? body = JSON.parse(body.toString())
            : body = body.toString();
        }
    }

    return body;
}

// Emits when user makes a HTTP request
async function handleWebserverRequest(request, response) {
    // Parse cookie data to be readable as an object
    request.headers.cookie = parseCookies(request.headers.cookie);

    // Wait for body to be delivered
    request.body = await retrieveBody(request);

    const executor = routes.get(request.url);

    if(executor) {
        executor(request, response);
    } else {
        response.statusCode = 404;
        response.write(`[${request.method}] Route ${request.url} does not exist!`);
        response.end();
    }
}

module.exports = { handleWebserverRequest, routes };