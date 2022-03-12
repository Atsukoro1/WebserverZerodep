const { validateBody } = require("../../../utils/bodyValidator");

module.exports = {
    name: "register",
    method: "POST",
    executor: (request, response) => {
        const VALIDATION = validateBody(request.body, {
            username: "required;string;max:64;alphanum",
            password: "required;string;min:8;max:255",
            email: "required;email;string;max:255"
        });

        if(VALIDATION.length !== 0) {
            response.setHeader('Content-Type', 'application/json');
            response.statusCode = 400;
            response.write(`{ "errors": ${JSON.stringify(VALIDATION)} }`);
            return response.end();
        } 

        response.statusCode = 202;
        response.end();
    }
}