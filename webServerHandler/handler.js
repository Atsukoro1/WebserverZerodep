// Required modules
const fs = require('fs');
const path = require('path')

// We're going to store all routes here
const ROUTES = new Map();

// Scrape the routes folder and store it into ROUTES map
(async function() {
    const FOLDERS = await fs.readdirSync(`${__dirname}/routes`);
    
    async function crawlDir(routePath) {
        const filesInFolder = await fs.readdirSync(`${__dirname}/routes/${routePath}`);

        filesInFolder.forEach(async(file) => {
            if(path.extname(file).length > 0) {
                // File is located at this path, add it to routes
                const FILETOADD = require(`${__dirname}/routes/${routePath}/${file}`);
                ROUTES.set(`/${routePath}/${file}`.split(".")[0], FILETOADD.executor);
                console.log(`[ROUTES] Added route /${routePath}/${file}`)
            } else {
                // Directory is located at this path, crawl it
                const NEWPATHTOCRAWL = `${routePath}/${file}`;
                crawlDir(`${NEWPATHTOCRAWL}`)
            }
        });
    }

    FOLDERS.forEach(async(folder) => {
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
    const CONTENTTYPE = request.headers['content-type' || 'Content-Type'].toLowerCase();

    let body = [];

    if(CONTENTTYPE) {
        await request.on('data', (chunk) => {
            body.push(chunk);
        });
    
        if(body.length !== 0) {
            body = Buffer.concat(body)
            CONTENTTYPE == 'application/json' 
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

    const EXECUTOR = ROUTES.get(request.url);

    if(EXECUTOR) {
        EXECUTOR(request, response);
    } else {
        response.statusCode = 404;
        response.write(`[${request.method}] Route ${request.url} does not exist!`);
        response.end();
    }
}

module.exports = { handleWebserverRequest, ROUTES };