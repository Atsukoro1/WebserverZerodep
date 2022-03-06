module.exports = {
    name: "register",
    executor: (request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.write(`{ d: "${request.url}" }`);
        response.end();
    }
}