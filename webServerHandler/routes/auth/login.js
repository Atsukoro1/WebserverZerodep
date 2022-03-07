module.exports = {
    name: "login",
    executor: (request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.write(`{ d: '${JSON.stringify(request.body)}' }`);
        response.end();
    }
}